"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Disc, Search } from "lucide-react"

interface SidebarNavProps {
  className?: string
}

export function SidebarNav({ className }: SidebarNavProps) {
  const pathname = usePathname()

  const navItems = [
    {
      title: "My Discs",
      href: "/",
      icon: <Disc className="h-4 w-4 mr-2" />,
    },
    {
      title: "Lost and Found",
      href: "/lost-and-found",
      icon: <Search className="h-4 w-4 mr-2" />,
    },
  ]

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
