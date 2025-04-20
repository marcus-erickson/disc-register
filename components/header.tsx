"use client"

import { DropdownMenuItem } from "@/components/ui/dropdown-menu"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/app/context/AuthContext"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, LogOut, Settings } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export default function Header() {
  const { user, signOut, getUserProfile } = useAuth()
  const [userName, setUserName] = useState("")
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        try {
          // First try to get from profiles table
          const { data, error } = await supabase.from("profiles").select("name").eq("id", user.id).single()

          if (!error && data && data.name) {
            setUserName(data.name)
          } else {
            // Fallback to auth metadata
            const profile = await getUserProfile()
            if (profile) {
              setUserName(profile.name || user.email?.split("@")[0] || "")
            }
          }
        } catch (error) {
          console.error("Error fetching user name:", error)
          setUserName(user.email?.split("@")[0] || "")
        }
      }
    }

    fetchUserProfile()
  }, [user, getUserProfile])

  return (
    <header className="bg-green-600 text-white shadow-md">
      <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div>
          <Link href="/" className="text-xl font-bold">
            Disc Golf Collection
          </Link>
        </div>

        <ul className="flex space-x-4 items-center">
          {user ? (
            <>
              <li>
                <Link href="/" className="text-white hover:text-green-100">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/add-disc" className="text-white hover:text-green-100">
                  Add Disc
                </Link>
              </li>
              <li>
                <Link href="/for-sale" className="text-white hover:text-green-100">
                  For Sale
                </Link>
              </li>
              <li className="flex items-center space-x-2">
                <span className="hidden md:inline">{userName || "Account"}</span>
                <Link href="/profile">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:text-green-100 hover:bg-green-700"
                    title="Profile Settings"
                  >
                    <User className="h-5 w-5" />
                  </Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:text-green-100 hover:bg-green-700"
                      title="Account Menu"
                    >
                      <Settings className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center w-full cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut} className="text-red-600 cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link href="/login" className="text-white hover:text-green-100">
                  Login
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-white hover:text-green-100">
                  Register
                </Link>
              </li>
            </>
          )}
        </ul>
      </nav>
    </header>
  )
}
