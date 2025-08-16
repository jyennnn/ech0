export type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error'
export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

export interface SelectOption {
  value: string
  label: string
}

export interface ApiResponse<T> {
  data: T
  error?: string
}

export type DateFormat = 'short' | 'long' | 'relative'
export type TimeStamp = string | Date