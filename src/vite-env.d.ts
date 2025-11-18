/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_GOOGLE_ADS_CLIENT_ID: string
  readonly VITE_GOOGLE_ADS_CLIENT_SECRET: string
  readonly VITE_GOOGLE_ADS_REDIRECT_URI: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}


