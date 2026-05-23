import Image from "next/image";

interface ZyncraLogoProps {
  height?: number;
  /** En fondos oscuros envuelve el logo en una píldora semitransparente */
  dark?: boolean;
}

export default function ZyncraLogo({ height = 36, dark = false }: ZyncraLogoProps) {
  const width = Math.round(height * 3.07);
  const img = (
    <Image
      src="/zyncra-logo.png"
      alt="Zyncra"
      width={width}
      height={height}
      priority
      style={{ height, width: "auto", display: "block" }}
    />
  );

  if (dark) {
    return (
      <div style={{
        background: "rgba(255,255,255,0.12)",
        borderRadius: 10,
        padding: "5px 12px",
        display: "inline-flex",
        alignItems: "center",
      }}>
        {img}
      </div>
    );
  }

  return img;
}
