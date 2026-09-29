
          // 5. Yaklaşan Randevu / Rezervasyonlar (gerçek veri — Randevu modülü repository'si üzerinden)
          try {
            const appointmentRepo = container.resolve('AppointmentRepository');
>           const upcoming = await appointmentRepo.getUpcomingAppointments(7);
            const statusColor = {
              [AppointmentStatus.Approved]: COLORS.tertiary,
              [AppointmentStatus.Pending]: COLORS.secondary,
            };
            setAppointments(upcoming.map(appt => {
              const serviceName = appt.services && appt.services.length > 0 ? appt.services.join(' + ') : (appt.customerRequestRaw ? `📝 Not: ${appt.customerRequestRaw}` : '');
              const customerName = appt.customerName || t('dashboardScreen.appointments.unnamedCustomer');
              return {
                id: appt.id,
                time: (new Date(appt.date).getDate() === new Date().getDate() ? '' : new Date(appt.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) + ' ') + extractTime(appt.date),
                title: serviceName ? `${customerName} · ${serviceName}` : customerName,
                color: statusColor[appt.status] || COLORS.tertiary,
              };
            }));
          } catch (apptError) {
            console.warn('Upcoming appointments fetch error:', apptError);
            setAppointments([]);
          }
        } catch (error) {
          console.warn('Dashboard fetch error:', error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
      }, [])
    );
  
    const handleHeroImageChange = () => {
      showActionSheetWithOptions(

