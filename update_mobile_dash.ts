const file = 'C:/Users/roman/flow/src/screens/DashboardScreen.js';
let content = await Deno.readTextFile(file);

const originalMapLogic = "time: extractTime(appt.date),";
const newMapLogic = "time: (new Date(appt.date).getDate() === new Date().getDate() ? '' : new Date(appt.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) + ' ') + extractTime(appt.date),";

if (content.includes(originalMapLogic)) {
  content = content.replace(originalMapLogic, newMapLogic);
  await Deno.writeTextFile(file, content);
  console.log("Updated Mobile Dashboard time format!");
} else {
  console.log("Could not find the time logic in Mobile Dashboard!");
}
