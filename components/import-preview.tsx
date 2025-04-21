"use client"

import { useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { InfoIcon } from "lucide-react"

interface ImportPreviewProps {
  previewData: any[]
  columnMapping: Record<string, string>
  unmappedColumns: string[]
}

export default function ImportPreview({ previewData, columnMapping, unmappedColumns }: ImportPreviewProps) {
  // Transform data only when dependencies change
  const transformedData = useMemo(() => {
    return previewData.map((row) => {
      const transformed: Record<string, any> = {}

      // Map the columns based on the mapping
      Object.entries(columnMapping).forEach(([sourceCol, targetField]) => {
        if (targetField && targetField !== "none" && row[sourceCol] !== undefined) {
          transformed[targetField] = row[sourceCol]
        }
      })

      // Handle special fields
      if (
        transformed.for_sale === "Yes" ||
        transformed.for_sale === "yes" ||
        transformed.for_sale === "true" ||
        transformed.for_sale === "TRUE"
      ) {
        transformed.for_sale = true
      } else {
        transformed.for_sale = false
      }

      if (
        transformed.inked === "Yes" ||
        transformed.inked === "yes" ||
        transformed.inked === "true" ||
        transformed.inked === "TRUE"
      ) {
        transformed.inked = true
      } else {
        transformed.inked = false
      }

      // Add unmapped columns to notes
      if (unmappedColumns.length > 0) {
        const unmappedNotes = unmappedColumns
          .filter((col) => row[col] !== undefined && row[col] !== null && row[col] !== "")
          .map((col) => `${col}: ${row[col]}`)
          .join("\n")

        if (unmappedNotes) {
          transformed.notes = transformed.notes
            ? `${transformed.notes}\n\nAdditional Information:\n${unmappedNotes}`
            : `Additional Information:\n${unmappedNotes}`
        }
      }

      return transformed
    })
  }, [previewData, columnMapping, unmappedColumns])

  // Get unique fields from transformed data
  const fields = useMemo(() => {
    const allFields = new Set<string>()
    transformedData.forEach((item) => {
      Object.keys(item).forEach((key) => allFields.add(key))
    })
    return Array.from(allFields).sort()
  }, [transformedData])

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Preview Import Data</h3>
        <p className="text-sm text-gray-600 mb-4">
          Review how your data will be imported. This shows the first few rows after mapping.
        </p>
      </div>

      {unmappedColumns.length > 0 && (
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>Unmapped Columns</AlertTitle>
          <AlertDescription>
            The following columns will be included in the notes field: {unmappedColumns.join(", ")}
          </AlertDescription>
        </Alert>
      )}

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {fields.map((field) => (
                <TableHead key={field}>{field}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {transformedData.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {fields.map((field) => (
                  <TableCell key={field}>
                    {row[field] !== undefined
                      ? typeof row[field] === "boolean"
                        ? row[field]
                          ? "Yes"
                          : "No"
                        : String(row[field])
                      : ""}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
