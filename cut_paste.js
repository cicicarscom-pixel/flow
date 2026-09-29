const fs = require('fs');
const lines = fs.readFileSync('src/screens/DashboardScreen.js', 'utf8').split('\n');

const finance = lines.slice(874, 922);
const appointments = lines.slice(923, 993);
const social = lines.slice(994, 1041);
const scanner = lines.slice(1042, 1090);

let recentActivities = lines.slice(1091, 1135);
recentActivities.unshift('            {recentActivities.length > 0 && (');
recentActivities.unshift('            <>');
recentActivities.push('            </>');
recentActivities.push('            )}');

const beforeCards = lines.slice(0, 874);
const afterCards = lines.slice(1135);

const newCode = [
  ...beforeCards,
  ...appointments,
  ...finance,
  ...scanner,
  ...social,
  ...recentActivities,
  ...afterCards
];

fs.writeFileSync('src/screens/DashboardScreen.js', newCode.join('\n'));
console.log('Mobile Dashboard reordered successfully');
