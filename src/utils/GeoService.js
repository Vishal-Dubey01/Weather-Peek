import countryCityMap from "../data/countryCityMap.json";
import countryNameToCode from "../data/countryNameToCode.json";

export const fetchMajorCities = async (region) => {
  const input = region.trim().toLowerCase();

  const matchedEntry = Object.entries(countryNameToCode).find(
    ([name]) => name.toLowerCase() === input
  );

  const countryCode = matchedEntry?.[1];

  if (!countryCode) return [];

  const cityNames = countryCityMap[countryCode] || [];

  return new Promise((resolve) =>
    setTimeout(() => resolve(cityNames.map((name) => ({ name }))), 400)
  );
};