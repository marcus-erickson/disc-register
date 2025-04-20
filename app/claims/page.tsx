"use client"

import { useEffect, useState } from "react"
import { AppLayout } from "@/components/app-layout"
import ProtectedRoute from "@/components/protected-route"
import { useAuth } from "@/app/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase } from "@/lib/supabase"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { formatBrandName } from "@/lib/format-utils"
import { getUserDisplayName } from "@/lib/user-utils"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { ConfirmationDialog } from "@/components/confirmation-dialog"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { CheckCircle, Trash2, XCircle, MoreVertical, CheckSquare } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface Claim {
  id: string
  lost_disc_id: string
  claimer_id: string
  finder_id: string
  status: string
  message: string
  created_at: string
  updated_at: string
  claimer_name?: string
  finder_name?: string
  disc_details?: {
    brand: string
    name: string
    color: string
    written_info: string
  }
}

interface ClaimerContact {
  name: string
  email: string
  phone_number: string
  location: string
}

interface FinderContact {
  name: string
  email: string
  phone_number: string
  location: string
}

export default function ClaimsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [myClaims, setMyClaims] = useState<Claim[]>([])
  const [claimsOnMyDiscs, setClaimsOnMyDiscs] = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("my-claims")
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null)
  const [actionDialogOpen, setActionDialogOpen] = useState(false)
  const [actionType, setActionType] = useState<"approve" | "reject" | "delete" | "complete" | null>(null)
  const [claimerContact, setClaimerContact] = useState<ClaimerContact | null>(null)
  const [finderContact, setFinderContact] = useState<FinderContact | null>(null)
  const [contactSheetOpen, setContactSheetOpen] = useState(false)
  const [contactType, setContactType] = useState<"claimer" | "finder">("claimer")

  useEffect(() => {
    if (!user) return

    const fetchClaims = async () => {
      try {
        setLoading(true)

        // Fetch claims made by the current user
        const { data: myClaimsData, error: myClaimsError } = await supabase
          .from("disc_claims")
          .select(`
            *,
            disc_details:lost_discs(brand, name, color, written_info)
          `)
          .eq("claimer_id", user.id)
          .order("created_at", { ascending: false })

        if (myClaimsError) throw myClaimsError

        // Fetch claims on discs found by the current user
        const { data: claimsOnMyDiscsData, error: claimsOnMyDiscsError } = await supabase
          .from("disc_claims")
          .select(`
            *,
            disc_details:lost_discs(brand, name, color, written_info)
          `)
          .eq("finder_id", user.id)
          .order("created_at", { ascending: false })

        if (claimsOnMyDiscsError) throw claimsOnMyDiscsError

        // Enhance claims with user names
        const enhancedMyClaims = await Promise.all(
          (myClaimsData || []).map(async (claim) => {
            const finderName = await getUserDisplayName(claim.finder_id)
            return { ...claim, finder_name: finderName }
          }),
        )

        const enhancedClaimsOnMyDiscs = await Promise.all(
          (claimsOnMyDiscsData || []).map(async (claim) => {
            const claimerName = await getUserDisplayName(claim.claimer_id)
            return { ...claim, claimer_name: claimerName }
          }),
        )

        setMyClaims(enhancedMyClaims)
        setClaimsOnMyDiscs(enhancedClaimsOnMyDiscs)
      } catch (error) {
        console.error("Error fetching claims:", error)
        toast({
          title: "Error",
          description: "Failed to load claims. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchClaims()
  }, [user])

  const handleViewDisc = (discId: string) => {
    router.push(`/lost-discs/${discId}`)
  }

  const handleAction = (claim: Claim, action: "approve" | "reject" | "delete" | "complete") => {
    setSelectedClaim(claim)
    setActionType(action)
    setActionDialogOpen(true)
  }

  const handleActionConfirm = async () => {
    if (!selectedClaim || !actionType) return

    try {
      if (actionType === "delete") {
        // Delete the claim
        const { error } = await supabase.from("disc_claims").delete().eq("id", selectedClaim.id)

        if (error) throw error

        // Update local state
        if (selectedClaim.claimer_id === user?.id) {
          setMyClaims((prev) => prev.filter((claim) => claim.id !== selectedClaim.id))
        } else {
          setClaimsOnMyDiscs((prev) => prev.filter((claim) => claim.id !== selectedClaim.id))
        }

        toast({
          title: "Claim Deleted",
          description: "The claim has been removed.",
        })
      } else if (actionType === "complete") {
        // Mark the claim as completed
        const { error } = await supabase
          .from("disc_claims")
          .update({
            status: "completed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", selectedClaim.id)

        if (error) throw error

        // Update local state
        if (selectedClaim.claimer_id === user?.id) {
          setMyClaims((prev) =>
            prev.map((claim) => (claim.id === selectedClaim.id ? { ...claim, status: "completed" } : claim)),
          )
        } else {
          setClaimsOnMyDiscs((prev) =>
            prev.map((claim) => (claim.id === selectedClaim.id ? { ...claim, status: "completed" } : claim)),
          )
        }

        toast({
          title: "Claim Completed",
          description: "The disc has been successfully returned to its owner.",
        })
      } else {
        // Update claim status (approve or reject)
        const { error } = await supabase
          .from("disc_claims")
          .update({
            status: actionType === "approve" ? "approved" : "rejected",
            updated_at: new Date().toISOString(),
          })
          .eq("id", selectedClaim.id)

        if (error) throw error

        // Update local state
        setClaimsOnMyDiscs((prev) =>
          prev.map((claim) =>
            claim.id === selectedClaim.id
              ? { ...claim, status: actionType === "approve" ? "approved" : "rejected" }
              : claim,
          ),
        )

        toast({
          title: actionType === "approve" ? "Claim Approved" : "Claim Rejected",
          description:
            actionType === "approve"
              ? "The claimer can now see your contact information."
              : "The claim has been rejected.",
        })
      }
    } catch (error) {
      console.error("Error updating claim:", error)
      toast({
        title: "Error",
        description: "Failed to update claim. Please try again.",
        variant: "destructive",
      })
    } finally {
      setActionDialogOpen(false)
      setSelectedClaim(null)
      setActionType(null)
    }
  }

  const handleViewContact = async (claim: Claim, type: "claimer" | "finder") => {
    try {
      setContactType(type)

      if (type === "claimer") {
        const { data, error } = await supabase
          .from("profiles")
          .select("name, email, phone_number, location")
          .eq("id", claim.claimer_id)
          .single()

        if (error) throw error

        setClaimerContact({
          name: data.name || "Not provided",
          email: data.email || "Not provided",
          phone_number: data.phone_number || "Not provided",
          location: data.location || "Not provided",
        })
      } else {
        const { data, error } = await supabase
          .from("profiles")
          .select("name, email, phone_number, location")
          .eq("id", claim.finder_id)
          .single()

        if (error) throw error

        setFinderContact({
          name: data.name || "Not provided",
          email: data.email || "Not provided",
          phone_number: data.phone_number || "Not provided",
          location: data.location || "Not provided",
        })
      }

      setContactSheetOpen(true)
    } catch (error) {
      console.error(`Error fetching ${type} contact:`, error)
      toast({
        title: "Error",
        description: `Could not retrieve ${type} contact information.`,
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy")
    } catch (error) {
      return "Unknown date"
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-300">
            Pending
          </Badge>
        )
      case "approved":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-800 border-green-300">
            Approved
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-800 border-red-300">
            Rejected
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-300">
            Completed
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Custom descriptions for the confirmation dialogs
  const getActionDialogDescription = () => {
    if (actionType === "approve") {
      return (
        <div>
          Approving this claim will allow the claimer to see your contact information. Are you sure this is the rightful
          owner?
        </div>
      )
    } else if (actionType === "reject") {
      return <div>Are you sure you want to reject this claim? The claimer will be notified.</div>
    } else if (actionType === "delete") {
      return <div>Are you sure you want to delete this claim? This action cannot be undone.</div>
    } else if (actionType === "complete") {
      return (
        <div>
          Mark this claim as completed? This indicates that the disc has been successfully returned to its owner.
        </div>
      )
    }
    return null
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">Disc Claims</h1>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="my-claims">My Claims</TabsTrigger>
              <TabsTrigger value="claims-on-my-discs">Claims on My Found Discs</TabsTrigger>
            </TabsList>

            <TabsContent value="my-claims">
              <Card>
                <CardHeader>
                  <CardTitle>My Claims</CardTitle>
                  <CardDescription>Claims you've made on discs that others have found</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <p>Loading your claims...</p>
                  ) : myClaims.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500 mb-4">You haven't made any claims yet</p>
                      <Button onClick={() => router.push("/lost-discs")}>Browse Lost Discs</Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {myClaims.map((claim) => (
                        <Card key={claim.id} className="overflow-hidden">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="text-lg font-semibold">
                                  {claim.disc_details
                                    ? `${formatBrandName(claim.disc_details.brand)} ${claim.disc_details.name}`
                                    : "Unknown Disc"}
                                </h3>
                                <p className="text-sm text-gray-600">Found by: {claim.finder_name || "Unknown"}</p>
                                <p className="text-sm text-gray-600">Claimed on: {formatDate(claim.created_at)}</p>
                                {claim.message && (
                                  <div className="mt-2 p-2 bg-gray-50 rounded-md">
                                    <p className="text-sm italic">{claim.message}</p>
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col items-end">
                                {getStatusBadge(claim.status)}
                                <div className="flex gap-2 mt-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleViewDisc(claim.lost_disc_id)}
                                  >
                                    View Disc
                                  </Button>

                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="outline" size="sm">
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      {claim.status === "approved" && (
                                        <>
                                          <DropdownMenuItem onClick={() => handleViewContact(claim, "finder")}>
                                            View Finder Contact
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                            className="text-blue-600"
                                            onClick={() => handleAction(claim, "complete")}
                                          >
                                            <CheckSquare className="h-4 w-4 mr-2" />
                                            Mark as Completed
                                          </DropdownMenuItem>
                                        </>
                                      )}
                                      <DropdownMenuItem
                                        className="text-red-600"
                                        onClick={() => handleAction(claim, "delete")}
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete Claim
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="claims-on-my-discs">
              <Card>
                <CardHeader>
                  <CardTitle>Claims on My Found Discs</CardTitle>
                  <CardDescription>Claims others have made on discs that you've found</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <p>Loading claims...</p>
                  ) : claimsOnMyDiscs.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No one has claimed any of your found discs yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {claimsOnMyDiscs.map((claim) => (
                        <Card key={claim.id} className="overflow-hidden">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="text-lg font-semibold">
                                  {claim.disc_details
                                    ? `${formatBrandName(claim.disc_details.brand)} ${claim.disc_details.name}`
                                    : "Unknown Disc"}
                                </h3>
                                <p className="text-sm text-gray-600">Claimed by: {claim.claimer_name || "Unknown"}</p>
                                <p className="text-sm text-gray-600">Claimed on: {formatDate(claim.created_at)}</p>
                                {claim.message && (
                                  <div className="mt-2 p-2 bg-gray-50 rounded-md">
                                    <p className="text-sm italic">{claim.message}</p>
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col items-end">
                                {getStatusBadge(claim.status)}
                                <div className="flex gap-2 mt-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleViewDisc(claim.lost_disc_id)}
                                  >
                                    View Disc
                                  </Button>

                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="outline" size="sm">
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      {claim.status === "pending" && (
                                        <>
                                          <DropdownMenuItem
                                            className="text-green-600"
                                            onClick={() => handleAction(claim, "approve")}
                                          >
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            Approve
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                            className="text-red-600"
                                            onClick={() => handleAction(claim, "reject")}
                                          >
                                            <XCircle className="h-4 w-4 mr-2" />
                                            Reject
                                          </DropdownMenuItem>
                                        </>
                                      )}

                                      {claim.status === "approved" && (
                                        <>
                                          <DropdownMenuItem onClick={() => handleViewContact(claim, "claimer")}>
                                            View Claimer Contact
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                            className="text-blue-600"
                                            onClick={() => handleAction(claim, "complete")}
                                          >
                                            <CheckSquare className="h-4 w-4 mr-2" />
                                            Mark as Completed
                                          </DropdownMenuItem>
                                        </>
                                      )}

                                      <DropdownMenuItem
                                        className="text-red-600"
                                        onClick={() => handleAction(claim, "delete")}
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete Claim
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Action Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={actionDialogOpen}
          onClose={() => setActionDialogOpen(false)}
          onConfirm={handleActionConfirm}
          title={
            actionType === "approve"
              ? "Approve Claim"
              : actionType === "reject"
                ? "Reject Claim"
                : actionType === "complete"
                  ? "Complete Claim"
                  : "Delete Claim"
          }
          description={getActionDialogDescription()}
          confirmText={
            actionType === "approve"
              ? "Approve"
              : actionType === "reject"
                ? "Reject"
                : actionType === "complete"
                  ? "Complete"
                  : "Delete"
          }
          cancelText="Cancel"
        />

        {/* Contact Information Sheet */}
        <Sheet open={contactSheetOpen} onOpenChange={setContactSheetOpen}>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>
                {contactType === "claimer" ? "Claimer Contact Information" : "Finder Contact Information"}
              </SheetTitle>
              <SheetDescription>
                {contactType === "claimer"
                  ? "Use this information to contact the person who claimed the disc."
                  : "Use this information to contact the person who found your disc."}
              </SheetDescription>
            </SheetHeader>
            {contactType === "claimer" && claimerContact ? (
              <div className="mt-6 space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Name</h3>
                  <p className="mt-1">{claimerContact.name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Email</h3>
                  <p className="mt-1">{claimerContact.email}</p>
                </div>
                {claimerContact.phone_number && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Phone</h3>
                    <p className="mt-1">{claimerContact.phone_number}</p>
                  </div>
                )}
                {claimerContact.location && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Location</h3>
                    <p className="mt-1">{claimerContact.location}</p>
                  </div>
                )}
                <div className="pt-4">
                  <p className="text-sm text-gray-500">Please arrange a safe and convenient way to return the disc.</p>
                </div>
              </div>
            ) : contactType === "finder" && finderContact ? (
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
            ) : (
              <div className="mt-6">
                <p>No contact information available.</p>
              </div>
            )}
          </SheetContent>
        </Sheet>

        <Toaster />
      </AppLayout>
    </ProtectedRoute>
  )
}
