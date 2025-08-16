import { User } from '@supabase/supabase-js'

export type AuthUser = User;

export interface LoginCredentials {
  email: string
  password: string
}

export interface SignupCredentials extends LoginCredentials {
  confirmPassword?: string
}

export type AuthState = 'loading' | 'authenticated' | 'unauthenticated'