import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const base='http://localhost:3000/api';
async function snapshot(){const {token}=await (await fetch(base+'/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:'student',password:'Demo123!'})})).json();const headers={Authorization:`Bearer ${token}`};const user=await (await fetch(base+'/me',{headers})).json();const file=await fetch(base+'/files/demo-guide',{headers});assert.equal(file.status,200);return {balance:user.balance,guide:await file.text()};}
const before=await snapshot();
execFileSync('docker',['compose','restart'],{stdio:'pipe'});
let healthy=false;for(let i=0;i<60;i++){try{healthy=(await fetch(base+'/health')).ok;if(healthy)break;}catch{}await new Promise(r=>setTimeout(r,1000));}
assert.ok(healthy,'stack must recover after restart');assert.deepEqual(await snapshot(),before);console.log('PASS: balance and MinIO file survive stack restart');
