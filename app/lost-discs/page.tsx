"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { AppLayout } from "@/components/app-layout"
import { Card } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/app/context/AuthContext"
import ProtectedRoute from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { CalendarIcon, ExternalLinkIcon, Search, X, AlertTriangle, PencilIcon, Trash2Icon } from "lucide-react"
import { useRouter } from "next/navigation"
import ViewToggle from "@/components/view-toggle"
import Image from "next/image"
import { getImageUrl } from "@/lib/storage-utils"
import { ConfirmationDialog } from "@/components/confirmation-dialog"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { format } from "date-fns"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatBrandName } from "@/lib/format-utils"
import { getUserDisplayName } from "@/lib/user-utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

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
  written_info: string
  phone_number: string
  date_found: string
  created_at: string
  updated_at: string
  finder_name?: string
  images?: string[]
}

export default function LostAndFound() {
  const [discs, setDiscs] = useState<LostDisc[]>([])
  const [filteredDiscs, setFilteredDiscs] = useState<LostDisc[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({})
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [discToDelete, setDiscToDelete] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [claimDialogOpen, setClaimDialogOpen] = useState(false)
  const [discToClaim, setDiscToClaim] = useState<LostDisc | null>(null)
  const [claimMessage, setClaimMessage] = useState("")
  const [claimSubmitting, setClaimSubmitting] = useState(false)
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    console.log("Lost and Found page component rendered")
  }, [])

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
      setFetchError(null)
      console.log("Fetching lost discs...")

      // Fetch lost discs
      const { data: discsData, error: discsError } = await supabase
        .from("lost_discs")
        .select("*")
        .order("created_at", { ascending: false })

      if (discsError) {
        console.error("Error fetching lost discs:", discsError)
        setFetchError(`Failed to fetch lost discs: ${discsError.message}`)
        toast({
          title: "Error",
          description: `Failed to load lost discs: ${discsError.message}`,
          variant: "destructive",
        })
        return
      }

      console.log(`Fetched ${discsData?.length || 0} lost discs`)

      if (!discsData || discsData.length === 0) {
        console.log("No lost discs found in database")
        setDiscs([])
        setFilteredDiscs([])
        setLoading(false)
        return
      }

      // Process discs with finder names
      const processedDiscs = await Promise.all(
        (discsData || []).map(async (disc: any) => {
          try {
            const finderName = await getUserDisplayName(disc.user_id)
            return {
              ...disc,
              finder_name: finderName,
            }
          } catch (error) {
            console.error(`Error getting finder name for disc ${disc.id}:`, error)
            return {
              ...disc,
              finder_name: "Unknown",
            }
          }
        }),
      )

      // Fetch images for each disc
      const discsWithImages = await Promise.all(
        processedDiscs.map(async (disc) => {
          try {
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
              images: imagesData ? imagesData.map((img) => img.storage_path) : [],
            }
          } catch (error) {
            console.error(`Error processing images for disc ${disc.id}:`, error)
            return { ...disc, images: [] }
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
    } catch (error: any) {
      console.error("Error fetching lost discs:", error)
      setFetchError(`Failed to fetch lost discs: ${error.message || "Unknown error"}`)
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

  // Apply search when discs or search query change
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredDiscs(discs)
      return
    }

    const query = searchQuery.toLowerCase().trim()
    const filtered = discs.filter(
      (disc) =>
        disc.brand.toLowerCase().includes(query) ||
        disc.name.toLowerCase().includes(query) ||
        (disc.written_info && disc.written_info.toLowerCase().includes(query)) ||
        (disc.finder_name && disc.finder_name.toLowerCase().includes(query)),
    )
    setFilteredDiscs(filtered)
  }, [discs, searchQuery])

  const handleViewChange = (view: "grid" | "list") => {
    setViewMode(view)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const clearSearch = () => {
    setSearchQuery("")
  }

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

  const handleClaimClick = (disc: LostDisc, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent navigation to details page
    setDiscToClaim(disc)
    setClaimMessage("")
    setClaimDialogOpen(true)
  }

  const handleClaimConfirm = async () => {
    if (!discToClaim || !user) return

    try {
      setClaimSubmitting(true)

      // Insert claim record
      const { error } = await supabase.from("disc_claims").insert({
        lost_disc_id: discToClaim.id,
        claimer_id: user.id,
        finder_id: discToClaim.user_id,
        message: claimMessage,
        status: "pending",
      })

      if (error) {
        if (error.code === "23505") {
          // Unique violation
          toast({
            title: "Already Claimed",
            description: "You have already submitted a claim for this disc.",
          })
        } else {
          throw error
        }
      } else {
        toast({
          title: "Claim Submitted",
          description: "Your claim has been submitted. The finder will review your claim.",
        })
      }
    } catch (error) {
      console.error("Error claiming disc:", error)
      toast({
        title: "Error",
        description: "Failed to submit claim. Please try again.",
        variant: "destructive",
      })
    } finally {
      setClaimSubmitting(false)
      setClaimDialogOpen(false)
      setDiscToClaim(null)
      setClaimMessage("")
    }
  }

  const handleClaimCancel = () => {
    setClaimDialogOpen(false)
    setDiscToClaim(null)
    setClaimMessage("")
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

  const handleRetry = () => {
    fetchDiscs()
  }

  const renderGridView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {filteredDiscs.map((disc) => (
        <Card
          key={disc.id}
          className="overflow-hidden relative cursor-pointer hover:shadow-md transition-shadow h-full"
          onClick={() => router.push(`/lost-discs/${disc.id}`)}
        >
          <div className="p-3 flex flex-col h-full" style={{ minHeight: "360px" }}>
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

            {/* Main disc info - simplified */}
            <div className="flex-grow">
              <h3 className="text-lg font-bold truncate">{`${formatBrandName(disc.brand)} ${disc.name}`}</h3>
              <div className="text-sm text-gray-600 mb-2">{disc.color}</div>

              {/* Written info (if available) */}
              {disc.written_info && <div className="text-sm text-gray-600 mb-2 italic">"{disc.written_info}"</div>}

              {/* Date found */}
              <div className="flex items-center text-sm text-gray-600 mb-1">
                <CalendarIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                <span>Found: {formatDate(disc.date_found)}</span>
              </div>
            </div>

            {/* Footer section - always at bottom */}
            <div className="mt-auto">
              {/* Found by */}
              <div className="text-xs text-gray-600 mb-3">Found by: {disc.finder_name || "Unknown"}</div>

              {/* Two buttons: View and Claim */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 flex items-center justify-center gap-1"
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push(`/lost-discs/${disc.id}`)
                  }}
                >
                  <ExternalLinkIcon className="h-4 w-4" />
                  View
                </Button>
                <Button
                  variant="default"
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={(e) => handleClaimClick(disc, e)}
                >
                  Claim
                </Button>
              </div>
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
            <TableHead>Mold</TableHead>
            <TableHead>Brand</TableHead>
            <TableHead className="hidden sm:table-cell">Color</TableHead>
            <TableHead className="hidden md:table-cell">Date Found</TableHead>
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
                  onClick={() => router.push(`/lost-discs/${disc.id}`)}
                >
                  {disc.name}
                </button>
              </TableCell>
              <TableCell>{formatBrandName(disc.brand)}</TableCell>
              <TableCell className="hidden sm:table-cell">{disc.color}</TableCell>
              <TableCell className="hidden md:table-cell">{formatDate(disc.date_found)}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.push(`/lost-discs/${disc.id}`)}
                    className="h-8 w-8"
                    title="View Details"
                  >
                    <ExternalLinkIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleClaimClick(disc, e)
                    }}
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
                        title="Edit"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(disc.id)}
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Delete"
                      >
                        <Trash2Icon className="h-4 w-4" />
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

  // Custom claim dialog description with message input
  const getClaimDialogDescription = () => {
    return (
      <div>
        <div className="mb-4">Is this your disc? Submit a claim to contact the person who found it.</div>
        <div className="mb-4">
          <Label htmlFor="claimMessage" className="block mb-2">
            Message to the finder (optional):
          </Label>
          <Textarea
            id="claimMessage"
            className="w-full p-2 border border-gray-300 rounded-md"
            rows={3}
            placeholder="Describe why you believe this is your disc..."
            value={claimMessage}
            onChange={(e) => setClaimMessage(e.target.value)}
          />
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Lost and Found Discs</h1>
            <div className="flex gap-2">
              <Link href="/report-lost-disc" passHref>
                <Button className="bg-green-600 hover:bg-green-700">Report Lost Disc</Button>
              </Link>
              <ViewToggle currentView={viewMode} onChange={handleViewChange} />
            </div>
          </div>

          {/* Search bar */}
          <div className="relative mb-4">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              type="text"
              placeholder="Search by brand, mold or owner..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-10 w-full"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                aria-label="Clear search"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {fetchError && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {fetchError}
                <Button variant="outline" size="sm" onClick={handleRetry} className="ml-2 mt-2">
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <p>Loading lost discs...</p>
            </div>
          ) : fetchError ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">Could not load lost discs due to an error</p>
            </div>
          ) : discs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No lost discs have been reported</p>
              <Link href="/report-lost-disc" passHref>
                <Button className="text-blue-600 hover:underline">Report a lost disc</Button>
              </Link>
            </div>
          ) : viewMode === "grid" ? (
            renderGridView()
          ) : (
            renderListView()
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={deleteDialogOpen}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          title="Delete Lost Disc"
          description="Are you sure you want to delete this lost disc? This action cannot be undone."
          confirmText="Yes"
          cancelText="No"
        />

        {/* Claim Dialog */}
        <ConfirmationDialog
          isOpen={claimDialogOpen}
          onClose={handleClaimCancel}
          onConfirm={handleClaimConfirm}
          title="Claim This Disc"
          description={getClaimDialogDescription()}
          confirmText={claimSubmitting ? "Submitting..." : "Submit Claim"}
          cancelText="Cancel"
        />

        <Toaster />
      </AppLayout>
    </ProtectedRoute>
  )
}
