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
      'سجّل الدخول باستخدام حسابك المسجل في Velovi.':'Melden Sie sich mit Ihrem Velovi-Konto an.',
      'لا توجد أسرة مرتبطة بهذا الحساب. أنشئ أسرتك للبدء.':'Diesem Konto ist noch keine Familie zugeordnet. Erstellen Sie Ihre Familie.',
      'اسمك المعروض':'Ihr Anzeigename','العودة لتسجيل الدخول':'Zurück zur Anmeldung',
      'الاتصال يستخدم مفتاح Supabase العام فقط، وتبقى حماية البيانات مسؤولية سياسات RLS.':'Die Verbindung verwendet nur den öffentlichen Supabase-Schlüssel. Der Datenschutz wird durch RLS-Richtlinien gewährleistet.',
      'الأسرة':'Familie','المساحة العائلية':'Familienbereich','نموذج تجريبي':'Testversion',
      'لا توجد حماية حسابات أو مزامنة فعلية بعد':'Kontoschutz und Synchronisierung sind noch nicht vollständig eingerichtet',
      'نسخة واجهات أولية · 0.1':'Frühe Oberflächenversion · 0.1','بيانات تجريبية للعرض فقط':'Nur Beispieldaten',
      'هذه الواجهة لا تتصل بقاعدة بيانات ولا تحفظ بيانات مالية حقيقية بعد.':'Diese Vorschau speichert noch keine echten Finanzdaten.',
      'الإيرادات مطروحاً منها المصروفات':'Einnahmen abzüglich Ausgaben','مجموع الحساب الجاري والمدخرات والنقد':'Summe aus Girokonto, Ersparnissen und Bargeld',
      'دخل · 01 نوفمبر 2026':'Einnahmen · 1. November 2026','السكن · 03 نوفمبر 2026':'Wohnen · 3. November 2026',
      'طعام · 05 نوفمبر 2026':'Lebensmittel · 5. November 2026','منزل · 07 نوفمبر 2026':'Haushalt · 7. November 2026',
      'نموذج توضيحي للشهر الحالي':'Beispiel für den aktuellen Monat','الإجمالي':'Gesamt',
      'إيراداتك ومصروفاتك والتحويلات':'Einnahmen, Ausgaben und Überweisungen',
      'الأرصدة':'Kontostände','الحسابات المرتبطة بالأسرة والأرصدة المحسوبة من الحركات المسجلة':'Familienkonten und aus Buchungen berechnete Salden',
      'إدارة من يمكنه الإضافة والتعديل والحذف':'Verwalten Sie, wer Buchungen hinzufügen, bearbeiten und löschen darf',
      'سياسة الخصوصية المعتمدة':'Festgelegte Datenschutzregel','كل عضو يرى بياناته المالية فقط. المدير يستطيع رؤية بيانات جميع الأعضاء وإدارة صلاحياتهم.':'Jedes Mitglied sieht nur seine eigenen Finanzdaten. Der Administrator kann alle Mitgliedsdaten sehen und Berechtigungen verwalten.',
      'التوقعات تقديرية وتتأثر بالتضخم والعوائد وتغير الدخل والمصروفات.':'Prognosen sind Schätzungen und hängen von Inflation, Renditen sowie Änderungen bei Einnahmen und Ausgaben ab.',
      'تحليل آخر ستة أشهر، والتعرف على البنود المتكررة والمتغيرة، مع إمكانية استثناء أي تصنيف.':'Analysiert die letzten sechs Monate, erkennt wiederkehrende und variable Posten und ermöglicht den Ausschluss einzelner Kategorien.',
      'عملة التوقع':'Prognosewährung','تلقائي':'Automatisch','البنود الداخلة في التوقع':'In der Prognose enthaltene Posten',
      'أزل علامة الاختيار لاستبعاد التصنيف من التوقع.':'Deaktivieren Sie eine Kategorie, um sie auszuschließen.',
      'ستظهر التصنيفات بعد تحميل الحركات المالية.':'Kategorien erscheinen nach dem Laden der Buchungen.',
      'سيظهر التوقع بعد توفر سجل مالي كافٍ.':'Die Prognose wird angezeigt, sobald genügend Finanzdaten vorhanden sind.',
      'محاكاة يدوية إضافية':'Zusätzliche manuelle Simulation','اختبر رصيداً وفائضاً شهرياً افتراضيين بصورة مستقلة عن التوقع الذكي.':'Testen Sie einen angenommenen Kontostand und monatlichen Überschuss unabhängig von der intelligenten Prognose.',
      'اضغط ± داخل الحقل للتبديل بين الرصيد الموجب والسالب.':'Mit ± wechseln Sie zwischen positivem und negativem Saldo.',
      'العائد السنوي (%)':'Jährliche Rendite (%)','حساب التوقع':'Prognose berechnen',
      'أدخل القيم ثم احسب السيناريو الافتراضي.':'Geben Sie Werte ein und berechnen Sie das Szenario.',
      'تفضيلات التطبيق':'App-Einstellungen','المزامنة البنكية التلقائية':'Automatische Banksynchronisierung',
      'غير مفعّل بعد':'Noch nicht aktiviert','لم يتم اختيار ملف.':'Keine Datei ausgewählt.',
      'ملاحظة:':'Hinweis:','قد تحتاج الصور المائلة أو منخفضة الدقة إلى مراجعة يدوية. لا تعتمد الحركات تلقائياً.':'Schräg aufgenommene oder unscharfe Bilder müssen möglicherweise manuell geprüft werden. Buchungen werden nicht automatisch übernommen.',
      'تحقق من التاريخ والوصف والمبلغ ونوع الحركة.':'Prüfen Sie Datum, Beschreibung, Betrag und Buchungstyp.',
      'اختر الحساب وراجع الحركات قبل حفظها. سيتم التحقق من صلاحياتك ومنع التكرار.':'Wählen Sie ein Konto und prüfen Sie die Buchungen vor dem Speichern. Berechtigungen und Duplikate werden geprüft.',
      'ربط البنك مباشرة عبر مزود مصرفي متخصص ما زال قيد الدراسة. لن نطلب كلمة مرور البنك في Velovi.':'Eine direkte Bankanbindung über einen spezialisierten Anbieter wird noch geprüft. Velovi fragt niemals nach Ihrem Bankpasswort.',
      'سيظهر التوقع بعد توفر سجل مالي كافٍ.':'Die Prognose erscheint, sobald genügend Finanzdaten vorliegen.',
      'حفظ الحركة':'Buchung speichern','حفظ الحساب':'Konto speichern','تغيير إشارة الرصيد':'Vorzeichen des Saldos ändern',
      '＋ إضافة حركة':'＋ Buchung hinzufügen','الحركات المسجلة فعلياً · يمكن فرز الأعمدة وتصفية السجل':'Gespeicherte Buchungen · sortierbar und filterbar',
      'الراتب الشهري':'Monatsgehalt','الإيجار':'Miete','مشتريات السوبرماركت':'Supermarkteinkauf','فاتورة الكهرباء':'Stromrechnung',
      'السجل المالي':'Finanzübersicht','＋ إضافة حساب':'＋ Konto hinzufügen','الحسابات المالية':'Finanzkonten',
      'جارٍ تحميل الحسابات...':'Konten werden geladen…','إدارة الأسرة':'Familienverwaltung','＋ دعوة عضو':'＋ Mitglied einladen',
      'المدير':'Administrator','أنت · مدير الأسرة':'Sie · Familienadministrator','عضو الأسرة 1':'Familienmitglied 1',
      'عضو تجريبي · لا توجد صلاحيات فعلية':'Testmitglied · keine aktiven Berechtigungen','إضافة ✓':'Hinzufügen ✓',
      'تعديل ✓':'Bearbeiten ✓','حذف ✕':'Löschen ✕','عضو الأسرة 2':'Familienmitglied 2',
      'توقعات مبنية على سجل الحركات الفعلية وأنماط الإنفاق والدخل':'Prognosen basieren auf Buchungen sowie Einnahmen- und Ausgabemustern',
      'الرصيد الحالي —':'Aktueller Kontostand —','تخصيص اللغة والعملة والمظهر':'Sprache, Währung und Design anpassen',
      'اللغة والمنطقة':'Sprache und Region','لغة الواجهة':'Anzeigesprache','العملة':'Währung',
      'تُستخدم كعملة افتراضية للحسابات الجديدة والسيناريو اليدوي. لا تحوّل أرصدة الحسابات أو الحركات المسجلة.':'Wird als Standardwährung für neue Konten und manuelle Szenarien verwendet. Bestehende Salden und Buchungen werden nicht umgerechnet.',
      'تُحفظ التفضيلات على هذا الجهاز في النسخة التجريبية.':'Einstellungen werden in dieser Version auf diesem Gerät gespeichert.',
      'استيراد بنكي':'Bankimport','قراءة كشوف PDF والصور ومراجعة الحركات قبل اعتمادها':'PDF-Auszüge und Bilder lesen und Buchungen vor dem Übernehmen prüfen',
      'اختر ملف PDF أو JPG أو PNG، أو التقط صورة مباشرة. تتم القراءة داخل جهازك ولا يُرفع الملف إلى خادم خارجي.':'Wählen Sie eine PDF-, JPG- oder PNG-Datei oder nehmen Sie ein Foto auf. Die Verarbeitung erfolgt lokal; die Datei wird nicht hochgeladen.',
      'جارٍ تجهيز الملف...':'Datei wird vorbereitet…','0 حركة':'0 Buchungen','بعد اختيار ملف، ستظهر الحركات المكتشفة هنا.':'Nach Auswahl einer Datei erscheinen erkannte Buchungen hier.',
      'وجّه الكاميرا نحو الرمز.':'Richten Sie die Kamera auf den Code.','تُحفظ الحركة في حسابك وتظهر على الأجهزة الأخرى بعد تسجيل الدخول.':'Die Buchung wird in Ihrem Konto gespeichert und nach der Anmeldung auf anderen Geräten angezeigt.',
      'تعديل صلاحيات العضو':'Mitgliedsberechtigungen bearbeiten','السماح بإضافة الحركات':'Buchungen hinzufügen erlauben',
      'السماح بتعديل الحركات':'Buchungen bearbeiten erlauben','السماح بحذف الحركات':'Buchungen löschen erlauben',
      'السماح برؤية حسابات الأعضاء الآخرين (قراءة فقط)':'Konten anderer Mitglieder anzeigen (nur Lesen)',
      'حفظ الصلاحيات':'Berechtigungen speichern','أدخل البريد الإلكتروني لإنشاء دعوة آمنة. يمكنك فتح رسالة بريد جاهزة أو نسخ الرابط ومشاركته. يجب على العضو إكمال التحقق قبل تسجيل الدخول.':'Geben Sie eine E-Mail-Adresse ein, um eine sichere Einladung zu erstellen. Öffnen Sie eine vorbereitete E-Mail oder kopieren und teilen Sie den Link. Das Mitglied muss die Verifizierung abschließen.',
      'إضافة حساب موجود بواسطة UID':'Bestehendes Konto per UID hinzufügen','معرّف المستخدم UID':'Benutzer-ID (UID)',
      'EUR · يورو (€)':'EUR · Euro (€)','USD · دولار أمريكي ($)':'USD · US-Dollar ($)','GBP · جنيه إسترليني (£)':'GBP · Britisches Pfund (£)',
      'CHF · فرنك سويسري':'CHF · Schweizer Franken','SAR · ريال سعودي (ر.س)':'SAR · Saudi-Riyal (ر.س)','AED · درهم إماراتي (د.إ)':'AED · VAE-Dirham (د.إ)',
      'CAD · دولار كندي':'CAD · Kanadischer Dollar','AUD · دولار أسترالي':'AUD · Australischer Dollar','NZD · دولار نيوزيلندي':'NZD · Neuseeland-Dollar',
      'JPY · ين ياباني (¥)':'JPY · Japanischer Yen (¥)','CNY · يوان صيني (¥)':'CNY · Chinesischer Yuan (¥)','INR · روبية هندية (₹)':'INR · Indische Rupie (₹)',
      'TRY · ليرة تركية (₺)':'TRY · Türkische Lira (₺)','BRL · ريال برازيلي (R$)':'BRL · Brasilianischer Real (R$)','MXN · بيزو مكسيكي':'MXN · Mexikanischer Peso',
      'ZAR · راند جنوب أفريقي':'ZAR · Südafrikanischer Rand','SEK · كرونة سويدية':'SEK · Schwedische Krone','NOK · كرونة نرويجية':'NOK · Norwegische Krone',
      'DKK · كرونة دنماركية':'DKK · Dänische Krone','PLN · زلوتي بولندي':'PLN · Polnischer Złoty','CZK · كرونة تشيكية':'CZK · Tschechische Krone',
      'HUF · فورنت مجري':'HUF · Ungarischer Forint','RON · ليو روماني':'RON · Rumänischer Leu','BGN · ليف بلغاري':'BGN · Bulgarischer Lew',
      'SGD · دولار سنغافوري':'SGD · Singapur-Dollar','HKD · دولار هونغ كونغ':'HKD · Hongkong-Dollar','KRW · وون كوري':'KRW · Südkoreanischer Won',
      'THB · بات تايلندي':'THB · Thailändischer Baht','MYR · رينغيت ماليزي':'MYR · Malaysischer Ringgit','IDR · روبية إندونيسية':'IDR · Indonesische Rupiah',
      'PHP · بيزو فلبيني':'PHP · Philippinischer Peso','PKR · روبية باكستانية':'PKR · Pakistanische Rupie','EGP · جنيه مصري':'EGP · Ägyptisches Pfund',
      'QAR · ريال قطري':'QAR · Katar-Riyal','KWD · دينار كويتي':'KWD · Kuwait-Dinar','BHD · دينار بحريني':'BHD · Bahrain-Dinar',
      'OMR · ريال عُماني':'OMR · Omanischer Rial','JOD · دينار أردني':'JOD · Jordanischer Dinar','MAD · درهم مغربي':'MAD · Marokkanischer Dirham',
      'NGN · نايرا نيجيرية':'NGN · Nigerianischer Naira','KES · شلن كيني':'KES · Kenianischer Schilling',
      'مثلاً: أسرة خالد':'z. B. Familie Müller','الاسم الذي سيظهر للأعضاء':'Name, der Mitgliedern angezeigt wird',
      'التنقل الرئيسي':'Hauptnavigation','بحث في الحركات':'Buchungen suchen','تصفية حسب نوع الحركة':'Nach Buchungstyp filtern',
      'ترتيب الحركات':'Buchungen sortieren','من تاريخ':'Ab Datum','إلى تاريخ':'Bis Datum',
      'تغيير إشارة الفائض الشهري':'Vorzeichen des monatlichen Überschusses ändern',
      'سيُفعّل بعد ربط مخطط الحركات المالية':'Wird nach Anbindung des Buchungsschemas aktiviert',
      'مثلاً: الحساب الجاري':'z. B. Girokonto','مثلاً: راتب أو مشتريات':'z. B. Gehalt oder Einkauf',
      'مثلاً: السكن، الطعام، الراتب':'z. B. Wohnen, Lebensmittel, Gehalt','اسم العضو':'Mitgliedsname',
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
      'سجّل الدخول باستخدام حسابك المسجل في Velovi.':'Sign in with your registered Velovi account.',
      'لا توجد أسرة مرتبطة بهذا الحساب. أنشئ أسرتك للبدء.':'No family is linked to this account yet. Create your family to get started.',
      'اسمك المعروض':'Your display name','العودة لتسجيل الدخول':'Back to sign in',
      'الاتصال يستخدم مفتاح Supabase العام فقط، وتبقى حماية البيانات مسؤولية سياسات RLS.':'The connection uses only the public Supabase key. Data access is protected by RLS policies.',
      'الأسرة':'Family','المساحة العائلية':'Family workspace','نموذج تجريبي':'Preview version',
      'لا توجد حماية حسابات أو مزامنة فعلية بعد':'Account protection and live sync are not fully configured yet',
      'نسخة واجهات أولية · 0.1':'Early interface version · 0.1','بيانات تجريبية للعرض فقط':'Demo data only',
      'هذه الواجهة لا تتصل بقاعدة بيانات ولا تحفظ بيانات مالية حقيقية بعد.':'This preview does not yet save real financial data.',
      'الإيرادات مطروحاً منها المصروفات':'Income minus expenses','مجموع الحساب الجاري والمدخرات والنقد':'Total checking, savings, and cash balances',
      'دخل · 01 نوفمبر 2026':'Income · 1 November 2026','السكن · 03 نوفمبر 2026':'Housing · 3 November 2026',
      'طعام · 05 نوفمبر 2026':'Food · 5 November 2026','منزل · 07 نوفمبر 2026':'Home · 7 November 2026',
      'نموذج توضيحي للشهر الحالي':'Example for the current month','الإجمالي':'Total',
      'إيراداتك ومصروفاتك والتحويلات':'Your income, expenses, and transfers',
      'الأرصدة':'Balances','الحسابات المرتبطة بالأسرة والأرصدة المحسوبة من الحركات المسجلة':'Family accounts and balances calculated from recorded transactions',
      'إدارة من يمكنه الإضافة والتعديل والحذف':'Manage who can add, edit, and delete transactions',
      'سياسة الخصوصية المعتمدة':'Privacy policy','كل عضو يرى بياناته المالية فقط. المدير يستطيع رؤية بيانات جميع الأعضاء وإدارة صلاحياتهم.':'Each member sees only their own financial data. The administrator can view all member data and manage permissions.',
      'التوقعات تقديرية وتتأثر بالتضخم والعوائد وتغير الدخل والمصروفات.':'Forecasts are estimates affected by inflation, returns, and changes in income and expenses.',
      'تحليل آخر ستة أشهر، والتعرف على البنود المتكررة والمتغيرة، مع إمكانية استثناء أي تصنيف.':'Analyzes the last six months, detects recurring and variable items, and lets you exclude categories.',
      'عملة التوقع':'Forecast currency','تلقائي':'Automatic','البنود الداخلة في التوقع':'Items included in forecast',
      'أزل علامة الاختيار لاستبعاد التصنيف من التوقع.':'Uncheck a category to exclude it from the forecast.',
      'ستظهر التصنيفات بعد تحميل الحركات المالية.':'Categories appear after transactions load.',
      'سيظهر التوقع بعد توفر سجل مالي كافٍ.':'The forecast appears once enough financial history is available.',
      'محاكاة يدوية إضافية':'Additional manual simulation','اختبر رصيداً وفائضاً شهرياً افتراضيين بصورة مستقلة عن التوقع الذكي.':'Test an assumed balance and monthly surplus separately from the smart forecast.',
      'اضغط ± داخل الحقل للتبديل بين الرصيد الموجب والسالب.':'Use ± to switch between positive and negative balances.',
      'العائد السنوي (%)':'Annual return (%)','حساب التوقع':'Calculate forecast',
      'أدخل القيم ثم احسب السيناريو الافتراضي.':'Enter values and calculate the hypothetical scenario.',
      'تفضيلات التطبيق':'App preferences','المزامنة البنكية التلقائية':'Automatic bank sync',
      'غير مفعّل بعد':'Not enabled yet','لم يتم اختيار ملف.':'No file selected.',
      'ملاحظة:':'Note:','قد تحتاج الصور المائلة أو منخفضة الدقة إلى مراجعة يدوية. لا تعتمد الحركات تلقائياً.':'Skewed or low-resolution images may need manual review. Transactions are never accepted automatically.',
      'تحقق من التاريخ والوصف والمبلغ ونوع الحركة.':'Check the date, description, amount, and transaction type.',
      'اختر الحساب وراجع الحركات قبل حفظها. سيتم التحقق من صلاحياتك ومنع التكرار.':'Choose an account and review transactions before saving. Permissions and duplicates are checked.',
      'ربط البنك مباشرة عبر مزود مصرفي متخصص ما زال قيد الدراسة. لن نطلب كلمة مرور البنك في Velovi.':'Direct bank connection through a specialist provider is still being evaluated. Velovi will never ask for your bank password.',
      'سيظهر التوقع بعد توفر سجل مالي كافٍ.':'The forecast appears once enough financial history is available.',
      'حفظ الحركة':'Save transaction','حفظ الحساب':'Save account','تغيير إشارة الرصيد':'Toggle balance sign',
      '＋ إضافة حركة':'＋ Add transaction','الحركات المسجلة فعلياً · يمكن فرز الأعمدة وتصفية السجل':'Saved transactions · sortable and filterable',
      'الراتب الشهري':'Monthly salary','الإيجار':'Rent','مشتريات السوبرماركت':'Supermarket shopping','فاتورة الكهرباء':'Electricity bill',
      'السجل المالي':'Financial record','＋ إضافة حساب':'＋ Add account','الحسابات المالية':'Financial accounts',
      'جارٍ تحميل الحسابات...':'Loading accounts…','إدارة الأسرة':'Family management','＋ دعوة عضو':'＋ Invite member',
      'المدير':'Administrator','أنت · مدير الأسرة':'You · family admin','عضو الأسرة 1':'Family member 1',
      'عضو تجريبي · لا توجد صلاحيات فعلية':'Demo member · no active permissions','إضافة ✓':'Add ✓','تعديل ✓':'Edit ✓',
      'حذف ✕':'Delete ✕','عضو الأسرة 2':'Family member 2',
      'توقعات مبنية على سجل الحركات الفعلية وأنماط الإنفاق والدخل':'Forecasts based on recorded transactions and income/expense patterns',
      'الرصيد الحالي —':'Current balance —','تخصيص اللغة والعملة والمظهر':'Customize language, currency, and appearance',
      'اللغة والمنطقة':'Language and region','لغة الواجهة':'Interface language','العملة':'Currency',
      'تُستخدم كعملة افتراضية للحسابات الجديدة والسيناريو اليدوي. لا تحوّل أرصدة الحسابات أو الحركات المسجلة.':'Used as the default for new accounts and manual scenarios. Existing balances and transactions are not converted.',
      'تُحفظ التفضيلات على هذا الجهاز في النسخة التجريبية.':'Preferences are stored on this device in this preview.',
      'استيراد بنكي':'Bank import','قراءة كشوف PDF والصور ومراجعة الحركات قبل اعتمادها':'Read PDF statements and images, then review transactions before importing',
      'اختر ملف PDF أو JPG أو PNG، أو التقط صورة مباشرة. تتم القراءة داخل جهازك ولا يُرفع الملف إلى خادم خارجي.':'Choose a PDF, JPG, or PNG file, or take a photo. Processing happens on your device; files are not uploaded.',
      'جارٍ تجهيز الملف...':'Preparing file…','0 حركة':'0 transactions','بعد اختيار ملف، ستظهر الحركات المكتشفة هنا.':'Detected transactions will appear here after you choose a file.',
      'وجّه الكاميرا نحو الرمز.':'Point the camera at the code.','تُحفظ الحركة في حسابك وتظهر على الأجهزة الأخرى بعد تسجيل الدخول.':'The transaction is saved to your account and appears on other devices after sign-in.',
      'تعديل صلاحيات العضو':'Edit member permissions','السماح بإضافة الحركات':'Allow adding transactions',
      'السماح بتعديل الحركات':'Allow editing transactions','السماح بحذف الحركات':'Allow deleting transactions',
      'السماح برؤية حسابات الأعضاء الآخرين (قراءة فقط)':'Allow viewing other members’ accounts (read only)',
      'حفظ الصلاحيات':'Save permissions','أدخل البريد الإلكتروني لإنشاء دعوة آمنة. يمكنك فتح رسالة بريد جاهزة أو نسخ الرابط ومشاركته. يجب على العضو إكمال التحقق قبل تسجيل الدخول.':'Enter an email to create a secure invitation. Open a prepared email or copy and share the link. The member must complete verification before signing in.',
      'إضافة حساب موجود بواسطة UID':'Add an existing account by UID','معرّف المستخدم UID':'User ID (UID)',
      'EUR · يورو (€)':'EUR · Euro (€)','USD · دولار أمريكي ($)':'USD · US Dollar ($)','GBP · جنيه إسترليني (£)':'GBP · British Pound (£)',
      'CHF · فرنك سويسري':'CHF · Swiss Franc','SAR · ريال سعودي (ر.س)':'SAR · Saudi Riyal (ر.س)','AED · درهم إماراتي (د.إ)':'AED · UAE Dirham (د.إ)',
      'CAD · دولار كندي':'CAD · Canadian Dollar','AUD · دولار أسترالي':'AUD · Australian Dollar','NZD · دولار نيوزيلندي':'NZD · New Zealand Dollar',
      'JPY · ين ياباني (¥)':'JPY · Japanese Yen (¥)','CNY · يوان صيني (¥)':'CNY · Chinese Yuan (¥)','INR · روبية هندية (₹)':'INR · Indian Rupee (₹)',
      'TRY · ليرة تركية (₺)':'TRY · Turkish Lira (₺)','BRL · ريال برازيلي (R$)':'BRL · Brazilian Real (R$)','MXN · بيزو مكسيكي':'MXN · Mexican Peso',
      'ZAR · راند جنوب أفريقي':'ZAR · South African Rand','SEK · كرونة سويدية':'SEK · Swedish Krona','NOK · كرونة نرويجية':'NOK · Norwegian Krone',
      'DKK · كرونة دنماركية':'DKK · Danish Krone','PLN · زلوتي بولندي':'PLN · Polish Złoty','CZK · كرونة تشيكية':'CZK · Czech Koruna',
      'HUF · فورنت مجري':'HUF · Hungarian Forint','RON · ليو روماني':'RON · Romanian Leu','BGN · ليف بلغاري':'BGN · Bulgarian Lev',
      'SGD · دولار سنغافوري':'SGD · Singapore Dollar','HKD · دولار هونغ كونغ':'HKD · Hong Kong Dollar','KRW · وون كوري':'KRW · South Korean Won',
      'THB · بات تايلندي':'THB · Thai Baht','MYR · رينغيت ماليزي':'MYR · Malaysian Ringgit','IDR · روبية إندونيسية':'IDR · Indonesian Rupiah',
      'PHP · بيزو فلبيني':'PHP · Philippine Peso','PKR · روبية باكستانية':'PKR · Pakistani Rupee','EGP · جنيه مصري':'EGP · Egyptian Pound',
      'QAR · ريال قطري':'QAR · Qatari Riyal','KWD · دينار كويتي':'KWD · Kuwaiti Dinar','BHD · دينار بحريني':'BHD · Bahraini Dinar',
      'OMR · ريال عُماني':'OMR · Omani Rial','JOD · دينار أردني':'JOD · Jordanian Dinar','MAD · درهم مغربي':'MAD · Moroccan Dirham',
      'NGN · نايرا نيجيرية':'NGN · Nigerian Naira','KES · شلن كيني':'KES · Kenyan Shilling',
      'مثلاً: أسرة خالد':'e.g. Smith family','الاسم الذي سيظهر للأعضاء':'Name shown to members',
      'التنقل الرئيسي':'Main navigation','بحث في الحركات':'Search transactions','تصفية حسب نوع الحركة':'Filter by transaction type',
      'ترتيب الحركات':'Sort transactions','من تاريخ':'From date','إلى تاريخ':'To date',
      'تغيير إشارة الفائض الشهري':'Toggle monthly surplus sign',
      'سيُفعّل بعد ربط مخطط الحركات المالية':'Enabled after the transaction schema is connected',
      'مثلاً: الحساب الجاري':'e.g. Checking account','مثلاً: راتب أو مشتريات':'e.g. Salary or groceries',
      'مثلاً: السكن، الطعام، الراتب':'e.g. Housing, food, salary','اسم العضو':'Member name',
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