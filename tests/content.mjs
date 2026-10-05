import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = fs.readdirSync(path.join(root, 'content')).filter(f => f.endsWith('.json'));
assert(files.includes('course.json'), 'course.json is required');
const all = files.map(f => JSON.parse(fs.readFileSync(path.join(root, 'content', f), 'utf8')));
const course = all.find(d => Array.isArray(d.modules));
const near = (actual, expected, label) => assert(Math.abs(actual - expected) < .005, `${label}: ${actual} != ${expected}`);
const unique = (list, label) => assert.equal(new Set(list).size, list.length, `${label}: duplicate IDs`);
const finite = (value, label) => assert(Number.isFinite(value), `${label}: expected finite number`);
const skills = ['Account Types', 'Double Entry', 'Customer Cash Cycle', 'Bank Feed Decisions', 'Vendor Cycle', 'Reconciliation', 'Exception Handling'];
assert.deepEqual(course.skills, skills);
assert.equal(course.company.name, 'Cedar Grove Landscaping');
const accountNames = course.accounts.map(a => a.name);
unique(accountNames, 'accounts');
const types = new Map(course.accounts.map(a => [a.name, a.type]));
for (const a of course.accounts) assert(['Asset','Liability','Equity','Income','Expense'].includes(a.type));
const ids = new Set();
let exercises = 0;
const register = (id) => { assert.equal(typeof id, 'string'); assert(!ids.has(id), `duplicate activity ID: ${id}`); ids.add(id); };
function entry(rows, label) {
 assert(Array.isArray(rows));
 let debits = 0, credits = 0;
 for (const r of rows) {
  assert(accountNames.includes(r.account), `${label}: unknown account ${r.account}`);
  finite(r.debit, label); finite(r.credit, label);
  assert(r.debit >= 0 && r.credit >= 0 && !(r.debit && r.credit), `${label}: invalid sides`);
  debits += r.debit; credits += r.credit;
 }
 near(debits, credits, `${label} balanced entry`);
}
function validate(ex) {
 register(ex.id); exercises++;
 for (const key of ['title','prompt','explanation']) assert(typeof ex[key] === 'string' && ex[key].trim(), `${ex.id}: missing ${key}`);
 assert(skills.includes(ex.skill), `${ex.id}: invalid skill`);
 if (ex.type === 'choice') {
  unique(ex.options.map(o => o.id), ex.id);
  const options = new Set(ex.options.map(o => o.id));
  assert(ex.options.length >= 2);
  assert(Array.isArray(ex.correct) && ex.correct.length);
  unique(ex.correct, `${ex.id} correct`);
  for (const id of ex.correct) assert(options.has(id), `${ex.id}: invalid answer key ${id}`);
  if (!ex.multi) assert.equal(ex.correct.length, 1, `${ex.id}: single choice must have exactly one key`);
  for (const o of ex.options) {
   assert(typeof o.text === 'string' && typeof o.explanation === 'string' && o.explanation.trim());
   assert(!/Leave it unresolved and finish the month|Add a new income or expense entry/.test(o.text), `${ex.id}: generic filler distractor`);
  }
 } else if (ex.type === 'journal') {
  unique(ex.accounts, ex.id);
  assert(ex.expected.length >= 2);
  for (const r of ex.expected) assert(ex.accounts.includes(r.account));
  entry(ex.expected, ex.id);
 } else if (ex.type === 'sort') {
  unique(ex.categories, ex.id); unique(ex.items.map(i => i.id), ex.id);
  for (const i of ex.items) { assert(ex.categories.includes(i.correct)); assert(i.label && i.explanation); }
 } else if (ex.type === 'feed') {
  unique(ex.lines.map(l => l.id), ex.id); unique(ex.matches.map(m => m.id), ex.id);
  const matches = new Map(ex.matches.map(m => [m.id,m]));
  const invoices = new Map(ex.invoices.map(i => [i.id,i]));
  for (const l of ex.lines) {
   finite(l.amount, l.id); assert(l.date && l.context && l.explanation);
   assert(['Match','Add','Transfer','Exclude'].includes(l.action));
   if (l.action === 'Match') { assert(matches.has(l.matchId), `${l.id}: missing match`); near(matches.get(l.matchId).amount, l.amount, `${l.id} match amount`); }
   if (l.action === 'Add') assert(ex.categories.includes(l.category), `${l.id}: missing category`);
   if (l.requiresPayment) { assert.equal(l.action, 'Match'); assert(invoices.has(l.invoiceId)); assert(l.amount > 0); near(invoices.get(l.invoiceId).amount, l.amount, `${l.id} invoice payment`); }
  }
 } else if (ex.type === 'reconcile') {
  finite(ex.opening, ex.id); finite(ex.ending, ex.id);
  unique(ex.lines.map(l => l.id), ex.id);
  let clearedNet = 0;
  for (const l of ex.lines) { finite(l.amount,l.id); finite(l.correctAmount,l.id); assert.equal(typeof l.cleared,'boolean'); assert(l.evidence?.trim(), `${l.id}: learner needs statement evidence`); if(l.cleared) clearedNet += l.correctAmount; }
  near(ex.opening + clearedNet, ex.ending, `${ex.id} statement proof`);
 } else assert.fail(`Unsupported exercise type ${ex.type}`);
}
const balanceAccount = {Checking:'Checking', 'Accounts Receivable':'AR','Undeposited Funds':'UF','Service Income':'Income','Accounts Payable':'AP','Supplies Expense':'Expense'};
function flow(steps, label) {
 for (let i=0;i<steps.length;i++) {
  const step = steps[i]; assert(step.label && step.note);
  for (const key of ['Checking','AR','UF','Income','AP','Expense']) finite(step.balances[key], label);
  entry(step.entry, label);
  if (!i) continue;
  const expected = {...steps[i-1].balances};
  for (const r of step.entry) {
   const key = balanceAccount[r.account]; assert(key, `${label}: unmapped flow account`);
   expected[key] += ['Asset','Expense'].includes(types.get(r.account)) ? r.debit-r.credit : r.credit-r.debit;
  }
  for (const key of Object.keys(expected)) near(step.balances[key], expected[key], `${label} ${step.label} ${key}`);
 }
}
assert.equal(course.modules.length,8);
for (const [index,m] of course.modules.entries()) {
 register(m.id); assert.equal(m.id,`m${index+1}`); assert.equal(m.minutes,30);
 assert.equal(Object.values(m.timeBudget).reduce((a,b)=>a+b,0),30);
 assert(skills.includes(m.skill)); assert(m.hook && m.badge && m.title);
 assert(m.learn.length >= 2); for (const block of m.learn) { assert(block.title && block.text); assert(block.text.split(/\s+/).length <= 150, `${m.id}: long reading block`); }
 assert(m.practice.length >= 2); assert(m.check.length >=3);
 if(m.id!=='m7') assert(m.practice.length<=3);
 for(const ex of [...m.practice,...m.check]) validate(ex);
 register(m.mission.id); assert(m.mission.steps.length>=4); validate(m.mission.checkpoint);
 if(m.video.todo) assert(m.video.todo.startsWith('TODO: find clip for '));
 else {
  assert(/^[\w-]{11}$/.test(m.video.id),`${m.id}: invalid video ID`);
  assert(Number.isInteger(m.video.start)&&Number.isInteger(m.video.end)&&m.video.start>=0&&m.video.end>m.video.start&&m.video.end-m.video.start<=300,`${m.id}: clip must be at most five minutes`);
  assert(m.video.title&&m.video.watchFor&&/^https:\/\//.test(m.video.verifiedUrl)&&/^\d{4}-\d{2}-\d{2}$/.test(m.video.verified),`${m.id}: verified source and watch prompt required`);
  assert(m.check.some(q=>q.videoQuestion===true),`${m.id}: mark one scored question videoQuestion:true`);
 }
 if(m.diagram.type==='equation') {
  let A=0,L=0,E=0,I=0,X=0;
  for(const t of m.diagram.transactions) { for(const k of ['assets','liabilities','equity','income','expenses']) finite(t[k],`${m.id} equation`); near(t.assets,t.liabilities+t.equity+t.income-t.expenses,`${m.id} equation transaction`); A+=t.assets;L+=t.liabilities;E+=t.equity;I+=t.income;X+=t.expenses; near(A,L+E+I-X,`${m.id} cumulative equation`); }
 } else if(m.diagram.type==='flow') {flow(m.diagram.steps,m.id);if(m.diagram.wrongSteps) flow(m.diagram.wrongSteps,`${m.id} wrong path`);}
 else {assert.equal(m.diagram.type,'decision');assert(m.diagram.steps.length>=3);}
}
const customer = course.modules[2].diagram;
assert.deepEqual(customer.steps.at(-1).balances,{Checking:500,AR:0,UF:0,Income:500,AP:0,Expense:0});
assert.equal(customer.wrongSteps.at(-1).balances.Income,1000);
assert.equal(customer.wrongSteps.at(-1).balances.AR,500);
assert.equal(course.modules[3].practice[0].lines.length,12);
assert(course.modules[3].practice[0].lines.some(l=>l.requiresPayment));
assert.equal(course.modules[6].practice.length,10,'all ten exception cases required');
const cap=course.modules[7];
const feed=cap.practice.find(e=>e.type==='feed'),rec=cap.practice.find(e=>e.type==='reconcile');
assert.equal(feed.lines.length,30,'capstone needs thirty feed rows');
const actual=feed.lines.filter(l=>l.action!=='Exclude');
const net=actual.reduce((sum,l)=>sum+l.amount,0);
near(net,cap.capstone.bankNet,'capstone signed bank net');
near(cap.capstone.opening+net,cap.capstone.ending,'capstone opening/ending');
near(rec.opening,cap.capstone.opening,'reconcile opening');near(rec.ending,cap.capstone.ending,'reconcile ending');
assert.equal(rec.lines.filter(l=>l.cleared).length,actual.length);
for(const l of actual) {const r=rec.lines.find(r=>r.label===l.description);assert(r,`capstone statement missing ${l.id}`);assert(r.cleared);near(r.correctAmount,l.amount,`${l.id} statement cross-check`);}
assert.equal(rec.lines.filter(l=>!l.cleared).length,2,'two outstanding items');
assert(rec.lines.some(l=>l.amount!==l.correctAmount),'capstone must include repair evidence');
assert.equal(cap.capstone.exceptions.length,6);
unique(cap.capstone.exceptions.map(e=>e.id),'capstone exception IDs');
for(const e of cap.capstone.exceptions) {finite(e.amount,e.id);assert(e.amount>0&&e.effect);const ex=cap.practice.find(p=>p.id===e.exerciseId);assert(ex&&ex.correct.includes(e.optionId),`${e.id}: mapped diagnosis key missing`);}
assert(cap.capstone.invoices.length>=4 && cap.capstone.bills.length>=3);
for(const invoice of [...cap.capstone.invoices,...feed.invoices]) assert(invoice.status?.trim(), `${invoice.id}: invoice evidence needs status`);
assert(cap.practice.find(e=>e.id==='m8-exceptions').explanation.includes('$36'), 'capstone explanation must cover all six effects');
assert(course.sources.length>=3);for(const source of course.sources) assert(/^https:\/\/(quickbooks|qbo)\.intuit\.com\//.test(source.url)&&source.verified);
console.log(`Content verified: ${course.modules.length} modules, ${exercises} exercises, balanced journals/flows/equation, 30 capstone imports, bank net $${net}, ending $${rec.ending}.`);
