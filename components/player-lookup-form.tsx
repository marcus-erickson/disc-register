"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { lookupPlayer } from "@/app/actions/player-actions"
import { authenticatePDGA } from "@/app/actions/auth-actions"
import PlayerCard from "./player-card"
import { AlertCircle, Loader2, LogOut, Info } from "lucide-react"
import { useAuthStore, usePlayerStore } from "@/lib/store"

export default function PlayerLookupForm() {
  // Debug ID to track component instances
  const instanceId = useRef(`form-${Math.random().toString(36).slice(2, 8)}`)
  console.log(`[${instanceId.current}] Component rendering`)

  // Local state for password (we don't store this in global state for security)
  const [password, setPassword] = useState("")
  const [authAttempts, setAuthAttempts] = useState(0)

  // Auth state from global store
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const username = useAuthStore((state) => state.username)
  const authLoading = useAuthStore((state) => state.authLoading)
  const authError = useAuthStore((state) => state.authError)
  const authSuccess = useAuthStore((state) => state.authSuccess)
  const setIsAuthenticated = useAuthStore((state) => state.setIsAuthenticated)
  const setUsername = useAuthStore((state) => state.setUsername)
  const setAuthLoading = useAuthStore((state) => state.setAuthLoading)
  const setAuthError = useAuthStore((state) => state.setAuthError)
  const setAuthSuccess = useAuthStore((state) => state.setAuthSuccess)
  const logout = useAuthStore((state) => state.logout)

  // Player state from global store
  const player = usePlayerStore((state) => state.player)
  const pdgaNumber = usePlayerStore((state) => state.pdgaNumber)
  const isLoading = usePlayerStore((state) => state.isLoading)
  const lookupError = usePlayerStore((state) => state.lookupError)
  const lookupSuccess = usePlayerStore((state) => state.lookupSuccess)
  const debugInfo = usePlayerStore((state) => state.debugInfo)
  const setPdgaNumber = usePlayerStore((state) => state.setPdgaNumber)
  const setPlayer = usePlayerStore((state) => state.setPlayer)
  const setIsLoading = usePlayerStore((state) => state.setIsLoading)
  const setLookupError = usePlayerStore((state) => state.setLookupError)
  const setLookupSuccess = usePlayerStore((state) => state.setLookupSuccess)
  const setDebugInfo = usePlayerStore((state) => state.setDebugInfo)
  const clearPlayerData = usePlayerStore((state) => state.clearPlayerData)

  // Refs
  const authInProgressRef = useRef(false)
  const playerCardRef = useRef<HTMLDivElement>(null)

  // Debug logging for state changes
  const logStateChange = useCallback((action: string, data: any) => {
    console.log(`[${instanceId.current}] ${action}:`, data)
  }, [])

  // Log authentication state changes
  useEffect(() => {
    logStateChange("Auth state changed", {
      isAuthenticated,
      username,
      error: authError ? "Error present" : null,
      successMessage: authSuccess ? "Success message present" : null,
      isLoading: authLoading,
      authAttempts,
    })
  }, [isAuthenticated, username, authError, authSuccess, authLoading, authAttempts, logStateChange])

  // Log player data changes
  useEffect(() => {
    if (player) {
      logStateChange("Player data changed", {
        pdgaNumber: player.pdga_number,
        name: `${player.first_name} ${player.last_name}`,
      })

      // Scroll to player card when data is available
      if (playerCardRef.current) {
        setTimeout(() => {
          playerCardRef.current?.scrollIntoView({ behavior: "smooth" })
        }, 100)
      }
    }
  }, [player, logStateChange])

  // Handle authentication
  const handleAuthenticate = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      // Prevent duplicate authentication attempts
      if (authInProgressRef.current) {
        logStateChange("Auth already in progress", { ignored: true })
        return
      }

      // Set the ref to indicate authentication is in progress
      authInProgressRef.current = true

      // Update state in a single batch
      setAuthLoading(true)
      setAuthError(null)
      setAuthSuccess(null)
      setDebugInfo(null)

      // Increment auth attempts counter
      setAuthAttempts((prev) => {
        const newCount = prev + 1
        logStateChange("Authentication attempt", { attempt: newCount })
        return newCount
      })

      // Validate inputs
      if (!username.trim() || !password.trim()) {
        setAuthError("Please enter both username and password")
        setAuthLoading(false)
        authInProgressRef.current = false
        return
      }

      try {
        logStateChange("Calling authenticatePDGA", { username: username.slice(0, 2) + "..." })

        // Store current values to avoid closure issues
        const currentUsername = username
        const currentPassword = password

        const result = await authenticatePDGA(currentUsername, currentPassword)
        logStateChange("Auth result received", { success: !result.error })

        if (result.error) {
          // Handle error case
          logStateChange("Auth error", { message: result.error })

          // Update state in a single batch to avoid race conditions
          setAuthError(result.error)
          setIsAuthenticated(false)
        } else {
          // Handle success case
          logStateChange("Auth success", { setting: true })

          // CRITICAL FIX: Use the store to update authentication state
          setIsAuthenticated(true)
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        logStateChange("Auth exception", { message: errorMessage })

        setAuthError(`An unexpected error occurred during authentication: ${errorMessage}`)
        setDebugInfo(errorMessage)
        setIsAuthenticated(false)
      } finally {
        // Always clean up
        setAuthLoading(false)
        authInProgressRef.current = false
        logStateChange("Auth process complete", { ready: true })
      }
    },
    [
      username,
      password,
      logStateChange,
      setAuthError,
      setAuthLoading,
      setAuthSuccess,
      setIsAuthenticated,
      setDebugInfo,
    ],
  )

  // Handle player lookup
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      setLookupSuccess(null)
      setDebugInfo(null)
      clearPlayerData()

      if (!pdgaNumber.trim()) {
        setLookupError("Please enter a PDGA number")
        return
      }

      setIsLoading(true)
      setLookupError(null)

      try {
        logStateChange("Looking up player", { pdgaNumber })

        // Store current value to avoid closure issues
        const currentPdgaNumber = pdgaNumber

        const result = await lookupPlayer(currentPdgaNumber)
        logStateChange("Player lookup result", { success: !result.error })

        if (result.error) {
          logStateChange("Player lookup error", { message: result.error })

          setLookupError(result.error)
          setPlayer(null)

          // If session expired, reset authentication state
          if (
            result.error.includes("session expired") ||
            result.error.includes("Not authenticated") ||
            result.error.includes("401")
          ) {
            setIsAuthenticated(false)
          }
        } else if (result.player) {
          logStateChange("Player data received", {
            pdgaNumber: result.player.pdga_number,
            name: `${result.player.first_name} ${result.player.last_name}`,
          })

          setPlayer({ ...result.player })
          setLookupError(null)
        } else {
          logStateChange("No player data in result", { result })

          setLookupError("Received a response but no player data was found")
          setPlayer(null)
          setDebugInfo(JSON.stringify(result, null, 2))
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        logStateChange("Player lookup exception", { message: errorMessage })

        setLookupError(`An unexpected error occurred: ${errorMessage}`)
        setDebugInfo(errorMessage)
        setPlayer(null)
      } finally {
        setIsLoading(false)
      }
    },
    [
      pdgaNumber,
      logStateChange,
      setIsAuthenticated,
      setLookupError,
      setPlayer,
      setLookupSuccess,
      setIsLoading,
      setDebugInfo,
      clearPlayerData,
    ],
  )

  // Handle logout
  const handleLogout = useCallback(() => {
    logStateChange("Logging out", { clearing: true })

    // Clear password field
    setPassword("")

    // Use the store's logout function
    logout()

    // Clear player data
    clearPlayerData()

    // Reset auth attempts
    setAuthAttempts(0)

    logStateChange("Logged out", { complete: true })
  }, [logout, clearPlayerData, logStateChange])

  return (
    <div className="max-w-xl mx-auto">
      <Card className="shadow-lg mb-6">
        {!isAuthenticated ? (
          <>
            <CardHeader>
              <CardTitle>PDGA Authentication</CardTitle>
              <CardDescription>Enter your PDGA username and password to access player data</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAuthenticate} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="username" className="text-sm font-medium">
                    Username
                  </label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="PDGA Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={authLoading || authInProgressRef.current}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium">
                    Password
                  </label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="PDGA Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={authLoading || authInProgressRef.current}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={authLoading || authInProgressRef.current}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  {authLoading || authInProgressRef.current ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    "Authenticate"
                  )}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="text-xs text-gray-500 pt-0">
              <p>
                Note: This application connects to the official PDGA API. You must have a valid PDGA account to use this
                service.
              </p>
            </CardFooter>
          </>
        ) : (
          <>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>Player Lookup</CardTitle>
                <CardDescription>Enter a PDGA number to look up player information</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Logout
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="pdga-number" className="text-sm font-medium">
                    PDGA Number
                  </label>
                  <Input
                    id="pdga-number"
                    type="text"
                    placeholder="Enter PDGA Number"
                    value={pdgaNumber}
                    onChange={(e) => setPdgaNumber(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    "Look Up Player"
                  )}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="text-xs text-gray-500 pt-0">
              <p>Enter any valid PDGA number to view player information.</p>
            </CardFooter>
          </>
        )}
      </Card>

      {authError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{authError}</AlertDescription>
        </Alert>
      )}

      {lookupError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{lookupError}</AlertDescription>
        </Alert>
      )}

      {debugInfo && (
        <Alert className="mb-6 bg-gray-50 border-gray-200">
          <Info className="h-4 w-4 text-gray-600" />
          <AlertTitle>Debug Information</AlertTitle>
          <AlertDescription>
            <pre className="text-xs overflow-auto max-h-40 p-2 bg-gray-100 rounded">{debugInfo}</pre>
          </AlertDescription>
        </Alert>
      )}

      {/* Player card with ref for scrolling */}
      <div ref={playerCardRef}>
        {player && (
          <>
            <h2 className="text-xl font-bold mb-4">Player Information</h2>
            <PlayerCard player={player} className="mb-8" />
          </>
        )}
      </div>
    </div>
  )
}
