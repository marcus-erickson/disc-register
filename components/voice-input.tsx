"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Mic, MicOff, Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { processVoiceInput } from "@/app/actions/process-voice-input"

interface VoiceInputProps {
  onResult: (result: {
    brand?: string
    name?: string
    color?: string
    plastic?: string
    weight?: string
    condition?: string
    inked?: boolean
    notes?: string
    error?: string
  }) => void
  disabled?: boolean
}

// Declare SpeechRecognition interface
declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
  interface SpeechRecognition extends EventTarget {
    continuous: boolean
    interimResults: boolean
    lang: string
    onresult: (event: any) => void
    onerror: (event: any) => void
    onend: () => void
    start: () => void
    stop: () => void
  }
}

// Add this mapping function after the imports but before the VoiceInput component
function mapBrandToDropdownValue(brand: string | undefined): string | undefined {
  if (!brand) return undefined

  // Convert to lowercase for case-insensitive matching
  const brandLower = brand.toLowerCase()

  // Map of possible brand names to their dropdown values
  const brandMap: Record<string, string> = {
    // Exact matches
    innova: "innova",
    discraft: "discraft",
    "dynamic discs": "dynamic-discs",
    "dynamic disc": "dynamic-discs",
    "dynamic-discs": "dynamic-discs",
    "latitude 64": "latitude-64",
    latitude64: "latitude-64",
    "latitude-64": "latitude-64",
    prodigy: "prodigy",
    mvp: "mvp",
    westside: "other",
    discmania: "other",

    // Common variations
    dd: "dynamic-discs",
    lat64: "latitude-64",
    "lat 64": "latitude-64",
    l64: "latitude-64",
  }

  // Check for exact matches in our map
  if (brandMap[brandLower]) {
    return brandMap[brandLower]
  }

  // Check for partial matches
  for (const [key, value] of Object.entries(brandMap)) {
    if (brandLower.includes(key)) {
      return value
    }
  }

  // If no match found, default to "other"
  return "other"
}

export default function VoiceInput({ onResult, disabled = false }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null)
  const [fullTranscript, setFullTranscript] = useState("") // Track the full transcript across pauses
  const [error, setError] = useState<string | null>(null)

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      const recognitionInstance = new SpeechRecognition()

      recognitionInstance.continuous = true
      recognitionInstance.interimResults = true
      recognitionInstance.lang = "en-US"

      recognitionInstance.onresult = (event) => {
        let currentTranscript = ""
        // Collect all results from the current recognition session
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript
        }

        // Update the current transcript
        setTranscript(currentTranscript)

        // If this is a final result, add it to the full transcript
        if (event.results[event.resultIndex].isFinal) {
          setFullTranscript((prev) => prev + " " + currentTranscript)
        }
      }

      recognitionInstance.onerror = (event) => {
        console.error("Speech recognition error", event.error)
        setIsListening(false)
        toast({
          title: "Error",
          description: `Speech recognition error: ${event.error}`,
          variant: "destructive",
        })
      }

      recognitionInstance.onend = () => {
        setIsListening(false)
      }

      setRecognition(recognitionInstance)
    }

    return () => {
      if (recognition) {
        recognition.stop()
      }
    }
  }, [])

  const toggleListening = useCallback(() => {
    if (!recognition) {
      toast({
        title: "Not Supported",
        description: "Speech recognition is not supported in your browser.",
        variant: "destructive",
      })
      return
    }

    if (isListening) {
      recognition.stop()
      setIsListening(false)

      // Use the combined transcript for processing
      const combinedTranscript = fullTranscript + " " + transcript
      if (combinedTranscript.trim()) {
        setIsProcessing(true)
        setError(null)
        processWithLLM(combinedTranscript.trim())
      }
    } else {
      // Reset transcripts when starting a new recording
      setTranscript("")
      setFullTranscript("")
      setError(null)
      recognition.start()
      setIsListening(true)
    }
  }, [isListening, recognition, transcript, fullTranscript])

  const processWithLLM = async (text: string) => {
    try {
      if (!text || typeof text !== "string" || text.trim() === "") {
        setError("No speech detected. Please try again.")
        setIsProcessing(false)
        return
      }

      // Call the server action to process the transcript
      const result = await processVoiceInput(text)

      // Check if there was an error
      if (result && "error" in result && result.error) {
        setError(result.error)
        toast({
          title: "Processing Error",
          description: result.error,
          variant: "destructive",
        })
        return
      }

      // Send the extracted information back
      // Map the brand to the dropdown value before sending
      if (result.brand) {
        result.brand = mapBrandToDropdownValue(result.brand)
      }
      onResult(result)

      toast({
        title: "Voice Input Processed",
        description: "Successfully extracted disc information.",
      })
    } catch (error: any) {
      console.error("Error processing with LLM:", error)
      const errorMessage = error?.message || "Unknown error occurred"
      setError(`Failed to extract disc information: ${errorMessage}`)
      toast({
        title: "Processing Error",
        description: "Failed to extract disc information. Please try again or enter manually.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          onClick={toggleListening}
          disabled={disabled || isProcessing}
          variant={isListening ? "destructive" : "default"}
          className={isListening ? "bg-red-600 hover:bg-red-700" : ""}
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : isListening ? (
            <>
              <MicOff className="mr-2 h-4 w-4" />
              Stop Listening
            </>
          ) : (
            <>
              <Mic className="mr-2 h-4 w-4" />
              Describe Your Disc
            </>
          )}
        </Button>

        {isListening && <span className="text-sm text-red-600 animate-pulse">Listening...</span>}
      </div>

      {(transcript || fullTranscript) && (
        <div className="p-3 bg-gray-50 rounded-md text-sm">
          <p className="font-medium mb-1">Transcript:</p>
          <p className="italic">
            {fullTranscript} {transcript}
          </p>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
          <p className="font-medium">Error:</p>
          <p>{error}</p>
        </div>
      )}
    </div>
  )
}
