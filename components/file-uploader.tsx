"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Upload, FileSpreadsheet, Loader2 } from "lucide-react"

interface FileUploaderProps {
  onFileUpload: (file: File) => void
  isProcessing: boolean
  acceptedFileTypes: string
}

export default function FileUploader({ onFileUpload, isProcessing, acceptedFileTypes }: FileUploaderProps) {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()

    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = (file: File) => {
    // Check if the file type is accepted
    const fileExtension = file.name.split(".").pop()?.toLowerCase()
    const isAccepted = acceptedFileTypes.split(",").some((type) => type.includes(fileExtension || ""))

    if (!isAccepted) {
      alert(`File type not supported. Please upload ${acceptedFileTypes} files.`)
      return
    }

    setSelectedFile(file)
  }

  const handleUpload = () => {
    if (selectedFile) {
      onFileUpload(selectedFile)
    }
  }

  const openFileSelector = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center ${
          dragActive ? "border-green-500 bg-green-50" : "border-gray-300"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input ref={fileInputRef} type="file" className="hidden" accept={acceptedFileTypes} onChange={handleChange} />

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="p-3 bg-gray-100 rounded-full">
            <FileSpreadsheet className="h-10 w-10 text-gray-500" />
          </div>
          <div>
            <p className="text-lg font-medium">Drag and drop your spreadsheet here</p>
            <p className="text-sm text-gray-500">or</p>
          </div>
          <Button type="button" onClick={openFileSelector}>
            <Upload className="h-4 w-4 mr-2" />
            Browse Files
          </Button>
          <p className="text-xs text-gray-500">Supports Excel (.xlsx, .xls) and CSV files</p>
        </div>
      </div>

      {selectedFile && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileSpreadsheet className="h-8 w-8 text-green-600" />
              <div>
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-xs text-gray-500">{(selectedFile.size / 1024).toFixed(2)} KB</p>
              </div>
            </div>
            <Button onClick={handleUpload} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Upload"
              )}
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
