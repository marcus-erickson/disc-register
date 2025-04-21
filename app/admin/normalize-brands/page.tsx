"use client"

import { useState } from "react"
import { AppLayout } from "@/components/app-layout"
import ProtectedRoute from "@/components/protected-route"
import { useAuth } from "@/app/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { normalizeAllBrandNames } from "@/app/actions/fix-brand-names"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, CheckCircle2 } from "lucide-react"

export default function NormalizeBrandsPage() {
  const { user } = useAuth()
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleNormalize = async () => {
    if (!user) return

    setIsProcessing(true)
    try {
      const result = await normalizeAllBrandNames(user.id)
      setResult(result)

      if (result.success) {
        toast({
          title: "Success",
          description: `Normalized ${result.stats.updated} brand names.`,
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to normalize brand names.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error normalizing brand names:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">Normalize Brand Names</h1>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Brand Name Normalization Utility</CardTitle>
              <CardDescription>
                This utility will normalize all brand names in your disc collection to ensure consistency.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Important</AlertTitle>
                <AlertDescription>
                  This will update all discs in the database to use standardized brand names. For example, "Dynamic
                  Discs", "Dynamic discs", and "dynamics-discs" will all be normalized to "dynamic-discs". This
                  operation cannot be undone.
                </AlertDescription>
              </Alert>

              <Button onClick={handleNormalize} disabled={isProcessing} className="mb-4">
                {isProcessing ? "Processing..." : "Normalize All Brand Names"}
              </Button>

              {result && result.success && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertTitle>Operation Complete</AlertTitle>
                  <AlertDescription>
                    <div className="mt-2">
                      <p>Total discs processed: {result.stats.total}</p>
                      <p>Updated: {result.stats.updated}</p>
                      <p>Already normalized: {result.stats.unchanged}</p>
                      <p>Errors: {result.stats.errors}</p>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {result && !result.success && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{result.error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
        <Toaster />
      </AppLayout>
    </ProtectedRoute>
  )
}
