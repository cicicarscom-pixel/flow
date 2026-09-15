const fs = require('fs');
const file_path = 'src/screens/DashboardScreen.js';
let lines = fs.readFileSync(file_path, 'utf8').split(/\r?\n/);

// 1. Appointments array (lines 188-193) -> 6 lines
const newAppointments = `  const appointments = [
    { time: "09:00", title: t('dashboardScreen.appointments.reservationWith', { name: 'Mehmet Demir' }), type: "reservation", color: COLORS.tertiary },
    { time: "10:00", title: t('dashboardScreen.appointments.consultingWith', { name: 'Ayþe Kaya' }), type: "consulting", color: COLORS.primary },
    { time: "12:30", title: t('dashboardScreen.appointments.brandMeeting'), type: "meeting", color: COLORS.secondary },
    { time: "13:45", title: t('dashboardScreen.appointments.appointmentWith', { name: 'Elif Yýldýz' }), type: "appointment", color: COLORS.primaryContainer },
    { time: "15:00", title: t('dashboardScreen.appointments.demoWith', { name: 'Seda Koç' }), type: "demo", color: COLORS.tertiaryFixed },
    { time: "17:30", title: t('dashboardScreen.appointments.weeklyAnalyticsReview'), type: "review", color: COLORS.error },
    { time: "18:30", title: t('dashboardScreen.appointments.weeklyTeamReview'), type: "review", color: COLORS.secondaryFixed },
  ];`.split('\n');

lines.splice(188, 6, ...newAppointments);

// 2. Render view (lines 578-589) -> wait, since we added 3 lines (7 instead of 4), the indices shift!
// We inserted 9 lines (newAppointments.length) to replace 6 lines. Net change: +3 lines.
// Old index 578 -> New index 581. It was 12 lines.
const newRender = `            {/* Bugünkü Randevu/Rezervasyonlar — dikey liste */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>{t('dashboardScreen.today.title')}</Text>
            </View>
            <View style={styles.apptList}>
              {appointments.map(a => (
                <View key={a.time} style={styles.apptListRow}>
                  <View style={[styles.apptListDot, { backgroundColor: a.color }]} />
                  <Text style={styles.apptListTime}>{a.time}</Text>
                  <Text style={styles.apptListTitle} numberOfLines={1}>{a.title}</Text>
                </View>
              ))}
            </View>`.split('\n');

lines.splice(581, 12, ...newRender);

// 3. Styles (lines 980-1009) -> wait, net change: +3 lines again. No, we didn't add more lines before the styles? 
// Yes, we did. So old index 980 -> new index 983. Length was 30 lines.
const newStyles = `  apptList: {
    gap: 10,
    marginBottom: 20,
  },
  apptListRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  apptListDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  apptListTime: {
    color: COLORS.onSurfaceVariant,
    fontSize: 12,
    fontWeight: '700',
    width: 44,
  },
  apptListTitle: {
    flex: 1,
    color: COLORS.onSurface,
    fontSize: 13,
    fontWeight: '600',
  },`.split('\n');

lines.splice(983, 30, ...newStyles);

fs.writeFileSync(file_path, lines.join('\n'), 'utf8');
console.log("Done splice replacing");
