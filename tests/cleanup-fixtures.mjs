// Removes only fixtures created by smoke/attachment-regression, with a local backup.
import {execFileSync} from 'node:child_process';
import {writeFileSync} from 'node:fs';
const query=`const {db}=require('./dist/db');(async()=>{const courses=await db.course.findMany({where:{teacherId:'teacher',OR:[{title:'Smoke course',description:'integration test'},{title:'Free test',description:'free'},{title:'Expensive test',description:'insufficient balance'}]}});const classes=await db.schoolClass.findMany({where:{OR:[{title:'Smoke class',description:'integration'},{title:{in:['Review attachment A','Review attachment B']},description:'review-fixture'}]}});console.log(JSON.stringify({courses,classes}));})().finally(()=>db.$disconnect());`;
const run=script=>execFileSync('docker',['compose','exec','-T','api','node','-e',script],{encoding:'utf8'});
const snapshot=JSON.parse(run(query));
console.log(JSON.stringify(snapshot,null,2));
if(process.argv.includes('--apply')){
 writeFileSync(new URL('./fixture-backup.json',import.meta.url),JSON.stringify(snapshot,null,2));
 const ids=JSON.stringify(snapshot.courses.map(c=>c.id)),classes=JSON.stringify(snapshot.classes.map(c=>c.id));
 run(`const {db}=require('./dist/db');(async()=>{await db.$transaction(async tx=>{const ids=${ids},classes=${classes};const a=await tx.activity.findMany({where:{classId:{in:classes}},select:{id:true}});await tx.submission.deleteMany({where:{activityId:{in:a.map(x=>x.id)}}});await tx.activity.deleteMany({where:{classId:{in:classes}}});await tx.member.deleteMany({where:{classId:{in:classes}}});await tx.schoolClass.deleteMany({where:{id:{in:classes}}});await tx.enrollment.deleteMany({where:{courseId:{in:ids}}});await tx.storedFile.updateMany({where:{courseId:{in:ids}},data:{courseId:null}});await tx.transaction.updateMany({where:{courseId:{in:ids}},data:{courseId:null}});await tx.course.deleteMany({where:{id:{in:ids}}});});})().finally(()=>db.$disconnect());`);
 console.log('Removed test-only courses/classes; retained wallet history and uploaded objects. Backup: tests/fixture-backup.json');
}
