import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';

const root=fileURLToPath(new URL('../',import.meta.url));
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
if(git('status','--porcelain'))throw new Error('请先提交工作区修改；源码包只导出当前 Git 提交。');
const revision=git('rev-parse','--short','HEAD');
const folder=path.join(root,'work','exports');
fs.mkdirSync(folder,{recursive:true});
const target=path.join(folder,`anime-atlas-${revision}.zip`);
git('archive','--format=zip','--prefix=anime-atlas/',`--output=${target}`,'HEAD');
console.log(`已导出提交 ${revision}：${target}`);
