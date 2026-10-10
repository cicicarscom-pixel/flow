import React from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import TypingDots from '../TypingDots';

// Sohbet baloncukları + boş durum önerileri + yazıyor göstergesi (FlowAiHost'tan birebir taşındı).
export default function MessageList({ messages, busy, send, listRef, atBottomRef, t }) {
  return (
    <FlatList
      ref={listRef}
      data={messages}
      keyExtractor={(m) => m.id}
      scrollEventThrottle={100}
      onScroll={(e) => {
        const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
        atBottomRef.current = contentOffset.y + layoutMeasurement.height >= contentSize.height - 80;
      }}
      onContentSizeChange={() => {
        if (atBottomRef.current) listRef.current?.scrollToEnd?.({ animated: true });
      }}
      contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 10 }}
      ListEmptyComponent={
        <View>
          <Text style={{ color: '#8B949E', textAlign: 'center', marginVertical: 14 }}>{t('flowAi.empty')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
            {['chipAppointments', 'chipPost', 'chipAccounts'].map((k) => (
              <TouchableOpacity key={k} onPress={() => send(t(`flowAi.${k}`))} style={{ margin: 4, paddingVertical: 7, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.03)' }}>
                <Text style={{ color: '#8B949E', fontSize: 12 }}>{t(`flowAi.${k}`)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      }
      ListFooterComponent={busy && messages.length > 0 ? (
        <View testID="flow_ai_typing" style={{ alignSelf: 'flex-start', marginVertical: 4, borderRadius: 18, borderTopLeftRadius: 6, paddingVertical: 12, paddingHorizontal: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', backgroundColor: 'rgba(255,255,255,0.04)' }}>
          <TypingDots color="#9D5CFF" size={7} />
        </View>
      ) : null}
      renderItem={({ item }) => {
        const mine = item.role === 'user';
        const bubble = { maxWidth: '85%', marginVertical: 4, borderRadius: 18, overflow: 'hidden' };
        if (mine) {
          return (
            <View style={[bubble, { alignSelf: 'flex-end', borderTopRightRadius: 6 }]}>
              <LinearGradient colors={['#3B82F6', '#9D5CFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ padding: 11 }}>
                <Text style={{ color: '#fff', fontSize: 14 }}>{item.text}</Text>
              </LinearGradient>
            </View>
          );
        }
        return (
          <View style={[bubble, { alignSelf: 'flex-start', borderTopLeftRadius: 6, padding: 11, borderWidth: 1, borderColor: item.role === 'error' ? 'rgba(248,81,73,0.35)' : 'rgba(255,255,255,0.05)', backgroundColor: item.role === 'error' ? 'rgba(248,81,73,0.10)' : 'rgba(255,255,255,0.04)' }]}>
            <Text style={{ color: '#D7DEE7', fontSize: 14 }}>{item.text}</Text>
          </View>
        );
      }}
    />
  );
}
