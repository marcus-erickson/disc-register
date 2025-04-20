"use client"

import { useEffect, useState, useCallback } from "react"
import { AppLayout } from "@/components/app-layout"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import { useAuth } from "./context/AuthContext"
import ProtectedRoute from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { PencilIcon, Trash2Icon, MoreVertical } from "lucide-react"
import { useRouter } from "next/navigation"
import ViewToggle from "@/components/view-toggle"
import Image from "next/image"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getImageUrl } from "@/lib/storage-utils"
import { ConfirmationDialog } from "@/components/confirmation-dialog"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import DiscFilters from "@/components/disc-filters"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { formatBrandName } from "@/lib/format-utils"

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
  const [filteredDiscs, setFilteredDiscs] = useState<Disc[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({})
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [discToDelete, setDiscToDelete] = useState<string | null>(null)
  const [filters, setFilters] = useState<{ name: string | null; brand: string | null }>({
    name: null,
    brand: null,
  })
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

  const fetchDiscs = async () => {
    if (!user) return

    try {
      setLoading(true)
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
      setFilteredDiscs(discsWithImages || [])

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
      toast({
        title: "Error",
        description: "Failed to load discs. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDiscs()
  }, [user])

  // Apply filters when discs or filters change
  useEffect(() => {
    let result = [...discs]

    if (filters.name) {
      result = result.filter((disc) => disc.name === filters.name)
    }

    if (filters.brand) {
      result = result.filter((disc) => disc.brand === filters.brand)
    }

    setFilteredDiscs(result)
  }, [discs, filters])

  const handleViewChange = (view: "grid" | "list") => {
    setViewMode(view)
  }

  // Use useCallback to prevent unnecessary re-renders
  const handleFilterChange = useCallback((newFilters: { name: string | null; brand: string | null }) => {
    setFilters(newFilters)
  }, [])

  const handleDeleteClick = (discId: string) => {
    setDiscToDelete(discId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!discToDelete) return

    try {
      // First, delete any associated images from the disc_images table
      const { error: imagesError } = await supabase.from("disc_images").delete().eq("disc_id", discToDelete)

      if (imagesError) {
        console.error("Error deleting disc images:", imagesError)
      }

      // Then delete the disc itself
      const { error: discError } = await supabase.from("discs").delete().eq("id", discToDelete)

      if (discError) {
        throw discError
      }

      // Update the UI by removing the deleted disc
      setDiscs((prevDiscs) => prevDiscs.filter((disc) => disc.id !== discToDelete))

      toast({
        title: "Success",
        description: "Disc deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting disc:", error)
      toast({
        title: "Error",
        description: "Failed to delete disc. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
      setDiscToDelete(null)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false)
    setDiscToDelete(null)
  }

  const renderGridView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {filteredDiscs.map((disc) => (
        <Card
          key={disc.id}
          className="overflow-hidden relative cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => router.push(`/discs/${disc.id}`)}
        >
          <div className="p-3">
            {/* Image */}
            <div className="mb-3">
              {disc.images && disc.images.length > 0 ? (
                <div className="relative w-full h-32 bg-gray-100 rounded-md overflow-hidden">
                  <Image
                    src={imageUrls[disc.id] || "/placeholder.svg"}
                    alt={disc.name}
                    fill
                    className="object-contain"
                  />
                </div>
              ) : (
                <div className="w-full h-32 bg-gray-100 rounded-md flex items-center justify-center">
                  <span className="text-xs text-gray-400">No image</span>
                </div>
              )}
            </div>

            {/* Main disc info - Brand Name format */}
            <h3 className="text-lg font-bold truncate">{`${formatBrandName(disc.brand)} ${disc.name}`}</h3>
            <div className="flex justify-end items-center mb-2">
              <span className="text-sm font-medium">{disc.weight}g</span>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-3">
              {disc.inked && (
                <Badge variant="outline" className="text-xs">
                  Inked
                </Badge>
              )}
              {disc.for_sale && <Badge className="bg-green-500 text-xs">${disc.price}</Badge>}
            </div>
          </div>

          {/* Ellipsis menu in the top right corner - stop propagation to prevent navigation when clicking menu */}
          <div className="absolute top-2 right-2 z-10" onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-white bg-opacity-80">
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.push(`/edit-disc/${disc.id}`)}>
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDeleteClick(disc.id)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2Icon className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
            <TableHead>Mold</TableHead>
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
          {filteredDiscs.map((disc) => (
            <TableRow key={disc.id}>
              <TableCell>
                {disc.images && disc.images.length > 0 && imageUrls[disc.id] ? (
                  <div className="relative w-12 h-12 rounded-md overflow-hidden">
                    <Image
                      src={imageUrls[disc.id] || "/placeholder.svg"}
                      alt={disc.name}
                      fill
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center">
                    <span className="text-xs text-gray-400">No image</span>
                  </div>
                )}
              </TableCell>
              <TableCell className="font-medium">
                <button
                  className="hover:underline text-left font-medium"
                  onClick={() => router.push(`/discs/${disc.id}`)}
                >
                  {disc.name}
                </button>
              </TableCell>
              <TableCell>{formatBrandName(disc.brand)}</TableCell>
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
                <div className="flex justify-end gap-2">
                  {/* Icon-only buttons for edit and delete */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.push(`/edit-disc/${disc.id}`)}
                    className="h-8 w-8"
                  >
                    <PencilIcon className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteClick(disc.id)}
                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2Icon className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )

  return (
    <ProtectedRoute>
      <AppLayout>
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
          ) : (
            <>
              <DiscFilters discs={discs} onFilterChange={handleFilterChange} currentFilters={filters} />

              {filteredDiscs.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No discs match your filters</p>
                  <Button variant="link" onClick={() => setFilters({ name: null, brand: null })}>
                    Clear filters
                  </Button>
                </div>
              ) : viewMode === "grid" ? (
                renderGridView()
              ) : (
                renderListView()
              )}
            </>
          )}
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
