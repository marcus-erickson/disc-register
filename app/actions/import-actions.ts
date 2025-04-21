"use server"

import { normalizeBrandName } from "@/lib/format-utils"
import { supabase } from "@/lib/supabase"

interface DiscImportData {
  brand: string
  name: string
  plastic?: string
  weight?: string
  condition?: string
  color?: string
  stamp?: string
  notes?: string
  inked: boolean
  for_sale: boolean
  price?: number
}

// Update the importDisc function to normalize the brand name
export async function importDisc(discData: DiscImportData, userId: string) {
  try {
    // Validate required fields
    if (!discData.brand || !discData.name) {
      throw new Error("Brand and name are required fields")
    }

    // Format the data
    const formattedData = {
      user_id: userId,
      brand: normalizeBrandName(discData.brand), // Normalize the brand name
      name: discData.name,
      plastic: discData.plastic || "Unknown", // Set default value instead of null
      weight: discData.weight || null,
      condition: discData.condition || null,
      color: discData.color || null,
      stamp: discData.stamp || null,
      notes: discData.notes || null,
      inked: !!discData.inked,
      for_sale: !!discData.for_sale,
      price: discData.for_sale && discData.price ? Number(discData.price) : null,
    }

    console.log("Importing disc:", formattedData)

    // Insert the disc into the database
    const { data, error } = await supabase.from("discs").insert(formattedData).select()

    if (error) {
      console.error("Database error importing disc:", error)
      throw error
    }

    return { success: true, discId: data?.[0]?.id }
  } catch (error: any) {
    console.error("Error importing disc:", error)
    return {
      success: false,
      error: error.message || "Failed to import disc",
    }
  }
}

// Also update the importMultipleDiscs function to normalize brand names
export async function importMultipleDiscs(discs: DiscImportData[], userId: string) {
  try {
    // Format all discs
    const formattedDiscs = discs.map((disc) => ({
      user_id: userId,
      brand: normalizeBrandName(disc.brand), // Normalize the brand name
      name: disc.name,
      plastic: disc.plastic || "Unknown", // Set default value instead of null
      weight: disc.weight || null,
      condition: disc.condition || null,
      color: disc.color || null,
      stamp: disc.stamp || null,
      notes: disc.notes || null,
      inked: !!disc.inked,
      for_sale: !!disc.for_sale,
      price: disc.for_sale && disc.price ? Number(disc.price) : null,
    }))

    // Insert all discs in a single operation
    const { data, error } = await supabase.from("discs").insert(formattedDiscs)

    if (error) {
      throw error
    }

    return { success: true, count: formattedDiscs.length }
  } catch (error: any) {
    console.error("Error importing multiple discs:", error)
    return {
      success: false,
      error: error.message || "Failed to import discs",
    }
  }
}
