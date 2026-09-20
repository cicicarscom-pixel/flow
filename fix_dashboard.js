const fs = require('fs');
const file_path = 'src/screens/DashboardScreen.js';
let content = fs.readFileSync(file_path, 'utf8').replace(/\r\n/g, '\n');

// 1. IMPORTS
const importTarget = `import { supabase } from '../shared/lib/supabase';`;
if (!content.includes('import { container }')) {
    content = content.replace(importTarget, importTarget + '\nimport { container } from \'../core/container\';\nimport { AppointmentStatus } from \'../modules/randevu/domain/enums/AppointmentStatus\';\nimport { extractTime } from \'../modules/randevu/presentation/hooks/useAppointments\';\nimport { Ionicons } from \'@expo/vector-icons\';');
}

// 2. CONSTANTS
const colorTarget = `const COLORS = {\n  primary: '#00daf3',\n  primaryContainer: '#002024',\n  onPrimary: '#000000',\n  secondary: '#FF7A59',\n  secondaryContainer: '#3E0D00',\n  secondaryFixed: '#FFDBCE',\n  tertiary: '#22B573',\n  tertiaryContainer: '#002110',\n  tertiaryFixed: '#74F8B0',\n  error: '#ffb4ab',\n  errorContainer: '#93000a',\n  background: '#121212',\n  surface: '#1c1c1c',\n  surfaceContainer: '#2b2b2b',\n  surfaceVariant: '#404040',\n  onSurface: '#e2e2e2',\n  onSurfaceVariant: '#c4c4c4',\n  primaryFixedDim: 'rgba(0, 218, 243, 0.15)',\n  outline: '#8a9296',\n};`;
if (!content.includes('PLATFORM_ICONS')) {
    content = content.replace(colorTarget, colorTarget + `\n\nconst PLATFORM_ICONS = {\n  WHATSAPP: { name: 'logo-whatsapp', color: '#25D366' },\n  INSTAGRAM: { name: 'logo-instagram', color: '#E8A8CD' },\n  FACEBOOK: { name: 'logo-facebook', color: '#FF7A59' },\n  YOUTUBE: { name: 'logo-youtube', color: '#ff0000' },\n  LINKEDIN: { name: 'logo-linkedin', color: '#0077b5' },\n  TIKTOK: { name: 'logo-tiktok', color: '#69C9D0' },\n};`);
}

// 3. STATE
const stateTarget = `const [recentActivities, setRecentActivities] = useState([]);`;
if (!content.includes('const [appointments, setAppointments] = useState([]);')) {
    content = content.replace(stateTarget, stateTarget + '\n  const [appointments, setAppointments] = useState([]);');
}

// 4. MOCK DATA
const mockDataTarget = `  const appointments = [
    { time: "09:00", title: t('dashboardScreen.appointments.reservationWith', { name: 'Mehmet Demir' }), type: "reservation", color: COLORS.tertiary },
    { time: "10:00", title: t('dashboardScreen.appointments.consultingWith', { name: 'Ayþe Kaya' }), type: "consulting", color: COLORS.primary },
    { time: "12:30", title: t('dashboardScreen.appointments.brandMeeting'), type: "meeting", color: COLORS.secondary },
    { time: "13:45", title: t('dashboardScreen.appointments.appointmentWith', { name: 'Elif Yýldýz' }), type: "appointment", color: COLORS.primaryContainer },
    { time: "15:00", title: t('dashboardScreen.appointments.demoWith', { name: 'Seda Koç' }), type: "demo", color: COLORS.tertiaryFixed },
    { time: "17:30", title: t('dashboardScreen.appointments.weeklyAnalyticsReview'), type: "review", color: COLORS.error },
    { time: "18:30", title: t('dashboardScreen.appointments.weeklyTeamReview'), type: "review", color: COLORS.secondaryFixed },
  ];\n`;
if (content.includes(mockDataTarget)) {
    content = content.replace(mockDataTarget, '');
} else {
    // try slightly modified version just in case
    const lines = content.split('\n');
    const startIdx = lines.findIndex(l => l.includes('const appointments = ['));
    if (startIdx !== -1) {
        const endIdx = lines.findIndex((l, i) => i > startIdx && l.includes('];'));
        if (endIdx !== -1) {
            lines.splice(startIdx, endIdx - startIdx + 1);
            content = lines.join('\n');
        }
    }
}

// 5. FETCH DATA modifications (activities query)
const oldActivitiesFetch = `        // 4. Recent Activities (Messages + Comments)
        const [{ data: msgs }, { data: comments }] = await Promise.all([
          supabase.from('messages').select('*').order('created_at', { ascending: false }).limit(5),
          supabase.from('comments').select('*').order('created_at', { ascending: false }).limit(5)
        ]);
        
        let merged = [];
        if (msgs) {
          merged = [...merged, ...msgs.map(m => ({
            id: 'msg_'+m.id,
            type: t('dashboardScreen.recentActivity.types.message'),
            platform: 'WHATSAPP',
            name: m.sender_name || t('dashboardScreen.recentActivity.customerFallback'),
            message: m.message_body || m.content || '',
            date: m.created_at,
            avatar: \`https://ui-avatars.com/api/?name=\${encodeURIComponent(m.sender_name || 'M')}&background=00daf3&color=fff\`,
            color: COLORS.primaryFixedDim
          }))];
        }`;

const newActivitiesFetch = `        // 4. Recent Activities (Messages + Comments)
        const [{ data: msgs }, { data: comments }] = await Promise.all([
          supabase.from('messages').select('*, conversations(participant_name, participant_picture, platform)').order('created_at', { ascending: false }).limit(5),
          supabase.from('comments').select('*').order('created_at', { ascending: false }).limit(5)
        ]);
        
        let merged = [];
        if (msgs) {
          merged = [...merged, ...msgs.map(m => {
            const conv = m.conversations || {};
            const displayName = conv.participant_name || t('dashboardScreen.recentActivity.customerFallback');
            return {
              id: 'msg_'+m.id,
              type: t('dashboardScreen.recentActivity.types.message'),
              platform: (conv.platform || 'whatsapp').toUpperCase(),
              name: displayName,
              message: m.content || '',
              date: m.created_at,
              avatar: conv.participant_picture || \`https://ui-avatars.com/api/?name=\${encodeURIComponent(displayName)}&background=00daf3&color=fff\`,
              color: COLORS.primaryFixedDim
            };
          })];
        }`;

content = content.replace(oldActivitiesFetch, newActivitiesFetch);

// 6. FETCH DATA appointments 
const fetchAppendTarget = `        setRecentActivities(merged.slice(0, 3));\n`;
if (!content.includes('// 5. Yaklaþan Randevu')) {
    const fetchAppendContent = `        // 5. Yaklaþan Randevu / Rezervasyonlar (gerçek veri — Randevu modülü repository'si üzerinden)
        try {
          const appointmentRepo = container.resolve('AppointmentRepository');
          const upcoming = await appointmentRepo.getUpcomingAppointments(7);
          const statusColor = {
            [AppointmentStatus.Approved]: COLORS.tertiary,
            [AppointmentStatus.Pending]: COLORS.secondary,
          };
          setAppointments(upcoming.map(appt => {
            const serviceName = appt.services && appt.services.length > 0 ? appt.services[0] : '';
            const customerName = appt.customerName || t('dashboardScreen.appointments.unnamedCustomer');
            return {
              id: appt.id,
              time: extractTime(appt.date),
              title: serviceName ? \`\${customerName} · \${serviceName}\` : customerName,
              color: statusColor[appt.status] || COLORS.tertiary,
            };
          }));
        } catch (apptError) {
          console.warn('Upcoming appointments fetch error:', apptError);
          setAppointments([]);
        }
`;
    content = content.replace(fetchAppendTarget, fetchAppendTarget + fetchAppendContent);
}

// 7. Render appointments list
const oldApptRender = `            <View style={styles.apptList}>
              {appointments.map(a => (
                <View key={a.time} style={styles.apptListRow}>
                  <View style={[styles.apptListDot, { backgroundColor: a.color }]} />
                  <Text style={styles.apptListTime}>{a.time}</Text>
                  <Text style={styles.apptListTitle} numberOfLines={1}>{a.title}</Text>
                </View>
              ))}
            </View>`;

const newApptRender = `            {isLoading ? (
              <View style={styles.apptList}>
                <Skeleton width="100%" height={44} borderRadius={14} />
                <Skeleton width="100%" height={44} borderRadius={14} />
              </View>
            ) : appointments.length > 0 ? (
              <View style={styles.apptList}>
                {appointments.map(a => (
                  <View key={a.id} style={styles.apptListRow}>
                    <View style={[styles.apptListDot, { backgroundColor: a.color }]} />
                    <Text style={styles.apptListTime}>{a.time}</Text>
                    <Text style={styles.apptListTitle} numberOfLines={1}>{a.title}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>{t('dashboardScreen.appointments.empty')}</Text>
            )}`;

content = content.replace(oldApptRender, newApptRender);

// Also fix the comment encoding around there
content = content.replace('{/* Bugnk Randevu/Rezervasyonlar  dikey liste */}', '{/* Bugünkü Randevu/Rezervasyonlar — dikey liste */}');
content = content.replace('{/* Bug\uFFFDnk\uFFFD Randevu/Rezervasyonlar \uFFFD dikey liste */}', '{/* Bugünkü Randevu/Rezervasyonlar — dikey liste */}');

// 8. Render recent activities
const oldActRender = `                  <TouchableOpacity key={act.id} style={styles.activityCard} activeOpacity={0.7}>
                    <Image source={{ uri: act.avatar }} style={styles.activityAvatar} />
                    <View style={styles.activityBody}>`;

const newActRender = `                  <TouchableOpacity key={act.id} style={styles.activityCard} activeOpacity={0.7}>
                    <View style={styles.activityAvatarWrap}>
                      <Image source={{ uri: act.avatar }} style={styles.activityAvatar} />
                      {PLATFORM_ICONS[act.platform] && (
                        <View style={[styles.platformBadge, { backgroundColor: PLATFORM_ICONS[act.platform].color }]}>
                          <Ionicons name={PLATFORM_ICONS[act.platform].name} size={10} color="#fff" />
                        </View>
                      )}
                    </View>
                    <View style={styles.activityBody}>`;

content = content.replace(oldActRender, newActRender);

// 9. STYLES for avatar
const oldActStyle = `  activityAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
  },`;

const newActStyle = `  activityAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
  },
  activityAvatarWrap: {
    position: 'relative',
  },
  platformBadge: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.surface,
  },`;

if (!content.includes('activityAvatarWrap: {')) {
    content = content.replace(oldActStyle, newActStyle);
}

fs.writeFileSync(file_path, content, 'utf8');
console.log('Dashboard updated');
