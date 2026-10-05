const cents=n=>Math.round(Number(n||0)*100);
const same=(a,b)=>JSON.stringify([...new Set(a)].sort())===JSON.stringify([...new Set(b)].sort());
export function feedGrade(q,answer){
 let earned=0,dollarEffect=0;
 const details=q.lines.map(l=>{
  const a=answer[l.id]||{};
  const correct=a.action===l.action && (l.action!=='Match'||a.matchId===l.matchId) && (l.action!=='Add'||!l.category||a.category===l.category) && (!l.requiresPayment||a.received===true);
  if(correct)earned++;else dollarEffect+=Math.abs(l.amount);
  return {id:l.id,correct,explanation:l.explanation};
 });
 return {correct:earned===q.lines.length,score:Math.round(earned/q.lines.length*100),details,dollarEffect};
}
export function reconcileGrade(q,answer){
 let cleared=cents(q.opening),valid=true;
 const details=q.lines.map(l=>{
  const a=answer[l.id]||{};
  const amount=Number(a.amount??l.amount);
  if(a.checked)cleared+=cents(amount);
  const correct=Boolean(a.checked)===l.cleared && (!l.cleared||cents(amount)===cents(l.correctAmount));
  valid=valid&&correct;
  return {id:l.id,correct,explanation:l.explanation||`${l.label}: ${l.cleared?'cleared':'outstanding'}; correct amount ${l.correctAmount}.`};
 });
 const difference=(cents(q.ending)-cleared)/100;
 return {correct:valid&&difference===0,score:Math.round(details.filter(d=>d.correct).length/details.length*100),difference,details};
}
export function grade(q,answer){
 if(q.type==='feed')return feedGrade(q,answer);
 if(q.type==='reconcile')return reconcileGrade(q,answer);
 let correct=false,details=[];
 if(q.type==='choice')correct=same(answer,q.correct);
 if(q.type==='sort'){
  details=q.items.map(i=>({id:i.id,correct:answer[i.id]===i.correct,explanation:i.explanation}));
  correct=details.every(d=>d.correct);
 }
 if(q.type==='journal'){
  const normalize=rows=>{
   const totals={};
   for(const r of rows){if(!r.account)continue;const v=totals[r.account]||{debit:0,credit:0};v.debit+=cents(r.debit);v.credit+=cents(r.credit);totals[r.account]=v;}
   return Object.entries(totals).filter(([,v])=>v.debit||v.credit).sort(([a],[b])=>a.localeCompare(b));
  };
  const balanced=answer.every(r=>Number.isFinite(Number(r.debit||0))&&Number.isFinite(Number(r.credit||0))&&Number(r.debit||0)>=0&&Number(r.credit||0)>=0&&!(Number(r.debit)>0&&Number(r.credit)>0))&&answer.reduce((s,r)=>s+cents(r.debit)-cents(r.credit),0)===0;
  correct=balanced&&JSON.stringify(normalize(answer))===JSON.stringify(normalize(q.expected));
 }
 return {correct,score:details.length?Math.round(details.filter(d=>d.correct).length/details.length*100):correct?100:0,details};
}
export function record(state,q,module,result,answer,timeSpent=0){
 const previous=state.attempts.filter(a=>a.exerciseId===q.id);
 if(result.correct&&!previous.some(a=>a.correct))state.xp+=10;
 // A re-submission of an already-mastered item cannot extend a streak.
 if(!result.correct)state.streak=0;
 else if(!previous.some(a=>a.correct))state.streak++;
 const event={timestamp:new Date().toISOString(),module,exerciseId:q.id,skill:q.skill,correct:result.correct,score:result.score,timeSpent,answer,dollarEffect:result.dollarEffect||0};
 state.attempts.push(event);return event;
}
export function profile(state,skills){
 return skills.map(skill=>{
  const first=new Map(),latest=new Map();
  for(const a of state.attempts.filter(a=>a.skill===skill)){if(!first.has(a.exerciseId))first.set(a.exerciseId,a);latest.set(a.exerciseId,a);}
  const avg=m=>m.size?Math.round([...m.values()].reduce((s,a)=>s+a.score,0)/m.size):0;
  const accuracy=avg(first),mastery=avg(latest);
  return {skill,accuracy,mastery,count:first.size,rating:!first.size||mastery<60?'Not Yet':mastery<85?'Developing':'Proficient'};
 });
}
export function capstoneMetrics(m,state){
 const latest=id=>state.attempts.findLast(a=>a.exerciseId===id);
 const all=[...m.practice,...m.check,...(m.mission?[m.mission.checkpoint]:[])];
 const exceptions=m.capstone?.exceptions||[];
 const repairs=exceptions.map(e=>{const a=latest(e.exerciseId||e.id);return {...e,caught:Boolean(a&&(Array.isArray(a.answer)?a.answer.includes(e.optionId):a.correct))};});
 const exceptionExercises=new Set(exceptions.map(e=>e.exerciseId));
 const weight=q=>q.type==='feed'||q.type==='reconcile'?q.lines.length:exceptionExercises.has(q.id)?exceptions.filter(e=>e.exerciseId===q.id).length:1;
 const total=all.reduce((s,q)=>s+weight(q),0);
 const earned=all.reduce((s,q)=>{if(exceptionExercises.has(q.id)){const a=latest(q.id),caught=repairs.filter(e=>e.exerciseId===q.id&&e.caught).length,unsafe=Array.isArray(a?.answer)?a.answer.filter(id=>!q.correct.includes(id)).length:0;return s+Math.max(0,caught-unsafe);}return s+weight(q)*(latest(q.id)?.score||0)/100;},0);
 return {score:total?Math.round(earned/total*100):0,attempted:all.filter(q=>latest(q.id)).length,total:all.length,exposure:all.reduce((s,q)=>s+(latest(q.id)?.dollarEffect||0),0),exceptionExposure:repairs.filter(e=>!e.caught).reduce((s,e)=>s+Number(e.impact||0),0),exceptionsCaught:repairs.filter(e=>e.caught).length,exceptionsTotal:repairs.length,unsafeRepairs:all.filter(q=>exceptionExercises.has(q.id)).reduce((s,q)=>s+(Array.isArray(latest(q.id)?.answer)?latest(q.id).answer.filter(id=>!q.correct.includes(id)).length:0),0),repairs,complete:state.completed.includes(m.id)};
}
