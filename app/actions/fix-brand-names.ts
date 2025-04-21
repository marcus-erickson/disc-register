"use server"

import { supabase } from "@/lib/supabase"
import { normalizeBrandName } from "@/lib/format-utils"

/**
 * Utility function to normalize all brand names in the database
 * This can be run to fix existing data
 */
export async function normalizeAllBrandNames(userId: string) {
  try {
    // First, check if the user is an admin
    const { data: userProfile, error: userError } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", userId)
      .single()

    if (userError || !userProfile?.is_admin) {
      return {
        success: false,
        error: "Only administrators can run this utility",
      }
    }

    // Get all discs
    const { data: discs, error: fetchError } = await supabase.from("discs").select("id, brand")

    if (fetchError) {
      throw fetchError
    }

    if (!discs || discs.length === 0) {
      return { success: true, count: 0 }
    }

    // Track statistics
    let updated = 0
    let unchanged = 0
    let errors = 0

    // Process each disc
    for (const disc of discs) {
      const normalizedBrand = normalizeBrandName(disc.brand)

      // Only update if the brand name would change
      if (normalizedBrand !== disc.brand) {
        const { error: updateError } = await supabase.from("discs").update({ brand: normalizedBrand }).eq("id", disc.id)

        if (updateError) {
          console.error(`Error updating disc ${disc.id}:`, updateError)
          errors++
        } else {
          updated++
        }
      } else {
        unchanged++
      }
    }

    return {
      success: true,
      stats: {
        total: discs.length,
        updated,
        unchanged,
        errors,
      },
    }
  } catch (error: any) {
    console.error("Error normalizing brand names:", error)
    return {
      success: false,
      error: error.message || "Failed to normalize brand names",
    }
  }
}
