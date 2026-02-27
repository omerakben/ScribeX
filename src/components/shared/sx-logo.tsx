import Image from "next/image";

interface SXLogoProps {
  size?: number;
  className?: string;
}

export function SXLogo({ size = 24, className }: SXLogoProps) {
  return (
    <Image
      src="/SX-logo-mark.svg"
      alt="ScribeX"
      width={size}
      height={size}
      className={className}
      priority
    />
  );
}
