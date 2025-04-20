import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get("path")

  if (!path) {
    return new NextResponse("Missing path parameter", { status: 400 })
  }

  try {
    const { data } = supabase.storage.from("disc-images").getPublicUrl(path)

    // Redirect to the actual image URL
    return NextResponse.redirect(data.publicUrl)
  } catch (error) {
    console.error("Error getting image URL:", error)
    return new NextResponse("Error retrieving image", { status: 500 })
  }
}
