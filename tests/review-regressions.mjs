import assert from 'node:assert/strict';
const base='http://localhost:3000/api';
const login=async username=>(await (await fetch(base+'/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username,password:'Demo123!'})})).json()).token;
const token=await login('student');
const response=await fetch(base+'/feed',{headers:{Authorization:`Bearer ${token}`}});
assert.equal(response.status,200,'homepage feed must exist');
assert.ok((await response.json()).some(item=>item.path==='/classes/demo-class'),'class announcements belong in student feed');
console.log('PASS: homepage includes joined class announcements');
