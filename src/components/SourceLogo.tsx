import { useState } from "react";

interface SourceLogoProps {
  name: string;
  domain?: string;
  fallbackText?: string;
  size?: number;
  className?: string;
}

const SourceLogo = ({ name, domain, fallbackText, size = 32, className = "" }: SourceLogoProps) => {
  const [failed, setFailed] = useState(false);

  if (!domain || failed) {
    const label = fallbackText ?? name.charAt(0).toUpperCase();
    const fontSize = fallbackText ? Math.max(8, size * 0.28) : size * 0.4;
    return (
      <div
        className={`rounded-full bg-secondary border border-border flex items-center justify-center shrink-0 ${className}`}
        style={{ width: size, height: size }}
      >
        <span
          className="font-bold text-muted-foreground tracking-tight"
          style={{ fontSize }}
        >
          {label}
        </span>
      </div>
    );
  }

  return (
    <img
      src={`https://logo.clearbit.com/${domain}`}
      alt={name}
      className={`rounded-full bg-secondary border border-border object-cover shrink-0 ${className}`}
      style={{ width: size, height: size }}
      onError={() => setFailed(true)}
    />
  );
};

export default SourceLogo;
