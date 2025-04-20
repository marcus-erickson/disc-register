"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { supabase } from "@/lib/supabase"

export default function SetAdminPage() {
  const [userId, setUserId] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSetAdmin = async () => {
    if (!userId) return

    setIsLoading(true)
    try {
      // Direct database update - only use this page once to set up your admin user
      const { error } = await supabase.from("profiles").update({ is_admin: true }).eq("id", userId)

      if (error) {
        throw error
      }

      toast({
        title: "Success",
        description: "User has been set as admin",
      })
    } catch (error: any) {
      console.error("Error setting admin:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to set user as admin",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Set Admin User</CardTitle>
          <CardDescription>Use this page once to set up your admin user</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="userId">User ID</Label>
              <Input
                id="userId"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Enter user ID"
              />
            </div>
            <Button onClick={handleSetAdmin} disabled={isLoading || !userId}>
              {isLoading ? "Processing..." : "Set as Admin"}
            </Button>
          </div>
        </CardContent>
      </Card>
      <Toaster />
    </div>
  )
}
