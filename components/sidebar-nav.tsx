"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface SidebarNavProps {
  className?: string
}

export function SidebarNav({ className }: SidebarNavProps) {
  const pathname = usePathname()

  const navItems = [
    {
      title: "My Disc Golf Collection",
      href: "/",
      label: "My Discs",
    },
    {
      title: "Lost and Found",
      href: "/lost-and-found",
      label: "Lost and Found",
    },
  ]

  return (
    <nav className={cn("flex flex-col space-y-1", className)}>
      {navItems.map((item) => {
        const isActive = pathname === item.href

        return (
          <div key={item.href} className="flex flex-col">
            <span className="px-3 py-1 text-xs font-medium text-gray-500">{item.label}</span>
            <Link
              href={item.href}
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                isActive ? "bg-green-100 text-green-800" : "text-gray-700 hover:bg-gray-100",
              )}
            >
              {item.title}
            </Link>
          </div>
        )
      })}
    </nav>
  )
}
