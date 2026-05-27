// Shared SVG icon set for Zyncra landing pages

import type { CSSProperties, ReactNode } from "react";

type IconProps = {
  size?: number;
  className?: string;
  style?: CSSProperties;
  strokeWidth?: number;
};

type WrapperProps = IconProps & { children: ReactNode };

const Icon = ({ children, size = 20, className = "", style = {}, strokeWidth = 1.6 }: WrapperProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
  >
    {children}
  </svg>
);

export const IconCalendar = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 9h18M8 3v4M16 3v4" />
    <circle cx="8" cy="14" r="1" fill="currentColor" stroke="none" />
    <circle cx="12" cy="14" r="1" fill="currentColor" stroke="none" />
    <circle cx="16" cy="14" r="1" fill="currentColor" stroke="none" />
  </Icon>
);
export const IconChat = (p: IconProps) => (
  <Icon {...p}>
    <path d="M21 12a8 8 0 0 1-11.5 7.2L4 21l1.8-5.5A8 8 0 1 1 21 12z" />
    <path d="M8 11h.01M12 11h.01M16 11h.01" strokeLinecap="round" />
  </Icon>
);
export const IconCard = (p: IconProps) => (
  <Icon {...p}>
    <rect x="2.5" y="6" width="19" height="13" rx="2" />
    <path d="M2.5 10h19M6 15h3" />
  </Icon>
);
export const IconStar = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.8 6.6 19.5l1.2-6L3.3 9.3l6.1-.7L12 3z" />
  </Icon>
);
export const IconReceipt = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2V3z" />
    <path d="M9 8h6M9 12h6M9 16h4" />
  </Icon>
);
export const IconUsers = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
    <circle cx="17" cy="9" r="2.6" />
    <path d="M16 14.2c2.8.5 5 2.8 5 5.8" />
  </Icon>
);
export const IconChart = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 21V3M3 21h18" />
    <path d="M7 17V10M11 17V7M15 17V12M19 17V5" />
  </Icon>
);
export const IconSparkle = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
  </Icon>
);
export const IconCheck = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 12.5l5 5L20 6.5" />
  </Icon>
);
export const IconX = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Icon>
);
export const IconArrow = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 12h14M13 5l7 7-7 7" />
  </Icon>
);
export const IconPlay = (p: IconProps) => (
  <Icon {...p}>
    <path d="M7 4.5v15l13-7.5-13-7.5z" fill="currentColor" />
  </Icon>
);
export const IconShield = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3z" />
    <path d="M9 12l2 2 4-4" />
  </Icon>
);
export const IconScissors = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="6" cy="6" r="3" />
    <circle cx="6" cy="18" r="3" />
    <path d="M20 4L8.5 15.5M20 20L8.5 8.5M14 12l6 0" />
  </Icon>
);
export const IconSpa = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 22c0-5 0-9 0-9M7 13c0-3 2-5 5-5s5 2 5 5" />
    <path d="M12 8c-2-2-5-2-7 0 2 3 5 4 7 4M12 8c2-2 5-2 7 0-2 3-5 4-7 4" />
  </Icon>
);
export const IconHand = (p: IconProps) => (
  <Icon {...p}>
    <path d="M8 11V5a1.5 1.5 0 0 1 3 0v6M11 9V4a1.5 1.5 0 0 1 3 0v7M14 9V5a1.5 1.5 0 0 1 3 0v9c0 3.5-2 7-6 7-3 0-5-2-6-4l-3-5c-.5-1 .5-2 1.5-1.5L8 13" />
  </Icon>
);
export const IconHeart = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 21s-8-5-8-11a5 5 0 0 1 8-4 5 5 0 0 1 8 4c0 6-8 11-8 11z" />
  </Icon>
);
export const IconTooth = (p: IconProps) => (
  <Icon {...p}>
    <path d="M7 4c-2 0-3 1.5-3 4 0 2 .5 3 1 5l1 5c.3 1.5 1.5 3 3 3 1 0 1.5-1 2-3l1-3 1 3c.5 2 1 3 2 3 1.5 0 2.7-1.5 3-3l1-5c.5-2 1-3 1-5 0-2.5-1-4-3-4-1.5 0-3 1-5 1S8.5 4 7 4z" />
  </Icon>
);
export const IconPaw = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="6" cy="10" r="2" />
    <circle cx="10" cy="6" r="2" />
    <circle cx="14" cy="6" r="2" />
    <circle cx="18" cy="10" r="2" />
    <path d="M8 18c0-2 1.8-4 4-4s4 2 4 4c0 1.6-1.4 3-3 3h-2c-1.6 0-3-1.4-3-3z" />
  </Icon>
);
export const IconLotus = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 21c-5 0-9-3-9-3s2-5 6-5M12 21c5 0 9-3 9-3s-2-5-6-5M12 21V8M12 8c-2 0-4 2-4 5M12 8c2 0 4 2 4 5M12 8c0-3 2-5 2-5s-1 2-1 5M12 8c0-3-2-5-2-5s1 2 1 5" />
  </Icon>
);
export const IconCamera = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 8h4l2-3h6l2 3h4v11H3z" />
    <circle cx="12" cy="13" r="3.5" />
  </Icon>
);
export const IconEye = (p: IconProps) => (
  <Icon {...p}>
    <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" />
    <circle cx="12" cy="12" r="3" />
  </Icon>
);
export const IconBrush = (p: IconProps) => (
  <Icon {...p}>
    <path d="M16 3l5 5-11 11H5v-5L16 3z" />
    <path d="M14 5l5 5M5 19l-2 2" />
  </Icon>
);
export const IconWhatsapp = (p: IconProps) => (
  <Icon {...p}>
    <path d="M21 12a9 9 0 0 1-13.5 7.8L3 21l1.3-4.5A9 9 0 1 1 21 12z" />
    <path d="M9 9.5c0-.5.4-1 1-1h.5c.3 0 .6.2.7.5l.6 1.5c.1.3 0 .6-.2.8L11 12c.6 1.2 1.6 2.2 2.8 2.8l.7-.6c.2-.2.5-.3.8-.2l1.5.6c.3.1.5.4.5.7v.5c0 .6-.4 1-1 1-3.5 0-6.5-3-6.5-6.5 0 0-.5-1.3-.8-.8z" />
  </Icon>
);
export const IconBolt = (p: IconProps) => (
  <Icon {...p}>
    <path d="M11 2L4 13h6l-1 9 8-12h-7l1-8z" />
  </Icon>
);
export const IconGlobe = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
  </Icon>
);
