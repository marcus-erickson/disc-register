"use client"

import { useEffect } from "react"
import { AppLayout } from "@/components/app-layout"
import ProtectedRoute from "@/components/protected-route"

export default function TestPage() {
  useEffect(() => {
    console.log("Test page component rendered")
  }, [])

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">Test Page</h1>
          <p>This is a test page to check if routing is working correctly.</p>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}
