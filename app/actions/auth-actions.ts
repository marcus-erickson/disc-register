"use server"

import { cookies } from "next/headers"

export async function authenticatePDGA(username: string, password: string) {
  console.log("Server: Starting authentication process")

  try {
    console.log("Server: Sending request to PDGA API")

    const response = await fetch("https://api.pdga.com/services/json/user/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "PDGA-Player-Lookup-App",
      },
      body: JSON.stringify({ username, password }),
      cache: "no-store",
    })

    console.log("Server: Received response with status:", response.status)

    // Try to parse the response as JSON
    let data
    try {
      const responseText = await response.text()
      console.log("Server: Raw response:", responseText)

      try {
        data = JSON.parse(responseText)
        console.log("Server: Successfully parsed response JSON")
      } catch (parseError) {
        console.error("Server: Failed to parse response as JSON:", parseError)
        return { error: "Invalid response format from authentication server" }
      }
    } catch (e) {
      console.error("Server: Failed to get response text:", e)
      return { error: "Failed to read response from authentication server" }
    }

    if (!response.ok) {
      console.error("Server: Authentication failed with status:", response.status)

      // Handle specific error cases
      if (response.status === 401) {
        return { error: "Invalid username or password. Please check your credentials and try again." }
      }

      return { error: data?.message || `Authentication failed with status: ${response.status}` }
    }

    // Check if we have the expected session data
    if (!data.session_name || !data.sessid) {
      console.error("Server: Missing session data in response:", Object.keys(data))
      return { error: "Invalid authentication response from server (missing session data)" }
    }

    // Store the session token in a secure, HTTP-only cookie
    const cookieValue = `${data.session_name}=${data.sessid}`
    console.log("Server: Setting cookie with session token")

    cookies().set("pdga_session", cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24, // 24 hours
    })

    console.log("Server: Authentication successful")
    return { success: true }
  } catch (error) {
    console.error("Server: Error during PDGA authentication:", error)
    return {
      error: `Failed to authenticate with PDGA: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}
