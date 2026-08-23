import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { authApi } from '../api/auth'
import { profileApi } from '../api/profile'
import type {
  UserCreate,
  UserLogin,
  UserResponse,
  ProfileResponse,
  ProfileCreate,
  ProfileUpdate,
} from '../api/types'

interface AuthContextType {
  user: UserResponse | null
  profile: ProfileResponse | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  hasProfile: boolean
  login: (credentials: UserLogin) => Promise<{ user: UserResponse; hasProfile: boolean }>
  register: (data: UserCreate) => Promise<UserResponse>
  logout: () => Promise<void>
  refreshUser: () => Promise<UserResponse | null>
  refreshProfile: () => Promise<ProfileResponse | null>
  saveProfile: (data: ProfileCreate | ProfileUpdate) => Promise<ProfileResponse>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const TOKEN_KEY = 'career_companion_token'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState<UserResponse | null>(null)
  const [profile, setProfile] = useState<ProfileResponse | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Initialize auth state on mount or token change
  useEffect(() => {
    let isMounted = true

    async function initAuth() {
      if (!token) {
        if (isMounted) {
          setUser(null)
          setProfile(null)
          setIsLoading(false)
        }
        return
      }

      try {
        setIsLoading(true)
        const currentUser = await authApi.getMe(token)
        if (!isMounted) return
        setUser(currentUser)

        // Attempt to fetch profile
        try {
          const userProfile = await profileApi.getProfile(token)
          if (isMounted) {
            setProfile(userProfile)
          }
        } catch {
          if (isMounted) {
            setProfile(null)
          }
        }
      } catch {
        // Token is invalid/expired
        if (isMounted) {
          localStorage.removeItem(TOKEN_KEY)
          setToken(null)
          setUser(null)
          setProfile(null)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    initAuth()

    return () => {
      isMounted = false
    }
  }, [token])

  const login = async (credentials: UserLogin): Promise<{ user: UserResponse; hasProfile: boolean }> => {
    setIsLoading(true)
    try {
      const tokenRes = await authApi.login(credentials)
      const accessToken = tokenRes.access_token
      localStorage.setItem(TOKEN_KEY, accessToken)
      setToken(accessToken)

      const currentUser = await authApi.getMe(accessToken)
      setUser(currentUser)

      let currentProfile: ProfileResponse | null = null
      try {
        currentProfile = await profileApi.getProfile(accessToken)
        setProfile(currentProfile)
      } catch {
        setProfile(null)
      }

      return {
        user: currentUser,
        hasProfile: !!currentProfile,
      }
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (data: UserCreate): Promise<UserResponse> => {
    return await authApi.register(data)
  }

  const logout = async (): Promise<void> => {
    if (token) {
      try {
        await authApi.logout(token)
      } catch {
        // Swallowing logout network error on invalid/already revoked token
      }
    }
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setUser(null)
    setProfile(null)
  }

  const refreshUser = async (): Promise<UserResponse | null> => {
    if (!token) return null
    try {
      const u = await authApi.getMe(token)
      setUser(u)
      return u
    } catch {
      await logout()
      return null
    }
  }

  const refreshProfile = async (): Promise<ProfileResponse | null> => {
    if (!token) return null
    try {
      const p = await profileApi.getProfile(token)
      setProfile(p)
      return p
    } catch {
      setProfile(null)
      return null
    }
  }

  const saveProfile = async (data: ProfileCreate | ProfileUpdate): Promise<ProfileResponse> => {
    if (!token) throw new Error('Not authenticated')
    if (profile) {
      const updated = await profileApi.updateProfile(data, token)
      setProfile(updated)
      return updated
    } else {
      const created = await profileApi.createProfile(data, token)
      setProfile(created)
      return created
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        token,
        isLoading,
        isAuthenticated: !!user && !!token,
        hasProfile: !!profile,
        login,
        register,
        logout,
        refreshUser,
        refreshProfile,
        saveProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
