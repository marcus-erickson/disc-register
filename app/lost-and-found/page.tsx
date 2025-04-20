"use client"

import { useEffect, useState, useCallback } from "react"
import { AppLayout } from "@/components/app-layout"
import { Card } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/app/context/AuthContext"
import ProtectedRoute from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { PencilIcon, Trash2Icon, MoreVertical, MapPinIcon, CalendarIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import ViewToggle from "@/components/view-toggle"
import Image from "next/image"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getImageUrl } from "@/lib/storage-utils"
import { ConfirmationDialog } from "@/components/confirmation-dialog"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { format } from "date-fns"
import LostDiscFilters from "./lost-disc-filters"

interface LostDisc {
  id: string
  user_id: string
  brand: string
  name: string
  color: string
  location: string
  city: string
  state: string
  country: string
  description: string
  date_found: string
  created_at: string
  updated_at: string
  user_email?: string
  images?: string[]
}

export default function LostAndFound() {
  // ... existing state variables ...
  const [discs, setDiscs] = useState<LostDisc[]>([])
  const [filteredDiscs, setFilteredDiscs] = useState<LostDisc[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({})
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [discToDelete, setDiscToDelete] = useState<string | null>(null)
  const [claimDialogOpen, setClaimDialogOpen] = useState(false)
  const [discToClaim, setDiscToClaim] = useState<LostDisc | null>(null)
  const [filters, setFilters] = useState<{ name: string | null; brand: string | null }>({
    name: null,
    brand: null,
  })
  const { user } = useAuth()
  const router = useRouter()

  // ... existing useEffect and functions ...

  // Helper function to format location
  const formatLocation = (disc: LostDisc) => {
    const parts = []
    if (disc.location) parts.push(disc.location)
    if (disc.city) parts.push(disc.city)
    if (disc.state) parts.push(disc.state)
    if (disc.country) parts.push(disc.country)

    return parts.join(", ") || "Location not specified"
  }

  // Load view preference from localStorage on component mount
  useEffect(() => {
    const savedView = localStorage.getItem("lostDiscViewMode") as "grid" | "list"
    if (savedView) {
      setViewMode(savedView)
    }
  }, [])

  // Save view preference to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("lostDiscViewMode", viewMode)
  }, [viewMode])

  const fetchDiscs = async () => {
    try {
      setLoading(true)
      // Fetch lost discs
      const { data: discsData, error: discsError } = await supabase
        .from("lost_discs")
        .select("*, user:user_id(email)")
        .order("created_at", { ascending: false })

      if (discsError) {
        throw discsError
      }

      // Process the data to extract user email
      const processedDiscs = discsData.map((disc: any) => ({
        ...disc,
        user_email: disc.user?.email || "Unknown",
        user: undefined, // Remove the nested user object
      }))

      // Fetch images for each disc
      const discsWithImages = await Promise.all(
        processedDiscs.map(async (disc) => {
          const { data: imagesData, error: imagesError } = await supabase
            .from("lost_disc_images")
            .select("storage_path")
            .eq("lost_disc_id", disc.id)

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
      console.error("Error fetching lost discs:", error)
      toast({
        title: "Error",
        description: "Failed to load lost discs. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDiscs()
  }, [])

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
      // First, delete any associated images from the lost_disc_images table
      const { error: imagesError } = await supabase.from("lost_disc_images").delete().eq("lost_disc_id", discToDelete)

      if (imagesError) {
        console.error("Error deleting lost disc images:", imagesError)
      }

      // Then delete the disc itself
      const { error: discError } = await supabase.from("lost_discs").delete().eq("id", discToDelete)

      if (discError) {
        throw discError
      }

      // Update the UI by removing the deleted disc
      setDiscs((prevDiscs) => prevDiscs.filter((disc) => disc.id !== discToDelete))

      toast({
        title: "Success",
        description: "Lost disc deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting lost disc:", error)
      toast({
        title: "Error",
        description: "Failed to delete lost disc. Please try again.",
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

  const handleClaimClick = (disc: LostDisc) => {
    setDiscToClaim(disc)
    setClaimDialogOpen(true)
  }

  const handleClaimConfirm = async () => {
    if (!discToClaim || !user) return

    try {
      // Send email to the disc owner
      const { error } = await supabase.functions.invoke("send-claim-email", {
        body: {
          discId: discToClaim.id,
          discName: `${discToClaim.brand} ${discToClaim.name}`,
          ownerEmail: discToClaim.user_email,
          claimerEmail: user.email,
        },
      })

      if (error) {
        throw error
      }

      toast({
        title: "Claim Submitted",
        description: "The owner has been notified of your claim.",
      })
    } catch (error) {
      console.error("Error claiming disc:", error)
      toast({
        title: "Error",
        description: "Failed to submit claim. Please try again.",
        variant: "destructive",
      })
    } finally {
      setClaimDialogOpen(false)
      setDiscToClaim(null)
    }
  }

  const handleClaimCancel = () => {
    setClaimDialogOpen(false)
    setDiscToClaim(null)
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy")
    } catch (error) {
      return "Unknown date"
    }
  }

  const canEditDisc = (disc: LostDisc) => {
    return user && disc.user_id === user.id
  }

  const renderGridView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {filteredDiscs.map((disc) => (
        <Card key={disc.id} className="overflow-hidden relative">
          {/* Ellipsis menu in the top right corner - only for the owner */}
          {canEditDisc(disc) && (
            <div className="absolute top-2 right-2 z-10">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-white bg-opacity-80">
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => router.push(`/lost-and-found/edit/${disc.id}`)}>
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
          )}

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

            {/* Main disc info */}
            <h3 className="text-lg font-bold truncate">{`${disc.brand} ${disc.name}`}</h3>
            <div className="text-sm text-gray-600 mb-2">{disc.color}</div>

            {/* Location and date */}
            <div className="flex items-center text-sm text-gray-600 mb-1">
              <MapPinIcon className="h-4 w-4 mr-1 flex-shrink-0" />
              <span className="truncate">{formatLocation(disc)}</span>
            </div>
            <div className="flex items-center text-sm text-gray-600 mb-3">
              <CalendarIcon className="h-4 w-4 mr-1 flex-shrink-0" />
              <span>Found: {formatDate(disc.date_found)}</span>
            </div>

            {/* Claim button */}
            <Button
              variant="default"
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={() => handleClaimClick(disc)}
            >
              Claim This Disc
            </Button>
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
            <TableHead>Brand</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Color</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Date Found</TableHead>
            <TableHead>Added By</TableHead>
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
              <TableCell>{disc.brand}</TableCell>
              <TableCell className="font-medium">{disc.name}</TableCell>
              <TableCell>{disc.color}</TableCell>
              <TableCell>{formatLocation(disc)}</TableCell>
              <TableCell>{formatDate(disc.date_found)}</TableCell>
              <TableCell>{disc.user_email}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleClaimClick(disc)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Claim
                  </Button>

                  {canEditDisc(disc) && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/lost-and-found/edit/${disc.id}`)}
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
                    </>
                  )}
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
            <h1 className="text-3xl font-bold">Lost and Found Discs</h1>
            <div className="flex gap-2">
              <Button onClick={() => router.push("/lost-and-found/add")} className="bg-green-600 hover:bg-green-700">
                Add Lost Disc
              </Button>
              <ViewToggle currentView={viewMode} onChange={handleViewChange} />
            </div>
          </div>

          {loading ? (
            <p>Loading lost discs...</p>
          ) : discs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No lost discs have been reported</p>
              <p>
                <a href="/lost-and-found/add" className="text-blue-600 hover:underline">
                  Report a lost disc
                </a>
              </p>
            </div>
          ) : (
            <>
              <LostDiscFilters discs={discs} onFilterChange={handleFilterChange} currentFilters={filters} />

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
          title="Delete Lost Disc"
          description="Are you sure you want to delete this lost disc? This action cannot be undone."
          confirmText="Yes"
          cancelText="No"
        />

        <ConfirmationDialog
          isOpen={claimDialogOpen}
          onClose={handleClaimCancel}
          onConfirm={handleClaimConfirm}
          title="Claim Disc"
          description={`Are you sure you want to claim this disc? An email will be sent to the person who found it.`}
          confirmText="Yes, Claim It"
          cancelText="Cancel"
        />

        <Toaster />
      </AppLayout>
    </ProtectedRoute>
  )
}
