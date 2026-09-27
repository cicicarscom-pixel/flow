const fs = require("fs"); 
let c = fs.readFileSync("src/modules/randevu/infrastructure/repositories/SupabaseAppointmentRepository.ts", "utf8"); 
const newCreate = `
  async create(appointmentData: Omit<Appointment, "id" | "createdAt" | "updatedAt">): Promise<Appointment> {
    const { data, error } = await supabase.rpc("create_manual_appointment", {
      p_local_start: appointmentData.date.substring(0, 16), // "YYYY-MM-DDTHH:mm"
      p_customer_name: appointmentData.customerName || null,
      p_customer_phone: appointmentData.customerPhone,
      p_calendar_id: appointmentData.calendarId || null,
      p_service_id: appointmentData.serviceId === "Bilinmiyor" ? null : (appointmentData.serviceId || null),
      p_request_raw: appointmentData.customerRequestRaw || null,
      p_source: "mobile"
    });

    if (error) {
      throw new Error("Ağ/Yetki hatası: " + error.message);
    }

    switch (data.status) {
      case "SUCCESS":
        return new Appointment({
          id: data.appointment_id,
          customerPhone: appointmentData.customerPhone,
          serviceId: appointmentData.serviceId || "",
          date: appointmentData.date,
          status: AppointmentStatus.Pending,
          bookingToken: "",
          startsAt: data.starts_at,
          endsAt: data.ends_at,
        });
      case "SLOT_TAKEN": throw new Error("Bu saat dolu");
      case "CUSTOMER_TIME_CONFLICT": throw new Error("Bu müşterinin bu saatte başka randevusu var");
      case "CALENDAR_REQUIRED": throw new Error("Lütfen bir doktor/takvim seçin");
      case "INVALID_LOCAL_TIME": throw new Error("Bu saat, saat değişikliği nedeniyle mevcut değil");
      case "CUSTOMER_REQUIRED": throw new Error("Müşteri adı ve telefonu zorunlu");
      default: throw new Error("Randevu oluşturulamadı (" + data.status + ")");
    }
  }`;

c = c.replace(/async create\(.*?\) \{[\s\S]*?return AppointmentMapper\.toDomain\([\s\S]*?\);\n  \}/, newCreate.trim());
fs.writeFileSync("src/modules/randevu/infrastructure/repositories/SupabaseAppointmentRepository.ts", c, "utf8"); 
console.log("OK");
