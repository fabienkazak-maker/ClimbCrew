import React from "react";
import WallOfFameSection from "../sections/WallOfFameSection.jsx";

export default function WallOfFame({
  wallOfFameCategories,
  getPassportStyle,
  getPassportDotStyle,
  normalizePassport,
  wallOfFameSexFilter,
  setWallOfFameSexFilter,
}) {
  return (
    <WallOfFameSection
      wallOfFameCategories={wallOfFameCategories}
      getPassportStyle={getPassportStyle}
      getPassportDotStyle={getPassportDotStyle}
      normalizePassport={normalizePassport}
      wallOfFameSexFilter={wallOfFameSexFilter}
      setWallOfFameSexFilter={setWallOfFameSexFilter}
    />
  );
}
