import { StyleSheet, Platform } from 'react-native';

// Renk paleti — randevu index'ine göre döngüsel
export const CARD_COLORS = [
  { color: '#22B573', border: 'rgba(34, 181, 115,0.35)', icon: 'cut-outline' },
  { color: '#F59E0B', border: 'rgba(245, 158, 11,0.35)',  icon: 'color-wand-outline' },
  { color: '#F4D9B8', border: 'rgba(192,193,255,0.25)', icon: 'leaf-outline' },
  { color: '#22B573', border: 'rgba(34, 181, 115,0.25)',  icon: 'brush-outline' },
];

export const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#201D24' },
  scroll: { flex: 1 },

  /* Header */
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: 'rgba(60,74,66,0.12)',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarWrap: {
    width: 38, height: 38, borderRadius: 20,
    backgroundColor: 'rgba(34, 181, 115,0.12)',
    borderWidth: 1, borderColor: 'rgba(34, 181, 115,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerLabel: { fontSize: 12, fontWeight: '700', color: '#22B573', letterSpacing: 1.5 },
  dateSelectorPill: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(32,31,34,0.4)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
  },
  dateSelectorText: { fontSize: 15, fontWeight: '700', color: '#F6F1EC' },
  headerBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(53,52,55,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerDot: {
    position: 'absolute', top: 6, right: 6,
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: '#22B573', borderWidth: 1, borderColor: '#201D24',
  },

  /* Sticky Block */
  stickyBlock: { backgroundColor: '#201D24', paddingBottom: 6 },

  /* Calendar Strip */
  calendarScroll: { marginTop: 12, marginBottom: 4 },
  calendarStrip: { paddingHorizontal: 14, gap: 8 },
  dayCard: {
    alignItems: 'center', justifyContent: 'center',
    width: 52, height: 64, borderRadius: 16,
    backgroundColor: 'rgba(32,31,34,0.4)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  dayCardActive: {
    backgroundColor: '#22B573',
    shadowColor: '#22B573', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
    transform: [{ scale: 1.1 }],
  },
  dayName: { fontSize: 10, fontWeight: '700', color: '#A79E96' },
  dayNameActive: { color: '#1C3327', opacity: 0.85 },
  dayDate: { fontSize: 16, fontWeight: '700', color: '#F6F1EC', marginTop: 2 },
  dayDateActive: { color: '#1C3327' },

  /* Slots Card */
  slotsCard: {
    marginHorizontal: 14, marginTop: 10,
    backgroundColor: 'rgba(32,31,34,0.4)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16, padding: 12,
  },
  slotsHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 10,
  },
  slotsTitle: { fontSize: 14, fontWeight: '600', color: '#F6F1EC' },
  slotsLegend: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 7, height: 7, borderRadius: 4 },
  legendDotEmpty: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#756D66' },
  legendText: { fontSize: 10, fontWeight: '700', color: '#A79E96', letterSpacing: 0.5 },

  /* Heatmap grid */
  heatmapWrap: { flexDirection: 'row', alignItems: 'stretch', gap: 6 },
  rowLabels: { justifyContent: 'flex-start', paddingVertical: 2, gap: 5 },
  rowLabel: { fontSize: 8, fontWeight: '700', color: '#A79E96', letterSpacing: 0.5, textAlign: 'right', width: 36, height: 28, lineHeight: 28 },
  heatmapGrid: { flexDirection: 'row', gap: 4, paddingVertical: 2 },
  heatmapCol: { flexDirection: 'column', gap: 5 },
  heatCell: {
    width: 44, height: 28, borderRadius: 8,
    backgroundColor: 'rgba(42,42,44,0.7)',
    borderWidth: 1, borderColor: 'rgba(60,74,66,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  heatCellFull: {
    backgroundColor: '#22B573',
    borderColor: 'transparent',
    shadowColor: '#22B573', shadowOpacity: 0.3, shadowRadius: 4, elevation: 3,
  },
  heatLabel: { fontSize: 9, fontWeight: '700', color: '#A79E96' },
  heatLabelFull: { color: '#1C3327' },

  /* Timeline */
  timeline: { paddingHorizontal: 14, paddingTop: 16, gap: 0 },
  timelineRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  timeCol: { alignItems: 'center', width: 44, paddingTop: 2 },
  timeText: { fontSize: 10, fontWeight: '700', marginBottom: 6 },
  timeLine: {
    width: 1.5, flex: 1,
    backgroundColor: 'rgba(60,74,66,0.3)', borderRadius: 4,
  },

  /* Appointment Card */
  card: {
    flex: 1, borderRadius: 16, overflow: 'hidden',
    backgroundColor: 'rgba(32,31,34,0.4)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
    borderLeftWidth: 4, padding: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  cardTint: { ...StyleSheet.absoluteFillObject, zIndex: 0 },
  cardContent: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, zIndex: 1 },
  iconBox: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 14, fontWeight: '700', color: '#F6F1EC' },
  cardService: { fontSize: 10, color: '#A79E96', marginTop: 2 },
  cardTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 },
  cardTimeText: { fontSize: 10, fontWeight: '600', color: '#A79E96' },

  badge: {
    borderLeftWidth: 2, paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 8, zIndex: 1,
  },
  badgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },

  /* FAB */
  fab: { position: 'absolute', right: 18 },
  fabInner: {
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: '#22B573', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#22B573', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
  },

  /* Empty State */
  emptyState: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 40, gap: 10,
  },
  emptyText: {
    fontSize: 13, color: '#756D66', fontWeight: '600',
  },

  /* Modal Styles */
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
      backgroundColor: '#201D24',
      borderTopLeftRadius: 24, borderTopRightRadius: 24,
      padding: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 20,
      borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
      maxHeight: '90%'
    },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#F6F1EC' },
  modalLabel: { fontSize: 12, fontWeight: '600', color: '#A79E96', marginBottom: 6, marginTop: 12 },
  chip: { backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    chipActive: { backgroundColor: '#22B573', borderColor: '#22B573' },
    chipText: { color: '#A79E96', fontSize: 13, fontWeight: '600' },
    chipTextActive: { color: '#17151A' },
  
  webModalLabel: {
    fontSize: 12, fontWeight: '600', color: '#A79E96', marginBottom: 8, paddingLeft: 4
  },
  webModalInput: {
    width: '100%', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.2)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    color: '#fff', fontSize: 14, marginBottom: 16
  },
  webSaveButton: {
    width: '100%', padding: 16, borderRadius: 16, marginTop: 8,
    backgroundColor: '#22B573', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#22B573', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 4
  },
  webSaveButtonText: {
    color: '#17151A', fontWeight: '700', fontSize: 15
  },
  modalInput: {
    backgroundColor: 'rgba(32,31,34,0.4)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
    color: '#F6F1EC', fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#22B573',
    borderRadius: 12, paddingVertical: 16,
    alignItems: 'center', marginTop: 24,
    shadowColor: '#22B573', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  saveButtonText: { fontSize: 15, fontWeight: '700', color: '#1C3327' }
});
