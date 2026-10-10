import { Dimensions, StyleSheet } from 'react-native';

export const { width, height } = Dimensions.get('window');

export const styles = StyleSheet.create({
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 10, 11, 0.8)',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  modalContent: {
    backgroundColor: '#201D24',
    borderRadius: 16,
    padding: 20,
    maxHeight: height * 0.7,
    borderWidth: 1,
    borderColor: 'rgba(34, 181, 115, 0.3)',
    shadowColor: '#22B573',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  }
});
