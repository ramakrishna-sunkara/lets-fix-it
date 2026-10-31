import type { TranslationDict } from './types'

export const en: TranslationDict = {
  nav: {
    home: 'Home',
    diagnose: 'Diagnose',
    shopping: 'Shopping',
    myRepairs: 'My Repairs',
    profile: 'Profile',
    signIn: 'Sign in',
    signOut: 'Sign out',
  },
  brand: {
    name: "LET'S FIX IT AI",
  },
  home: {
    eyebrow: 'Diagnostic workspace',
    title: "Before You Replace It, Let's Fix It.",
    subtitle:
      "Understand what's broken, discover how to repair it, and find the right parts or professionals.",
    ctaDiagnose: 'Diagnose a Problem',
    ctaExplore: 'Explore Repairs',
    funnyLoading: 'Funny loading',
    startOver: 'Start over',
    sessionBanner:
      'One product at a time. Demo starters open a fresh session. Use Start over when switching devices.',
    tryDemo: 'Try',
    demoCar: 'Car remote demo',
    demoSpeaker: 'Bluetooth speaker demo',
    demoCarText:
      'My car remote key is not locking and unlocking the car properly. I bought the car about three years ago.',
    demoSpeakerText:
      'My Bluetooth speaker stopped working and will not charge. The charging light behaviour changed recently.',
    emptyChat:
      'Describe the malfunction in ordinary language. Add a photo if you have one. The assistant will ask a few targeted follow-ups.',
    analyzing: 'Analyzing…',
    placeholder: "Tell me what's wrong with your product...",
    uploadImage: 'Upload image',
    startVoice: 'Start voice input',
    stopVoice: 'Stop voice input',
    send: 'Send',
    removeImage: 'Remove image',
    voiceUnsupported: 'Voice input is not supported in this browser.',
  },
  prompts: {
    title: 'Quick answers',
    hint: 'Select answers for one or more questions, then tap Send answers.',
    yes: 'Yes',
    no: 'No',
    notSure: 'Not sure',
    answeredCount: '{answered} of {total} answered',
    sendAnswers: 'Send answers',
    orTypeOwn: 'Or type your own…',
    typeAnswer: 'Type your answer…',
  },
  stages: {
    gathering: 'Gathering',
    analyzing: 'Analyzing',
    diagnosisReady: 'Diagnosis ready',
    repairPlan: 'Repair plan',
    label: 'Diagnostic stage',
  },
  profile: {
    title: 'Profile',
    subtitle: 'Manage your preferences and account details.',
    guestNote:
      'You can change language as a guest. Sign in to save display name and phone with your account.',
    language: 'Language',
    languageHint: "UI language for LET'S FIX IT AI. English is the default.",
    english: 'English',
    telugu: 'Telugu',
    account: 'Account',
    email: 'Email',
    displayName: 'Display name',
    phone: 'Phone',
    phoneHint:
      'Phone is stored privately on your profile. Verification is not required for this POC.',
    save: 'Save profile',
    saved: 'Profile updated.',
    signInCta: 'Sign in',
    signInHint: 'to sync profile details across devices.',
    notConfigured:
      'Supabase Auth is not configured. Language preference still works locally. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable account profile fields.',
  },
  auth: {
    title: 'Sign in',
    createAccount: 'Create account',
    resetPassword: 'Reset password',
    signIn: 'Sign in',
    email: 'Email',
    password: 'Password',
    continue: 'Continue',
    pleaseWait: 'Please wait…',
    register: 'Register',
    forgotPassword: 'Forgot password',
    notConfiguredTitle: 'Authentication',
    notConfiguredBody:
      'Supabase Auth is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, apply supabase/migrations, then reload. Guest diagnosis still works without auth.',
    signedIn: 'Signed in.',
    checkEmail:
      'Check your email to verify your account if confirmation is enabled.',
    recoverySent: 'Password recovery email sent (if the account exists).',
  },
  shopping: {
    title: 'Shopping',
    subtitle:
      'Amazon, Flipkart, and Meesho search links for replacement parts. We do not invent prices, stock, or verified compatibility in this POC.',
    placeholder: 'e.g. CR2032 car key fob battery Honda',
    searching: 'Searching…',
    findLinks: 'Find search links',
  },
  myRepairs: {
    title: 'My Repairs',
    subtitle:
      'Saved diagnostic sessions for signed-in users when Supabase Auth is configured.',
    loading: 'Loading…',
    notConfigured:
      'Supabase is not configured (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY). Chat still works without saved cloud sessions.',
    signInPrefix: 'Sign in',
    signInSuffix: 'to sync private repair sessions across devices.',
    empty: 'No saved repairs yet.',
    uncategorized: 'Uncategorized',
  },
  results: {
    empty:
      'Diagnosis results will appear here after the assistant gathers enough context. Observations, hypotheses, and unknowns stay clearly separated.',
  },
  common: {
    language: 'Language',
  },
}
