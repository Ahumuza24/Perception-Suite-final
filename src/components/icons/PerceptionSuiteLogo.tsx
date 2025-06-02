import type { SVGProps } from 'react';

export function PerceptionSuiteLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 50"
      width="150"
      height="37.5"
      aria-label="PerceptionSuite Logo"
      {...props}
    >
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: 'hsl(var(--primary))', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: 'hsl(var(--primary))', stopOpacity: 0.7 }} />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="8" fill="url(#logoGradient)" />
      <path d="M15 10 L15 30 L25 30 L25 25 L20 25 L20 15 L25 15 L25 10 Z" fill="hsl(var(--primary-foreground))" />
      <path d="M25 20 L32 10 L32 30 Z" fill="hsl(var(--primary-foreground))" style={{ opacity: 0.7 }}/>
      <text
        x="50"
        y="30"
        fontFamily="Inter, sans-serif"
        fontSize="24"
        fontWeight="bold"
        fill="hsl(var(--foreground))"
        className="font-headline"
      >
        PerceptionSuite
      </text>
    </svg>
  );
}
