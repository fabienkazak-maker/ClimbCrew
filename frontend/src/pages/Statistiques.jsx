import React from "react";
import StatisticsSection from "../sections/StatisticsSection.jsx";

export default function Statistiques({
  sessionStats,
  topRouteRankings,
  leadRealisationStats,
  formatRouteName,
  statsSortField,
  setStatsSortField,
  statsSortDirection,
  setStatsSortDirection,
  sortedStatsParticipants,
  getPassportStyle,
  getPassportDotStyle,
  normalizePassport,
  cprByParticipantId,
  formatPoints,
  pointsByParticipantId,
}) {
  return (
    <StatisticsSection
      sessionStats={sessionStats}
      topRouteRankings={topRouteRankings}
      leadRealisationStats={leadRealisationStats}
      formatRouteName={formatRouteName}
      statsSortField={statsSortField}
      setStatsSortField={setStatsSortField}
      statsSortDirection={statsSortDirection}
      setStatsSortDirection={setStatsSortDirection}
      sortedStatsParticipants={sortedStatsParticipants}
      getPassportStyle={getPassportStyle}
      normalizePassport={normalizePassport}
      getPassportDotStyle={getPassportDotStyle}
      cprByParticipantId={cprByParticipantId}
      formatPoints={formatPoints}
      pointsByParticipantId={pointsByParticipantId}
    />
  );
}
