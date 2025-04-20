"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import type { User, Session } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import { useRouter, usePathname } from "next/navigation"

type AuthContextType = {
  user: User | null
  session: Session | null
  isLoading: boolean
  signUp: (email: string, password: string, name?: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  getUserProfile: () => Promise<{ name: string } | null>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const setData = async () => {
      try {
        console.log(`AuthContext: Fetching session for path ${pathname}`)
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("AuthContext: Error getting session", error)
          setIsLoading(false)
          return
        }

        console.log(`AuthContext: Session fetched for path ${pathname}`, {
          hasSession: !!session,
          userId: session?.user?.id || "none",
        })

        setSession(session)
        setUser(session?.user ?? null)
        setIsLoading(false)
      } catch (err) {
        console.error(`AuthContext: Unexpected error for path ${pathname}`, err)
        setIsLoading(false)
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log(`AuthContext: Auth state changed for path ${pathname}`, {
        event: _event,
        hasSession: !!session,
        userId: session?.user?.id || "none",
      })

      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    setData()

    return () => {
      subscription.unsubscribe()
    }
  }, [pathname])

  const signUp = async (email: string, password: string, name?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || "",
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      console.error("Signup error:", error)
      throw error
    }
  }

  const signIn = async (email: string, password: string) => {
    console.log("AuthContext: Signing in", { email })
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error("AuthContext: Sign in error", error)
      throw error
    }

    console.log("AuthContext: Sign in successful")
  }

  const signOut = async () => {
    console.log("AuthContext: Signing out")
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error("AuthContext: Sign out error", error)
      throw error
    }
    console.log("AuthContext: Sign out successful")
    router.push("/login")
  }

  const getUserProfile = async () => {
    if (!user) return null

    try {
      // First try to get from profiles table
      const { data, error } = await supabase.from("profiles").select("name").eq("id", user.id).single()

      if (!error && data) {
        return {
          name: data.name || "",
        }
      }

      // If profile doesn't exist yet, try to create it
      if (error && error.code === "PGRST116") {
        // Get user data from auth
        const { data: userData } = await supabase.auth.getUser()

        if (userData && userData.user) {
          const name = userData.user.user_metadata?.name || ""

          // Try to create a profile
          const { error: insertError } = await supabase.from("profiles").insert({
            id: user.id,
            email: userData.user.email || "",
            name: name,
          })

          if (!insertError) {
            return { name }
          }
        }
      }

      // Fallback to auth metadata
      return {
        name: user.user_metadata?.name || "",
      }
    } catch (error) {
      console.error("Error fetching user profile:", error)
      return null
    }
  }

  // Add debug output
  useEffect(() => {
    console.log(`AuthContext state for path ${pathname}:`, {
      isLoading,
      isAuthenticated: !!user,
      userId: user?.id || "none",
    })
  }, [isLoading, user, pathname])

  const value = {
    user,
    session,
    isLoading,
    signUp,
    signIn,
    signOut,
    getUserProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
