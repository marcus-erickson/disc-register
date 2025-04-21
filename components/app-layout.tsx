"use client"

import type { ReactNode } from "react"
import { SidebarNav } from "./sidebar-nav"
import { useAuth } from "@/app/context/AuthContext"
import Link from "next/link"
import { useEffect, useState } from "react"
import { MobileNav } from "./mobile-nav"
// Update the imports to include Search icon
import { User, PlusCircle, Upload, Search, LogOut } from "lucide-react"

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
      {/* Replace the header section with this updated version */}
      <header className="bg-green-600 text-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <MobileNav />
            <h1 className="text-2xl font-bold">Disc Register</h1>
          </div>
          {user && (
            <div className="flex items-center gap-2">
              <Link
                href="/add-disc"
                className="hidden md:flex items-center gap-1 text-white bg-green-700 hover:bg-green-800 px-3 py-1 rounded-md"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Add Disc</span>
              </Link>
              <Link
                href="/report-lost-disc"
                className="hidden md:flex items-center gap-1 text-white bg-green-700 hover:bg-green-800 px-3 py-1 rounded-md"
              >
                <Search className="h-4 w-4" />
                <span>Report Lost</span>
              </Link>
              <Link
                href="/import-discs"
                className="hidden md:flex items-center gap-1 text-white bg-green-700 hover:bg-green-800 px-3 py-1 rounded-md"
              >
                <Upload className="h-4 w-4" />
                <span>Import</span>
              </Link>
              <Link href="/profile" className="hidden md:flex items-center gap-2 text-white hover:text-green-100">
                <User className="h-4 w-4" />
                <span>{userName || "Profile"}</span>
              </Link>
              <Link
                href="#"
                onClick={signOut}
                className="hidden md:flex items-center gap-1 text-white hover:text-green-100"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Link>
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-72 bg-white border-r p-4 hidden md:block">
          <SidebarNav />
        </aside>

        {/* Main content */}
        <main className="flex-1 bg-gray-50">{children}</main>
      </div>
    </div>
  )
}
