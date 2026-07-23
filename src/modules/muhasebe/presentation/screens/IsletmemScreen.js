import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../../../../shared';

const formatCurrency = (amount) => {
  return Number(amount).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function IsletmemScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [documents, setDocuments] = useState([]);
  const [months, setMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [activeTab, setActiveTab] = useState('Gelirler');

  useEffect(() => {
    const fetchPastDocuments = async () => {
      try {
        const { data: docs, error } = await supabase
          .from('finance_documents')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Group by Month Year
        const grouped = (docs || []).reduce((acc, doc) => {
          const dDate = new Date(doc.created_at);
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
        setDocuments(docs || []);
      } catch (err) {
        console.warn("Error fetching past documents", err);
      }
    };

    fetchPastDocuments();
  }, []);

  const currentDocs = documents.filter(doc => {
    if (!selectedMonth) return false;
    const dDate = new Date(doc.created_at);
    return dDate.toLocaleString('tr-TR', { month: 'long', year: 'numeric' }) === selectedMonth;
  });

  const totalIncome = currentDocs.filter(d => d.type === 'income').reduce((sum, d) => sum + (Number(d.amount_minor) / 100), 0);
  const totalExpense = currentDocs.filter(d => d.type === 'expense').reduce((sum, d) => sum + (Number(d.amount_minor) / 100), 0);
  const totalBalance = totalIncome - totalExpense;

  const displayDocs = currentDocs.filter(doc => {
    if (activeTab === 'Gelirler') return doc.type === 'income';
    if (activeTab === 'Giderler') return doc.type === 'expense';
    return true; // Faturalar or others
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]} className="flex-1 bg-black">
      {/* TopAppBar */}
      <View className="flex-row items-center justify-between px-5 h-16 bg-black z-50">
        <View className="flex-row items-center gap-3">
          <MaterialIcons name="account-balance" size={24} color="#4be277" />
          <Text className="text-[#4be277] text-2xl font-bold font-['HankenGrotesk-SemiBold']">İşletmem</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.goBack()} className="opacity-80 active:scale-95">
          <MaterialIcons name="close" size={24} color="#bccbb9" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        {/* Monthly Selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-6 mb-8 flex-row gap-4 py-2">
          {months.map(m => (
            <TouchableOpacity 
              key={m}
              onPress={() => setSelectedMonth(m)}
              className={`flex-shrink-0 px-6 py-2 rounded-xl flex-row items-center gap-2 ${selectedMonth === m ? 'bg-[#4be277]' : 'bg-[#202020]'}`}
            >
              <Text className={`font-medium ${selectedMonth === m ? 'text-[#003915]' : 'text-[#bccbb9]'}`}>{m}</Text>
              {selectedMonth === m && <MaterialIcons name="expand-more" size={16} color="#003915" />}
            </TouchableOpacity>
          ))}
          {months.length === 0 && (
            <View className="flex-shrink-0 px-6 py-2 rounded-xl bg-[#4be277] flex-row items-center gap-2">
              <Text className="text-[#003915] font-medium">Bu Ay</Text>
              <MaterialIcons name="expand-more" size={16} color="#003915" />
            </View>
          )}
        </ScrollView>

        {/* Summary Bento Grid */}
        <View className="flex-row flex-wrap justify-between mb-8 gap-y-4">
          <View className="w-full bg-[#1b1b1c] rounded-xl p-6 relative overflow-hidden" style={styles.glowBorder}>
            <Text className="text-[#bccbb9] text-[12px] uppercase tracking-widest mb-1 font-['JetBrainsMono-Medium']">Toplam Bakiye</Text>
            <Text className="text-[#4be277] text-5xl font-bold font-['HankenGrotesk-Bold'] tracking-tighter">₺{formatCurrency(totalBalance)}</Text>
            <View className="mt-4 flex-row items-center gap-2">
              <MaterialIcons name="trending-up" size={16} color="#4be277" />
              <Text className="text-[#4be277] text-xs font-medium">Geçen aya göre %12 artış</Text>
            </View>
          </View>

          <View className="w-[48%] bg-[#202020] rounded-xl p-4 border border-[#3d4a3d]/30">
            <Text className="text-[#bccbb9] text-[12px] mb-1 font-['JetBrainsMono-Medium']">Gelirler</Text>
            <Text className="text-[#4ae176] text-2xl font-semibold font-['HankenGrotesk-SemiBold']">₺{formatCurrency(totalIncome)}</Text>
          </View>
          
          <View className="w-[48%] bg-[#202020] rounded-xl p-4 border border-[#3d4a3d]/30">
            <Text className="text-[#bccbb9] text-[12px] mb-1 font-['JetBrainsMono-Medium']">Giderler</Text>
            <Text className="text-[#ff8a83] text-2xl font-semibold font-['HankenGrotesk-SemiBold']">₺{formatCurrency(totalExpense)}</Text>
          </View>
        </View>

        {/* Category Tabs */}
        <View className="flex-row items-center gap-8 mb-6 border-b border-[#3d4a3d]/20">
          {['Gelirler', 'Giderler', 'Faturalar'].map(tab => (
            <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={[styles.tabButton, activeTab === tab && styles.activeTab]}>
              <Text className={`text-base font-medium pb-3 ${activeTab === tab ? 'text-[#4be277]' : 'text-[#bccbb9]'}`}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Transactions List */}
        <View className="space-y-4 mb-8">
          {displayDocs.length === 0 ? (
            <View className="py-8 items-center">
              <Text className="text-[#bccbb9] text-center">Bu kategori için kayıt bulunamadı.</Text>
            </View>
          ) : (
            displayDocs.slice(0, 5).map((item, idx) => {
              const amount = Number(item.amount_minor) / 100;
              const dateStr = new Date(item.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
              return (
                <TouchableOpacity key={item.id || idx} className="flex-row items-center justify-between p-4 bg-[#2a2a2a] rounded-xl mb-3">
                  <View className="flex-row items-center gap-4">
                    <View className="w-12 h-12 rounded-lg bg-[#353535] flex items-center justify-center">
                      <MaterialIcons name={item.type === 'income' ? 'rocket-launch' : 'payments'} size={24} color={item.type === 'income' ? '#4be277' : '#ff8a83'} />
                    </View>
                    <View>
                      <Text className="text-[#e5e2e1] text-base font-semibold">{item.title || (item.type === 'income' ? 'Satış Geliri' : 'Gider Faturası')}</Text>
                      <Text className="text-[#bccbb9] text-xs mt-1 font-['JetBrainsMono-Medium']">{dateStr} • {item.payment_status}</Text>
                    </View>
                  </View>
                  <View className="items-end">
                    <Text className={`text-sm font-medium font-['JetBrainsMono-Medium'] ${item.type === 'income' ? 'text-[#4be277]' : 'text-[#ff8a83]'}`}>
                      {item.type === 'income' ? '+' : '-'} ₺{formatCurrency(amount)}
                    </Text>
                    <MaterialIcons name="chevron-right" size={16} color="#bccbb9" style={{ marginTop: 4 }} />
                  </View>
                </TouchableOpacity>
              )
            })
          )}
          
          {displayDocs.length > 5 && (
            <TouchableOpacity className="pt-4 pb-8 flex-row justify-center items-center gap-2">
              <Text className="text-[#bccbb9] font-medium text-sm">Tümünü Gör</Text>
              <MaterialIcons name="arrow-forward" size={16} color="#bccbb9" />
            </TouchableOpacity>
          )}
        </View>

        {/* Insights Card */}
        <View className="bg-[#202020] rounded-2xl p-6 mb-24 border border-[#3d4a3d]/10">
          <Text className="text-[#4be277] text-lg font-semibold mb-4">Akıllı Analiz</Text>
          <View className="flex-row gap-4">
            <View className="w-1 bg-[#4be277] rounded-full" />
            <Text className="text-[#bccbb9] text-base leading-6 flex-1">
              Bu ay giderleriniz geçen aya göre <Text className="text-[#e5e2e1] font-bold">%15 azaldı</Text>. Tasarruf hedefinize ₺5.000 daha yakınsınız.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  glowBorder: {
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
  },
  tabButton: {
    paddingBottom: 12,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4be277',
  }
});
