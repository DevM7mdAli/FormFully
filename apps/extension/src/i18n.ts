window.I18N = {
  en: {
    title: 'FormFully',
    tagline: 'Instant form filler',
    valueLabel: 'Value to fill',
    placeholder: 'Enter a number or text',
    hint: 'Leave empty for random values. Unanswered radio groups are selected randomly.',
    fillBtn: 'Fill Form',
    fillSmartBtn: 'Smart Fill',
    modeLabel: 'Fill mode',
    classicMode: 'Classic',
    classicBadge: 'Original',
    smartMode: 'Smart',
    smartIntro: 'Add your details once. Blank fields use safe demo values.',
    smartName: 'Full name',
    smartEmail: 'Email',
    smartPhone: 'Phone',
    smartCompany: 'Company',
    moreDetails: 'More details',
    smartAddress: 'Address',
    smartCity: 'City',
    smartCountry: 'Country',
    smartFallback: 'Default answer',
    customFields: 'Custom fields',
    customFieldsHint: 'Match a field label or keyword and fill your saved value.',
    customRulesEmpty: 'No custom fields yet.',
    addCustomRule: 'Add custom field',
    customFieldLabel: 'Field label',
    customFieldPlaceholder: 'Group number',
    customValueLabel: 'Value',
    customValuePlaceholder: '12',
    removeCustomRule: 'Remove custom field',
    smartPrivacy: 'Stored only on this device. Passwords, files, and payment fields are skipped.',
    filling: 'Filling…',
    fillSuccess: '{count} fields filled.',
    noFields: 'No empty supported fields found.',
    fillError: 'This page cannot be filled. Try a regular website tab.',
    invalidEmail: 'Enter a valid email address.',
    madeBy: 'Made by',
    authorName: 'Mohammed Alajmi',
    coffee: 'Buy me a coffee',
    shortcutInfoLabel: 'Shortcut info',
    shortcutTitle: 'Keyboard Shortcut',
    shortcutIntro: 'Keyboard shortcut details:',
    shortcutWin: 'Windows / Linux: Alt + Shift + F',
    shortcutMac: 'macOS: Option + Shift + F',
    shortcutChange: "Change it in your browser's extension shortcut settings",
    shortcutClose: 'Close'
  },
  ar: {
    title: 'فورم فُلِّي',
    tagline: 'تعبئة النماذج فوراً',
    valueLabel: 'القيمة المراد تعبئتها',
    placeholder: 'أدخل رقماً او نصا',
    hint: 'اتركه فارغاً لقيم عشوائية. يتم اختيار إجابة عشوائية لمجموعات الخيارات غير المجابة.',
    fillBtn: 'تعبئة النموذج',
    fillSmartBtn: 'تعبئة ذكية',
    modeLabel: 'وضع التعبئة',
    classicMode: 'كلاسيكي',
    classicBadge: 'الأصلي',
    smartMode: 'ذكي',
    smartIntro: 'أضف بياناتك مرة واحدة. تُستخدم بيانات تجريبية آمنة للحقول الفارغة.',
    smartName: 'الاسم الكامل',
    smartEmail: 'البريد الإلكتروني',
    smartPhone: 'رقم الجوال',
    smartCompany: 'الشركة',
    moreDetails: 'تفاصيل إضافية',
    smartAddress: 'العنوان',
    smartCity: 'المدينة',
    smartCountry: 'الدولة',
    smartFallback: 'الإجابة الافتراضية',
    customFields: 'حقول مخصصة',
    customFieldsHint: 'طابق اسم الحقل أو كلمة منه واملأ القيمة المحفوظة.',
    customRulesEmpty: 'لا توجد حقول مخصصة بعد.',
    addCustomRule: 'إضافة حقل مخصص',
    customFieldLabel: 'اسم الحقل',
    customFieldPlaceholder: 'رقم المجموعة',
    customValueLabel: 'القيمة',
    customValuePlaceholder: '12',
    removeCustomRule: 'حذف الحقل المخصص',
    smartPrivacy: 'تُحفظ على هذا الجهاز فقط. يتم تجاهل كلمات المرور والملفات وبيانات الدفع.',
    filling: 'جارٍ التعبئة…',
    fillSuccess: 'تمت تعبئة {count} حقلاً.',
    noFields: 'لم يتم العثور على حقول فارغة مدعومة.',
    fillError: 'لا يمكن تعبئة هذه الصفحة. جرّب صفحة ويب عادية.',
    invalidEmail: 'أدخل بريداً إلكترونياً صالحاً.',
    madeBy: 'صُنع بواسطة',
    authorName: 'محمد العجمي',
    coffee: 'اشترِ لي قهوة',
    shortcutInfoLabel: 'معلومات الاختصار',
    shortcutTitle: 'اختصار لوحة المفاتيح',
    shortcutIntro: 'تفاصيل اختصار لوحة المفاتيح:',
    shortcutWin: 'ويندوز / لينكس: Alt + Shift + F',
    shortcutMac: 'ماك: Option + Shift + F',
    shortcutChange: 'يمكنك تغييره من إعدادات اختصارات الإضافات في متصفحك',
    shortcutClose: 'إغلاق'
  }
};

window.setLanguage = function setLanguage(language = 'en') {
  const lang = window.I18N[language] ? language : 'en';
  localStorage.setItem('ff_lang', lang);
  document.documentElement.lang = lang;
  document.body.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.querySelectorAll<HTMLButtonElement>('.lang-btn').forEach(b => {
    if (b.dataset.lang === lang) {
      b.classList.add('bg-white', 'text-indigo-700');
      b.classList.remove('text-white/90');
    } else {
      b.classList.remove('bg-white', 'text-indigo-700');
      b.classList.add('text-white/90');
    }
  });
  const t = window.I18N[lang] ?? window.I18N.en;
  if (!t) return;
  window.setText('title', t.title);
  window.setText('tagline', t.tagline);
  window.setText('valueLabel', t.valueLabel);
  window.setText('hint', t.hint);
  window.setText('fillBtnText', t.fillBtn);
  window.setText('classicModeText', t.classicMode);
  window.setText('classicModeBadge', t.classicBadge);
  window.setText('smartModeText', t.smartMode);
  window.setText('smartIntro', t.smartIntro);
  window.setText('smartNameLabel', t.smartName);
  window.setText('smartEmailLabel', t.smartEmail);
  window.setText('smartPhoneLabel', t.smartPhone);
  window.setText('smartCompanyLabel', t.smartCompany);
  window.setText('moreDetailsText', t.moreDetails);
  window.setText('smartAddressLabel', t.smartAddress);
  window.setText('smartCityLabel', t.smartCity);
  window.setText('smartCountryLabel', t.smartCountry);
  window.setText('smartFallbackLabel', t.smartFallback);
  window.setText('customFieldsText', t.customFields);
  window.setText('customFieldsHint', t.customFieldsHint);
  window.setText('customRulesEmpty', t.customRulesEmpty);
  window.setText('addCustomRuleText', t.addCustomRule);
  window.setText('smartPrivacy', t.smartPrivacy);
  const modeTabs = document.getElementById('modeTabs');
  if (modeTabs) modeTabs.setAttribute('aria-label', t.modeLabel);
  window.setText('coffeeText', t.coffee);
  const shortcutOpenBtn = document.getElementById('shortcutOpenBtn');
  if (shortcutOpenBtn) shortcutOpenBtn.setAttribute('aria-label', t.shortcutInfoLabel);
  window.setText('shortcutModalTitle', t.shortcutTitle);
  window.setText('shortcutModalDesc', t.shortcutIntro);
  window.setText('shortcutWin', t.shortcutWin);
  window.setText('shortcutMac', t.shortcutMac);
  window.setText('shortcutChange', t.shortcutChange);
  window.setText('shortcutModalClose', t.shortcutClose);
  const input = document.getElementById('auto') as HTMLInputElement | null;
  if (input) input.placeholder = t.placeholder;
  window.setText('madeByText', t.madeBy);
  window.setText('authorName', t.authorName);
};

window.setText = function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
};

// Optionally expose helper to add new languages dynamically later
window.registerLanguage = function registerLanguage(code, dict) {
  window.I18N[code] = dict;
};
