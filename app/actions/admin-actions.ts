"use server"

import { supabase } from "@/lib/supabase"
import { createClient } from "@supabase/supabase-js"

// Simple in-memory cache for admin status
// Note: This will be reset on server restart
const adminStatusCache: Record<string, { isAdmin: boolean; timestamp: number }> = {}
const CACHE_TTL = 1000 * 60 * 5 // 5 minutes

export async function isUserAdmin(userId: string | undefined): Promise<boolean> {
  if (!userId) return false

  // Check cache first
  const cachedStatus = adminStatusCache[userId]
  if (cachedStatus && Date.now() - cachedStatus.timestamp < CACHE_TTL) {
    console.log("Using cached admin status for user:", userId)
    return cachedStatus.isAdmin
  }

  try {
    // First try to get from profiles table
    const { data, error } = await supabase.from("profiles").select("is_admin").eq("id", userId).single()

    if (error) {
      console.error("Error checking admin status:", error)

      // Return false for any error - don't try to use admin client
      // This prevents cascading errors and rate limiting issues
      return false
    }

    // Cache the result
    const isAdmin = data?.is_admin === true
    adminStatusCache[userId] = { isAdmin, timestamp: Date.now() }

    return isAdmin
  } catch (error: any) {
    // This will catch JSON parsing errors and any other unexpected errors
    console.error("Unexpected error in isUserAdmin:", error)

    // If we get here, something went wrong - default to non-admin for safety
    return false
  }
}

// Helper function to create an admin client with service role
// Note: We're not using this anymore to avoid potential rate limiting issues
function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase environment variables for admin client")
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export async function getPrompts() {
  try {
    const { data, error } = await supabase.from("prompts").select("*").order("name")

    if (error) {
      console.error("Error fetching prompts:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getPrompts:", error)
    return []
  }
}

export async function updatePrompt(id: string, content: string, description?: string) {
  try {
    const { error } = await supabase
      .from("prompts")
      .update({
        content,
        description,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (error) {
      console.error("Error updating prompt:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Error in updatePrompt:", error)
    return { success: false, error: error.message }
  }
}
