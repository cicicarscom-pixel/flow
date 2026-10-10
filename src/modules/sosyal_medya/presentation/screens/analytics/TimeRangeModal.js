import React from 'react';
import { Modal, TouchableWithoutFeedback, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { styles } from './analyticsStyles';
import { MaterialIcons } from '@expo/vector-icons';

export function TimeRangeModal({ TIME_RANGES, handleSelectTimeRange, isTimeModalVisible, selectedTimeRange, setTimeModalVisible, t }) {
  return (
    <Modal
      visible={isTimeModalVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setTimeModalVisible(false)}
    >
      <TouchableWithoutFeedback onPress={() => setTimeModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              <View className="flex-row justify-between items-center mb-4 pb-3 border-b border-white/10">
                <Text className="text-[#F6F1EC] font-bold text-[14px]">{t('sosyalMedya.analytics.selectTimeRange')}</Text>
                <TouchableOpacity onPress={() => setTimeModalVisible(false)}>
                  <MaterialIcons name="close" size={20} color="#A79E96" />
                </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                {TIME_RANGES.map((range) => (
                  <TouchableOpacity
                    key={range.id}
                    onPress={() => handleSelectTimeRange(range)}
                    className={`flex-row items-center py-3 px-2 rounded-lg mb-1 ${selectedTimeRange.id === range.id ? 'bg-[#22B573]/10' : ''}`}
                  >
                    <MaterialIcons name="access-time" size={18} color="#A79E96" style={{ marginRight: 12, width: 24, textAlign: 'center' }} />
                    <Text className={`text-[12px] ${selectedTimeRange.id === range.id ? 'text-[#22B573] font-bold' : 'text-[#F6F1EC]'}`}>
                      {range.name}
                    </Text>
                    {selectedTimeRange.id === range.id && (
                      <MaterialIcons name="check" size={16} color="#22B573" style={{ marginLeft: 'auto' }} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
