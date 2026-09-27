const fs = require('fs');
let content = fs.readFileSync('C:/Users/roman/flow/src/modules/randevu/presentation/screens/RandevuScreen.js', 'utf8');

const target = `  React.useEffect(() => {
    if (selectedDate) {
      const [year, month] = selectedDate.split('-');`;
      
const replacement = `  React.useEffect(() => {
    if (route.params?.date) {
      setSelectedDate(route.params.date);
    }
  }, [route.params?.date]);

  React.useEffect(() => {
    if (selectedDate) {
      const [year, month] = selectedDate.split('-');`;

content = content.replace(target, replacement);

const targetWindows = `  React.useEffect(() => {\r
    if (selectedDate) {\r
      const [year, month] = selectedDate.split('-');`;
      
const replacementWindows = `  React.useEffect(() => {\r
    if (route.params?.date) {\r
      setSelectedDate(route.params.date);\r
    }\r
  }, [route.params?.date]);\r
\r
  React.useEffect(() => {\r
    if (selectedDate) {\r
      const [year, month] = selectedDate.split('-');`;

content = content.replace(targetWindows, replacementWindows);

fs.writeFileSync('C:/Users/roman/flow/src/modules/randevu/presentation/screens/RandevuScreen.js', content, 'utf8');
