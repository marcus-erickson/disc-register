"use client"

import { useEffect } from "react"
import { AppLayout } from "@/components/app-layout"
import ProtectedRoute from "@/components/protected-route"
import { useAuth } from "@/app/context/AuthContext"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function LostAndFound() {
  const { user, isLoading } = useAuth()

  useEffect(() => {
    console.log("Lost and Found page component rendered")
  }, [])

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
