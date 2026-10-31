export type Locale = 'en' | 'te'

export type MessageTree = {
  [key: string]: string | MessageTree
}

export type TranslationDict = {
  nav: {
    home: string
    diagnose: string
    shopping: string
    myRepairs: string
    profile: string
    signIn: string
    signOut: string
  }
  brand: {
    name: string
  }
  home: {
    eyebrow: string
    title: string
    subtitle: string
    ctaDiagnose: string
    ctaExplore: string
    funnyLoading: string
    startOver: string
    sessionBanner: string
    tryDemo: string
    demoCar: string
    demoSpeaker: string
    demoCarText: string
    demoSpeakerText: string
    emptyChat: string
    analyzing: string
    placeholder: string
    uploadImage: string
    startVoice: string
    stopVoice: string
    send: string
    removeImage: string
    voiceUnsupported: string
  }
  prompts: {
    title: string
    hint: string
    yes: string
    no: string
    notSure: string
    answeredCount: string
    sendAnswers: string
    orTypeOwn: string
    typeAnswer: string
  }
  stages: {
    gathering: string
    analyzing: string
    diagnosisReady: string
    repairPlan: string
    label: string
  }
  profile: {
    title: string
    subtitle: string
    guestNote: string
    language: string
    languageHint: string
    english: string
    telugu: string
    account: string
    email: string
    displayName: string
    phone: string
    phoneHint: string
    save: string
    saved: string
    signInCta: string
    signInHint: string
    notConfigured: string
  }
  auth: {
    title: string
    createAccount: string
    resetPassword: string
    signIn: string
    email: string
    password: string
    continue: string
    pleaseWait: string
    register: string
    forgotPassword: string
    notConfiguredTitle: string
    notConfiguredBody: string
    signedIn: string
    checkEmail: string
    recoverySent: string
  }
  shopping: {
    title: string
    subtitle: string
    placeholder: string
    searching: string
    findLinks: string
  }
  myRepairs: {
    title: string
    subtitle: string
    loading: string
    notConfigured: string
    signInPrefix: string
    signInSuffix: string
    empty: string
    uncategorized: string
  }
  results: {
    empty: string
  }
  common: {
    language: string
  }
}
