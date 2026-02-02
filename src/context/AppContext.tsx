import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { AppState } from '@/types'
import { loadState, saveState, login as authLogin, logout as authLogout, isAuthenticated } from '@/store'

interface AppContextType {
  state: AppState
  setState: React.Dispatch<React.SetStateAction<AppState>>
  login: (email: string, password: string) => boolean
  logout: () => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => loadState())
  
  useEffect(() => {
    saveState(state)
  }, [state])
  
  const login = (email: string, password: string): boolean => {
    const success = authLogin(email, password)
    if (success) {
      setState((prev) => ({ ...prev, isAuthenticated: true }))
    }
    return success
  }
  
  const logout = () => {
    authLogout()
    setState((prev) => ({ ...prev, isAuthenticated: false }))
  }
  
  // Check auth status on mount
  useEffect(() => {
    setState((prev) => ({ ...prev, isAuthenticated: isAuthenticated() }))
  }, [])
  
  return (
    <AppContext.Provider value={{ state, setState, login, logout }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}
