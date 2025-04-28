import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, MapPin, Calendar, User, Award } from "lucide-react"

interface PlayerCardProps {
  player: {
    first_name?: string
    last_name?: string
    pdga_number?: string
    membership_status?: string
    membership_expiration_date?: string
    classification?: string
    city?: string
    state_prov?: string
    country?: string
    rating?: string
    rating_effective_date?: string
    official_status?: string
    official_expiration_date?: string
    last_modified?: string
    [key: string]: any // Allow for additional properties
  }
  className?: string
}

export default function PlayerCard({ player, className = "" }: PlayerCardProps) {
  console.log("PlayerCard rendering with data:", player)

  // Make all fields optional to handle different API response formats
  const {
    first_name = "Unknown",
    last_name = "Player",
    pdga_number = "N/A",
    membership_status = "Unknown",
    membership_expiration_date,
    classification,
    city,
    state_prov,
    country,
    rating,
    rating_effective_date,
    official_status,
    official_expiration_date,
    last_modified,
  } = player

  // Format classification (P = Professional, A = Amateur)
  const classificationLabel =
    classification === "P" ? "Professional" : classification === "A" ? "Amateur" : classification

  return (
    <Card className={`shadow-lg ${className}`}>
      <CardHeader className="bg-green-50 dark:bg-gray-800">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-2xl font-bold">
              {first_name} {last_name}
            </CardTitle>
            <div className="flex items-center mt-1 text-gray-600 dark:text-gray-300">
              <User className="h-4 w-4 mr-1" />
              <span>PDGA #{pdga_number}</span>
            </div>
          </div>
          {classification && (
            <Badge
              variant="outline"
              className="text-sm px-3 py-1 bg-green-100 dark:bg-green-900 border-green-200 dark:border-green-700"
            >
              {classificationLabel}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rating && (
            <div className="flex items-center">
              <Trophy className="h-5 w-5 text-yellow-500 mr-2" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Player Rating</p>
                <p className="font-semibold">{rating}</p>
                {rating_effective_date && <p className="text-xs text-gray-400">as of {rating_effective_date}</p>}
              </div>
            </div>
          )}

          {(city || state_prov || country) && (
            <div className="flex items-center">
              <MapPin className="h-5 w-5 text-red-500 mr-2" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Location</p>
                <p className="font-semibold">{[city, state_prov, country].filter(Boolean).join(", ")}</p>
              </div>
            </div>
          )}

          {membership_status && (
            <div className="flex items-center">
              <User className="h-5 w-5 text-green-500 mr-2" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Membership Status</p>
                <p className="font-semibold capitalize">{membership_status}</p>
              </div>
            </div>
          )}

          {membership_expiration_date && (
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-green-500 mr-2" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Expiration Date</p>
                <p className="font-semibold">{membership_expiration_date}</p>
              </div>
            </div>
          )}

          {official_status && (
            <div className="flex items-center">
              <Award className="h-5 w-5 text-purple-500 mr-2" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Official Status</p>
                <p className="font-semibold capitalize">{official_status}</p>
                {official_expiration_date && (
                  <p className="text-xs text-gray-400">expires {official_expiration_date}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {last_modified && (
          <div className="mt-6 pt-4 border-t text-right">
            <p className="text-xs text-gray-400">Last updated: {last_modified}</p>
          </div>
        )}

        {/* Debug output of all available fields */}
        <div className="mt-6 pt-4 border-t">
          <details>
            <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
              Show all available data
            </summary>
            <pre className="mt-2 text-xs overflow-auto max-h-60 p-2 bg-gray-100 rounded">
              {JSON.stringify(player, null, 2)}
            </pre>
          </details>
        </div>
      </CardContent>
    </Card>
  )
}
