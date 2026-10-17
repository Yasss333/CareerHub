/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BASENAME?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module 'react-pdftotext' {
  export default function pdfToText(file: File | Blob): Promise<string>;
}
