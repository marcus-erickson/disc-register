"use client"

import { useEffect, useState } from "react"
import { AppLayout } from "@/components/app-layout"
import ProtectedRoute from "@/components/protected-route"
import { useAuth } from "@/app/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { isUserAdmin, getPrompts, updatePrompt } from "@/app/actions/admin-actions"
import { useRouter } from "next/navigation"

interface Prompt {
  id: string
  name: string
  content: string
  description: string
  created_at: string
  updated_at: string
}

export default function AdminPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [activeTab, setActiveTab] = useState("prompts")
  const [isSaving, setIsSaving] = useState(false)
  const [editedPrompts, setEditedPrompts] = useState<Record<string, { content: string; description: string }>>({})

  useEffect(() => {
    const checkAdminAndLoadData = async () => {
      if (!user) return

      setIsLoading(true)
      try {
        // Check if user is admin
        const adminStatus = await isUserAdmin(user.id)
        setIsAdmin(adminStatus)

        if (!adminStatus) {
          // Redirect non-admin users
          router.push("/")
          return
        }

        // Load prompts
        const promptsData = await getPrompts()
        setPrompts(promptsData)

        // Initialize edited prompts
        const initialEdited: Record<string, { content: string; description: string }> = {}
        promptsData.forEach((prompt) => {
          initialEdited[prompt.id] = {
            content: prompt.content,
            description: prompt.description || "",
          }
        })
        setEditedPrompts(initialEdited)
      } catch (error) {
        console.error("Error loading admin data:", error)
        toast({
          title: "Error",
          description: "Failed to load admin data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    checkAdminAndLoadData()
  }, [user, router])

  const handleContentChange = (id: string, content: string) => {
    setEditedPrompts((prev) => ({
      ...prev,
      [id]: { ...prev[id], content },
    }))
  }

  const handleDescriptionChange = (id: string, description: string) => {
    setEditedPrompts((prev) => ({
      ...prev,
      [id]: { ...prev[id], description },
    }))
  }

  const handleSavePrompt = async (id: string) => {
    if (!editedPrompts[id]) return

    setIsSaving(true)
    try {
      const result = await updatePrompt(id, editedPrompts[id].content, editedPrompts[id].description)

      if (result.success) {
        toast({
          title: "Success",
          description: "Prompt updated successfully",
        })

        // Update the prompts list
        setPrompts((prev) =>
          prev.map((p) =>
            p.id === id
              ? {
                  ...p,
                  content: editedPrompts[id].content,
                  description: editedPrompts[id].description,
                  updated_at: new Date().toISOString(),
                }
              : p,
          ),
        )
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update prompt",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error saving prompt:", error)
      toast({
        title: "Error",
        description: "Failed to save prompt. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="container mx-auto px-4 py-8">
            <p>Loading admin settings...</p>
          </div>
        </AppLayout>
      </ProtectedRoute>
    )
  }

  if (!isAdmin) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="container mx-auto px-4 py-8">
            <p>You do not have permission to access this page.</p>
          </div>
        </AppLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">Admin Settings</h1>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="prompts">Prompts</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
            </TabsList>

            <TabsContent value="prompts">
              <Card>
                <CardHeader>
                  <CardTitle>AI Prompts</CardTitle>
                  <CardDescription>Edit the prompts used for voice input processing</CardDescription>
                </CardHeader>
                <CardContent>
                  {prompts.length === 0 ? (
                    <p>No prompts found</p>
                  ) : (
                    <div className="space-y-8">
                      {prompts.map((prompt) => (
                        <div key={prompt.id} className="space-y-4">
                          <div>
                            <h3 className="text-lg font-semibold">{prompt.name}</h3>
                            <p className="text-sm text-gray-500">
                              Last updated: {new Date(prompt.updated_at).toLocaleString()}
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`description-${prompt.id}`}>Description</Label>
                            <Input
                              id={`description-${prompt.id}`}
                              value={editedPrompts[prompt.id]?.description || ""}
                              onChange={(e) => handleDescriptionChange(prompt.id, e.target.value)}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`content-${prompt.id}`}>Prompt Content</Label>
                            <Textarea
                              id={`content-${prompt.id}`}
                              value={editedPrompts[prompt.id]?.content || ""}
                              onChange={(e) => handleContentChange(prompt.id, e.target.value)}
                              className="min-h-[200px] font-mono text-sm"
                            />
                          </div>

                          <Button onClick={() => handleSavePrompt(prompt.id)} disabled={isSaving}>
                            {isSaving ? "Saving..." : "Save Changes"}
                          </Button>

                          <hr className="my-6" />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>Manage user permissions</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>User management functionality coming soon.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        <Toaster />
      </AppLayout>
    </ProtectedRoute>
  )
}
