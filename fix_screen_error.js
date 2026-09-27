const fs = require("fs"); 
let c = fs.readFileSync("src/modules/randevu/presentation/screens/RandevuScreen.js", "utf8"); 
c = c.replace(/serviceId: newApptService \|\| \x27Bilinmiyor\x27,/, "serviceId: newApptService || null,");
c = c.replace(/\} catch \(e\) \{\n\s*console\.error\(e\);\n\s*\} finally/, "} catch (e) {\n      console.error(e);\n      Alert.alert(\"Hata\", e.message || \"Randevu eklenemedi\");\n    } finally");
fs.writeFileSync("src/modules/randevu/presentation/screens/RandevuScreen.js", c, "utf8"); 
console.log("OK");
