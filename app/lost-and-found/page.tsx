"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { AppLayout } from "@/components/app-layout"
import ProtectedRoute from "@/components/protected-route"
import { useAuth } from "@/app/context/AuthContext"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Search, X } from "lucide-react"

export default function LostAndFound() {
  const { user, isLoading } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    console.log("Lost and Found page component rendered")
  }, [])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const clearSearch = () => {
    setSearchQuery("")
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Lost and Found Discs</h1>
            <Button asChild className="bg-green-600 hover:bg-green-700">
              <Link href="/lost-and-found/add">Add Lost Disc</Link>
            </Button>
          </div>

          {/* Search bar - changed from type="search" to type="text" */}
          <div className="relative mb-4">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              type="text"
              placeholder="Search by brand, name, or written info..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-10 w-full"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                aria-label="Clear search"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          <div className="p-6 bg-white rounded-lg shadow-md">
            <p className="text-lg mb-4">This is the Lost and Found page where you can report and view lost discs.</p>

            {user && (
              <div className="mt-4 p-4 bg-green-50 rounded-md">
                <p className="font-medium">You are logged in as: {user.email}</p>
              </div>
            )}
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}
