/* eslint-disable i18next/no-literal-string */
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

export function DangerZoneSection({ setDangerConfirmText, setDangerModal }) {
  return (
    <View
      style={{
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(239,68,68,0.3)',
        backgroundColor: 'rgba(239,68,68,0.05)',
        marginBottom: 4,
      }}
    >
      <Text style={{ color: '#EF4444', fontWeight: '700', fontSize: 13, marginBottom: 2 }}>
        Tehlikeli Bölge
      </Text>
      <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginBottom: 14 }}>
        Bu bölgedeki işlemler geri alınamaz. Lütfen dikkatli olun.
      </Text>
    
      <View className="flex-row justify-between items-center mb-3">
        <View style={{ flex: 1, paddingRight: 10 }}>
          <Text style={{ color: '#fff', fontWeight: '600', fontSize: 12 }}>
            Test Verilerini Sıfırla
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, marginTop: 2 }}>
            Mesaj, yorum, randevu, müşteri ve bildirimleri siler. Ayarlarınız korunur.
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => { setDangerConfirmText(''); setDangerModal('soft'); }}
          style={{
            backgroundColor: 'rgba(239,68,68,0.15)',
            borderWidth: 1,
            borderColor: 'rgba(239,68,68,0.4)',
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 10,
          }}
        >
          <Text style={{ color: '#EF4444', fontSize: 11, fontWeight: '700' }}>Sıfırla</Text>
        </TouchableOpacity>
      </View>
    
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTopWidth: 1,
          borderTopColor: 'rgba(255,255,255,0.05)',
          paddingTop: 12,
        }}
      >
        <View style={{ flex: 1, paddingRight: 10 }}>
          <Text style={{ color: '#fff', fontWeight: '600', fontSize: 12 }}>
            Fabrika Ayarlarına Sıfırla
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, marginTop: 2 }}>
            Yukarıdakilere ek olarak AI ayarlarınızı, hizmetlerinizi ve mali kayıtlarınızı da siler.
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => { setDangerConfirmText(''); setDangerModal('hard'); }}
          style={{
            backgroundColor: '#EF4444',
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 10,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>Fabrika Ayarları</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
