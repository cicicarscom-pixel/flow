/* eslint-disable react-hooks/refs */
import React, { useRef, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ImageBackground, StyleSheet, Animated, Easing } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { CustomButton } from '../../../../shared';
import { GlobalAppBar } from '../../../../shared';
import { useTranslation } from 'react-i18next';

const AnimatedBorderCard = ({ children, style, colors, padding = 20, borderRadius = 16, marginBottom = 0 }) => {
  const spinValue = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      // Önce değeri sıfırla ki her sekme geçişinde baştan başlasın
      spinValue.setValue(0);
      
      Animated.timing(spinValue, {
        toValue: 2, // 2 tam tur atacak
        duration: 4000, // Toplam 4 saniye sürecek
        easing: Easing.linear,
        useNativeDriver: true,
      }).start();
      
      return () => {
        spinValue.stopAnimation();
      };
    }, [])
  );

  const spin = spinValue.interpolate({
    inputRange: [0, 1, 2],
    outputRange: ['0deg', '360deg', '720deg']
  });

  return (
    <View style={[style, { overflow: 'hidden', padding: 3.5, borderRadius, marginBottom, backgroundColor: 'rgba(255,255,255,0.03)' }]}>
      {/* Spinning Gradient Background (The traveling light) */}
      <Animated.View style={{ 
        position: 'absolute',
        top: '-100%', bottom: '-100%', left: '-100%', right: '-100%',
        transform: [{ rotate: spin }],
      }}>
        <LinearGradient
          colors={colors ? ['rgba(255,255,255,0)', 'rgba(255,255,255,0)', colors[0], '#ffffff'] : ['rgba(255,255,255,0)', 'rgba(255,255,255,0)', '#bc13fe', '#ffffff']}
          locations={[0, 0.4, 0.9, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
      
      {/* Inner Mask to hide the middle of the gradient, showing only the border */}
      <View style={{ flex: 1, backgroundColor: '#131314', borderRadius: borderRadius - 3.5, padding }}>
        {children}
      </View>
    </View>
  );
};

export default function AiMuhasebeScreen({ navigation }) {
  const { t } = useTranslation();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();

  const MOCK_AMOUNTS = {
    revenue: "50.000 ₺",
    expense: "20.000 ₺",
    rent: "12.000 ₺",
    supplier: "8.500 ₺"
  };

  return (
    <View className="flex-1 bg-[#0A0A0B]">
      <ImageBackground 
        source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDUpjAKmMNnHDAuGn7KDAmiX4BVuWBLEG-5a7fHFVu_x7Jxrfh8UzY6rM-oy3AiqN0b1h6_K5iobCNsv2B4iHnz_lPjQ6QXfGvJ4UZmCcQLcr6H8o6m3I1JVFmgqk7UubXZx96-wpkV8-ScZZBzzkpl4-_WMzeHLyFljEKugxDZQXZgdkjst86sxa7hU95rBimeOBSnqHbdwH9bj_yj1tbla3T_HPG2xI6XkgTpyJRiDhmg9Po0q7NWy9DKn3JnR0b5tcpUj4Vcxr3w' }}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      >
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(10, 10, 11, 0.8)' }]} />
      </ImageBackground>
      {/* Top Navigation Bar */}
      <GlobalAppBar level={2} module="finans" title={t('muhasebe.aiMuhasebe.title')} showProfile={true} />

      <ScrollView 
        contentContainerStyle={{ paddingBottom: 130 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View className="relative w-full aspect-[16/10]">
          <Image 
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuADpQLzK3KlOHrAkmBuzvSGufJQAu1Zc49a9sefZZVnNhSUsnZKCnLqRabQjcd-DvPLJbL9F8pWVNcFPpeGsmltliUUREeZAtKVXtYR4v0ZlZNAfByDxcXlmMnQNQIpF8zakz3JkZbDH6e09olSUJzIZEjpYdASmhKlpcCtWAITtVIEN1bpYc8xP21RA_OOW7CeiZyjyie0xJCmDMEhJeSkpNzFuVZ1SMnf1Uvm_8Rrwr9DkxZlpyveDbD0UD5QqlyeX8aKwxbG_GFk' }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', '#0e0e0f']}
            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%' }}
          />
          <View className="absolute bottom-12 left-5 right-5">
            <View className="mb-2">
              <Text className="text-[#00f0ff] text-[28px] font-bold tracking-tight">{t('muhasebe.aiMuhasebe.financialSummary')}</Text>
              <Text className="text-[#b9cacb] text-sm opacity-70 mt-1">{t('muhasebe.aiMuhasebe.junePerformance')}</Text>
            </View>
          </View>
        </View>

        <View className="px-5 -mt-8 relative z-10">
          {/* Summary Cards Section */}
          <View className="flex-row justify-between mb-6">
            <AnimatedBorderCard 
              style={{ flex: 1, marginRight: 8 }} 
              colors={['#00f0ff', '#ffffff']} 
              padding={20} 
              borderRadius={16}
            >
              <LinearGradient colors={['#00f0ff', 'transparent']} start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, opacity: 0.5 }} />
              <View className="flex-row justify-between items-start mb-2">
                <Text className="text-[#b9cacb] text-xs font-medium uppercase tracking-wider">{t('muhasebe.aiMuhasebe.income')}</Text>
                <MaterialIcons name="account-balance" size={20} color="#00f0ff" />
              </View>
              <Text className="text-[#e5e2e3] text-2xl font-bold mt-1">{MOCK_AMOUNTS.revenue}</Text>
              <View className="flex-row items-center mt-2">
                <View className="w-1.5 h-1.5 rounded-full bg-[#00f0ff] mr-1.5" />
                <Text className="text-[#b9cacb]/60 text-[10px]">{t('muhasebe.aiMuhasebe.mockBank1')}</Text>
              </View>
              <View className="flex-row items-center mt-4 bg-white/5 self-start px-2 py-1 rounded-full border border-[#00f0ff]/20">
                <View className="w-2 h-2 rounded-full bg-[#00ff7f] mr-1.5 shadow-sm shadow-[#00ff7f]" />
                <Text className="text-[#00ff7f] text-[10px] font-medium">{t('muhasebe.aiMuhasebe.incomePercentage', { percent: 75 })}</Text>
              </View>
            </AnimatedBorderCard>

            <AnimatedBorderCard 
              style={{ flex: 1, marginLeft: 8 }} 
              colors={['#b600f8', '#ffffff']} 
              padding={20} 
              borderRadius={16}
            >
              <LinearGradient colors={['#ffb4ab', 'transparent']} start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, opacity: 0.5 }} />
              <View className="flex-row justify-between items-start mb-2">
                <Text className="text-[#b9cacb] text-xs font-medium uppercase tracking-wider">{t('muhasebe.aiMuhasebe.expense')}</Text>
                <MaterialIcons name="payments" size={20} color="#ffb4ab" />
              </View>
              <Text className="text-[#e5e2e3] text-2xl font-bold mt-1">{MOCK_AMOUNTS.expense}</Text>
              <View className="flex-row items-center mt-2">
                <View className="w-1.5 h-1.5 rounded-full bg-[#ffb4ab] mr-1.5" />
                <Text className="text-[#b9cacb]/60 text-[10px]">{t('muhasebe.aiMuhasebe.mockBank2')}</Text>
              </View>
              <View className="flex-row items-center mt-4 bg-white/5 self-start px-2 py-1 rounded-full border border-[#ffb4ab]/20">
                <View className="w-2 h-2 rounded-full bg-[#ff3131] mr-1.5 shadow-sm shadow-[#ff3131]" />
                <Text className="text-[#ff3131] text-[10px] font-medium">{t('muhasebe.aiMuhasebe.expensePercentage', { percent: 30 })}</Text>
              </View>
            </AnimatedBorderCard>
          </View>

          {/* Upcoming Payments Section */}
          <View className="mb-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-[#e5e2e3] text-xl font-semibold">{t('muhasebe.aiMuhasebe.upcomingPayments')}</Text>
              <TouchableOpacity>
                <Text className="text-[#00f0ff] text-xs font-medium">{t('muhasebe.aiMuhasebe.seeAll')}</Text>
              </TouchableOpacity>
            </View>

            {/* Item 1 */}
            <View style={[styles.glassCard, { padding: 16, marginBottom: 12 }]}>
              <View className="flex-row items-center">
                <View className="w-12 h-12 rounded-lg bg-[#353436]/40 border border-white/10 items-center justify-center mr-4">
                  <Text className="text-[#b9cacb] text-[10px] font-bold uppercase">{t('muhasebe.aiMuhasebe.months.jun')}</Text>
                  <Text className="text-[#00f0ff] text-lg font-bold">15</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-[#e5e2e3] text-base font-semibold">{t('muhasebe.aiMuhasebe.rent')}</Text>
                  <Text className="text-[#b9cacb] text-xs mt-0.5">{t('muhasebe.aiMuhasebe.privateHousingPayment')}</Text>
                </View>
                <View className="items-end">
                  <Text className="text-[#e5e2e3] text-base font-bold mb-1.5">{MOCK_AMOUNTS.rent}</Text>
                  <View className="px-2 py-0.5 rounded-full bg-[#00f0ff]/10 border border-[#00f0ff]/20">
                    <Text className="text-[#00f0ff] text-[10px]">{t('muhasebe.aiMuhasebe.daysLeft', { count: 3 })}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Item 2 */}
            {/* Item 2 */}
            <View style={[styles.glassCard, { padding: 16 }]}>
              <View className="flex-row items-center">
                <View className="w-12 h-12 rounded-lg bg-[#353436]/40 border border-white/10 items-center justify-center mr-4">
                  <Text className="text-[#b9cacb] text-[10px] font-bold uppercase">{t('muhasebe.aiMuhasebe.months.jun')}</Text>
                  <Text className="text-[#00f0ff] text-lg font-bold">18</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-[#e5e2e3] text-base font-semibold">{t('muhasebe.aiMuhasebe.supplier')}</Text>
                  <Text className="text-[#b9cacb] text-xs mt-0.5">{t('muhasebe.aiMuhasebe.softwareInfrastructureFee')}</Text>
                </View>
                <View className="items-end">
                  <Text className="text-[#e5e2e3] text-base font-bold mb-1.5">{MOCK_AMOUNTS.supplier}</Text>
                  <View className="px-2 py-0.5 rounded-full bg-[#b600f8]/10 border border-[#b600f8]/20">
                    <Text className="text-[#ebb2ff] text-[10px]">{t('muhasebe.aiMuhasebe.daysLeft', { count: 6 })}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Action Buttons Section */}
          <View className="flex-row justify-between pt-2 pb-6">
            <View style={[styles.glassCard, { flex: 1, borderRadius: 12, marginRight: 6 }]}>
              <CustomButton 
                onPress={() => navigation.navigate('AiChat', { transactionType: 'income' })}
                className="bg-transparent py-3 px-2 h-auto"
                leftIcon={<MaterialIcons name="add-circle-outline" size={16} color="#00f0ff" />}
                title={t('muhasebe.aiMuhasebe.enterIncome')}
                textClassName="text-[#00f0ff] text-[11px] font-bold uppercase tracking-widest ml-1"
              />
            </View>
            
            <View style={[styles.glassCard, { flex: 1, borderRadius: 12, marginLeft: 6 }]}>
              <CustomButton 
                onPress={() => navigation.navigate('AiChat', { transactionType: 'expense' })}
                className="bg-transparent py-3 px-2 h-auto"
                leftIcon={<MaterialIcons name="remove-circle-outline" size={16} color="#b600f8" />}
                title={t('muhasebe.aiMuhasebe.enterExpense')}
                textClassName="text-[#b600f8] text-[11px] font-bold uppercase tracking-widest ml-1"
              />
            </View>
          </View>

          {/* New Bottom Buttons */}
          <View className="pb-10">
            <View style={[styles.glassCard, { borderRadius: 12, marginBottom: 16 }]}>
              <CustomButton 
                onPress={() => navigation.navigate('OdemeTakvimi')}
                className="bg-transparent py-4 px-4 h-auto"
                title={t('muhasebe.aiMuhasebe.paymentCalendar')}
                textClassName="text-[#4edea3] text-[12px] font-bold uppercase tracking-widest"
                leftIcon={<MaterialIcons name="calendar-month" size={16} color="#4edea3" />}
              />
            </View>
            
            <View style={[styles.glassCard, { borderRadius: 12, marginBottom: 16 }]}>
              <CustomButton 
                onPress={() => navigation.navigate('AiAssistant', { mode: 'report' })}
                className="bg-transparent py-4 px-4 h-auto"
                title={t('muhasebe.aiMuhasebe.aiAssistant')}
                textClassName="text-[#4edea3] text-[12px] font-bold uppercase tracking-widest"
                leftIcon={<MaterialIcons name="auto-awesome" size={16} color="#4edea3" />}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  glassCard: {
    backgroundColor: 'rgba(32, 31, 34, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.2)',
    borderRadius: 20,
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  }
});
