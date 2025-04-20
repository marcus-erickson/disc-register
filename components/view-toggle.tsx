"use client"

import { Grid, List } from "lucide-react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

interface ViewToggleProps {
  currentView: "grid" | "list"
  onChange: (view: "grid" | "list") => void
}

export default function ViewToggle({ currentView, onChange }: ViewToggleProps) {
  return (
    <div className="flex justify-end mb-4">
      <ToggleGroup
        type="single"
        value={currentView}
        onValueChange={(value) => value && onChange(value as "grid" | "list")}
      >
        <ToggleGroupItem value="grid" aria-label="Grid view">
          <Grid className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="list" aria-label="List view">
          <List className="h-4 w-4" />
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  )
}
