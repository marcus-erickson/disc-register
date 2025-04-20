"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { AppLayout } from "@/components/app-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/app/context/AuthContext"
import ProtectedRoute from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { PencilIcon, Trash2Icon, MapPinIcon, CalendarIcon, PhoneIcon, TagIcon } from "lucide-react"
import ImageGallery from "@/components/image-gallery"
import { ConfirmationDialog } from "@/components/confirmation-dialog"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { format } from "date-fns"
import { Separator } from "@/components/ui/separator"
import { notFound } from "next/navigation"
import { formatBrandName } from "@/lib/format-utils"
import { getUserDisplayName } from "@/lib/user-utils"

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
  finder_name?: string
  images?: string[]
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [claimDialogOpen, setClaimDialogOpen] = useState(false)

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
      router.replace("/lost-and-found/add")
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
          notFound()
          return
        }

        // Get finder's display name
        const finderName = await getUserDisplayName(discData.user_id)

        // Fetch disc images
        const { data: imagesData, error: imagesError } = await supabase
          .from("lost_disc_images")
          .select("storage_path")
          .eq("lost_disc_id", discId)

        if (imagesError) {
          console.error("Error fetching images:", imagesError)
        }

        setDisc({
          ...discData,
          finder_name: finderName,
          images: imagesData ? imagesData.map((img) => img.storage_path) : [],
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

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!disc) return

    try {
      // First, delete any associated images from the lost_disc_images table
      const { error: imagesError } = await supabase.from("lost_disc_images").delete().eq("lost_disc_id", disc.id)

      if (imagesError) {
        console.error("Error deleting lost disc images:", imagesError)
      }

      // Then delete the disc itself
      const { error: discError } = await supabase.from("lost_discs").delete().eq("id", disc.id)

      if (discError) {
        throw discError
      }

      toast({
        title: "Success",
        description: "Lost disc deleted successfully",
      })

      router.push("/lost-and-found")
    } catch (error) {
      console.error("Error deleting lost disc:", error)
      toast({
        title: "Error",
        description: "Failed to delete lost disc. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false)
  }

  const handleClaimClick = () => {
    setClaimDialogOpen(true)
  }

  const handleClaimConfirm = async () => {
    if (!disc || !user) return

    try {
      // Send email to the disc owner
      const { error } = await supabase.functions.invoke("send-claim-email", {
        body: {
          discId: disc.id,
          discName: `${disc.brand} ${disc.name}`,
          ownerId: user.id,
          finderId: disc.user_id,
        },
      })

      if (error) {
        throw error
      }

      toast({
        title: "Claim Submitted",
        description: "The owner has been notified of your claim.",
      })
    } catch (error) {
      console.error("Error claiming disc:", error)
      toast({
        title: "Error",
        description: "Failed to submit claim. Please try again.",
        variant: "destructive",
      })
    } finally {
      setClaimDialogOpen(false)
    }
  }

  const handleClaimCancel = () => {
    setClaimDialogOpen(false)
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy")
    } catch (error) {
      return "Unknown date"
    }
  }

  const canEditDisc = () => {
    return user && disc && disc.user_id === user.id
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
            <Button onClick={() => router.push("/lost-and-found")} className="mt-4">
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
            <div className="flex gap-2">
              {canEditDisc() && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/lost-and-found/edit/${disc.id}`)}
                    className="flex items-center gap-2"
                  >
                    <PencilIcon className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleDeleteClick}
                    className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2Icon className="h-4 w-4" />
                    Delete
                  </Button>
                </>
              )}
              <Button onClick={() => router.push("/lost-and-found")} variant="outline">
                Back
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Disc Images</CardTitle>
                </CardHeader>
                <CardContent>
                  {disc.images && disc.images.length > 0 ? (
                    <ImageGallery imagePaths={disc.images} />
                  ) : (
                    <div className="w-full h-64 border border-gray-200 rounded-md flex items-center justify-center bg-gray-50">
                      <p className="text-gray-500">No images available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>{`${formatBrandName(disc.brand)} ${disc.name}`}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Disc Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Brand</p>
                        <p className="font-medium">{formatBrandName(disc.brand)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Mold</p>
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

                  {(disc.written_info || disc.phone_number) && (
                    <>
                      <div>
                        <h3 className="text-lg font-medium mb-2">Identifying Information</h3>
                        {disc.written_info && (
                          <div className="mb-2">
                            <p className="text-sm text-gray-500">Written on Disc</p>
                            <p className="font-medium flex items-center">
                              <TagIcon className="h-4 w-4 mr-1" />
                              {disc.written_info}
                            </p>
                          </div>
                        )}
                        {disc.phone_number && (
                          <div>
                            <p className="text-sm text-gray-500">Phone Number</p>
                            <p className="font-medium flex items-center">
                              <PhoneIcon className="h-4 w-4 mr-1" />
                              {disc.phone_number}
                            </p>
                          </div>
                        )}
                      </div>
                      <Separator />
                    </>
                  )}

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
                      Found by <span className="font-medium">{disc.finder_name}</span>
                    </p>
                    <p className="text-sm text-gray-500 mt-1">Reported on {formatDate(disc.created_at)}</p>
                    <Button onClick={handleClaimClick} className="mt-4 w-full bg-green-600 hover:bg-green-700">
                      Claim This Disc
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <ConfirmationDialog
          isOpen={deleteDialogOpen}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          title="Delete Lost Disc"
          description="Are you sure you want to delete this lost disc? This action cannot be undone."
          confirmText="Yes"
          cancelText="No"
        />

        <ConfirmationDialog
          isOpen={claimDialogOpen}
          onClose={handleClaimCancel}
          onConfirm={handleClaimConfirm}
          title="Claim Disc"
          description={`Are you sure you want to claim this disc? An email will be sent to the person who found it.`}
          confirmText="Yes, Claim It"
          cancelText="Cancel"
        />

        <Toaster />
      </AppLayout>
    </ProtectedRoute>
  )
}
