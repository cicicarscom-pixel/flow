/* eslint-disable i18next/no-literal-string */
import React from 'react';
import { Modal, View, Text, TouchableOpacity, Alert, ScrollView, ImageBackground, ActivityIndicator } from 'react-native';
import { styles } from './botStyles';
import { Ionicons } from '@expo/vector-icons';
import { CustomButton, supabase, CustomInput } from '../../../../../shared';

export function WhatsAppModal({ botUseCase, handleGetPairingCode, handleRefreshQr, isWhatsAppConnected, loginMethod, pairingLoading, qrLoading, setIsWhatsAppConnected, setLoginMethod, setQrLoading, setWahaPairingCode, setWahaPhone, setWahaQrCode, setWhatsappModalVisible, wahaPairingCode, wahaPhone, wahaQrCode, whatsappModalVisible }) {
  return (
    <Modal
      visible={whatsappModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setWhatsappModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent} className="bg-[#2A2631] border border-white/10">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-base font-bold text-white">WhatsApp Bağlantısı</Text>
            <TouchableOpacity onPress={() => setWhatsappModalVisible(false)}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
    
          {isWhatsAppConnected ? (
            <View className="items-center py-4">
              <View className="w-16 h-16 bg-[#25D366]/10 rounded-full items-center justify-center mb-4">
                <Ionicons name="checkmark-circle" size={40} color="#25D366" />
              </View>
              <Text className="text-white font-semibold text-sm mb-1">Asistan WhatsApp&apos;a Bağlı</Text>
              {wahaPhone ? <Text className="text-gray-400 text-xs mb-6">Telefon: +{wahaPhone}</Text> : null}
    
              <CustomButton
                title="Bağlantıyı Kes"
                onPress={async () => {
                  Alert.alert('Bağlantıyı Kes', 'Bağlantıyı kesmek istediğinize emin misiniz?', [
                    { text: 'Vazgeç' },
                    { 
                      text: 'Bağlantıyı Kes', 
                      onPress: async () => {
                        setQrLoading(true);
                        try {
                          const { data: { session } } = await supabase.auth.getSession();
                          if (session) {
                            await botUseCase.stopSession(session.user.id);
                            setIsWhatsAppConnected(false);
                            setWahaQrCode(null);
                            setWahaPairingCode(null);
                            setWhatsappModalVisible(false);
                            Alert.alert('Bağlantı Kesildi', 'WhatsApp bağlantınız kaldırıldı.');
                          }
                        } catch (e) {
                          console.error(e);
                          Alert.alert('Hata', 'Bağlantı kesilirken bir sorun oluştu. Lütfen tekrar deneyin.');
                        } finally {
                          setQrLoading(false);
                        }
                      } 
                    }
                  ]);
                }}
                className="w-full bg-red-500/10 border border-red-500/40"
                textClassName="text-red-500 font-bold"
              />
            </View>
          ) : (
            <ScrollView>
              <View className="flex-row bg-white/5 p-1 rounded-xl mb-4">
                <TouchableOpacity 
                  onPress={() => setLoginMethod('qr')}
                  style={{ flex: 1, backgroundColor: loginMethod === 'qr' ? 'rgba(34, 181, 115, 0.15)' : 'transparent' }}
                  className="py-2 rounded-lg items-center"
                >
                  <Text className="text-white text-xs font-semibold">QR Kod</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => setLoginMethod('phone')}
                  style={{ flex: 1, backgroundColor: loginMethod === 'phone' ? 'rgba(34, 181, 115, 0.15)' : 'transparent' }}
                  className="py-2 rounded-lg items-center"
                >
                  <Text className="text-white text-xs font-semibold">Telefon İle Bağlan</Text>
                </TouchableOpacity>
              </View>
    
              {loginMethod === 'qr' ? (
                <View className="items-center py-2">
                  <View className="w-44 h-44 bg-white rounded-xl items-center justify-center mb-4 overflow-hidden p-2">
                    {wahaQrCode ? (
                      <ImageBackground 
                        source={{ uri: wahaQrCode.startsWith('data:image') ? wahaQrCode : `data:image/png;base64,${wahaQrCode}` }} 
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="contain"
                      />
                    ) : (
                      <View className="items-center justify-center">
                        <ActivityIndicator size="small" color="#22B573" />
                        <Text className="text-black text-[10px] font-semibold mt-2">QR Kod Bekleniyor...</Text>
                      </View>
                    )}
                  </View>
    
                  <CustomButton
                    title="QR Kodu Yenile"
                    onPress={handleRefreshQr}
                    isLoading={qrLoading}
                    leftIcon={<Ionicons name="refresh" size={16} color="#1C3327" />}
                    className="w-full mb-2"
                    textClassName="text-[#1C3327] font-bold"
                  />
                </View>
              ) : (
                <View className="py-2">
                  <CustomInput
                    value={wahaPhone}
                    onChangeText={setWahaPhone}
                    placeholder="Telefon numarası"
                    keyboardType="phone-pad"
                    leftIcon={<Ionicons name="call-outline" size={18} color="#22B573" />}
                    containerClassName="mb-3"
                  />
    
                  <CustomButton
                    title="Eşleşme Kodu Al"
                    onPress={handleGetPairingCode}
                    isLoading={pairingLoading}
                    leftIcon={<Ionicons name="key-outline" size={16} color="#1C3327" />}
                    className="w-full mb-4"
                    textClassName="text-[#1C3327] font-bold"
                  />
    
                  {wahaPairingCode && (
                    <View className="bg-black/40 border border-[#22B573]/30 rounded-xl p-4 items-center justify-center mb-4">
                      <Text className="text-gray-400 text-[10px] mb-1">Eşleşme Kodunuz</Text>
                      <Text className="text-[#22B573] text-2xl font-bold tracking-widest">{wahaPairingCode}</Text>
                    </View>
                  )}
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}
