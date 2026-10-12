/**
 * 🌍 MULTI-LANGUAGE SUPPORT
 * Chat supports: English, Hindi, Spanish, French, etc.
 * Auto-detect or user-specified
 */

const SUPPORTED_LANGUAGES = {
  'en': 'English',
  'hi': 'Hindi',
  'es': 'Spanish',
  'fr': 'French',
  'de': 'German',
  'pt': 'Portuguese',
  'zh': 'Chinese',
  'ar': 'Arabic',
  'ja': 'Japanese'
};

const TRANSLATIONS = {
  'en': {
    greeting: 'Hello! How can I help you?',
    nodeNotFound: 'Node not found',
    accessDenied: 'Access denied to this node',
    fileProcessed: 'File processed successfully',
    typing: 'Bot is typing...',
    error: 'An error occurred',
    unauthorized: 'Please sign in first'
  },
  'hi': {
    greeting: 'नमस्ते! मैं आपकी कैसे मदद कर सकता हूँ?',
    nodeNotFound: 'नोड नहीं मिला',
    accessDenied: 'इस नोड तक पहुँच अस्वीकृत है',
    fileProcessed: 'फाइल सफलतापूर्वक संसाधित हुई',
    typing: 'बॉट टाइप कर रहा है...',
    error: 'एक त्रुटि हुई',
    unauthorized: 'कृपया पहले साइन इन करें'
  },
  'es': {
    greeting: '¡Hola! ¿Cómo puedo ayudarte?',
    nodeNotFound: 'Nodo no encontrado',
    accessDenied: 'Acceso denegado a este nodo',
    fileProcessed: 'Archivo procesado exitosamente',
    typing: 'El bot está escribiendo...',
    error: 'Ocurrió un error',
    unauthorized: 'Por favor inicia sesión primero'
  },
  'fr': {
    greeting: 'Bonjour! Comment puis-je vous aider?',
    nodeNotFound: 'Nœud non trouvé',
    accessDenied: 'Accès refusé à ce nœud',
    fileProcessed: 'Fichier traité avec succès',
    typing: 'Le bot tape...',
    error: 'Une erreur est survenue',
    unauthorized: 'Veuillez d\'abord vous connecter'
  }
};

/**
 * Detect language from request or text
 */
function detectLanguage(reqOrText) {
  // If it's a string (message text), try to detect from text patterns
  if (typeof reqOrText === 'string') {
    const text = reqOrText.toLowerCase();
    // Simple pattern matching for common languages
    if (/[क-ह]/.test(text)) return 'hi'; // Hindi
    if (/[а-я]/.test(text)) return 'ru'; // Russian
    if (/[一-龯]/.test(text)) return 'zh'; // Chinese
    if (/[ぁ-ゔ]/.test(text)) return 'ja'; // Japanese
    if (/[ا-ي]/.test(text)) return 'ar'; // Arabic
    return 'en'; // Default
  }

  // If it's a request object
  const req = reqOrText;
  
  // Priority: 1. Explicit language, 2. User preference, 3. Accept-Language header, 4. Default
  const explicitLang = req.body?.language;
  if (explicitLang && SUPPORTED_LANGUAGES[explicitLang]) {
    return explicitLang;
  }

  const acceptLang = req.headers?.['accept-language'];
  if (acceptLang) {
    const preferredLang = acceptLang.split(',')[0].split('-')[0].toLowerCase();
    if (SUPPORTED_LANGUAGES[preferredLang]) {
      return preferredLang;
    }
  }

  return 'en'; // Default to English
}

/**
 * Get translation for a key
 */
function t(key, language = 'en') {
  return (TRANSLATIONS[language] || TRANSLATIONS['en'])[key] || key;
}

/**
 * Translate text using AI (placeholder for actual API call)
 */
async function translateText(text, targetLanguage, sourceLanguage = 'en') {
  if (sourceLanguage === targetLanguage) return text;
  
  // TODO: Implement OpenAI translation API
  // For now, return original text with note
  return text; // In production, call OpenAI translate API
}

module.exports = {
  SUPPORTED_LANGUAGES,
  TRANSLATIONS,
  detectLanguage,
  t,
  translateText
};
