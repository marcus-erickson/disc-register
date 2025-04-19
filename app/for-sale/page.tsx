"use client"

import { useEffect, useState } from "react"
import Header from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { useAuth } from "../context/AuthContext"
import ProtectedRoute from "@/components/protected-route"

interface Disc {
  id: string
  name: string
  brand: string
  type: string
  weight: string
  condition: string
  color: string
  for_sale: boolean
  price: number | null
}

export default function ForSale() {
  const [discs, setDiscs] = useState<Disc[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    const fetchDiscs = async () => {
      if (!user) return

      try {
        const { data, error } = await supabase
          .from("discs")
          .select("*")
          .eq("for_sale", true)
          .order("created_at", { ascending: false })

        if (error) {
          throw error
        }

        setDiscs(data || [])
      } catch (error) {
        console.error("Error fetching discs for sale:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDiscs()
  }, [user])

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-4">Discs For Sale</h1>

          {loading ? (
            <p>Loading discs for sale...</p>
          ) : discs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No discs currently for sale</p>
              <p>
                <a href="/add-disc" className="text-blue-600 hover:underline">
                  Add a disc for sale
                </a>
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {discs.map((disc) => (
                <Card key={disc.id}>
                  <CardHeader>
                    <CardTitle>{disc.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>
                      <strong>Brand:</strong> {disc.brand}
                    </p>
                    <p>
                      <strong>Type:</strong> {disc.type}
                    </p>
                    <p>
                      <strong>Weight:</strong> {disc.weight}g
                    </p>
                    <p>
                      <strong>Condition:</strong> {disc.condition}
                    </p>
                    <p>
                      <strong>Color:</strong> {disc.color}
                    </p>
                    <p className="text-green-600 font-bold mt-2">Price: ${disc.price}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </ProtectedRoute>
  )
}
