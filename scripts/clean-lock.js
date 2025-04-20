const fs = require("fs")
const path = require("path")

// Path to the lock file
const lockFilePath = path.join(__dirname, "..", "pnpm-lock.yaml")

console.log("Cleaning pnpm-lock.yaml file...")

if (fs.existsSync(lockFilePath)) {
  try {
    // Read the lock file
    const lockFileContent = fs.readFileSync(lockFilePath, "utf8")

    // Check if it contains problematic URL imports
    if (lockFileContent.includes("https%3A") || lockFileContent.includes("/https:")) {
      console.log("Found problematic URL imports in pnpm-lock.yaml")

      // Replace or remove the problematic lines
      // This is a simple approach - in a real scenario, you might want to parse the YAML properly
      const lines = lockFileContent.split("\n")
      const cleanedLines = lines.filter((line) => {
        return !line.includes("https%3A") && !line.includes("/https:")
      })

      // Write the cleaned content back
      fs.writeFileSync(lockFilePath, cleanedLines.join("\n"), "utf8")
      console.log("Cleaned pnpm-lock.yaml file")
    } else {
      console.log("No problematic URL imports found in pnpm-lock.yaml")
    }
  } catch (error) {
    console.error("Error cleaning lock file:", error)
  }
} else {
  console.log("Lock file not found:", lockFilePath)
}
