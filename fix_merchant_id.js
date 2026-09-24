const fs = require('fs');
let c = fs.readFileSync('src/modules/randevu/infrastructure/repositories/SupabaseCalendarRepository.ts', 'utf8');

c = c.replace(/user_id:\s*userData\.user\.id/g, "merchant_id: userData.user.id");

fs.writeFileSync('src/modules/randevu/infrastructure/repositories/SupabaseCalendarRepository.ts', c, 'utf8');
console.log("Replaced user_id with merchant_id");
