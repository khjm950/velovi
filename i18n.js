'use strict';
(() => {
  const dictionaries = {
    de: {
      'إدارة مالية الأسرة':'Familienfinanzen','الرئيسية':'Übersicht','الحركات':'Buchungen','الحركات المالية':'Finanzbuchungen',
      'الحسابات':'Konten','أفراد الأسرة والصلاحيات':'Familie & Berechtigungen','التقارير والتوقعات':'Berichte & Prognosen',
      'الاستيراد البنكي':'Import','الإعدادات':'Einstellungen','المزيد':'Mehr','لوحة التحكم':'Dashboard',
      'نظرة عامة':'Übersicht','ملخص الوضع المالي للفترة المحددة':'Finanzübersicht für den ausgewählten Zeitraum',
      'إضافة حركة':'Buchung hinzufügen','إجمالي الإيرادات · كل السجل':'Einnahmen · Gesamtzeitraum',
      'إجمالي المصروفات · كل السجل':'Ausgaben · Gesamtzeitraum','الفائض الشهري':'Monatlicher Überschuss',
      'إجمالي الأرصدة المعروضة':'Angezeigte Kontostände','مجموع الإيرادات المسجلة في كل الفترات':'Alle erfassten Einnahmen',
      'مجموع المصروفات المسجلة في كل الفترات':'Alle erfassten Ausgaben','من الحركات والحسابات المسجلة فعلياً':'Aus gespeicherten Buchungen und Konten',
      'آخر الحركات':'Letzte Buchungen','عرض الكل ←':'Alle anzeigen ←','توزيع المصروفات':'Ausgabenverteilung',
      'الفترة':'Zeitraum','هذا الشهر':'Dieser Monat','آخر 3 أشهر':'Letzte 3 Monate','هذا العام':'Dieses Jahr',
      'طريقة العرض':'Darstellung','دائري':'Ringdiagramm','أعمدة':'Balken','السكن':'Wohnen','الطعام':'Lebensmittel',
      'المنزل':'Haushalt','أخرى':'Sonstiges','إجمالي الإيرادات':'Einnahmen gesamt','إجمالي المصروفات':'Ausgaben gesamt',
      'الصافي للفترة':'Saldo im Zeitraum','عدد الحركات':'Anzahl Buchungen','ابحث في الحركات...':'Buchungen suchen…',
      'كل الأنواع':'Alle Typen','الإيرادات':'Einnahmen','المصروفات':'Ausgaben','الترتيب':'Sortierung',
      'الأحدث':'Neueste zuerst','الأقدم':'Älteste zuerst','الأعلى مبلغاً':'Höchster Betrag','الأقل مبلغاً':'Niedrigster Betrag',
      'النوع':'Typ','التصنيف':'Kategorie','الوصف':'Beschreibung','التاريخ':'Datum','المبلغ':'Betrag',
      'من':'Von','إلى':'Bis','مسح الفلاتر':'Filter zurücksetzen','لا توجد حركات مالية مسجلة بعد.':'Noch keine Buchungen vorhanden.',
      'إضافة حساب':'Konto hinzufügen','إضافة حساب مالي':'Finanzkonto hinzufügen','اسم الحساب':'Kontoname',
      'نوع الحساب':'Kontotyp','حساب بنكي':'Bankkonto','مدخرات':'Sparkonto','نقد':'Bargeld','صاحب الحساب':'Kontoinhaber',
      'الرصيد الافتتاحي':'Anfangssaldo','يمكن إدخال رصيد سالب. لا تغيّر العملة بعد تسجيل حركات على الحساب إلا بعد مراجعة السجل.':'Ein negativer Anfangssaldo ist möglich. Ändern Sie die Währung nach Buchungen nicht ohne vorherige Prüfung.',
      'تعديل':'Bearbeiten','حذف الحساب':'Konto löschen','قراءة فقط':'Nur Lesen','مدير':'Administrator','عضو':'Mitglied',
      'دعوة عضو':'Mitglied einladen','دعوة عضو إلى الأسرة':'Familienmitglied einladen','البريد الإلكتروني':'E-Mail-Adresse',
      'الاسم المعروض':'Anzeigename','دعوة عبر البريد':'Per E-Mail einladen','نسخ رابط الدعوة':'Einladungslink kopieren',
      'إضافة الحساب الموجود':'Bestehendes Konto hinzufügen','إضافة العضو':'Mitglied hinzufügen','إزالة العضو':'Mitglied entfernen',
      'إعادة التفعيل':'Reaktivieren','تعديل الصلاحيات':'Berechtigungen bearbeiten','المظهر والألوان':'Design und Farben',
      'ألوان الرسوم البيانية':'Diagrammfarben','أخضر Velovi':'Velovi-Grün','أزرق':'Blau','بنفسجي':'Violett','داكن':'Dunkel',
      'وردي':'Rosé','ذهبي':'Gold','محيطي':'Ozean','دافئ':'Warm','غابة':'Wald','غروب':'Sonnenuntergang',
      'اللغة':'Sprache','العملة المفضلة':'Bevorzugte Währung','العربية':'Arabisch','Deutsch':'Deutsch','English':'Englisch',
      'الواجهة متاحة بالعربية والألمانية والإنجليزية.':'Die Oberfläche ist auf Arabisch, Deutsch und Englisch verfügbar.',
      'التخطيط المالي':'Finanzplanung','التوقع الذكي من سجل الأسرة':'Intelligente Prognose aus Familiendaten',
      'مدة التوقع (بالأشهر)':'Prognosezeitraum (Monate)','تحليل وبناء التوقع':'Prognose berechnen',
      'استيراد كشوف الحسابات':'Kontoauszüge importieren','قراءة كشف حساب PDF أو صورة':'PDF-Auszug oder Bild lesen',
      'اختيار ملف':'Datei auswählen','التقاط صورة':'Foto aufnehmen','مسح QR / باركود':'QR-/Barcode scannen',
      'مراجعة البيانات المستخرجة':'Erkannte Daten prüfen','اعتماد':'Auswählen','حفظ الحركات في Velovi':'Buchungen in Velovi speichern',
      'تنزيل CSV للمراجعة':'CSV zur Prüfung herunterladen','عرض النص الذي قرأه النظام':'Erkannten Text anzeigen',
      'الحساب الذي ستُضاف إليه الحركات':'Zielkonto für importierte Buchungen','لا توجد حسابات مالية بعد. أضف حساباً للبدء.':'Noch keine Konten. Fügen Sie zuerst ein Konto hinzu.',
      'حفظ':'Speichern','إغلاق':'Schließen','إلغاء':'Abbrechen','حفظ الحركة':'Buchung speichern','حفظ التعديلات':'Änderungen speichern',
      'إضافة حركة مالية':'Finanzbuchung hinzufügen','نوع الحركة':'Buchungstyp','إيراد':'Einnahme','مصروف':'Ausgabe',
      'الحساب':'Konto','اختر حساباً':'Konto auswählen','اختر حساباً مالياً':'Finanzkonto auswählen',
      'الرصيد الحالي':'Aktueller Kontostand','الفائض الشهري —':'Monatlicher Überschuss —','تسجيل الدخول':'Anmelden',
      'كلمة المرور':'Passwort','إنشاء أسرتك':'Familie erstellen','اسم الأسرة':'Familienname','إنشاء الأسرة':'Familie erstellen',
      'متصل':'Verbunden','يتطلب تسجيل الدخول':'Anmeldung erforderlich','تسجيل الخروج':'Abmelden'
    },
    en: {
      'إدارة مالية الأسرة':'Family Finance','الرئيسية':'Home','الحركات':'Transactions','الحركات المالية':'Transactions',
      'الحسابات':'Accounts','أفراد الأسرة والصلاحيات':'Family & Permissions','التقارير والتوقعات':'Reports & Forecasts',
      'الاستيراد البنكي':'Import','الإعدادات':'Settings','المزيد':'More','لوحة التحكم':'Dashboard',
      'نظرة عامة':'Overview','ملخص الوضع المالي للفترة المحددة':'Financial overview for the selected period',
      'إضافة حركة':'Add transaction','إجمالي الإيرادات · كل السجل':'Total income · All time',
      'إجمالي المصروفات · كل السجل':'Total expenses · All time','الفائض الشهري':'Monthly surplus',
      'إجمالي الأرصدة المعروضة':'Displayed account balances','مجموع الإيرادات المسجلة في كل الفترات':'All recorded income',
      'مجموع المصروفات المسجلة في كل الفترات':'All recorded expenses','من الحركات والحسابات المسجلة فعلياً':'From saved transactions and accounts',
      'آخر الحركات':'Recent transactions','عرض الكل ←':'View all ←','توزيع المصروفات':'Expense breakdown',
      'الفترة':'Period','هذا الشهر':'This month','آخر 3 أشهر':'Last 3 months','هذا العام':'This year',
      'طريقة العرض':'Chart type','دائري':'Donut','أعمدة':'Bars','السكن':'Housing','الطعام':'Food','المنزل':'Household','أخرى':'Other',
      'الصافي للفترة':'Net for period','عدد الحركات':'Transaction count','ابحث في الحركات...':'Search transactions…',
      'كل الأنواع':'All types','الإيرادات':'Income','المصروفات':'Expenses','الترتيب':'Sort',
      'الأحدث':'Newest','الأقدم':'Oldest','الأعلى مبلغاً':'Highest amount','الأقل مبلغاً':'Lowest amount',
      'النوع':'Type','التصنيف':'Category','الوصف':'Description','التاريخ':'Date','المبلغ':'Amount',
      'من':'From','إلى':'To','مسح الفلاتر':'Clear filters','لا توجد حركات مالية مسجلة بعد.':'No transactions recorded yet.',
      'إضافة حساب':'Add account','إضافة حساب مالي':'Add financial account','اسم الحساب':'Account name',
      'نوع الحساب':'Account type','حساب بنكي':'Bank account','مدخرات':'Savings','نقد':'Cash','صاحب الحساب':'Account owner',
      'الرصيد الافتتاحي':'Opening balance','تعديل':'Edit','حذف الحساب':'Delete account','قراءة فقط':'Read only',
      'مدير':'Admin','عضو':'Member','دعوة عضو':'Invite member','دعوة عضو إلى الأسرة':'Invite a family member',
      'البريد الإلكتروني':'Email address','الاسم المعروض':'Display name','دعوة عبر البريد':'Invite by email',
      'نسخ رابط الدعوة':'Copy invitation link','إضافة الحساب الموجود':'Add existing account','إضافة العضو':'Add member',
      'إزالة العضو':'Remove member','إعادة التفعيل':'Reactivate','تعديل الصلاحيات':'Edit permissions',
      'المظهر والألوان':'Appearance and colors','ألوان الرسوم البيانية':'Chart colors','أخضر Velovi':'Velovi green',
      'أزرق':'Blue','بنفسجي':'Violet','داكن':'Dark','وردي':'Rose','ذهبي':'Amber','محيطي':'Ocean','دافئ':'Warm',
      'غابة':'Forest','غروب':'Sunset','اللغة':'Language','العملة المفضلة':'Preferred currency',
      'العربية':'Arabic','Deutsch':'German','English':'English',
      'الواجهة متاحة بالعربية والألمانية والإنجليزية.':'The interface is available in Arabic, German, and English.',
      'التخطيط المالي':'Financial planning','التوقع الذكي من سجل الأسرة':'Smart forecast from family history',
      'مدة التوقع (بالأشهر)':'Forecast horizon (months)','تحليل وبناء التوقع':'Build forecast',
      'استيراد كشوف الحسابات':'Import statements','قراءة كشف حساب PDF أو صورة':'Read a PDF statement or image',
      'اختيار ملف':'Choose file','التقاط صورة':'Take photo','مسح QR / باركود':'Scan QR / barcode',
      'مراجعة البيانات المستخرجة':'Review extracted data','اعتماد':'Include','حفظ الحركات في Velovi':'Save transactions to Velovi',
      'تنزيل CSV للمراجعة':'Download review CSV','عرض النص الذي قرأه النظام':'Show extracted text',
      'الحساب الذي ستُضاف إليه الحركات':'Account to receive transactions','لا توجد حسابات مالية بعد. أضف حساباً للبدء.':'No accounts yet. Add an account to get started.',
      'حفظ':'Save','إغلاق':'Close','إلغاء':'Cancel','حفظ الحركة':'Save transaction','حفظ التعديلات':'Save changes',
      'إضافة حركة مالية':'Add transaction','نوع الحركة':'Transaction type','إيراد':'Income','مصروف':'Expense',
      'الحساب':'Account','اختر حساباً':'Choose an account','اختر حساباً مالياً':'Choose a financial account',
      'الرصيد الحالي':'Current balance','الفائض الشهري —':'Monthly surplus —','تسجيل الدخول':'Sign in',
      'كلمة المرور':'Password','إنشاء أسرتك':'Create your family','اسم الأسرة':'Family name','إنشاء الأسرة':'Create family',
      'متصل':'Connected','يتطلب تسجيل الدخول':'Sign in required','تسجيل الخروج':'Sign out'
    }
  };
  const originals = new WeakMap();
  const attrOriginals = new WeakMap();
  const languageSelect = document.getElementById('languageSetting');
  const language = () => localStorage.getItem('velovi-language') || languageSelect?.value || 'ar';
  function translateTextNode(node, lang) {
    if (!originals.has(node)) originals.set(node, node.nodeValue);
    const source = originals.get(node);
    const trimmed = source.trim();
    if (!trimmed) return;
    const translated = dictionaries[lang]?.[trimmed];
    if (translated) node.nodeValue = source.replace(trimmed, translated);
    else node.nodeValue = source;
  }
  function translateElement(element, lang) {
    const attrs = ['placeholder','title','aria-label'];
    let saved = attrOriginals.get(element);
    if (!saved) { saved = {}; attrs.forEach(a => { if(element.hasAttribute(a)) saved[a]=element.getAttribute(a); }); attrOriginals.set(element,saved); }
    attrs.forEach(a => { if(saved[a]) element.setAttribute(a,dictionaries[lang]?.[saved[a]] || saved[a]); });
    if (element.tagName === 'OPTION' && !element.dataset.i18nOriginal) element.dataset.i18nOriginal = element.textContent;
    if (element.tagName === 'OPTION' && element.dataset.i18nOriginal) element.textContent = dictionaries[lang]?.[element.dataset.i18nOriginal] || element.dataset.i18nOriginal;
  }
  function translateTree(root) {
    const lang=language();
    document.documentElement.lang=lang;
    document.documentElement.dir=lang==='ar'?'rtl':'ltr';
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
    nodes.forEach(node=>translateTextNode(node,lang));
    if(root.nodeType===1)translateElement(root,lang);
    root.querySelectorAll?.('*').forEach(el=>translateElement(el,lang));
  }
  function applyLanguage() { translateTree(document.body); }
  languageSelect?.addEventListener('change', () => {
    localStorage.setItem('velovi-language',languageSelect.value);
    applyLanguage();
    const status=document.getElementById('settingsStatus');
    if(status)status.textContent=languageSelect.value==='ar'?'تم حفظ اللغة.':languageSelect.value==='de'?'Sprache gespeichert.':'Language saved.';
  });
  const observer=new MutationObserver(records=>{
    const lang=language();
    for(const record of records){
      if(record.type==='childList')record.addedNodes.forEach(node=>{if(node.nodeType===1)translateTree(node);else if(node.nodeType===3)translateTextNode(node,lang);});
      else if(record.type==='characterData')translateTextNode(record.target,lang);
    }
  });
  applyLanguage();
  observer.observe(document.body,{subtree:true,childList:true,characterData:true});
  window.VELOVI_I18N={apply:applyLanguage};
})();