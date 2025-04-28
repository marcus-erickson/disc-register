import PlayerLookupForm from "@/components/player-lookup-form"
import { DiscGolfIcon } from "@/components/disc-golf-icon"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-12">
        <header className="mb-12 text-center">
          <div className="flex items-center justify-center mb-4">
            <DiscGolfIcon className="h-10 w-10 text-green-600 dark:text-green-400 mr-2" />
            <h1 className="text-4xl font-bold text-green-800 dark:text-green-300">PDGA Player Lookup</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Enter a PDGA membership number to view player information from the Professional Disc Golf Association
            database.
          </p>
        </header>

        <main>
          <PlayerLookupForm />
        </main>

        <footer className="mt-16 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>This application uses the PDGA REST API. Not affiliated with or endorsed by PDGA.</p>
        </footer>
      </div>
    </div>
  )
}
