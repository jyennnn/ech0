import { User } from '@supabase/supabase-js'

export interface AuthUser extends User {
  // Add any custom auth-related properties here if needed
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface SignupCredentials extends LoginCredentials {
  confirmPassword?: string
}

export type AuthState = 'loading' | 'authenticated' | 'unauthenticated'