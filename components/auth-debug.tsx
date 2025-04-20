"use client"

import { useAuth } from "@/app/context/AuthContext"

export function AuthDebug() {
  const { user, isLoading } = useAuth()

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-70 text-white p-2 rounded text-xs z-50">
      <div>Auth Status: {isLoading ? "Loading..." : user ? "Authenticated" : "Not Authenticated"}</div>
      {user && <div>User: {user.email}</div>}
    </div>
  )
}
