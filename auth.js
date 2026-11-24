'use strict';

(() => {
  const $ = id => document.getElementById(id);
  const gate = $('authGate');
  const shell = document.querySelector('.shell');
  const loginPanel = $('loginPanel');
  const createPanel = $('createHouseholdPanel');
  const message = $('authMessage');
  const config = window.VELOVI_SUPABASE_CONFIG || {};
  let client = null;
  let currentUser = null;
  let currentMembership = null;
  let currentHousehold = null;
  let currentMembers = [];
  let currentAccounts = [];
  let currentTransactions = [];
  let workspaceLoadPromise = null;
  let mfaLoginFactorId = null;
  let mfaLoginChallengeId = null;
  let mfaEnrollmentFactorId = null;
  let inviteSetupCompleted = false;

  function isInviteSetupFlow(user = currentUser) {
    return !!user?.invited_at &&
      user?.user_metadata?.velovi_password_setup_complete !== true;
  }

  function withRequestTimeout(promise, operation, timeoutMs = 20000) {
    let timer;
    return Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = window.setTimeout(() => reject(new Error('انتهت مهلة الاتصال أثناء ' + operation + '. تحقق من الإنترنت وحاول إعادة التحميل.')), timeoutMs);
      })
    ]).finally(() => window.clearTimeout(timer));
  }

  function setMessage(text, isError) {
    const inApp = !!(shell && shell.classList.contains('is-authenticated'));
    const target = inApp ? $('appMessage') : message;
    const other = inApp ? message : $('appMessage');
    if (other) {
      other.hidden = true;
      other.textContent = '';
    }
    if (!target) return;
    target.textContent = text || '';
    target.hidden = !text;
    target.classList.toggle('error', !!isError);
    target.classList.toggle('success', !!text && !isError);
  }

  function showGate(panel) {
    if (shell) { shell.classList.remove('is-authenticated'); delete shell.dataset.userId; }
    if (gate) gate.hidden = false;
    if (loginPanel) loginPanel.hidden = panel !== 'login';
    if (createPanel) createPanel.hidden = panel !== 'create';
    if ($('mfaLoginPanel')) $('mfaLoginPanel').hidden = panel !== 'mfa';
    if ($('inviteSetupPanel')) $('inviteSetupPanel').hidden = panel !== 'invite-setup';
  }

  function showApp() {
    if (gate) gate.hidden = true;
    if (shell) {
      shell.classList.add('is-authenticated');
      if (currentUser?.id) shell.dataset.userId = currentUser.id;
    }
    window.dispatchEvent(new Event('velovi:authenticated'));
  }

  function emptyState(text) {
    const el = document.createElement('div');
    el.className = 'empty-state';
    el.textContent = text;
    return el;
  }

  function clearDemoData() {
    document.querySelectorAll('#home .stat strong, #accounts .stat strong').forEach(el => { el.textContent = '—'; });
    document.querySelectorAll('#home .stat small').forEach(el => { el.textContent = 'جارٍ تحميل البيانات الفعلية'; });
    const txList = document.querySelector('#home .transaction-list');
    if (txList) txList.replaceChildren(emptyState('لا توجد حركات مالية مسجلة بعد.'));
    const chart = $('expenseChart');
    if (chart) { chart.classList.remove('bars'); chart.style.removeProperty('background'); chart.replaceChildren(); }
    const legend = document.querySelector('#home .legend');
    if (legend) legend.replaceChildren();
    const txRows = $('txRows');
    if (txRows) txRows.replaceChildren();
    const txEmpty = $('transactionsEmpty');
    if (txEmpty) txEmpty.hidden = false;
    const accountStats = $('accountStats');
    if (accountStats) accountStats.replaceChildren();
    const accountList = $('accountList');
    if (accountList) accountList.replaceChildren(emptyState('جارٍ تحميل الحسابات...'));
    const homeNotice = document.querySelector('#home .notice');
    if (homeNotice) {
      const b = homeNotice.querySelector('b');
      const p = homeNotice.querySelector('p');
      if (b) b.textContent = 'تم الاتصال بحساب الأسرة';
      if (p) p.textContent = 'تُحمّل الحسابات والحركات من قاعدة البيانات المشتركة بشكل آمن.';
    }
  }

  function setHeader(householdName, displayName) {
    const sync = document.querySelector('.sync');
    if (sync) {
      sync.textContent = 'متصل · ' + householdName;
      const dot = document.createElement('i');
      dot.style.background = '#23815c';
      sync.prepend(dot);
    }
    const signOut = $('signOutButton');
    if (signOut) signOut.hidden = false;
    const familyName = document.querySelector('.family-card b');
    const familySub = document.querySelector('.family-card small');
    if (familyName) familyName.textContent = householdName;
    if (familySub) familySub.textContent = 'المساحة العائلية';
    const securityTitle = document.querySelector('.security b');
    const securityText = document.querySelector('.security small');
    if (securityTitle) securityTitle.textContent = 'اتصال الأسرة';
    if (securityText) securityText.textContent = 'البيانات محمية بسياسات RLS';
  }

  function renderMembers(members, membership) {
    const panel = document.querySelector('#members .panel');
    const invite = $('inviteMember');
    if (!panel) return;
    panel.replaceChildren();
    const isAdmin = membership.role === 'admin';
    if (invite) invite.hidden = !isAdmin;

    members.forEach(member => {
      const row = document.createElement('div');
      row.className = 'member-row';

      const person = document.createElement('div');
      person.className = 'person';

      const avatar = document.createElement('span');
      avatar.className = 'person-avatar';
      avatar.textContent = (member.display_name || '؟').trim().charAt(0);

      const details = document.createElement('div');
      const name = document.createElement('b');
      name.textContent = member.display_name || 'عضو';
      const sub = document.createElement('small');
      sub.textContent = !member.user_id
        ? 'حساب محذوف · السجل المالي محفوظ'
        : member.user_id === currentUser.id
          ? (member.role === 'admin' ? 'أنت · مدير الأسرة' : 'أنت · عضو الأسرة')
          : (member.role === 'admin' ? 'مدير الأسرة' : 'عضو الأسرة');
      if (!member.is_active && member.user_id) sub.textContent += ' · عضوية غير نشطة';
      details.append(name, sub);
      person.append(avatar, details);
      row.appendChild(person);

      const role = document.createElement('span');
      role.className = member.role === 'admin' ? 'pill green' : 'pill';
      role.textContent = member.role === 'admin' ? 'مدير' : 'عضو';
      row.appendChild(role);

      if (member.role === 'member') {
        const perms = document.createElement('div');
        perms.className = 'permission-summary';
        perms.textContent = member.is_active
          ? 'إضافة ' + (member.can_add_transactions ? '✓' : '✕') +
            '　 تعديل ' + (member.can_edit_transactions ? '✓' : '✕') +
            '　 حذف ' + (member.can_delete_transactions ? '✓' : '✕') +
            '　 رؤية حسابات الآخرين ' + (member.can_view_other_accounts ? '✓' : '✕')
          : 'غير نشط';
        row.appendChild(perms);

        if (isAdmin) {
          const actions = document.createElement('div');
          actions.className = 'member-actions';
          if (member.is_active) {
            const edit = document.createElement('button');
            edit.type = 'button';
            edit.className = 'secondary';
            edit.textContent = 'تعديل الصلاحيات';
            edit.addEventListener('click', () => openPermissionDialog(member));
            actions.appendChild(edit);

            const remove = document.createElement('button');
            remove.type = 'button';
            remove.className = 'text-btn danger-text';
            remove.textContent = 'إلغاء عضوية العضو';
            remove.addEventListener('click', () => removeMember(member));
            actions.appendChild(remove);
          } else if (member.user_id) {
            const reactivate = document.createElement('button');
            reactivate.type = 'button';
            reactivate.className = 'secondary';
            reactivate.textContent = 'إعادة التفعيل';
            reactivate.addEventListener('click', () => {
              $('memberUserId').value = member.user_id || '';
              $('memberDisplayName').value = member.display_name || '';
              $('addMemberDialog').showModal();
            });
            actions.appendChild(reactivate);
          }
          if (member.user_id) {
            const permanentDelete = document.createElement('button');
            permanentDelete.type = 'button';
            permanentDelete.className = 'text-btn danger-text';
            permanentDelete.textContent = 'حذف العضو وبياناته نهائياً';
            permanentDelete.addEventListener('click', () => permanentlyDeleteMember(member));
            actions.appendChild(permanentDelete);
          }
          row.appendChild(actions);
        }
      }
      panel.appendChild(row);
    });

    if (!members.length) panel.appendChild(emptyState('لا توجد عضويات في هذه الأسرة.'));
  }

  function openPermissionDialog(member) {
    const dialog = $('permissionDialog');
    if (!dialog) return;
    dialog.dataset.memberId = member.id;
    $('permissionAdd').checked = !!member.can_add_transactions;
    $('permissionEdit').checked = !!member.can_edit_transactions;
    $('permissionDelete').checked = !!member.can_delete_transactions;
    $('permissionViewAccounts').checked = !!member.can_view_other_accounts;
    dialog.showModal();
  }

  async function refreshMembers() {
    const result = await client
      .from('household_members')
      .select('id, household_id, user_id, display_name, role, is_active, can_add_transactions, can_edit_transactions, can_delete_transactions, can_view_other_accounts')
      .eq('household_id', currentMembership.household_id)
      .order('display_name', { ascending: true });
    if (result.error) throw result.error;
    currentMembers = result.data || [];
    currentMembership = currentMembers.find(member => member.id === currentMembership.id) || currentMembership;
    renderMembers(currentMembers, currentMembership);
  }


  function canAddTransactions() {
    return currentMembership?.role === 'admin' || currentMembership?.can_add_transactions === true;
  }
  function canEditTransactions(transaction) {
    return currentMembership?.role === 'admin' ||
      (transaction.owner_member_id === currentMembership?.id && currentMembership?.can_edit_transactions === true);
  }
  function canDeleteTransactions(transaction) {
    return currentMembership?.role === 'admin' ||
      (transaction.owner_member_id === currentMembership?.id && currentMembership?.can_delete_transactions === true);
  }
  function formatMoney(value, currency) {
    const amount = Number(value) || 0;
    try {
      return new Intl.NumberFormat(navigator.language || 'de-DE', {
        style: 'currency', currency: currency || 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2
      }).format(amount);
    } catch {
      return amount.toFixed(2) + ' ' + (currency || 'EUR');
    }
  }
  function parseMoney(value) {
    let raw = String(value ?? '').trim().replace(/\s/g, '').replace(/[€$£]/g, '');
    if (!raw) return NaN;
    const comma = raw.lastIndexOf(','), dot = raw.lastIndexOf('.');
    if (comma >= 0 && dot >= 0) {
      raw = comma > dot ? raw.replace(/\./g, '').replace(',', '.') : raw.replace(/,/g, '');
    } else if (comma >= 0) raw = raw.replace(/\./g, '').replace(',', '.');
    const result = Number(raw);
    return Number.isFinite(result) ? result : NaN;
  }
  function accountTypeLabel(type) {
    return ({bank:'حساب بنكي',savings:'مدخرات',cash:'نقد',other:'أخرى'})[type] || type || 'حساب';
  }
  function memberName(memberId) {
    return currentMembers.find(member => member.id === memberId)?.display_name || 'عضو الأسرة';
  }
  function visibleAccountsForWriting() {
    return currentAccounts.filter(account => account.is_active &&
      (currentMembership.role === 'admin' || account.owner_member_id === currentMembership.id));
  }
  function fillAccountSelect(select, accounts, placeholder) {
    if (!select) return;
    const previous = select.value;
    select.replaceChildren();
    const first = document.createElement('option');
    first.value = '';
    first.textContent = placeholder;
    select.appendChild(first);
    accounts.forEach(account => {
      const option = document.createElement('option');
      option.value = account.id;
      option.textContent = account.name + ' · ' + account.currency +
        (currentMembership.role === 'admin' ? ' · ' + memberName(account.owner_member_id) : '');
      select.appendChild(option);
    });
    if (accounts.some(account => account.id === previous)) select.value = previous;
    else if (accounts.length === 1) select.value = accounts[0].id;
  }
  function populateAccountSelects() {
    const writable = visibleAccountsForWriting();
    fillAccountSelect($('txAccount'), writable, 'اختر حساباً');
    fillAccountSelect($('importAccount'), writable, 'اختر حساباً مالياً');
    const accountCurrency = $('accountCurrency');
    const preferenceCurrency = $('currencySetting')?.value || localStorage.getItem('velovi-currency') || 'EUR';
    if (accountCurrency && $('currencySetting')) {
      const previousCurrency = accountCurrency.value || preferenceCurrency;
      accountCurrency.replaceChildren(...[...$('currencySetting').options].map(option => {
        const copy = document.createElement('option'); copy.value = option.value; copy.textContent = option.value; return copy;
      }));
      accountCurrency.value = [...accountCurrency.options].some(option => option.value === previousCurrency) ? previousCurrency : preferenceCurrency;
    }
    const ownerSelect = $('accountOwner');
    if (ownerSelect) {
      ownerSelect.replaceChildren();
      currentMembers.filter(member => member.is_active && (member.role === 'member' || member.role === 'admin')).forEach(member => {
        const option = document.createElement('option');
        option.value = member.id;
        option.textContent = member.display_name + (member.role === 'admin' ? ' · المدير' : '');
        ownerSelect.appendChild(option);
      });
      const ownerLabel = $('accountOwnerLabel');
      if (ownerLabel) ownerLabel.hidden = currentMembership.role !== 'admin';
      if (currentMembership.role !== 'admin') ownerSelect.value = currentMembership.id;
    }
    const saveImport = $('saveImportedRows');
    if (saveImport) saveImport.dataset.ready = String(canAddTransactions() && writable.length > 0);
    $('importAccount')?.dispatchEvent(new Event('change', {bubbles:true}));
    document.querySelectorAll('[data-open-add]').forEach(button => {
      button.disabled = !canAddTransactions() || writable.length === 0;
      button.title = button.disabled ? 'لا توجد صلاحية إضافة أو لا يوجد حساب نشط' : '';
    });
  }
  function renderAccounts() {
    const list = $('accountList');
    const stats = $('accountStats');
    if (!list || !stats) return;
    list.replaceChildren();
    stats.replaceChildren();
    const active = currentAccounts.filter(account => account.is_active);
    const totals = new Map();
    active.forEach(account => {
      const isFullView = currentMembership.role === 'admin' || account.owner_member_id === currentMembership.id;
      const rows = isFullView ? currentTransactions.filter(tx => tx.account_id === account.id) : [];
      const balance = Number(account.opening_balance || 0) + rows.reduce((sum, tx) => {
        if (tx.transaction_type === 'income') return sum + Number(tx.amount);
        if (tx.transaction_type === 'expense') return sum - Number(tx.amount);
        return sum;
      }, 0);
      if (isFullView) totals.set(account.currency, (totals.get(account.currency) || 0) + balance);
      const card = document.createElement('article');
      card.className = 'account-card';
      const header = document.createElement('div'); header.className = 'account-card-head';
      const identity = document.createElement('div');
      const title = document.createElement('h3'); title.textContent = account.name;
      const sub = document.createElement('p'); sub.className = 'muted small';
      sub.textContent = accountTypeLabel(account.account_type) + ' · ' + account.currency + ' · ' + memberName(account.owner_member_id);
      identity.append(title,sub);
      const value = document.createElement('strong'); value.className = balance < 0 ? 'negative' : 'positive';
      value.textContent = formatMoney(balance,account.currency);
      header.append(identity,value); card.appendChild(header);
      if (!isFullView) {
        const note = document.createElement('p'); note.className = 'small muted';
        note.textContent = 'عرض الحساب فقط: المعروض هو الرصيد الافتتاحي، ولا يتضمن حركات صاحبه الخاصة.';
        card.appendChild(note);
      }
      const actions = document.createElement('div'); actions.className = 'account-actions';
      const canManage = currentMembership.role === 'admin' || account.owner_member_id === currentMembership.id;
      if (canManage) {
        const edit = document.createElement('button'); edit.type='button'; edit.className='secondary'; edit.textContent='تعديل';
        edit.addEventListener('click',()=>openAccountDialog(account)); actions.appendChild(edit);
        const archive = document.createElement('button'); archive.type='button'; archive.className='text-btn danger-text';
        archive.textContent='حذف الحساب';
        archive.addEventListener('click',()=>archiveAccount(account)); actions.appendChild(archive);
      } else {
        const readOnly = document.createElement('span'); readOnly.className='pill'; readOnly.textContent='قراءة فقط'; actions.appendChild(readOnly);
      }
      card.appendChild(actions);
      list.appendChild(card);
    });
    if (!active.length) list.appendChild(emptyState('لا توجد حسابات مالية بعد. أضف حساباً للبدء.'));
    for (const [currency,total] of totals) {
      const stat = document.createElement('article'); stat.className='stat';
      const label = document.createElement('span'); label.textContent='إجمالي الأرصدة · '+currency;
      const amount = document.createElement('strong'); amount.textContent=formatMoney(total,currency);
      const note = document.createElement('small'); note.textContent='الرصيد الافتتاحي مضافاً إليه الحركات المسجلة';
      stat.append(label,amount,note); stats.appendChild(stat);
    }
  }
  function bulkText(ar, de, en) {
    const language = document.documentElement.lang || 'ar';
    return language === 'de' ? de : language === 'en' ? en : ar;
  }
  function updateBulkSelectionUi() {
    const all = [...document.querySelectorAll('#txRows .tx-select')];
    const visible = all.filter(box => !box.closest('tr')?.hidden);
    const selected = all.filter(box => box.checked);
    const toolbar = $('bulkActions'), count = $('bulkSelectionCount');
    const button = $('bulkDeleteTransactions'), master = $('selectAllTransactions');
    if (toolbar) toolbar.hidden = all.length === 0;
    if (count) count.textContent = selected.length + ' ' + bulkText('محددة', 'ausgewählt', 'selected');
    if (button) button.disabled = selected.length === 0;
    if (master) {
      master.disabled = visible.length === 0;
      master.checked = visible.length > 0 && visible.every(box => box.checked);
      master.indeterminate = visible.some(box => box.checked) && !master.checked;
    }
  }
  window.VELOVI_UPDATE_SELECTION = updateBulkSelectionUi;

  async function deleteSelectedTransactions() {
    const selected = [...document.querySelectorAll('#txRows .tx-select:checked')];
    const ids = [...new Set(selected.map(box => box.dataset.transactionId).filter(Boolean))];
    const permitted = ids.filter(id => {
      const tx = currentTransactions.find(item => item.id === id);
      return tx && canDeleteTransactions(tx);
    });
    if (!permitted.length) return setMessage(bulkText('لا توجد حركات محددة لديك صلاحية حذفها.', 'Keine ausgewählten Buchungen dürfen gelöscht werden.', 'No selected transactions are permitted for deletion.'), true);
    const confirmText = bulkText(
      'هل تريد حذف ' + permitted.length + ' حركة محددة نهائياً؟ لا يمكن التراجع عن الحذف.',
      'Möchten Sie ' + permitted.length + ' ausgewählte Buchungen endgültig löschen? Dies kann nicht rückgängig gemacht werden.',
      'Permanently delete ' + permitted.length + ' selected transactions? This cannot be undone.'
    );
    if (!window.confirm(window.VELOVI_I18N?.t?.(confirmText) || confirmText)) return;
    const result = await client.from('financial_transactions')
      .delete().in('id', permitted).select('id');
    if (result.error) return setMessage(bulkText('تعذر حذف الحركات المحددة: ', 'Ausgewählte Buchungen konnten nicht gelöscht werden: ', 'Could not delete selected transactions: ') + result.error.message, true);
    const deleted = result.data?.length || 0;
    await loadFinancialData();
    if (deleted !== permitted.length) {
      setMessage(bulkText(
        'تم حذف ' + deleted + ' من أصل ' + permitted.length + ' حركة. قد تمنع صلاحيات الوصول حذف بعض الحركات.',
        deleted + ' von ' + permitted.length + ' Buchungen wurden gelöscht. Berechtigungen können weitere Löschungen verhindern.',
        deleted + ' of ' + permitted.length + ' transactions were deleted. Permissions may have prevented some deletions.'
      ), true);
    } else {
      setMessage(bulkText('تم حذف ' + deleted + ' حركة بنجاح.', deleted + ' Buchungen erfolgreich gelöscht.', deleted + ' transactions deleted successfully.'), false);
    }
  }

  function renderTransactions() {
    const body = $('txRows'), empty = $('transactionsEmpty');
    if (!body) return;
    body.replaceChildren();
    const sorted = [...currentTransactions].sort((a,b)=>String(b.transaction_date).localeCompare(String(a.transaction_date)));
    sorted.forEach(tx => {
      const row = document.createElement('tr');
      row.dataset.type = tx.transaction_type === 'income' ? 'income' : tx.transaction_type === 'expense' ? 'expense' : 'other';
      row.dataset.category = tx.category || 'غير مصنف';
      row.dataset.description = tx.description || '';
      row.dataset.date = tx.transaction_date || '';
      row.dataset.amount = String(Number(tx.amount));
      row.dataset.signedAmount = String(tx.transaction_type === 'expense' ? -Number(tx.amount) : Number(tx.amount));
      row.dataset.currency = tx.currency || 'EUR';
      row.dataset.transactionId = tx.id;
      const typeCell=document.createElement('td'), badge=document.createElement('span');
      badge.className='pill '+(tx.transaction_type==='income'?'green':tx.transaction_type==='expense'?'red':'');
      badge.textContent=tx.transaction_type==='income'?'إيراد':tx.transaction_type==='expense'?'مصروف':'تحويل';
      typeCell.appendChild(badge);
      const categoryCell=document.createElement('td'); categoryCell.textContent=tx.category || 'غير مصنف';
      const descCell=document.createElement('td'); descCell.textContent=tx.description || '—';
      const dateCell=document.createElement('td');
      const date=new Date(String(tx.transaction_date)+'T12:00:00');
      dateCell.textContent=Number.isNaN(date.getTime())?tx.transaction_date:date.toLocaleDateString('de-DE');
      const amountCell=document.createElement('td'); amountCell.className=tx.transaction_type==='income'?'positive':tx.transaction_type==='expense'?'negative':'';
      const amount=document.createElement('span');
      amount.textContent=(tx.transaction_type==='income'?'+':tx.transaction_type==='expense'?'−':'')+formatMoney(Number(tx.amount),tx.currency);
      amountCell.appendChild(amount);
      const actions=document.createElement('span'); actions.className='tx-row-actions';
      if (canEditTransactions(tx)) {
        const edit=document.createElement('button'); edit.type='button'; edit.className='text-btn'; edit.textContent='تعديل';
        edit.addEventListener('click',()=>openTransactionDialog(tx)); actions.appendChild(edit);
      }
      if (canDeleteTransactions(tx)) {
        const del=document.createElement('button'); del.type='button'; del.className='text-btn danger-text'; del.textContent='حذف';
        del.addEventListener('click',()=>deleteTransaction(tx)); actions.appendChild(del);
      }
      const selectCell = document.createElement('td');
      selectCell.className = 'select-column';
      if (canDeleteTransactions(tx)) {
        const select = document.createElement('input');
        select.type = 'checkbox';
        select.className = 'tx-select';
        select.dataset.transactionId = tx.id;
        select.setAttribute('aria-label', 'تحديد الحركة');
        select.addEventListener('change', updateBulkSelectionUi);
        selectCell.appendChild(select);
      }
      if (actions.childElementCount) selectCell.appendChild(actions);
      row.append(typeCell,categoryCell,descCell,dateCell,amountCell,selectCell);
      body.appendChild(row);
    });
    if (empty) empty.hidden = currentTransactions.length !== 0;
    $('searchTx')?.dispatchEvent(new Event('input',{bubbles:true}));
    updateBulkSelectionUi();
  }
  function updateDashboard() {
    const now=new Date(), month=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0');
    const monthRows=currentTransactions.filter(tx=>String(tx.transaction_date).startsWith(month));
    const sums=(type,rows)=>rows.filter(tx=>tx.transaction_type===type).reduce((map,tx)=>{
      map.set(tx.currency,(map.get(tx.currency)||0)+Number(tx.amount)); return map;
    },new Map());
    const showTotals=map=>map.size?[...map].map(([currency,value])=>formatMoney(value,currency)).join(' · '):'—';
    const income=sums('income',currentTransactions), expense=sums('expense',currentTransactions);
    const monthIncome=sums('income',monthRows), monthExpense=sums('expense',monthRows);
    const surplus=new Map();
    for(const currency of new Set([...monthIncome.keys(),...monthExpense.keys()])) surplus.set(currency,(monthIncome.get(currency)||0)-(monthExpense.get(currency)||0));
    const balances=new Map();
    currentAccounts.filter(account=>account.is_active&&(currentMembership.role==='admin'||account.owner_member_id===currentMembership.id)).forEach(account=>{
      const txs=currentTransactions.filter(tx=>tx.account_id===account.id);
      const value=Number(account.opening_balance||0)+txs.reduce((sum,tx)=>sum+(tx.transaction_type==='income'?Number(tx.amount):tx.transaction_type==='expense'?-Number(tx.amount):0),0);
      balances.set(account.currency,(balances.get(account.currency)||0)+value);
    });
    if($('dashboardIncome'))$('dashboardIncome').textContent=showTotals(income);
    if($('dashboardExpenses'))$('dashboardExpenses').textContent=showTotals(expense);
    if($('dashboardSurplus'))$('dashboardSurplus').textContent=showTotals(surplus);
    if($('dashboardBalances'))$('dashboardBalances').textContent=showTotals(balances);
    document.querySelectorAll('#home .stat small').forEach(el=>{el.textContent='من الحركات والحسابات المسجلة فعلياً';});
    const recent=document.querySelector('#home .transaction-list');
    if(recent){
      recent.replaceChildren();
      currentTransactions.slice(0,5).forEach(tx=>{
        const item=document.createElement('div');item.className='transaction-item';
        const desc=document.createElement('span');desc.textContent=(tx.description||tx.category||'حركة')+' · '+tx.transaction_date;
        const amount=document.createElement('strong');amount.textContent=(tx.transaction_type==='expense'?'−':'+')+formatMoney(Number(tx.amount),tx.currency);
        item.append(desc,amount);recent.appendChild(item);
      });
      if(!currentTransactions.length)recent.appendChild(emptyState('لا توجد حركات مالية مسجلة بعد.'));
    }
  }

  function renderExpenseChart() {
    const chart=$('expenseChart'),legend=document.querySelector('#home .legend'),period=$('chartPeriod'),label=$('chartPeriodLabel');
    if(!chart||!legend)return;
    const now=new Date(),periodValue=period?.value||'month';
    let start;
    if(periodValue==='year')start=new Date(now.getFullYear(),0,1);
    else if(periodValue==='quarter')start=new Date(now.getFullYear(),now.getMonth()-2,1);
    else start=new Date(now.getFullYear(),now.getMonth(),1);
    const expenses=currentTransactions.filter(tx=>{
      if(tx.transaction_type!=='expense')return false;
      const date=new Date(String(tx.transaction_date)+'T12:00:00');
      return !Number.isNaN(date.getTime())&&date>=start&&date<=now;
    });
    const available=[...new Set(expenses.map(tx=>tx.currency).filter(Boolean))];
    const preferred=localStorage.getItem('velovi-currency')||'EUR';
    const currency=available.includes(preferred)?preferred:available[0];
    const totals=new Map();
    expenses.filter(tx=>tx.currency===currency).forEach(tx=>{
      const category=tx.category||'غير مصنف';
      totals.set(category,(totals.get(category)||0)+Number(tx.amount));
    });
    let entries=[...totals].sort((a,b)=>b[1]-a[1]);
    if(entries.length>4){const rest=entries.slice(3).reduce((sum,item)=>sum+item[1],0);entries=entries.slice(0,3).concat([['أخرى',rest]]);}
    const total=entries.reduce((sum,item)=>sum+item[1],0);
    const labels={month:'هذا الشهر',quarter:'آخر 3 أشهر',year:'هذا العام'};
    if(label)label.textContent=labels[periodValue]+' · '+(currency||'لا توجد بيانات');
    chart.classList.toggle('bars',period?.value!==undefined&&getElement('chartType')?.value==='bars');
    chart.replaceChildren();
    legend.replaceChildren();
    const colors=['var(--chart-1)','var(--chart-2)','var(--chart-3)','var(--chart-4)'];
    if(!total){
      chart.classList.remove('bars');
      chart.style.removeProperty('background');
      chart.style.background='conic-gradient(var(--line) 0 100%)';
      const center=document.createElement('div'),bold=document.createElement('b'),small=document.createElement('small');
      bold.textContent='—';small.textContent='لا توجد مصروفات';
      center.append(bold,small);chart.appendChild(center);
      return;
    }
    const parts=[];let angle=0;
    entries.forEach(([category,value],index)=>{
      const end=angle+(value/total*360);
      parts.push(colors[index]+' '+angle.toFixed(2)+'deg '+end.toFixed(2)+'deg');
      angle=end;
      const item=document.createElement('span'),swatch=document.createElement('i'),name=document.createElement('span'),percent=document.createElement('b');
      swatch.style.background=colors[index];name.textContent=category;percent.textContent=(value/total*100).toFixed(1)+'%';
      item.append(swatch,name,percent);legend.appendChild(item);
    });
    const isBars=getElement('chartType')?.value==='bars';
    chart.classList.toggle('bars',isBars);
    if(isBars){
      chart.style.setProperty('background','repeating-linear-gradient(to top,var(--chart-grid) 0 1px,transparent 1px 42px),var(--surface)','important');
      const max=Math.max(...entries.map(item=>item[1]));
      entries.forEach(([category,value],index)=>{
        const bar=document.createElement('span');bar.className='chart-bar';
        bar.style.height=Math.max(5,value/max*100)+'%';bar.style.background=colors[index];bar.title=category+' · '+formatMoney(value,currency);
        chart.appendChild(bar);
      });
    }else{
      chart.style.removeProperty('background');
      chart.style.background='conic-gradient('+parts.join(',')+')';
      const center=document.createElement('div'),bold=document.createElement('b'),small=document.createElement('small');
      bold.textContent=formatMoney(total,currency);small.textContent='إجمالي المصروفات';
      center.append(bold,small);chart.appendChild(center);
    }
  }

  async function loadFinancialData() {
    const [accountsResult,transactionsResult]=await Promise.all([
      client.from('financial_accounts')
        .select('id,household_id,owner_member_id,name,account_type,currency,opening_balance,is_active,created_at')
        .eq('household_id',currentHousehold.id)
        .order('created_at',{ascending:true}),
      client.from('financial_transactions')
        .select('id,household_id,owner_member_id,account_id,transaction_type,amount,currency,description,category,transaction_date,transfer_group_id,created_by,created_at,updated_at')
        .eq('household_id',currentHousehold.id)
        .order('transaction_date',{ascending:false})
    ]);
    if(accountsResult.error)throw accountsResult.error;
    if(transactionsResult.error)throw transactionsResult.error;
    currentAccounts=accountsResult.data||[];
    currentTransactions=transactionsResult.data||[];
    populateAccountSelects();
    renderAccounts();
    renderTransactions();
    updateDashboard();
    renderExpenseChart();
    window.VELOVI_FINANCE_CHART = renderExpenseChart;
    renderForecastControls();
  }
  function openAccountDialog(account=null) {
    const dialog=$('accountDialog'), form=$('accountForm');
    if(!dialog||!form)return;
    form.reset();
    dialog.dataset.accountId=account?.id||'';
    $('accountName').value=account?.name||'';
    $('accountType').value=account?.account_type||'bank';
    $('accountCurrency').value=account?.currency||localStorage.getItem('velovi-currency')||'EUR';
    $('accountOpeningBalance').value=String(account?.opening_balance??0);
    if($('accountOwner'))$('accountOwner').value=account?.owner_member_id||(currentMembership.role==='admin'?currentMembership.id:currentMembership.id);
    const heading=dialog.querySelector('h2');if(heading)heading.textContent=account?'تعديل الحساب':'إضافة حساب مالي';
    const save=$('saveAccount');if(save)save.textContent=account?'حفظ التعديلات':'حفظ الحساب';
    dialog.showModal();
  }
  async function saveAccount(event) {
    event.preventDefault();
    const accountId=$('accountDialog').dataset.accountId||'';
    const name=$('accountName').value.trim();
    const currency=$('accountCurrency').value;
    const openingBalance=parseMoney($('accountOpeningBalance').value);
    const ownerMemberId=currentMembership.role==='admin'?$('accountOwner').value:currentMembership.id;
    if(!name||!ownerMemberId||!Number.isFinite(openingBalance))return setMessage('تحقق من اسم الحساب وصاحبه والرصيد الافتتاحي.',true);
    const previous=currentAccounts.find(account=>account.id===accountId);
    if(previous&&previous.currency!==currency&&currentTransactions.some(tx=>tx.account_id===accountId)){
      return setMessage('لا يمكن تغيير عملة حساب يحتوي على حركات. أنشئ حساباً جديداً بالعملة المطلوبة.',true);
    }
    const payload={household_id:currentHousehold.id,owner_member_id:ownerMemberId,name,account_type:$('accountType').value,currency,opening_balance:openingBalance};
    const button=$('saveAccount');button.disabled=true;
    const result=accountId
      ? await client.from('financial_accounts').update(payload).eq('id',accountId).select('id').maybeSingle()
      : await client.from('financial_accounts').insert(payload);
    button.disabled=false;
    if(result.error)return setMessage('تعذر حفظ الحساب: '+result.error.message,true);
    if(accountId&&!result.data)return setMessage('لم يتم تعديل الحساب؛ تحقق من صلاحيات الوصول إليه.',true);
    $('accountDialog').close();
    await loadFinancialData();
    setMessage(accountId?'تم تحديث الحساب.':'تم إنشاء الحساب وحفظه في الأسرة.',false);
  }
  async function archiveAccount(account) {
    if(!window.confirm(window.VELOVI_I18N?.t?.('سيُحذف الحساب من قائمة الحسابات النشطة مع الاحتفاظ بسجل الحركات والتدقيق. هل تريد المتابعة؟') || 'سيُحذف الحساب من قائمة الحسابات النشطة مع الاحتفاظ بسجل الحركات والتدقيق. هل تريد المتابعة؟'))return;
    const result=await client.from('financial_accounts').update({is_active:false}).eq('id',account.id).select('id').maybeSingle();
    if(result.error)return setMessage('تعذر حذف الحساب: '+result.error.message,true);
    if(!result.data)return setMessage('لم يتم حذف الحساب؛ تحقق من صلاحيات الوصول إليه.',true);
    await loadFinancialData();
    setMessage('تم حذف الحساب من القائمة النشطة مع الاحتفاظ بسجله.',false);
  }
  function openTransactionDialog(transaction=null) {
    if(!canAddTransactions()&&!transaction)return setMessage('ليست لديك صلاحية إضافة الحركات.',true);
    const dialog=$('transactionDialog'),form=$('transactionForm');
    if(!dialog||!form)return;
    form.reset();
    populateAccountSelects();
    dialog.dataset.transactionId=transaction?.id||'';
    $('txType').value=transaction?.transaction_type||'expense';
    $('txDesc').value=transaction?.description||'';
    $('txAmount').value=transaction?.amount??'';
    $('txDate').value=transaction?.transaction_date||new Date().toISOString().slice(0,10);
    const category = transaction?.category || '';
    $('txCategory').dataset.categoryCanonical = category;
    $('txCategory').value = category ? (window.VELOVI_I18N?.t?.(category) || category) : '';
    window.VELOVI_CATEGORIES?.populate($('txCategoryOptions'),$('txType').value);
    $('txAccount').value=transaction?.account_id||visibleAccountsForWriting()[0]?.id||'';
    const heading=dialog.querySelector('h2');if(heading)heading.textContent=transaction?'تعديل حركة مالية':'إضافة حركة مالية';
    const save=$('saveTx');if(save)save.textContent=transaction?'حفظ التعديلات':'حفظ الحركة';
    dialog.showModal();
  }
  async function saveTransaction(event) {
    if(event.submitter?.value==='cancel')return;
    event.preventDefault();
    const transactionId=$('transactionDialog').dataset.transactionId||'';
    const account=currentAccounts.find(item=>item.id===$('txAccount').value&&item.is_active);
    const amount=Number($('txAmount').value);
    const description=$('txDesc').value.trim();
    const date=$('txDate').value;
    const type=$('txType').value;
    if(!account||!description||!date||!Number.isFinite(amount)||amount<=0||!['income','expense'].includes(type)){
      return setMessage('اختر حساباً وأدخل وصفاً وتاريخاً ومبلغاً صحيحاً أكبر من صفر.',true);
    }
    if(transactionId){
      const original=currentTransactions.find(tx=>tx.id===transactionId);
      if(!original||!canEditTransactions(original))return setMessage('ليست لديك صلاحية تعديل هذه الحركة.',true);
    }else if(!canAddTransactions())return setMessage('ليست لديك صلاحية إضافة الحركات.',true);
    const payload={
      household_id:currentHousehold.id,owner_member_id:account.owner_member_id,account_id:account.id,
      transaction_type:type,amount,currency:account.currency,description,
      category:window.VELOVI_CATEGORIES?.normalize($('txCategory').value,type)||$('txCategory').value.trim()||'غير مصنف',transaction_date:date
    };
    const button=$('saveTx');button.disabled=true;
    const result=transactionId
      ? await client.from('financial_transactions').update(payload).eq('id',transactionId).select('id').maybeSingle()
      : await client.from('financial_transactions').insert(payload);
    button.disabled=false;
    if(result.error)return setMessage('تعذر حفظ الحركة: '+result.error.message,true);
    if(transactionId&&!result.data)return setMessage('لم يتم تعديل الحركة؛ تحقق من صلاحيات الوصول إليها.',true);
    $('transactionDialog').close();
    await loadFinancialData();
    setMessage(transactionId?'تم تحديث الحركة.':'تم حفظ الحركة ومزامنتها.',false);
  }
  async function deleteTransaction(transaction) {
    if(!canDeleteTransactions(transaction))return setMessage('ليست لديك صلاحية حذف هذه الحركة.',true);
    if(!window.confirm(window.VELOVI_I18N?.t?.('هل تريد حذف هذه الحركة نهائياً؟') || 'هل تريد حذف هذه الحركة نهائياً؟'))return;
    const result=await client.from('financial_transactions').delete().eq('id',transaction.id).select('id').maybeSingle();
    if(result.error)return setMessage('تعذر حذف الحركة: '+result.error.message,true);
    if(!result.data)return setMessage('لم يتم حذف الحركة؛ تحقق من صلاحيات الوصول إليها.',true);
    await loadFinancialData();
    setMessage('تم حذف الحركة.',false);
  }
  async function saveImportedRows() {
    if(!canAddTransactions())return setMessage('ليست لديك صلاحية إضافة الحركات.',true);
    const account=currentAccounts.find(item=>item.id===$('importAccount')?.value&&item.is_active);
    const imported=window.VELOVI_IMPORT?.getSelectedRows?.()||[];
    if(!account||!imported.length)return setMessage('اختر الحساب وحدد الحركات التي تريد حفظها.',true);
    const existing=new Set(currentTransactions.filter(tx=>tx.account_id===account.id).map(tx=>[
      tx.transaction_date,tx.transaction_type,(tx.description||'').trim().toLowerCase(),Number(tx.amount).toFixed(2)
    ].join('|')));
    const rows=imported.filter(row=>row.date&&row.description&&Number(row.amount)>0).filter(row=>{
      const key=[row.date,row.type,(row.description||'').trim().toLowerCase(),Number(row.amount).toFixed(2)].join('|');
      if(existing.has(key))return false;
      existing.add(key);return true;
    }).map(row=>({
      household_id:currentHousehold.id,owner_member_id:account.owner_member_id,account_id:account.id,
      transaction_type:row.type,amount:Number(row.amount),currency:account.currency,
      description:row.description.trim(),category:window.VELOVI_CATEGORIES?.normalize(row.category,row.type)||(row.category||'غير مصنف').trim(),transaction_date:row.date
    }));
    if(!rows.length){
      window.VELOVI_IMPORT?.setStatus?.('لم تُحفظ حركات جديدة؛ قد تكون جميع الحركات المحددة مكررة أو غير مكتملة.');
      return;
    }
    const button=$('saveImportedRows');button.disabled=true;
    const result=await client.from('financial_transactions').insert(rows);
    button.disabled=false;
    if(result.error){window.VELOVI_IMPORT?.setStatus?.('تعذر حفظ الحركات: '+result.error.message,true);return setMessage('تعذر حفظ الحركات المستوردة: '+result.error.message,true);}
    window.VELOVI_IMPORT?.clear?.();
    window.VELOVI_IMPORT?.setStatus?.('تم حفظ '+rows.length+' حركة في الحساب المحدد.');
    await loadFinancialData();
    updateDashboard();
    renderAccounts();
    setMessage('تم استيراد '+rows.length+' حركة بنجاح وتحديث البطاقات والأرصدة.',false);
  }
  function renderForecastControls() {
    const select=$('forecastCurrency'),wrap=$('forecastExclusions');
    if(!select||!wrap)return;
    const currencies=[...new Set(currentTransactions.map(tx=>tx.currency).concat(currentAccounts.map(a=>a.currency)).filter(Boolean))];
    const previous=select.value||localStorage.getItem('velovi-forecast-currency')||currencies[0]||'';
    select.replaceChildren();
    currencies.forEach(currency=>{const option=document.createElement('option');option.value=currency;option.textContent=currency;select.appendChild(option);});
    if(currencies.includes(previous))select.value=previous;
    const categories=[...new Set(currentTransactions.filter(tx=>tx.transaction_type==='income'||tx.transaction_type==='expense').map(tx=>tx.category||'غير مصنف'))].sort((a,b)=>a.localeCompare(b,'ar'));
    wrap.replaceChildren();
    if(!categories.length){wrap.appendChild(emptyState('لا توجد تصنيفات في سجل الحركات بعد.'));return;}
    let savedExcluded=[];try{savedExcluded=JSON.parse(localStorage.getItem('velovi-forecast-excluded')||'[]');}catch{}
    const excluded=new Set(Array.isArray(savedExcluded)?savedExcluded:[]);
    categories.forEach(category=>{
      const label=document.createElement('label');label.className='forecast-exclusion-item';
      const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.checked=!excluded.has(category);checkbox.dataset.category=category;
      checkbox.addEventListener('change',()=>{
        const nowExcluded=[...wrap.querySelectorAll('input[type=checkbox]:not(:checked)')].map(input=>input.dataset.category);
        localStorage.setItem('velovi-forecast-excluded',JSON.stringify(nowExcluded));
      });
      const text=document.createElement('span');text.textContent=category;
      label.append(checkbox,text);wrap.appendChild(label);
    });
  }
  window.VELOVI_RESET_FORECAST_PREFERENCES = () => {
    localStorage.removeItem('velovi-forecast-currency');
    localStorage.removeItem('velovi-forecast-excluded');
    document.querySelectorAll('#forecastExclusions input[type="checkbox"]').forEach(input => { input.checked = true; });
    const currency = $('forecastCurrency');
    const preferred = $('currencySetting')?.value || 'EUR';
    if (currency && [...currency.options].some(option => option.value === preferred)) currency.value = preferred;
    calculateSmartForecast();
  };

  function calculateSmartForecast() {
    const currency=$('forecastCurrency')?.value||currentAccounts[0]?.currency||'EUR';
    const monthsCount=Number($('smartForecastMonths')?.value||12);
    if(!Number.isInteger(monthsCount)||monthsCount<1||monthsCount>1200)return setMessage('مدة التوقع يجب أن تكون بين شهر واحد و1200 شهر.',true);
    const now=new Date(),monthKeys=[];
    for(let i=6;i>=1;i--){const d=new Date(now.getFullYear(),now.getMonth()-i,1);monthKeys.push(d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'));}
    const excluded=new Set([...($('forecastExclusions')?.querySelectorAll('input[type=checkbox]:not(:checked)')||[])].map(input=>input.dataset.category));
    const transactions=currentTransactions.filter(tx=>(tx.transaction_type==='income'||tx.transaction_type==='expense')&&tx.currency===currency&&monthKeys.includes(String(tx.transaction_date).slice(0,7))&&!excluded.has(tx.category||'غير مصنف'));
    const accountBalance=currentAccounts.filter(account=>account.is_active&&account.currency===currency&&(currentMembership.role==='admin'||account.owner_member_id===currentMembership.id)).reduce((sum,account)=>{
      const accountRows=currentTransactions.filter(tx=>tx.account_id===account.id);
      return sum+Number(account.opening_balance||0)+accountRows.reduce((s,tx)=>s+(tx.transaction_type==='income'?Number(tx.amount):tx.transaction_type==='expense'?-Number(tx.amount):0),0);
    },0);
    if(!transactions.length){
      $('smartForecastResult').textContent='لا توجد حركات كافية بهذه العملة خلال الأشهر الستة السابقة لبناء توقع موثوق.';
      return;
    }
    const monthlyByCategory=new Map();
    transactions.forEach(tx=>{
      const key=(tx.transaction_type||'')+'|'+(tx.category||'غير مصنف');
      if(!monthlyByCategory.has(key))monthlyByCategory.set(key,new Map());
      const monthly=monthlyByCategory.get(key),month=String(tx.transaction_date).slice(0,7);
      monthly.set(month,(monthly.get(month)||0)+Number(tx.amount));
    });
    const estimates={income:0,expense:0},patterns=[];
    for(const [key,monthly] of monthlyByCategory){
      const [type,category]=key.split('|');
      const values=monthKeys.map(month=>monthly.get(month)||0);
      const active=values.filter(value=>value>0);
      if(!active.length)continue;
      const mean=active.reduce((s,v)=>s+v,0)/active.length;
      const variance=active.reduce((s,v)=>s+Math.pow(v-mean,2),0)/active.length;
      const cv=mean?Math.sqrt(variance)/mean:1;
      let estimate=0,pattern='متغير';
      if(active.length>=3&&cv<=0.30){const sorted=[...active].sort((x,y)=>x-y);estimate=sorted[Math.floor(sorted.length/2)];pattern='متكرر';}
      else {const weights=values.map((_,index)=>index+1);estimate=values.reduce((s,value,index)=>s+value*weights[index],0)/weights.reduce((s,w)=>s+w,0);}
      estimates[type]+=estimate;
      patterns.push({category,type,estimate,pattern,months:active.length,frequency:active.length/monthKeys.length});
    }
    const net=estimates.income-estimates.expense;
    const monthlyNet=monthKeys.map(month=>{
      const rows=transactions.filter(tx=>String(tx.transaction_date).startsWith(month));
      return rows.reduce((sum,tx)=>sum+(tx.transaction_type==='income'?Number(tx.amount):-Number(tx.amount)),0);
    });
    const avg=monthlyNet.reduce((s,v)=>s+v,0)/monthlyNet.length;
    const variance=monthlyNet.reduce((s,v)=>s+Math.pow(v-avg,2),0)/monthlyNet.length;
    const volatility=Math.sqrt(variance);
    const annual=Number($('annualReturn')?.value||0);
    const rate=Math.pow(1+annual/100,1/12)-1;
    let projected=accountBalance;
    for(let i=0;i<monthsCount;i++)projected=projected*(1+rate)+net;
    const confidence=transactions.length>=18&&monthKeys.filter(month=>transactions.some(tx=>String(tx.transaction_date).startsWith(month))).length>=5?'متوسطة إلى جيدة':transactions.length>=6?'متوسطة':'منخفضة';
    const result=$('smartForecastResult');result.replaceChildren();
    const title=document.createElement('b');title.textContent='التوقع بعد '+monthsCount+' شهراً: '+formatMoney(projected,currency);
    const details=document.createElement('p');details.textContent='الرصيد الحالي المحسوب: '+formatMoney(accountBalance,currency)+' · دخل شهري مقدّر: '+formatMoney(estimates.income,currency)+' · مصروف شهري مقدّر: '+formatMoney(estimates.expense,currency)+' · صافي شهري متوقع: '+formatMoney(net,currency);
    const confidenceLine=document.createElement('p');confidenceLine.className='small muted';confidenceLine.textContent='مستوى الثقة: '+confidence+' · تذبذب صافي الأشهر الستة: '+formatMoney(volatility,currency)+'. التوقع يستخدم الوسيط للبنود المنتظمة والمتوسط المرجح للبنود المتغيرة.';
    const breakdown=document.createElement('ul');breakdown.className='forecast-patterns';
    patterns.forEach(item=>{const li=document.createElement('li');li.textContent=item.category+' — '+(item.type==='income'?'إيراد':'مصروف')+' · '+item.pattern+' · ظهر في '+item.months+' من 6 أشهر · '+formatMoney(item.estimate,currency)+' شهرياً';breakdown.appendChild(li);});
    result.append(title,details,confidenceLine,breakdown);
    result.classList.toggle('negative',projected<0);result.classList.toggle('positive',projected>=0);
  }

  async function loadWorkspace() {
    setMessage('جارٍ تحميل بيانات الأسرة...', false);
    const own = await withRequestTimeout(client
      .from('household_members')
      .select('id, household_id, user_id, display_name, role, is_active, can_add_transactions, can_edit_transactions, can_delete_transactions, can_view_other_accounts')
      .eq('user_id', currentUser.id)
      .order('is_active', { ascending: false }), 'قراءة عضوية الأسرة');

    if (own.error) throw own.error;
    const activeMemberships = (own.data || []).filter(row => row.is_active);
    if (!activeMemberships.length) {
      showGate('create');
      if ((own.data || []).length) {
        setMessage('عضويتك السابقة غير نشطة. يمكنك إنشاء أسرة جديدة أو التواصل مع مدير الأسرة لإعادة تفعيل عضويتك.', true);
      } else {
        setMessage('لم يتم إنشاء أسرة لهذا الحساب بعد. أنشئ أسرتك للمتابعة.', false);
      }
      return;
    }

    currentMembership = activeMemberships[0];
    const householdResult = await withRequestTimeout(client
      .from('households')
      .select('id, name')
      .eq('id', currentMembership.household_id)
      .maybeSingle(), 'قراءة بيانات الأسرة');
    if (householdResult.error) throw householdResult.error;
    if (!householdResult.data) throw new Error('تعذر العثور على الأسرة المرتبطة بهذا الحساب.');

    currentHousehold = householdResult.data;
    await withRequestTimeout(refreshMembers(), 'تحميل أعضاء الأسرة');
    clearDemoData();
    await withRequestTimeout(loadFinancialData(), 'تحميل الحسابات والحركات');
    setHeader(currentHousehold.name, currentMembership.display_name);
    showApp();
    setMessage('', false);
  }

  async function signOut() {
    const result = await client.auth.signOut();
    if (result.error) setMessage(result.error.message, true);
    currentUser = null;
    currentMembership = null;
    currentHousehold = null;
    if ($('signOutButton')) $('signOutButton').hidden = true;
    showGate('login');
    setMessage('تم تسجيل الخروج.', false);
  }

  async function handleSession(session) {
    if (!session || !session.user) {
      currentUser = null;
      showGate('login');
      return;
    }
    if (workspaceLoadPromise) return workspaceLoadPromise;
    currentUser = session.user;
    if (isInviteSetupFlow() && !inviteSetupCompleted) {
      showGate('invite-setup');
      if ($('invitePasswordStatus')) $('invitePasswordStatus').textContent = 'أنشئ كلمة مرور جديدة لإكمال تفعيل حسابك.';
      return;
    }
    const signOut = $('signOutButton');
    if (signOut) signOut.hidden = false;
    const sync = document.querySelector('.sync');
    if (sync) sync.textContent = 'متصل · إعداد الأسرة';
    workspaceLoadPromise = (async () => {
      try {
        const assurance = await client.auth.mfa.getAuthenticatorAssuranceLevel();
        if (assurance.error) throw new Error('تعذر التحقق من مستوى المصادقة: ' + assurance.error.message);
        if (assurance.data?.nextLevel === 'aal2' && assurance.data?.currentLevel !== 'aal2') {
          showGate('mfa');
          await prepareMfaLogin();
          return;
        }
        await loadWorkspace();
        refreshAccountSecurityStatus();
      } catch (error) {
        console.error('Velovi workspace error:', error);
        showGate('login');
        setMessage('تعذر تحميل بيانات الأسرة: ' + (error.message || 'خطأ غير معروف'), true);
      } finally {
        workspaceLoadPromise = null;
      }
    })();
    return workspaceLoadPromise;
  }

  async function signIn(event) {
    event.preventDefault();
    const email = $('loginEmail').value.trim();
    const password = $('loginPassword').value;
    if (!email || !password) return setMessage('أدخل البريد الإلكتروني وكلمة المرور.', true);
    const button = $('loginSubmit');
    button.disabled = true;
    setMessage('جارٍ تسجيل الدخول...', false);
    let result;
    try {
      result = await client.auth.signInWithPassword({ email, password });
    } catch (error) {
      button.disabled = false;
      return setMessage('تعذر الاتصال بخدمة تسجيل الدخول. تحقق من الإنترنت وحاول مجدداً.', true);
    }
    button.disabled = false;
    if (result.error) return setMessage('تعذر تسجيل الدخول. تحقق من البريد وكلمة المرور وتأكيد البريد الإلكتروني.', true);
    await handleSession(result.data.session);
  }

  async function createHousehold(event) {
    event.preventDefault();
    const name = $('householdName').value.trim();
    const displayName = $('displayName').value.trim();
    if (!name || !displayName) return setMessage('أدخل اسم الأسرة واسمك المعروض.', true);
    const button = $('createHouseholdSubmit');
    button.disabled = true;
    setMessage('جارٍ إنشاء الأسرة...', false);
    let result;
    try {
      result = await client.rpc('create_household', {
        p_name: name,
        p_display_name: displayName
      });
    } catch (error) {
      button.disabled = false;
      return setMessage('تعذر الاتصال بقاعدة البيانات. حاول مجدداً.', true);
    }
    button.disabled = false;
    if (result.error) return setMessage('تعذر إنشاء الأسرة: ' + result.error.message, true);
    currentMembership = null;
    try {
      await loadWorkspace();
    } catch (error) {
      setMessage('تم إنشاء الأسرة، لكن تعذر تحميلها: ' + (error.message || 'خطأ غير معروف'), true);
    }
  }

  async function createMemberInvite() {
    const email=$('inviteEmail')?.value.trim().toLowerCase()||'';
    const displayName=$('inviteDisplayName')?.value.trim()||email.split('@')[0];
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return setMessage('أدخل بريداً إلكترونياً صحيحاً للدعوة.',true);
    const dialog=$('addMemberDialog');
    if(dialog?.dataset.inviteEmail===email&&dialog.dataset.inviteLink)return {email,displayName,action_link:dialog.dataset.inviteLink};
    const button=$('sendInviteEmail')||$('copyInviteLink'); if(button)button.disabled=true;
    const {data,error}=await client.functions.invoke('create-family-invite',{body:{household_id:currentHousehold.id,email,display_name:displayName,redirect_to:'https://khjm950.github.io/velovi/'}});
    if(button)button.disabled=false;
    if(error||!data?.action_link){setMessage('تعذر إنشاء رابط الدعوة: '+(error?.message||data?.error||'خطأ غير معروف'),true);return null;}
    dialog.dataset.inviteEmail=email;dialog.dataset.inviteLink=data.action_link;
    return {email,displayName,action_link:data.action_link};
  }
  async function sendMemberInviteEmail() {
    const invite=await createMemberInvite(); if(!invite)return;
    const subject=encodeURIComponent(window.VELOVI_I18N?.t?.('دعوة للانضمام إلى أسرة Velovi') || 'دعوة للانضمام إلى أسرة Velovi');
    const bodyText='مرحباً '+invite.displayName+'،\n\nتمت دعوتك للانضمام إلى الأسرة في Velovi لإدارة الشؤون المالية. افتح الرابط التالي لتفعيل حسابك والانضمام:\n'+invite.action_link+'\n\nإذا لم تكن تتوقع هذه الدعوة فتجاهل الرسالة.';
    const body=encodeURIComponent(window.VELOVI_I18N?.t?.(bodyText) || bodyText);
    window.location.href='mailto:'+encodeURIComponent(invite.email)+'?subject='+subject+'&body='+body;
    const status=$('inviteStatus');if(status)status.textContent='تم تجهيز رسالة الدعوة في تطبيق البريد. أرسلها لإكمال الدعوة.';
  }
  async function copyMemberInviteLink() {
    const invite=await createMemberInvite(); if(!invite)return;
    try { await navigator.clipboard.writeText(invite.action_link); }
    catch { window.prompt(window.VELOVI_I18N?.t?.('انسخ رابط الدعوة:') || 'انسخ رابط الدعوة:',invite.action_link); }
    const status=$('inviteStatus');if(status)status.textContent='تم نسخ رابط الدعوة. أرسله للعضو ليكمل تسجيل الدخول.';
  }

  async function addMember(event) {
    event.preventDefault();
    const userId = $('memberUserId').value.trim();
    const displayName = $('memberDisplayName').value.trim();
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidPattern.test(userId)) return setMessage('أدخل معرّف المستخدم UID بصيغة UUID صحيحة.', true);
    if (!displayName) return setMessage('أدخل الاسم المعروض للعضو.', true);
    const result = await client.rpc('add_household_member', {
      p_household_id: currentHousehold.id,
      p_user_id: userId,
      p_display_name: displayName
    });
    if (result.error) return setMessage('تعذرت إضافة العضو: ' + result.error.message, true);
    $('addMemberDialog').close();
    $('memberUserId').value = '';
    $('memberDisplayName').value = '';
    await refreshMembers();
    await loadFinancialData();
    setMessage('تمت إضافة العضو أو إعادة تفعيل عضويته بالصلاحيات الافتراضية.', false);
  }

  async function savePermissions(event) {
    event.preventDefault();
    const dialog = $('permissionDialog');
    const result = await client.rpc('update_member_permissions', {
      p_household_id: currentHousehold.id,
      p_member_id: dialog.dataset.memberId,
      p_can_add: $('permissionAdd').checked,
      p_can_edit: $('permissionEdit').checked,
      p_can_delete: $('permissionDelete').checked,
      p_can_view_other_accounts: $('permissionViewAccounts').checked
    });
    if (result.error) return setMessage('تعذر تحديث الصلاحيات: ' + result.error.message, true);
    dialog.close();
    await refreshMembers();
    await loadFinancialData();
    setMessage('تم تحديث صلاحيات العضو.', false);
  }

  async function removeMember(member) {
    const memberName = member.display_name || 'هذا العضو';
    const confirmText = 'تأكيد إلغاء عضوية ' + memberName + '؟\n\nسيُمنع العضو من الدخول إلى هذه الأسرة، لكن ستبقى حساباته وحركاته المالية محفوظة. ويمكن للمدير إعادة تفعيل عضويته لاحقاً.\n\nهل تريد المتابعة؟';
    if (!window.confirm(window.VELOVI_I18N?.t?.(confirmText) || confirmText)) return;
    const result = await client.rpc('remove_household_member', {
      p_household_id: currentHousehold.id,
      p_member_id: member.id
    });
    if (result.error) return setMessage('تعذرت إزالة العضو: ' + result.error.message, true);
    await refreshMembers();
    await loadFinancialData();
    setMessage('تمت إزالة العضو مع الاحتفاظ بسجله.', false);
  }

  async function prepareMfaLogin() {
    const status = $('mfaLoginStatus');
    if (status) status.textContent = 'جارٍ تجهيز التحقق…';
    const { data, error } = await client.auth.mfa.listFactors();
    if (error) throw error;
    const factor = (data.totp || []).find(item => item.status === 'verified');
    if (!factor) throw new Error('هذا الحساب يتطلب المصادقة الثنائية، لكن لا يوجد عامل TOTP مؤكد.');
    mfaLoginFactorId = factor.id;
    const challenge = await client.auth.mfa.challenge({ factorId: factor.id });
    if (challenge.error) throw challenge.error;
    mfaLoginChallengeId = challenge.data.id;
    if (status) status.textContent = 'أدخل الرمز الظاهر في تطبيق المصادقة.';
  }

  async function verifyMfaLogin(event) {
    event.preventDefault();
    const code = $('mfaLoginCode').value.trim();
    if (!/^\d{6}$/.test(code) || !mfaLoginFactorId || !mfaLoginChallengeId) {
      $('mfaLoginStatus').textContent = 'أدخل رمزاً صحيحاً من 6 أرقام.';
      return;
    }
    const result = await client.auth.mfa.verify({
      factorId: mfaLoginFactorId,
      challengeId: mfaLoginChallengeId,
      code
    });
    if (result.error) {
      $('mfaLoginStatus').textContent = 'الرمز غير صحيح أو انتهت صلاحيته. حاول مجدداً.';
      return;
    }
    $('mfaLoginCode').value = '';
    mfaLoginFactorId = null;
    mfaLoginChallengeId = null;
    const refreshed = await client.auth.getSession();
    if (refreshed.error || !refreshed.data.session) {
      $('mfaLoginStatus').textContent = 'تم التحقق، لكن تعذر تحديث جلسة الدخول. أعد المحاولة.';
      return;
    }
    await handleSession(refreshed.data.session);
  }

  async function refreshAccountSecurityStatus() {
    const email = $('accountCurrentEmail');
    if (email) email.textContent = currentUser?.email || 'غير متاح';
    const status = $('mfaStatus');
    if (!status) return;
    try {
      const { data, error } = await client.auth.mfa.listFactors();
      if (error) throw error;
      const verified = (data.totp || []).filter(item => item.status === 'verified');
      const pending = (data.totp || []).filter(item => item.status !== 'verified');
      status.textContent = verified.length
        ? 'المصادقة الثنائية مفعّلة باستخدام تطبيق مصادقة.'
        : 'المصادقة الثنائية غير مفعّلة.';
      $('enableMfa').hidden = verified.length > 0 || pending.length > 0;
      $('disableMfa').hidden = verified.length === 0;
      if (pending.length && !mfaEnrollmentFactorId) mfaEnrollmentFactorId = pending[0].id;
    } catch (error) {
      status.textContent = 'تعذر قراءة حالة المصادقة الثنائية: ' + (error.message || 'خطأ');
    }
  }

  async function beginMfaEnrollment() {
    $('mfaManageStatus').textContent = 'جارٍ إنشاء إعداد المصادقة الثنائية…';
    const { data, error } = await client.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: 'Velovi authenticator'
    });
    if (error) {
      $('mfaManageStatus').textContent = 'تعذر بدء الإعداد: ' + error.message;
      return;
    }
    mfaEnrollmentFactorId = data.id;
    $('mfaQrCode').src = data.totp.qr_code;
    $('mfaSecret').textContent = data.totp.secret;
    $('mfaEnrollment').hidden = false;
    $('enableMfa').hidden = true;
    $('mfaManageStatus').textContent = 'امسح رمز QR بتطبيق المصادقة، ثم أدخل الرمز المكوّن من 6 أرقام.';
  }

  async function verifyMfaEnrollment() {
    const code = $('mfaEnrollCode').value.trim();
    if (!/^\d{6}$/.test(code) || !mfaEnrollmentFactorId) {
      $('mfaManageStatus').textContent = 'أدخل رمزاً صحيحاً من 6 أرقام.';
      return;
    }
    const challenge = await client.auth.mfa.challenge({ factorId: mfaEnrollmentFactorId });
    if (challenge.error) {
      $('mfaManageStatus').textContent = challenge.error.message;
      return;
    }
    const result = await client.auth.mfa.verify({
      factorId: mfaEnrollmentFactorId,
      challengeId: challenge.data.id,
      code
    });
    if (result.error) {
      $('mfaManageStatus').textContent = 'تعذر تأكيد الرمز. تحقق من ساعة الهاتف وحاول مجدداً.';
      return;
    }
    $('mfaEnrollment').hidden = true;
    $('mfaEnrollCode').value = '';
    mfaEnrollmentFactorId = null;
    $('mfaManageStatus').textContent = 'تم تفعيل المصادقة الثنائية بنجاح.';
    await refreshAccountSecurityStatus();
  }

  async function disableMfa() {
    const { data, error } = await client.auth.mfa.listFactors();
    if (error) return $('mfaManageStatus').textContent = error.message;
    const factor = (data.totp || []).find(item => item.status === 'verified');
    if (!factor) return refreshAccountSecurityStatus();
    if (!window.confirm(window.VELOVI_I18N?.t?.('هل تريد إلغاء المصادقة الثنائية لهذا الحساب؟') || 'هل تريد إلغاء المصادقة الثنائية لهذا الحساب؟')) return;
    const result = await client.auth.mfa.unenroll({ factorId: factor.id });
    if (result.error) {
      $('mfaManageStatus').textContent = 'تعذر إلغاء المصادقة الثنائية: ' + result.error.message;
      return;
    }
    $('mfaManageStatus').textContent = 'تم إلغاء المصادقة الثنائية.';
    await refreshAccountSecurityStatus();
  }

  function updatePasswordRules() {
    const value = $('newPassword')?.value || '';
    const checks = {
      length: value.length >= 8,
      upper: /[A-Z]/.test(value),
      lower: /[a-z]/.test(value),
      number: /[0-9]/.test(value),
      special: /[^A-Za-z0-9]/.test(value)
    };
    Object.entries(checks).forEach(([name, valid]) => {
      const item = document.querySelector(`#passwordRules [data-rule="${name}"]`);
      if (!item) return;
      item.classList.toggle('is-valid', valid);
      item.classList.toggle('is-invalid', !valid);
      item.setAttribute('aria-label', item.textContent + (valid ? ' — مستوفى' : ' — غير مستوفى'));
    });
    return checks;
  }

  function updateInvitePasswordRules() {
    const value = $('inviteNewPassword')?.value || '';
    const checks = {
      length: value.length >= 8,
      upper: /[A-Z]/.test(value),
      lower: /[a-z]/.test(value),
      number: /[0-9]/.test(value),
      special: /[^A-Za-z0-9]/.test(value)
    };
    Object.entries(checks).forEach(([name, valid]) => {
      const item = document.querySelector('#invitePasswordRules [data-rule="' + name + '"]');
      if (!item) return;
      item.classList.toggle('is-valid', valid);
      item.classList.toggle('is-invalid', !valid);
    });
    return checks;
  }

  async function setInvitedMemberPassword(event) {
    event.preventDefault();
    const checks = updateInvitePasswordRules();
    const password = $('inviteNewPassword').value;
    if (Object.values(checks).some(valid => !valid)) {
      $('invitePasswordStatus').textContent = 'أكمل شروط كلمة المرور الموضحة أعلاه.';
      $('invitePasswordStatus').className = 'password-status small error';
      return;
    }
    if (password !== $('inviteConfirmPassword').value) {
      $('invitePasswordStatus').textContent = 'كلمتا المرور غير متطابقتين.';
      $('invitePasswordStatus').className = 'password-status small error';
      return;
    }
    const button = $('inviteSetupSubmit');
    button.disabled = true;
    $('invitePasswordStatus').textContent = 'جارٍ حفظ كلمة المرور…';
    $('invitePasswordStatus').className = 'password-status small';
    let result;
    try {
      result = await client.auth.updateUser({
        password,
        data: { velovi_password_setup_complete: true }
      });
    } catch (error) {
      button.disabled = false;
      $('invitePasswordStatus').textContent = 'تعذر الاتصال لحفظ كلمة المرور: ' + (error.message || 'خطأ غير معروف');
      $('invitePasswordStatus').className = 'password-status small error';
      return;
    }
    if (result.error) {
      button.disabled = false;
      $('invitePasswordStatus').textContent = 'تعذر حفظ كلمة المرور: ' + result.error.message;
      $('invitePasswordStatus').className = 'password-status small error';
      return;
    }
    inviteSetupCompleted = true;
    const url = new URL(window.location.href);
    url.searchParams.delete('flow');
    window.history.replaceState({}, document.title, url.pathname + url.search + url.hash);
    $('inviteSetupForm').reset();
    const refreshed = await client.auth.getSession();
    if (refreshed.error || !refreshed.data.session) {
      button.disabled = false;
      $('invitePasswordStatus').textContent = 'تم حفظ كلمة المرور، لكن تعذر تحديث الجلسة. أعد تحميل الصفحة لتسجيل الدخول.';
      $('invitePasswordStatus').className = 'password-status small error';
      return;
    }
    await handleSession(refreshed.data.session);
    if (shell?.classList.contains('is-authenticated')) {
      setMessage('تم إنشاء كلمة المرور وتفعيل حسابك بنجاح. أهلاً بك في الأسرة.', false);
    }
  }

  async function changePassword(event) {
    event.preventDefault();
    const current = $('currentPassword').value;
    const next = $('newPassword').value;
    const checks = updatePasswordRules();
    if (Object.values(checks).some(valid => !valid)) {
      $('passwordStatus').textContent = 'لم تستوفِ كلمة المرور جميع الشروط الموضحة أعلاه.';
      $('passwordStatus').className = 'password-status small error';
      return;
    }
    if (next !== $('confirmNewPassword').value) {
      $('passwordStatus').textContent = 'كلمتا المرور غير متطابقتين.';
      $('passwordStatus').className = 'password-status small error';
      return;
    }
    const result = await client.auth.updateUser({ password: next, current_password: current });
    if (result.error) {
      $('passwordStatus').textContent = 'تعذر تحديث كلمة المرور: ' + result.error.message;
      $('passwordStatus').className = 'password-status small error';
      return;
    }
    $('changePasswordForm').reset();
    updatePasswordRules();
    $('passwordStatus').textContent = '✓ تم تغيير كلمة المرور بنجاح. أصبحت كلمة المرور الجديدة فعّالة لحسابك.';
    $('passwordStatus').className = 'password-status success';
  }

  async function changeEmail(event) {
    event.preventDefault();
    const nextEmail = $('newEmail').value.trim();
    if (!nextEmail || nextEmail.toLowerCase() === String(currentUser?.email || '').toLowerCase()) {
      $('emailStatus').textContent = 'أدخل بريداً إلكترونياً مختلفاً عن الحالي.';
      return;
    }
    const factors = await client.auth.mfa.listFactors();
    const hasMfa = !factors.error && (factors.data.totp || []).some(item => item.status === 'verified');
    if (hasMfa) {
      const assurance = await client.auth.mfa.getAuthenticatorAssuranceLevel();
      if (assurance.error || assurance.data?.currentLevel !== 'aal2') {
        $('emailStatus').textContent = 'أكمل التحقق بخطوتين من جديد قبل تغيير البريد الإلكتروني.';
        return;
      }
    }
    const result = await client.auth.updateUser({ email: nextEmail });
    if (result.error) {
      $('emailStatus').textContent = 'تعذر إرسال طلب تغيير البريد: ' + result.error.message;
      return;
    }
    $('changeEmailForm').reset();
    $('emailStatus').textContent = 'أُرسل رابط تأكيد إلى البريد الجديد. سيبقى البريد الحالي فعالاً حتى إتمام التحقق.';
  }

  async function signOutOtherSessions() {
    if (!window.confirm(window.VELOVI_I18N?.t?.('سيتم إنهاء جلسات Velovi على جميع الأجهزة الأخرى. هل تريد المتابعة؟') || 'سيتم إنهاء جلسات Velovi على جميع الأجهزة الأخرى. هل تريد المتابعة؟')) return;
    const result = await client.auth.signOut({ scope: 'others' });
    $('sessionsStatus').textContent = result.error
      ? 'تعذر إنهاء الجلسات الأخرى: ' + result.error.message
      : 'تم إرسال طلب إنهاء الجلسات الأخرى. قد تبقى رموز الوصول الحالية صالحة حتى انتهاء مدتها.';
  }

  async function deleteOwnAccount(event) {
    event.preventDefault();
    if ($('deleteAccountConfirmation').value.trim() !== 'حذف حسابي') {
      $('deleteAccountStatus').textContent = 'اكتب «حذف حسابي» كما هو للتأكيد.';
      return;
    }
    if (!window.confirm(window.VELOVI_I18N?.t?.('هذا الإجراء نهائي. سيُحذف حساب الدخول وتُعطّل عضوياتك، مع الاحتفاظ بالسجل المالي للأسرة. هل أنت متأكد؟') || 'هذا الإجراء نهائي. سيُحذف حساب الدخول وتُعطّل عضوياتك، مع الاحتفاظ بالسجل المالي للأسرة. هل أنت متأكد؟')) return;
    const factors = await client.auth.mfa.listFactors();
    const hasMfa = !factors.error && (factors.data.totp || []).some(item => item.status === 'verified');
    if (hasMfa) {
      const assurance = await client.auth.mfa.getAuthenticatorAssuranceLevel();
      if (assurance.error || assurance.data?.currentLevel !== 'aal2') {
        $('deleteAccountStatus').textContent = 'أعد تسجيل الدخول وأكمل التحقق بخطوتين قبل حذف الحساب.';
        return;
      }
    } else {
      const password = $('deleteAccountPassword').value;
      const reauth = await client.auth.signInWithPassword({ email: currentUser.email, password });
      if (reauth.error) {
        $('deleteAccountStatus').textContent = 'كلمة المرور الحالية غير صحيحة.';
        return;
      }
    }
    $('deleteAccountStatus').textContent = 'جارٍ حذف الحساب بأمان…';
    const result = await client.functions.invoke('account-security', { body: { operation: 'delete_self' } });
    if (result.error || !result.data?.success) {
      $('deleteAccountStatus').textContent = 'تعذر إكمال حذف الحساب: ' + (result.data?.error || result.error?.message || 'خطأ غير معروف');
      return;
    }
    currentUser = null;
    currentMembership = null;
    currentHousehold = null;
    await client.auth.signOut({ scope: 'local' });
    showGate('login');
    setMessage('تم حذف حساب الدخول. بقي السجل المالي محفوظاً للأسرة.', false);
  }

  async function permanentlyDeleteMember(member) {
    if (member.user_id === currentUser?.id || member.role === 'admin') return;
    const [accounts, transactions] = await Promise.all([
      client.from('financial_accounts').select('id', { count: 'exact', head: true }).eq('household_id', currentHousehold.id).eq('owner_member_id', member.id),
      client.from('financial_transactions').select('id', { count: 'exact', head: true }).eq('household_id', currentHousehold.id).eq('owner_member_id', member.id)
    ]);
    if (accounts.error || transactions.error) return setMessage('تعذر قراءة عدد الحسابات والحركات قبل الحذف.', true);
    const accountCount = accounts.count || 0;
    const transactionCount = transactions.count || 0;
    const confirmText = 'تحذير: حذف العضو ' + (member.display_name || '') + ' وبياناته نهائياً\n\nسيتم حذف ' + accountCount + ' حساب مالي و' + transactionCount + ' حركة مالية مرتبطة به من هذه الأسرة. هذا الإجراء نهائي ولا يمكن التراجع عنه، ولن يمكن استعادة هذه البيانات.\n\nإذا كنت تريد إيقاف عضويته فقط مع الاحتفاظ ببياناته، استخدم «إلغاء عضوية العضو» بدلاً من ذلك.\n\nهل أنت متأكد من الحذف النهائي؟';
    if (!window.confirm(window.VELOVI_I18N?.t?.(confirmText) || confirmText)) return;
    const result = await client.functions.invoke('account-security', {
      body: { operation: 'delete_member', household_id: currentHousehold.id, member_id: member.id }
    });
    if (result.error || !result.data?.success) {
      return setMessage('تعذر الحذف النهائي: ' + (result.data?.error || result.error?.message || 'خطأ غير معروف'), true);
    }
    await refreshMembers();
    await loadFinancialData();
    const warning = result.data.warning ? ' ' + result.data.warning :
      result.data.auth_account_deleted === false ? ' بقي حساب الدخول فعالاً لأنه ما زال عضواً في أسرة أخرى.' : '';
    setMessage('تم حذف بيانات العضو نهائياً من هذه الأسرة: ' + transactionCount + ' حركة و' + accountCount + ' حساب.' + warning, false);
  }

  function initialize() {
    if (!window.supabase || typeof window.supabase.createClient !== 'function') {
      showGate('login');
      return setMessage('تعذر تحميل مكتبة الاتصال بـ Supabase. تحقق من اتصال الإنترنت ثم أعد تحميل الصفحة.', true);
    }
    if (!config.url || !config.anonKey || config.url.includes('YOUR_') || config.anonKey.includes('YOUR_')) {
      showGate('login');
      return setMessage('يلزم إعداد رابط مشروع Supabase ومفتاح النشر العام في ملف supabase-config.js قبل تسجيل الدخول.', true);
    }
    client = window.supabase.createClient(config.url, config.anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });

    $('loginForm').addEventListener('submit', signIn);
    $('createHouseholdForm').addEventListener('submit', createHousehold);
    $('backToLogin').addEventListener('click', () => {
      showGate('login');
      setMessage('', false);
    });
    $('signOutButton').addEventListener('click', signOut);
    $('mfaLoginForm')?.addEventListener('submit', verifyMfaLogin);
    $('inviteSetupForm')?.addEventListener('submit', setInvitedMemberPassword);
    $('inviteNewPassword')?.addEventListener('input', () => {
      updateInvitePasswordRules();
      $('invitePasswordStatus').textContent = '';
      $('invitePasswordStatus').className = 'password-status small';
    });
    $('inviteConfirmPassword')?.addEventListener('input', () => {
      $('invitePasswordStatus').textContent = '';
      $('invitePasswordStatus').className = 'password-status small';
    });
    $('changePasswordForm')?.addEventListener('submit', changePassword);
    $('newPassword')?.addEventListener('input', () => {
      updatePasswordRules();
      $('passwordStatus').textContent = '';
      $('passwordStatus').className = 'password-status small';
    });
    $('confirmNewPassword')?.addEventListener('input', () => {
      $('passwordStatus').textContent = '';
      $('passwordStatus').className = 'password-status small';
    });
    $('changeEmailForm')?.addEventListener('submit', changeEmail);
    $('enableMfa')?.addEventListener('click', beginMfaEnrollment);
    $('verifyMfaEnrollment')?.addEventListener('click', verifyMfaEnrollment);
    $('disableMfa')?.addEventListener('click', disableMfa);
    $('signOutOtherSessions')?.addEventListener('click', signOutOtherSessions);
    $('deleteOwnAccountForm')?.addEventListener('submit', deleteOwnAccount);
    $('inviteMember').addEventListener('click', () => $('addMemberDialog').showModal());
    $('sendInviteEmail').addEventListener('click', sendMemberInviteEmail);
    $('inviteEmail').addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); sendMemberInviteEmail(); } });
    $('copyInviteLink').addEventListener('click', copyMemberInviteLink);
    $('addMemberDialog').addEventListener('close', () => { $('addMemberDialog').dataset.inviteEmail=''; $('addMemberDialog').dataset.inviteLink=''; });
    $('addMemberForm').addEventListener('submit', addMember);
    $('permissionForm').addEventListener('submit', savePermissions);
    $('accountForm').addEventListener('submit', saveAccount);
    $('addAccount').addEventListener('click', () => openAccountDialog());
    $('closeAccountDialog').addEventListener('click', () => $('accountDialog').close());
    $('transactionForm').addEventListener('submit', saveTransaction);
    $('txType').addEventListener('change', () => window.VELOVI_CATEGORIES?.populate($('txCategoryOptions'),$('txType').value));
    $('closeTransactionDialog').addEventListener('click', () => $('transactionDialog').close());
    $('selectAllTransactions')?.addEventListener('change', event => {
      document.querySelectorAll('#txRows .tx-select').forEach(box => {
        if (!box.closest('tr')?.hidden) box.checked = event.target.checked;
      });
      updateBulkSelectionUi();
    });
    $('bulkDeleteTransactions')?.addEventListener('click', deleteSelectedTransactions);
    document.querySelectorAll('[data-open-add]').forEach(button => button.addEventListener('click', event => {
      event.preventDefault();
      openTransactionDialog();
    }));
    $('saveImportedRows').addEventListener('click', saveImportedRows);
    $('calcSmartForecast').addEventListener('click', calculateSmartForecast);
    $('chartType').addEventListener('change', () => window.VELOVI_FINANCE_CHART?.());
    $('chartPeriod').addEventListener('change', () => window.VELOVI_FINANCE_CHART?.());
    $('forecastCurrency').addEventListener('change', () => {
      localStorage.setItem('velovi-forecast-currency', $('forecastCurrency').value);
      calculateSmartForecast();
    });

    client.auth.onAuthStateChange((_event, session) => {
      window.setTimeout(() => handleSession(session), 0);
    });
    client.auth.getSession().then(({ data, error }) => {
      if (error) return setMessage('تعذر قراءة جلسة الدخول: ' + error.message, true);
      handleSession(data.session);
    });
  }

  initialize();
})();
