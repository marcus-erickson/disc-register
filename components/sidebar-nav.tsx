"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Disc, Search, PlusCircle, User, CheckCircle } from "lucide-react"

interface SidebarNavProps {
  className?: string
}

export function SidebarNav({ className }: SidebarNavProps) {
  const pathname = usePathname()

  // Let's log the exact path to check for any issues
  console.log("SidebarNav current pathname:", pathname)

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
    </nav>
  )
}
