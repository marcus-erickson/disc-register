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

export default function VoiceInput({ onResult, disabled = false }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null)
  const [fullTranscript, setFullTranscript] = useState("") // Track the full transcript across pauses

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
        processWithLLM(combinedTranscript.trim())
      }
    } else {
      // Reset transcripts when starting a new recording
      setTranscript("")
      setFullTranscript("")
      recognition.start()
      setIsListening(true)
    }
  }, [isListening, recognition, transcript, fullTranscript])

  const processWithLLM = async (text: string) => {
    try {
      // Call the server action to process the transcript with an LLM
      const result = await processVoiceInput(text)

      // Send the extracted information back
      onResult(result)

      toast({
        title: "Voice Input Processed",
        description: "Successfully extracted disc information using AI.",
      })
    } catch (error) {
      console.error("Error processing with LLM:", error)
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
              Processing with AI...
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
    </div>
  )
}
