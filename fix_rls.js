const fs = require('fs');
let c = fs.readFileSync('C:/Users/roman/flow/src/modules/randevu/infrastructure/repositories/SupabaseAppointmentRepository.ts', 'utf8');

c = c.replace(
/const rawData = \{[\s\S]*?calendar_id: appointmentData.calendarId\r?\n\s*\};/,
`const { data: { user } } = await supabase.auth.getUser();
    
    const rawData = {
      organization_id: user?.id,
      customer_phone: appointmentData.customerPhone,
      customer_name: appointmentData.customerName,
      service_id: appointmentData.serviceId,
      employee_id: appointmentData.employeeId,
      date: appointmentData.date,
      status: appointmentData.status,
      booking_token: appointmentData.bookingToken,
      calendar_id: appointmentData.calendarId
    };`
);

fs.writeFileSync('C:/Users/roman/flow/src/modules/randevu/infrastructure/repositories/SupabaseAppointmentRepository.ts', c, 'utf8');
