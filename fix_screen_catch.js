const fs = require("fs"); 
let c = fs.readFileSync("src/modules/randevu/presentation/screens/RandevuScreen.js", "utf8"); 
c = c.replace("      setNewApptNote(\x27\x27);\n    } catch (e) {\n      console.error(e);\n    } finally {", "      setNewApptNote(\x27\x27);\n    } catch (e) {\n      console.error(e);\n      Alert.alert(\"Hata\", e.message || \"Randevu eklenemedi\");\n    } finally {");
fs.writeFileSync("src/modules/randevu/presentation/screens/RandevuScreen.js", c, "utf8"); 
console.log("OK");
