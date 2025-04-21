import * as XLSX from "xlsx"

interface SpreadsheetResult {
  worksheets: string[]
  headers: string[]
  data: any[]
}

/**
 * Process a spreadsheet file (Excel or CSV) and extract worksheets, headers, and data
 */
export async function processSpreadsheetFile(file: File, worksheetName?: string): Promise<SpreadsheetResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = e.target?.result
        if (!data) {
          reject(new Error("Failed to read file"))
          return
        }

        // Parse the file
        const workbook = XLSX.read(data, { type: "binary" })

        // Get all worksheet names
        const worksheets = workbook.SheetNames

        if (worksheets.length === 0) {
          reject(new Error("No worksheets found in the file"))
          return
        }

        // Use the specified worksheet or the first one
        const sheetName = worksheetName || worksheets[0]

        // Get the worksheet
        const worksheet = workbook.Sheets[sheetName]

        if (!worksheet) {
          reject(new Error(`Worksheet "${sheetName}" not found`))
          return
        }

        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

        if (jsonData.length === 0) {
          resolve({
            worksheets,
            headers: [],
            data: [],
          })
          return
        }

        // Extract headers (first row)
        const headers = jsonData[0] as string[]

        // Extract data (remaining rows)
        const rows = jsonData.slice(1).map((row) => {
          const obj: Record<string, any> = {}

          // Map each cell to its corresponding header
          headers.forEach((header, idx) => {
            obj[header] = (row as any[])[idx]
          })

          return obj
        })

        resolve({
          worksheets,
          headers,
          data: rows,
        })
      } catch (error) {
        reject(error)
      }
    }

    reader.onerror = () => {
      reject(new Error("Error reading file"))
    }

    // Read the file as binary
    reader.readAsBinaryString(file)
  })
}

/**
 * Import a disc to the database
 */
export async function importDiscToDatabase(discData: Record<string, any>, userId: string) {
  // This will be implemented to use the Supabase client
  // For now, we'll just return a success
  return { success: true }
}
