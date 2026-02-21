import { useState } from "react";

interface SourceLogoProps {
  name: string;
  domain?: string;
  size?: number;
  className?: string;
}

const SourceLogo = ({ name, domain, size = 32, className = "" }: SourceLogoProps) => {
  const [failed, setFailed] = useState(false);

  if (!domain || failed) {
    return (
      <div
        className={`rounded-full bg-secondary border border-border flex items-center justify-center shrink-0 ${className}`}
        style={{ width: size, height: size }}
      >
        <span
          className="font-semibold text-muted-foreground"
          style={{ fontSize: size * 0.4 }}
        >
          {name.charAt(0).toUpperCase()}
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
