window.I18N = {
  en: {
    title: 'FormFully',
    tagline: 'Instant form filler',
    valueLabel: 'Value to fill',
    placeholder: 'Enter a number or text',
    hint: 'Leave empty for random per input.',
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
    smartPrivacy: 'Stored only on this device. Passwords, files, and payment fields are skipped.',
    filling: 'Filling…',
    fillSuccess: '{count} fields filled.',
    noFields: 'No empty supported fields found.',
    fillError: 'This page cannot be filled. Try a regular website tab.',
    invalidEmail: 'Enter a valid email address.',
    madeBy: 'Made by <a class="underline decoration-dotted hover:decoration-solid" target="_blank" href="https://devm7mdali.github.io">Mohammed Alajmi</a>',
    coffee: 'Buy me a coffee',
    shortcutInfoLabel: 'Shortcut info',
    shortcutTitle: 'Keyboard Shortcut',
    shortcutIntro: 'Keyboard shortcut details:',
    shortcutWin: 'Windows / Linux: Alt + Shift + F',
    shortcutMac: 'macOS: Option + Shift + F',
    shortcutChange: 'Change it at chrome://extensions/shortcuts',
    shortcutClose: 'Close'
  },
  ar: {
    title: 'فورم فُلِّي',
    tagline: 'تعبئة النماذج فوراً',
    valueLabel: 'القيمة المراد تعبئتها',
    placeholder: 'أدخل رقماً او نصا',
    hint: 'اتركه فارغاً للحصول على قيمة عشوائية لكل حقل.',
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
    smartPrivacy: 'تُحفظ على هذا الجهاز فقط. يتم تجاهل كلمات المرور والملفات وبيانات الدفع.',
    filling: 'جارٍ التعبئة…',
    fillSuccess: 'تمت تعبئة {count} حقلاً.',
    noFields: 'لم يتم العثور على حقول فارغة مدعومة.',
    fillError: 'لا يمكن تعبئة هذه الصفحة. جرّب صفحة ويب عادية.',
    invalidEmail: 'أدخل بريداً إلكترونياً صالحاً.',
    madeBy: 'صُنع بواسطة <a class="underline decoration-dotted hover:decoration-solid" target="_blank" href="https://devm7mdali.github.io">محمد العجمي</a>',
    coffee: 'اشترِ لي قهوة',
    shortcutInfoLabel: 'معلومات الاختصار',
    shortcutTitle: 'اختصار لوحة المفاتيح',
    shortcutIntro: 'تفاصيل اختصار لوحة المفاتيح:',
    shortcutWin: 'ويندوز / لينكس: Alt + Shift + F',
    shortcutMac: 'ماك: Option + Shift + F',
    shortcutChange: 'يمكنك تغييره من chrome://extensions/shortcuts',
    shortcutClose: 'إغلاق'
  }
};

window.setLanguage = function setLanguage(lang) {
  if (!window.I18N[lang]) lang = 'en';
  localStorage.setItem('ff_lang', lang);
  document.documentElement.lang = lang;
  document.body.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.querySelectorAll('.lang-btn').forEach(b => {
    if (b.dataset.lang === lang) {
      b.classList.add('bg-white', 'text-indigo-700');
      b.classList.remove('text-white/90');
    } else {
      b.classList.remove('bg-white', 'text-indigo-700');
      b.classList.add('text-white/90');
    }
  });
  const t = window.I18N[lang];
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
  const input = document.getElementById('auto');
  if (input) input.placeholder = t.placeholder;
  const footerMade = document.getElementById('footerMade');
  if (footerMade) footerMade.innerHTML = t.madeBy;
};

window.setText = function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
};

// Optionally expose helper to add new languages dynamically later
window.registerLanguage = function registerLanguage(code, dict) {
  window.I18N[code] = dict;
};
