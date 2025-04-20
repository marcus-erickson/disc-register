"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import { useAuth } from "../context/AuthContext"
import ProtectedRoute from "@/components/protected-route"
import Header from "@/components/header"
import ImageUpload from "@/components/image-upload"

export default function AddDisc() {
  const router = useRouter()
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [discId, setDiscId] = useState<string | null>(null)
  const [uploadedImages, setUploadedImages] = useState<string[]>([])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      setError("You must be logged in to add a disc")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from("discs")
        .insert({
          user_id: user.id,
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
            disc_id: data[0].id,
            storage_path: path,
          }))

          const { error: imageError } = await supabase.from("disc_images").insert(imageInserts)

          if (imageError) {
            console.error("Error saving image references:", imageError)
          }
        }

        router.push("/")
      }
    } catch (error) {
      console.error("Error adding disc:", error)
      setError("Failed to add disc. Please try again.")
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

  return (
    <ProtectedRoute>
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">Add New Disc</h1>
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
            <Label>Disc Images</Label>
            <p className="text-sm text-gray-500 mb-2">Upload images of your disc (up to 5)</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[...Array(Math.min(5, uploadedImages.length + 1))].map((_, index) => (
                <ImageUpload
                  key={index}
                  discId={discId || "temp"}
                  onImageUploaded={handleImageUploaded}
                  disabled={isSubmitting || index > uploadedImages.length}
                />
              ))}
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Adding..." : "Add Disc"}
          </Button>
        </form>
      </div>
    </ProtectedRoute>
  )
}
