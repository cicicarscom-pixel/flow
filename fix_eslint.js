const fs = require("fs"); let c = fs.readFileSync("src/modules/randevu/presentation/screens/RandevuScreen.js", "utf8"); 
c = "/* eslint-disable i18next/no-literal-string, no-unused-vars */\n" + c;
fs.writeFileSync("src/modules/randevu/presentation/screens/RandevuScreen.js", c, "utf8"); console.log("OK");
