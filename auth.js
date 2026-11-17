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
    if (shell) shell.classList.remove('is-authenticated');
    if (gate) gate.hidden = false;
    if (loginPanel) loginPanel.hidden = panel !== 'login';
    if (createPanel) createPanel.hidden = panel !== 'create';
  }

  function showApp() {
    if (gate) gate.hidden = true;
    if (shell) shell.classList.add('is-authenticated');
  }

  function emptyState(text) {
    const el = document.createElement('div');
    el.className = 'empty-state';
    el.textContent = text;
    return el;
  }

  function clearDemoData() {
    document.querySelectorAll('#home .stat strong, #accounts .stat strong').forEach(el => {
      el.textContent = '—';
    });
    document.querySelectorAll('#home .stat small, #accounts .stat small').forEach(el => {
      el.textContent = 'بانتظار ربط البيانات المالية';
    });
    const txList = document.querySelector('#home .transaction-list');
    if (txList) txList.replaceChildren(emptyState('لا توجد حركات مالية مسجلة بعد.'));
    const donutWrap = document.querySelector('#home .donut-wrap');
    if (donutWrap) donutWrap.replaceChildren(emptyState('سيظهر التوزيع بعد إضافة الحركات.'));
    const legend = document.querySelector('#home .legend');
    if (legend) legend.replaceChildren();
    const txRows = $('txRows');
    if (txRows) {
      const row = document.createElement('tr');
      const cell = document.createElement('td');
      cell.colSpan = 5;
      cell.textContent = 'لا توجد حركات مالية بعد.';
      row.appendChild(cell);
      txRows.replaceChildren(row);
    }
    const accountsStats = document.querySelector('#accounts .stats');
    if (accountsStats) accountsStats.replaceWith(emptyState('لا توجد حسابات مالية مسجلة بعد.'));
    const homeNotice = document.querySelector('#home .notice');
    if (homeNotice) {
      const b = homeNotice.querySelector('b');
      const p = homeNotice.querySelector('p');
      if (b) b.textContent = 'تم الاتصال بحساب الأسرة';
      if (p) p.textContent = 'هذه مساحة الأسرة الفعلية. ستظهر الأرصدة والحركات بعد تفعيل ربط البيانات المالية.';
    }
    document.querySelectorAll('[data-open-add], #addAccount').forEach(button => {
      button.disabled = true;
      button.title = 'سيتم تفعيل هذه الوظيفة في مرحلة ربط البيانات المالية';
      button.setAttribute('aria-disabled', 'true');
    });
    const reportInputs = document.querySelectorAll('#reports .form-grid input');
    reportInputs.forEach(input => { input.value = '0'; });
    const forecast = $('forecastResult');
    if (forecast) forecast.textContent = 'أدخل بياناتك لحساب سيناريو افتراضي.';
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
      sub.textContent = member.user_id === currentUser.id
        ? (member.role === 'admin' ? 'أنت · مدير الأسرة' : 'أنت · عضو الأسرة')
        : (member.role === 'admin' ? 'مدير الأسرة' : 'عضو الأسرة');
      if (!member.is_active) sub.textContent += ' · عضوية غير نشطة';
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
            '　 حذف ' + (member.can_delete_transactions ? '✓' : '✕')
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
            remove.textContent = 'إزالة العضو';
            remove.addEventListener('click', () => removeMember(member));
            actions.appendChild(remove);
          } else {
            const reactivate = document.createElement('button');
            reactivate.type = 'button';
            reactivate.className = 'secondary';
            reactivate.textContent = 'إعادة التفعيل';
            reactivate.addEventListener('click', () => {
              $('memberUserId').value = member.user_id;
              $('memberDisplayName').value = member.display_name || '';
              $('addMemberDialog').showModal();
            });
            actions.appendChild(reactivate);
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
    dialog.showModal();
  }

  async function refreshMembers() {
    const result = await client
      .from('household_members')
      .select('id, household_id, user_id, display_name, role, is_active, can_add_transactions, can_edit_transactions, can_delete_transactions')
      .eq('household_id', currentMembership.household_id)
      .order('display_name', { ascending: true });
    if (result.error) throw result.error;
    currentMembers = result.data || [];
    renderMembers(currentMembers, currentMembership);
  }

  async function loadWorkspace() {
    setMessage('جارٍ تحميل بيانات الأسرة...', false);
    const own = await client
      .from('household_members')
      .select('id, household_id, user_id, display_name, role, is_active, can_add_transactions, can_edit_transactions, can_delete_transactions')
      .eq('user_id', currentUser.id)
      .order('is_active', { ascending: false });

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
    const householdResult = await client
      .from('households')
      .select('id, name')
      .eq('id', currentMembership.household_id)
      .maybeSingle();
    if (householdResult.error) throw householdResult.error;
    if (!householdResult.data) throw new Error('تعذر العثور على الأسرة المرتبطة بهذا الحساب.');

    currentHousehold = householdResult.data;
    await refreshMembers();
    clearDemoData();
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
    currentUser = session.user;
    const signOut = $('signOutButton');
    if (signOut) signOut.hidden = false;
    const sync = document.querySelector('.sync');
    if (sync) sync.textContent = 'متصل · إعداد الأسرة';
    try {
      await loadWorkspace();
    } catch (error) {
      console.error('Velovi workspace error:', error);
      showGate('login');
      setMessage('تعذر تحميل بيانات الأسرة: ' + (error.message || 'خطأ غير معروف'), true);
    }
  }

  async function signIn(event) {
    event.preventDefault();
    const email = $('loginEmail').value.trim();
    const password = $('loginPassword').value;
    if (!email || !password) return setMessage('أدخل البريد الإلكتروني وكلمة المرور.', true);
    const button = $('loginSubmit');
    button.disabled = true;
    setMessage('جارٍ تسجيل الدخول...', false);
    const result = await client.auth.signInWithPassword({ email, password });
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
    const result = await client.rpc('create_household', {
      p_name: name,
      p_display_name: displayName
    });
    button.disabled = false;
    if (result.error) return setMessage('تعذر إنشاء الأسرة: ' + result.error.message, true);
    currentMembership = null;
    try {
      await loadWorkspace();
    } catch (error) {
      setMessage('تم إنشاء الأسرة، لكن تعذر تحميلها: ' + (error.message || 'خطأ غير معروف'), true);
    }
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
      p_can_delete: $('permissionDelete').checked
    });
    if (result.error) return setMessage('تعذر تحديث الصلاحيات: ' + result.error.message, true);
    dialog.close();
    await refreshMembers();
    setMessage('تم تحديث صلاحيات العضو.', false);
  }

  async function removeMember(member) {
    if (!window.confirm('هل تريد إزالة هذا العضو من الأسرة؟ سيبقى سجله محفوظاً ويمكن إعادة تفعيله لاحقاً.')) return;
    const result = await client.rpc('remove_household_member', {
      p_household_id: currentHousehold.id,
      p_member_id: member.id
    });
    if (result.error) return setMessage('تعذرت إزالة العضو: ' + result.error.message, true);
    await refreshMembers();
    setMessage('تمت إزالة العضو مع الاحتفاظ بسجله.', false);
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
    $('inviteMember').addEventListener('click', () => $('addMemberDialog').showModal());
    $('addMemberForm').addEventListener('submit', addMember);
    $('permissionForm').addEventListener('submit', savePermissions);

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
