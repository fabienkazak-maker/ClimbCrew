import React from "react";
import { fullName } from "../lib/domain.js";

export default function WallOfFameSection({
  wallOfFameCategories,
  getPassportStyle,
  getPassportDotStyle,
  normalizePassport,
}) {
  return (
    <>
      <div className="card">
        <div className="card-header">
          <h2>Wall of Fame</h2>
          <span className="small">Les trois meilleurs de chaque classement</span>
        </div>
        <div className="grid three">
          {wallOfFameCategories.map((category) => (
            <div className="subcard" key={category.title}>
              <div className="card-header">
                <h3>{category.title}</h3>
              </div>
              <div className="stack">
                {category.entries.length === 0 ? (
                  <div className="muted-box">Pas encore de classement.</div>
                ) : (
                  category.entries.map((entry) => (
                    <div
                      className="participant-row passport-row"
                      key={entry.participant.id}
                      style={getPassportStyle(entry.participant)}
                      data-passport={normalizePassport(entry.participant.passport)}
                    >
                      <span className="participant-identity">
                        <span aria-hidden="true">
                          {entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : "🥉"}
                        </span>
                        <span className="passport-dot" style={getPassportDotStyle(entry.participant)} aria-hidden="true" />
                        <span className="participant-name">{fullName(entry.participant)}</span>
                      </span>
                      <strong style={{ color: "inherit" }}>{entry.displayValue}</strong>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
