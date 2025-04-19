"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/app/context/AuthContext"
import { Button } from "@/components/ui/button"

export default function Header() {
  const { user, signOut, isLoading, getUserProfile } = useAuth()
  const [userName, setUserName] = useState("")

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        const profile = await getUserProfile()
        if (profile) {
          setUserName(profile.name || user.email?.split("@")[0] || "")
        }
      }
    }

    fetchUserProfile()
  }, [user, getUserProfile])

  return (
    <header className="bg-white shadow">
      <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div>
          <Link href="/" className="text-xl font-bold">
            Disc Golf Collection
          </Link>
        </div>

        <ul className="flex space-x-4 items-center">
          {!isLoading && user ? (
            <>
              <li>
                <Link href="/" className="text-blue-600 hover:text-blue-800">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/add-disc" className="text-blue-600 hover:text-blue-800">
                  Add Disc
                </Link>
              </li>
              <li>
                <Link href="/for-sale" className="text-blue-600 hover:text-blue-800">
                  For Sale
                </Link>
              </li>
              <li>
                <span className="text-gray-600 mr-2">{userName ? `Hello, ${userName}` : user.email}</span>
                <Button variant="outline" onClick={signOut}>
                  Logout
                </Button>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link href="/login" className="text-blue-600 hover:text-blue-800">
                  Login
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-blue-600 hover:text-blue-800">
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
