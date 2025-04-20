"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter, notFound } from "next/navigation"
import { AppLayout } from "@/components/app-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/app/context/AuthContext"
import ProtectedRoute from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { CalendarIcon, MapPinIcon } from "lucide-react"
import { Toaster } from "@/components/ui/toaster"
import { format } from "date-fns"
import { Separator } from "@/components/ui/separator"
import { formatBrandName } from "@/lib/format-utils"
import { getUserDisplayName } from "@/lib/user-utils"
import ImageGallery from "@/components/image-gallery"
import { toast } from "@/components/ui/use-toast"
import { ConfirmationDialog } from "@/components/confirmation-dialog"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
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

interface FinderContact {
  name: string
  email: string
  phone_number: string
  location: string
}

// Helper function to validate UUID
function isValidUUID(id: string) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

export default function LostDiscDetails() {
  const params = useParams()
  const discId = params.id as string
  const router = useRouter()
  const { user } = useAuth()
  const [disc, setDisc] = useState<LostDisc | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [claimDialogOpen, setClaimDialogOpen] = useState(false)
  const [claimMessage, setClaimMessage] = useState("")
  const [claimSubmitting, setClaimSubmitting] = useState(false)
  const [finderContact, setFinderContact] = useState<FinderContact | null>(null)
  const [contactSheetOpen, setContactSheetOpen] = useState(false)
  const [hasClaimed, setHasClaimed] = useState(false)

  // Helper function to format location
  const formatLocation = (disc: LostDisc) => {
    const parts = []
    if (disc.location) parts.push(disc.location)
    if (disc.city) parts.push(disc.city)
    if (disc.state) parts.push(disc.state)
    if (disc.country) parts.push(disc.country)

    return parts.join(", ") || "Location not specified"
  }

  useEffect(() => {
    // Special case for "add" - redirect to the add page
    if (discId === "add") {
      router.replace("/lost-discs/add")
      return
    }

    // If not a valid UUID, show the not-found page
    if (!isValidUUID(discId)) {
      notFound()
      return
    }

    const fetchDiscDetails = async () => {
      try {
        setLoading(true)
        console.log("Fetching disc details for ID:", discId)

        // Fetch disc data
        const { data: discData, error: discError } = await supabase
          .from("lost_discs")
          .select("*")
          .eq("id", discId)
          .single()

        if (discError) {
          throw discError
        }

        if (!discData) {
          setError("Disc not found")
          return
        }

        // Get finder's display name
        const finderName = await getUserDisplayName(discData.user_id)

        // Fetch disc images
        const { data: imagesData, error: imagesError } = await supabase
          .from("lost_disc_images")
          .select("storage_path")
          .eq("lost_disc_id", discId)

        if (imagesError) {
          console.error("Error fetching images:", imagesError)
        }

        setDisc({
          ...discData,
          finder_name: finderName,
          images: imagesData ? imagesData.map((img) => img.storage_path) : [],
        })

        // Check if user has already claimed this disc
        if (user) {
          const { data: claimData } = await supabase
            .from("disc_claims")
            .select("*")
            .eq("lost_disc_id", discId)
            .eq("claimer_id", user.id)
            .single()

          if (claimData) {
            setHasClaimed(true)

            // If claim is approved, fetch finder contact info
            if (claimData.status === "approved") {
              await fetchFinderContact(discData.user_id)
            }
          }
        }
      } catch (error) {
        console.error("Error fetching lost disc details:", error)
        setError("Failed to load disc details. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchDiscDetails()
  }, [discId, router, user])

  const fetchFinderContact = async (finderId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("name, email, phone_number, location")
        .eq("id", finderId)
        .single()

      if (error) {
        throw error
      }

      setFinderContact({
        name: data.name || "Not provided",
        email: data.email || "Not provided",
        phone_number: data.phone_number || "Not provided",
        location: data.location || "Not provided",
      })
    } catch (error) {
      console.error("Error fetching finder contact:", error)
      toast({
        title: "Error",
        description: "Could not retrieve finder contact information.",
        variant: "destructive",
      })
    }
  }

  const handleClaimClick = () => {
    setClaimDialogOpen(true)
  }

  const handleClaimCancel = () => {
    setClaimDialogOpen(false)
    setClaimMessage("")
  }

  const handleClaimConfirm = async () => {
    if (!disc || !user) return

    try {
      setClaimSubmitting(true)

      // Insert claim record
      const { error } = await supabase.from("disc_claims").insert({
        lost_disc_id: disc.id,
        claimer_id: user.id,
        finder_id: disc.user_id,
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
        setHasClaimed(true)
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
      setClaimMessage("")
    }
  }

  const handleViewContact = async () => {
    if (!disc) return

    // If we don't have the contact info yet, fetch it
    if (!finderContact) {
      await fetchFinderContact(disc.user_id)
    }

    setContactSheetOpen(true)
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy")
    } catch (error) {
      return "Unknown date"
    }
  }

  // Custom claim dialog description with message input
  const getClaimDialogDescription = () => {
    return (
      <div>
        <div className="mb-4">Is this your disc? Submit a claim to contact the person who found it.</div>
        <div className="mb-4">
          <Label htmlFor="claimMessage" className="block mb-2">
            Message to the finder (optional):
          </Label>
          <textarea
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

  if (loading) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="container mx-auto px-4 py-8">
            <p>Loading disc details...</p>
          </div>
        </AppLayout>
      </ProtectedRoute>
    )
  }

  if (error || !disc) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="container mx-auto px-4 py-8">
            <p className="text-red-500">{error || "Disc not found"}</p>
            <Button onClick={() => router.push("/lost-discs")} className="mt-4">
              Back to Lost and Found
            </Button>
          </div>
        </AppLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Lost Disc Details</h1>
            <Button onClick={() => router.push("/lost-discs")} variant="outline">
              Back
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Disc Images</CardTitle>
                </CardHeader>
                <CardContent>
                  {disc.images && disc.images.length > 0 ? (
                    <ImageGallery imagePaths={disc.images} />
                  ) : (
                    <div className="w-full h-64 border border-gray-200 rounded-md flex items-center justify-center bg-gray-50">
                      <p className="text-gray-500">No images available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>{`${formatBrandName(disc.brand)} ${disc.name}`}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Disc Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Brand</p>
                        <p className="font-medium">{formatBrandName(disc.brand)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Mold</p>
                        <p className="font-medium">{disc.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Color</p>
                        <p className="font-medium">{disc.color}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Date Found</p>
                        <p className="font-medium flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-1" />
                          {formatDate(disc.date_found)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {disc.written_info && (
                    <>
                      <div>
                        <h3 className="text-lg font-medium mb-2">Identifying Information</h3>
                        <p className="font-medium">Written on disc: {disc.written_info}</p>
                      </div>
                      <Separator />
                    </>
                  )}

                  <div>
                    <h3 className="text-lg font-medium mb-2">Location</h3>
                    <p className="flex items-start">
                      <MapPinIcon className="h-4 w-4 mr-1 mt-1 flex-shrink-0" />
                      <span>{formatLocation(disc)}</span>
                    </p>
                  </div>

                  {disc.description && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="text-lg font-medium mb-2">Description</h3>
                        <p className="whitespace-pre-line">{disc.description}</p>
                      </div>
                    </>
                  )}

                  <Separator />

                  <div>
                    <h3 className="text-lg font-medium mb-2">Found By</h3>
                    <p className="text-sm">
                      <span className="font-medium">{disc.finder_name}</span>
                    </p>
                    <p className="text-sm text-gray-500 mt-1">Reported on {formatDate(disc.created_at)}</p>

                    {hasClaimed && finderContact ? (
                      <Button onClick={handleViewContact} className="mt-4 w-full bg-green-600 hover:bg-green-700">
                        View Finder Contact Information
                      </Button>
                    ) : hasClaimed ? (
                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                        <p className="text-sm text-yellow-800">Your claim has been submitted and is pending review.</p>
                      </div>
                    ) : (
                      <Button onClick={handleClaimClick} className="mt-4 w-full bg-green-600 hover:bg-green-700">
                        Claim This Disc
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

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

        {/* Contact Information Sheet */}
        <Sheet open={contactSheetOpen} onOpenChange={setContactSheetOpen}>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Finder Contact Information</SheetTitle>
              <SheetDescription>Use this information to contact the person who found your disc.</SheetDescription>
            </SheetHeader>
            {finderContact && (
              <div className="mt-6 space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Name</h3>
                  <p className="mt-1">{finderContact.name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Email</h3>
                  <p className="mt-1">{finderContact.email}</p>
                </div>
                {finderContact.phone_number && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Phone</h3>
                    <p className="mt-1">{finderContact.phone_number}</p>
                  </div>
                )}
                {finderContact.location && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Location</h3>
                    <p className="mt-1">{finderContact.location}</p>
                  </div>
                )}
                <div className="pt-4">
                  <p className="text-sm text-gray-500">
                    Please be respectful when contacting the finder. Remember to thank them for their help!
                  </p>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>

        <Toaster />
      </AppLayout>
    </ProtectedRoute>
  )
}
