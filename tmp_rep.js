
      return this.enrichWithServices(appointments || []);
    }
  
    /** YENİ: Dashboard'daki "Randevu / Rezervasyon" widget'ı için — bugünden itibaren
     * kronolojik sırayla en yakın N adet Pending/Approved randevu/rezervasyon. */
>   async getUpcomingAppointments(limit: number = 7): Promise<Appointment[]> {
      let timezone = 'Europe/Istanbul';
      const { data: user } = await supabase.auth.getUser();
      if (user?.user?.id) {
        const { data: orgData } = await supabase.from('organizations').select('timezone').eq('owner_id', user.user.id).maybeSingle();
        if (orgData?.timezone) timezone = orgData.timezone;
      }
      const todayStr = todayInTimezone(timezone);
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select('*')
        .gte('date', todayStr)
        .in('status', [AppointmentStatus.Pending, AppointmentStatus.Approved])
        .order('date', { ascending: true })
        .limit(limit);
  
      if (error) {
        throw new NetworkError(`Yaklaşan randevular çekilemedi: ${error.message}`);
      }
  
      return this.enrichWithServices(appointments || []);

