import {grade} from './engine.js';
export const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(Number(n||0));
export function node(html){const t=document.createElement('template');t.innerHTML=html;return t.content.firstElementChild;}
const options=(values,selected='')=>`<option value="">Choose…</option>${values.map(v=>{const id=typeof v==='string'?v:v.id;return `<option value="${esc(id)}" ${id===selected?'selected':''}>${esc(typeof v==='string'?v:v.label||v.text)}</option>`;}).join('')}`;
function shuffled(values){const out=[...values];for(let i=out.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}

export function exercise(q,onAttempt,previous){
 const box=node(`<article class="exercise" id="${esc(q.id)}"><div class="eyebrow">${esc(q.type==='choice'?'Knowledge check':q.type==='feed'?'Bank feed workbench':q.type==='reconcile'?'Reconciliation workbench':'Practice lab')}</div><h3>${esc(q.title)}</h3><p>${esc(q.prompt)}</p><div class="work"></div><div class="actions"><button class="primary submit" type="button">Check my work</button><span class="prior">${previous?.correct?'Previously mastered ✓':''}</span></div><div class="feedback" role="status" aria-live="polite"></div></article>`);
 const work=box.querySelector('.work'),feedback=box.querySelector('.feedback');
 const started=Date.now();let getAnswer;
 if(q.type==='choice'){
  work.innerHTML=`<fieldset><legend>${q.multi?'Select all that apply':'Select one answer'}</legend>${shuffled(q.options).map(o=>`<label class="option"><input type="${q.multi?'checkbox':'radio'}" name="${esc(q.id)}" value="${esc(o.id)}"> <span>${esc(o.text)}</span></label>`).join('')}</fieldset>`;
  getAnswer=()=>[...work.querySelectorAll('input:checked')].map(i=>i.value);
 }
 if(q.type==='sort'){
  work.innerHTML=`<p class="hint">Drag a card to a category, or use its menu. Both ways do the same thing.</p><div class="sort-targets">${q.categories.map(c=>`<div class="drop-target" data-category="${esc(c)}" tabindex="0">${esc(c)}</div>`).join('')}</div><div class="sort-items">${q.items.map(i=>`<label class="sort-item" draggable="true" data-item="${esc(i.id)}"><span>${esc(i.label)}</span><select aria-label="Category for ${esc(i.label)}">${options(q.categories)}</select></label>`).join('')}</div>`;
  let dragged;
  work.querySelectorAll('.sort-item').forEach(card=>card.addEventListener('dragstart',e=>{dragged=card;e.dataTransfer.setData('text/plain',card.dataset.item);}));
  work.querySelectorAll('.drop-target').forEach(target=>{
   target.addEventListener('dragover',e=>e.preventDefault());
   target.addEventListener('drop',e=>{e.preventDefault();if(dragged){dragged.querySelector('select').value=target.dataset.category;dragged.classList.add('assigned');dragged=null;}});
  });
  getAnswer=()=>Object.fromEntries([...work.querySelectorAll('.sort-item')].map(c=>[c.dataset.item,c.querySelector('select').value]));
 }
 if(q.type==='journal'){
  work.innerHTML=`<p class="hint">Debits are the left side; credits are the right. Choose accounts as well as amounts. A balanced entry can still be wrong.</p><div class="table-wrap"><table><thead><tr><th>Account</th><th>Debit</th><th>Credit</th></tr></thead><tbody>${Array.from({length:Math.max(q.expected.length,3)},(_,i)=>`<tr><td><select aria-label="Account row ${i+1}">${options(q.accounts)}</select></td><td><input type="number" step="0.01" min="0" value="0" aria-label="Debit row ${i+1}"></td><td><input type="number" step="0.01" min="0" value="0" aria-label="Credit row ${i+1}"></td></tr>`).join('')}</tbody></table></div><p class="journal-total" aria-live="polite"></p><div class="t-accounts"></div>`;
  getAnswer=()=>[...work.querySelectorAll('tbody tr')].map(r=>({account:r.querySelector('select').value,debit:Number(r.querySelectorAll('input')[0].value),credit:Number(r.querySelectorAll('input')[1].value)}));
  const update=()=>{
   const rows=getAnswer(),debit=rows.reduce((s,r)=>s+r.debit,0),credit=rows.reduce((s,r)=>s+r.credit,0);
   work.querySelector('.journal-total').textContent=`Debits ${money(debit)} · Credits ${money(credit)} · Difference ${money(debit-credit)}`;
   work.querySelector('.t-accounts').innerHTML=[...new Set(rows.map(r=>r.account).filter(Boolean))].map(a=>`<div class="t-account"><strong>${esc(a)}</strong><div><span>Debit<br>${money(rows.filter(r=>r.account===a).reduce((s,r)=>s+r.debit,0))}</span><span>Credit<br>${money(rows.filter(r=>r.account===a).reduce((s,r)=>s+r.credit,0))}</span></div></div>`).join('');
  };work.addEventListener('input',update);work.addEventListener('change',update);update();
 }
 if(q.type==='feed'){
  work.innerHTML=`<p class="hint">Match links to an existing record. Add creates a new one. Inspect the evidence before choosing.</p>${q.invoices?.length?`<details class="evidence"><summary>Open invoices — customer ledger</summary>${q.invoices.map(i=>`<p><strong>${esc(i.id)}</strong> · ${esc(i.customer)} · ${money(i.amount)}</p>`).join('')}</details>`:''}<div class="feed-lines">${q.lines.map(l=>`<section class="feed-line" data-line="${esc(l.id)}"><div class="feed-heading"><span>${esc(l.date||'October')} · ${esc(l.description)}</span><strong class="${l.amount<0?'outflow':''}">${money(l.amount)}</strong></div><p>${esc(l.context)}</p><div class="feed-controls"><label>Bank action<select class="feed-action">${options(['Match','Add','Transfer','Exclude'])}</select></label><label class="match-control" hidden>Find match<select class="feed-match">${options((q.matches||[]).map(m=>({...m,label:`${m.label} · ${money(m.amount)}`})))}</select></label><label class="category-control" hidden>Category<select class="feed-category">${options(q.categories||[])}</select></label></div>${l.requiresPayment?`<details class="payment-workflow"><summary>Investigate missing CRM payment</summary><p>Compare the ACH payer, amount, invoice and remittance. Receive Payment clears the verified invoice; it does not record income again.</p><label>Apply payment to invoice<select class="payment-invoice">${options((q.invoices||[]).map(i=>({id:i.id,label:`${i.id} · ${i.customer} · ${money(i.amount)}`})))}</select></label><label>Deposit to<select class="deposit-to">${options(['Checking','Undeposited Funds'])}</select></label><button type="button" class="receive">Record Receive Payment</button><p class="payment-status" role="status"></p></details>`:''}<div class="line-result"></div></section>`).join('')}</div>`;
  work.querySelectorAll('.feed-line').forEach(row=>{
   row.querySelector('.feed-action').addEventListener('change',e=>{row.querySelector('.match-control').hidden=e.target.value!=='Match';row.querySelector('.category-control').hidden=e.target.value!=='Add';});
   const receive=row.querySelector('.receive');
   if(receive)receive.addEventListener('click',()=>{
    const l=q.lines.find(l=>l.id===row.dataset.line),invoice=row.querySelector('.payment-invoice').value,deposit=row.querySelector('.deposit-to').value;
    const status=row.querySelector('.payment-status');
    if(invoice!==l.invoiceId||!deposit){status.textContent='Verify the customer and amount against the open invoice, then choose the deposit account.';return;}
    receive.disabled=true;row.querySelector('.payment-invoice').disabled=true;row.querySelector('.deposit-to').disabled=true;
    if(deposit==='Undeposited Funds'){
     row.dataset.payment='true';status.textContent='Payment recorded: AR decreased; Undeposited Funds increased. Select this payment in Bank Deposit to move it to Checking.';
     if(!row.querySelector('.make-deposit')){const b=node('<button type="button" class="make-deposit">Bank Deposit: select this payment</button>');receive.after(b);b.onclick=()=>{row.dataset.received='true';status.textContent='Bank Deposit recorded: Undeposited Funds decreased; Checking increased. Now find the matching deposit.';};}
    }else{row.dataset.received='true';status.textContent='Payment recorded directly to Checking: AR decreased, Checking increased; income unchanged. Now match the receipt.';}
   });
  });
  getAnswer=()=>Object.fromEntries([...work.querySelectorAll('.feed-line')].map(r=>[r.dataset.line,{action:r.querySelector('.feed-action').value,matchId:r.querySelector('.feed-match').value,category:r.querySelector('.feed-category').value,received:r.dataset.received==='true'}]));
 }
 if(q.type==='reconcile'){
  work.innerHTML=`<div class="reconcile-stats"><div>Beginning balance<strong>${money(q.opening)}</strong></div><div>Statement ending<strong>${money(q.ending)}</strong></div><div>Difference<strong class="difference"></strong></div></div><p class="hint">Check only items on the statement. Compare amounts with the evidence; correct the planted error. A zero difference alone is not proof that the right items cleared.</p><div class="table-wrap"><table><thead><tr><th>Cleared</th><th>Book entry / statement evidence</th><th>Signed book amount</th></tr></thead><tbody>${q.lines.map(l=>`<tr data-line="${esc(l.id)}"><td><input type="checkbox" aria-label="Clear ${esc(l.label)}"></td><td>${esc(l.label)}${l.evidence?`<small>${esc(l.evidence)}</small>`:''}</td><td><input type="number" step="0.01" value="${l.amount}" aria-label="Amount for ${esc(l.label)}"></td></tr>`).join('')}</tbody></table></div>`;
  getAnswer=()=>Object.fromEntries([...work.querySelectorAll('tbody tr')].map(r=>[r.dataset.line,{checked:r.querySelector('[type=checkbox]').checked,amount:Number(r.querySelector('[type=number]').value)}]));
  const update=()=>{const a=getAnswer(),sum=q.lines.reduce((s,l)=>s+(a[l.id].checked?a[l.id].amount:0),q.opening);work.querySelector('.difference').textContent=money(q.ending-sum);};
  work.addEventListener('input',update);update();
 }
 box.querySelector('.submit').onclick=()=>{
  if(!getAnswer)return;
  const answer=getAnswer();
  const empty=q.type==='choice'&&!answer.length;
  if(empty){feedback.innerHTML='<p>Select an answer first.</p>';return;}
  const result=grade(q,answer);
  feedback.className=`feedback ${result.correct?'correct':'incorrect'}`;
  feedback.innerHTML=`<strong>${result.correct?'Correct — work verified.':'Review and retry.'}</strong><p>${esc(q.explanation)}</p>${q.type==='choice'?q.options.map(o=>`<p class="answer-reason"><span>${q.correct.includes(o.id)?'✓':'—'} ${esc(o.text)}</span> ${esc(o.explanation)}</p>`).join(''):''}${q.type==='journal'&&!result.correct?`<p>Check the account roles and amounts. The correct entry is:</p><ul>${q.expected.map(r=>`<li>${esc(r.account)}: debit ${money(r.debit)}, credit ${money(r.credit)}</li>`).join('')}</ul>`:''}${result.details?.length?`<details ${result.correct?'':'open'}><summary>Line-by-line feedback · ${result.score}%</summary>${result.details.map(d=>`<p>${d.correct?'✓':'↻'} ${esc(d.id)} · ${esc(d.explanation)}</p>`).join('')}</details>`:''}${result.dollarEffect?`<p>Unresolved bank lines: ${money(result.dollarEffect)} in exposure. This is the sum of affected line amounts, not a net accounting adjustment.</p>`:''}`;
  onAttempt(q,result,answer,Math.round((Date.now()-started)/1000));
  box.querySelector('.prior').textContent=result.correct?'Mastered ✓':'Retry available';
 };
 return box;
}

export function diagram(data){
 const box=node('<div class="diagram"></div>');if(!data)return box;
 if(data.type==='flow'){
  let index=0,wrong=false;
  box.innerHTML='<div class="flow-toolbar"><button type="button" class="path">Show the wrong path</button><button type="button" class="back">← Previous</button><button type="button" class="next primary">Next step →</button></div><div class="flow-track"></div><div class="flow-note" aria-live="polite"></div><div class="balances"></div><div class="flow-entry"></div>';
  const render=()=>{const steps=wrong&&data.wrongSteps?.length?data.wrongSteps:data.steps;index=Math.min(index,steps.length-1);const s=steps[index];
   box.querySelector('.flow-track').innerHTML=steps.map((s,i)=>`<span class="flow-step ${i===index?'active':i<index?'visited':''}">${i+1}. ${esc(s.label)}</span>`).join('');
   box.querySelector('.flow-note').innerHTML=`<h3>${esc(s.label)}</h3><p>${esc(s.note)}</p>`;
   box.querySelector('.balances').innerHTML=Object.entries(s.balances).map(([a,v])=>`<div><span>${esc(a)}</span><strong>${money(v)}</strong></div>`).join('');
   box.querySelector('.flow-entry').innerHTML=s.entry?.length?`<p class="hint">Entry at this step</p>${s.entry.map(e=>`<span>${esc(e.account)} · Dr ${money(e.debit)} / Cr ${money(e.credit)}</span>`).join('<br>')}`: '<p class="hint">No new journal entry at this step.</p>';
   box.querySelector('.back').disabled=index===0;box.querySelector('.next').disabled=index===steps.length-1;
   box.querySelector('.path').textContent=wrong?'Show the correct path':'Show the wrong path';
  };
  box.querySelector('.back').onclick=()=>{index--;render();};box.querySelector('.next').onclick=()=>{index++;render();};box.querySelector('.path').onclick=()=>{wrong=!wrong;index=0;render();};
  if(!data.wrongSteps?.length)box.querySelector('.path').hidden=true;render();
 }
 if(data.type==='equation'){
  let index=0;box.innerHTML=`<p class="hint">Step through Cedar Grove’s transactions. Revenue raises equity; expenses reduce it.</p><div class="equation-values"></div><p class="equation-note" aria-live="polite"></p><button type="button" class="primary">Apply next transaction</button><button type="button" class="reset">Reset map</button>`;
  const render=()=>{const applied=data.transactions.slice(0,index),total=k=>applied.reduce((s,t)=>s+Number(t[k]||0),0),a=total('assets'),l=total('liabilities'),e=total('equity')+total('income')-total('expenses');
   box.querySelector('.equation-values').innerHTML=`<svg class="balance-scale" viewBox="0 0 600 170" role="img" aria-label="Balanced equation: assets ${money(a)} equal liabilities plus equity ${money(l+e)}"><path d="M300 25V145M245 145h110M120 35h360M120 35l-65 65h130zM480 35l-65 65h130z" fill="none" stroke="#547344" stroke-width="4" stroke-linejoin="round"/><circle cx="300" cy="35" r="8" fill="#123d32"/><text x="120" y="132" text-anchor="middle" fill="#123d32" font-size="16">Assets ${money(a)}</text><text x="480" y="132" text-anchor="middle" fill="#123d32" font-size="16">Liabilities + equity ${money(l+e)}</text></svg><div>Assets<strong>${money(a)}</strong></div><b>=</b><div>Liabilities<strong>${money(l)}</strong></div><b>+</b><div>Equity, including profit<strong>${money(e)}</strong></div>`;
   box.querySelector('.equation-note').textContent=index?data.transactions[index-1].label:'Start at zero. Every transaction keeps both sides equal.';
   box.querySelector('.primary').disabled=index===data.transactions.length;
  };box.querySelector('.primary').onclick=()=>{index++;render();};box.querySelector('.reset').onclick=()=>{index=0;render();};render();
 }
 if(data.type==='decision'){
  let index=0;box.innerHTML='<div class="decision-content" aria-live="polite"></div><button type="button" class="primary">Next question →</button><button type="button" class="reset">Start over</button>';
  const render=()=>{const s=data.steps[index];box.querySelector('.decision-content').innerHTML=`<div class="eyebrow">Decision ${index+1} / ${data.steps.length}</div><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p>`;box.querySelector('.primary').disabled=index===data.steps.length-1;};
  box.querySelector('.primary').onclick=()=>{index++;render();};box.querySelector('.reset').onclick=()=>{index=0;render();};render();
 }return box;
}

export function mission(m,state,onCheck,onAttempt,previous){
 const box=node(`<article class="mission"><div class="eyebrow">Sandbox mission · 5–10 minutes</div><h3>${esc(m.title)}</h3><p>Use your own QBO sandbox in another tab. The Intuit sample company is also available and resets between sessions. If navigation differs, use search for the named form.</p><a class="button" href="https://qbo.intuit.com/redir/testdrive" target="_blank" rel="noopener noreferrer">Open QBO sample sandbox ↗</a><ol class="checklist">${m.steps.map((s,i)=>`<li><label><input type="checkbox" data-check="${esc(m.id)}-${i}" ${state.checks[`${m.id}-${i}`]?'checked':''}><span>${esc(s)}</span></label></li>`).join('')}</ol><div class="checkpoint"></div></article>`);
 box.querySelectorAll('[data-check]').forEach(i=>i.onchange=()=>onCheck(i.dataset.check,i.checked));
 box.querySelector('.checkpoint').append(exercise(m.checkpoint,onAttempt,previous));return box;
}
export function video(v){
 // Clip-selection notes belong to editable content, not the learner interface.
 if(!v||v.todo)return node('<div></div>');
 if(!/^[\w-]{11}$/.test(v.id)||!Number.isInteger(v.start)||!Number.isInteger(v.end)||v.end-v.start>300||v.end<=v.start)return node('<p>No verified clip configured.</p>');
 return node(`<aside><p>${esc(v.watchFor)}</p><iframe title="${esc(v.title)}" loading="lazy" src="https://www.youtube-nocookie.com/embed/${esc(v.id)}?start=${v.start}&end=${v.end}" allowfullscreen></iframe></aside>`);
}
