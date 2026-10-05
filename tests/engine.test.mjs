import test from 'node:test';
import assert from 'node:assert/strict';
import {grade,record,profile,feedGrade,reconcileGrade,capstoneMetrics} from '../js/engine.js';
import {createStore} from '../js/store.js';

test('multi-select requires exactly the correct set',()=>{
 const q={type:'choice',correct:['a','b']};
 assert.equal(grade(q,['a','b']).correct,true);
 assert.equal(grade(q,['a']).correct,false);
 assert.equal(grade(q,['a','b','c']).correct,false);
});
test('balanced entry with wrong accounts fails',()=>{
 const q={type:'journal',expected:[{account:'AR',debit:500,credit:0},{account:'Income',debit:0,credit:500}]};
 assert.equal(grade(q,[{account:'Checking',debit:500,credit:0},{account:'Income',debit:0,credit:500}]).correct,false);
 assert.equal(grade(q,q.expected).correct,true);
 assert.equal(grade(q,[{account:'AR',debit:500,credit:0},{account:'Income',debit:0,credit:400}]).correct,false);
});
test('retries record first-attempt accuracy without farming XP',()=>{
 const s={attempts:[],completed:[],xp:0,streak:0};
 const q={id:'q1',skill:'Account Types'};
 record(s,q,'m1',{correct:false,score:0});
 record(s,q,'m1',{correct:true,score:100});
 record(s,q,'m1',{correct:true,score:100});
 assert.equal(s.xp,10);
 assert.equal(profile(s,['Account Types'])[0].accuracy,0);
 assert.equal(profile(s,['Account Types'])[0].mastery,100);
 record(s,q,'m1',{correct:false,score:0});
 assert.equal(s.streak,0,'a wrong answer resets the streak even on mastered work');
});
test('bank feed requires verified payment before matching missing CRM receipt',()=>{
 const line={id:'a',action:'Match',matchId:'p1',requiresPayment:true,amount:500};
 assert.equal(feedGrade({lines:[line]},{a:{action:'Match',matchId:'p1'}}).correct,false);
 assert.equal(feedGrade({lines:[line]},{a:{action:'Match',matchId:'p1',received:true}}).correct,true);
 assert.equal(feedGrade({lines:[line]},{a:{action:'Add'}}).dollarEffect,500);
});
test('reconciliation requires the correct cleared items and correction',()=>{
 const q={opening:1000,ending:1400,lines:[{id:'a',amount:500,correctAmount:500,cleared:true},{id:'b',amount:-10,correctAmount:-100,cleared:true},{id:'c',amount:-50,correctAmount:-50,cleared:false}]};
 assert.equal(reconcileGrade(q,{a:{checked:true,amount:500},b:{checked:true,amount:-100}}).correct,true);
 assert.equal(reconcileGrade(q,{a:{checked:true,amount:500},b:{checked:true,amount:-10}}).difference, -90);
});
test('storage unavailable and corrupt storage both fall back safely',()=>{
 const s=createStore({getItem(){throw Error('blocked')},setItem(){throw Error('blocked')}});
 s.save({xp:12}); assert.equal(s.read().xp,12);
 const corrupt=createStore({getItem(){return '{'},setItem(){}});
 assert.deepEqual(corrupt.read().attempts,[]);
});
test('valid JSON with malformed progress falls back instead of crashing the UI',()=>{
 for(const value of [{attempts:[null],completed:[]},{attempts:[],completed:[],checks:null,queue:null},{attempts:[],completed:[],xp:'bad'}]){
  const s=createStore({getItem(){return JSON.stringify(value)},setItem(){}});
  assert.deepEqual(s.read().attempts,[]);assert.deepEqual(s.read().checks,{});assert.equal(s.available,false);
 }
});
test('capstone reports each caught exception and distinct account exposure',()=>{
 const m={id:'m8',practice:[{id:'ex',type:'choice',correct:['a','b'],multi:true}],check:[],capstone:{exceptions:[{id:'e1',exerciseId:'ex',optionId:'a',impact:500},{id:'e2',exerciseId:'ex',optionId:'b',impact:36}]}};
 const s={attempts:[{exerciseId:'ex',score:0,answer:['a'],correct:false}],completed:[]};
 const p=capstoneMetrics(m,s);
 assert.equal(p.exceptionsCaught,1);assert.equal(p.exceptionsTotal,2);assert.equal(p.exceptionExposure,36);assert.equal(p.score,50);
 s.attempts.push({exerciseId:'ex',score:100,answer:['a','b'],correct:true});
 assert.equal(capstoneMetrics(m,s).exceptionExposure,0);
 s.attempts.push({exerciseId:'ex',score:0,answer:['a','b','shortcut'],correct:false});
 assert.equal(capstoneMetrics(m,s).score,50,'unsafe extra repair loses a point');
 s.attempts.push({exerciseId:'ex',score:0,answer:{},correct:false});
 assert.equal(capstoneMetrics(m,s).unsafeRepairs,0,'malformed answers cannot crash report');
});
