'use strict';
(() => {
 const $=id=>document.getElementById(id), t=s=>window.VELOVI_I18N?.t?.(s)||s;
 let ctx=null,budgets=[],goals=[],contributions=[],recurring=[];
 const today=()=>new Date().toISOString().slice(0,10), own=()=>ctx?.membership?.id, admin=()=>ctx?.membership?.role==='admin';
 const members=()=>ctx?.members||[], name=id=>members().find(m=>m.id===id)?.display_name||t('عضو الأسرة');
 const msg=(s,e=false)=>{const n=$('appMessage');if(n){n.textContent=s;n.hidden=false;n.classList.toggle('error',e);n.classList.toggle('success',!e);}};
 const money=(v,c)=>{try{return new Intl.NumberFormat(document.documentElement.lang==='ar'?'ar-EG':document.documentElement.lang==='en'?'en-GB':'de-DE',{style:'currency',currency:c}).format(+v||0)}catch{return (+v||0).toFixed(2)+' '+c}};
 const canAdd=()=>admin()||ctx?.membership?.can_add_transactions;
 const accounts=()=> (ctx?.accounts||[]).filter(a=>a.is_active&&a.owner_member_id===own());
 const options=(id,vals)=>{const s=$(id);if(!s)return;s.replaceChildren(...vals.map(v=>{const o=document.createElement('option');o.value=v;o.textContent=v;return o}))};
 async function load(){
  if(!ctx?.client||!ctx.household||!ctx.membership)return;
  const h=ctx.household.id;
  const rs=await Promise.all([
   ctx.client.from('monthly_budgets').select('*').eq('household_id',h).order('period_start',{ascending:false}),
   ctx.client.from('savings_goals').select('*').eq('household_id',h).neq('status','archived').order('created_at',{ascending:false}),
   ctx.client.from('savings_goal_contributions').select('*').eq('household_id',h).order('contributed_on',{ascending:false}),
   ctx.client.from('recurring_entries').select('*').eq('household_id',h).order('next_due_date')
  ]);
  const bad=rs.find(r=>r.error);if(bad){msg(t('تعذر تحميل بيانات التخطيط المالي: ')+bad.error.message,true);return}
  [budgets,goals,contributions,recurring]=rs.map(r=>r.data||[]);render();
 }
 function render(){
  const period=($('budgetPeriod')?.value||today().slice(0,7))+'-01',bn=$('budgetList');
  if(bn){bn.replaceChildren();const rows=budgets.filter(b=>b.period_start===period);
   if(!rows.length)bn.textContent=t('لا توجد ميزانيات لهذه الفترة.');
   rows.forEach(b=>{const monthKey=b.period_start.slice(0,7);
    const actual=(ctx.transactions||[]).filter(x=>x.owner_member_id===b.owner_member_id&&x.transaction_type==='expense'&&x.currency===b.currency&&x.category===b.category&&x.transaction_date>=b.period_start&&x.transaction_date<end).reduce((s,x)=>s+Number(x.amount),0);
    const pct=Math.min(100,actual/Number(b.limit_amount)*100),card=document.createElement('article');card.className='planning-item';
    const h=document.createElement('div');h.className='planning-item-head';const title=document.createElement('strong');title.textContent=b.category+' · '+money(b.limit_amount,b.currency);const owner=document.createElement('small');owner.textContent=admin()?name(b.owner_member_id):'';h.append(title,owner);
    const bar=document.createElement('div');bar.className='planning-progress';const fill=document.createElement('i');fill.style.width=pct+'%';if(actual>Number(b.limit_amount))fill.classList.add('over');bar.append(fill);
    const p=document.createElement('p');p.className='small muted';p.textContent=t('المنفق')+': '+money(actual,b.currency)+' · '+pct.toFixed(0)+'%';
    card.append(h,bar,p);if(admin()||b.owner_member_id===own()){const del=document.createElement('button');del.className='text-btn danger-text';del.type='button';del.textContent=t('حذف');del.onclick=()=>remove('monthly_budgets',b.id);card.append(del)}bn.append(card)
   })
  }
  const gn=$('goalList');if(gn){gn.replaceChildren();if(!goals.length)gn.textContent=t('لا توجد أهداف ادخار بعد.');
   goals.forEach(g=>{const sum=contributions.filter(c=>c.goal_id===g.id).reduce((s,c)=>s+Number(c.amount),0),pct=Math.min(100,sum/Number(g.target_amount)*100),card=document.createElement('article');card.className='planning-item';
    const h=document.createElement('div');h.className='planning-item-head';const title=document.createElement('strong');title.textContent=g.title;const amount=document.createElement('strong');amount.textContent=money(sum,g.currency)+' / '+money(g.target_amount,g.currency);h.append(title,amount);
    const bar=document.createElement('div');bar.className='planning-progress';const fill=document.createElement('i');fill.style.width=pct+'%';bar.append(fill);
    const meta=document.createElement('p');meta.className='small muted';meta.textContent=(g.visibility==='family'?t('هدف عائلي مشترك'):t('هدف شخصي'))+' · '+name(g.owner_member_id)+(g.target_date?' · '+g.target_date:'')+' · '+pct.toFixed(0)+'%';card.append(h,bar,meta);
    const parts=contributions.filter(c=>c.goal_id===g.id);if(parts.length){const p=document.createElement('p');p.className='small';p.textContent=t('المساهمات')+': '+parts.map(c=>name(c.contributor_member_id)+' '+money(c.amount,c.currency)).join(' · ');card.append(p)}
    if(g.visibility==='family'||g.owner_member_id===own()||admin()){const f=document.createElement('form');f.className='inline-contribution';const a=document.createElement('input');a.type='number';a.min='.01';a.step='.01';a.required=true;a.placeholder=t('مبلغ المساهمة');const n=document.createElement('input');n.maxLength=160;n.placeholder=t('ملاحظة (اختياري)');const b=document.createElement('button');b.type='submit';b.className='secondary';b.textContent=t('إضافة مساهمة');f.append(a,n,b);f.onsubmit=e=>addContribution(e,g,a,n);card.append(f)}
    if(admin()||g.owner_member_id===own()){const b=document.createElement('button');b.type='button';b.className='text-btn danger-text';b.textContent=t('أرشفة الهدف');b.onclick=()=>ctx.client.from('savings_goals').update({status:'archived'}).eq('id',g.id).then(r=>r.error?msg(r.error.message,true):load());card.append(b)}
    gn.append(card)
   })
  }
  const rn=$('recurringList');if(rn){rn.replaceChildren();const rows=recurring.filter(r=>r.is_active);if(!rows.length)rn.textContent=t('لا توجد حركات متكررة بعد.');
   const soon=new Date(Date.now()+7*86400000).toISOString().slice(0,10),upcoming=rows.filter(r=>r.next_due_date>=today()&&r.next_due_date<=soon);
   if(upcoming.length){const notice=document.createElement('p');notice.className='notice';notice.textContent=t('تذكير: لديك')+' '+upcoming.length+' '+t('استحقاق خلال الأيام السبعة القادمة.');rn.append(notice);}
   rows.forEach(r=>{const card=document.createElement('article');card.className='planning-item';const h=document.createElement('div');h.className='planning-item-head';const title=document.createElement('strong');title.textContent=r.description+' · '+money(r.amount,r.currency);const due=document.createElement('strong');due.textContent=r.next_due_date;h.append(title,due);const meta=document.createElement('p');meta.className='small muted';meta.textContent=t(r.transaction_type==='income'?'إيراد':'مصروف')+' · '+r.category+' · '+t(r.frequency);card.append(h,meta);
    if(admin()||r.owner_member_id===own()){if(r.next_due_date<=today()){const b=document.createElement('button');b.type='button';b.className='primary';b.textContent=t('تسجيل الحركة المستحقة');b.onclick=()=>record(r);card.append(b)}const stop=document.createElement('button');stop.type='button';stop.className='text-btn danger-text';stop.textContent=t('إيقاف');stop.onclick=()=>ctx.client.from('recurring_entries').update({is_active:false}).eq('id',r.id).then(x=>x.error?msg(x.error.message,true):load());card.append(stop)}rn.append(card)
   })
  }
 }
 async function remove(table,id){if(!confirm(t('هل تريد الحذف؟')))return;const {error}=await ctx.client.from(table).delete().eq('id',id);if(error)msg(error.message,true);else load()}
 async function addContribution(e,g,a,n){e.preventDefault();const amount=Number(a.value);if(!(amount>0))return;const {error}=await ctx.client.from('savings_goal_contributions').insert({household_id:ctx.household.id,goal_id:g.id,contributor_member_id:own(),amount,currency:g.currency,note:n.value.trim()||null,created_by:ctx.user.id});if(error)msg(error.message,true);else{await load();msg(t('تمت إضافة المساهمة.'))}}
 async function record(r){if(!canAdd())return msg(t('ليست لديك صلاحية إضافة الحركات.'),true);const {error}=await ctx.client.rpc('record_due_recurring_transaction',{p_recurring_id:r.id});if(error)return msg(error.message,true);await load();window.VELOVI_REFRESH_FINANCIAL_DATA?.();msg(t('تم تسجيل الحركة وتحديث موعدها التالي.'))}
 function setup(){
  const cats=[...new Set((ctx.transactions||[]).map(x=>x.category).filter(Boolean))];const list=$('budgetCategoryOptions');if(list)list.replaceChildren(...cats.map(v=>{const o=document.createElement('option');o.value=v;return o}));
  const curr=[...new Set((ctx.accounts||[]).map(a=>a.currency).filter(Boolean))];if(!curr.length)curr.push(localStorage.getItem('velovi-currency')||'EUR');options('budgetCurrency',curr);options('goalCurrency',curr);
  const acc=$('recurringAccount');if(acc)acc.replaceChildren(...accounts().map(a=>{const o=document.createElement('option');o.value=a.id;o.textContent=a.name+' · '+a.currency;return o}));
  if($('budgetPeriod')&&!$('budgetPeriod').value)$('budgetPeriod').value=today().slice(0,7);if($('recurringNextDate')&&!$('recurringNextDate').value)$('recurringNextDate').value=today();
 }
 $('budgetForm')?.addEventListener('submit',async e=>{e.preventDefault();if(!canAdd())return msg(t('ليست لديك صلاحية إضافة بيانات التخطيط.'),true);const p={household_id:ctx.household.id,owner_member_id:own(),category:$('budgetCategory').value.trim(),currency:$('budgetCurrency').value,period_start:$('budgetPeriod').value+'-01',limit_amount:Number($('budgetLimit').value),created_by:ctx.user.id};if(!p.category||!(p.limit_amount>0))return msg(t('أدخل تصنيفاً وحداً مالياً صحيحاً.'),true);const {error}=await ctx.client.from('monthly_budgets').upsert(p,{onConflict:'household_id,owner_member_id,category,currency,period_start'});if(error)msg(error.message,true);else{e.target.reset();$('budgetPeriod').value=p.period_start.slice(0,7);await load();msg(t('تم حفظ الميزانية.'))}});
 $('goalForm')?.addEventListener('submit',async e=>{e.preventDefault();if(!canAdd())return msg(t('ليست لديك صلاحية إضافة أهداف ادخار.'),true);const p={household_id:ctx.household.id,owner_member_id:own(),title:$('goalTitle').value.trim(),target_amount:Number($('goalTarget').value),currency:$('goalCurrency').value,target_date:$('goalDate').value||null,visibility:$('goalVisibility').value,created_by:ctx.user.id};if(!p.title||!(p.target_amount>0))return msg(t('أدخل اسماً ومبلغاً مستهدفاً صحيحاً.'),true);const {error}=await ctx.client.from('savings_goals').insert(p);if(error)msg(error.message,true);else{e.target.reset();await load();msg(t('تم إنشاء هدف الادخار.'))}});
 $('recurringForm')?.addEventListener('submit',async e=>{e.preventDefault();if(!canAdd())return msg(t('ليست لديك صلاحية إضافة الحركات.'),true);const a=accounts().find(x=>x.id===$('recurringAccount').value),p={household_id:ctx.household.id,owner_member_id:own(),account_id:a?.id,transaction_type:$('recurringType').value,amount:Number($('recurringAmount').value),currency:a?.currency,description:$('recurringDescription').value.trim(),category:$('recurringCategory').value.trim()||'غير مصنف',frequency:$('recurringFrequency').value,next_due_date:$('recurringNextDate').value,end_date:$('recurringEndDate').value||null,created_by:ctx.user.id};if(!a||!p.description||!(p.amount>0)||!p.next_due_date)return msg(t('أكمل بيانات الحركة المتكررة بشكل صحيح.'),true);const {error}=await ctx.client.from('recurring_entries').insert(p);if(error)msg(error.message,true);else{e.target.reset();setup();await load();msg(t('تم حفظ الحركة المتكررة.'))}});
 $('budgetPeriod')?.addEventListener('change',render);
 document.addEventListener('velovi:language-changed',render);
 window.addEventListener('velovi:financial-data-loaded',e=>{ctx=e.detail;setup();load()});
})();