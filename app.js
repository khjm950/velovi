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
  document.querySelectorAll('.mobile-more[open]').forEach(menu => { menu.open = false; });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
navItems.forEach(button => addListener(button, 'click', () => showView(button.dataset.view)));
document.querySelectorAll('.mobile-more-menu .nav-item').forEach(button => addListener(button, 'click', () => { const menu = button.closest('details'); if (menu) menu.open = false; }));
document.querySelectorAll('[data-goto]').forEach(button => {
  const navigate = () => {
    showView(button.dataset.goto);
    if (button.dataset.transactionFilter) {
      const filter = getElement('typeFilter');
      if (filter) {
        filter.value = button.dataset.transactionFilter;
        filter.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  };
  addListener(button, 'click', navigate);
  addListener(button, 'keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); navigate(); } });
});

// Local display preferences only; currency is stored as ISO 4217, never as a symbol.
const root = document.documentElement;
const languageSetting = getElement('languageSetting'), currencySetting = getElement('currencySetting');
const savedLanguage = localStorage.getItem('velovi-language') || 'ar';
const currencyByRegion = {
  DE:'EUR', AT:'EUR', BE:'EUR', CY:'EUR', EE:'EUR', ES:'EUR', FI:'EUR', FR:'EUR', GR:'EUR', HR:'EUR', IE:'EUR', IT:'EUR', LT:'EUR', LU:'EUR', LV:'EUR', MT:'EUR', NL:'EUR', PT:'EUR', SI:'EUR', SK:'EUR',
  US:'USD', GB:'GBP', CH:'CHF', SA:'SAR', AE:'AED', CA:'CAD', AU:'AUD', NZ:'NZD', JP:'JPY', CN:'CNY', IN:'INR', TR:'TRY', BR:'BRL', MX:'MXN', ZA:'ZAR',
  SE:'SEK', NO:'NOK', DK:'DKK', PL:'PLN', CZ:'CZK', HU:'HUF', RO:'RON', BG:'BGN', IS:'ISK', SG:'SGD', HK:'HKD', KR:'KRW', TH:'THB', MY:'MYR', ID:'IDR', PH:'PHP', PK:'PKR', EG:'EGP', QA:'QAR', KW:'KWD', BH:'BHD', OM:'OMR', JO:'JOD', IL:'ILS', MA:'MAD', NG:'NGN', KE:'KES'
};
function detectDefaultCurrency() {
  try {
    const locale = new Intl.Locale(navigator.language || 'en');
    const region = locale.region || (String(navigator.language || '').match(/-([A-Z]{2})(?:-|$)/i) || [])[1];
    return currencyByRegion[region] || 'EUR';
  } catch { return 'EUR'; }
}
const legacyCurrencyCodes = {'€':'EUR','$':'USD','£':'GBP','CHF':'CHF','د.إ':'AED'};
const storedCurrency = localStorage.getItem('velovi-currency');
const savedCurrency = legacyCurrencyCodes[storedCurrency] || storedCurrency || detectDefaultCurrency();
if (savedCurrency !== storedCurrency) localStorage.setItem('velovi-currency', savedCurrency);
const savedTheme = localStorage.getItem('velovi-theme') || 'green';
if (languageSetting) languageSetting.value = savedLanguage;
if (currencySetting) currencySetting.value = savedCurrency;
function getCurrencySymbol() {
  try {
    const locale = root.lang || navigator.language || 'de-DE';
    return new Intl.NumberFormat(locale, { style: 'currency', currency: localStorage.getItem('velovi-currency') || 'EUR', currencyDisplay: 'narrowSymbol' }).formatToParts(0).find(part => part.type === 'currency')?.value || (localStorage.getItem('velovi-currency') || 'EUR');
  } catch { return localStorage.getItem('velovi-currency') || 'EUR'; }
}
function formatCurrencyOptionLabels() {
  if (!currencySetting) return;
  currencySetting.dir = 'ltr';
  currencySetting.style.textAlign = 'left';
  [...currencySetting.options].forEach(option => {
    const code = option.value;
    const separator = option.textContent.indexOf(' · ');
    if (!code || separator < 0) return;
    const name = option.textContent.slice(separator + 3).replace(/\s*\([^)]*\)\s*$/, '').trim();
    let symbol = code;
    try {
      symbol = new Intl.NumberFormat('en', { style: 'currency', currency: code, currencyDisplay: 'narrowSymbol' })
        .formatToParts(0).find(part => part.type === 'currency')?.value || code;
    } catch {}
    // Isolate Latin codes and currency marks from Arabic text to prevent bidi reordering.
    option.textContent = `\\u2066${code}\\u2069 · ${name} (\\u2066${symbol}\\u2069)`;
    option.dir = 'ltr';
  });
}
formatCurrencyOptionLabels();
function formatPreferredCurrency(value) {
  try { return new Intl.NumberFormat(root.lang || navigator.language || 'de-DE', { style: 'currency', currency: localStorage.getItem('velovi-currency') || 'EUR', currencyDisplay: 'narrowSymbol', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value); }
  catch { return value.toFixed(2) + ' ' + getCurrencySymbol(); }
}
const originalCurrencyText = new WeakMap();
function refreshCurrencyDisplay() {
  const symbol = getCurrencySymbol();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(node => {
    // Currency selector labels are fixed per ISO code and must never inherit the selected display currency.
    if (node.parentElement?.closest('#txNet, #currencySetting')) return;
    if (!originalCurrencyText.has(node)) originalCurrencyText.set(node, node.nodeValue);
    const original = originalCurrencyText.get(node);
    if (original.includes('€')) node.nodeValue = original.replace(/€/g, symbol);
  });
  document.querySelectorAll('.forecastCurrencySymbol').forEach(label => { label.textContent = symbol; });
  const initial = getElement('forecastResult')?.querySelector('b');
  if (initial) initial.textContent = formatPreferredCurrency(140000);
}
refreshCurrencyDisplay();

root.lang = savedLanguage; root.dir = savedLanguage === 'ar' ? 'rtl' : 'ltr'; root.dataset.theme = savedTheme;
addListener(languageSetting, 'change', () => {
  root.lang = languageSetting.value; root.dir = languageSetting.value === 'ar' ? 'rtl' : 'ltr';
  localStorage.setItem('velovi-language', languageSetting.value);
  getElement('settingsStatus').textContent = 'حُفظ اختيار اللغة. بعض نصوص الواجهة لا تزال بالعربية في هذه النسخة.';
});
addListener(currencySetting, 'change', () => {
  localStorage.setItem('velovi-currency', currencySetting.value);
  refreshCurrencyDisplay();
  getElement('settingsStatus').textContent = 'حُفظت العملة المفضلة، وتم تحديث رمز العملة في جميع الأبواب. لا يجري تحويل المبالغ الحالية تلقائياً.';
});
document.querySelectorAll('[data-theme-choice]').forEach(button => {
  button.classList.toggle('active', button.dataset.themeChoice === savedTheme);
  addListener(button, 'click', () => {
    root.dataset.theme = button.dataset.themeChoice; localStorage.setItem('velovi-theme', button.dataset.themeChoice);
    document.querySelectorAll('[data-theme-choice]').forEach(item => item.classList.toggle('active', item === button));
  });
});
const chartType = getElement('chartType'), chartPeriod = getElement('chartPeriod');
function renderDemoChart() {
  const chart = getElement('expenseChart'); if (!chart) return;
  const isBars = chartType?.value === 'bars'; chart.classList.toggle('bars', isBars);
  if (isBars) {
    // Inline important background prevents the base donut gradient from showing behind bars.
    chart.style.setProperty('background', 'repeating-linear-gradient(to top, var(--chart-grid) 0 1px, transparent 1px 42px), var(--surface)', 'important');
    if (!chart.querySelector('.chart-bar')) chart.insertAdjacentHTML('beforeend','<span class="chart-bar" style="height:80%"></span><span class="chart-bar" style="height:12%"></span><span class="chart-bar" style="height:7%"></span><span class="chart-bar" style="height:1%"></span>');
  } else {
    chart.style.removeProperty('background');
  }
  const labels={month:'نموذج توضيحي للشهر الحالي',quarter:'عرض تجريبي لآخر 3 أشهر',year:'عرض تجريبي لهذا العام'};
  const label=getElement('chartPeriodLabel'); if(label) label.textContent=labels[chartPeriod?.value||'month'];
}
addListener(chartType,'change',renderDemoChart); addListener(chartPeriod,'change',renderDemoChart); renderDemoChart();

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
const sortSelect = getElement('sortTransactions');
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
  return Number.isFinite(amount) ? amount : 0;
}
function getRowData(row) {
  const cells = row.querySelectorAll('td');
  const badge = cells[0]?.querySelector('.pill');
  const typeText = badge?.textContent.trim() || cells[0]?.textContent.trim() || '';
  const type = typeText.includes('إيراد') ? 'income' : typeText.includes('مصروف') ? 'expense' : 'other';
  const date = normalizeDate(cells[3]?.textContent.trim() || '');
  const amountText = cells[4]?.textContent || '';
  const amount = parseAmount(amountText);
  const hasNegativeSign = /[−-]/.test(amountText);
  const signedAmount = hasNegativeSign ? -Math.abs(amount) : (type === 'expense' ? -Math.abs(amount) : Math.abs(amount));
  row.dataset.type = type;
  row.dataset.category = cells[1]?.textContent.trim() || '';
  row.dataset.description = cells[2]?.textContent.trim() || '';
  row.dataset.date = date;
  row.dataset.amount = String(Math.abs(amount));
  row.dataset.signedAmount = String(signedAmount);
  return { type, category: row.dataset.category, description: row.dataset.description, date, amount: Math.abs(amount), signedAmount };
}
function compareRows(a, b) {
  const x = getRowData(a), y = getRowData(b);
  let result = 0;
  if (sortKey === 'amount') result = x.signedAmount - y.signedAmount;
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
    const amountText = d.amount.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const amountDigits = String(d.amount);
    const normalizedQuery = query.replace(/\s/g, '').replace(',', '.');
    const numericQuery = normalizedQuery && /^-?\d+(\.\d*)?$/.test(normalizedQuery);
    const matchesSearch = !query ||
      row.textContent.toLocaleLowerCase().includes(query) ||
      (numericQuery && (amountDigits.includes(normalizedQuery.replace(/^-/, '')) ||
        amountText.replace(/\./g, '').replace(',', '.').includes(normalizedQuery.replace(/^-/, ''))));
    const matches = matchesSearch &&
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
    netElement.textContent = `${net.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${getCurrencySymbol()}`;
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
addListener(sortSelect, 'change', () => {
  const [key, direction] = (sortSelect?.value || 'date-desc').split('-');
  sortKey = key;
  sortDirection = direction;
  applyTransactionView();
});
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
  amountCell.textContent = `${type === 'income' ? '+' : '−'}${amount.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${getCurrencySymbol()}`;
  row.append(typeCell, categoryCell, descriptionCell, dateCell, amountCell);
  rowsContainer.appendChild(row);
  applyTransactionView();
  txDialog?.close();
  transactionForm.reset();
  alert('أضيفت الحركة إلى العرض التجريبي فقط، ولن تُحفظ بعد إغلاق الصفحة.');
});

const balanceInput = getElement('forecastBalance');
function bindSignToggle(inputId, buttonId) {
  const input = getElement(inputId);
  const button = getElement(buttonId);
  button?.addEventListener('click', () => {
    if (!input) return;
    const raw = input.value.trim().replace(/\s/g, '').replace(',', '.');
    const value = Number(raw);
    if (!raw || !Number.isFinite(value)) { input.focus(); return; }
    input.value = value < 0 ? String(Math.abs(value)) : String(-Math.abs(value));
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.focus();
  });
}
bindSignToggle('forecastBalance', 'toggleBalanceSign');
bindSignToggle('monthlySurplus', 'toggleSurplusSign');
const forecastButton = getElement('calcForecast');
addListener(forecastButton, 'click', () => {
  const result = getElement('forecastResult');
  const balanceRaw = balanceInput?.value.trim() || '';
  const balance = Number(balanceRaw.replace(/\\s/g, '').replace(',', '.'));
  const monthly = Number(getElement('monthlySurplus')?.value);
  const months = Number(getElement('forecastMonths')?.value);
  const annual = Number(getElement('annualReturn')?.value);
  if (![balance, monthly, months, annual].every(Number.isFinite) || !Number.isInteger(months) || months < 1 || months > 1200) {
    return alert('أدخل قيماً صحيحة، واجعل مدة التوقع بين شهر واحد و1200 شهر.');
  }
  if (annual <= -100 || annual > 100) return alert('العائد السنوي يجب أن يكون أكبر من -100% ولا يتجاوز 100%.');
  const rate = Math.pow(1 + annual / 100, 1 / 12) - 1;
  let future = balance;
  for (let month = 0; month < months; month++) future = future * (1 + rate) + monthly;
  result.replaceChildren(document.createTextNode(`الرصيد الحسابي الافتراضي بعد ${months} شهراً: `));
  const value = document.createElement('b');
  value.textContent = formatPreferredCurrency(future);
  result.appendChild(value);
  result.classList.toggle('negative', future < 0);
  result.classList.toggle('positive', future > 0);
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
