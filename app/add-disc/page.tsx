"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import { useAuth } from "../context/AuthContext"
import ProtectedRoute from "@/components/protected-route"
import { AppLayout } from "@/components/app-layout"
import ImageUpload from "@/components/image-upload"
import { Toaster } from "@/components/ui/toaster"
import VoiceInput from "@/components/voice-input"
import { toast } from "@/components/ui/use-toast"

export default function AddDisc() {
  const router = useRouter()
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [discId, setDiscId] = useState<string | null>(null)
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  // First, let's add a state to track which button was clicked
  const [submitAction, setSubmitAction] = useState<"save" | "saveAndAddAnother">("save")

  const [disc, setDisc] = useState({
    name: "",
    brand: "",
    plastic: "",
    weight: "",
    condition: "",
    color: "",
    stamp: "",
    notes: "",
    inked: false,
    for_sale: false,
    price: "",
  })

  // Modify the handleSubmit function to handle the new action
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
          notes: disc.notes,
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

        toast({
          title: "Success",
          description: "Disc added to your collection",
        })

        // If "Save and Add Another" was clicked, reset the form
        if (submitAction === "saveAndAddAnother") {
          // Reset form fields
          setDisc({
            name: "",
            brand: "",
            plastic: "",
            weight: "",
            condition: "",
            color: "",
            stamp: "",
            notes: "",
            inked: false,
            for_sale: false,
            price: "",
          })
          // Reset uploaded images
          setUploadedImages([])
          setDiscId(null)
          // Scroll to top of form
          window.scrollTo({ top: 0, behavior: "smooth" })
        } else {
          // Navigate back to collection
          router.push("/")
        }
      }
    } catch (error) {
      console.error("Error adding disc:", error)
      setError("Failed to add disc. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement
    const checked = (e.target as HTMLInputElement).checked
    setDisc((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleImageUploaded = (path: string) => {
    setUploadedImages((prev) => [...prev, path])
  }

  const handleVoiceResult = (result: any) => {
    // Update the disc state with the LLM-extracted fields
    setDisc((prev) => ({
      ...prev,
      brand: result.brand || prev.brand,
      name: result.name || prev.name,
      color: result.color || prev.color,
      plastic: result.plastic || prev.plastic,
      weight: result.weight || prev.weight,
      condition: result.condition || prev.condition,
      inked: result.inked !== undefined ? result.inked : prev.inked,
      notes: result.notes || prev.notes,
    }))

    toast({
      title: "Voice Input Processed",
      description: "The form has been updated with your spoken description.",
    })
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-4">Add New Disc</h1>

          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h2 className="text-lg font-medium mb-2">Voice Input</h2>
            <p className="text-sm text-gray-600 mb-3">
              Describe your disc with your voice. For example: "A purple Judge from Dynamic Discs in Lucid plastic, 175
              grams, slightly used and inked with my name."
            </p>
            <VoiceInput onResult={handleVoiceResult} disabled={isSubmitting} />
          </div>

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
              <Label htmlFor="name">Mold</Label>
              <Input type="text" id="name" name="name" value={disc.name} onChange={handleChange} required />
            </div>
            <div>
              <Label htmlFor="plastic">Plastic</Label>
              <Input type="text" id="plastic" name="plastic" value={disc.plastic} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="stamp">Stamp</Label>
              <Input type="text" id="stamp" name="stamp" value={disc.stamp} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="color">Color</Label>
              <Input type="text" id="color" name="color" value={disc.color} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="weight">Weight (g)</Label>
              <Input type="number" id="weight" name="weight" value={disc.weight} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="condition">Condition</Label>
              <Input type="text" id="condition" name="condition" value={disc.condition} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                value={disc.notes}
                onChange={handleChange}
                placeholder="Any additional notes about this disc..."
                className="min-h-[100px]"
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
            <div className="flex gap-3">
              <Button type="submit" disabled={isSubmitting} onClick={() => setSubmitAction("save")}>
                {isSubmitting && submitAction === "save" ? "Adding..." : "Add Disc"}
              </Button>
              <Button
                type="submit"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => setSubmitAction("saveAndAddAnother")}
              >
                {isSubmitting && submitAction === "saveAndAddAnother" ? "Adding..." : "Save & Add Another"}
              </Button>
            </div>
          </form>
        </div>
        <Toaster />
      </AppLayout>
    </ProtectedRoute>
  )
}
