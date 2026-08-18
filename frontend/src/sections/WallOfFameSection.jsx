import React, { useState } from "react";
import Button from "../components/Button.jsx";
import { fullName } from "../lib/domain.js";

export default function WallOfFameSection({
  wallOfFameCategories,
  getPassportStyle,
  getPassportDotStyle,
  normalizePassport,
  wallOfFameSexFilter,
  setWallOfFameSexFilter,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasMoreEntries = wallOfFameCategories.some((category) => category.entries.length > 3);

  return (
    <>
      <div className="card">
        <div className="card-header">
          <h2>Tableau d’honneur</h2>
          <div className="group">
            <select
              id="wall-of-fame-sex-filter"
              aria-label="Filtrer le Tableau d’honneur par sexe"
              value={wallOfFameSexFilter}
              onChange={(event) => setWallOfFameSexFilter(event.target.value)}
            >
              <option value="all">Tous</option>
              <option value="h">H</option>
              <option value="f">F</option>
            </select>
            {hasMoreEntries && (
              <Button
                type="button"
                variant="secondary"
                aria-expanded={isExpanded}
                aria-controls="wall-of-fame-rankings"
                onClick={() => setIsExpanded((expanded) => !expanded)}
              >
                {isExpanded ? "Réduire" : "Afficher tout"}
              </Button>
            )}
          </div>
        </div>
        <div className="grid three" id="wall-of-fame-rankings">
          {wallOfFameCategories.map((category) => {
            const visibleEntries = isExpanded ? category.entries : category.entries.slice(0, 3);

            return (
              <div className="subcard" key={category.title}>
                <div className="card-header">
                  <h3>{category.title}</h3>
                </div>
                <div className="stack">
                  {visibleEntries.length === 0 ? (
                    <div className="muted-box">Pas encore de classement.</div>
                  ) : (
                    visibleEntries.map((entry) => (
                      <div
                        className="participant-row passport-row"
                        key={entry.participant.id}
                        style={getPassportStyle(entry.participant)}
                        data-passport={normalizePassport(entry.participant.passport)}
                      >
                        <span className="participant-identity">
                          <span aria-hidden="true">
                            {entry.rank === 1
                              ? "🥇"
                              : entry.rank === 2
                                ? "🥈"
                                : entry.rank === 3
                                  ? "🥉"
                                  : `${entry.rank}.`}
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
            );
          })}
        </div>
      </div>
    </>
  );
}
