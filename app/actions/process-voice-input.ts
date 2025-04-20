"use server"

import { supabase } from "@/lib/supabase"

interface DiscFields {
  brand?: string
  name?: string
  color?: string
  plastic?: string
  weight?: string
  condition?: string
  inked?: boolean
  notes?: string
  error?: string
}

// Function to get prompts from the database
async function getPrompts() {
  try {
    const { data: systemPrompt, error: systemError } = await supabase
      .from("prompts")
      .select("content")
      .eq("name", "voice_input_system")
      .single()

    const { data: userPrompt, error: userError } = await supabase
      .from("prompts")
      .select("content")
      .eq("name", "voice_input_user")
      .single()

    if (systemError || userError) {
      console.error("Error fetching prompts:", systemError || userError)
      return {
        systemPrompt: "You are a disc golf expert assistant specializing in extracting information about discs.",
        userPrompt:
          "Extract the following fields if mentioned in this description: brand, name, color, plastic, weight, condition, inked (boolean), notes.",
      }
    }

    return {
      systemPrompt: systemPrompt?.content,
      userPrompt: userPrompt?.content,
    }
  } catch (error) {
    console.error("Error in getPrompts:", error)
    return {
      systemPrompt: "You are a disc golf expert assistant specializing in extracting information about discs.",
      userPrompt:
        "Extract the following fields if mentioned in this description: brand, name, color, plastic, weight, condition, inked (boolean), notes.",
    }
  }
}

export async function processVoiceInput(transcript: string): Promise<DiscFields> {
  // Check if transcript is valid
  if (!transcript || typeof transcript !== "string") {
    console.error("Invalid transcript provided:", transcript)
    return {
      error: "Invalid input: Please provide a valid description.",
    }
  }

  try {
    // Check if API key exists
    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      console.error("OpenAI API key is missing. Please check your environment variables.")
      return {
        error: "OpenAI API key is missing. Please check your environment variables.",
      }
    }

    // Get prompts from the database
    const { systemPrompt, userPrompt } = await getPrompts()

    // Replace {transcript} placeholder in the user prompt
    const formattedUserPrompt = userPrompt.replace("{transcript}", transcript)

    // Use fetch directly instead of the OpenAI client library
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: formattedUserPrompt,
          },
        ],
        temperature: 0.1,
        max_tokens: 500,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error("OpenAI API error:", errorData)
      return {
        error: `OpenAI API error: ${errorData.error?.message || response.statusText || "Unknown error"}`,
      }
    }

    const data = await response.json()

    if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
      console.error("Invalid response format from OpenAI:", data)
      return { error: "Received an invalid response format from the AI service." }
    }

    try {
      const resultText = data.choices[0].message.content

      // Log the raw response from OpenAI
      console.log("Raw OpenAI response:", resultText)

      // Clean the response if it contains markdown code blocks
      let jsonString = resultText

      // Check if the response is wrapped in markdown code blocks
      const jsonBlockMatch = resultText.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (jsonBlockMatch && jsonBlockMatch[1]) {
        // Extract the JSON content from inside the code block
        jsonString = jsonBlockMatch[1].trim()
      }

      // Parse the cleaned JSON string
      const result = JSON.parse(jsonString)

      // Log the parsed result
      console.log("Parsed JSON result:", result)

      return result
    } catch (parseError) {
      console.error("Error parsing LLM response:", parseError)
      console.log("Raw response:", data.choices[0].message.content)

      // If parsing fails, fall back to basic extraction
      return extractBasicInfo(transcript)
    }
  } catch (error: any) {
    console.error("Error processing voice input:", error)

    // Fall back to basic extraction if the API call fails
    return extractBasicInfo(transcript)
  }
}

// Fallback function to extract basic information without AI
function extractBasicInfo(text: string): DiscFields {
  const result: DiscFields = {}
  const lowerText = text.toLowerCase()

  // Simple brand detection
  const brands = [
    { key: "innova", value: "innova" },
    { key: "discraft", value: "discraft" },
    { key: "dynamic disc", value: "dynamic-discs" },
    { key: "latitude 64", value: "latitude-64" },
    { key: "prodigy", value: "prodigy" },
    { key: "mvp", value: "mvp" },
    { key: "westside", value: "other" },
    { key: "discmania", value: "other" },
  ]

  for (const brand of brands) {
    if (lowerText.includes(brand.key)) {
      result.brand = brand.value
      break
    }
  }

  // Simple color detection
  const colors = ["red", "blue", "green", "yellow", "orange", "purple", "pink", "white", "black"]
  for (const color of colors) {
    if (lowerText.includes(color)) {
      result.color = color
      break
    }
  }

  // Simple plastic detection
  const plastics = ["star", "champion", "dx", "esp", "z", "lucid", "fuzion", "gold", "opto"]
  for (const plastic of plastics) {
    if (lowerText.includes(plastic)) {
      result.plastic = plastic
      break
    }
  }

  // Weight detection (look for numbers followed by "gram" or "g")
  const weightMatch = lowerText.match(/(\d+)\s*(gram|g)/)
  if (weightMatch) {
    result.weight = weightMatch[1]
  }

  // Condition detection
  const conditions = ["new", "used", "beat", "worn", "mint", "excellent"]
  for (const condition of conditions) {
    if (lowerText.includes(condition)) {
      result.condition = condition
      break
    }
  }

  // Check for inked
  if (lowerText.includes("ink") || lowerText.includes("inked")) {
    result.inked = true
  } else if (lowerText.includes("no ink") || lowerText.includes("not inked")) {
    result.inked = false
  }

  // Try to extract disc name - this is more complex, so we'll use a simple approach
  // Look for common disc names
  const discNames = ["destroyer", "buzzz", "judge", "teebird", "aviar", "zone", "harp", "wraith", "valkyrie", "truth"]
  for (const name of discNames) {
    if (lowerText.includes(name)) {
      result.name = name.charAt(0).toUpperCase() + name.slice(1)
      break
    }
  }

  // If we couldn't find a specific disc name, use any remaining text as notes
  if (!result.name && text.length > 0) {
    result.notes = "Additional information: " + text
  }

  return result
}
