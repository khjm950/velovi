const views = [...document.querySelectorAll('.view')];
function showView(id){views.forEach(v=>v.classList.toggle('active',v.id===id));document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.view===id));window.scrollTo({top:0,behavior:'smooth'});}
document.querySelectorAll('.nav-item').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.view)));
document.querySelectorAll('[data-goto]').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.goto)));
const txDialog=document.getElementById('transactionDialog');
document.querySelectorAll('[data-open-add]').forEach(b=>b.addEventListener('click',()=>txDialog.showModal()));
document.querySelectorAll('[data-permission]').forEach(b=>b.addEventListener('click',()=>document.getElementById('permissionDialog').showModal()));
document.getElementById('transactionForm').addEventListener('submit',e=>{
  if(e.submitter?.value==='cancel') return;
  e.preventDefault();
  const desc=document.getElementById('txDesc').value.trim();
  const amount=Number(document.getElementById('txAmount').value);
  const date=document.getElementById('txDate').value;
  const type=document.getElementById('txType').value;
  if(!desc||!amount||!date) return;
  const tr=document.createElement('tr');
  const dateText=new Date(date+'T12:00:00').toLocaleDateString('de-DE');
  const sign=type==='income'?'+':'−';
  tr.innerHTML=`<td></td><td></td><td></td><td><span class="pill ${type==='income'?'green':'red'}">${type==='income'?'إيراد':'مصروف'}</span></td><td class="${type==='income'?'positive':''}"></td>`;
  tr.children[0].textContent=desc;tr.children[1].textContent=document.getElementById('txCategory').value||'غير مصنف';tr.children[2].textContent=dateText;tr.children[4].textContent=`${sign}${amount.toLocaleString('de-DE',{minimumFractionDigits:2})} €`;
  document.getElementById('txRows').prepend(tr);txDialog.close();e.target.reset();
  alert('أضيفت الحركة إلى العرض التجريبي فقط. لن تُحفظ بعد إغلاق الصفحة.');
});
document.getElementById('searchTx').addEventListener('input',e=>{const q=e.target.value.toLowerCase();document.querySelectorAll('#txRows tr').forEach(r=>r.hidden=!r.textContent.toLowerCase().includes(q));});
document.getElementById('calcForecast').addEventListener('click',()=>{
 const balance=20000,monthly=1000,years=Math.max(1,Math.min(100,Number(document.getElementById('years').value)||1));
 const result=balance+monthly*12*years;
 document.getElementById('forecastResult').innerHTML=`الرصيد المتوقع بعد ${years} سنوات: <b>${result.toLocaleString('de-DE')} €</b>`;
});
document.getElementById('chooseFile').addEventListener('click',()=>document.getElementById('fileInput').click());
document.getElementById('fileInput').addEventListener('change',e=>{document.getElementById('fileName').textContent=e.target.files[0]?.name||'لم يتم اختيار ملف';});
document.getElementById('inviteMember').addEventListener('click',()=>alert('سيتم تفعيل دعوات الأعضاء بالبريد بعد ربط Supabase.'));
document.getElementById('addAccount').addEventListener('click',()=>alert('سيتم تفعيل إضافة الحسابات بعد ربط قاعدة البيانات.'));
if('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('./sw.js').catch(()=>{});
