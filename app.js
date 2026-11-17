'use strict';

/* Velovi: authenticated family finance PWA; durable financial writes live in auth.js. */
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
  SE:'SEK', NO:'NOK', DK:'DKK', PL:'PLN', CZ:'CZK', HU:'HUF', RO:'RON', BG:'BGN', IS:'ISK', SG:'SGD', HK:'HKD', KR:'KRW', TH:'THB', MY:'MYR', ID:'IDR', PH:'PHP', PK:'PKR', EG:'EGP', QA:'QAR', KW:'KWD', BH:'BHD', OM:'OMR', JO:'JOD', MA:'MAD', NG:'NGN', KE:'KES'
};
function detectDefaultCurrency() {
  try {
    const locale = new Intl.Locale(navigator.language || 'en');
    const region = locale.region || (String(navigator.language || '').match(/-([A-Z]{2})(?:-|$)/i) || [])[1];
    return currencyByRegion[region] || 'EUR';
  } catch { return 'EUR'; }
}
const legacyCurrencyCodes = {"€":"EUR","$":"USD","£":"GBP","CHF":"CHF","د.إ":"AED"};
const storedCurrency = localStorage.getItem("velovi-currency");
const requestedCurrency = legacyCurrencyCodes[storedCurrency] || storedCurrency || detectDefaultCurrency();
const supportedCurrencies = new Set(Array.from(currencySetting?.options || [], option => option.value));
const savedCurrency = supportedCurrencies.has(requestedCurrency) ? requestedCurrency : detectDefaultCurrency();
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
    // Keep option labels plain: native Android select controls may expose bidi escape marks as text.
    option.textContent = `${code} · ${name} (${symbol})`;
    option.dir = 'ltr';
  });
}
formatCurrencyOptionLabels();
function formatPreferredCurrency(value) {
  try { return new Intl.NumberFormat(root.lang || navigator.language || 'de-DE', { style: 'currency', currency: localStorage.getItem('velovi-currency') || 'EUR', currencyDisplay: 'narrowSymbol', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value); }
  catch { return value.toFixed(2) + ' ' + getCurrencySymbol(); }
}
function refreshCurrencyDisplay() {
  const symbol = getCurrencySymbol();
  document.querySelectorAll('.forecastCurrencySymbol').forEach(label => { label.textContent = symbol; });
  const manualResult = getElement('forecastResult');
  const storedValue = Number(manualResult?.dataset.numericValue);
  const valueLabel = manualResult?.querySelector('b');
  if (manualResult?.dataset.numericValue && Number.isFinite(storedValue) && valueLabel) {
    valueLabel.textContent = formatPreferredCurrency(storedValue);
  }
}

root.lang = savedLanguage; root.dir = savedLanguage === 'ar' ? 'rtl' : 'ltr'; root.dataset.theme = savedTheme;
refreshCurrencyDisplay();
const savedChartPalette = localStorage.getItem('velovi-chart-palette') || 'ocean';
root.dataset.chartPalette = savedChartPalette;
document.querySelectorAll('[data-chart-palette]').forEach(button => {
  button.classList.toggle('active', button.dataset.chartPalette === savedChartPalette);
  addListener(button, 'click', () => {
    root.dataset.chartPalette = button.dataset.chartPalette;
    localStorage.setItem('velovi-chart-palette', button.dataset.chartPalette);
    document.querySelectorAll('[data-chart-palette]').forEach(item => item.classList.toggle('active', item === button));
    const status = getElement('settingsStatus'); if (status) status.textContent = 'تم تغيير ألوان الرسوم البيانية بشكل مستقل عن ألوان التطبيق.';
  });
});
addListener(languageSetting, 'change', () => {
  root.lang = languageSetting.value; root.dir = languageSetting.value === 'ar' ? 'rtl' : 'ltr';
  localStorage.setItem('velovi-language', languageSetting.value);
  getElement('settingsStatus').textContent = 'تم حفظ اللغة.';
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
  if (typeof window.VELOVI_FINANCE_CHART === 'function') { window.VELOVI_FINANCE_CHART(); return; }
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

const permissionDialog = getElement('permissionDialog');
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
  const type = row.dataset.type || (typeText.includes('إيراد') ? 'income' : typeText.includes('مصروف') ? 'expense' : 'other');
  const date = row.dataset.date || normalizeDate(cells[3]?.textContent.trim() || '');
  const amountText = cells[4]?.textContent || '';
  const parsedAmount = parseAmount(amountText);
  const amount = row.dataset.amount !== undefined ? Number(row.dataset.amount) : parsedAmount;
  const hasNegativeSign = /[−-]/.test(amountText);
  const signedAmount = row.dataset.signedAmount !== undefined
    ? Number(row.dataset.signedAmount)
    : (hasNegativeSign ? -Math.abs(amount) : (type === 'expense' ? -Math.abs(amount) : Math.abs(amount)));
  row.dataset.type = type;
  row.dataset.category = row.dataset.category || cells[1]?.textContent.trim() || '';
  row.dataset.description = row.dataset.description || cells[2]?.textContent.trim() || '';
  row.dataset.date = date;
  row.dataset.amount = String(Math.abs(amount));
  row.dataset.signedAmount = String(signedAmount);
  const currency = row.dataset.currency || localStorage.getItem('velovi-currency') || 'EUR';
  row.dataset.currency = currency;
  return { type, category: row.dataset.category, description: row.dataset.description, date, amount: Math.abs(amount), signedAmount, currency };
}
function compareRows(a, b) {
  const x = getRowData(a), y = getRowData(b);
  let result = 0;
  if (sortKey === 'amount') {
    const left = x.type === 'expense' ? Math.abs(x.signedAmount) : x.signedAmount;
    const right = y.type === 'expense' ? Math.abs(y.signedAmount) : y.signedAmount;
    result = left - right;
  }
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
  const totals = new Map();
  let count = 0;
  rows.forEach(row => {
    const d = getRowData(row);
    const amountText = d.amount.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const amountDigits = String(d.amount);
    const normalizedQuery = query.replace(/\s/g, '').replace(',', '.');
    const numericQuery = normalizedQuery && /^-?\d+(\.\d*)?$/.test(normalizedQuery);
    const amountQuery = normalizedQuery.replace(/^-/, '');
    const matchesSearch = !query ||
      row.textContent.toLocaleLowerCase().includes(query) ||
      (numericQuery && (amountDigits.includes(amountQuery) ||
        amountText.replace(/\./g, '').replace(',', '.').includes(amountQuery)));
    const matches = matchesSearch &&
      (selectedType === 'all' || d.type === selectedType) &&
      (!from || (d.date && d.date >= from)) &&
      (!to || (d.date && d.date <= to));
    row.hidden = !matches;
    if (matches) {
      count++;
      if (d.type === 'income' || d.type === 'expense') {
        const previous = totals.get(d.currency) || 0;
        totals.set(d.currency, previous + (d.type === 'income' ? d.amount : -d.amount));
      }
    }
  });
  rows.sort(compareRows).forEach(row => rowsContainer.appendChild(row));
  if (netElement) {
    const entries = [...totals.entries()];
    netElement.textContent = entries.length
      ? entries.map(([currency, value]) => {
          try { return new Intl.NumberFormat(root.lang || navigator.language || 'de-DE', { style: 'currency', currency, maximumFractionDigits: 2 }).format(value); }
          catch { return value.toFixed(2) + ' ' + currency; }
        }).join(' · ')
      : '—';
    netElement.classList.toggle('positive', entries.length === 1 && entries[0][1] > 0);
    netElement.classList.toggle('negative', entries.length === 1 && entries[0][1] < 0);
    netElement.classList.toggle('neutral', entries.length !== 1 || entries[0]?.[1] === 0);
  }
  if (countElement) countElement.textContent = String(count);
  const empty = getElement('transactionsEmpty');
  if (empty) empty.hidden = count !== 0;
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

// Transaction and account writes are handled by auth.js after a verified Supabase session is loaded.

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
  const balance = Number(balanceRaw.replace(/\s/g, '').replace(',', '.'));
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
  result.dataset.numericValue = String(future);
  result.replaceChildren(document.createTextNode(`الرصيد الحسابي الافتراضي بعد ${months} شهراً: `));
  const value = document.createElement('b');
  value.textContent = formatPreferredCurrency(future);
  result.appendChild(value);
  result.classList.toggle('negative', future < 0);
  result.classList.toggle('positive', future > 0);
});

const chooseFileButton = getElement('chooseFile');
const fileInput = getElement('fileInput');
const fileName = getElement('fileName');
const importProgress = getElement('importProgress');
const importProgressBar = getElement('importProgressBar');
const importStatus = getElement('importStatus');
const importRowsBody = getElement('importRows');
const importRawText = getElement('importRawText');
const importPreview = getElement('importPreview');
const importEmpty = getElement('importEmpty');
const importCount = getElement('importCount');
let extractedImportRows = [];
addListener(chooseFileButton, 'click', () => fileInput?.click());
function setImportProgress(message, percent = 0, visible = true) { if (importProgress) importProgress.hidden = !visible; if (importStatus) importStatus.textContent = message; if (importProgressBar) importProgressBar.style.width = Math.max(0,Math.min(100,percent)) + '%'; }
function normalizeStatementDate(raw) {
  if (!raw) return ''; const iso = raw.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (iso) return iso[1] + '-' + iso[2].padStart(2,'0') + '-' + iso[3].padStart(2,'0');
  const local = raw.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/); if (!local) return '';
  let year = Number(local[3]); if (year < 100) year += year < 70 ? 2000 : 1900;
  return year + '-' + local[2].padStart(2,'0') + '-' + local[1].padStart(2,'0');
}
function parseStatementNumber(raw) {
  let value = String(raw || '').replace(/[−–]/g,'-').replace(/[^\d,.-]/g,''); const negative = value.includes('-'); value = value.replace(/-/g,'');
  const comma = value.lastIndexOf(','), dot = value.lastIndexOf('.');
  if (comma >= 0 && dot >= 0) { const decimal = comma > dot ? ',' : '.'; value = decimal === ',' ? value.replace(/\./g,'').replace(',','.') : value.replace(/,/g,''); }
  else if (comma >= 0) value = value.replace(/\./g,'').replace(',','.');
  else if ((value.match(/\./g)||[]).length > 1) { const parts=value.split('.'); const decimal=parts.pop(); value=parts.join('')+'.'+decimal; }
  const number=Number(value); return Number.isFinite(number) ? (negative ? -number : number) : null;
}
function inferStatementCategory(description, type) {
  const value=String(description||'').toLowerCase();
  const rules=[
    [/miete|rent|wohnung|hausgeld|housing|landlord/,'السكن'],
    [/supermarkt|lebensmittel|rewe|aldi|lidl|edeka|food|grocery|market/,'الطعام'],
    [/tankstelle|shell|aral|fuel|benzin|diesel|bus|bahn|db |transport|uber/,'المواصلات'],
    [/strom|energie|wasser|gas|internet|telekom|vodafone|utility|electric/,'فواتير المنزل'],
    [/versicherung|insurance|krankenkasse/,'التأمين'],
    [/gehalt|lohn|salary|wage|arbeitgeber/,'الراتب'],
    [/amazon|online|shop|kauf|bestellung/,'التسوق']
  ];
  for(const [pattern,category] of rules)if(pattern.test(value))return category;
  return type==='income'?'دخل آخر':'مصروفات أخرى';
}
function parseStatementLines(text) {
  const amountPattern=/[+\-−]?\s*(?:\d{1,3}(?:[.,\s]\d{3})+|\d+)[,.]\d{2}(?!\d)/g;
  const datePattern=/\b(?:\d{4}[./-]\d{1,2}[./-]\d{1,2}|\d{1,2}[./-]\d{1,2}[./-]\d{2,4})\b/;
  const ignored=/(anfangs?saldo|endsaldo|kontostand|neuer saldo|alter saldo|gesamt|summe|übertrag|saldo vortrag|opening balance|closing balance|balance brought forward)/i; const rows=[];
  for (const rawLine of String(text||'').split(/\r?\n/)) {
    const line=rawLine.replace(/\s+/g,' ').trim(); if(!line||ignored.test(line)) continue;
    const dateMatch=line.match(datePattern); if(!dateMatch) continue;
    const lineWithoutDate=line.replace(dateMatch[0],' ');
    const amounts=[...lineWithoutDate.matchAll(amountPattern)]; if(!amounts.length) continue;
    const chosen=amounts[0], signedAmount=parseStatementNumber(chosen[0]); if(signedAmount===null||Math.abs(signedAmount)<0.0001) continue;
    const date=normalizeStatementDate(dateMatch[0]); if(!date) continue;
    let description=lineWithoutDate.replace(chosen[0],' ').replace(/\s+/g,' ').trim(); description=description.replace(/^[|:;\-–\s]+|[|:;\-–\s]+$/g,'');
    if(description.length<2) description='حركة مستخرجة من الكشف';
    const expenseHint=/(lastschrift|abbuchung|kartenzahlung|belastung|miete|rechnung|payment|debit|withdrawal)/i.test(line);
    const incomeHint=/(gehalt|lohn|gutschrift|eingang|erstattung|credit|salary|deposit)/i.test(line);
    const type=signedAmount<0||expenseHint?'expense':incomeHint?'income':'income';
    rows.push({id:rows.length+1,selected:true,date,description:description.slice(0,180),category:inferStatementCategory(description,type),type,amount:Math.abs(signedAmount)});
  }
  const unique=new Map(); for(const row of rows){const key=row.date+'|'+row.description.toLowerCase()+'|'+row.amount.toFixed(2)+'|'+row.type;if(!unique.has(key))unique.set(key,row);} return [...unique.values()];
}
function updateImportCount(){const count=extractedImportRows.filter(row=>row.selected).length;if(importCount)importCount.textContent=count+' من '+extractedImportRows.length+' حركة';const save=getElement('saveImportedRows');if(save)save.disabled=count===0||!getElement('importAccount')?.value||save.dataset.ready!=='true';const download=getElement('downloadImportCsv');if(download)download.disabled=count===0;}
function renderImportRows(){
  if(!importRowsBody)return; importRowsBody.replaceChildren();
  extractedImportRows.forEach(item=>{
    const tr=document.createElement('tr'),selectedCell=document.createElement('td'),selected=document.createElement('input');
    selected.type='checkbox';selected.checked=item.selected;selected.setAttribute('aria-label','اعتماد هذه الحركة');selected.addEventListener('change',()=>{item.selected=selected.checked;updateImportCount();});selectedCell.appendChild(selected);
    const dateCell=document.createElement('td'),date=document.createElement('input');date.type='date';date.value=item.date;date.addEventListener('change',()=>{item.date=date.value;});dateCell.appendChild(date);
    const descCell=document.createElement('td'),desc=document.createElement('input');desc.type='text';desc.value=item.description;desc.maxLength=180;desc.addEventListener('input',()=>{item.description=desc.value;});descCell.appendChild(desc);
    const categoryCell=document.createElement('td'),category=document.createElement('input');category.type='text';category.value=item.category||inferStatementCategory(item.description,item.type);category.maxLength=80;category.addEventListener('input',()=>{item.category=category.value;});categoryCell.appendChild(category);
    const typeCell=document.createElement('td'),type=document.createElement('select');[['income','إيراد'],['expense','مصروف']].forEach(pair=>{const option=document.createElement('option');option.value=pair[0];option.textContent=pair[1];type.appendChild(option);});type.value=item.type;type.addEventListener('change',()=>{item.type=type.value;});typeCell.appendChild(type);
    const amountCell=document.createElement('td'),amount=document.createElement('input');amount.type='number';amount.min='0.01';amount.step='0.01';amount.value=item.amount.toFixed(2);amount.inputMode='decimal';amount.addEventListener('change',()=>{item.amount=Number(amount.value)||0;});amountCell.appendChild(amount);
    tr.append(selectedCell,dateCell,descCell,categoryCell,typeCell,amountCell);importRowsBody.appendChild(tr);
  });
  if(importPreview)importPreview.hidden=!extractedImportRows.length;if(importEmpty)importEmpty.hidden=!!extractedImportRows.length;updateImportCount();
}
function tesseractLogger(message){if(!message||!importProgressBar)return;const percent=message.progress?Math.round(message.progress*100):0;const labels={'loading tesseract core':'تحميل محرك قراءة الصور...','initializing tesseract':'تهيئة محرك القراءة...','loading language traineddata':'تحميل بيانات اللغة...','initializing api':'تجهيز القراءة...','recognizing text':'قراءة النص من الصورة...'};setImportProgress(labels[message.status]||'جارٍ تحليل الملف...',percent);}
async function recognizeImage(source){if(!window.Tesseract||typeof window.Tesseract.recognize!=='function')throw new Error('تعذر تحميل محرك OCR. تحقق من اتصال الإنترنت ثم أعد المحاولة.');const result=await window.Tesseract.recognize(source,'deu+eng+ara',{logger:tesseractLogger});return result?.data?.text||'';}
async function pdfPageText(page){const content=await page.getTextContent(),buckets=new Map();for(const item of content.items||[]){if(!item.str||!item.str.trim())continue;const y=Math.round(item.transform?.[5]||0);buckets.set(String(y),[...(buckets.get(String(y))||[]),item.str]);}return [...buckets.entries()].sort((a,b)=>Number(b[0])-Number(a[0])).map(entry=>entry[1].join(' ')).join('\n');}
async function recognizePdf(file){
  if(!window.pdfjsLib)throw new Error('تعذر تحميل قارئ PDF. تحقق من اتصال الإنترنت.');window.pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  const pdf=await window.pdfjsLib.getDocument({data:await file.arrayBuffer()}).promise;if(pdf.numPages>15)throw new Error('الملف يحتوي على أكثر من 15 صفحة. قسّمه إلى ملفات أصغر ثم أعد المحاولة.');let combined='';
  for(let n=1;n<=pdf.numPages;n++){setImportProgress('قراءة صفحة PDF '+n+' من '+pdf.numPages+'...',Math.round((n-1)/pdf.numPages*100));const page=await pdf.getPage(n);let pageText=await pdfPageText(page);
    if(pageText.replace(/\s/g,'').length<35){const viewport=page.getViewport({scale:1.5}),canvas=document.createElement('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);await page.render({canvasContext:canvas.getContext('2d',{willReadFrequently:true}),viewport}).promise;pageText=await recognizeImage(canvas);canvas.width=0;canvas.height=0;}
    combined+='\n'+pageText+'\n';setImportProgress('اكتملت قراءة الصفحة '+n+' من '+pdf.numPages+'.',Math.round(n/pdf.numPages*100));
  }return combined;
}
async function processImportFile(file){
  if(!file)return;if(file.size>20*1024*1024){setImportProgress('حجم الملف أكبر من 20 ميغابايت. اختر ملفاً أصغر.',0);return;}
  extractedImportRows=[];renderImportRows();if(fileName)fileName.textContent=file.name+' · '+(file.size/1024/1024).toFixed(2)+' MB';if(importRawText)importRawText.textContent='';setImportProgress('جارٍ تجهيز الملف...',2);
  try{let text='';if(file.type==='application/pdf'||/\.pdf$/i.test(file.name))text=await recognizePdf(file);else if(/image\/(jpeg|png)/i.test(file.type)||/\.(jpe?g|png)$/i.test(file.name))text=await recognizeImage(file);else throw new Error('الصيغ المدعومة حالياً: PDF وJPG وPNG.');
    if(importRawText)importRawText.textContent=text||'لم يتم استخراج نص من الملف.';extractedImportRows=parseStatementLines(text);renderImportRows();
    if(extractedImportRows.length)setImportProgress('تم استخراج '+extractedImportRows.length+' حركة محتملة. راجع البيانات قبل استخدامها.',100);else setImportProgress('تمت قراءة الملف، لكن لم تُكتشف حركات واضحة. راجع النص المستخرج أو جرّب نسخة أوضح.',100);
  }catch(error){console.error('Velovi import error:',error);setImportProgress(error.message||'تعذرت قراءة الملف.',0);}
}
addListener(fileInput,'change',event=>processImportFile(event.target.files?.[0]));
addListener(getElement('importAccount'),'change',updateImportCount);
addListener(getElement('cameraInput'),'change',event=>processImportFile(event.target.files?.[0]));
addListener(getElement('captureFile'),'click',()=>getElement('cameraInput')?.click());
window.VELOVI_IMPORT = {
  getSelectedRows: () => extractedImportRows.filter(row => row.selected).map(row => ({...row})),
  clear: () => { extractedImportRows = []; renderImportRows(); if (fileName) fileName.textContent = 'تم حفظ الحركات المستخرجة.'; },
  setStatus: (message, isError = false) => { const note = getElement('importSaveNote'); if (note) { note.textContent = message; note.classList.toggle('error', isError); } }};
addListener(getElement('downloadImportCsv'),'click',()=>{const rows=extractedImportRows.filter(row=>row.selected&&row.date&&row.description&&row.amount>0);if(!rows.length)return;const esc=value=>'"'+String(value??'').replace(/"/g,'""')+'"';const csv=['date,type,description,category,amount',...rows.map(row=>[row.date,row.type,row.description,row.category||'',row.amount.toFixed(2)].map(esc).join(','))].join('\r\n');const blob=new Blob(['\uFEFF',csv],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='velovi-import-review.csv';link.click();URL.revokeObjectURL(url);});

const scanCodeButton = getElement('scanCodeButton');
const barcodeDialog = getElement('barcodeDialog');
const barcodeVideo = getElement('barcodeVideo');
let barcodeStream = null;
let barcodeFrame = 0;
let barcodeDetector = null;
function stopBarcodeScanner() {
  if (barcodeFrame) cancelAnimationFrame(barcodeFrame);
  barcodeFrame = 0;
  if (barcodeStream) barcodeStream.getTracks().forEach(track => track.stop());
  barcodeStream = null;
  if (barcodeVideo) barcodeVideo.srcObject = null;
}
addListener(getElement('closeBarcodeDialog'),'click',()=>{stopBarcodeScanner();barcodeDialog?.close();});
addListener(barcodeDialog,'close',stopBarcodeScanner);
addListener(scanCodeButton,'click',async()=>{
  if (!('BarcodeDetector' in window) || !navigator.mediaDevices?.getUserMedia) {
    alert('مسح QR والباركود المباشر غير مدعوم في هذا المتصفح. يمكنك استخدام التقاط صورة أو اختيار ملف.');
    return;
  }
  try {
    const supported = await BarcodeDetector.getSupportedFormats();
    const formats = ['qr_code','code_128','code_39','ean_13','ean_8','upc_a','upc_e','itf'].filter(format => supported.includes(format));
    if (!formats.length) throw new Error('لا توجد صيغ QR أو باركود مدعومة في هذا المتصفح.');
    barcodeDetector = new BarcodeDetector({formats});
    barcodeStream = await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false});
    barcodeVideo.srcObject = barcodeStream;
    await barcodeVideo.play();
    barcodeDialog.showModal();
    const scan = async () => {
      if (!barcodeStream || !barcodeVideo || barcodeVideo.readyState < 2) return;
      try {
        const codes = await barcodeDetector.detect(barcodeVideo);
        if (codes.length) {
          const value = codes[0].rawValue || '';
          const result = getElement('barcodeResult');
          if (result) result.textContent = 'تمت قراءة الرمز: ' + value;
          const description = getElement('txDesc');
          if (description && !description.value) description.value = value;
          stopBarcodeScanner();
          return;
        }
      } catch (error) { console.warn('Barcode scan:',error); }
      barcodeFrame = requestAnimationFrame(scan);
    };
    barcodeFrame = requestAnimationFrame(scan);
  } catch (error) {
    stopBarcodeScanner();
    alert('تعذر تشغيل الكاميرا. تحقق من إذن الكاميرا واستخدم اتصال HTTPS.');
  }
});

if ('serviceWorker' in navigator && /^https?:$/.test(window.location.protocol)) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(error => console.error('تعذر تسجيل Service Worker:', error)));
}
