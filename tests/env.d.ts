interface ImportMetaEnv {
  readonly VITE_ANTHROPIC_API_KEY?: string,
  readonly VITE_ANTHROPIC_BASE_URL?: string,
  readonly VITE_ANTHROPIC_DECISION_MODEL?: string,
  readonly VITE_OPENAI_API_KEY?: string,
  readonly VITE_OPENAI_BASE_URL?: string,
  readonly VITE_OPENAI_DECISION_MODEL?: string,
}

interface ImportMeta {
  readonly env: ImportMetaEnv,
}
