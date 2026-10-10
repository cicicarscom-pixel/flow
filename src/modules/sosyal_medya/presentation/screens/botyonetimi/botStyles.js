import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  statusHeroCard: {
    backgroundColor: 'rgba(42, 38, 49, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(34, 181, 115, 0.25)',
    borderRadius: 24,
    padding: 18,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 8,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusTitle: {
    color: '#F6F1EC',
    fontSize: 15,
    fontWeight: '700',
  },
  statusSubtitle: {
    color: '#A79E96',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  statusSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 12,
    borderRadius: 16,
    marginTop: 14,
  },
  statusSubIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: 'rgba(37, 211, 102, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassCard: {
    backgroundColor: 'rgba(32, 31, 34, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(34, 181, 115, 0.2)',
    borderRadius: 20,
    shadowColor: '#000000',
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 6,
  },
  glowBorderCyanThick: {
    backgroundColor: '#2A2631', // Solid opaque dark grey to prevent Android elevation shadow bleed-through
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FF7A59',
    shadowColor: '#FF7A59',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 28,
    elevation: 10,
  },
  pulseGlow: {
    shadowColor: '#22B573',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  }
});
