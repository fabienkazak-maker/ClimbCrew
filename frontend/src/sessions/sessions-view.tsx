import { useEffect, useMemo, useState } from "react";
import { useClimbData } from "../data/data-context";
import { useSessionActions } from "../data/use-session-actions";
import type { ClimbingSession } from "../domain/types";
import { formatDateFr, getWeekDates, shiftBusinessDays } from "../lib/date";
import { SessionCard } from "./session-card";
import { WeekView } from "./week-view";

type ViewMode = "jour" | "semaine";

export function SessionsView() {
  const { data, setData } = useClimbData();
  const actions = useSessionActions();
  const [viewMode, setViewMode] = useState<ViewMode>("jour");
  const selectedDate = data.selectedDate;
  const weekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate]);
  const { ensureDate } = actions;

  useEffect(() => {
    if (viewMode === "jour") ensureDate(selectedDate);
    else weekDates.forEach(ensureDate);
  }, [viewMode, selectedDate, weekDates, ensureDate]);

  function selectDate(date: string): void {
    setData((current) => ({ ...current, selectedDate: date }));
  }

  const daySessions = data.sessions
    .filter((session) => session.date === selectedDate)
    .sort((left, right) => left.slot.localeCompare(right.slot));
  const weekSessions: ClimbingSession[] = data.sessions.filter((session) =>
    weekDates.includes(session.date),
  );

  return (
    <>
      <div className="toolbar session-toolbar">
        <button
          type="button"
          className="secondary"
          onClick={() =>
            selectDate(
              shiftBusinessDays(selectedDate, viewMode === "jour" ? -1 : -5),
            )
          }
        >
          Précédent
        </button>
        <strong>{formatDateFr(selectedDate)}</strong>
        <button
          type="button"
          className="secondary"
          onClick={() =>
            selectDate(
              shiftBusinessDays(selectedDate, viewMode === "jour" ? 1 : 5),
            )
          }
        >
          Suivant
        </button>
        <div className="segmented">
          <button
            type="button"
            className={viewMode === "jour" ? "" : "secondary"}
            onClick={() => setViewMode("jour")}
          >
            Jour
          </button>
          <button
            type="button"
            className={viewMode === "semaine" ? "" : "secondary"}
            onClick={() => setViewMode("semaine")}
          >
            Semaine
          </button>
        </div>
      </div>
      {viewMode === "jour" ? (
        <div className="stack">
          {daySessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              participants={data.participants}
              actions={actions}
            />
          ))}
        </div>
      ) : (
        <WeekView
          dates={weekDates}
          sessions={weekSessions}
          participants={data.participants}
        />
      )}
    </>
  );
}
