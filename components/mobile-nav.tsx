"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, Disc, Search, Home, User, CheckCircle, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/app/context/AuthContext"
import { isUserAdmin } from "@/app/actions/admin-actions"

// Create a global admin status cache to prevent multiple checks
const globalAdminStatus: Record<string, boolean> = {}

export function MobileNav() {
  const [open, setOpen] = useState(false)
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
        console.error("Error checking admin status in mobile nav:", error)
      } finally {
        setIsAdminChecking(false)
      }
    }

    checkAdminStatus()
  }, [user, isAdminChecking])

  const navItems = [
    {
      title: "Home",
      href: "/",
      icon: <Home className="h-5 w-5 mr-2" />,
    },
    {
      title: "My Discs",
      href: "/",
      icon: <Disc className="h-5 w-5 mr-2" />,
    },
    {
      title: "For Sale",
      href: "/for-sale",
      icon: <Disc className="h-5 w-5 mr-2" />,
    },
    {
      title: "Lost and Found",
      href: "/lost-discs",
      icon: <Search className="h-5 w-5 mr-2" />,
    },
    {
      title: "Disc Claims",
      href: "/claims",
      icon: <CheckCircle className="h-5 w-5 mr-2" />,
    },
    {
      title: "Profile Settings",
      href: "/profile",
      icon: <User className="h-5 w-5 mr-2" />,
    },
  ]

  // Add admin link if user is an admin
  if (isAdmin) {
    navItems.push({
      title: "Admin Settings",
      href: "/admin",
      icon: <Settings className="h-5 w-5 mr-2" />,
    })
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[250px] sm:w-[300px] pt-10">
        <div className="flex flex-col gap-6">
          <div className="font-bold text-xl mb-2">Disc Register</div>
          <nav className="flex flex-col space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center px-3 py-3 text-base font-medium rounded-md",
                    isActive
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800",
                  )}
                >
                  {item.icon}
                  {item.title}
                </Link>
              )
            })}
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  )
}
