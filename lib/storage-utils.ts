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
    const { data } = supabase.storage.from(bucketName).getPublicUrl(path)
    return data.publicUrl
  } catch (error) {
    console.error("Error getting image URL:", error)
    throw error
  }
}

export async function deleteImage(path: string): Promise<void> {
  const bucketName = "disc-images"

  try {
    const { error } = await supabase.storage.from(bucketName).remove([path])
    if (error) {
      throw error
    }
  } catch (error) {
    console.error("Error deleting image:", error)
    throw error
  }
}
