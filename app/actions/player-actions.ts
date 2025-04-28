"use server"

import { cookies } from "next/headers"

export async function lookupPlayer(pdgaNumber: string) {
  try {
    const sessionCookie = cookies().get("pdga_session")

    if (!sessionCookie) {
      return { error: "Not authenticated. Please log in first." }
    }

    console.log("Server: Looking up player with PDGA number:", pdgaNumber)

    // Use the real PDGA API endpoint for player lookup
    const apiUrl = `https://api.pdga.com/services/json/players?pdga_number=${pdgaNumber}`

    console.log("Server: Fetching player data from:", apiUrl)

    const response = await fetch(apiUrl, {
      headers: {
        Cookie: sessionCookie.value,
      },
      cache: "no-store",
    })

    console.log("Server: Player lookup response status:", response.status)

    if (!response.ok) {
      if (response.status === 401) {
        // Clear the invalid session cookie
        cookies().delete("pdga_session")
        return { error: "Session expired or invalid. Please log in again." }
      }

      // Try to get more detailed error information
      let errorText = ""
      try {
        const errorData = await response.json()
        errorText = errorData.message || `API error: ${response.status} ${response.statusText}`
      } catch (e) {
        errorText = `API error: ${response.status} ${response.statusText}`
      }

      return { error: errorText }
    }

    // Get the response text first to log it
    const responseText = await response.text()
    console.log("Server: Raw player lookup response:", responseText)

    // Parse the JSON
    let data
    try {
      data = JSON.parse(responseText)
      console.log("Server: Parsed player data:", JSON.stringify(data, null, 2))
    } catch (e) {
      console.error("Server: Failed to parse player data as JSON:", e)
      return { error: "Invalid response format from PDGA API" }
    }

    // Check if the response contains player data
    if (!data) {
      return { error: "No data returned from PDGA API." }
    }

    // Handle different response formats
    let player

    if (Array.isArray(data)) {
      // If it's an array, check if it has any items
      if (data.length === 0) {
        return { error: "No player found with that PDGA number." }
      }
      player = data[0]
    } else if (data.players && Array.isArray(data.players)) {
      // Some APIs return { players: [...] }
      if (data.players.length === 0) {
        return { error: "No player found with that PDGA number." }
      }
      player = data.players[0]
    } else {
      // Maybe it's a direct object
      player = data
    }

    console.log("Server: Final player data being returned:", player)

    return { player }
  } catch (error) {
    console.error("Server: Error looking up player:", error)
    return {
      error: `Failed to connect to the PDGA API: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}
