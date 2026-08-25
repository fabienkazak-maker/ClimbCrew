import React from "react";
import Button from "../components/Button.jsx";
import { formatDateFr, nextBusinessDay } from "../lib/domain.js";

export default function Inscriptions({
  viewMode,
  setViewMode,
  selectedDate,
  setSelectedDate,
  ensureSessionsForDate,
  daySessions,
  weekSessions,
  renderSessionCard,
}) {
  return (
    <>
      <div className="toolbar">
        <div className="toolbar-row">
          <div className="group date-nav">
            <Button variant="navSymbol" title={viewMode === "jour" ? "Jour précédent" : "Semaine précédente"} aria-label={viewMode === "jour" ? "Afficher le jour précédent" : "Afficher la semaine précédente"} onClick={() => {
              const d = viewMode === "jour" ? nextBusinessDay(selectedDate, -1) : nextBusinessDay(nextBusinessDay(nextBusinessDay(nextBusinessDay(nextBusinessDay(selectedDate,-1),-1),-1),-1),-1);
              setSelectedDate(d); ensureSessionsForDate(d);
            }}>
              &lt;
            </Button>

            <input
              className="date-input date-display"
              type="text"
              value={formatDateFr(selectedDate)}
              readOnly
              aria-label="Date sélectionnée"
            />

            <Button variant="navSymbol" title={viewMode === "jour" ? "Jour suivant" : "Semaine suivante"} aria-label={viewMode === "jour" ? "Afficher le jour suivant" : "Afficher la semaine suivante"} onClick={() => {
              const d = viewMode === "jour" ? nextBusinessDay(selectedDate, 1) : nextBusinessDay(nextBusinessDay(nextBusinessDay(nextBusinessDay(nextBusinessDay(selectedDate,1),1),1),1),1);
              setSelectedDate(d); ensureSessionsForDate(d);
            }}>
              &gt;
            </Button>
          </div>

          <div className="group view-toggle">
            <Button variant={viewMode === "jour" ? "primary" : "secondary"} onClick={() => setViewMode("jour")}>Jour</Button>
            <Button variant={viewMode === "semaine" ? "primary" : "secondary"} onClick={() => setViewMode("semaine")}>Semaine</Button>
          </div>
        </div>
      </div>

      {viewMode === "jour" ? (
        <div className="stack">{daySessions.map((session) => renderSessionCard(session))}</div>
      ) : (
        <div className="week-grid" aria-label="Semaine interactive">
          {weekSessions.map((day) => (
            <section className="week-day-card" key={day.date}>
              <div className="week-day-header">
                <h3>{formatDateFr(day.date)}</h3>
              </div>
              <div className="week-day-sessions">
                {day.sessions.map((session) => renderSessionCard(session, true))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
