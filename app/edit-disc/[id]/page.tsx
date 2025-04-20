"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/app/context/AuthContext"
import ProtectedRoute from "@/components/protected-route"
import { AppLayout } from "@/components/app-layout"
import ImageUpload from "@/components/image-upload"
import ImageGallery from "@/components/image-gallery"
import { Trash2 } from "lucide-react"
import { deleteImage } from "@/lib/storage-utils"
import { Toaster } from "@/components/ui/toaster"

interface DiscImage {
  id: string
  storage_path: string
}

export default function EditDisc() {
  const router = useRouter()
  const params = useParams()
  const discId = params.id as string
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [existingImages, setExistingImages] = useState<DiscImage[]>([])
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([])

  const [disc, setDisc] = useState({
    name: "",
    brand: "",
    plastic: "",
    weight: "",
    condition: "",
    color: "",
    stamp: "",
    inked: false,
    for_sale: false,
    price: "",
  })

  useEffect(() => {
    const fetchDisc = async () => {
      if (!user || !discId) return

      try {
        setIsLoading(true)
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
        if (discData.user_id !== user.id) {
          router.push("/")
          return
        }

        // Fetch disc images
        const { data: imagesData, error: imagesError } = await supabase
          .from("disc_images")
          .select("id, storage_path")
          .eq("disc_id", discId)

        if (imagesError) {
          console.error("Error fetching images:", imagesError)
        }

        setDisc({
          name: discData.name || "",
          brand: discData.brand || "",
          plastic: discData.plastic || "",
          weight: discData.weight || "",
          condition: discData.condition || "",
          color: discData.color || "",
          stamp: discData.stamp || "",
          inked: discData.inked || false,
          for_sale: discData.for_sale || false,
          price: discData.price ? discData.price.toString() : "",
        })

        setExistingImages(imagesData || [])
      } catch (error) {
        console.error("Error fetching disc:", error)
        setError("Failed to load disc data. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchDisc()
  }, [user, discId, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      setError("You must be logged in to edit a disc")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Update disc data
      const { error: updateError } = await supabase
        .from("discs")
        .update({
          name: disc.name,
          brand: disc.brand,
          plastic: disc.plastic,
          weight: disc.weight,
          condition: disc.condition,
          color: disc.color,
          stamp: disc.stamp,
          inked: disc.inked,
          for_sale: disc.for_sale,
          price: disc.for_sale && disc.price ? Number.parseFloat(disc.price) : null,
        })
        .eq("id", discId)

      if (updateError) {
        throw updateError
      }

      // Handle image deletions
      for (const imageId of imagesToDelete) {
        const imageToDelete = existingImages.find((img) => img.id === imageId)
        if (imageToDelete) {
          // Delete from storage
          await deleteImage(imageToDelete.storage_path)

          // Delete from database
          const { error: deleteError } = await supabase.from("disc_images").delete().eq("id", imageId)

          if (deleteError) {
            console.error("Error deleting image:", deleteError)
          }
        }
      }

      // Add new images
      if (uploadedImages.length > 0) {
        const imageInserts = uploadedImages.map((path) => ({
          disc_id: discId,
          storage_path: path,
        }))

        const { error: imageError } = await supabase.from("disc_images").insert(imageInserts)

        if (imageError) {
          console.error("Error saving image references:", imageError)
        }
      }

      router.push("/")
    } catch (error) {
      console.error("Error updating disc:", error)
      setError("Failed to update disc. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    setDisc((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleImageUploaded = (path: string) => {
    setUploadedImages((prev) => [...prev, path])
  }

  const handleDeleteImage = (imageId: string) => {
    setImagesToDelete((prev) => [...prev, imageId])
    setExistingImages((prev) => prev.filter((img) => img.id !== imageId))
  }

  if (isLoading) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-4">Edit Disc</h1>
            <p>Loading disc data...</p>
          </div>
        </AppLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-4">Edit Disc</h1>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            <div>
              <Label htmlFor="name">Disc Name</Label>
              <Input type="text" id="name" name="name" value={disc.name} onChange={handleChange} required />
            </div>
            <div>
              <Label htmlFor="brand">Brand</Label>
              <Select
                name="brand"
                value={disc.brand}
                onValueChange={(value) => setDisc((prev) => ({ ...prev, brand: value }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a brand" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="innova">Innova</SelectItem>
                  <SelectItem value="discraft">Discraft</SelectItem>
                  <SelectItem value="dynamic-discs">Dynamic Discs</SelectItem>
                  <SelectItem value="latitude-64">Latitude 64</SelectItem>
                  <SelectItem value="prodigy">Prodigy</SelectItem>
                  <SelectItem value="mvp">MVP</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="plastic">Plastic</Label>
              <Input type="text" id="plastic" name="plastic" value={disc.plastic} onChange={handleChange} required />
            </div>
            <div>
              <Label htmlFor="stamp">Stamp</Label>
              <Input type="text" id="stamp" name="stamp" value={disc.stamp} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="color">Color</Label>
              <Input type="text" id="color" name="color" value={disc.color} onChange={handleChange} required />
            </div>
            <div>
              <Label htmlFor="weight">Weight (g)</Label>
              <Input type="number" id="weight" name="weight" value={disc.weight} onChange={handleChange} required />
            </div>
            <div>
              <Label htmlFor="condition">Condition</Label>
              <Input
                type="text"
                id="condition"
                name="condition"
                value={disc.condition}
                onChange={handleChange}
                required
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="inked"
                name="inked"
                checked={disc.inked}
                onCheckedChange={(checked) => setDisc((prev) => ({ ...prev, inked: checked as boolean }))}
              />
              <Label htmlFor="inked">Inked</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="for_sale"
                name="for_sale"
                checked={disc.for_sale}
                onCheckedChange={(checked) => setDisc((prev) => ({ ...prev, for_sale: checked as boolean }))}
              />
              <Label htmlFor="for_sale">For Sale</Label>
            </div>
            {disc.for_sale && (
              <div>
                <Label htmlFor="price">Price ($)</Label>
                <Input type="number" id="price" name="price" value={disc.price} onChange={handleChange} step="0.01" />
              </div>
            )}

            <div>
              <Label>Current Images</Label>
              {existingImages.length > 0 ? (
                <div className="space-y-4 mt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {existingImages.map((image) => (
                      <div key={image.id} className="relative">
                        <div className="relative w-full h-40 bg-gray-100 rounded-md overflow-hidden">
                          <ImageGallery imagePaths={[image.storage_path]} />
                          <button
                            type="button"
                            onClick={() => handleDeleteImage(image.id)}
                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                            aria-label="Delete image"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 mt-2">No images available</p>
              )}
            </div>

            <div>
              <Label>Add New Images</Label>
              <p className="text-sm text-gray-500 mb-2">
                Upload additional images (up to {Math.max(0, 5 - existingImages.length)} more)
              </p>
              {existingImages.length < 5 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[...Array(Math.min(5 - existingImages.length, uploadedImages.length + 1))].map((_, index) => (
                    <ImageUpload
                      key={index}
                      discId={discId}
                      onImageUploaded={handleImageUploaded}
                      disabled={isSubmitting || index > uploadedImages.length}
                    />
                  ))}
                </div>
              )}
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex gap-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push("/")}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
        <Toaster />
      </AppLayout>
    </ProtectedRoute>
  )
}
