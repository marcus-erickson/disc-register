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
