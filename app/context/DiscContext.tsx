"use client"

import type React from "react"
import { createContext, useState, useContext, type ReactNode } from "react"

export interface Disc {
  id: number
  name: string
  brand: string
  type: string
  weight: string
  condition: string
  color: string
  forSale: boolean
  price?: string
}

interface DiscContextType {
  discs: Disc[]
  addDisc: (disc: Omit<Disc, "id">) => void
}

const DiscContext = createContext<DiscContextType | undefined>(undefined)

export const useDiscs = () => {
  const context = useContext(DiscContext)
  if (!context) {
    throw new Error("useDiscs must be used within a DiscProvider")
  }
  return context
}

export const DiscProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [discs, setDiscs] = useState<Disc[]>([])

  const addDisc = (newDisc: Omit<Disc, "id">) => {
    setDiscs((prevDiscs) => [...prevDiscs, { ...newDisc, id: Date.now() }])
  }

  return <DiscContext.Provider value={{ discs, addDisc }}>{children}</DiscContext.Provider>
}
