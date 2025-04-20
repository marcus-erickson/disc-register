"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { getImageUrl } from "@/lib/storage-utils"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ImageGalleryProps {
  imagePaths: string[]
}

export default function ImageGallery({ imagePaths }: ImageGalleryProps) {
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadImages = async () => {
      try {
        setLoading(true)
        setError(null)

        if (imagePaths.length === 0) {
          setImageUrls([])
          setSelectedImage(null)
          setLoading(false)
          return
        }

        const urls = await Promise.all(
          imagePaths.map(async (path) => {
            try {
              return await getImageUrl(path)
            } catch (error) {
              console.error(`Error loading image ${path}:`, error)
              return null
            }
          }),
        )

        // Filter out any null values from failed image loads
        const validUrls = urls.filter((url) => url !== null) as string[]

        setImageUrls(validUrls)
        if (validUrls.length > 0) {
          setSelectedImage(validUrls[0])
        }
      } catch (error: any) {
        console.error("Error loading images:", error)
        setError(error.message || "Failed to load images")
      } finally {
        setLoading(false)
      }
    }

    loadImages()
  }, [imagePaths])

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="w-full h-64 rounded-md" />
        <div className="flex gap-2 overflow-x-auto py-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="w-20 h-20 rounded-md flex-shrink-0" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (imageUrls.length === 0) {
    return (
      <div className="w-full h-64 border border-gray-200 rounded-md flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">No images available</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="relative w-full h-64 bg-gray-100 rounded-md overflow-hidden">
        {selectedImage && (
          <Image src={selectedImage || "/placeholder.svg"} alt="Disc" fill className="object-contain" />
        )}
      </div>

      {imageUrls.length > 1 && (
        <div className="flex gap-2 overflow-x-auto py-2">
          {imageUrls.map((url, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(url)}
              className={`relative w-20 h-20 rounded-md overflow-hidden flex-shrink-0 border-2 ${
                selectedImage === url ? "border-blue-500" : "border-transparent"
              }`}
            >
              <Image src={url || "/placeholder.svg"} alt={`Thumbnail ${index + 1}`} fill className="object-contain" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
