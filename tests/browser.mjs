// Optional integration harness: npm install --no-save playwright, then
// npx playwright install chromium; serve on :8000; node tests/browser.mjs.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
const context=await browser.newContext({viewport:{width:1440,height:1050}});
const page=await context.newPage();const errors=[];
page.on('pageerror',e=>errors.push(e.message));
const base=process.env.COURSE_URL||'http://127.0.0.1:8000/';
const course=JSON.parse(fs.readFileSync(new URL('../content/course.json',import.meta.url)));
async function route(hash){await page.goto(`${base}#${hash}`);await page.locator('#main h1').waitFor();}
async function solve(q){
 const box=page.locator(`article#${q.id}`);
 await box.evaluate((el,q)=>{
  const set=(input,value)=>{input.value=String(value);input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));};
  if(q.type==='choice'){for(const input of el.querySelectorAll('.work input')){input.checked=q.correct.includes(input.value);input.dispatchEvent(new Event('change',{bubbles:true}));}}
  if(q.type==='sort'){for(const item of q.items)set(el.querySelector(`[data-item="${item.id}"] select`),item.correct);}
  if(q.type==='journal'){const rows=el.querySelectorAll('tbody tr');q.expected.forEach((r,i)=>{set(rows[i].querySelector('select'),r.account);set(rows[i].querySelectorAll('input')[0],r.debit);set(rows[i].querySelectorAll('input')[1],r.credit);});}
  if(q.type==='feed'){for(const l of q.lines){const row=el.querySelector(`[data-line="${l.id}"]`);set(row.querySelector('.feed-action'),l.action);if(l.requiresPayment){set(row.querySelector('.payment-invoice'),l.invoiceId);set(row.querySelector('.deposit-to'),'Undeposited Funds');row.querySelector('.receive').click();if(!row.querySelector('.receive').disabled||!row.querySelector('.deposit-to').disabled)throw Error('Payment not locked');row.querySelector('.make-deposit').click();}if(l.action==='Match')set(row.querySelector('.feed-match'),l.matchId);if(l.action==='Add')set(row.querySelector('.feed-category'),l.category);}}
  if(q.type==='reconcile'){for(const l of q.lines){const row=el.querySelector(`[data-line="${l.id}"]`);row.querySelector('[type=checkbox]').checked=l.cleared;set(row.querySelector('[type=number]'),l.correctAmount);}}
 },q);
 await box.locator('.submit').click();
 assert.equal(await box.locator('.feedback.correct').count(),1,`Correct answer failed: ${q.id}`);
}
try{
 await route('home');assert.equal(await page.locator('.module-card').count(),8);
 await page.locator('#learner-name').fill('Test Learner');
 await page.screenshot({path:'/tmp/books-lab-desktop.png',fullPage:true});
 // Deliberately miss one item, then recover through the review UI.
 await route('m1');const first=course.modules[0].check[0];const wrong=first.options.find(o=>!first.correct.includes(o.id));
 await page.locator(`#${first.id} input[value="${wrong.id}"]`).check();await page.locator(`#${first.id} .submit`).click();
 assert.equal(await page.locator(`#${first.id} .feedback.incorrect`).count(),1);
 await route('review');await solve(first);await page.locator('.review-next').click();
 for(const m of course.modules){
  await route(m.id);
  if(m.diagram.type==='flow'){
   while(await page.locator('.flow-toolbar .next').isEnabled())await page.locator('.flow-toolbar .next').click();
   if(m.diagram.wrongSteps?.length){await page.locator('.flow-toolbar .path').click();while(await page.locator('.flow-toolbar .next').isEnabled())await page.locator('.flow-toolbar .next').click();}
  }
  if(m.diagram.type==='equation'){while(await page.locator('.diagram .primary').isEnabled())await page.locator('.diagram .primary').click();assert.match(await page.locator('.equation-values').innerText(),/5,380/);}
  for(const q of [...m.practice,...m.check])await solve(q);
  for(const input of await page.locator('.checklist input').all())await input.check();
  await solve(m.mission.checkpoint);
  await page.locator('.completion-panel .complete').click();
  assert.match(await page.locator('.completion-panel').innerText(),/Module completed/);
  console.log(`Completed ${m.id}: ${m.title}`);
 }
 await route('report');assert.match(await page.locator('main').innerText(),/8 of 8 modules complete/);assert.match(await page.locator('main').innerText(),/6 \/ 6/);assert.match(await page.locator('main').innerText(),/Recovered/);
 await page.screenshot({path:'/tmp/books-lab-report.png',fullPage:true});
 const downloadPromise=page.waitForEvent('download');await page.locator('#export').click();const download=await downloadPromise;assert.equal(download.suggestedFilename(),'books-lab-report.json');
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('books-lab-v1')));assert.equal(saved.completed.length,8);assert.equal(new Set(saved.attempts.filter(a=>a.correct).map(a=>a.exerciseId)).size,course.modules.reduce((n,m)=>n+m.practice.length+m.check.length+1,0));
 await page.reload();await page.locator('#main h1').waitFor();assert.match(await page.locator('main').innerText(),/8 of 8 modules complete/);
 await page.setViewportSize({width:390,height:844});await route('m8');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true,'Mobile overflow');
 await page.screenshot({path:'/tmp/books-lab-mobile.png',fullPage:false});
 // Block storage completely: the course must still grade and report in memory.
 const blocked=await browser.newContext();await blocked.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw Error('storage blocked');}});});
 const p=await blocked.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto(base);await p.locator('.module-card').first().waitFor();assert.equal(await p.locator('#storage-warning').isVisible(),true);
 await p.goto(`${base}#m1`);await p.locator(`#${first.id}`).waitFor();await p.locator(`#${first.id} input[value="${first.correct[0]}"]`).check();await p.locator(`#${first.id} .submit`).click();assert.equal(await p.locator(`#${first.id} .feedback.correct`).count(),1);
 assert.deepEqual(errors,[],'Browser errors');console.log('Browser verification passed: all 8 modules, review, reload, JSON report, mobile, blocked storage, and no uncaught errors.');
}finally{await browser.close();}
