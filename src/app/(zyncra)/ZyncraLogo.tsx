import Image from "next/image";

interface ZyncraLogoProps {
  height?: number;
  /** En footer oscuro pasa true para invertir el wordmark */
  invert?: boolean;
}

export default function ZyncraLogo({ height = 36, invert = false }: ZyncraLogoProps) {
  // El PNG original es 1534×500 px → ratio ~3.07
  const width = Math.round(height * 3.07);
  return (
    <Image
      src="/zyncra-logo.png"
      alt="Zyncra"
      width={width}
      height={height}
      priority
      style={{
        height,
        width: "auto",
        filter: invert ? "brightness(0) invert(1)" : "none",
      }}
    />
  );
}
