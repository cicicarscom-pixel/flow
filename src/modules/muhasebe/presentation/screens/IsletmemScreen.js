import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../../../../shared';
import { useTranslation } from 'react-i18next';

const formatCurrency = (amount) => {
  return Number(amount).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const getBadge = (status, t) => {
  switch (status) {
    case 'paid': return { bg: 'rgba(75, 226, 119, 0.2)', text: '#22B573', label: t('isletmemScreen.badges.paid') };
    case 'partial': return { bg: 'rgba(255, 180, 171, 0.2)', text: '#FCA5A5', label: t('isletmemScreen.badges.partial') };
    case 'unpaid': return { bg: 'rgba(239, 68, 68, 0.2)', text: '#EF4444', label: t('isletmemScreen.badges.unpaid') };
    default: return { bg: 'rgba(255, 255, 255, 0.1)', text: '#ffffff', label: status || t('isletmemScreen.badges.unknown') };
  }
};

export default function IsletmemScreen({ navigation }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [documents, setDocuments] = useState([]);
  const [months, setMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [activeTab, setActiveTab] = useState('Gelirler');
  const [insight, setInsight] = useState('');
  const [isInsightLoading, setIsInsightLoading] = useState(false);

  useEffect(() => {
    const fetchPastDocuments = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        let orgId = null;
        if (session) {
          const { data: orgMember } = await supabase.from('organization_members').select('organization_id').eq('user_id', session.user.id).maybeSingle();
          orgId = orgMember?.organization_id;
        }

        const [docRes, transRes] = await Promise.all([
          orgId ? supabase.from('finance_documents').select('*').eq('organization_id', orgId).order('created_at', { ascending: false }) : supabase.from('finance_documents').select('*').order('created_at', { ascending: false }),
          session ? supabase.from('transactions').select('*').eq('profile_id', session.user.id).order('date', { ascending: false }) : supabase.from('transactions').select('*').order('date', { ascending: false })
        ]);
        
        const rawDocs = docRes.data || [];
        const rawTrans = transRes.data || [];

        const unifiedDocs = [
           ...rawDocs.map(d => ({ ...d, unifiedDate: d.created_at, unifiedAmount: Number(d.amount_minor)/100, source: 'doc' })),
           ...rawTrans.map(t => ({ ...t, unifiedDate: t.date || new Date().toISOString(), unifiedAmount: Number(t.amount), flow_payment_status: t.status, source: 'trans' }))
        ];

        unifiedDocs.sort((a,b) => new Date(b.unifiedDate) - new Date(a.unifiedDate));

        // Group by Month Year
        const grouped = unifiedDocs.reduce((acc, doc) => {
          const dDate = new Date(doc.unifiedDate);
          const monthYear = dDate.toLocaleString('tr-TR', { month: 'long', year: 'numeric' });
          if (!acc[monthYear]) {
            acc[monthYear] = [];
          }
          acc[monthYear].push(doc);
          return acc;
        }, {});

        const monthKeys = Object.keys(grouped);
        setMonths(monthKeys);
        if (monthKeys.length > 0) {
          setSelectedMonth(monthKeys[0]);
        }
        setDocuments(unifiedDocs);
      } catch (err) {
        console.warn("Error fetching past documents", err);
      }
    };

    fetchPastDocuments();
  }, []);

  const getMonthData = (monthStr) => {
    if (!monthStr) return { income: 0, expense: 0, docs: [] };
    const mDocs = documents.filter(doc => {
      const dDate = new Date(doc.unifiedDate);
      return dDate.toLocaleString('tr-TR', { month: 'long', year: 'numeric' }) === monthStr;
    });
    const income = mDocs.filter(d => d.type === 'income' || d.type === 'sales').reduce((sum, d) => sum + d.unifiedAmount, 0);
    const expense = mDocs.filter(d => d.type === 'expense').reduce((sum, d) => sum + d.unifiedAmount, 0);
    return { income, expense, docs: mDocs, balance: income - expense };
  };

  const currentData = getMonthData(selectedMonth);
  const currentMonthIndex = months.indexOf(selectedMonth);
  const prevMonthStr = currentMonthIndex >= 0 && currentMonthIndex + 1 < months.length ? months[currentMonthIndex + 1] : null;
  const prevData = getMonthData(prevMonthStr);

  useEffect(() => {
    if (!selectedMonth) return;
    
    const fetchInsight = async () => {
      setIsInsightLoading(true);
      setInsight('');
      try {
        const { data, error } = await supabase.functions.invoke('generate-insights', {
          body: {
            monthData: { income: currentData.income, expense: currentData.expense },
            previousMonthData: { income: prevData.income, expense: prevData.expense }
          }
        });
        
        if (!error && data?.success) {
          setInsight(data.insight);
        } else {
          setInsight(t('isletmemScreen.insights.unavailable'));
        }
      } catch (e) {
        setInsight(t('isletmemScreen.insights.error'));
      } finally {
        setIsInsightLoading(false);
      }
    };

    fetchInsight();
  }, [selectedMonth]); // Need to fetch when month changes

  const trend = prevData.balance !== 0 
    ? ((currentData.balance - prevData.balance) / Math.abs(prevData.balance)) * 100 
    : 0;

  const displayDocs = currentData.docs.filter(doc => {
    if (activeTab === 'Gelirler') return doc.type === 'income';
    if (activeTab === 'Giderler') return doc.type === 'expense';
    return true; // Faturalar
  });

  const tabLabels = {
    Gelirler: t('isletmemScreen.tabs.income'),
    Giderler: t('isletmemScreen.tabs.expense'),
    Faturalar: t('isletmemScreen.tabs.invoices'),
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]} className="flex-1 bg-black">
      <View className="flex-row items-center justify-between px-5 h-12 bg-black z-50">
        <View className="flex-row items-center gap-3">
          <MaterialIcons name="account-balance" size={20} color="#22B573" />
          <Text className="text-[#22B573] text-xl font-bold font-['HankenGrotesk-SemiBold']">{t('isletmemScreen.headerTitle')}</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.goBack()} className="opacity-80 active:scale-95">
          <MaterialIcons name="close" size={24} color="#A79E96" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-4 mb-4 flex-row gap-3 py-1">
          {months.map(m => (
            <TouchableOpacity
              key={m}
              onPress={() => setSelectedMonth(m)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-xl flex-row items-center gap-2 ${selectedMonth === m ? 'bg-[#22B573]' : 'bg-[#2A2631]'}`}
            >
              <Text className={`text-sm font-medium ${selectedMonth === m ? 'text-[#1C3327]' : 'text-[#A79E96]'}`}>{m}</Text>
              {selectedMonth === m && <MaterialIcons name="expand-more" size={16} color="#1C3327" />}
            </TouchableOpacity>
          ))}
          {months.length === 0 && (
            <View className="flex-shrink-0 px-4 py-1.5 rounded-xl bg-[#22B573] flex-row items-center gap-2">
              <Text className="text-[#1C3327] text-sm font-medium">{t('isletmemScreen.defaultMonthTab')}</Text>
              <MaterialIcons name="expand-more" size={16} color="#1C3327" />
            </View>
          )}
        </ScrollView>

        {/* Summary Bento Grid */}
        <View className="flex-row flex-wrap justify-between mb-5 gap-y-3">
          <View className="w-full bg-[#2A2631] rounded-xl p-4 relative overflow-hidden" style={styles.glowBorder}>
            <Text className="text-[#A79E96] text-[10px] uppercase tracking-widest mb-1 font-['JetBrainsMono-Medium']">{t('isletmemScreen.summary.totalBalance')}</Text>
            <Text className="text-[#22B573] text-4xl font-bold font-['HankenGrotesk-Bold'] tracking-tighter">₺{formatCurrency(currentData.balance)}</Text>
            {prevMonthStr && (
              <View className="mt-2 flex-row items-center gap-1.5">
                <MaterialIcons name={trend >= 0 ? "trending-up" : "trending-down"} size={14} color={trend >= 0 ? "#22B573" : "#EF4444"} />
                <Text className={`text-[10px] font-medium ${trend >= 0 ? "text-[#22B573]" : "text-[#EF4444]"}`}>
                  {trend >= 0
                    ? t('isletmemScreen.summary.trendUp', { percent: Math.abs(trend).toFixed(1) })
                    : t('isletmemScreen.summary.trendDown', { percent: Math.abs(trend).toFixed(1) })}
                </Text>
              </View>
            )}
          </View>

          <View className="w-[48%] bg-[#2A2631] rounded-xl p-3 border border-[#3A3540]/30">
            <Text className="text-[#A79E96] text-[10px] mb-1 font-['JetBrainsMono-Medium']">{t('isletmemScreen.summary.income')}</Text>
            <Text className="text-[#22B573] text-xl font-semibold font-['HankenGrotesk-SemiBold']">₺{formatCurrency(currentData.income)}</Text>
          </View>

          <View className="w-[48%] bg-[#2A2631] rounded-xl p-3 border border-[#3A3540]/30">
            <Text className="text-[#A79E96] text-[10px] mb-1 font-['JetBrainsMono-Medium']">{t('isletmemScreen.summary.expense')}</Text>
            <Text className="text-[#EF4444] text-xl font-semibold font-['HankenGrotesk-SemiBold']">₺{formatCurrency(currentData.expense)}</Text>
          </View>
        </View>

        {/* Category Tabs */}
        <View className="flex-row items-center gap-6 mb-4 border-b border-[#3A3540]/20">
          {['Gelirler', 'Giderler', 'Faturalar'].map(tab => (
            <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={[styles.tabButton, activeTab === tab && styles.activeTab]}>
              <Text className={`text-sm font-medium pb-2 ${activeTab === tab ? 'text-[#22B573]' : 'text-[#A79E96]'}`}>{tabLabels[tab]}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Transactions List */}
        <View className="space-y-3 mb-6">
          {displayDocs.length === 0 ? (
            <View className="py-6 items-center">
              <Text className="text-[#A79E96] text-sm text-center">{t('isletmemScreen.emptyState')}</Text>
            </View>
          ) : (
            displayDocs.slice(0, 5).map((item, idx) => {
              const amount = item.unifiedAmount;
              const dateStr = new Date(item.unifiedDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
              const badge = getBadge(item.flow_payment_status, t);

              return (
                <TouchableOpacity key={item.id || idx} className="flex-row items-center justify-between p-3 bg-[#2A2631] rounded-xl mb-2">
                  <View className="flex-row items-center gap-3">
                    <View className="w-10 h-10 rounded-lg bg-[#34303C] flex items-center justify-center">
                      <MaterialIcons name={item.type === 'income' || item.type === 'sales' ? 'rocket-launch' : 'payments'} size={20} color={item.type === 'income' || item.type === 'sales' ? '#22B573' : '#EF4444'} />
                    </View>
                    <View>
                      <Text className="text-[#F6F1EC] text-sm font-semibold">{item.title || (item.type === 'income' || item.type === 'sales' ? t('isletmemScreen.defaultIncomeTitle') : t('isletmemScreen.defaultExpenseTitle'))}</Text>
                      <View className="flex-row items-center mt-1">
                        <Text className="text-[#A79E96] text-[10px] font-['JetBrainsMono-Medium']">{dateStr} • </Text>
                        <View style={{ backgroundColor: badge.bg, paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4, marginLeft: 2 }}>
                          <Text style={{ color: badge.text, fontSize: 9, fontWeight: 'bold' }}>{badge.label}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                  <View className="items-end">
                    <Text className={`text-xs font-medium font-['JetBrainsMono-Medium'] ${item.type === 'income' || item.type === 'sales' ? 'text-[#22B573]' : 'text-[#EF4444]'}`}>
                      {item.type === 'income' || item.type === 'sales' ? '+' : '-'} ₺{formatCurrency(amount)}
                    </Text>
                    <MaterialIcons name="chevron-right" size={14} color="#A79E96" style={{ marginTop: 2 }} />
                  </View>
                </TouchableOpacity>
              )
            })
          )}
          
          {displayDocs.length > 5 && (
            <TouchableOpacity className="pt-2 pb-6 flex-row justify-center items-center gap-2">
              <Text className="text-[#A79E96] font-medium text-xs">{t('isletmemScreen.viewAll')}</Text>
              <MaterialIcons name="arrow-forward" size={14} color="#A79E96" />
            </TouchableOpacity>
          )}
        </View>

        {/* Insights Card */}
        <View className="bg-[#2A2631] rounded-xl p-4 mb-20 border border-[#3A3540]/10">
          <Text className="text-[#22B573] text-base font-semibold mb-3">{t('isletmemScreen.insights.title')}</Text>
          <View className="flex-row gap-3">
            <View className="w-1 bg-[#22B573] rounded-full" />
            {isInsightLoading ? (
              <ActivityIndicator color="#22B573" />
            ) : (
              <Text className="text-[#A79E96] text-sm leading-5 flex-1">
                {insight}
              </Text>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  glowBorder: {
    shadowColor: '#22B573', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1, shadowRadius: 10, elevation: 5,
    borderWidth: 1, borderColor: 'rgba(34, 181, 115, 0.2)',
  },
  tabButton: { paddingBottom: 8 },
  activeTab: { borderBottomWidth: 2, borderBottomColor: '#22B573' }
});
