import React from 'react';

export interface PutmanLogoProps {
  color?: string; // circle color
  markColor?: string; // arrow + dots color
  textColor?: string; // follows your page text color / theme
  size?: number; // icon height in px
  showText?: boolean;
  className?: string;
}

// Usage:
//   <PutmanLogo />                                   -> orange default, with text
//   <PutmanLogo color="#7C5CFF" />                   -> custom circle color
//   <PutmanLogo showText={false} size={32} />        -> icon only
//   <PutmanLogo color={theme === "dark" ? "#FF8A5C" : "#FF6C37"} />
export default function PutmanLogo({
  color = "#FF6C37",      // circle color
  markColor = "#FFFFFF",  // arrow + dots color
  textColor = "currentColor", // follows your page text color / theme
  size = 40,              // icon height in px
  showText = true,
  className,
}: PutmanLogoProps) {
  const width = showText ? size * (250 / 64) : size;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={showText ? "0 0 250 64" : "0 0 64 64"}
      width={width}
      height={size}
      className={className}
      role="img"
      aria-label="Putman"
    >
      <circle cx="32" cy="32" r="32" fill={color} />
      <g fill="none" stroke={markColor} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 43L44 20" />
        <path d="M33 20H44V31" />
      </g>
      <circle cx="20" cy="44" r="5.5" fill={markColor} />
      <circle cx="32" cy="32" r="4" fill={markColor} />
      {showText && (
        <text
          x="80"
          y="44"
          fill={textColor}
          fontFamily="Inter, 'SF Pro Display', 'Segoe UI', Helvetica, Arial, sans-serif"
          fontSize="36"
          fontWeight="700"
          letterSpacing="-0.8"
        >
          Putman
        </text>
      )}
    </svg>
  );
}
