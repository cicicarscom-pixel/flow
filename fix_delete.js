import * as fs from 'fs';

let content = fs.readFileSync('src/modules/randevu/infrastructure/repositories/SupabaseCalendarRepository.ts', 'utf8');

content = content.replace(
    'const { error } = await supabase\n      .from(\'calendars\')\n      .delete()\n      .eq(\'id\', id);\n      \n    if (error) throw error;',
    'const { data, error } = await supabase\n      .from(\'calendars\')\n      .delete()\n      .eq(\'id\', id)\n      .select();\n      \n    if (error) throw error;\n    if (!data || data.length === 0) throw new Error("Bu takvimi silme yetkiniz yok (eski kayıt). Lütfen web panelinden veya Supabase üzerinden silin.");'
);

fs.writeFileSync('src/modules/randevu/infrastructure/repositories/SupabaseCalendarRepository.ts', content, 'utf8');
console.log("Updated deleteCalendar to check for deleted rows!");
