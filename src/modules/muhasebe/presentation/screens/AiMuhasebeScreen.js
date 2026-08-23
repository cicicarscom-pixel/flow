/* eslint-disable react-hooks/refs */
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ImageBackground, StyleSheet, Animated, Easing } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { GlobalAppBar, supabase } from '../../../../shared';
import { useTranslation } from 'react-i18next';

// --- Utilities ---
const Skeleton = ({ width, height, style, borderRadius = 8 }) => {
  const [animValue] = useState(() => new Animated.Value(0));

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

// Sayı sayarak artan (count-up) değer gösterimi — sadece görsel.
const AnimatedNumber = ({ value, isLoading, style, suffix = ' ₺' }) => {
  const [animValue] = useState(() => new Animated.Value(0));
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (isLoading) return;
    const listenerId = animValue.addListener(({ value: v }) => setDisplayValue(v));
    animValue.setValue(0);
    Animated.timing(animValue, { toValue: value, duration: 900, useNativeDriver: false }).start();
    return () => animValue.removeListener(listenerId);
  }, [value, isLoading]);

  return <Text style={style}>{formatCurrency(Math.round(displayValue))}{suffix}</Text>;
};

const getDaysLeft = (dateStr) => {
  const diffTime = Math.max(new Date(dateStr) - new Date(), 0);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

const AnimatedBorderCard = ({ children, style, colors, padding = 20, borderRadius = 16, marginBottom = 0 }) => {
  const [spinValue] = useState(() => new Animated.Value(0));

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
          colors={colors ? ['rgba(255,255,255,0)', 'rgba(255,255,255,0)', colors[0], '#ffffff'] : ['rgba(255,255,255,0)', 'rgba(255,255,255,0)', '#C2478D', '#ffffff']}
          locations={[0, 0.4, 0.9, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
      
      <View style={{ flex: 1, backgroundColor: '#201D24', borderRadius: borderRadius - 3.5, padding }}>
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

  // --- Sadece görsel: ekran girişinde içerik yumuşakça belirir ---
  const [fadeAnim] = useState(() => new Animated.Value(0));
  const [slideAnim] = useState(() => new Animated.Value(20));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        
        let orgId = null;
        if (session) {
          const { data: orgMember } = await supabase.from('organization_members').select('organization_id').eq('user_id', session.user.id).maybeSingle();
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
      const docChannel = supabase.channel(`muhasebe_finance_docs_${Math.random()}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'finance_documents' }, () => {
           fetchData();
        }).subscribe();

      const transChannel = supabase.channel(`muhasebe_transactions_${Math.random()}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
           fetchData();
        }).subscribe();

      return () => {
         supabase.removeChannel(docChannel);
         supabase.removeChannel(transChannel);
      };
    }, [fetchData])
  );

  const menuItems = [
    { icon: 'history', label: 'İşletmem (Geçmiş Dönemler)', color: '#22B573', onPress: () => navigation.navigate('Isletmem') },
    { icon: 'calendar-month', label: t('muhasebe.aiMuhasebe.paymentCalendar'), color: '#22B573', onPress: () => navigation.navigate('OdemeTakvimi') },
    { icon: 'auto-awesome', label: t('muhasebe.aiMuhasebe.aiAssistant'), color: '#FF7A59', onPress: () => navigation.navigate('AiAssistant', { mode: 'report' }) },
    { icon: 'vpn-key', label: 'Muhasebeci Bağlantısı', color: '#C2478D', onPress: () => navigation.navigate('Muhasebecim') },
  ];

  return (
    <View className="flex-1 bg-[#17151A]">
      <ImageBackground 
        source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDUpjAKmMNnHDAuGn7KDAmiX4BVuWBLEG-5a7fHFVu_x7Jxrfh8UzY6rM-oy3AiqN0b1h6_K5iobCNsv2B4iHnz_lPjQ6QXfGvJ4UZmCcQLcr6H8o6m3I1JVFmgqk7UubXZx96-wpkV8-ScZZBzzkpl4-_WMzeHLyFljEKugxDZQXZgdkjst86sxa7hU95rBimeOBSnqHbdwH9bj_yj1tbla3T_HPG2xI6XkgTpyJRiDhmg9Po0q7NWy9DKn3JnR0b5tcpUj4Vcxr3w' }}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      >
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(10, 10, 11, 0.85)' }]} />
      </ImageBackground>
      {/* Top Navigation Bar */}
      <GlobalAppBar level={2} module="finans" title={t('muhasebe.aiMuhasebe.title')} showProfile={true} />

      <ScrollView 
        contentContainerStyle={{ paddingBottom: 130 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

        {/* Hero: Net Bakiye */}
        <View className="relative w-full aspect-[16/10]">
          <Image 
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuADpQLzK3KlOHrAkmBuzvSGufJQAu1Zc49a9sefZZVnNhSUsnZKCnLqRabQjcd-DvPLJbL9F8pWVNcFPpeGsmltliUUREeZAtKVXtYR4v0ZlZNAfByDxcXlmMnQNQIpF8zakz3JkZbDH6e09olSUJzIZEjpYdASmhKlpcCtWAITtVIEN1bpYc8xP21RA_OOW7CeiZyjyie0xJCmDMEhJeSkpNzFuVZ1SMnf1Uvm_8Rrwr9DkxZlpyveDbD0UD5QqlyeX8aKwxbG_GFk' }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', '#201D24']}
            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '65%' }}
          />
          <View className="absolute bottom-12 left-5 right-5">
            <Text style={styles.heroLabel}>{t('muhasebe.aiMuhasebe.netBalance', { defaultValue: 'NET BAKİYE' })} · {currentMonthName.toUpperCase()}</Text>
            {isLoading ? (
              <Skeleton width={180} height={38} style={{ marginTop: 8 }} />
            ) : (
              <AnimatedNumber
                value={financeData.net}
                isLoading={isLoading}
                style={[styles.heroNetValue, { color: financeData.net >= 0 ? '#22B573' : '#EF4444' }]}
              />
            )}
          </View>
        </View>

        <View className="px-5 -mt-8 relative z-10">

          {/* Gelir / Gider */}
          <View className="flex-row justify-between mb-3">
            <AnimatedBorderCard 
              style={{ flex: 1, marginRight: 8 }} 
              colors={['#22B573', '#ffffff']} 
              padding={16} 
              borderRadius={20}
            >
              <View className="flex-row justify-between items-start mb-1">
                <Text className="text-[#A79E96] text-[10px] font-medium uppercase tracking-wider">{t('muhasebe.aiMuhasebe.thisMonthIncome', { defaultValue: 'Bu Ay Gelir' })}</Text>
                <MaterialIcons name="trending-up" size={14} color="#22B573" />
              </View>
              {isLoading ? (
                <Skeleton width="100%" height={24} style={{ marginTop: 4 }} />
              ) : (
                <AnimatedNumber value={financeData.income} isLoading={isLoading} style={{ color: '#F6F1EC', fontSize: 18, fontWeight: '700' }} />
              )}
            </AnimatedBorderCard>

            <AnimatedBorderCard 
              style={{ flex: 1, marginLeft: 8 }} 
              colors={['#C2478D', '#ffffff']} 
              padding={16} 
              borderRadius={20}
            >
              <View className="flex-row justify-between items-start mb-1">
                <Text className="text-[#A79E96] text-[10px] font-medium uppercase tracking-wider">{t('muhasebe.aiMuhasebe.thisMonthExpense', { defaultValue: 'Bu Ay Gider' })}</Text>
                <MaterialIcons name="trending-down" size={14} color="#C2478D" />
              </View>
              {isLoading ? (
                <Skeleton width="100%" height={24} style={{ marginTop: 4 }} />
              ) : (
                <AnimatedNumber value={financeData.expense} isLoading={isLoading} style={{ color: '#F6F1EC', fontSize: 18, fontWeight: '700' }} />
              )}
            </AnimatedBorderCard>
          </View>

          {/* Alacak / Borç mini istatistikler */}
          <View style={styles.miniStatsRow}>
            <View style={styles.miniStat}>
              <MaterialIcons name="call-received" size={15} color="#22B573" />
              <Text style={styles.miniStatLabel}>{t('muhasebe.aiMuhasebe.receivable', { defaultValue: 'Alacak' })}</Text>
              {isLoading ? (
                <Skeleton width={60} height={14} />
              ) : (
                <Text style={styles.miniStatValue}>{formatCurrency(financeData.receivable)} {t('currencySymbol', { defaultValue: '₺' })}</Text>
              )}
            </View>
            <View style={styles.miniStatDivider} />
            <View style={styles.miniStat}>
              <MaterialIcons name="call-made" size={15} color="#EF4444" />
              <Text style={styles.miniStatLabel}>{t('muhasebe.aiMuhasebe.payable', { defaultValue: 'Borç' })}</Text>
              {isLoading ? (
                <Skeleton width={60} height={14} />
              ) : (
                <Text style={styles.miniStatValue}>{formatCurrency(financeData.payable)} {t('currencySymbol', { defaultValue: '₺' })}</Text>
              )}
            </View>
          </View>

          {/* Hızlı Aksiyonlar */}
          <View className="flex-row justify-between mt-5 mb-3">
            <TouchableOpacity
              onPress={() => navigation.navigate('AiChat', { transactionType: 'income' })}
              style={[styles.quickActionBtn, { backgroundColor: 'rgba(34, 181, 115, 0.12)', borderColor: 'rgba(34, 181, 115, 0.3)', marginRight: 8 }]}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(34, 181, 115, 0.18)' }]}>
                <MaterialIcons name="add" size={18} color="#22B573" />
              </View>
              <Text style={[styles.quickActionText, { color: '#22B573' }]}>{t('muhasebe.aiMuhasebe.enterIncome')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('AiChat', { transactionType: 'expense' })}
              style={[styles.quickActionBtn, { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.25)', marginLeft: 8 }]}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(239, 68, 68, 0.16)' }]}>
                <MaterialIcons name="remove" size={18} color="#EF4444" />
              </View>
              <Text style={[styles.quickActionText, { color: '#EF4444' }]}>{t('muhasebe.aiMuhasebe.enterExpense')}</Text>
            </TouchableOpacity>
          </View>

          {/* Menü */}
          <View style={styles.menuCard}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={item.label}
                onPress={item.onPress}
                style={[styles.menuRow, index < menuItems.length - 1 && styles.menuRowBorder]}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIconWrapper, { backgroundColor: `${item.color}1F` }]}>
                  <MaterialIcons name={item.icon} size={18} color={item.color} />
                </View>
                <Text style={styles.menuRowText}>{item.label}</Text>
                <MaterialIcons name="chevron-right" size={20} color="#756D66" />
              </TouchableOpacity>
            ))}
          </View>

        </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  glassCard: {
    backgroundColor: 'rgba(32, 31, 34, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(34, 181, 115, 0.2)',
    borderRadius: 20,
    shadowColor: '#000000',
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 6,
  },
  heroLabel: {
    color: '#A79E96',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 6,
  },
  heroNetValue: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  miniStatsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(42, 38, 49, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,247,240,0.06)',
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  miniStat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  miniStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,247,240,0.08)',
  },
  miniStatLabel: {
    color: '#A79E96',
    fontSize: 10,
    fontWeight: '600',
  },
  miniStatValue: {
    color: '#F6F1EC',
    fontSize: 13,
    fontWeight: '700',
  },
  quickActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    padding: 10,
    gap: 8,
  },
  quickActionIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionText: {
    fontSize: 11,
    fontWeight: '700',
    flexShrink: 1,
  },
  menuCard: {
    backgroundColor: 'rgba(42, 38, 49, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,247,240,0.06)',
    borderRadius: 20,
    marginTop: 8,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  menuRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,247,240,0.06)',
  },
  menuIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuRowText: {
    flex: 1,
    color: '#F6F1EC',
    fontSize: 13,
    fontWeight: '600',
  },
});
