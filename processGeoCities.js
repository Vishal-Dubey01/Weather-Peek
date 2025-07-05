const fs = require("fs");
const readline = require("readline");

const cityMap = {};

const rl = readline.createInterface({
  input: fs.createReadStream("./data/cities500.txt"),
  crlfDelay: Infinity,
});

rl.on("line", (line) => {
  const parts = line.split("\t");

  const name = parts[1];
  const country = parts[8];
  const population = parseInt(parts[14], 10);

  if (!name || !country || isNaN(population)) return;

  if (!cityMap[country]) {
    cityMap[country] = [];
  }

  cityMap[country].push({ name, population });
});

rl.on("close", () => {
  const topCities = {};

  for (const code in cityMap) {
    const sorted = cityMap[code]
      .sort((a, b) => b.population - a.population)
      .slice(0, 10);
    topCities[code] = sorted.map((city) => city.name);
  }

  fs.writeFileSync(
    "./src/data/countryCityMap.json",
    JSON.stringify(topCities, null, 2)
  );

  console.log("✅ Done: Top 10 cities per country written to src/data/countryCityMap.json");
});
