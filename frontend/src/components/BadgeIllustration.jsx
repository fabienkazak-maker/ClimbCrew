import React from "react";

const ART = {
  premiere_croix: { primary: "#67b83f", secondary: "#2f6f2f", motif: "check" },
  premiere_tete: { primary: "#ef7f2d", secondary: "#9f3d16", motif: "lead" },
  premiere_moulinette: { primary: "#8b5cf6", secondary: "#4c1d95", motif: "toprope" },
  premier_a_vue: { primary: "#3ba7db", secondary: "#1d4f91", motif: "eye" },
  premier_flash: { primary: "#f7c844", secondary: "#d97706", motif: "flash" },
  cap_5c: { primary: "#3f9f5a", secondary: "#14532d", motif: "grade", label: "5c" },
  club_6a: { primary: "#3b82f6", secondary: "#1e3a8a", motif: "grade", label: "6a" },
  club_6b: { primary: "#3156a6", secondary: "#172554", motif: "grade", label: "6b" },
  club_6c: { primary: "#8b5cf6", secondary: "#4c1d95", motif: "grade", label: "6c" },
  club_7a: { primary: "#d6a92f", secondary: "#172554", motif: "grade", label: "7a" },
  explorateur: { primary: "#148a87", secondary: "#164e63", motif: "compass" },
  tour_de_salle: { primary: "#0ea5a8", secondary: "#155e75", motif: "routes" },
  polyvalent: { primary: "#7c5ce0", secondary: "#334155", motif: "multi" },
  habitue: { primary: "#20b2aa", secondary: "#115e59", motif: "session", label: "5" },
  fidele: { primary: "#0f8f88", secondary: "#134e4a", motif: "session", label: "25" },
  oeil_ouvreur: { primary: "#6485a6", secondary: "#334155", motif: "setterEye" },
  critique_voies: { primary: "#e6a928", secondary: "#92400e", motif: "review" },
  collectionneur: { primary: "#9aa7b7", secondary: "#475569", motif: "count", label: "50" },
  centurion: { primary: "#e0ad32", secondary: "#7c4a13", motif: "count", label: "100" },
  cristal: { primary: "#55c9e8", secondary: "#5b4fb2", motif: "crystal" },
};

function BadgeShape({ badge, fillId, metalId }) {
  if (badge.shape === "shield") {
    return <path d="M18 12 L82 12 L91 27 L84 72 L50 94 L16 72 L9 27 Z" fill={`url(#${fillId})`} stroke={`url(#${metalId})`} strokeWidth="5" />;
  }
  if (badge.shape === "patch") {
    return <path d="M50 7 L82 20 L94 50 L82 80 L50 93 L18 80 L6 50 L18 20 Z" fill={`url(#${fillId})`} stroke={`url(#${metalId})`} strokeWidth="5" />;
  }
  if (badge.shape === "ribbon") {
    return <>
      <path d="M30 66 L25 96 L48 82 L50 69 Z" fill="#d6d3d1" opacity=".9" />
      <path d="M70 66 L75 96 L52 82 L50 69 Z" fill="#b8b4af" opacity=".9" />
      <circle cx="50" cy="47" r="38" fill={`url(#${fillId})`} stroke={`url(#${metalId})`} strokeWidth="5" />
    </>;
  }
  if (badge.shape === "rosette") {
    return <>
      <path d="M50 5 60 15 75 10 81 25 96 31 89 46 98 58 83 67 84 83 68 84 58 97 45 88 30 96 24 80 8 75 16 59 3 48 16 37 9 21 26 18 34 3 Z" fill={`url(#${fillId})`} stroke={`url(#${metalId})`} strokeWidth="4" />
      <circle cx="50" cy="50" r="27" fill="rgba(8,15,25,.22)" stroke="rgba(255,255,255,.45)" strokeWidth="2" />
    </>;
  }
  if (badge.shape === "crystal") {
    return <path d="M50 5 82 20 95 58 50 96 5 58 18 20 Z" fill={`url(#${fillId})`} stroke={`url(#${metalId})`} strokeWidth="5" />;
  }
  return <>
    <path d="M22 16 Q50 4 78 16 L88 30 L82 78 Q50 95 18 78 L12 30 Z" fill={`url(#${fillId})`} stroke={`url(#${metalId})`} strokeWidth="5" />
    <circle cx="50" cy="19" r="8" fill="#263238" stroke="#d9d9d9" strokeWidth="4" />
  </>;
}

function Holds() {
  return <g opacity=".72" fill="#f3f4f6">
    <path d="M21 63 q6-7 12 0 l-2 6 h-8z" />
    <path d="M68 34 q6-8 12 0 l-3 6 h-7z" />
    <circle cx="71" cy="69" r="4" />
    <circle cx="34" cy="39" r="3.5" />
  </g>;
}

function Motif({ art }) {
  const common = { fill: "none", stroke: "#f8fafc", strokeWidth: 5, strokeLinecap: "round", strokeLinejoin: "round" };
  switch (art.motif) {
    case "check":
      return <><Holds /><path d="M28 54 43 68 72 35" {...common} strokeWidth="7" /></>;
    case "lead":
      return <><path d="M31 74 C35 54 45 60 47 42 C49 29 58 32 66 22" {...common} /><path d="M61 28 67 21 71 31" {...common} strokeWidth="4" /><circle cx="39" cy="58" r="5" fill="#263238" stroke="#f8fafc" strokeWidth="3" /></>;
    case "toprope":
      return <><path d="M31 72 C31 29 39 24 50 24 C61 24 69 29 69 72" {...common} /><path d="M45 31 50 24 55 31" {...common} strokeWidth="4" /><circle cx="50" cy="58" r="6" fill="#263238" stroke="#f8fafc" strokeWidth="3" /></>;
    case "eye":
      return <><Holds /><path d="M22 52 Q50 27 78 52 Q50 77 22 52 Z" {...common} strokeWidth="4" /><circle cx="50" cy="52" r="9" fill="#172554" stroke="#f8fafc" strokeWidth="4" /></>;
    case "flash":
      return <><Holds /><path d="M57 20 31 55 47 55 40 80 70 43 53 43 Z" fill="#fff" stroke="#7c4a13" strokeWidth="2" /></>;
    case "grade":
      return <><path d="M27 75 C35 60 37 49 48 43 C59 37 62 25 72 20" {...common} strokeWidth="3" opacity=".45" /><text x="50" y="62" textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize="31" fontWeight="900" fill="#fff" stroke="rgba(0,0,0,.28)" strokeWidth="1">{art.label}</text></>;
    case "compass":
      return <><circle cx="50" cy="50" r="25" fill="none" stroke="#fff" strokeWidth="4" /><path d="M58 36 53 53 36 61 44 44 Z" fill="#fff" /><path d="M50 17 V24 M50 76 V83 M17 50 H24 M76 50 H83" {...common} strokeWidth="3" /></>;
    case "routes":
      return <><path d="M27 75 C24 58 38 52 35 39 C33 29 39 23 44 19 M50 77 C55 62 46 50 55 39 C61 31 61 25 58 20 M72 75 C75 60 65 52 70 42 C74 34 78 28 76 21" {...common} strokeWidth="3" /><circle cx="27" cy="75" r="3" fill="#fff" /><circle cx="50" cy="77" r="3" fill="#fff" /><circle cx="72" cy="75" r="3" fill="#fff" /></>;
    case "multi":
      return <><path d="M23 64 37 35 50 64 64 31 79 64" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" /><circle cx="29" cy="31" r="6" fill="#22c55e" /><circle cx="50" cy="25" r="6" fill="#f59e0b" /><circle cx="72" cy="31" r="6" fill="#38bdf8" /></>;
    case "session":
      return <><path d="M29 33 H71 V69 H29 Z" fill="rgba(255,255,255,.14)" stroke="#fff" strokeWidth="4" /><path d="M37 27 V38 M63 27 V38 M29 44 H71" {...common} strokeWidth="3" /><text x="50" y="64" textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize={art.label === "25" ? "20" : "24"} fontWeight="900" fill="#fff">{art.label}</text></>;
    case "setterEye":
      return <><path d="M20 51 Q50 27 80 51 Q50 75 20 51 Z" {...common} strokeWidth="4" /><circle cx="50" cy="51" r="8" fill="#fff" /><circle cx="50" cy="51" r="3" fill="#334155" /><path d="M64 67 77 77" {...common} strokeWidth="4" /></>;
    case "review":
      return <><path d="M50 24 58 41 77 44 63 57 66 76 50 67 34 76 37 57 23 44 42 41 Z" fill="#fff" /><path d="M67 28 75 36 53 65 43 68 46 58 Z" fill="#713f12" stroke="#fff" strokeWidth="2" /></>;
    case "count":
      return <><path d="M25 68 C34 54 37 43 50 37 C62 31 68 24 75 18" {...common} strokeWidth="3" opacity=".5" /><text x="50" y="62" textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize={art.label === "100" ? "23" : "29"} fontWeight="900" fill="#fff">{art.label}</text></>;
    case "crystal":
      return <><path d="M50 20 68 39 61 67 50 82 39 67 32 39 Z" fill="rgba(255,255,255,.5)" stroke="#fff" strokeWidth="3" /><path d="M50 20 V82 M32 39 H68 M39 67 50 39 61 67" fill="none" stroke="#fff" strokeWidth="2" opacity=".8" /><path d="M20 73 C34 67 40 72 50 66 C60 60 67 62 80 52" {...common} strokeWidth="3" /></>;
    default:
      return null;
  }
}

export default function BadgeIllustration({ badge }) {
  const art = ART[badge.id] || { primary: "#64748b", secondary: "#334155", motif: "check" };
  const safeId = badge.id.replace(/[^a-zA-Z0-9_-]/g, "");
  const fillId = `badge-fill-${safeId}`;
  const metalId = `badge-metal-${safeId}`;
  const shineId = `badge-shine-${safeId}`;

  return (
    <span className="participant-badge-artwork" aria-hidden="true">
      <svg viewBox="0 0 100 100" width="100%" height="100%" role="presentation" focusable="false">
        <defs>
          <linearGradient id={fillId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={art.primary} />
            <stop offset="1" stopColor={art.secondary} />
          </linearGradient>
          <linearGradient id={metalId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f5f2ea" />
            <stop offset=".25" stopColor="#7d858c" />
            <stop offset=".55" stopColor="#ece8df" />
            <stop offset="1" stopColor="#5b6268" />
          </linearGradient>
          <linearGradient id={shineId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity=".38" />
            <stop offset=".45" stopColor="#fff" stopOpacity=".03" />
            <stop offset="1" stopColor="#000" stopOpacity=".18" />
          </linearGradient>
          <filter id={`badge-shadow-${safeId}`} x="-25%" y="-25%" width="150%" height="150%">
            <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#000" floodOpacity=".4" />
          </filter>
        </defs>
        <g filter={`url(#badge-shadow-${safeId})`}>
          <BadgeShape badge={badge} fillId={fillId} metalId={metalId} />
          <path d="M18 27 Q50 12 82 27" fill="none" stroke={`url(#${shineId})`} strokeWidth="8" strokeLinecap="round" opacity=".45" />
          <Motif art={art} />
        </g>
      </svg>
    </span>
  );
}

export const BADGE_ART_IDS = Object.freeze(Object.keys(ART));
