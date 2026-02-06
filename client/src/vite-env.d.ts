/// <reference types="vite/client" />

declare module '@mui/icons-material' {
  export * from '@mui/icons-material/index';
}

declare module '@mui/icons-material/*';

interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY: string
  readonly VITE_CHATGPT_API_KEY: string
  readonly VITE_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
