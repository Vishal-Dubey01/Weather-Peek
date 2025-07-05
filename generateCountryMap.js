const fs = require("fs");
const csv = require("csv-parser");

const result = {};

fs.createReadStream("./data/countries.csv") // <- place downloaded file here
  .pipe(csv())
  .on("data", (row) => {
    result[row.Name] = row.Code;
  })
  .on("end", () => {
    fs.writeFileSync("./src/data/countryNameToCode.json", JSON.stringify(result, null, 2));
    console.log("✅ countryNameToCode.json generated!");
  });
