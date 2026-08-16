/* eslint-disable react-hooks/refs */
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ImageBackground, StyleSheet, Animated, Easing } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { CustomButton, GlobalAppBar, supabase } from '../../../../shared';
import { useTranslation } from 'react-i18next';

// --- Utilities ---
const Skeleton = ({ width, height, style, borderRadius = 8 }) => {
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animValue, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(animValue, { toValue: 0, duration: 1000, useNativeDriver: true })
      ])
    ).start();
  }, [animValue]);

  const opacity = animValue.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.6] });

  return (
    <Animated.View style={[{ width, height, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius, opacity }, style]} />
  );
};

const formatCurrency = (amount) => {
  return Number(amount).toLocaleString('tr-TR');
};

const getDaysLeft = (dateStr) => {
  const diffTime = Math.max(new Date(dateStr) - new Date(), 0);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

const AnimatedBorderCard = ({ children, style, colors, padding = 20, borderRadius = 16, marginBottom = 0 }) => {
  const spinValue = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      spinValue.setValue(0);
      Animated.timing(spinValue, {
        toValue: 2,
        duration: 4000,
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
      
      <View style={{ flex: 1, backgroundColor: '#131314', borderRadius: borderRadius - 3.5, padding }}>
        {children}
      </View>
    </View>
  );
};

export default function AiMuhasebeScreen({ navigation }) {
  const { t, i18n } = useTranslation();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();

  const [isLoading, setIsLoading] = useState(true);
  const [financeData, setFinanceData] = useState({ income: 0, expense: 0, net: 0, receivable: 0, payable: 0 });
  
  const currentMonthName = new Date().toLocaleString(i18n.language || 'tr-TR', { month: 'long' });

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        
        let orgId = null;
        if (session) {
          const { data: orgMember } = await supabase.from('organization_members').select('organization_id').eq('user_id', session.user.id).single();
          orgId = orgMember?.organization_id;
        }

        const [docRes, transRes] = await Promise.all([
          orgId ? supabase.from('finance_documents').select('*').eq('organization_id', orgId) : supabase.from('finance_documents').select('*'),
          session ? supabase.from('transactions').select('*').eq('profile_id', session.user.id) : supabase.from('transactions').select('*')
        ]);
        
        if (docRes.error) throw docRes.error;
        if (transRes.error) throw transRes.error;
        
        const documents = docRes.data;
        const transactions = transRes.data;
        
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        let inc = 0, exp = 0;
        let receivable = 0, payable = 0;

        if (documents) {
          documents.forEach(doc => {
             const dDate = new Date(doc.created_at);
             const amount = Number(doc.amount_minor) / 100;
             
             if (dDate.getMonth() === currentMonth && dDate.getFullYear() === currentYear && doc.flow_payment_status === 'paid') {
                if (doc.type === 'income' || doc.type === 'sales') inc += amount;
                if (doc.type === 'expense') exp += amount;
             }
             
             if (doc.flow_payment_status === 'unpaid' || doc.flow_payment_status === 'partial') {
                if (doc.type === 'income' || doc.type === 'sales') receivable += amount;
                if (doc.type === 'expense') payable += amount;
             }
          });
        }

        if (transactions) {
          transactions.forEach(t => {
            if (!t.date) return;
            const dDate = new Date(t.date);
            const amount = Number(t.amount);

            if (dDate.getMonth() === currentMonth && dDate.getFullYear() === currentYear && t.status === 'paid') {
              if (t.type === 'income') inc += amount;
              if (t.type === 'expense') exp += amount;
            }

            if (t.status === 'pending') {
              if (t.type === 'income') receivable += amount;
              if (t.type === 'expense') payable += amount;
            }
          });
        }
        
        setFinanceData({ 
          income: inc, 
          expense: exp, 
          net: inc - exp,
          receivable, 
          payable 
        });
      } catch (err) {
         console.warn("Error fetching finance data", err);
      } finally {
         setIsLoading(false);
      }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();

      // Supabase Realtime Subscription for auto-updates
      const docChannel = supabase.channel('muhasebe_finance_docs')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'finance_documents' }, () => {
           fetchData();
        }).subscribe();

      const transChannel = supabase.channel('muhasebe_transactions')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
           fetchData();
        }).subscribe();

      return () => {
         supabase.removeChannel(docChannel);
         supabase.removeChannel(transChannel);
      };
    }, [fetchData])
  );

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
              <Text className="text-[#b9cacb] text-sm opacity-70 mt-1">Bu Ayki Performans ({currentMonthName})</Text>
            </View>
          </View>
        </View>

        <View className="px-5 -mt-8 relative z-10">
          {/* Summary Cards Section */}
          <View className="flex-row justify-between mb-4">
            <AnimatedBorderCard 
              style={{ flex: 1, marginRight: 8 }} 
              colors={['#00f0ff', '#ffffff']} 
              padding={16} 
              borderRadius={16}
            >
              <View className="flex-row justify-between items-start mb-1">
                <Text className="text-[#b9cacb] text-[10px] font-medium uppercase tracking-wider">Bu Ay Gelir</Text>
              </View>
              {isLoading ? (
                <Skeleton width="100%" height={24} style={{ marginTop: 4 }} />
              ) : (
                <Text className="text-[#e5e2e3] text-lg font-bold">{formatCurrency(financeData.income)} ₺</Text>
              )}
            </AnimatedBorderCard>

            <AnimatedBorderCard 
              style={{ flex: 1, marginLeft: 8 }} 
              colors={['#b600f8', '#ffffff']} 
              padding={16} 
              borderRadius={16}
            >
              <View className="flex-row justify-between items-start mb-1">
                <Text className="text-[#b9cacb] text-[10px] font-medium uppercase tracking-wider">Bu Ay Gider</Text>
              </View>
              {isLoading ? (
                <Skeleton width="100%" height={24} style={{ marginTop: 4 }} />
              ) : (
                <Text className="text-[#e5e2e3] text-lg font-bold">{formatCurrency(financeData.expense)} ₺</Text>
              )}
            </AnimatedBorderCard>
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
          <View className="pb-10 flex-col space-y-4">
            <View style={[styles.glassCard, { borderRadius: 12 }]}>
              <CustomButton 
                onPress={() => navigation.navigate('Isletmem')}
                className="bg-transparent py-4 px-4 h-auto"
                title="İŞLETMEM (GEÇMİŞ DÖNEMLER)"
                textClassName="text-[#00f0ff] text-[12px] font-bold uppercase tracking-widest"
                leftIcon={<MaterialIcons name="history" size={16} color="#00f0ff" />}
              />
            </View>

            <View style={[styles.glassCard, { borderRadius: 12 }]}>
              <CustomButton 
                onPress={() => navigation.navigate('OdemeTakvimi')}
                className="bg-transparent py-4 px-4 h-auto"
                title={t('muhasebe.aiMuhasebe.paymentCalendar')}
                textClassName="text-[#4edea3] text-[12px] font-bold uppercase tracking-widest"
                leftIcon={<MaterialIcons name="calendar-month" size={16} color="#4edea3" />}
              />
            </View>
            
            <View style={[styles.glassCard, { borderRadius: 12 }]}>
              <CustomButton 
                onPress={() => navigation.navigate('AiAssistant', { mode: 'report' })}
                className="bg-transparent py-4 px-4 h-auto"
                title={t('muhasebe.aiMuhasebe.aiAssistant')}
                textClassName="text-[#4edea3] text-[12px] font-bold uppercase tracking-widest"
                leftIcon={<MaterialIcons name="auto-awesome" size={16} color="#4edea3" />}
              />
            </View>

            <View style={[styles.glassCard, { borderRadius: 12, marginTop: 16 }]}>
              <CustomButton 
                onPress={() => navigation.navigate('Muhasebecim')}
                className="bg-transparent py-4 px-4 h-auto"
                title="MUHASEBECİ BAĞLANTISI"
                textClassName="text-[#00daf3] text-[12px] font-bold uppercase tracking-widest"
                leftIcon={<MaterialIcons name="vpn-key" size={16} color="#00daf3" />}
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
