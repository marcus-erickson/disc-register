"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, Disc, Search, PlusCircle, Home, User, CheckCircle, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/app/context/AuthContext"
import { isUserAdmin } from "@/app/actions/admin-actions"

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const { user } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isAdminChecked, setIsAdminChecked] = useState(false)

  // Check if the user is an admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user) {
        try {
          console.log("Mobile nav: Checking admin status for user:", user.id)
          const adminStatus = await isUserAdmin(user.id)
          console.log("Mobile nav: Admin status result:", adminStatus)
          setIsAdmin(adminStatus)
          setIsAdminChecked(true)
        } catch (error) {
          console.error("Error checking admin status:", error)
        }
      }
    }

    checkAdminStatus()
  }, [user])

  // Log navigation state for debugging
  useEffect(() => {
    console.log("Mobile Nav rendered with path:", pathname)
    console.log("User authenticated:", !!user)
    console.log("Admin status:", isAdmin)
  }, [pathname, user, isAdmin])

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
      title: "Add Disc",
      href: "/add-disc",
      icon: <PlusCircle className="h-5 w-5 mr-2" />,
    },
    {
      title: "Report Lost Disc",
      href: "/report-lost-disc",
      icon: <PlusCircle className="h-5 w-5 mr-2" />,
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
                    isActive ? "bg-green-100 text-green-800" : "text-gray-700 hover:bg-gray-100",
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
