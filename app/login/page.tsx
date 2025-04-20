"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "../context/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { signIn } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const registered = searchParams.get("registered")

  // Load saved email from localStorage on component mount
  useEffect(() => {
    // Use a consistent key for localStorage
    const savedEmail = localStorage.getItem("discRegister_rememberedEmail")

    if (savedEmail) {
      console.log("Found saved email:", savedEmail)
      setEmail(savedEmail)
      setRememberMe(true)
    } else {
      console.log("No saved email found")
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    console.log("Form submitted, rememberMe:", rememberMe)

    // Save or remove email from localStorage based on rememberMe
    if (rememberMe) {
      console.log("Saving email to localStorage:", email)
      localStorage.setItem("discRegister_rememberedEmail", email)
    } else {
      console.log("Removing email from localStorage")
      localStorage.removeItem("discRegister_rememberedEmail")
    }

    try {
      await signIn(email, password)
      router.push("/")
    } catch (error: any) {
      console.error("Error signing in:", error)

      if (error.message?.includes("Email not confirmed")) {
        setError("Your email has not been confirmed. Please check your inbox or request a new confirmation email.")
      } else {
        setError("Failed to sign in. Please check your credentials.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>Enter your email and password to access your disc collection</CardDescription>
        </CardHeader>
        <CardContent>
          {registered && (
            <Alert className="mb-4 bg-green-50">
              <AlertDescription>
                Registration successful! Please check your email to confirm your account before logging in.
              </AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember-me"
                checked={rememberMe}
                onCheckedChange={(checked) => {
                  const newValue = checked === true
                  console.log("Remember me changed:", newValue)
                  setRememberMe(newValue)
                }}
              />
              <Label htmlFor="remember-me" className="text-sm cursor-pointer">
                Remember my email
              </Label>
            </div>
            {error && (
              <div className="text-sm text-red-500">
                <p>{error}</p>
                {error.includes("email has not been confirmed") && (
                  <p className="mt-1">
                    <Link href="/resend-confirmation" className="text-blue-600 hover:underline">
                      Resend confirmation email
                    </Link>
                  </p>
                )}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <p className="text-sm text-gray-500">
            Don't have an account?{" "}
            <Link href="/register" className="text-blue-600 hover:underline">
              Register
            </Link>
          </p>
          <p className="text-sm text-gray-500">
            Need to confirm your email?{" "}
            <Link href="/resend-confirmation" className="text-blue-600 hover:underline">
              Resend confirmation email
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
