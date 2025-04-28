import { NextResponse } from "next/server"

// This is a mock API route to simulate the PDGA API
// In a real application, you would call the actual PDGA API

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { username, password } = body

    // Simple validation
    if (!username || !password) {
      return NextResponse.json({ message: "Username and password are required" }, { status: 400 })
    }

    // Mock successful authentication
    return NextResponse.json({
      session_name: "SESS",
      sessid: "mock-session-id-12345",
      user: {
        uid: "12345",
        name: username,
      },
    })
  } catch (error) {
    console.error("Error in mock auth API:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const pdgaNumber = url.searchParams.get("pdga_number")

    if (!pdgaNumber) {
      return NextResponse.json({ message: "PDGA number is required" }, { status: 400 })
    }

    // Mock player data
    const mockPlayers = [
      {
        first_name: "Steady Ed",
        last_name: "Headrick",
        pdga_number: "1",
        membership_status: "current",
        membership_expiration_date: "2200-12-31",
        classification: "P",
        city: "Watsonville",
        state_prov: "CA",
        country: "US",
        rating: "1000",
        rating_effective_date: "2020-08-11",
        official_status: "yes",
        official_expiration_date: "2023-11-09",
        last_modified: "2020-07-09",
      },
      {
        first_name: "Ken",
        last_name: "Climo",
        pdga_number: "4297",
        membership_status: "current",
        membership_expiration_date: "2023-12-31",
        classification: "P",
        city: "Clearwater",
        state_prov: "FL",
        country: "US",
        rating: "1021",
        rating_effective_date: "2020-08-11",
        official_status: "yes",
        official_expiration_date: "2023-11-09",
        last_modified: "2020-07-09",
      },
      {
        first_name: "Paul",
        last_name: "McBeth",
        pdga_number: "27523",
        membership_status: "current",
        membership_expiration_date: "2023-12-31",
        classification: "P",
        city: "Huntington Beach",
        state_prov: "CA",
        country: "US",
        rating: "1053",
        rating_effective_date: "2020-08-11",
        official_status: "yes",
        official_expiration_date: "2023-11-09",
        last_modified: "2020-07-09",
      },
    ]

    // Find player by PDGA number
    const player = mockPlayers.find((p) => p.pdga_number === pdgaNumber)

    if (!player) {
      return NextResponse.json({ message: "Player not found" }, { status: 404 })
    }

    // Return array of players (even if just one) to match API format
    return NextResponse.json([player])
  } catch (error) {
    console.error("Error in mock player API:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
