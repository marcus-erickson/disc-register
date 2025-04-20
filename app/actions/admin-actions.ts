"use server"

import { supabase } from "@/lib/supabase"
import { createClient } from "@supabase/supabase-js"

export async function isUserAdmin(userId: string | undefined): Promise<boolean> {
  if (!userId) return false

  try {
    // First try to get from profiles table
    const { data, error } = await supabase.from("profiles").select("is_admin").eq("id", userId).single()

    if (error) {
      console.error("Error checking admin status:", error)

      // Try to check using the service role key for more reliable access
      const supabaseAdmin = createAdminClient()
      const { data: adminData, error: adminError } = await supabaseAdmin
        .from("profiles")
        .select("is_admin")
        .eq("id", userId)
        .single()

      if (adminError || !adminData) {
        console.error("Admin client error checking admin status:", adminError)
        return false
      }

      return adminData.is_admin === true
    }

    return data?.is_admin === true
  } catch (error) {
    console.error("Error in isUserAdmin:", error)
    return false
  }
}

// Helper function to create an admin client with service role
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
