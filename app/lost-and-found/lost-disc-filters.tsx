"use client"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface LostDiscFiltersProps {
  discs: any[]
  onFilterChange: (filters: { name: string | null; brand: string | null }) => void
  currentFilters: { name: string | null; brand: string | null }
}

export default function LostDiscFilters({ discs, onFilterChange, currentFilters }: LostDiscFiltersProps) {
  // Get unique disc names and brands for filter options
  const uniqueNames = Array.from(new Set(discs.map((disc) => disc.name))).sort()
  const uniqueBrands = Array.from(new Set(discs.map((disc) => disc.brand))).sort()

  const handleNameChange = (value: string) => {
    // If "all" is selected, set to null
    const newNameFilter = value === "all" ? null : value
    onFilterChange({
      ...currentFilters,
      name: newNameFilter,
    })
  }

  const handleBrandChange = (value: string) => {
    // If "all" is selected, set to null
    const newBrandFilter = value === "all" ? null : value
    onFilterChange({
      ...currentFilters,
      brand: newBrandFilter,
    })
  }

  const clearFilters = () => {
    onFilterChange({
      name: null,
      brand: null,
    })
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-4">
      <div className="flex-1">
        <Select value={currentFilters.name || "all"} onValueChange={handleNameChange}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by name" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Names</SelectItem>
            {uniqueNames.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1">
        <Select value={currentFilters.brand || "all"} onValueChange={handleBrandChange}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by brand" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Brands</SelectItem>
            {uniqueBrands.map((brand) => (
              <SelectItem key={brand} value={brand}>
                {brand}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {(currentFilters.name || currentFilters.brand) && (
        <Button variant="outline" size="icon" onClick={clearFilters} className="shrink-0">
          <X className="h-4 w-4" />
          <span className="sr-only">Clear filters</span>
        </Button>
      )}
    </div>
  )
}
