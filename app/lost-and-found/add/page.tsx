"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
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
import { Toaster } from "@/components/ui/toaster"
import { toast } from "@/components/ui/use-toast"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export default function AddLostDisc() {
  const router = useRouter()
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [discId, setDiscId] = useState<string | null>(null)
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
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
    written_info: "",
    phone_number: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      setError("You must be logged in to add a lost disc")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from("lost_discs")
        .insert({
          user_id: user.id,
          brand: disc.brand,
          name: disc.name,
          color: disc.color,
          location: disc.location,
          city: disc.city,
          state: disc.state,
          country: disc.country,
          description: disc.description,
          written_info: disc.written_info,
          phone_number: disc.phone_number,
          date_found: date.toISOString(),
        })
        .select()

      if (error) {
        throw error
      }

      // Set the disc ID for image uploads
      if (data && data.length > 0) {
        setDiscId(data[0].id)

        // If there are uploaded images, associate them with the disc
        if (uploadedImages.length > 0) {
          const imageInserts = uploadedImages.map((path) => ({
            lost_disc_id: data[0].id,
            storage_path: path,
          }))

          const { error: imageError } = await supabase.from("lost_disc_images").insert(imageInserts)

          if (imageError) {
            console.error("Error saving image references:", imageError)
          }
        }

        toast({
          title: "Success",
          description: "Lost disc added successfully",
        })

        router.push("/lost-and-found")
      }
    } catch (error) {
      console.error("Error adding lost disc:", error)
      setError("Failed to add lost disc. Please try again.")
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

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-4">Report Lost Disc</h1>
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
              <h3 className="text-lg font-medium">Identifying Information</h3>

              <div>
                <Label htmlFor="written_info">Written Name/PDGA Number (if any)</Label>
                <Input
                  type="text"
                  id="written_info"
                  name="written_info"
                  value={disc.written_info}
                  onChange={handleChange}
                  placeholder="e.g., 'John Smith' or 'PDGA #12345'"
                />
              </div>

              <div>
                <Label htmlFor="phone_number">Phone Number (if written on disc)</Label>
                <Input
                  type="text"
                  id="phone_number"
                  name="phone_number"
                  value={disc.phone_number}
                  onChange={handleChange}
                  placeholder="e.g., '555-123-4567'"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This will only be shown on the details page, not in the list view
                </p>
              </div>
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
              <Label>Disc Images</Label>
              <p className="text-sm text-gray-500 mb-2">Upload images of the disc (up to 5)</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[...Array(Math.min(5, uploadedImages.length + 1))].map((_, index) => (
                  <ImageUpload
                    key={index}
                    discId={discId || "lost-temp"}
                    onImageUploaded={handleImageUploaded}
                    disabled={isSubmitting || index > uploadedImages.length}
                  />
                ))}
              </div>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex gap-4">
              <Button type="submit" disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
                {isSubmitting ? "Submitting..." : "Report Lost Disc"}
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
