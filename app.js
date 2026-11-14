'use strict';

/* Velovi: واجهة تجريبية فقط، دون حفظ أو مزامنة. */
const getElement = id => document.getElementById(id);
const addListener = (element, event, callback) => element?.addEventListener(event, callback);

const views = [...document.querySelectorAll('.view')];
const navItems = [...document.querySelectorAll('.nav-item')];
function showView(id) {
  const target = getElement(id);
  if (!target || !target.classList.contains('view')) return;
  views.forEach(view => view.classList.toggle('active', view.id === id));
  navItems.forEach(button => button.classList.toggle('active', button.dataset.view === id));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
navItems.forEach(button => addListener(button, 'click', () => showView(button.dataset.view)));
document.querySelectorAll('.mobile-more-menu .nav-item').forEach(button => addListener(button, 'click', () => { const menu = button.closest('details'); if (menu) menu.open = false; }));
document.querySelectorAll('[data-goto]').forEach(button => addListener(button, 'click', () => showView(button.dataset.goto)));

const txDialog = getElement('transactionDialog');
const permissionDialog = getElement('permissionDialog');
document.querySelectorAll('[data-open-add]').forEach(button => addListener(button, 'click', () => txDialog?.showModal?.()));
document.querySelectorAll('[data-permission]').forEach(button => addListener(button, 'click', () => permissionDialog?.showModal?.()));

const rowsContainer = getElement('txRows');
const searchInput = getElement('searchTx');
const typeFilter = getElement('typeFilter');
const dateFrom = getElement('dateFrom');
const dateTo = getElement('dateTo');
const netElement = getElement('txNet');
const countElement = getElement('txCount');
let sortKey = 'date';
let sortDirection = 'desc';

function normalizeDate(value) {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const match = value.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  return match ? `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}` : '';
}
function parseAmount(value) {
  let cleaned = String(value).replace(/[^\d,.-]/g, '');
  if (cleaned.includes(',')) cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  else if ((cleaned.match(/\./g) || []).length > 1) cleaned = cleaned.replace(/\./g, '');
  const amount = Number(cleaned);
  return Number.isFinite(amount) ? Math.abs(amount) : 0;
}
function getRowData(row) {
  const cells = row.querySelectorAll('td');
  const badge = cells[0]?.querySelector('.pill');
  const typeText = badge?.textContent.trim() || cells[0]?.textContent.trim() || '';
  const type = typeText.includes('إيراد') ? 'income' : typeText.includes('مصروف') ? 'expense' : 'other';
  const date = normalizeDate(cells[3]?.textContent.trim() || '');
  const amount = parseAmount(cells[4]?.textContent || '');
  row.dataset.type = type;
  row.dataset.category = cells[1]?.textContent.trim() || '';
  row.dataset.description = cells[2]?.textContent.trim() || '';
  row.dataset.date = date;
  row.dataset.amount = String(amount);
  return { type, category: row.dataset.category, description: row.dataset.description, date, amount };
}
function compareRows(a, b) {
  const x = getRowData(a), y = getRowData(b);
  let result = 0;
  if (sortKey === 'amount') result = x.amount - y.amount;
  else if (sortKey === 'date') result = x.date.localeCompare(y.date);
  else if (sortKey === 'type') result = x.type.localeCompare(y.type);
  else result = x[sortKey].localeCompare(y[sortKey], 'ar', { sensitivity: 'base' });
  return result * (sortDirection === 'asc' ? 1 : -1);
}
function applyTransactionView() {
  if (!rowsContainer) return;
  const query = searchInput?.value.trim().toLocaleLowerCase() || '';
  const selectedType = typeFilter?.value || 'all';
  const from = dateFrom?.value || '';
  const to = dateTo?.value || '';
  const rows = [...rowsContainer.querySelectorAll('tr')];
  let net = 0, count = 0;
  rows.forEach(row => {
    const d = getRowData(row);
    const matches = (!query || row.textContent.toLocaleLowerCase().includes(query)) &&
      (selectedType === 'all' || d.type === selectedType) &&
      (!from || (d.date && d.date >= from)) &&
      (!to || (d.date && d.date <= to));
    row.hidden = !matches;
    if (matches) {
      count++;
      if (d.type === 'income') net += d.amount;
      else if (d.type === 'expense') net -= d.amount;
      // أي نوع آخر، بما فيه التحويلات مستقبلاً، لا يدخل في الصافي.
    }
  });
  rows.sort(compareRows).forEach(row => rowsContainer.appendChild(row));
  if (netElement) {
    netElement.textContent = `${net.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
    netElement.classList.toggle('positive', net > 0);
    netElement.classList.toggle('negative', net < 0);
    netElement.classList.toggle('neutral', net === 0);
  }
  if (countElement) countElement.textContent = String(count);
  document.querySelectorAll('.sort-header').forEach(button => {
    const active = button.dataset.sort === sortKey;
    const th = button.closest('th');
    if (th) th.setAttribute('aria-sort', active ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none');
    const arrow = button.querySelector('span');
    if (arrow) arrow.textContent = active ? (sortDirection === 'asc' ? '↑' : '↓') : '↕';
  });
}
document.querySelectorAll('.sort-header').forEach(button => addListener(button, 'click', () => {
  if (sortKey === button.dataset.sort) sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
  else {
    sortKey = button.dataset.sort;
    sortDirection = sortKey === 'date' || sortKey === 'amount' ? 'desc' : 'asc';
  }
  applyTransactionView();
}));
[searchInput, typeFilter, dateFrom, dateTo].forEach(element => addListener(element, 'input', applyTransactionView));
addListener(typeFilter, 'change', applyTransactionView);
addListener(getElement('clearFilters'), 'click', () => {
  if (searchInput) searchInput.value = '';
  if (typeFilter) typeFilter.value = 'all';
  if (dateFrom) dateFrom.value = '';
  if (dateTo) dateTo.value = '';
  applyTransactionView();
});
applyTransactionView();

const transactionForm = getElement('transactionForm');
addListener(transactionForm, 'submit', event => {
  if (event.submitter?.value === 'cancel') return;
  event.preventDefault();
  const description = getElement('txDesc')?.value.trim() || '';
  const amount = Number(getElement('txAmount')?.value);
  const date = getElement('txDate')?.value || '';
  const type = getElement('txType')?.value || 'expense';
  const category = getElement('txCategory')?.value.trim() || 'غير مصنف';
  if (!rowsContainer) return alert('تعذر العثور على جدول الحركات.');
  if (!description || !date || !Number.isFinite(amount) || amount <= 0) return alert('أدخل وصفاً صحيحاً ومبلغاً أكبر من صفر وتاريخ الحركة.');
  if (!['income', 'expense'].includes(type)) return alert('نوع الحركة غير صحيح.');

  const row = document.createElement('tr');
  const typeCell = document.createElement('td');
  const badge = document.createElement('span');
  badge.className = type === 'income' ? 'pill green' : 'pill red';
  badge.textContent = type === 'income' ? 'إيراد' : 'مصروف';
  typeCell.appendChild(badge);
  const categoryCell = document.createElement('td'); categoryCell.textContent = category;
  const descriptionCell = document.createElement('td'); descriptionCell.textContent = description;
  const dateCell = document.createElement('td');
  const parsedDate = new Date(`${date}T12:00:00`);
  dateCell.textContent = Number.isNaN(parsedDate.getTime()) ? date : parsedDate.toLocaleDateString('de-DE');
  const amountCell = document.createElement('td');
  amountCell.classList.toggle('positive', type === 'income');
  amountCell.textContent = `${type === 'income' ? '+' : '−'}${amount.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
  row.append(typeCell, categoryCell, descriptionCell, dateCell, amountCell);
  rowsContainer.appendChild(row);
  applyTransactionView();
  txDialog?.close();
  transactionForm.reset();
  alert('أضيفت الحركة إلى العرض التجريبي فقط، ولن تُحفظ بعد إغلاق الصفحة.');
});

const forecastButton = getElement('calcForecast');
addListener(forecastButton, 'click', () => {
  const inputs = document.querySelectorAll('#reports .form-grid input');
  const result = getElement('forecastResult');
  if (inputs.length < 4 || !result) return alert('تعذر قراءة بيانات الحاسبة.');
  const balance = Number(inputs[0].value), monthly = Number(inputs[1].value);
  const years = Number(getElement('years')?.value), annual = Number(inputs[3].value);
  if (![balance, monthly, years, annual].every(Number.isFinite) || years < 1 || years > 100) return alert('أدخل قيماً صحيحة وعدد سنوات بين 1 و100.');
  if (annual <= -100 || annual > 100) return alert('العائد السنوي يجب أن يكون أكبر من -100% ولا يتجاوز 100%.');
  const rate = Math.pow(1 + annual / 100, 1 / 12) - 1;
  let future = balance;
  for (let month = 0; month < Math.round(years * 12); month++) future = future * (1 + rate) + monthly;
  result.replaceChildren(document.createTextNode(`الرصيد الحسابي الافتراضي بعد ${years} سنوات: `));
  const value = document.createElement('b');
  value.textContent = `${future.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
  result.appendChild(value);
});

const chooseFileButton = getElement('chooseFile'), fileInput = getElement('fileInput'), fileName = getElement('fileName');
addListener(chooseFileButton, 'click', () => fileInput?.click());
addListener(fileInput, 'change', event => {
  const file = event.target.files?.[0];
  if (fileName) fileName.textContent = file ? `${file.name} — اختيار فقط، لم تتم قراءة الملف أو رفعه` : 'لم يتم اختيار ملف';
});
addListener(getElement('inviteMember'), 'click', () => alert('دعوات الأعضاء ستُفعّل بعد بناء نظام الحسابات وقاعدة البيانات.'));
addListener(getElement('addAccount'), 'click', () => alert('إضافة الحسابات ستُفعّل بعد ربط قاعدة البيانات.'));

if ('serviceWorker' in navigator && /^https?:$/.test(window.location.protocol)) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(error => console.error('تعذر تسجيل Service Worker:', error)));
}
