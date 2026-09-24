const fs = require('fs');
let c = fs.readFileSync('src/modules/randevu/infrastructure/repositories/SupabaseCalendarRepository.ts', 'utf8');

c = c.replace(/organization_id:\s*orgData\.id/g, "user_id: userData.user.id");

fs.writeFileSync('src/modules/randevu/infrastructure/repositories/SupabaseCalendarRepository.ts', c, 'utf8');
console.log("Replaced organization_id with user_id");
