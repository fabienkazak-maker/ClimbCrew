import React from "react";
import { getGeckoLevelInfo } from "../lib/gecko-level.js";

const LEVEL_ACCENTS = ["#65a30d", "#4d7c0f", "#0284c7", "#2563eb", "#7c3aed", "#9333ea", "#d97706", "#0ea5e9"];

export default function ProfileGecko({ grade, sexe }) {
  const { level, label, variant } = getGeckoLevelInfo(grade, sexe);
  const accent = variant === "feminine" ? "#db2777" : LEVEL_ACCENTS[level - 1];
  const gearAccent = variant === "feminine" ? "#c026d3" : "#2563eb";
  const hasShoes = level >= 2;
  const hasHarness = level >= 3;
  const hasQuickdraws = level >= 4;
  const hasPremiumGear = level >= 5;
  const isExpert = level >= 6;
  const isMaster = level >= 7;
  const isCrystal = level >= 8;

  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <div className="card-header" style={{ alignItems: "center" }}>
        <div>
          <h3 style={{ margin: 0 }}>Mon Gecko</h3>
          <div className="small">Niveau {level}/8 · {label}{grade ? ` · CPR ${grade}` : ""}</div>
        </div>
        <span className="pill" style={{ borderColor: accent, color: "inherit" }}>{label}</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", placeItems: "center", marginTop: 8 }}>
        <svg
          viewBox="0 0 320 250"
          width="100%"
          style={{ maxWidth: 430, display: "block" }}
          role="img"
          aria-label={`Gecko ${label}, niveau ${level} sur 8`}
        >
          <defs>
            <linearGradient id="gecko-wall" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stopColor="#e5e7eb" />
              <stop offset="1" stopColor="#94a3b8" />
            </linearGradient>
            <linearGradient id="gecko-body" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stopColor="#bef264" />
              <stop offset="0.55" stopColor="#65a30d" />
              <stop offset="1" stopColor="#3f6212" />
            </linearGradient>
            <filter id="gecko-shadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="5" stdDeviation="5" floodOpacity="0.22" />
            </filter>
          </defs>

          <rect x="6" y="6" width="308" height="238" rx="24" fill="#f8fafc" stroke={accent} strokeWidth="4" />
          <path d={isExpert ? "M210 10 L314 10 L314 240 L168 240 Z" : "M220 10 L314 10 L314 240 L205 240 Z"} fill="url(#gecko-wall)" />

          {[[264,48,"#f97316"],[238,84,"#7c3aed"],[279,118,"#0ea5e9"],[231,157,"#eab308"],[274,200,"#ef4444"]].map(([cx,cy,fill], index) => (
            <path key={index} d={`M${cx-10} ${cy} q10 -12 22 -2 q5 8 -3 16 q-16 7 -29 -2 q-5 -6 0 -12z`} fill={fill} opacity="0.9" />
          ))}

          {isCrystal && (
            <g opacity="0.9">
              <path d="M42 190 l13 -25 14 25 -14 18z" fill="#67e8f9" stroke="#0284c7" strokeWidth="2" />
              <path d="M78 54 l10 -20 11 20 -10 14z" fill="#bae6fd" stroke="#0284c7" strokeWidth="2" />
              <path d="M286 36 l9 -18 10 18 -10 13z" fill="#a5f3fc" stroke="#0284c7" strokeWidth="2" />
            </g>
          )}

          <g filter="url(#gecko-shadow)">
            <path d="M95 177 C47 196 45 228 82 226 C102 225 114 215 115 203 C116 193 106 188 99 194 C94 199 97 207 104 207" fill="none" stroke="#4d7c0f" strokeWidth="13" strokeLinecap="round" />
            <ellipse cx="137" cy="137" rx="47" ry="61" fill="url(#gecko-body)" transform={isExpert ? "rotate(-12 137 137)" : "rotate(-4 137 137)"} />
            <ellipse cx="132" cy="70" rx="47" ry="38" fill="url(#gecko-body)" transform="rotate(-8 132 70)" />

            <ellipse cx="114" cy="58" rx="15" ry="18" fill="#fff" />
            <ellipse cx="149" cy="53" rx="15" ry="18" fill="#fff" />
            <ellipse cx="116" cy="60" rx="7" ry="10" fill="#111827" />
            <ellipse cx="151" cy="55" rx="7" ry="10" fill="#111827" />
            <circle cx="119" cy="56" r="2.5" fill="#fff" />
            <circle cx="154" cy="51" r="2.5" fill="#fff" />
            <path d="M119 83 Q136 94 154 80" fill="none" stroke="#365314" strokeWidth="4" strokeLinecap="round" />

            {variant === "feminine" && (
              <g>
                <path d="M95 38 q-17 -9 -21 7 q13 2 18 11" fill={accent} />
                <path d="M99 34 q-8 -18 8 -21 q4 13 -1 22" fill="#f472b6" />
              </g>
            )}

            {[[-14,-8],[12,-11],[25,4],[-22,9],[5,15]].map(([dx,dy], i) => (
              <circle key={i} cx={132 + dx} cy={122 + dy} r="4" fill="#3f6212" opacity="0.8" />
            ))}

            <path d={isExpert ? "M117 116 C92 108 74 90 63 73" : "M111 118 C87 111 72 100 60 87"} fill="none" stroke="#65a30d" strokeWidth="15" strokeLinecap="round" />
            <circle cx={isExpert ? 61 : 58} cy={isExpert ? 70 : 84} r="9" fill="#84cc16" />
            <path d={isExpert ? "M157 113 C180 94 202 77 220 60" : "M158 116 C181 104 199 88 215 73"} fill="none" stroke="#65a30d" strokeWidth="15" strokeLinecap="round" />
            <circle cx={isExpert ? 223 : 218} cy={isExpert ? 57 : 70} r="9" fill="#84cc16" />

            <path d="M120 180 C102 194 91 207 82 219" fill="none" stroke="#65a30d" strokeWidth="16" strokeLinecap="round" />
            <path d="M154 181 C171 194 184 207 193 220" fill="none" stroke="#65a30d" strokeWidth="16" strokeLinecap="round" />

            {hasShoes && (
              <g>
                <path d="M70 218 q14 -9 26 0 q-8 14 -30 10z" fill={gearAccent} stroke="#1e293b" strokeWidth="3" />
                <path d="M181 219 q14 -9 27 1 q-8 13 -30 9z" fill={gearAccent} stroke="#1e293b" strokeWidth="3" />
                <rect x="92" y="158" width="26" height="29" rx="8" fill={hasPremiumGear ? accent : "#64748b"} stroke="#334155" strokeWidth="3" />
                <circle cx="105" cy="164" r="4" fill="#fff" opacity="0.8" />
              </g>
            )}

            {hasHarness && (
              <g>
                <path d="M103 157 Q136 172 169 156" fill="none" stroke="#1e293b" strokeWidth="9" strokeLinecap="round" />
                <path d="M112 158 L119 183 M160 158 L154 184" stroke={accent} strokeWidth="6" strokeLinecap="round" />
                <path d="M139 164 C143 190 145 215 146 238" fill="none" stroke={isCrystal ? "#38bdf8" : "#f59e0b"} strokeWidth="5" strokeLinecap="round" />
              </g>
            )}

            {hasQuickdraws && (
              <g>
                <path d="M167 165 q13 8 4 22" fill="none" stroke="#475569" strokeWidth="4" />
                <path d="M174 183 l11 11" stroke="#f97316" strokeWidth="5" strokeLinecap="round" />
                <path d="M100 168 q-11 8 -2 20" fill="none" stroke="#475569" strokeWidth="4" />
                {hasPremiumGear && <path d="M95 184 l-10 12" stroke="#06b6d4" strokeWidth="5" strokeLinecap="round" />}
              </g>
            )}

            {isMaster && (
              <g>
                <path d="M127 27 l8 -13 8 13 14 -7 -3 20 -39 2 -3 -21z" fill="#fbbf24" stroke="#b45309" strokeWidth="2" />
                <circle cx="135" cy="17" r="3" fill="#fff7ed" />
              </g>
            )}
          </g>

          <circle cx="37" cy="37" r="22" fill={accent} />
          <text x="37" y="45" textAnchor="middle" fontSize="23" fontWeight="800" fill="#fff">{level}</text>
          <text x="20" y="230" fontSize="17" fontWeight="800" fill="#0f172a">{label.toUpperCase()}</text>
        </svg>
      </div>
    </div>
  );
}
