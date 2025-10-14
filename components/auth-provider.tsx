"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { type User, getCurrentUser, logout as authLogout } from "@/lib/auth"

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  logout: () => void
  refreshUser: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = () => {
    const currentUser = getCurrentUser()
    setUser(currentUser)
    setIsAuthenticated(!!currentUser)
  }

  useEffect(() => {
    refreshUser()
    setIsLoading(false)
  }, [])

  const logout = () => {
    authLogout()
    setUser(null)
    setIsAuthenticated(false)
  }

  if (isLoading) {
    return null
  }

  return <AuthContext.Provider value={{ user, isAuthenticated, logout, refreshUser }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
