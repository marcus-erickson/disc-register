"use client"

import type { ReactNode } from "react"
import { SidebarNav } from "./sidebar-nav"
import { useAuth } from "@/app/context/AuthContext"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useEffect, useState } from "react"

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, signOut, getUserProfile } = useAuth()
  const [userName, setUserName] = useState<string>("")

  // Add debug output
  useEffect(() => {
    console.log("AppLayout rendered with auth state:", { isAuthenticated: !!user })
  }, [user])

  // Fetch user profile to get name
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        const profile = await getUserProfile()
        if (profile) {
          setUserName(profile.name || user.email?.split("@")[0] || "")
        } else {
          // Fallback to email username if profile not available
          setUserName(user.email?.split("@")[0] || "")
        }
      }
    }

    fetchUserProfile()
  }, [user, getUserProfile])

  return (
    <div className="min-h-screen flex flex-col">
      {/* Green banner */}
      <header className="bg-green-600 text-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Disc Register</h1>
          {user && (
            <div className="flex items-center gap-4">
              <span className="hidden md:inline">{userName || "Welcome"}</span>
              <Button
                variant="outline"
                className="text-green-600 bg-white border-white hover:bg-green-700 hover:text-white"
                onClick={signOut}
              >
                Logout
              </Button>
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-72 bg-white border-r p-4 hidden md:block">
          <SidebarNav />

          <div className="mt-8 pt-4 border-t">
            <Link
              href="/add-disc"
              className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
            >
              Add New Disc
            </Link>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 bg-gray-50">{children}</main>
      </div>
    </div>
  )
}
