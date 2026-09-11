// أيقونات SVG خفيفة مرسومة يدويا (stroke موحد) — بدون مكتبات
import type { SVGProps } from "react";

function Base({ children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  );
}

export const IconDashboard = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></Base>
);
export const IconCart = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}><circle cx="9" cy="20" r="1.5" /><circle cx="17" cy="20" r="1.5" /><path d="M3 3h2l2.5 12.5h11L21 7H6" /></Base>
);
export const IconBox = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}><path d="M21 8l-9-5-9 5v8l9 5 9-5V8z" /><path d="M3 8l9 5 9-5" /><path d="M12 13v8" /></Base>
);
export const IconReceipt = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}><path d="M6 3h12v18l-2-1.5L14 21l-2-1.5L10 21l-2-1.5L6 21V3z" /><path d="M9 8h6M9 12h6" /></Base>
);
export const IconUsers = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}><circle cx="9" cy="8" r="3.5" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /><circle cx="17" cy="9" r="2.5" /><path d="M16 14.5c2.8.4 5 2.6 5 5.5" /></Base>
);
export const IconTruck = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}><path d="M2 6h12v10H2z" /><path d="M14 10h4l4 4v2h-8" /><circle cx="6.5" cy="18" r="1.8" /><circle cx="17.5" cy="18" r="1.8" /></Base>
);
export const IconWallet = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 10h18" /><circle cx="17" cy="14.5" r="1" /></Base>
);
export const IconDelivery = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}><circle cx="6" cy="17" r="3" /><circle cx="18" cy="17" r="3" /><path d="M6 17h6l3-7h3" /><path d="M12 6h4v4" /></Base>
);
export const IconWrench = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}><path d="M14.5 6.5a4 4 0 0 0-5.6 4.9L4 16.3V20h3.7l4.9-4.9a4 4 0 0 0 4.9-5.6l-2.8 2.8-2.4-2.4 2.2-3.4z" /></Base>
);
export const IconReturns = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}><path d="M4 9a8 8 0 0 1 14-3l2 2" /><path d="M20 4v4h-4" /><path d="M20 15a8 8 0 0 1-14 3l-2-2" /><path d="M4 20v-4h4" /></Base>
);
export const IconClock = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3.5 2" /></Base>
);
export const IconUpload = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}><path d="M12 16V4" /><path d="M7 9l5-5 5 5" /><path d="M4 20h16" /></Base>
);
export const IconChart = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}><path d="M4 20V4" /><path d="M4 20h16" /><path d="M8 16v-5M12 16V8M16 16v-3" /></Base>
);
export const IconCode = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}><path d="M8 9l-4 3 4 3" /><path d="M16 9l4 3-4 3" /><path d="M13 5l-2 14" /></Base>
);
export const IconId = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="8.5" cy="11" r="2" /><path d="M5.5 16c.6-1.6 1.7-2.5 3-2.5s2.4.9 3 2.5" /><path d="M14 9h4M14 13h4" /></Base>
);
export const IconShield = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}><path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3z" /><path d="M9.5 12l2 2 3.5-4" /></Base>
);
export const IconGear = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}><circle cx="12" cy="12" r="3" /><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3 1a7 7 0 0 0-2-1.2L14.2 3h-4l-.4 2.7a7 7 0 0 0-2 1.2l-2.3-1-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 2 1.2l.4 2.7h4l.4-2.7a7 7 0 0 0 2-1.2l2.3 1 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z" /></Base>
);
export const IconBell = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6" /><path d="M10 20a2 2 0 0 0 4 0" /></Base>
);
export const IconMenu = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}><path d="M4 7h16M4 12h16M4 17h16" /></Base>
);
export const IconX = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}><path d="M6 6l12 12M18 6L6 18" /></Base>
);
export const IconLogout = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}><path d="M14 4h-8v16h8" /><path d="M10 12h11" /><path d="M18 8l3 4-3 4" /></Base>
);
export const IconStar = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3z" /></Base>
);
export const IconStarFilled = (p: SVGProps<SVGSVGElement>) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden {...p}><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3z" /></svg>
);
export const IconCollapse = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}><path d="M14 6l-6 6 6 6" /><path d="M20 6l-6 6 6 6" /></Base>
);
export const IconArrowLeft = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}><path d="M19 12H5" /><path d="M11 6l-6 6 6 6" /></Base>
);
export const IconPrint = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}><path d="M7 8V3h10v5" /><rect x="4" y="8" width="16" height="8" rx="2" /><rect x="7" y="13" width="10" height="8" /></Base>
);
export const IconSearch = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></Base>
);
export const IconPlus = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}><path d="M12 5v14M5 12h14" /></Base>
);
export const IconCheck = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}><path d="M5 12.5l4.5 4.5L19 7.5" /></Base>
);
export const IconStore = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}><path d="M4 9l1.5-5h13L20 9" /><path d="M4 9h16v11H4z" /><path d="M9.5 20v-6h5v6" /></Base>
);
export const IconTrend = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}><path d="M3 17l6-6 4 4 8-8" /><path d="M15 7h6v6" /></Base>
);
export const IconClipboard = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4a3 3 0 0 1 6 0" /><path d="M9 11l2 2 4-4" /></Base>
);
