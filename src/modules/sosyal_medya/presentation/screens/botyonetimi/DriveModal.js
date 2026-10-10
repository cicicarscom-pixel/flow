/* eslint-disable i18next/no-literal-string */
import React from 'react';
import { Modal, KeyboardAvoidingView, View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { styles } from './botStyles';
import { Ionicons } from '@expo/vector-icons';
import { CustomInput } from '../../../../../shared';

export function DriveModal({ connectedFolderId, disconnectingFolder, driveLink, driveModalVisible, handleDisconnectFolder, handleSyncFolder, setDriveLink, setDriveModalVisible, syncing }) {
  return (
    <Modal
      visible={driveModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setDriveModalVisible(false)}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
      >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent} className="bg-[#2A2631] border border-white/10">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-base font-bold text-white">Bilgi Bankası (Google Drive)</Text>
            <TouchableOpacity onPress={() => setDriveModalVisible(false)}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
    
          <ScrollView>
            <View className="bg-white/5 rounded-xl p-3 mb-4">
              <Text className="text-gray-300 text-xs leading-5 mb-2">
                Google Drive klasörünüzü bağlamak için aşağıdaki servis e-postasını klasörünüze &apos;Görüntüleyen&apos; olarak ekleyin:
              </Text>
              <Text selectable={true} className="text-[#22B573] font-medium text-xs bg-black/40 p-2 rounded-lg mb-3 text-center">
                esnaf-drive-bot@gen-lang-client-0889039852.iam.gserviceaccount.com
              </Text>
              <Text className="text-gray-300 text-xs">
                Ardından klasör linkini aşağıya yapıştırın.
              </Text>
            </View>
    
            <CustomInput
              value={driveLink}
              onChangeText={setDriveLink}
              placeholder="Google Drive Klasör Linki"
              autoCapitalize="none"
              autoCorrect={false}
              leftIcon={<Ionicons name="logo-google" size={18} color="#22B573" />}
              containerClassName="mb-4"
            />
    
            <View className="flex-row gap-2">
              {connectedFolderId && (
                <TouchableOpacity 
                  onPress={handleDisconnectFolder}
                  disabled={disconnectingFolder}
                  className="flex-1 bg-red-500/10 border border-red-500/40 py-3 rounded-xl items-center"
                >
                  <Text className="text-red-400 text-xs font-bold">Bağlantıyı Kes</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                onPress={handleSyncFolder}
                disabled={syncing}
                style={{ flex: 2 }}
                className="bg-[#22B573] py-3 rounded-xl items-center justify-center"
              >
                {syncing ? (
                  <ActivityIndicator size="small" color="#1C3327" />
                ) : (
                  <Text className="text-[#1C3327] text-xs font-bold">Bağla ve Senkronize Et</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
