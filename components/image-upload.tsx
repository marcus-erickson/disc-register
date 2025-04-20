"use client"

import type React from "react"

import { useState, useRef } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { uploadDiscImage } from "@/lib/storage-utils"
import { X } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ImageUploadProps {
  discId: string
  onImageUploaded: (path: string) => void
  disabled?: boolean
}

export default function ImageUpload({ discId, onImageUploaded, disabled = false }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return
    }

    const file = e.target.files[0]
    const fileReader = new FileReader()

    fileReader.onload = (e) => {
      if (e.target?.result) {
        setPreview(e.target.result as string)
      }
    }

    fileReader.readAsDataURL(file)

    try {
      setUploading(true)
      setError(null)
      const filePath = await uploadDiscImage(file, discId)
      onImageUploaded(filePath)

      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error: any) {
      console.error("Error uploading image:", error)
      setError(error.message || "Failed to upload image. Please try again.")
      // Clear the preview on error
      setPreview(null)
    } finally {
      setUploading(false)
    }
  }

  const clearPreview = () => {
    setPreview(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-2">
      {error && (
        <Alert variant="destructive" className="mb-2">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {preview ? (
        <div className="relative w-full h-40 bg-gray-100 rounded-md overflow-hidden">
          <Image src={preview || "/placeholder.svg"} alt="Preview" fill className="object-contain" />
          <button
            onClick={clearPreview}
            className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full p-1 text-white"
            type="button"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <div className="w-full h-40 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center bg-gray-50">
          <p className="text-sm text-gray-500">Image preview</p>
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading || disabled}
          className="hidden"
          ref={fileInputRef}
          id="disc-image-upload"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || disabled}
        >
          {uploading ? "Uploading..." : "Upload Image"}
        </Button>
      </div>
    </div>
  )
}
