const fs = require('fs');

let content = fs.readFileSync('C:/Users/roman/flow/src/screens/DashboardScreen.js', 'utf8');

// 1. Fetch calendars map and add targetDate/doctorName to map
content = content.replace(
  `          // 5. Yaklaşan Randevu / Rezervasyonlar (gerçek veri - Randevu modülü repository'si üzerinden)`,
  `          // 5. Yaklaşan Randevu / Rezervasyonlar (gerçek veri - Randevu modülü repository'si üzerinden)
          let calendarsMap = {};
          if (orgId) {
             const { data: calendarsData } = await supabase.from('calendars').select('id, name').eq('merchant_id', orgId);
             if (calendarsData) {
               calendarsData.forEach(c => calendarsMap[c.id] = c.name);
             }
          }`
);

content = content.replace(
  `            setAppointments(upcoming.map(appt => {
              const serviceName = appt.services && appt.services.length > 0 ? appt.services.join(' + ') : (appt.customerRequestRaw ? \`📝 Not: \${appt.customerRequestRaw}\` : '');
              const customerName = appt.customerName || t('dashboardScreen.appointments.unnamedCustomer');
              return {
                id: appt.id,
                time: (new Date(appt.date).getDate() === new Date().getDate() ? '' : new Date(appt.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) + ' ') + extractTime(appt.date),
                title: serviceName ? \`\${customerName} - \${serviceName}\` : customerName,
                color: statusColor[appt.status] || COLORS.tertiary,
              };
            }));`,
  `            setAppointments(upcoming.map(appt => {
              const serviceName = appt.services && appt.services.length > 0 ? appt.services.join(' + ') : '';
              const customerName = appt.customerName || t('dashboardScreen.appointments.unnamedCustomer');
              const doctorName = appt.calendarId && calendarsMap[appt.calendarId] ? \`👨‍⚕️ \${calendarsMap[appt.calendarId]}\` : '';
              const noteText = appt.customerRequestRaw ? \`📝 \${appt.customerRequestRaw}\` : '';
              
              let targetDate = appt.date ? appt.date.split('T')[0] : today;
              if (appt.startsAt) {
                 targetDate = new Intl.DateTimeFormat('en-CA', { timeZone: appt.timezone || tz }).format(new Date(appt.startsAt));
              }

              return {
                id: appt.id,
                time: (new Date(appt.date).getDate() === new Date().getDate() ? '' : new Date(appt.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) + ' ') + extractTime(appt.date),
                title: [customerName, serviceName, doctorName, noteText].filter(Boolean).join(' - '),
                color: statusColor[appt.status] || COLORS.tertiary,
                targetDate
              };
            }));`
);

// 2. Change View to TouchableOpacity in mapping
content = content.replace(
  `                <View style={styles.apptList}>
                  {appointments.map(a => (
                    <View key={a.id} style={styles.apptListRow}>`,
  `                <View style={styles.apptList}>
                  {appointments.map(a => (
                    <TouchableOpacity key={a.id} style={styles.apptListRow} onPress={() => navigation.navigate('Ai Asistan', { screen: 'RandevuMain', params: { date: a.targetDate } })}> `
);
content = content.replace(
  `                      <Text style={styles.apptListTitle} numberOfLines={1}>{a.title}</Text>
                    </View>
                  ))}
                </View>`,
  `                      <Text style={styles.apptListTitle} numberOfLines={1}>{a.title}</Text>
                    </TouchableOpacity>
                  ))}
                </View>`
);


fs.writeFileSync('C:/Users/roman/flow/src/screens/DashboardScreen.js', content, 'utf8');
