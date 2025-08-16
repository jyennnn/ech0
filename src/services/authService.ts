import { createClient } from '@/utils/supabase/client'
import { User, Session } from '@supabase/supabase-js'

export class AuthService {
  private supabase = createClient()

  async getSession(): Promise<Session | null> {
    const { data: { session }, error } = await this.supabase.auth.getSession()
    
    if (error) {
      console.error('Session error:', error)
      throw new Error('Failed to get session')
    }
    
    return session
  }

  async getUser(): Promise<User | null> {
    const session = await this.getSession()
    return session?.user ?? null
  }

  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return this.supabase.auth.onAuthStateChange(callback)
  }

  async getAccessToken(): Promise<string | null> {
    const session = await this.getSession()
    return session?.access_token ?? null
  }
}

export const authService = new AuthService()