
      return data || [];
    }
  
>   async getAppointmentsByDate(date: string, calendarId?: string): Promise<Appointment[]> {
      const nextDayStr = addDaysYmd(date, 1);
      let query = supabase.from("appointments").select("*").gte("date", `${date}T00:00:00`).lt("date", `${nextDayStr}T00:00:00`).in("status", [AppointmentStatus.Pending, AppointmentStatus.Approved]).order("created_at", { ascending: true });
      if (calendarId) query = query.eq("calendar_id", calendarId);
      const { data: appointments, error } = await query;
  
      if (error) {
        throw new NetworkError(`Randevular cekilemedi: ${error.message}`);
      }
  
      return this.enrichWithServices(appointments || []);
    }
  
    /** YENİ: Dashboard'daki "Randevu / Rezervasyon" widget'ı için — bugünden itibaren
     * kronolojik sırayla en yakın N adet Pending/Approved randevu/rezervasyon. */
    async getUpcomingAppointments(limit: number = 7): Promise<Appointment[]> {
      let timezone = 'Europe/Istanbul';
      const { data: user } = await supabase.auth.getUser();
      if (user?.user?.id) {
        const { data: orgData } = await supabase.from('organizations').select('timezone').eq('owner_id', user.user.id).maybeSingle();
        if (orgData?.timezone) timezone = orgData.timezone;
    }
  
    /** appointment_services + business_services join'i ile services[] alanını doldurur.
>    * Daha önce getAppointmentsByDate içinde inline duran kod — değişmedi, sadece taşındı. */
    private async enrichWithServices(appointments: any[]): Promise<Appointment[]> {
      if (!appointments || appointments.length === 0) return [];
  
      const appointmentIds = appointments.map((a: any) => a.id);
      const { data: links } = await supabase
        .from('appointment_services')
        .select('appointment_id, service_id')
        .in('appointment_id', appointmentIds);
  
      const { data: services } = await supabase
        .from('business_services')
        .select('id, name');
  
      const serviceNameById = new Map((services || []).map((s: any) => [s.id, s.name]));
      const servicesByAppointment = new Map<string, string[]>();
      for (const link of links || []) {
        const name = serviceNameById.get(link.service_id);
        if (!name) continue;
        const list = servicesByAppointment.get(link.appointment_id) || [];
        list.push(name);
          },
          async () => {
            // Re-fetch tüm randevuları her değişiklikte
>           const fresh = await this.getAppointmentsByDate(date, calendarId);
            callback(fresh);
          }
        )
        .subscribe();
  
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }
  
  

