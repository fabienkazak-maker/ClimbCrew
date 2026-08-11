import React from "react";
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
            <button className="secondary nav-symbol" title={viewMode === "jour" ? "Jour précédent" : "Semaine précédente"} onClick={() => {
              const d = viewMode === "jour" ? nextBusinessDay(selectedDate, -1) : nextBusinessDay(nextBusinessDay(nextBusinessDay(nextBusinessDay(nextBusinessDay(selectedDate,-1),-1),-1),-1),-1);
              setSelectedDate(d); ensureSessionsForDate(d);
            }}>
              &lt;
            </button>

            <input
              className="date-input date-display"
              type="text"
              value={formatDateFr(selectedDate)}
              readOnly
              aria-label="Date sélectionnée"
            />

            <button className="secondary nav-symbol" title={viewMode === "jour" ? "Jour suivant" : "Semaine suivante"} onClick={() => {
              const d = viewMode === "jour" ? nextBusinessDay(selectedDate, 1) : nextBusinessDay(nextBusinessDay(nextBusinessDay(nextBusinessDay(nextBusinessDay(selectedDate,1),1),1),1),1);
              setSelectedDate(d); ensureSessionsForDate(d);
            }}>
              &gt;
            </button>
          </div>

          <div className="group view-toggle">
            <button className={viewMode === "jour" ? "" : "secondary"} onClick={() => setViewMode("jour")}>Jour</button>
            <button className={viewMode === "semaine" ? "" : "secondary"} onClick={() => setViewMode("semaine")}>Semaine</button>
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
