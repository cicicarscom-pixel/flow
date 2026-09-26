let c = Deno.readTextFileSync('C:/Users/roman/flow/src/modules/randevu/infrastructure/repositories/SupabaseAppointmentRepository.ts');

c = c.replace(
  "    const todayStr = new Date().toISOString().split('T')[0]; // \"YYYY-MM-DD\"",
  `    let timezone = 'Europe/Istanbul';
    const { data: user } = await supabase.auth.getUser();
    if (user?.user?.id) {
      const { data: orgData } = await supabase.from('organizations').select('timezone').eq('owner_id', user.user.id).maybeSingle();
      if (orgData?.timezone) timezone = orgData.timezone;
    }
    const todayStr = todayInTimezone(timezone);`
);

Deno.writeTextFileSync('C:/Users/roman/flow/src/modules/randevu/infrastructure/repositories/SupabaseAppointmentRepository.ts', c);
console.log("Updated flow repo again");
