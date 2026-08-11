import React from "react";
import WallOfFameSection from "../sections/WallOfFameSection.jsx";
import StatisticsSection from "../sections/StatisticsSection.jsx";

export default function Statistiques({
  wallOfFameCategories,
  getPassportStyle,
  getPassportDotStyle,
  normalizePassport,
  sessionStats,
  topRouteRankings,
  leadRealisationStats,
  formatRouteName,
  statsSortField,
  setStatsSortField,
  statsSortDirection,
  setStatsSortDirection,
  sortedStatsParticipants,
  cprByParticipantId,
  formatPoints,
  pointsByParticipantId,
}) {
  return (
    <>
      <WallOfFameSection
        wallOfFameCategories={wallOfFameCategories}
        getPassportStyle={getPassportStyle}
        getPassportDotStyle={getPassportDotStyle}
        normalizePassport={normalizePassport}
      />
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
    </>
  );
}
