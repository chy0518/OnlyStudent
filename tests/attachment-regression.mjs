import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const fixture='review-teacher-'+Date.now();
const setup=`const {db}=require('./dist/db');(async()=>{const t=await db.user.findUniqueOrThrow({where:{id:'teacher'}});await db.user.create({data:{id:'${fixture}',username:'${fixture}',name:'Review teacher',role:'TEACHER',password:t.password}});})().finally(()=>db.$disconnect());`;
execFileSync('docker',['compose','exec','-T','api','node','-e',setup]);
const base='http://localhost:3000/api';
async function call(path,token,body){const r=await fetch(base+path,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token||''}`},body:body?JSON.stringify(body):undefined});return {status:r.status,data:await r.json()};}
const login=async username=>(await call('/auth/login',null,{username,password:'Demo123!'})).data.token;
const t=await login('teacher'),other=await login(fixture),s=await login('student');
const c1=(await call('/classes',t,{title:'Review attachment A',description:'review-fixture'})).data;
const c2=(await call('/classes',other,{title:'Review attachment B',description:'review-fixture'})).data;
for(const c of [c1,c2])await call('/classes/join',s,{code:c.code});
const form=new FormData();form.append('file',new Blob(['Shared homework']),'shared.txt');
const file=await (await fetch(base+'/files',{method:'POST',headers:{Authorization:`Bearer ${s}`},body:form})).json();
for(const [c,token] of [[c1,t],[c2,other]]){const a=(await call(`/classes/${c.id}/activities`,token,{title:'Shared attachment',kind:'ASSIGNMENT',content:'review-fixture'})).data;await call(`/activities/${a.id}/submit`,s,{content:'answer',fileId:file.id});}
for(const token of [t,other]){const r=await fetch(base+'/files/'+file.id,{headers:{Authorization:`Bearer ${token}`}});assert.equal(r.status,200);assert.equal(await r.text(),'Shared homework');}
console.log('PASS: both class teachers can download a reused homework attachment');
