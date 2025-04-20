"use client"

import { useEffect, useState } from "react"
import Header from "@/components/header"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import { useAuth } from "./context/AuthContext"
import ProtectedRoute from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { PencilIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import ViewToggle from "@/components/view-toggle"
import Image from "next/image"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getImageUrl } from "@/lib/storage-utils"

interface Disc {
  id: string
  name: string
  brand: string
  plastic: string
  weight: string
  condition: string
  color: string
  stamp: string
  inked: boolean
  for_sale: boolean
  price: number | null
  images?: string[]
}

export default function Home() {
  const [discs, setDiscs] = useState<Disc[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({})
  const { user } = useAuth()
  const router = useRouter()

  // Load view preference from localStorage on component mount
  useEffect(() => {
    const savedView = localStorage.getItem("discViewMode") as "grid" | "list"
    if (savedView) {
      setViewMode(savedView)
    }
  }, [])

  // Save view preference to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("discViewMode", viewMode)
  }, [viewMode])

  useEffect(() => {
    const fetchDiscs = async () => {
      if (!user) return

      try {
        // Fetch discs
        const { data: discsData, error: discsError } = await supabase
          .from("discs")
          .select("*")
          .order("created_at", { ascending: false })

        if (discsError) {
          throw discsError
        }

        // Fetch images for each disc
        const discsWithImages = await Promise.all(
          (discsData || []).map(async (disc) => {
            const { data: imagesData, error: imagesError } = await supabase
              .from("disc_images")
              .select("storage_path")
              .eq("disc_id", disc.id)

            if (imagesError) {
              console.error("Error fetching images:", imagesError)
              return { ...disc, images: [] }
            }

            return {
              ...disc,
              images: imagesData.map((img) => img.storage_path),
            }
          }),
        )

        setDiscs(discsWithImages || [])

        // Pre-fetch image URLs for the list view
        const urlMap: Record<string, string> = {}
        for (const disc of discsWithImages) {
          if (disc.images && disc.images.length > 0) {
            try {
              const url = await getImageUrl(disc.images[0])
              urlMap[disc.id] = url
            } catch (error) {
              console.error(`Error getting image URL for disc ${disc.id}:`, error)
            }
          }
        }
        setImageUrls(urlMap)
      } catch (error) {
        console.error("Error fetching discs:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDiscs()
  }, [user])

  const handleViewChange = (view: "grid" | "list") => {
    setViewMode(view)
  }

  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {discs.map((disc) => (
        <Card key={disc.id} className="overflow-hidden">
          <div className="flex flex-col md:flex-row p-4">
            {/* Image on the side */}
            <div className="md:w-1/3 mb-4 md:mb-0 md:mr-4">
              {disc.images && disc.images.length > 0 ? (
                <div className="relative w-full h-32 bg-gray-100 rounded-md overflow-hidden">
                  <Image src={imageUrls[disc.id] || "/placeholder.svg"} alt={disc.name} fill className="object-cover" />
                </div>
              ) : (
                <div className="w-full h-32 bg-gray-100 rounded-md flex items-center justify-center">
                  <span className="text-xs text-gray-400">No image</span>
                </div>
              )}
            </div>

            {/* Disc details */}
            <div className="md:w-2/3">
              <h3 className="text-lg font-bold mb-2">{disc.name}</h3>

              <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-3">
                <div>
                  <p className="text-sm text-gray-500">Brand</p>
                  <p className="font-medium">{disc.brand}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Plastic</p>
                  <p className="font-medium">{disc.plastic}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Weight</p>
                  <p className="font-medium">{disc.weight}g</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Color</p>
                  <p className="font-medium">{disc.color}</p>
                </div>
                {disc.stamp && (
                  <div>
                    <p className="text-sm text-gray-500">Stamp</p>
                    <p className="font-medium">{disc.stamp}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500">Condition</p>
                  <p className="font-medium">{disc.condition}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                {disc.inked && (
                  <Badge variant="outline" className="text-xs">
                    Inked
                  </Badge>
                )}
                {disc.for_sale && <Badge className="bg-green-500 text-xs">For Sale: ${disc.price}</Badge>}
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => router.push(`/edit-disc/${disc.id}`)}
              >
                <PencilIcon className="h-4 w-4 mr-2" /> Edit Disc
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )

  const renderListView = () => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">Image</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Brand</TableHead>
            <TableHead>Plastic</TableHead>
            <TableHead>Weight</TableHead>
            <TableHead>Color</TableHead>
            <TableHead>Stamp</TableHead>
            <TableHead>Condition</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {discs.map((disc) => (
            <TableRow key={disc.id}>
              <TableCell>
                {disc.images && disc.images.length > 0 && imageUrls[disc.id] ? (
                  <div className="relative w-12 h-12 rounded-md overflow-hidden">
                    <Image
                      src={imageUrls[disc.id] || "/placeholder.svg"}
                      alt={disc.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center">
                    <span className="text-xs text-gray-400">No image</span>
                  </div>
                )}
              </TableCell>
              <TableCell className="font-medium">{disc.name}</TableCell>
              <TableCell>{disc.brand}</TableCell>
              <TableCell>{disc.plastic}</TableCell>
              <TableCell>{disc.weight}g</TableCell>
              <TableCell>{disc.color}</TableCell>
              <TableCell>{disc.stamp || "-"}</TableCell>
              <TableCell>{disc.condition}</TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  {disc.for_sale && <Badge className="bg-green-500 text-xs px-2 py-0.5">${disc.price}</Badge>}
                  {disc.inked && (
                    <Badge variant="outline" className="text-xs px-2 py-0.5">
                      Inked
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="outline" size="sm" onClick={() => router.push(`/edit-disc/${disc.id}`)}>
                  <PencilIcon className="h-4 w-4 mr-2" /> Edit
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">My Disc Golf Collection</h1>
            <ViewToggle currentView={viewMode} onChange={handleViewChange} />
          </div>

          {loading ? (
            <p>Loading your collection...</p>
          ) : discs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">Your collection is empty</p>
              <p>
                <a href="/add-disc" className="text-blue-600 hover:underline">
                  Add your first disc
                </a>
              </p>
            </div>
          ) : viewMode === "grid" ? (
            renderGridView()
          ) : (
            renderListView()
          )}
        </div>
      </main>
    </ProtectedRoute>
  )
}
