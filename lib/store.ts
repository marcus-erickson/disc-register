import { create } from "zustand"
import { persist } from "zustand/middleware"

// Define our store state
type AuthState = {
  isAuthenticated: boolean
  username: string
  authLoading: boolean
  authError: string | null
  authSuccess: string | null

  // Actions
  setIsAuthenticated: (value: boolean) => void
  setUsername: (value: string) => void
  setAuthLoading: (value: boolean) => void
  setAuthError: (value: string | null) => void
  setAuthSuccess: (value: string | null) => void
  logout: () => void
}

// Create the store with persistence for username
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // Initial state
      isAuthenticated: false,
      username: "",
      authLoading: false,
      authError: null,
      authSuccess: null,

      // Actions
      setIsAuthenticated: (value) => set({ isAuthenticated: value }),
      setUsername: (value) => set({ username: value }),
      setAuthLoading: (value) => set({ authLoading: value }),
      setAuthError: (value) => set({ authError: value }),
      setAuthSuccess: (value) => set({ authSuccess: value }),
      logout: () =>
        set((state) => ({
          isAuthenticated: false,
          // Keep the username when logging out
          username: state.username,
          authError: null,
          // Remove the success message
          authSuccess: null,
        })),
    }),
    {
      name: "pdga-auth-storage",
      // Only persist the username field
      partialize: (state) => ({ username: state.username }),
    },
  ),
)

// Player lookup state
type PlayerState = {
  player: any | null
  pdgaNumber: string
  isLoading: boolean
  lookupError: string | null
  lookupSuccess: string | null
  debugInfo: string | null

  // Actions
  setPdgaNumber: (value: string) => void
  setPlayer: (value: any | null) => void
  setIsLoading: (value: boolean) => void
  setLookupError: (value: string | null) => void
  setLookupSuccess: (value: string | null) => void
  setDebugInfo: (value: string | null) => void
  clearPlayerData: () => void
}

// Create the player store with persistence for pdgaNumber
export const usePlayerStore = create<PlayerState>()(
  persist(
    (set) => ({
      // Initial state
      player: null,
      pdgaNumber: "",
      isLoading: false,
      lookupError: null,
      lookupSuccess: null,
      debugInfo: null,

      // Actions
      setPdgaNumber: (value) => set({ pdgaNumber: value }),
      setPlayer: (value) => set({ player: value }),
      setIsLoading: (value) => set({ isLoading: value }),
      setLookupError: (value) => set({ lookupError: value }),
      setLookupSuccess: (value) => set({ lookupSuccess: value }),
      setDebugInfo: (value) => set({ debugInfo: value }),
      clearPlayerData: () =>
        set((state) => ({
          player: null,
          // Keep the pdgaNumber when clearing data
          pdgaNumber: state.pdgaNumber,
          lookupError: null,
          lookupSuccess: null,
          debugInfo: null,
        })),
    }),
    {
      name: "pdga-player-storage",
      // Only persist the pdgaNumber field
      partialize: (state) => ({ pdgaNumber: state.pdgaNumber }),
    },
  ),
)
