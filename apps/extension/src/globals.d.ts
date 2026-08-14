type FormFullyMode = 'classic' | 'smart';

interface SmartProfile {
  fullName?: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  city?: string;
  country?: string;
  fallback?: string;
}

interface CustomRule {
  field: string;
  value: string;
}

interface FillSettings {
  mode?: FormFullyMode;
  legacyValue?: string;
  profile?: SmartProfile;
  customRules?: CustomRule[];
  overwrite?: boolean;
}

interface FillSummary {
  mode: FormFullyMode;
  filled: number;
  skipped?: number;
  selectedRadios?: number;
}

interface TranslationDictionary {
  title: string;
  tagline: string;
  valueLabel: string;
  placeholder: string;
  hint: string;
  fillBtn: string;
  fillSmartBtn: string;
  modeLabel: string;
  classicMode: string;
  classicBadge: string;
  smartMode: string;
  smartIntro: string;
  smartName: string;
  smartEmail: string;
  smartPhone: string;
  smartCompany: string;
  moreDetails: string;
  smartAddress: string;
  smartCity: string;
  smartCountry: string;
  smartFallback: string;
  customFields: string;
  customFieldsHint: string;
  customRulesEmpty: string;
  addCustomRule: string;
  customFieldLabel: string;
  customFieldPlaceholder: string;
  customValueLabel: string;
  customValuePlaceholder: string;
  removeCustomRule: string;
  smartPrivacy: string;
  filling: string;
  fillSuccess: string;
  noFields: string;
  fillError: string;
  invalidEmail: string;
  madeBy: string;
  authorName: string;
  coffee: string;
  shortcutInfoLabel: string;
  shortcutTitle: string;
  shortcutIntro: string;
  shortcutWin: string;
  shortcutMac: string;
  shortcutChange: string;
  shortcutClose: string;
}

interface Window {
  I18N: Record<string, TranslationDictionary>;
  setLanguage(language?: string): void;
  setText(id: string, value: string): void;
  registerLanguage(code: string, dictionary: TranslationDictionary): void;
}

declare function importScripts(...urls: string[]): void;

/** Firefox and Safari expose the standard promise-based namespace. */
declare const browser: typeof chrome | undefined;
