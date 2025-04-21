/**
 * Formats a kebab-case brand name to a properly capitalized display name
 */
export function formatBrandName(brand: string): string {
  // Map of special brand names that need custom formatting
  const brandMap: Record<string, string> = {
    innova: "Innova",
    discraft: "Discraft",
    "dynamic-discs": "Dynamic Discs",
    "latitude-64": "Latitude 64",
    prodigy: "Prodigy",
    mvp: "MVP",
    other: "Other",
  }

  // Return the mapped name if it exists
  if (brand in brandMap) {
    return brandMap[brand]
  }

  // Otherwise, capitalize each word
  return brand
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

/**
 * Normalizes a brand name to a standard format for storage in the database
 * This ensures consistency regardless of capitalization, spacing, or punctuation
 */
export function normalizeBrandName(brand: string): string {
  if (!brand) return ""

  // Convert to lowercase for case-insensitive matching
  const brandLower = brand.toLowerCase().trim()

  // Map of known brand variations to their normalized kebab-case values
  const brandMap: Record<string, string> = {
    // Innova variations
    innova: "innova",
    "innova champion discs": "innova",
    "innova discs": "innova",

    // Discraft variations
    discraft: "discraft",
    "dis craft": "discraft",
    "disc craft": "discraft",

    // Dynamic Discs variations
    "dynamic discs": "dynamic-discs",
    "dynamic disc": "dynamic-discs",
    "dynamics discs": "dynamic-discs",
    "dynamics-discs": "dynamic-discs",
    "dynamic-discs": "dynamic-discs",
    dd: "dynamic-discs",

    // Latitude 64 variations
    "latitude 64": "latitude-64",
    latitude64: "latitude-64",
    "lat 64": "latitude-64",
    lat64: "latitude-64",
    "latitude-64": "latitude-64",
    l64: "latitude-64",

    // Prodigy variations
    prodigy: "prodigy",
    "prodigy disc": "prodigy",

    // MVP variations
    mvp: "mvp",
    "mvp disc sports": "mvp",

    // Other common brands
    westside: "westside",
    discmania: "discmania",
    kastaplast: "kastaplast",
    gateway: "gateway",
    axiom: "axiom",
    streamline: "streamline",
    trilogy: "trilogy",
  }

  // Check for exact matches in our map
  if (brandMap[brandLower]) {
    return brandMap[brandLower]
  }

  // For partial matches, check if the input contains any of our known brands
  for (const [key, value] of Object.entries(brandMap)) {
    if (brandLower.includes(key)) {
      return value
    }
  }

  // If no match found, return "other" for unknown brands
  return "other"
}
