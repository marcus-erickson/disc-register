"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

// Define the shape of our authentication context
type AuthContextType = {
  isAuthenticated: boolean
  setIsAuthenticated: (value: boolean) => void
  username: string
  setUsername: (value: string) => void
  authLoading: boolean
  setAuthLoading: (value: boolean) => void
  authError: string | null
  setAuthError: (value: string | null) => void
  authSuccess: string | null
  setAuthSuccess: (value: string | null) => void
  logout: () => void
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Create a provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [username, setUsername] = useState("")
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [authSuccess, setAuthSuccess] = useState<string | null>(null)

  // Check for existing authentication on mount
  useEffect(() => {
    // We can't directly access cookies from client components
    // This is just a placeholder - in a real app, you'd check localStorage or a cookie via JS
    const checkAuth = async () => {
      try {
        // You could make a lightweight API call here to verify the session
        console.log("[AuthContext] Checking for existing authentication")
      } catch (error) {
        console.error("[AuthContext] Error checking authentication:", error)
      }
    }

    checkAuth()
  }, [])

  // Logout function
  const logout = () => {
    console.log("[AuthContext] Logging out")
    setIsAuthenticated(false)
    setUsername("")
    setAuthSuccess("You have been logged out successfully.")
    setAuthError(null)
  }

  // Create the context value object
  const contextValue: AuthContextType = {
    isAuthenticated,
    setIsAuthenticated,
    username,
    setUsername,
    authLoading,
    setAuthLoading,
    authError,
    setAuthError,
    authSuccess,
    setAuthSuccess,
    logout,
  }

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
