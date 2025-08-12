// Constants
export const SAVE_DEBOUNCE_MS = 4000
export const TYPING_ANIMATION_SPEED = 25
export const VISUAL_NOTE_PAUSE_MS = 500
export const MAX_RETRY_ATTEMPTS = 3

export const PLATFORM_CONFIGS = {
  instagram: { name: 'Instagram', maxChars: 2200, description: 'more relatable' },
  linkedin: { name: 'LinkedIn', maxChars: 3000, description: 'professional' },
  x: { name: 'X (Twitter)', maxChars: 280, description: 'concise' },
  tiktok: { name: 'TikTok', maxChars: 2200, description: 'trendy' }
}

// Common styles
export const APPLE_FONT_FAMILY = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
export const COMMON_INPUT_CLASSES = 'focus:outline-none bg-transparent text-gray-900 placeholder-gray-400'
export const BUTTON_CLASSES = {
  primary: 'bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors',
  secondary: 'p-2 hover:bg-gray-100 rounded-md transition-colors'
}