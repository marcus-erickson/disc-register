"use server"

import { supabase } from "@/lib/supabase"

export async function isUserAdmin(userId: string | undefined): Promise<boolean> {
  if (!userId) return false

  try {
    const { data, error } = await supabase.from("profiles").select("is_admin").eq("id", userId).single()

    if (error || !data) {
      console.error("Error checking admin status:", error)
      return false
    }

    return data.is_admin === true
  } catch (error) {
    console.error("Error in isUserAdmin:", error)
    return false
  }
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
