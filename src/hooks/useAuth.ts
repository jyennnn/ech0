import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { authService } from '@/services/authService'

interface UseAuthReturn {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
}

export const useAuth = (redirectOnNoAuth = true): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const initAuth = async () => {
      try {
        const user = await authService.getUser()
        if (!user && redirectOnNoAuth) {
          router.push('/login')
          return
        }
        setUser(user)
      } catch (error) {
        console.error('Error getting user:', error)
        if (redirectOnNoAuth) {
          router.push('/login')
        }
      } finally {
        setLoading(false)
      }
    }

    initAuth()

    const { data: { subscription } } = authService.onAuthStateChange(
      (event, session) => {
        const newUser = session?.user ?? null
        setUser(newUser)
        setLoading(false)
        
        if (!newUser && redirectOnNoAuth) {
          router.push('/login')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [redirectOnNoAuth, router])

  return {
    user,
    loading,
    isAuthenticated: !!user
  }
}