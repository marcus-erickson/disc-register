"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Disc, Search, PlusCircle, User, CheckCircle, Settings } from "lucide-react"
import { useEffect, useState } from "react"
import { useAuth } from "@/app/context/AuthContext"
import { isUserAdmin } from "@/app/actions/admin-actions"
import { toast } from "@/components/ui/use-toast"

interface SidebarNavProps {
  className?: string
}

export function SidebarNav({ className }: SidebarNavProps) {
  const pathname = usePathname()
  const { user } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isAdminChecked, setIsAdminChecked] = useState(false)

  // Check if the user is an admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user) {
        try {
          console.log("Checking admin status for user:", user.id)
          const adminStatus = await isUserAdmin(user.id)
          console.log("Admin status result:", adminStatus)
          setIsAdmin(adminStatus)

          // For debugging on mobile
          if (adminStatus) {
            toast({
              title: "Admin Status",
              description: "You have administrator privileges",
            })
          }
        } catch (error) {
          console.error("Error checking admin status:", error)
          toast({
            title: "Admin Check Error",
            description: "Could not verify administrator status",
            variant: "destructive",
          })
        } finally {
          setIsAdminChecked(true)
        }
      }
    }

    checkAdminStatus()
  }, [user])

  // Let's log the exact path to check for any issues
  console.log("SidebarNav current pathname:", pathname)
  console.log("User authenticated:", !!user)
  console.log("Admin status:", isAdmin)

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
      title: "Report Lost Disc",
      href: "/report-lost-disc",
      icon: <PlusCircle className="h-4 w-4 mr-2" />,
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

        // Log when a link is clicked
        const handleClick = () => {
          console.log(`Clicked on: ${item.title}, navigating to: ${item.href}`)
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center px-3 py-2 text-sm font-medium rounded-md",
              isActive ? "bg-green-100 text-green-800" : "text-gray-700 hover:bg-gray-100",
            )}
            onClick={handleClick}
          >
            {item.icon}
            {item.title}
          </Link>
        )
      })}

      {/* Debug info - only visible in development */}
      {process.env.NODE_ENV === "development" && (
        <div className="mt-4 p-2 text-xs bg-gray-100 rounded">
          <p>User ID: {user?.id || "Not logged in"}</p>
          <p>Admin: {isAdmin ? "Yes" : "No"}</p>
          <p>Admin Checked: {isAdminChecked ? "Yes" : "No"}</p>
          <button
            onClick={async () => {
              if (user) {
                const status = await isUserAdmin(user.id)
                toast({
                  title: "Admin Check",
                  description: `Admin status: ${status ? "Yes" : "No"}`,
                })
              }
            }}
            className="mt-1 text-xs text-blue-600 underline"
          >
            Check Admin
          </button>
        </div>
      )}
    </nav>
  )
}
