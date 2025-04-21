"use client"

import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, CheckCircle2 } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

interface ImportProgressProps {
  results: {
    total: number
    processed: number
    successful: number
    failed: number
    errors: string[]
  }
}

export default function ImportProgress({ results }: ImportProgressProps) {
  const progressPercentage = results.total > 0 ? Math.round((results.processed / results.total) * 100) : 0

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Import Progress</h3>
        <p className="text-sm text-gray-600 mb-4">
          {results.processed < results.total ? "Importing your discs..." : "Import complete!"}
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Progress: {progressPercentage}%</span>
          <span>
            {results.processed} of {results.total}
          </span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <h4 className="font-medium">Successful</h4>
          </div>
          <p className="text-2xl font-bold mt-2">{results.successful}</p>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h4 className="font-medium">Failed</h4>
          </div>
          <p className="text-2xl font-bold mt-2">{results.failed}</p>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
          <div className="flex items-center space-x-2">
            <h4 className="font-medium">Remaining</h4>
          </div>
          <p className="text-2xl font-bold mt-2">{results.total - results.processed}</p>
        </div>
      </div>

      {results.errors.length > 0 && (
        <Accordion type="single" collapsible>
          <AccordionItem value="errors">
            <AccordionTrigger>
              <div className="flex items-center space-x-2 text-red-600">
                <AlertTriangle className="h-4 w-4" />
                <span>View {results.errors.length} Errors</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="max-h-60 overflow-y-auto">
                <ul className="space-y-2">
                  {results.errors.map((error, idx) => (
                    <li key={idx} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      {results.processed === results.total && results.successful > 0 && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle>Import Complete</AlertTitle>
          <AlertDescription>Successfully imported {results.successful} discs to your collection.</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
