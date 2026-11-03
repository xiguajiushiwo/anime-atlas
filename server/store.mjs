import {historyCharacter} from './character-display.mjs';

export class D1Store {
  constructor(db){this.db=db}
  async getUser(id){return this.db.prepare('SELECT * FROM users WHERE id=?').bind(id).first()}
  async findSession(h){return this.db.prepare('SELECT s.* FROM sessions s JOIN activation_codes c ON c.code_hash=s.access_code_hash WHERE s.token_hash=? AND s.expires_at>? AND c.disabled=0').bind(h,Date.now()).first()}
  async getAccessCode(h){return this.db.prepare('SELECT code_hash,disabled FROM activation_codes WHERE code_hash=? AND disabled=0').bind(h).first()}
  async openAccess(codeHash,u,s){
    // A code is reusable. Each browser receives an independent private session.
    const results=await this.db.batch([
      this.db.prepare('INSERT OR IGNORE INTO users(id,username,salt,password_hash,created_at,unlocked_at) SELECT ?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM activation_codes WHERE code_hash=? AND disabled=0)').bind(u.id,u.username,u.salt,u.password_hash,u.created_at,u.unlocked_at,codeHash),
      this.db.prepare('INSERT INTO sessions(token_hash,user_id,expires_at,access_code_hash) SELECT ?,?,?,? WHERE EXISTS(SELECT 1 FROM users WHERE id=?) AND EXISTS(SELECT 1 FROM activation_codes WHERE code_hash=? AND disabled=0)').bind(s.token_hash,u.id,s.expires_at,codeHash,u.id,codeHash),
    ]);
    return results[1].meta.changes===1;
  }
  async getFulfillment(orderKey){return this.db.prepare('SELECT o.*,c.disabled FROM fulfillment_orders o JOIN activation_codes c ON c.code_hash=o.code_hash WHERE order_key=?').bind(orderKey).first()}
  async issueOrder({orderKey,codeHash,cipher,createdAt}){
    // The transaction prevents duplicate callbacks from leaving unused extra codes.
    const results=await this.db.batch([
      this.db.prepare('INSERT INTO activation_codes(code_hash,batch) SELECT ?,? WHERE NOT EXISTS(SELECT 1 FROM fulfillment_orders WHERE order_key=?) ON CONFLICT(code_hash) DO NOTHING').bind(codeHash,'order:'+orderKey,orderKey),
      this.db.prepare('INSERT INTO fulfillment_orders(order_key,code_hash,code_cipher,created_at) SELECT ?,?,?,? WHERE NOT EXISTS(SELECT 1 FROM fulfillment_orders WHERE order_key=?) AND EXISTS(SELECT 1 FROM activation_codes WHERE code_hash=? AND batch=?)').bind(orderKey,codeHash,cipher,createdAt,orderKey,codeHash,'order:'+orderKey),
    ]);
    return results[1].meta.changes===1;
  }
  async renewSession(h,t){await this.db.prepare('UPDATE sessions SET expires_at=? WHERE token_hash=?').bind(t,h).run()}
  async deleteSession(h){await this.db.prepare('DELETE FROM sessions WHERE token_hash=?').bind(h).run()}
  async rate(key,limit,windowMs){const now=Date.now();const row=await this.db.prepare('INSERT INTO rate_limits(key,count,expires_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN rate_limits.expires_at<=? THEN 1 ELSE rate_limits.count+1 END, expires_at=CASE WHEN rate_limits.expires_at<=? THEN excluded.expires_at ELSE rate_limits.expires_at END RETURNING count').bind(key,now+windowMs,now,now).first();return row.count<=limit}
  async createRun(r){await this.db.prepare('INSERT INTO runs(id,user_id,mode,preferences,selection,created_at) VALUES(?,?,?,?,?,?)').bind(r.id,r.user_id,r.mode,JSON.stringify(r.preferences),JSON.stringify(r.selection),r.created_at).run()}
  decodeRun(r){return r?{...r,preferences:JSON.parse(r.preferences),selection:JSON.parse(r.selection),report:r.report?JSON.parse(r.report):null}:null}
  async getRun(id,userId){return this.decodeRun(await this.db.prepare('SELECT * FROM runs WHERE id=? AND user_id=?').bind(id,userId).first())}
  async recentRuns(id,limit=3){const r=await this.db.prepare('SELECT * FROM runs WHERE user_id=? ORDER BY created_at DESC LIMIT ?').bind(id,limit).all();return r.results.map(x=>this.decodeRun(x))}
  async finishRun(id,userId,report){await this.db.prepare('UPDATE runs SET report=? WHERE id=? AND user_id=? AND report IS NULL').bind(JSON.stringify(report),id,userId).run();return(await this.getRun(id,userId))?.report}
  async history(id){const r=await this.db.prepare('SELECT id,created_at,report FROM runs WHERE user_id=? AND report IS NOT NULL ORDER BY created_at DESC LIMIT 20').bind(id).all();return r.results.map(x=>{const p=JSON.parse(x.report);return{id:x.id,createdAt:x.created_at,character:historyCharacter(p.character),questionCount:p.questionCount}})}
}
