// i18n translations for English and Arabic
export const translations = {
  en: {
    // Navigation
    product: "Product",
    templates: "Templates",
    pricing: "Pricing",
    examples: "Examples",
    faqs: "FAQs",
    backToHome: "Back to Home",
    signIn: "Sign in",
    getStarted: "Get started",

    // Sidebar/App Navigation
    dashboard: "Dashboard",
    characters: "Characters",
    universes: "Universes",
    knowledgeBase: "Knowledge Base",
    bookBuilder: "Book Builder",
    books: "Books",
    projects: "Projects",
    billing: "Billing",
    settings: "Settings",
    help: "Help",
    newBook: "New Book", 

    // Common Buttons & Actions
    create: "Create",
    edit: "Edit",
    delete: "Delete",
    save: "Save",
    cancel: "Cancel",
    submit: "Submit",
    logout: "Logout",
    profile: "Profile",

    // Language
    language: "Language",
    english: "English",
    arabic: "العربية",
    selectLanguage: "Select Language",

    // Common Labels
    search: "Search",
    searchPlaceholder: "Search characters, books, projects...",
    loading: "Loading...", 
    error: "Error",
    success: "Success",
    warning: "Warning",
    info: "Info",
    name: "Name",
    description: "Description",
    email: "Email",
    password: "Password",

    // Home Page
    welcomeToNoor: "Welcome to Noor Studio",
    createIslamicBooks: "Create Beautiful Islamic Children's Books",
    withConsistentCharacters: "with Consistent, Pixar-Style Characters",

    // Footer
    company: "Company",
    legal: "Legal",
    privacy: "Privacy Policy",
    terms: "Terms of Service",
    contact: "Contact",
    followUs: "Follow Us",
    copyright: "© 2025 Noor Studio. All rights reserved.",
  },

  ar: {
    // Navigation
    product: "المنتج",
    templates: "القوالب",
    pricing: "الأسعار",
    examples: "أمثلة",
    faqs: "الأسئلة الشائعة",
    backToHome: "العودة للصفحة الرئيسية",
    signIn: "تسجيل الدخول",
    getStarted: "ابدأ الآن",

    // Sidebar/App Navigation
    dashboard: "لوحة التحكم",
    characters: "الشخصيات",
    universes: "العوالم",
    knowledgeBase: "قاعدة المعرفة",
    bookBuilder: "منشئ الكتب",
    books: "الكتب",
    projects: "المشاريع",
    billing: "الفواتير",
    settings: "الإعدادات",
    help: "المساعدة",
    newBook: "كتاب جديد", 

    // Common Buttons & Actions
    create: "إنشاء",
    edit: "تعديل",
    delete: "حذف",
    save: "حفظ",
    cancel: "إلغاء",
    submit: "إرسال",
    logout: "تسجيل الخروج",
    profile: "الملف الشخصي",

    // Language
    language: "اللغة",
    english: "English",
    arabic: "العربية",
    selectLanguage: "اختر اللغة",

    // Common Labels
    search: "بحث",
    searchPlaceholder: "ابحث عن الشخصيات والكتب والمشاريع...",
    loading: "جاري التحميل...", 
    error: "خطأ",
    success: "نجح",
    warning: "تحذير",
    info: "معلومات",
    name: "الاسم",
    description: "الوصف",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",

    // Home Page
    welcomeToNoor: "مرحبا بك في نور ستوديو",
    createIslamicBooks: "إنشاء كتب إسلامية جميلة للأطفال",
    withConsistentCharacters: "مع شخصيات متسقة بأسلوب بكسار",

    // Footer
    company: "الشركة",
    legal: "القانوني",
    privacy: "سياسة الخصوصية",
    terms: "شروط الخدمة",
    contact: "اتصل بنا",
    followUs: "تابعنا",
    copyright: "© 2025 نور ستوديو. جميع الحقوق محفوظة.",
  },
} as const;

export type Language = "en" | "ar";
export type TranslationKey = keyof typeof translations.en;
