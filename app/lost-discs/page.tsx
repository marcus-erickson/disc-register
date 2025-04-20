"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { AppLayout } from "@/components/app-layout"
import { Card } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/app/context/AuthContext"
import ProtectedRoute from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { CalendarIcon, ExternalLinkIcon } from "lucide-react"
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
  user_email?: string
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
      console.log("Fetching lost discs...")

      // Fetch lost discs without the relationship query
      const { data: discsData, error: discsError } = await supabase
        .from("lost_discs")
        .select("*")
        .order("created_at", { ascending: false })

      if (discsError) {
        throw discsError
      }

      console.log(`Fetched ${discsData?.length || 0} lost discs`)

      // Fetch user emails separately
      const userIds = [...new Set((discsData || []).map((disc: any) => disc.user_id))]
      const userEmails: Record<string, string> = {}

      // Only fetch user emails if there are discs
      if (userIds.length > 0) {
        const { data: userData, error: userError } = await supabase.from("users").select("id, email").in("id", userIds)

        if (!userError && userData) {
          userData.forEach((user: any) => {
            userEmails[user.id] = user.email
          })
        }
      }

      // Add user emails to disc data
      const processedDiscs = (discsData || []).map((disc: any) => ({
        ...disc,
        user_email: userEmails[disc.user_id] || "Unknown",
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
            images: imagesData ? imagesData.map((img) => img.storage_path) : [],
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
        (disc.written_info && disc.written_info.toLowerCase().includes(query)),
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
        <Card
          key={disc.id}
          className="overflow-hidden relative cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => router.push(`/lost-discs/${disc.id}`)}
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

            {/* Main disc info - simplified */}
            <h3 className="text-lg font-bold truncate">{`${disc.brand} ${disc.name}`}</h3>
            <div className="text-sm text-gray-600 mb-2">{disc.color}</div>

            {/* Written info (if available) */}
            {disc.written_info && <div className="text-sm text-gray-600 mb-2 italic">"{disc.written_info}"</div>}

            {/* Date found */}
            <div className="flex items-center text-sm text-gray-600 mb-3">
              <CalendarIcon className="h-4 w-4 mr-1 flex-shrink-0" />
              <span>Found: {formatDate(disc.date_found)}</span>
            </div>

            {/* View details button */}
            <Button
              variant="outline"
              className="w-full flex items-center justify-center gap-1"
              onClick={(e) => {
                e.stopPropagation()
                router.push(`/lost-discs/${disc.id}`)
              }}
            >
              <ExternalLinkIcon className="h-4 w-4" />
              View Details
            </Button>
          </div>
        </Card>
      ))}
    </div>
  )

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
              <ExternalLinkIcon className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              type="search"
              placeholder="Search by brand, name, or written info..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-10 w-full"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
              >
                <span className="sr-only">Clear search</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <p>Loading lost discs...</p>
            </div>
          ) : discs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No lost discs have been reported</p>
              <Link href="/report-lost-disc" passHref>
                <Button className="text-blue-600 hover:underline">Report a lost disc</Button>
              </Link>
            </div>
          ) : (
            renderGridView()
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

        <Toaster />
      </AppLayout>
    </ProtectedRoute>
  )
}
