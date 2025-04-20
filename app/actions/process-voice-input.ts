"use server"

import { OpenAI } from "openai"

interface DiscFields {
  brand?: string
  name?: string
  color?: string
  plastic?: string
  weight?: string
  condition?: string
  inked?: boolean
  notes?: string
}

export async function processVoiceInput(transcript: string): Promise<DiscFields> {
  try {
    // Initialize the OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const prompt = `
You are a disc golf expert assistant. Extract structured information about a disc from the following description.
Extract ONLY the following fields if mentioned:
- brand: The manufacturer (e.g., Innova, Discraft, Dynamic Discs, etc.)
- name: The disc mold name (e.g., Destroyer, Buzzz, Judge, etc.)
- color: The color of the disc
- plastic: The plastic type (e.g., Star, Champion, ESP, Z, Lucid, etc.)
- weight: The weight in grams (just the number)
- condition: The condition of the disc (e.g., New, Used, Beat in, etc.)
- inked: Boolean indicating if the disc is inked or not
- notes: Any additional information that doesn't fit in other fields

Description: "${transcript}"

Respond with ONLY a JSON object containing these fields. Do not include fields that aren't mentioned in the description.
Example response format:
{
 "brand": "Innova",
 "name": "Destroyer",
 "color": "Blue",
 "plastic": "Star",
 "weight": "175",
 "condition": "New",
 "inked": false
}
`

    // Use the OpenAI API to process the transcript
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: prompt,
        },
      ],
      temperature: 0.1, // Low temperature for more deterministic results
      max_tokens: 500,
    })

    // Parse the JSON response
    try {
      const resultText = response.choices[0].message.content
      if (!resultText) {
        return {}
      }

      const result = JSON.parse(resultText)
      return result
    } catch (parseError) {
      console.error("Error parsing LLM response:", parseError)
      console.log("Raw response:", response.choices[0].message.content)
      return {}
    }
  } catch (error) {
    console.error("Error processing voice input with LLM:", error)
    return {}
  }
}
