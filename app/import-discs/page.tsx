"use client"

import { useState, useCallback } from "react"
import { AppLayout } from "@/components/app-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, FileSpreadsheet, Upload, CheckCircle2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { Toaster } from "@/components/ui/toaster"
import { toast } from "@/components/ui/use-toast"
import FileUploader from "@/components/file-uploader"
import ColumnMapper from "@/components/column-mapper"
import ImportPreview from "@/components/import-preview"
import ImportProgress from "@/components/import-progress"
import { processSpreadsheetFile } from "@/lib/spreadsheet-utils"
import ProtectedRoute from "@/components/auth/protected-route"
import { useAuth } from "@/app/context/AuthContext"

// Define import steps as constants to avoid typos
const STEPS = {
  UPLOAD: "upload",
  MAP: "map",
  PREVIEW: "preview",
  IMPORT: "import",
}

export default function ImportDiscs() {
  const router = useRouter()
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(STEPS.UPLOAD)
  const [file, setFile] = useState<File | null>(null)
  const [worksheets, setWorksheets] = useState<string[]>([])
  const [selectedWorksheet, setSelectedWorksheet] = useState<string>("")
  const [headers, setHeaders] = useState<string[]>([])
  const [previewData, setPreviewData] = useState<any[]>([])
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({})
  const [unmappedColumns, setUnmappedColumns] = useState<string[]>([])
  const [importResults, setImportResults] = useState({
    total: 0,
    processed: 0,
    successful: 0,
    failed: 0,
    errors: [] as string[],
  })
  const [isProcessing, setIsProcessing] = useState(false)

  // Handle file upload
  const handleFileUpload = useCallback(async (uploadedFile: File) => {
    try {
      setFile(uploadedFile)
      setIsProcessing(true)

      // Process the file to extract worksheets and headers
      const result = await processSpreadsheetFile(uploadedFile)

      setWorksheets(result.worksheets)

      // If there's only one worksheet, select it automatically
      if (result.worksheets.length === 1) {
        setSelectedWorksheet(result.worksheets[0])
        setHeaders(result.headers)
        setPreviewData(result.data.slice(0, 5)) // First 5 rows for preview
      }

      // Move to the next step
      setCurrentStep(STEPS.MAP)
    } catch (error) {
      console.error("Error processing file:", error)
      toast({
        title: "Error",
        description: "Failed to process the spreadsheet. Please make sure it's a valid Excel or CSV file.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }, [])

  // Handle worksheet selection
  const handleWorksheetSelect = useCallback(
    async (worksheet: string) => {
      try {
        // Skip processing if the worksheet is already selected or if no file is loaded
        if (!file || worksheet === selectedWorksheet) return

        setSelectedWorksheet(worksheet)
        setIsProcessing(true)

        // Get headers and preview data for the selected worksheet
        const result = await processSpreadsheetFile(file, worksheet)

        setHeaders(result.headers)
        setPreviewData(result.data.slice(0, 5)) // First 5 rows for preview
      } catch (error) {
        console.error("Error processing worksheet:", error)
        toast({
          title: "Error",
          description: "Failed to process the selected worksheet.",
          variant: "destructive",
        })
      } finally {
        setIsProcessing(false)
      }
    },
    [file, selectedWorksheet],
  )

  // Handle column mapping
  const handleColumnMappingChange = useCallback((mapping: Record<string, string>, unmapped: string[]) => {
    setColumnMapping(mapping)
    setUnmappedColumns(unmapped)
  }, [])

  // Move to preview step
  const handleProceedToPreview = useCallback(() => {
    // Validate that required fields are mapped
    const requiredFields = ["brand", "name"]
    const mappedFields = Object.values(columnMapping)
    const missingFields = requiredFields.filter((field) => !mappedFields.includes(field))

    if (missingFields.length > 0) {
      toast({
        title: "Missing Required Fields",
        description: `Please map the following required fields: ${missingFields.join(", ")}`,
        variant: "destructive",
      })
      return
    }

    setCurrentStep(STEPS.PREVIEW)
  }, [columnMapping])

  // Transform row data based on column mapping
  const transformRowToDiscData = useCallback(
    (row: Record<string, any>, mapping: Record<string, string>, unmappedCols: string[]) => {
      // Create a new object with the mapped fields
      const discData: Record<string, any> = {}

      // Map the columns based on the mapping
      Object.entries(mapping).forEach(([sourceCol, targetField]) => {
        if (targetField && targetField !== "none" && row[sourceCol] !== undefined) {
          discData[targetField] = row[sourceCol]
        }
      })

      // Ensure brand and name are provided - add default values if missing
      if (!discData.brand || discData.brand.trim() === "") {
        discData.brand = "other" // Default brand if missing
      }

      if (!discData.name || discData.name.trim() === "") {
        discData.name = "Unknown" // Default name if missing
      }

      // Handle special fields
      if (
        discData.for_sale === "Yes" ||
        discData.for_sale === "yes" ||
        discData.for_sale === "true" ||
        discData.for_sale === "TRUE"
      ) {
        discData.for_sale = true
      } else {
        discData.for_sale = false
      }

      if (
        discData.inked === "Yes" ||
        discData.inked === "yes" ||
        discData.inked === "true" ||
        discData.inked === "TRUE"
      ) {
        discData.inked = true
      } else {
        discData.inked = false
      }

      // Concatenate unmapped columns into notes
      if (unmappedCols.length > 0) {
        const unmappedNotes = unmappedCols
          .filter((col) => row[col] !== undefined && row[col] !== null && row[col] !== "")
          .map((col) => `${col}: ${row[col]}`)
          .join("\n")

        if (unmappedNotes) {
          discData.notes = discData.notes
            ? `${discData.notes}\n\nAdditional Information:\n${unmappedNotes}`
            : `Additional Information:\n${unmappedNotes}`
        }
      }

      return discData
    },
    [],
  )

  // Start the import process
  const handleStartImport = useCallback(async () => {
    if (!file || !selectedWorksheet) return

    try {
      setCurrentStep(STEPS.IMPORT)
      setIsProcessing(true)

      // Get all data from the selected worksheet
      const result = await processSpreadsheetFile(file, selectedWorksheet)
      const allData = result.data

      setImportResults({
        total: allData.length,
        processed: 0,
        successful: 0,
        failed: 0,
        errors: [],
      })

      // Process the data in batches to show progress
      const batchSize = 10
      const totalBatches = Math.ceil(allData.length / batchSize)

      for (let i = 0; i < totalBatches; i++) {
        const batch = allData.slice(i * batchSize, (i + 1) * batchSize)

        // Process each item in the batch
        const batchResults = await Promise.all(
          batch.map(async (row) => {
            try {
              // Transform the row data based on the column mapping
              const discData = transformRowToDiscData(row, columnMapping, unmappedColumns)

              // Actually save the disc to the database using our server action
              if (!user?.id) {
                throw new Error("User ID is required")
              }

              // Import the disc using our server action
              const result = await import("@/app/actions/import-actions").then((module) =>
                module.importDisc(discData, user.id),
              )

              if (!result.success) {
                throw new Error(result.error || "Failed to import disc")
              }

              return { success: true, discId: result.discId }
            } catch (error) {
              console.error("Error importing disc:", error)
              return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
              }
            }
          }),
        )

        // Update the import results
        setImportResults((prev) => {
          const successful = batchResults.filter((r) => r.success).length
          const failed = batchResults.filter((r) => !r.success).length
          const newErrors = batchResults
            .filter((r): r is { success: false; error: string } => !r.success && "error" in r)
            .map((r) => r.error)

          return {
            ...prev,
            processed: prev.processed + batch.length,
            successful: prev.successful + successful,
            failed: prev.failed + failed,
            errors: [...prev.errors, ...newErrors],
          }
        })

        // Small delay to allow UI to update
        await new Promise((resolve) => setTimeout(resolve, 50))
      }

      // Show success message
      toast({
        title: "Import Complete",
        description: `Successfully imported discs to your collection.`,
      })
    } catch (error) {
      console.error("Error during import:", error)
      toast({
        title: "Import Error",
        description: "An error occurred during the import process.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }, [file, selectedWorksheet, columnMapping, unmappedColumns, transformRowToDiscData, user])

  // Go back to mapping step
  const handleBackToMap = useCallback(() => {
    setCurrentStep(STEPS.MAP)
  }, [])

  // Go back to upload step
  const handleBackToUpload = useCallback(() => {
    setCurrentStep(STEPS.UPLOAD)
  }, [])

  // Navigate to home
  const handleGoToHome = useCallback(() => {
    router.push("/")
  }, [router])

  // Render the current step
  const renderStep = () => {
    switch (currentStep) {
      case STEPS.UPLOAD:
        return (
          <div className="space-y-6">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Important</AlertTitle>
              <AlertDescription>
                Your spreadsheet should have column headers in the first row. The import tool will help you map these
                columns to the appropriate fields in your disc collection.
              </AlertDescription>
            </Alert>

            <FileUploader
              onFileUpload={handleFileUpload}
              isProcessing={isProcessing}
              acceptedFileTypes=".xlsx,.xls,.csv"
            />

            <div className="mt-8">
              <h3 className="text-lg font-medium mb-2">Supported File Formats</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                <li>Excel Spreadsheets (.xlsx, .xls)</li>
                <li>CSV Files (.csv)</li>
              </ul>
            </div>
          </div>
        )

      case STEPS.MAP:
        return (
          <div className="space-y-6">
            {worksheets.length > 1 && (
              <div className="mb-4">
                <h3 className="text-lg font-medium mb-2">Select Worksheet</h3>
                <Tabs value={selectedWorksheet} onValueChange={handleWorksheetSelect}>
                  <TabsList className="mb-2">
                    {worksheets.map((sheet) => (
                      <TabsTrigger
                        key={sheet}
                        value={sheet}
                        className={selectedWorksheet === sheet ? "bg-green-600 text-white" : ""}
                      >
                        {sheet}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>
            )}

            {headers.length > 0 && (
              <ColumnMapper headers={headers} previewData={previewData} onChange={handleColumnMappingChange} />
            )}

            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={handleBackToUpload}>
                Back
              </Button>
              <Button
                onClick={handleProceedToPreview}
                disabled={isProcessing || Object.keys(columnMapping).length === 0}
              >
                Continue
              </Button>
            </div>
          </div>
        )

      case STEPS.PREVIEW:
        return (
          <div className="space-y-6">
            <ImportPreview previewData={previewData} columnMapping={columnMapping} unmappedColumns={unmappedColumns} />

            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={handleBackToMap}>
                Back
              </Button>
              <Button onClick={handleStartImport} disabled={isProcessing}>
                Start Import
              </Button>
            </div>
          </div>
        )

      case STEPS.IMPORT:
        return (
          <div className="space-y-6">
            <ImportProgress results={importResults} />

            <div className="flex justify-center mt-6">
              <Button onClick={handleGoToHome} disabled={isProcessing}>
                {isProcessing ? "Importing..." : "Go to Collection"}
              </Button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Import Discs</h1>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Import Your Disc Collection</CardTitle>
              <AlertDescription>
                Upload a spreadsheet with your disc collection data to import it into the system.
              </AlertDescription>
            </CardHeader>
            <CardContent>
              {/* Progress indicator */}
              <div className="mb-8">
                <div className="flex justify-between mb-2">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        currentStep === STEPS.UPLOAD ? "bg-green-600 text-white" : "bg-gray-200"
                      }`}
                    >
                      <Upload className="h-5 w-5" />
                    </div>
                    <span className="text-xs mt-1">Upload</span>
                  </div>
                  <div className="flex-1 flex items-center">
                    <div
                      className={`h-1 w-full ${currentStep !== STEPS.UPLOAD ? "bg-green-600" : "bg-gray-200"}`}
                    ></div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        currentStep === STEPS.MAP
                          ? "bg-green-600 text-white"
                          : currentStep === STEPS.UPLOAD
                            ? "bg-gray-200"
                            : "bg-green-600 text-white"
                      }`}
                    >
                      <FileSpreadsheet className="h-5 w-5" />
                    </div>
                    <span className="text-xs mt-1">Map</span>
                  </div>
                  <div className="flex-1 flex items-center">
                    <div
                      className={`h-1 w-full ${
                        currentStep === STEPS.PREVIEW || currentStep === STEPS.IMPORT ? "bg-green-600" : "bg-gray-200"
                      }`}
                    ></div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        currentStep === STEPS.PREVIEW
                          ? "bg-green-600 text-white"
                          : currentStep === STEPS.IMPORT
                            ? "bg-green-600 text-white"
                            : "bg-gray-200"
                      }`}
                    >
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <span className="text-xs mt-1">Preview</span>
                  </div>
                  <div className="flex-1 flex items-center">
                    <div
                      className={`h-1 w-full ${currentStep === STEPS.IMPORT ? "bg-green-600" : "bg-gray-200"}`}
                    ></div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        currentStep === STEPS.IMPORT ? "bg-green-600 text-white" : "bg-gray-200"
                      }`}
                    >
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <span className="text-xs mt-1">Import</span>
                  </div>
                </div>
              </div>

              {renderStep()}
            </CardContent>
          </Card>
        </div>
        <Toaster />
      </AppLayout>
    </ProtectedRoute>
  )
}
