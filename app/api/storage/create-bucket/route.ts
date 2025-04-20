import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: Request) {
  try {
    // Create a Supabase client with the service role key for admin operations
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { bucketName } = await request.json()

    if (!bucketName) {
      return NextResponse.json({ error: "Bucket name is required" }, { status: 400 })
    }

    // Check if bucket exists
    const { data: buckets } = await supabaseAdmin.storage.listBuckets()
    const bucketExists = buckets?.some((bucket) => bucket.name === bucketName)

    if (!bucketExists) {
      // Create the bucket with the service role key
      const { error } = await supabaseAdmin.storage.createBucket(bucketName, {
        public: true,
      })

      if (error) {
        console.error("Error creating bucket:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      // Call the stored procedure to set up RLS policies for the bucket
      const { error: policyError } = await supabaseAdmin.rpc("create_storage_policy", { bucket_name: bucketName })

      if (policyError) {
        console.error("Error setting bucket policy:", policyError)
        // We'll continue even if policy setting fails, as the bucket is created
      }
    }

    return NextResponse.json({ success: true, message: "Bucket ready" })
  } catch (error: any) {
    console.error("Unexpected error creating bucket:", error)
    return NextResponse.json({ error: error.message || "Unknown error" }, { status: 500 })
  }
}
