"use client"

import { AppLayout } from "@/components/app-layout"
import ProtectedRoute from "@/components/protected-route"
import { Toaster } from "@/components/ui/toaster"

export default function LostAndFound() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">Lost and Found</h1>
          <p className="text-gray-600">This page is under construction.</p>
        </div>
        <Toaster />
      </AppLayout>
    </ProtectedRoute>
  )
}
