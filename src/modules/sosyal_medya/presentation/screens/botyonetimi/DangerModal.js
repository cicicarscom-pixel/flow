/* eslint-disable i18next/no-literal-string */
import React from 'react';
import { Modal, KeyboardAvoidingView, View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';

export function DangerModal({ RESET_CONFIRM_WORD, dangerConfirmText, dangerLoading, dangerModal, handleDataReset, setDangerConfirmText, setDangerModal }) {
  return (
    <Modal
      visible={!!dangerModal}
      animationType="fade"
      transparent={true}
      onRequestClose={() => { if (!dangerLoading) { setDangerModal(null); setDangerConfirmText(''); } }}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <View
            style={{
              width: '100%',
              maxWidth: 420,
              borderRadius: 20,
              padding: 22,
              backgroundColor: '#2A2631',
              borderWidth: 1,
              borderColor: 'rgba(239,68,68,0.4)',
            }}
          >
            <Text style={{ color: '#EF4444', fontWeight: '700', fontSize: 15, marginBottom: 8 }}>
              {dangerModal === 'soft' ? 'Test Verilerini Sıfırla' : 'Fabrika Ayarlarına Sıfırla'}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginBottom: 16, lineHeight: 18 }}>
              {dangerModal === 'soft'
                ? 'Mesaj, yorum, randevu, müşteri ve bildirimleriniz kalıcı olarak silinecek. Bu işlem geri alınamaz.'
                : 'Tüm verileriniz (mesajlar, yorumlar, randevular, müşteriler, AI ayarları, hizmetler ve mali kayıtlar) kalıcı olarak silinecek. Bu işlem geri alınamaz.'}
            </Text>
            <Text style={{ color: '#fff', fontSize: 12, marginBottom: 8 }}>
              Onaylamak için aşağıya <Text style={{ fontWeight: '700' }}>{RESET_CONFIRM_WORD}</Text> yazın:
            </Text>
            <TextInput
              value={dangerConfirmText}
              onChangeText={setDangerConfirmText}
              autoCapitalize="characters"
              autoCorrect={false}
              placeholder={RESET_CONFIRM_WORD}
              placeholderTextColor="rgba(255,255,255,0.3)"
              style={{
                width: '100%',
                padding: 10,
                borderRadius: 8,
                marginBottom: 18,
                backgroundColor: 'rgba(255,255,255,0.05)',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.1)',
                color: '#fff',
              }}
            />
            <View style={{ flexDirection: 'row', gap: 12, justifyContent: 'flex-end' }}>
              <TouchableOpacity
                disabled={dangerLoading}
                onPress={() => { setDangerModal(null); setDangerConfirmText(''); }}
                style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 }}
              >
                <Text style={{ color: '#fff', fontSize: 12 }}>Vazgeç</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={dangerConfirmText !== RESET_CONFIRM_WORD || dangerLoading}
                onPress={() => handleDataReset(dangerModal)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 8,
                  backgroundColor: '#EF4444',
                  opacity: dangerConfirmText === RESET_CONFIRM_WORD ? 1 : 0.5,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                {dangerLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Onayla ve Sil</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
