import { supabase } from "./supabase"
import { v4 as uuidv4 } from "uuid"
// Import the resizeImage function at the top of the file
import { resizeImage } from "./image-utils"

// Function to ensure the bucket exists using our server-side API
async function ensureBucketExists(bucketName: string): Promise<void> {
  try {
    // Call our server-side API to create the bucket if it doesn't exist
    const response = await fetch("/api/storage/create-bucket", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ bucketName }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Failed to ensure bucket exists")
    }
  } catch (error) {
    console.error("Error ensuring bucket exists:", error)
    throw error
  }
}

// Update the uploadDiscImage function to resize the image before uploading
export async function uploadDiscImage(file: File, discId: string): Promise<string> {
  const bucketName = "disc-images"

  try {
    // Ensure the bucket exists before uploading
    await ensureBucketExists(bucketName)

    // Resize the image before uploading (max 800x800 pixels)
    const resizedFile = await resizeImage(file, 800, 800, 0.8)

    const fileExt = file.name.split(".").pop()
    const fileName = `${uuidv4()}.${fileExt}`
    const filePath = `disc-images/${discId}/${fileName}`

    const { error: uploadError } = await supabase.storage.from(bucketName).upload(filePath, resizedFile)

    if (uploadError) {
      throw uploadError
    }

    return filePath
  } catch (error) {
    console.error("Error uploading image:", error)
    throw error
  }
}

export async function getImageUrl(path: string): Promise<string> {
  const bucketName = "disc-images"

  try {
    if (!path || typeof path !== "string") {
      console.warn("Invalid image path provided:", path)
      return "/flying-disc-in-park.png"
    }

    const { data, error } = supabase.storage.from(bucketName).getPublicUrl(path)

    if (error) {
      console.error("Supabase storage error:", error)
      throw error
    }

    if (!data || !data.publicUrl) {
      console.warn("No public URL returned for path:", path)
      return "/flying-disc-in-park.png"
    }

    return data.publicUrl
  } catch (error) {
    console.error("Error getting image URL:", error)
    // Return a placeholder image instead of throwing
    return "/flying-disc-in-park.png"
  }
}

// Completely rewritten deleteImage function with improved error handling
export async function deleteImage(path: string): Promise<void> {
  const bucketName = "disc-images"

  try {
    console.log(`Attempting to delete image from storage: ${path}`)

    // Extract the file path relative to the bucket
    // The path might be in format "disc-images/123/abc.jpg" or just "123/abc.jpg"
    const relativePath = path.includes(`${bucketName}/`) ? path.split(`${bucketName}/`)[1] : path

    console.log(`Using relative path for deletion: ${relativePath}`)

    // Delete the file from storage
    const { error, data } = await supabase.storage.from(bucketName).remove([relativePath])

    if (error) {
      console.error(`Storage deletion error for ${relativePath}:`, error)
      throw error
    }

    console.log(`Successfully deleted image from storage:`, data)

    // If no files were deleted, throw an error
    if (data?.length === 0) {
      console.warn(`No files were deleted for path: ${relativePath}`)
    }
  } catch (error) {
    console.error(`Error deleting image from storage: ${path}`, error)
    throw error
  }
}
