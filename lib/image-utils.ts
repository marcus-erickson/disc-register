/**
 * Utility functions for image processing
 */

/**
 * Resizes an image file to the specified dimensions while maintaining aspect ratio
 * @param file The original image file
 * @param maxWidth Maximum width of the resized image
 * @param maxHeight Maximum height of the resized image
 * @param quality JPEG quality (0-1)
 * @returns A Promise that resolves to a new File object containing the resized image
 */
export async function resizeImage(file: File, maxWidth = 800, maxHeight = 800, quality = 0.8): Promise<File> {
  return new Promise((resolve, reject) => {
    // Create a FileReader to read the file
    const reader = new FileReader()

    // Set up the FileReader onload event
    reader.onload = (readerEvent) => {
      // Create an image object
      const img = new Image()
      img.crossOrigin = "anonymous"

      // Set up the image onload event
      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round(height * (maxWidth / width))
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = Math.round(width * (maxHeight / height))
            height = maxHeight
          }
        }

        // Create a canvas element
        const canvas = document.createElement("canvas")
        canvas.width = width
        canvas.height = height

        // Draw the image on the canvas
        const ctx = canvas.getContext("2d")
        if (!ctx) {
          reject(new Error("Could not get canvas context"))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        // Convert the canvas to a Blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Canvas to Blob conversion failed"))
              return
            }

            // Create a new File from the Blob
            const resizedFile = new File([blob], file.name, {
              type: "image/jpeg", // Convert all images to JPEG for consistency
              lastModified: Date.now(),
            })

            resolve(resizedFile)
          },
          "image/jpeg",
          quality,
        )
      }

      // Set up image onerror event
      img.onerror = () => {
        reject(new Error("Error loading image"))
      }

      // Set the image source to the FileReader result
      if (readerEvent.target?.result) {
        img.src = readerEvent.target.result as string
      } else {
        reject(new Error("Error reading file"))
      }
    }

    // Set up FileReader onerror event
    reader.onerror = () => {
      reject(new Error("Error reading file"))
    }

    // Read the file as a Data URL
    reader.readAsDataURL(file)
  })
}

/**
 * Determines if a file is an image
 * @param file The file to check
 * @returns boolean indicating if the file is an image
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith("image/")
}
