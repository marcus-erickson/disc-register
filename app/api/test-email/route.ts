import { supabase } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail("your-email@example.com", {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
    })

    if (error) {
      console.error("Email test error:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Test email sent" })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ success: false, error: "Unexpected error occurred" }, { status: 500 })
  }
}
