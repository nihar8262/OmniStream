import React from "react";

interface BrandIconProps {
  platform?: "instagram" | "linkedin";
  className?: string;
}

export function BrandIcon({ platform = "instagram", className = "h-5 w-5" }: BrandIconProps) {
  const isLinkedIn = platform === "linkedin";

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="brandGradInsta" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="50%" stopColor="#d4af37" />
          <stop offset="100%" stopColor="#e8a33d" />
        </linearGradient>
        <linearGradient id="brandGradLinkedIn" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="50%" stopColor="#0a66c2" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
      </defs>

      {/* Modern Vault / Stream Hexagonal Container */}
      <path
        d="M12 2L20.5 6.9V17.1L12 22L3.5 17.1V6.9L12 2Z"
        stroke={isLinkedIn ? "url(#brandGradLinkedIn)" : "url(#brandGradInsta)"}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-all duration-300"
      />

      {/* Central Stream Download Arrow */}
      <path
        d="M12 7V15M12 15L8.5 11.5M12 15L15.5 11.5"
        stroke={isLinkedIn ? "#38bdf8" : "#fef08a"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-all duration-300"
      />

      {/* Bottom Floating Arc */}
      <path
        d="M8 17.5C9.2 18.2 10.5 18.5 12 18.5C13.5 18.5 14.8 18.2 16 17.5"
        stroke={isLinkedIn ? "url(#brandGradLinkedIn)" : "url(#brandGradInsta)"}
        strokeWidth="1.75"
        strokeLinecap="round"
        className="transition-all duration-300"
      />
    </svg>
  );
}

export function LinkedInIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
    </svg>
  );
}
