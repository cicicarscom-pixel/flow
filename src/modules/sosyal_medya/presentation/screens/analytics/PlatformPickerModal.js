import React from 'react';
import { Modal, TouchableWithoutFeedback, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { styles } from './analyticsStyles';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';

export function PlatformPickerModal({ PLATFORMS, handleSelectPlatform, isPlatformModalVisible, selectedPlatform, setPlatformModalVisible, t }) {
  return (
    <Modal
      visible={isPlatformModalVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setPlatformModalVisible(false)}
    >
      <TouchableWithoutFeedback onPress={() => setPlatformModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              <View className="flex-row justify-between items-center mb-4 pb-3 border-b border-white/10">
                <Text className="text-[#F6F1EC] font-bold text-[14px]">{t('sosyalMedya.analytics.selectPlatform')}</Text>
                <TouchableOpacity onPress={() => setPlatformModalVisible(false)}>
                  <MaterialIcons name="close" size={20} color="#A79E96" />
                </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                {PLATFORMS.map((platform) => (
                  <TouchableOpacity
                    key={platform.id}
                    onPress={() => handleSelectPlatform(platform)}
                    className={`flex-row items-center py-3 px-2 rounded-lg mb-1 ${selectedPlatform.id === platform.id ? 'bg-[#22B573]/10' : ''}`}
                  >
                    <Ionicons name={platform.icon} size={18} color={platform.color} style={{ marginRight: 12, width: 24, textAlign: 'center' }} />
                    <Text className={`text-[12px] ${selectedPlatform.id === platform.id ? 'text-[#22B573] font-bold' : 'text-[#F6F1EC]'}`}>
                      {platform.name}
                    </Text>
                    {selectedPlatform.id === platform.id && (
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
