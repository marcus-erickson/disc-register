"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter, notFound } from "next/navigation"
import { AppLayout } from "@/components/app-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/app/context/AuthContext"
import ProtectedRoute from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { CalendarIcon, MapPinIcon } from "lucide-react"
import { Toaster } from "@/components/ui/toaster"
import { format } from "date-fns"
import { Separator } from "@/components/ui/separator"

interface LostDisc {
  id: string
  user_id: string
  brand: string
  name: string
  color: string
  location: string
  city: string
  state: string
  country: string
  description: string
  written_info: string
  phone_number: string
  date_found: string
  created_at: string
  updated_at: string
  user_email?: string
}

// Helper function to validate UUID
function isValidUUID(id: string) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

export default function LostDiscDetails() {
  const params = useParams()
  const discId = params.id as string
  const router = useRouter()
  const { user } = useAuth()
  const [disc, setDisc] = useState<LostDisc | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Helper function to format location
  const formatLocation = (disc: LostDisc) => {
    const parts = []
    if (disc.location) parts.push(disc.location)
    if (disc.city) parts.push(disc.city)
    if (disc.state) parts.push(disc.state)
    if (disc.country) parts.push(disc.country)

    return parts.join(", ") || "Location not specified"
  }

  useEffect(() => {
    // Special case for "add" - redirect to the add page
    if (discId === "add") {
      router.replace("/lost-discs/add")
      return
    }

    // If not a valid UUID, show the not-found page
    if (!isValidUUID(discId)) {
      notFound()
      return
    }

    const fetchDiscDetails = async () => {
      try {
        setLoading(true)
        console.log("Fetching disc details for ID:", discId)

        // Fetch disc data
        const { data: discData, error: discError } = await supabase
          .from("lost_discs")
          .select("*")
          .eq("id", discId)
          .single()

        if (discError) {
          throw discError
        }

        if (!discData) {
          setError("Disc not found")
          return
        }

        // Fetch user email
        let userEmail = "Unknown"
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("email")
          .eq("id", discData.user_id)
          .single()

        if (!userError && userData) {
          userEmail = userData.email
        }

        setDisc({
          ...discData,
          user_email: userEmail,
        })
      } catch (error) {
        console.error("Error fetching lost disc details:", error)
        setError("Failed to load disc details. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchDiscDetails()
  }, [discId, router])

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy")
    } catch (error) {
      return "Unknown date"
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="container mx-auto px-4 py-8">
            <p>Loading disc details...</p>
          </div>
        </AppLayout>
      </ProtectedRoute>
    )
  }

  if (error || !disc) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="container mx-auto px-4 py-8">
            <p className="text-red-500">{error || "Disc not found"}</p>
            <Button onClick={() => router.push("/lost-discs")} className="mt-4">
              Back to Lost and Found
            </Button>
          </div>
        </AppLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Lost Disc Details</h1>
            <Button onClick={() => router.push("/lost-discs")} variant="outline">
              Back
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{`${disc.brand} ${disc.name}`}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Disc Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Brand</p>
                    <p className="font-medium">{disc.brand}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium">{disc.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Color</p>
                    <p className="font-medium">{disc.color}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date Found</p>
                    <p className="font-medium flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      {formatDate(disc.date_found)}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-medium mb-2">Location</h3>
                <p className="flex items-start">
                  <MapPinIcon className="h-4 w-4 mr-1 mt-1 flex-shrink-0" />
                  <span>{formatLocation(disc)}</span>
                </p>
              </div>

              {disc.description && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-lg font-medium mb-2">Description</h3>
                    <p className="whitespace-pre-line">{disc.description}</p>
                  </div>
                </>
              )}

              <Separator />

              <div>
                <h3 className="text-lg font-medium mb-2">Contact Information</h3>
                <p className="text-sm">
                  This disc was reported by <span className="font-medium">{disc.user_email}</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Toaster />
      </AppLayout>
    </ProtectedRoute>
  )
}
