import { supabase } from "./supabase"

/**
 * Get user profile by user ID
 * @param userId The user ID to look up
 * @returns The user's profile information or null if not found
 */
export async function getUserProfile(userId: string) {
  if (!userId) return null

  try {
    // Try to get from profiles table first
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

    if (!error && data) {
      return data
    }

    // If no profile found or error, try to get basic info from auth
    const { data: userData } = await supabase.auth.getUser(userId)

    if (userData && userData.user) {
      // Return minimal profile info from auth data
      return {
        id: userData.user.id,
        email: userData.user.email,
        name: userData.user.user_metadata?.name || userData.user.email?.split("@")[0] || "",
      }
    }

    // If all else fails, return null
    return null
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return null
  }
}

/**
 * Get user email by user ID
 * @param userId The user ID to look up
 * @returns The user's email or "Unknown" if not found
 */
export async function getUserEmailById(userId: string): Promise<string> {
  if (!userId) return "Unknown"

  try {
    // Try to get from profiles table first
    const { data, error } = await supabase.from("profiles").select("email").eq("id", userId).single()

    if (!error && data && data.email) {
      return data.email
    }

    // If that fails, try the auth API
    const { data: authData } = await supabase.auth.getUser(userId)

    if (authData && authData.user && authData.user.email) {
      return authData.user.email
    }

    return "Unknown"
  } catch (error) {
    console.error("Error fetching user email:", error)
    return "Unknown"
  }
}

/**
 * Get user display name
 * @param userId The user ID to look up
 * @returns The user's name or username portion of email
 */
export async function getUserDisplayName(userId: string): Promise<string> {
  if (!userId) return "Unknown"

  try {
    // Try to get from profiles table first
    const { data, error } = await supabase.from("profiles").select("name, email").eq("id", userId).single()

    if (!error && data) {
      // Return name if available, otherwise username from email
      if (data.name) return data.name
      if (data.email) return data.email.split("@")[0]
    }

    // If that fails, try the auth API
    const { data: authData } = await supabase.auth.getUser(userId)

    if (authData && authData.user) {
      const metadata = authData.user.user_metadata
      if (metadata && metadata.name) return metadata.name
      if (authData.user.email) return authData.user.email.split("@")[0]
    }

    return "Unknown"
  } catch (error) {
    console.error("Error fetching user display name:", error)
    return "Unknown"
  }
}
