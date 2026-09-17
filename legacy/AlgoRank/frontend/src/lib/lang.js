/**
 * Supported languages configuration
 * Maps language keys to display names, Monaco editor languages, and icons
 */
export const SUPPORTED_LANGUAGES = {
  JAVASCRIPT: { name: "JavaScript", monaco: "javascript", icon: "JS" },
  PYTHON: { name: "Python", monaco: "python", icon: "Py" },
  JAVA: { name: "Java", monaco: "java", icon: "Java" },
  CPP: { name: "C++", monaco: "cpp", icon: "C++" },
  C: { name: "C", monaco: "c", icon: "C" },
  TYPESCRIPT: { name: "TypeScript", monaco: "typescript", icon: "TS" },
  CSHARP: { name: "C#", monaco: "csharp", icon: "C#" },
  PHP: { name: "PHP", monaco: "php", icon: "PHP" },
  RUBY: { name: "Ruby", monaco: "ruby", icon: "Ruby" },
  GO: { name: "Go", monaco: "go", icon: "Go" },
  RUST: { name: "Rust", monaco: "rust", icon: "Rust" },
  KOTLIN: { name: "Kotlin", monaco: "kotlin", icon: "Kotlin" },
  SWIFT: { name: "Swift", monaco: "swift", icon: "Swift" }
};

/**
 * Get display name for a language
 * @param {string} language - Language key
 * @return {string} - Display name
 */
export const getLanguageDisplayName = (language) => {
  const langKey = language?.toUpperCase();
  return SUPPORTED_LANGUAGES[langKey]?.name || language || "JavaScript";
};

/**
 * Get Monaco editor language identifier
 * @param {string} language - Language key
 * @return {string} - Monaco language identifier
 */
export const getMonacoLanguage = (language) => {
  const langKey = language?.toUpperCase();
  return SUPPORTED_LANGUAGES[langKey]?.monaco || "javascript";
};

/**
 * Get language icon/abbreviation
 * @param {string} language - Language key
 * @return {string} - Language icon
 */
export const getLanguageIcon = (language) => {
  const langKey = language?.toUpperCase();
  return SUPPORTED_LANGUAGES[langKey]?.icon || "JS";
};

/**
 * Get all supported languages as array
 * @return {Array} - Array of language objects
 */
export const getAllLanguages = () => {
  return Object.entries(SUPPORTED_LANGUAGES).map(([key, config]) => ({
    key,
    ...config
  }));
};

/**
 * Check if language is supported
 * @param {string} language - Language key
 * @return {boolean} - Whether language is supported
 */
export const isLanguageSupported = (language) => {
  const langKey = language?.toUpperCase();
  return SUPPORTED_LANGUAGES.hasOwnProperty(langKey);
};

// Judge0 language ID mapping (for backend reference)
export const JUDGE0_LANGUAGE_IDS = {
  PYTHON: 71,
  JAVASCRIPT: 63,
  JAVA: 62,
  CPP: 44,
  C: 46,
  TYPESCRIPT: 74,
  CSHARP: 51,
  PHP: 92,
  RUBY: 72,
  GO: 60,
  RUST: 73,
  KOTLIN: 76,
  SWIFT: 83
};

/**
 * Get Judge0 language ID
 * @param {string} language - Language key
 * @return {number} - Judge0 language ID
 */
export const getJudge0LanguageId = (language) => {
  const langKey = language?.toUpperCase();
  return JUDGE0_LANGUAGE_IDS[langKey];
};