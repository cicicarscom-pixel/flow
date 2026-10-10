/* eslint-disable i18next/no-literal-string */
import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { styles } from './randevuStyles';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function ManageCalendarsModal({ calendars, deleteCalendar, isManageModalVisible, setIsManageModalVisible, setPromptConfig, updateCalendar }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={isManageModalVisible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { paddingBottom: 20 + Math.max(insets.bottom, 16) }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Takvim / Personel Yönetimi</Text>
            <TouchableOpacity onPress={() => setIsManageModalVisible(false)}>
              <Ionicons name="close" size={24} color="#A79E96" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
            {calendars.length === 0 ? (
              <Text style={{ color: '#A79E96', textAlign: 'center', marginVertical: 20 }}>Henüz takvim bulunmuyor.</Text>
            ) : (
              calendars.map(cal => (
                <View key={cal.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' }}>
                  <Text style={{ color: '#fff', fontSize: 16, flex: 1 }} numberOfLines={1}>{cal.name}</Text>
                  <View style={{ flexDirection: 'row', gap: 20, marginLeft: 10 }}>
                    <TouchableOpacity onPress={() => {
                        setPromptConfig({
                        visible: true,
                        title: "Takvimi Düzenle",
                        placeholder: "Yeni takvim adı",
                        value: cal.name,
                        onSave: (newName) => {
                          if (newName && newName.trim()) {
                            updateCalendar(cal.id, newName.trim()).catch(e => Alert.alert("Hata", e.message));
                          }
                        }
                      });
                    }}>
                      <Ionicons name="pencil" size={22} color="#22B573" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => {
                        Alert.alert("Emin misiniz?", `'${cal.name}' silinecek.`, [
                          { text: "İptal", style: "cancel" },
                          { text: "Sil", style: "destructive", onPress: () => {
                              deleteCalendar(cal.id).catch(e => Alert.alert("Hata", e.message));
                            }
                          }
                        ]);
                    }}>
                      <Ionicons name="trash" size={22} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
