"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AppLayout } from "@/components/app-layout"
import ProtectedRoute from "@/components/protected-route"
import { useAuth } from "@/app/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface UserProfile {
  id: string
  name: string
  email: string
  location: string
  phone_number: string
  pdga_number: string
  show_in_directory: boolean
}

export default function ProfilePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<UserProfile>({
    id: "",
    name: "",
    email: "",
    location: "",
    phone_number: "",
    pdga_number: "",
    show_in_directory: false,
  })

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return

      try {
        setIsLoading(true)
        setError(null)

        // Try to get existing profile
        const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

        if (error) {
          // If the error is not a "not found" error, it's a real error
          if (error.code !== "PGRST116") {
            console.error("Error fetching profile:", error)
            setError("Failed to load profile data. Please try again.")
            return
          }

          // If profile doesn't exist, create one
          console.log("Profile not found, creating new profile")
          const { data: userData } = await supabase.auth.getUser()

          const newProfile = {
            id: user.id,
            email: userData.user?.email || "",
            name: userData.user?.user_metadata?.name || "",
            location: "",
            phone_number: "",
            pdga_number: "",
            show_in_directory: false,
          }

          // Insert the new profile
          const { error: insertError } = await supabase.from("profiles").insert(newProfile)

          if (insertError) {
            console.error("Error creating profile:", insertError)
            setError("Failed to create profile. Please try again.")
            return
          }

          setProfile(newProfile)
        } else {
          // Profile exists, use it - ensure no null values
          setProfile({
            id: data.id || "",
            name: data.name || "",
            email: data.email || "",
            location: data.location || "",
            phone_number: data.phone_number || "",
            pdga_number: data.pdga_number || "",
            show_in_directory: data.show_in_directory || false,
          })
        }
      } catch (error) {
        console.error("Error in profile flow:", error)
        setError("An unexpected error occurred. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleCheckboxChange = (checked: boolean) => {
    setProfile((prev) => ({
      ...prev,
      show_in_directory: checked,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) return

    try {
      setIsSaving(true)
      setError(null)

      // Update profile in Supabase
      const { error } = await supabase
        .from("profiles")
        .update({
          name: profile.name,
          location: profile.location,
          phone_number: profile.phone_number,
          pdga_number: profile.pdga_number,
          show_in_directory: profile.show_in_directory,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (error) {
        throw error
      }

      toast({
        title: "Success",
        description: "Your profile has been updated successfully.",
      })
    } catch (error) {
      console.error("Error updating profile:", error)
      setError("Failed to update profile. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">Your Profile</h1>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal information and preferences</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p>Loading profile data...</p>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" value={profile.email} disabled className="bg-gray-50" />
                    <p className="text-sm text-gray-500">
                      Email cannot be changed. Contact support if you need to update your email.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" name="name" value={profile.name} onChange={handleChange} placeholder="Your name" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      name="location"
                      value={profile.location}
                      onChange={handleChange}
                      placeholder="City, State"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone_number">Phone Number</Label>
                    <Input
                      id="phone_number"
                      name="phone_number"
                      value={profile.phone_number || ""}
                      onChange={handleChange}
                      placeholder="Your phone number"
                    />
                  </div>

                  <div className="pt-4 border-t">
                    <h3 className="text-lg font-medium mb-4">PDGA Information</h3>

                    <div className="space-y-2">
                      <Label htmlFor="pdga_number">PDGA Number</Label>
                      <Input
                        id="pdga_number"
                        name="pdga_number"
                        value={profile.pdga_number || ""}
                        onChange={handleChange}
                        placeholder="Your PDGA number"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <h3 className="text-lg font-medium mb-4">Privacy Settings</h3>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="show_in_directory"
                        checked={profile.show_in_directory}
                        onCheckedChange={handleCheckboxChange}
                      />
                      <Label htmlFor="show_in_directory" className="cursor-pointer">
                        Show my profile in the user directory
                      </Label>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      When enabled, other users can see your basic profile information in the user directory.
                    </p>
                  </div>

                  <Button type="submit" className="w-full mt-6 bg-green-600 hover:bg-green-700" disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save Profile"}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
        <Toaster />
      </AppLayout>
    </ProtectedRoute>
  )
}
