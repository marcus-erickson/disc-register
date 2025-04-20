"use client"

import { useEffect } from "react"
import { AppLayout } from "@/components/app-layout"
import ProtectedRoute from "@/components/protected-route"
import { useAuth } from "@/app/context/AuthContext"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function AddLostDisc() {
  const { user } = useAuth()
  const router = useRouter()

  // Add debug logging
  useEffect(() => {
    console.log("Simple Add Lost Disc page rendered, auth state:", { isAuthenticated: !!user })
  }, [user])

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-4">Report Lost Disc</h1>
          <p className="mb-4">This is a simplified version of the add page for debugging.</p>

          {user ? (
            <div className="p-4 bg-green-50 rounded-md mb-4">
              <p>You are logged in as: {user.email}</p>
            </div>
          ) : (
            <div className="p-4 bg-red-50 rounded-md mb-4">
              <p>Not logged in</p>
            </div>
          )}

          <Button onClick={() => router.push("/lost-discs")} variant="outline">
            Back to Lost Discs
          </Button>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}
