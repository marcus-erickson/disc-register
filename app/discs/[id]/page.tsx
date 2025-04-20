"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { AppLayout } from "@/components/app-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/app/context/AuthContext"
import ProtectedRoute from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { PencilIcon, Trash2Icon } from "lucide-react"
import ImageGallery from "@/components/image-gallery"
import { ConfirmationDialog } from "@/components/confirmation-dialog"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { formatBrandName } from "@/lib/format-utils"

interface Disc {
  id: string
  user_id: string
  name: string
  brand: string
  plastic: string
  weight: string
  condition: string
  color: string
  stamp: string
  notes: string
  inked: boolean
  for_sale: boolean
  price: number | null
  created_at: string
  updated_at: string
  images?: string[]
}

export default function DiscDetails() {
  const params = useParams()
  const discId = params.id as string
  const router = useRouter()
  const { user } = useAuth()
  const [disc, setDisc] = useState<Disc | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  useEffect(() => {
    const fetchDiscDetails = async () => {
      try {
        setLoading(true)
        // Fetch disc data
        const { data: discData, error: discError } = await supabase.from("discs").select("*").eq("id", discId).single()

        if (discError) {
          throw discError
        }

        if (!discData) {
          router.push("/")
          return
        }

        // Check if the disc belongs to the current user
        if (discData.user_id !== user?.id) {
          router.push("/")
          return
        }

        // Fetch disc images
        const { data: imagesData, error: imagesError } = await supabase
          .from("disc_images")
          .select("storage_path")
          .eq("disc_id", discId)

        if (imagesError) {
          console.error("Error fetching images:", imagesError)
        }

        setDisc({
          ...discData,
          images: imagesData ? imagesData.map((img) => img.storage_path) : [],
        })
      } catch (error) {
        console.error("Error fetching disc details:", error)
        setError("Failed to load disc details. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchDiscDetails()
    }
  }, [discId, router, user])

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!disc) return

    try {
      // First, delete any associated images from the disc_images table
      const { error: imagesError } = await supabase.from("disc_images").delete().eq("disc_id", disc.id)

      if (imagesError) {
        console.error("Error deleting disc images:", imagesError)
      }

      // Then delete the disc itself
      const { error: discError } = await supabase.from("discs").delete().eq("id", disc.id)

      if (discError) {
        throw discError
      }

      toast({
        title: "Success",
        description: "Disc deleted successfully",
      })

      router.push("/")
    } catch (error) {
      console.error("Error deleting disc:", error)
      toast({
        title: "Error",
        description: "Failed to delete disc. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false)
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
            <Button onClick={() => router.push("/")} className="mt-4">
              Back to Collection
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
            <h1 className="text-3xl font-bold">Disc Details</h1>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => router.push(`/edit-disc/${disc.id}`)}
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
              <Button onClick={() => router.push("/")} variant="outline">
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
                        <p className="text-sm text-gray-500">Name</p>
                        <p className="font-medium">{disc.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Plastic</p>
                        <p className="font-medium">{disc.plastic || "Not specified"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Weight</p>
                        <p className="font-medium">{disc.weight ? `${disc.weight}g` : "Not specified"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Color</p>
                        <p className="font-medium">{disc.color || "Not specified"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Condition</p>
                        <p className="font-medium">{disc.condition || "Not specified"}</p>
                      </div>
                      {disc.stamp && (
                        <div>
                          <p className="text-sm text-gray-500">Stamp</p>
                          <p className="font-medium">{disc.stamp}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-medium mb-2">Status</h3>
                    <div className="flex flex-wrap gap-2">
                      {disc.inked && <Badge variant="outline">Inked</Badge>}
                      {disc.for_sale && <Badge className="bg-green-500">${disc.price}</Badge>}
                    </div>
                  </div>

                  {disc.notes && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="text-lg font-medium mb-2">Notes</h3>
                        <p className="whitespace-pre-line">{disc.notes}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <ConfirmationDialog
          isOpen={deleteDialogOpen}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          title="Delete Disc"
          description="Are you sure you want to delete this disc? This action cannot be undone."
          confirmText="Yes"
          cancelText="No"
        />

        <Toaster />
      </AppLayout>
    </ProtectedRoute>
  )
}
