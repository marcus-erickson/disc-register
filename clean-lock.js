const fs = require("fs")
const path = require("path")

// Path to the lock file
const lockFilePath = path.join(__dirname, "pnpm-lock.yaml")

console.log("Cleaning pnpm-lock.yaml file...")

if (fs.existsSync(lockFilePath)) {
  try {
    // Read the lock file
    const lockFileContent = fs.readFileSync(lockFilePath, "utf8")

    // Remove any lines containing URL imports
    const cleanedContent = lockFileContent
      .split("\n")
      .filter((line) => !line.includes("https%3A") && !line.includes("/https:"))
      .join("\n")

    // Write the cleaned content back
    fs.writeFileSync(lockFilePath, cleanedContent, "utf8")
    console.log("Successfully cleaned pnpm-lock.yaml")
  } catch (error) {
    console.error("Error cleaning lock file:", error)
  }
}
