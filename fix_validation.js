const fs = require('fs');
let c = fs.readFileSync('C:/Users/roman/flow/src/modules/randevu/presentation/screens/RandevuScreen.js', 'utf8');

c = c.replace(
  `  const handleSaveAppointment = async () => {\r
    if (!newApptName || !newApptPhone || !newApptTime || !newApptService) return;`,
  `  const handleSaveAppointment = async () => {\r
    if (!newApptName || !newApptPhone || !newApptTime) {\r
      Alert.alert('Eksik Bilgi', 'Lütfen müşteri adı, telefon numarası ve saat seçiniz.');\r
      return;\r
    }`
);

c = c.replace(
  `  const handleSaveAppointment = async () => {\n    if (!newApptName || !newApptPhone || !newApptTime || !newApptService) return;`,
  `  const handleSaveAppointment = async () => {\n    if (!newApptName || !newApptPhone || !newApptTime) {\n      Alert.alert('Eksik Bilgi', 'Lütfen müşteri adı, telefon numarası ve saat seçiniz.');\n      return;\n    }`
);

fs.writeFileSync('C:/Users/roman/flow/src/modules/randevu/presentation/screens/RandevuScreen.js', c, 'utf8');
