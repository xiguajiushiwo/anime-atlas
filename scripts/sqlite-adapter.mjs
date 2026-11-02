import {DatabaseSync} from 'node:sqlite';
export class SqliteAdapter {
 constructor(path=':memory:'){this.db=new DatabaseSync(path);this.db.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;')}
 prepare(sql){const db=this.db;let args=[];const wrapper={bind(...values){args=values;return wrapper},runSync(){const r=db.prepare(sql).run(...args);return{success:true,meta:{changes:Number(r.changes)}}},async run(){return wrapper.runSync()},async first(){return db.prepare(sql).get(...args)||null},async all(){return{results:db.prepare(sql).all(...args)}}};return wrapper}
 async batch(statements){this.db.exec('BEGIN IMMEDIATE');try{const results=statements.map(s=>s.runSync());this.db.exec('COMMIT');return results}catch(e){this.db.exec('ROLLBACK');throw e}}
 close(){this.db.close()}
}
