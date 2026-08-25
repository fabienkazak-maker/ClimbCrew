import React, { useState } from "react";
import { fullName } from "../lib/domain.js";

export default function WallOfFameSection({
  wallOfFameCategories,
  getPassportStyle,
  getPassportDotStyle,
  normalizePassport,
  wallOfFameSexFilter,
  setWallOfFameSexFilter,
}) {
  const [expandedCategories, setExpandedCategories] = useState({});

  function toggleCategory(title) {
    setExpandedCategories((current) => ({
      ...current,
      [title]: !current[title],
    }));
  }

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
          </div>
        </div>
        <div className="grid three" id="wall-of-fame-rankings">
          {wallOfFameCategories.map((category) => {
            const canExpand = category.entries.length > 3;
            const isExpanded = Boolean(expandedCategories[category.title]);
            const visibleEntries = isExpanded ? category.entries : category.entries.slice(0, 3);
            const categoryId = `wall-of-fame-${category.title.toLowerCase().replace(/[^a-z0-9]+/gi, "-")}`;

            return (
              <div className="subcard" key={category.title}>
                <div className="card-header">
                  <h3>
                    {canExpand ? (
                      <button
                        type="button"
                        aria-expanded={isExpanded}
                        aria-controls={categoryId}
                        aria-label={`${isExpanded ? "Compacter" : "Étendre"} le classement ${category.title}`}
                        onClick={() => toggleCategory(category.title)}
                        style={{
                          all: "unset",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.4rem",
                          cursor: "pointer",
                        }}
                      >
                        <span>{category.title}</span>
                        <span aria-hidden="true">{isExpanded ? "▴" : "▾"}</span>
                      </button>
                    ) : (
                      category.title
                    )}
                  </h3>
                </div>
                <div className="stack" id={categoryId}>
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
