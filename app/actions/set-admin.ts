"use server"

import { supabase } from "@/lib/supabase"

export async function setUserAsAdmin(userId: string) {
  try {
    // First check if the current user is an admin
    const { data: currentUser, error: currentUserError } = await supabase.auth.getUser()

    if (currentUserError || !currentUser.user) {
      return { success: false, error: "Authentication error" }
    }

    // Check if current user is admin
    const { data: adminCheck, error: adminCheckError } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", currentUser.user.id)
      .single()

    if (adminCheckError || !adminCheck || !adminCheck.is_admin) {
      return { success: false, error: "You don't have permission to perform this action" }
    }

    // Set the specified user as admin
    const { error } = await supabase.from("profiles").update({ is_admin: true }).eq("id", userId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Error in setUserAsAdmin:", error)
    return { success: false, error: error.message }
  }
}
