import type React from "react"

interface DiscGolfIconProps {
  className?: string
}

export const DiscGolfIcon: React.FC<DiscGolfIconProps> = ({ className = "" }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Outer circle (disc) */}
      <circle cx="12" cy="12" r="10" />

      {/* Inner circle (flight plate center) */}
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}
