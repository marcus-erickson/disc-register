"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Disc, Search, User, CheckCircle, Settings } from "lucide-react"
import { useEffect, useState } from "react"
import { useAuth } from "@/app/context/AuthContext"
import { isUserAdmin } from "@/app/actions/admin-actions"

// Use the same global admin status cache as in mobile-nav
const globalAdminStatus: Record<string, boolean> = {}

interface SidebarNavProps {
  className?: string
}

export function SidebarNav({ className }: SidebarNavProps) {
  const pathname = usePathname()
  const { user } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isAdminChecking, setIsAdminChecking] = useState(false)

  // Check if the user is an admin - with debounce and global cache
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user || isAdminChecking) return

      // Check global cache first
      if (user.id in globalAdminStatus) {
        setIsAdmin(globalAdminStatus[user.id])
        return
      }

      try {
        setIsAdminChecking(true)
        const adminStatus = await isUserAdmin(user.id)

        // Update global cache
        globalAdminStatus[user.id] = adminStatus
        setIsAdmin(adminStatus)
      } catch (error) {
        console.error("Error checking admin status in sidebar:", error)
      } finally {
        setIsAdminChecking(false)
      }
    }

    checkAdminStatus()
  }, [user, isAdminChecking])

  const navItems = [
    {
      title: "My Discs",
      href: "/",
      icon: <Disc className="h-4 w-4 mr-2" />,
    },
    {
      title: "Lost and Found",
      href: "/lost-discs",
      icon: <Search className="h-4 w-4 mr-2" />,
    },
    {
      title: "Disc Claims",
      href: "/claims",
      icon: <CheckCircle className="h-4 w-4 mr-2" />,
    },
    {
      title: "Profile Settings",
      href: "/profile",
      icon: <User className="h-4 w-4 mr-2" />,
    },
  ]

  // Add admin link if user is an admin
  if (isAdmin) {
    navItems.push({
      title: "Admin Settings",
      href: "/admin",
      icon: <Settings className="h-4 w-4 mr-2" />,
    })
  }

  return (
    <nav className={cn("flex flex-col space-y-1", className)}>
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center px-3 py-2 text-sm font-medium rounded-md",
              isActive ? "bg-green-100 text-green-800" : "text-gray-700 hover:bg-gray-100",
            )}
          >
            {item.icon}
            {item.title}
          </Link>
        )
      })}
    </nav>
  )
}
