"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { toast } from "@/components/ui/use-toast"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface DiscImage {
  id: string
  storage_path: string
}

export default function EditLostDisc() {
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
  const [date, setDate] = useState<Date>(new Date())

  const [disc, setDisc] = useState({
    brand: "",
    name: "",
    color: "",
    location: "",
    city: "",
    state: "",
    country: "",
    description: "",
    user_id: "",
  })

  useEffect(() => {
    const fetchDisc = async () => {
      if (!user || !discId) return

      try {
        setIsLoading(true)
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
          router.push("/lost-and-found")
          return
        }

        // Check if the disc belongs to the current user
        if (discData.user_id !== user.id) {
          toast({
            title: "Access Denied",
            description: "You can only edit lost discs that you reported.",
            variant: "destructive",
          })
          router.push("/lost-and-found")
          return
        }

        // Fetch disc images
        const { data: imagesData, error: imagesError } = await supabase
          .from("lost_disc_images")
          .select("id, storage_path")
          .eq("lost_disc_id", discId)

        if (imagesError) {
          console.error("Error fetching images:", imagesError)
        }

        setDisc({
          brand: discData.brand || "",
          name: discData.name || "",
          color: discData.color || "",
          location: discData.location || "",
          city: discData.city || "",
          state: discData.state || "",
          country: discData.country || "",
          description: discData.description || "",
          user_id: discData.user_id,
        })

        if (discData.date_found) {
          setDate(new Date(discData.date_found))
        }

        setExistingImages(imagesData || [])
      } catch (error) {
        console.error("Error fetching lost disc:", error)
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
      setError("You must be logged in to edit a lost disc")
      return
    }

    // Check if the disc belongs to the current user
    if (disc.user_id !== user.id) {
      setError("You can only edit your own lost discs")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Update disc data
      const { error: updateError } = await supabase
        .from("lost_discs")
        .update({
          brand: disc.brand,
          name: disc.name,
          color: disc.color,
          location: disc.location,
          city: disc.city,
          state: disc.state,
          country: disc.country,
          description: disc.description,
          date_found: date.toISOString(),
          updated_at: new Date().toISOString(),
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
          const { error: deleteError } = await supabase.from("lost_disc_images").delete().eq("id", imageId)

          if (deleteError) {
            console.error("Error deleting image:", deleteError)
          }
        }
      }

      // Add new images
      if (uploadedImages.length > 0) {
        const imageInserts = uploadedImages.map((path) => ({
          lost_disc_id: discId,
          storage_path: path,
        }))

        const { error: imageError } = await supabase.from("lost_disc_images").insert(imageInserts)

        if (imageError) {
          console.error("Error saving image references:", imageError)
        }
      }

      toast({
        title: "Success",
        description: "Lost disc updated successfully",
      })

      router.push("/lost-and-found")
    } catch (error) {
      console.error("Error updating lost disc:", error)
      setError("Failed to update lost disc. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setDisc((prev) => ({
      ...prev,
      [name]: value,
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
            <h1 className="text-3xl font-bold mb-4">Edit Lost Disc</h1>
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
          <h1 className="text-3xl font-bold mb-4">Edit Lost Disc</h1>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            <div>
              <Label htmlFor="brand">Brand</Label>
              <Select
                name="brand"
                value={disc.brand}
                onValueChange={(value) => setDisc((prev) => ({ ...prev, brand: value }))}
                required
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
              <Label htmlFor="name">Disc Name</Label>
              <Input type="text" id="name" name="name" value={disc.name} onChange={handleChange} required />
            </div>

            <div>
              <Label htmlFor="color">Color</Label>
              <Input type="text" id="color" name="color" value={disc.color} onChange={handleChange} required />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Location Information</h3>

              <div>
                <Label htmlFor="location">Course/Park Name</Label>
                <Input type="text" id="location" name="location" value={disc.location} onChange={handleChange} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input type="text" id="city" name="city" value={disc.city} onChange={handleChange} />
                </div>

                <div>
                  <Label htmlFor="state">State/Province</Label>
                  <Input type="text" id="state" name="state" value={disc.state} onChange={handleChange} />
                </div>
              </div>

              <div>
                <Label htmlFor="country">Country</Label>
                <Input type="text" id="country" name="country" value={disc.country} onChange={handleChange} />
              </div>
            </div>

            <div>
              <Label>Date Found</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={date} onSelect={(date) => date && setDate(date)} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={disc.description}
                onChange={handleChange}
                placeholder="Any additional details about the disc..."
                className="min-h-[100px]"
              />
            </div>

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
              <Button type="submit" disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push("/lost-and-found")}>
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
