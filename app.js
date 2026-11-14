
'use strict';

/* =========================================
   Velovi - واجهة التطبيق التجريبية
   لا يتم حفظ البيانات المالية أو مزامنتها حالياً
========================================= */

/* أدوات مساعدة */
const getElement = (id) => document.getElementById(id);

const addListener = (element, event, callback) => {
  if (element) {
    element.addEventListener(event, callback);
  }
};

/* =========================================
   التنقل بين صفحات التطبيق
========================================= */

const views = [...document.querySelectorAll('.view')];
const navItems = [...document.querySelectorAll('.nav-item')];

function showView(id) {
  const target = getElement(id);

  if (!target || !target.classList.contains('view')) {
    return;
  }

  views.forEach(view => {
    view.classList.toggle('active', view.id === id);
  });

  navItems.forEach(button => {
    button.classList.toggle('active', button.dataset.view === id);
  });

  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}

navItems.forEach(button => {
  addListener(button, 'click', () => {
    showView(button.dataset.view);
  });
});

document.querySelectorAll('[data-goto]').forEach(button => {
  addListener(button, 'click', () => {
    showView(button.dataset.goto);
  });
});

/* =========================================
   نوافذ الحوار
========================================= */

const txDialog = getElement('transactionDialog');
const permissionDialog = getElement('permissionDialog');

document.querySelectorAll('[data-open-add]').forEach(button => {
  addListener(button, 'click', () => {
    if (txDialog && typeof txDialog.showModal === 'function') {
      txDialog.showModal();
    }
  });
});

document.querySelectorAll('[data-permission]').forEach(button => {
  addListener(button, 'click', () => {
    if (
      permissionDialog &&
      typeof permissionDialog.showModal === 'function'
    ) {
      permissionDialog.showModal();
    }
  });
});

/* =========================================
   إضافة حركة مالية تجريبية
========================================= */

const transactionForm = getElement('transactionForm');

addListener(transactionForm, 'submit', event => {

  // السماح بزر الإلغاء بإغلاق النافذة بشكل طبيعي
  if (event.submitter?.value === 'cancel') {
    return;
  }

  event.preventDefault();

  const description = getElement('txDesc')?.value.trim() || '';
  const amount = Number(getElement('txAmount')?.value);
  const date = getElement('txDate')?.value || '';
  const type = getElement('txType')?.value || 'expense';
  const category = getElement('txCategory')?.value.trim() || 'غير مصنف';

  const rows = getElement('txRows');

  if (!rows) {
    alert('تعذر العثور على جدول الحركات.');
    return;
  }

  if (!description || !date || !Number.isFinite(amount) || amount <= 0) {
    alert('يرجى إدخال وصف صحيح ومبلغ أكبر من صفر وتاريخ الحركة.');
    return;
  }

  if (!['income', 'expense'].includes(type)) {
    alert('نوع الحركة غير صحيح.');
    return;
  }

  // إنشاء صف جديد بطريقة آمنة
  const row = document.createElement('tr');

  const descriptionCell = document.createElement('td');
  descriptionCell.textContent = description;

  const categoryCell = document.createElement('td');
  categoryCell.textContent = category;

  const dateCell = document.createElement('td');

  const parsedDate = new Date(`${date}T12:00:00`);

  dateCell.textContent = Number.isNaN(parsedDate.getTime())
    ? date
    : parsedDate.toLocaleDateString('de-DE');

  const typeCell = document.createElement('td');
  const typeBadge = document.createElement('span');

  typeBadge.classList.add('pill');

  if (type === 'income') {
    typeBadge.classList.add('green');
    typeBadge.textContent = 'إيراد';
  } else {
    typeBadge.classList.add('red');
    typeBadge.textContent = 'مصروف';
  }

  typeCell.appendChild(typeBadge);

  const amountCell = document.createElement('td');
  const sign = type === 'income' ? '+' : '−';

  if (type === 'income') {
    amountCell.classList.add('positive');
  }

  amountCell.textContent =
    `${sign}${amount.toLocaleString('de-DE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })} €`;

  row.append(
    descriptionCell,
    categoryCell,
    dateCell,
    typeCell,
    amountCell
  );

  rows.prepend(row);

  if (txDialog) {
    txDialog.close();
  }

  transactionForm.reset();

  alert(
    'أضيفت الحركة إلى العرض التجريبي فقط. ' +
    'لن تُحفظ بعد إغلاق الصفحة.'
  );
});

/* =========================================
   البحث في الحركات المالية
========================================= */

const searchInput = getElement('searchTx');

addListener(searchInput, 'input', event => {
  const query = event.target.value.trim().toLocaleLowerCase();

  document.querySelectorAll('#txRows tr').forEach(row => {
    const content = row.textContent.toLocaleLowerCase();

    row.hidden = !content.includes(query);
  });
});

/* =========================================
   حاسبة التوقعات المالية
========================================= */

const forecastButton = getElement('calcForecast');

addListener(forecastButton, 'click', () => {

  const forecastInputs = document.querySelectorAll(
    '#reports .form-grid input'
  );

  const resultElement = getElement('forecastResult');

  if (forecastInputs.length < 4 || !resultElement) {
    alert('تعذر قراءة بيانات التوقعات.');
    return;
  }

  const balance = Number(forecastInputs[0].value);
  const monthlySurplus = Number(forecastInputs[1].value);
  const years = Number(getElement('years')?.value);
  const annualRate = Number(forecastInputs[3].value);

  if (
    !Number.isFinite(balance) ||
    !Number.isFinite(monthlySurplus) ||
    !Number.isFinite(years) ||
    !Number.isFinite(annualRate) ||
    years < 1 ||
    years > 100
  ) {
    alert('يرجى إدخال قيم صحيحة، وعدد سنوات بين 1 و100.');
    return;
  }

  if (annualRate <= -100 || annualRate > 100) {
    alert('يرجى إدخال عائد سنوي أكبر من -100% ولا يتجاوز 100%.');
    return;
  }

  const months = Math.round(years * 12);
  const monthlyRate = Math.pow(
    1 + annualRate / 100,
    1 / 12
  ) - 1;

  let futureBalance = balance;

  for (let month = 0; month < months; month++) {
    futureBalance = futureBalance * (1 + monthlyRate);
    futureBalance += monthlySurplus;
  }

  const formattedBalance = futureBalance.toLocaleString('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  // تحديث النتيجة دون إدخال HTML من المستخدم
  resultElement.replaceChildren();

  const label = document.createTextNode(
    `الرصيد المتوقع بعد ${years} سنوات: `
  );

  const value = document.createElement('b');
  value.textContent = `${formattedBalance} €`;

  resultElement.append(label, value);
});

/* =========================================
   اختيار ملف كشف الحساب البنكي
========================================= */

const chooseFileButton = getElement('chooseFile');
const fileInput = getElement('fileInput');
const fileName = getElement('fileName');

addListener(chooseFileButton, 'click', () => {
  if (fileInput) {
    fileInput.click();
  }
});

addListener(fileInput, 'change', event => {
  const file = event.target.files?.[0];

  if (fileName) {
    fileName.textContent = file
      ? file.name
      : 'لم يتم اختيار ملف';
  }

  if (file) {
    alert(
      'تم اختيار الملف بنجاح.\n' +
      'ملاحظة: قراءة محتوى كشف الحساب واستيراد الحركات ' +
      'ليسا مفعّلين بعد.'
    );
  }
});

/* =========================================
   دعوة أعضاء الأسرة
========================================= */

const inviteMemberButton = getElement('inviteMember');

addListener(inviteMemberButton, 'click', () => {
  alert(
    'سيتم تفعيل دعوات أفراد الأسرة عبر البريد الإلكتروني ' +
    'بعد ربط نظام الحسابات وقاعدة البيانات.'
  );
});

/* =========================================
   إضافة حساب مالي
========================================= */

const addAccountButton = getElement('addAccount');

addListener(addAccountButton, 'click', () => {
  alert(
    'سيتم تفعيل إضافة الحسابات وإدارتها ' +
    'بعد ربط قاعدة البيانات.'
  );
});

/* =========================================
   تسجيل Service Worker
========================================= */

if (
  'serviceWorker' in navigator &&
  window.location.protocol.startsWith('http')
) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js')
      .catch(error => {
        console.error(
          'تعذر تسجيل Service Worker:',
          error
        );
      });
  });
}
