const fs = require("fs")
const path = require("path")
const { execSync } = require("child_process")

// Remove supabase functions directory
try {
  console.log("Removing supabase functions directory...")
  execSync("rm -rf supabase/functions")
  console.log("Successfully removed supabase functions directory")
} catch (error) {
  console.log("No supabase functions directory found or error removing it:", error.message)
}

// Clean package.json of any URL dependencies
try {
  console.log("Cleaning package.json...")
  const packageJsonPath = path.join(__dirname, "package.json")
  const packageJson = require(packageJsonPath)

  // Remove any dependencies that start with http or https
  if (packageJson.dependencies) {
    Object.keys(packageJson.dependencies).forEach((dep) => {
      if (
        dep.startsWith("http") ||
        (packageJson.dependencies[dep] && packageJson.dependencies[dep].startsWith("http"))
      ) {
        console.log(`Removing dependency: ${dep}`)
        delete packageJson.dependencies[dep]
      }
    })
  }

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))
  console.log("Successfully cleaned package.json")
} catch (error) {
  console.error("Error cleaning package.json:", error)
}

// Clean lock file
try {
  console.log("Cleaning pnpm-lock.yaml file...")
  const lockFilePath = path.join(__dirname, "pnpm-lock.yaml")

  if (fs.existsSync(lockFilePath)) {
    const lockFileContent = fs.readFileSync(lockFilePath, "utf8")

    // Remove any lines containing URL imports
    const cleanedContent = lockFileContent
      .split("\n")
      .filter((line) => !line.includes("https%3A") && !line.includes("/https:"))
      .join("\n")

    fs.writeFileSync(lockFilePath, cleanedContent, "utf8")
    console.log("Successfully cleaned pnpm-lock.yaml")
  } else {
    console.log("No pnpm-lock.yaml file found")
  }
} catch (error) {
  console.error("Error cleaning lock file:", error)
}
