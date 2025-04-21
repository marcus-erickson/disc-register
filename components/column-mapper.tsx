"use client"

import { useState, useEffect, useCallback } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface ColumnMapperProps {
  headers: string[]
  previewData: any[]
  onChange: (mapping: Record<string, string>, unmapped: string[]) => void
}

// Define disc fields outside of component to avoid recreating on each render
const discFields = [
  { value: "none", label: "Do not import" },
  { value: "brand", label: "Brand", required: true },
  { value: "name", label: "Mold Name", required: true },
  { value: "plastic", label: "Plastic" },
  { value: "weight", label: "Weight" },
  { value: "condition", label: "Condition" },
  { value: "color", label: "Color" },
  { value: "stamp", label: "Stamp" },
  { value: "notes", label: "Notes" },
  { value: "inked", label: "Inked" },
  { value: "for_sale", label: "For Sale" },
  { value: "price", label: "Price" },
]

export default function ColumnMapper({ headers, previewData, onChange }: ColumnMapperProps) {
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({})
  const [includeUnmapped, setIncludeUnmapped] = useState(true)
  const [initialized, setInitialized] = useState(false)

  // Initialize mapping only once when headers change
  useEffect(() => {
    if (headers.length > 0) {
      const initialMapping: Record<string, string> = {}

      headers.forEach((header) => {
        const lowerHeader = header.toLowerCase()

        // Special case for brand - try to normalize it
        if (lowerHeader.includes("brand") || lowerHeader.includes("manufacturer")) {
          initialMapping[header] = "brand"
          return
        }

        // Try to find a matching field
        const matchedField = discFields.find(
          (field) => field.value !== "none" && lowerHeader.includes(field.value.toLowerCase()),
        )
        initialMapping[header] = matchedField ? matchedField.value : "none"
      })

      setColumnMapping(initialMapping)
      setInitialized(true)
    }
  }, [headers]) // Only depend on headers, not on columnMapping

  // Notify parent component of changes, but only after initial setup
  useEffect(() => {
    if (initialized) {
      const unmapped = headers.filter((header) => columnMapping[header] === "none" && includeUnmapped)
      onChange(columnMapping, unmapped)
    }
  }, [columnMapping, includeUnmapped, headers, onChange, initialized])

  // Memoize the change handler to prevent unnecessary re-renders
  const handleMappingChange = useCallback((header: string, value: string) => {
    setColumnMapping((prev) => ({
      ...prev,
      [header]: value,
    }))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Map Spreadsheet Columns</h3>
        <p className="text-sm text-gray-600 mb-4">
          Match each column from your spreadsheet to the corresponding field in your disc collection.
          <span className="font-medium"> Required fields are marked with an asterisk (*).</span>
        </p>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Spreadsheet Column</TableHead>
              <TableHead>Map To Field</TableHead>
              <TableHead>Preview Data</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {headers.map((header) => (
              <TableRow key={header}>
                <TableCell className="font-medium">{header}</TableCell>
                <TableCell>
                  <Select
                    value={columnMapping[header] || "none"}
                    onValueChange={(value) => handleMappingChange(header, value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select field" />
                    </SelectTrigger>
                    <SelectContent>
                      {discFields.map((field) => (
                        <SelectItem key={field.value} value={field.value}>
                          {field.label} {field.required && "*"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="max-w-xs truncate">
                  {previewData.length > 0 && (
                    <div className="flex flex-col space-y-1">
                      {previewData.slice(0, 3).map((row, idx) => (
                        <Badge key={idx} variant="outline" className="justify-start">
                          {row[header] !== undefined ? String(row[header]) : ""}
                        </Badge>
                      ))}
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="includeUnmapped"
          checked={includeUnmapped}
          onCheckedChange={(checked) => setIncludeUnmapped(!!checked)}
        />
        <Label htmlFor="includeUnmapped">Include unmapped columns in notes field</Label>
      </div>
    </div>
  )
}
