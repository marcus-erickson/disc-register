"use client"

import type React from "react"

import { useAuth } from "@/app/context/AuthContext"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState } from "react"

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isClient, setIsClient] = useState(false)

  // Add this to ensure we're only running client-side code
  useEffect(() => {
    setIsClient(true)
    console.log("ProtectedRoute: Client-side rendering initialized")
  }, [])

  useEffect(() => {
    // Only redirect if we're on the client and not loading and no user
    if (isClient && !isLoading && !user) {
      console.log(`ProtectedRoute: No authenticated user, redirecting to login from ${pathname}`)
      router.push("/login")
    }
  }, [user, isLoading, router, isClient, pathname])

  // Add debug output
  useEffect(() => {
    if (isClient) {
      console.log(`ProtectedRoute render state for ${pathname}:`, {
        isLoading,
        isAuthenticated: !!user,
        isClient,
      })
    }
  }, [isLoading, user, isClient, pathname])

  // Show loading state while checking authentication
  if (isLoading || !isClient) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center p-4 bg-gray-100 rounded-md">
          <p className="text-lg font-semibold mb-2">Verifying authentication...</p>
          <p className="text-sm text-gray-600">Path: {pathname}</p>
          <p className="text-sm text-gray-600">Loading: {isLoading ? "Yes" : "No"}</p>
          <p className="text-sm text-gray-600">Client-side: {isClient ? "Yes" : "No"}</p>
        </div>
      </div>
    )
  }

  // If not authenticated, don't render anything (redirect will happen)
  if (!user) {
    console.log(`ProtectedRoute: User not authenticated at ${pathname}, rendering null`)
    return null
  }

  // User is authenticated, render children
  console.log(`ProtectedRoute: User authenticated at ${pathname}, rendering children`)
  return <>{children}</>
}
