import { formatMoney } from '../../../../lib/money';
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, TouchableOpacity, ScrollView, ImageBackground, StyleSheet, FlatList, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { supabase, GlobalAppBar } from '../../../../shared';

const { width } = Dimensions.get('window');

export default function OdemeTakvimiScreen({ navigation }) {
  const { t, i18n } = useTranslation();
  const { showActionSheetWithOptions } = useActionSheet();
  
  const todayDate = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(todayDate.getFullYear(), todayDate.getMonth(), 1));
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedDays, setExpandedDays] = useState({});

  const flatListRef = useRef(null);
  
  const loadData = async () => {
    setLoading(true);
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth();
    
    // adjust for timezone safely to get YYYY-MM-DD
    const p_from = new Date(Date.UTC(y, m, 1)).toISOString().split("T")[0];
    const p_to = new Date(Date.UTC(y, m + 1, 0)).toISOString().split("T")[0];

    const { data, error } = await supabase.rpc("get_payment_calendar", { p_from, p_to });
    if (!error && data) {
      setTransactions(data);
    } else {
      setTransactions([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [currentDate]);

  const setStatus = async (id, status) => {
    const { error } = await supabase.rpc("set_transaction_payment_status", { p_id: id, p_status: status });
    if (!error) {
      loadData();
    }
  };

  const handleTransactionPress = (tx) => {
    const options = [t("muhasebe.odemeTakvimi.markPaid", "Ödendi olarak işaretle"), t("muhasebe.odemeTakvimi.markPending", "Bekliyor olarak işaretle"), t("common.cancel", "İptal")];
    const cancelButtonIndex = 2;

    showActionSheetWithOptions({ options, cancelButtonIndex }, (selectedIndex) => {
      if (selectedIndex === 0) setStatus(tx.id, "paid");
      if (selectedIndex === 1) setStatus(tx.id, "pending");
    });
  };

  const handlePrev = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNext = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const y = currentDate.getFullYear();
  const m = currentDate.getMonth();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const monthName = currentDate.toLocaleDateString(i18n.language, { month: 'long', year: 'numeric' });
  const todayStr = new Date(todayDate.getTime() - (todayDate.getTimezoneOffset() * 60000)).toISOString().split("T")[0];

  const grouped = transactions.reduce((acc, t) => {
    if (!acc[t.day]) acc[t.day] = [];
    acc[t.day].push(t);
    return acc;
  }, {});

  let summaryInc = 0, summaryExp = 0, summaryOverdueCount = 0, summaryOverdueAmount = 0;
  transactions.forEach(tx => {
    if (tx.type === "income") summaryInc += tx.amount_minor;
    if (tx.type === "expense") summaryExp += tx.amount_minor;
    if (tx.is_overdue) {
      summaryOverdueCount++;
      summaryOverdueAmount += tx.amount_minor;
    }
  });
  const summaryNet = summaryInc - summaryExp;

  const formatCurrency = (minor) => formatMoney(minor / 100, i18n.language);

  const renderStatus = (tx) => {
    if (tx.payment_status === "paid") return <Text className="px-1.5 py-0.5 rounded bg-[#3ccf8e]/10 text-[#3ccf8e] text-[10px] uppercase border border-[#3ccf8e]/20 overflow-hidden">{t("muhasebe.odemeTakvimi.statusPaid", "Ödendi")}</Text>;
    if (tx.is_overdue) return <Text className="px-1.5 py-0.5 rounded bg-[#ff7b7b]/10 text-[#ff7b7b] text-[10px] uppercase border border-[#ff7b7b]/20 overflow-hidden">{t("muhasebe.odemeTakvimi.statusOverdue", "Gecikti")}</Text>;
    if (tx.payment_status === "partial") return <Text className="px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-500 text-[10px] uppercase border border-yellow-500/20 overflow-hidden">{t("muhasebe.odemeTakvimi.statusPartial", "Kısmi")}</Text>;
    return <Text className="px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-500 text-[10px] uppercase border border-yellow-500/20 overflow-hidden">{t("muhasebe.odemeTakvimi.statusPending", "Bekliyor")}</Text>;
  };

  const renderTransactionLine = (tx) => (
    <TouchableOpacity key={tx.id} onPress={() => handleTransactionPress(tx)} className="flex-row items-center justify-between p-2 rounded-lg bg-black/20 mb-1 border border-white/5 min-h-[44px]">
      <View className="flex-row items-center flex-1 mr-2">
        <View className="mr-2">{renderStatus(tx)}</View>
        <Text numberOfLines={1} className="text-sm text-gray-200 flex-1">{tx.title}</Text>
      </View>
      <Text className={`font-mono font-medium ${tx.type === 'income' ? 'text-[#3ccf8e]' : 'text-[#ff7b7b]'}`}>
        {tx.type === "income" ? "+" : "−"}{formatCurrency(tx.amount_minor)}
      </Text>
    </TouchableOpacity>
  );

  const generateData = () => {
    const data = [];
    let emptyStreakStart = -1;

    const pushEmptyStreak = (end) => {
      if (emptyStreakStart === -1) return;
      const startStr = emptyStreakStart;
      const endStr = end;
      const label = startStr === endStr ? `${startStr} ${currentDate.toLocaleDateString(i18n.language, { month: 'short' })}` : `${startStr}-${endStr} ${currentDate.toLocaleDateString(i18n.language, { month: 'short' })} · ${t("muhasebe.odemeTakvimi.noRecords", "kayıt yok")}`;
      
      data.push({
        type: 'empty',
        id: `empty-${startStr}`,
        label
      });
      emptyStreakStart = -1;
    };

    for (let d = 1; d <= daysInMonth; d++) {
      const dayStr = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const isToday = dayStr === todayStr;
      const hasRecords = grouped[dayStr] && grouped[dayStr].length > 0;

      if (!hasRecords && !isToday) {
        if (emptyStreakStart === -1) emptyStreakStart = d;
        continue;
      }

      pushEmptyStreak(d - 1);
      
      const dayDate = new Date(Date.UTC(y, m, d));
      const dayName = dayDate.toLocaleDateString(i18n.language, { weekday: "long" });
      const incomes = grouped[dayStr]?.filter(tx => tx.type === "income") || [];
      const expenses = grouped[dayStr]?.filter(tx => tx.type === "expense") || [];
      const dayNet = incomes.reduce((s, tx) => s + tx.amount_minor, 0) - expenses.reduce((s, tx) => s + tx.amount_minor, 0);

      data.push({
        type: 'day',
        id: dayStr,
        dayNum: d,
        dayName,
        isToday,
        incomes,
        expenses,
        dayNet,
        dayStr
      });
    }
    pushEmptyStreak(daysInMonth);
    return data;
  };

  const listData = generateData();

  useEffect(() => {
    if (!loading && flatListRef.current) {
      const index = listData.findIndex(item => item.isToday);
      if (index >= 0) {
        // small timeout to ensure layout is ready
        setTimeout(() => {
          flatListRef.current.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
        }, 300);
      }
    }
  }, [loading]);

  const renderItem = ({ item }) => {
    if (item.type === 'empty') {
      return (
        <View className="flex-row justify-center py-2 bg-white/5 mx-4 my-1 rounded-md border border-white/5">
          <Text className="text-xs text-gray-500">{item.label}</Text>
        </View>
      );
    }

    const { dayNum, dayName, isToday, incomes, expenses, dayNet, dayStr } = item;
    const isExpanded = expandedDays[dayStr];
    const visibleInc = isExpanded ? incomes : incomes.slice(0, 3);
    const visibleExp = isExpanded ? expenses : expenses.slice(0, 3);

    return (
      <View 
        className={`mx-4 my-2 rounded-xl p-3 bg-[#201D24] border ${isToday ? 'border-[#FF7A59]' : 'border-white/10'}`}
      >
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-row items-baseline">
            <Text className={`font-mono text-2xl font-bold mr-2 ${isToday ? 'text-[#FF7A59]' : 'text-gray-200'}`}>{dayNum}</Text>
            <View>
              {isToday && <Text className="text-[9px] font-bold text-[#FF7A59]">{t("muhasebe.odemeTakvimi.today", "BUGÜN")}</Text>}
              <Text className="text-xs text-gray-400 capitalize">{dayName}</Text>
            </View>
          </View>
          <Text className={`font-mono text-base font-bold ${dayNet > 0 ? 'text-[#3ccf8e]' : dayNet < 0 ? 'text-[#ff7b7b]' : 'text-gray-500'}`}>
            {dayNet > 0 ? "+" : dayNet < 0 ? "−" : ""}{formatCurrency(Math.abs(dayNet))}
          </Text>
        </View>

        {/* Incomes Block */}
        <View className="mb-2">
          <View className="flex-row justify-between items-center mb-1">
            <Text className="text-[10px] text-gray-500 uppercase tracking-widest">{t("muhasebe.odemeTakvimi.incomes", "GELİRLER")}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AiChat', { transactionType: 'income', date: dayStr })} className="py-1 px-2 min-h-[44px] justify-center">
              <Text className="text-xs text-[#3ccf8e]">{t("muhasebe.odemeTakvimi.addIncome", "+ Gelir")}</Text>
            </TouchableOpacity>
          </View>
          {visibleInc.map(renderTransactionLine)}
          {incomes.length > 3 && (
            <TouchableOpacity onPress={() => setExpandedDays(p => ({...p, [dayStr]: !isExpanded}))} className="py-2 items-center min-h-[44px] justify-center">
              <Text className="text-xs text-[#3ccf8e]">{isExpanded ? t("muhasebe.odemeTakvimi.showLess", "Daha az") : t("muhasebe.odemeTakvimi.moreRecords", "+{{count}} kayıt daha", { count: incomes.length - 3 })}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Expenses Block */}
        <View>
          <View className="flex-row justify-between items-center mb-1">
            <Text className="text-[10px] text-gray-500 uppercase tracking-widest">{t("muhasebe.odemeTakvimi.expenses", "GİDERLER")}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AiChat', { transactionType: 'expense', date: dayStr })} className="py-1 px-2 min-h-[44px] justify-center">
              <Text className="text-xs text-[#ff7b7b]">{t("muhasebe.odemeTakvimi.addExpense", "+ Gider")}</Text>
            </TouchableOpacity>
          </View>
          {visibleExp.map(renderTransactionLine)}
          {expenses.length > 3 && (
            <TouchableOpacity onPress={() => setExpandedDays(p => ({...p, [dayStr]: !isExpanded}))} className="py-2 items-center min-h-[44px] justify-center">
              <Text className="text-xs text-[#ff7b7b]">{isExpanded ? t("muhasebe.odemeTakvimi.showLess", "Daha az") : t("muhasebe.odemeTakvimi.moreRecords", "+{{count}} kayıt daha", { count: expenses.length - 3 })}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#17151A]" edges={['top', 'left', 'right']}>
      <ImageBackground 
        source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDUpjAKmMNnHDAuGn7KDAmiX4BVuWBLEG-5a7fHFVu_x7Jxrfh8UzY6rM-oy3AiqN0b1h6_K5iobCNsv2B4iHnz_lPjQ6QXfGvJ4UZmCcQLcr6H8o6m3I1JVFmgqk7UubXZx96-wpkV8-ScZZBzzkpl4-_WMzeHLyFljEKugxDZQXZgdkjst86sxa7hU95rBimeOBSnqHbdwH9bj_yj1tbla3T_HPG2xI6XkgTpyJRiDhmg9Po0q7NWy9DKn3JnR0b5tcpUj4Vcxr3w' }}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      >
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(10, 10, 11, 0.8)' }]} />
      </ImageBackground>
      
      <GlobalAppBar 
        level={3} 
        module="finans" 
        title={t('muhasebe.odemeTakvimi.title', "Gündem")} 
        showProfile={false} 
      />

      <View className="flex-1">
        {/* Month Header */}
        <View className="flex-row items-center justify-between px-4 py-3">
          <TouchableOpacity onPress={handlePrev} className="p-2 min-h-[44px] justify-center"><MaterialIcons name="chevron-left" size={28} color="#A79E96" /></TouchableOpacity>
          <Text className="text-gray-100 text-xl font-semibold capitalize">{monthName}</Text>
          <TouchableOpacity onPress={handleNext} className="p-2 min-h-[44px] justify-center"><MaterialIcons name="chevron-right" size={28} color="#A79E96" /></TouchableOpacity>
        </View>

        {/* 2x2 Summary Cards */}
        <View className="flex-row flex-wrap px-2 mb-2">
          <View className="w-1/2 p-1">
            <View className="bg-white/5 border border-white/10 rounded-xl p-3">
              <Text className="text-[10px] text-gray-400 uppercase">{t("muhasebe.odemeTakvimi.summaryIncome", "Gelir")}</Text>
              <Text className="text-[#3ccf8e] text-base font-medium">{formatCurrency(summaryInc)}</Text>
            </View>
          </View>
          <View className="w-1/2 p-1">
            <View className="bg-white/5 border border-white/10 rounded-xl p-3">
              <Text className="text-[10px] text-gray-400 uppercase">{t("muhasebe.odemeTakvimi.summaryExpense", "Gider")}</Text>
              <Text className="text-[#ff7b7b] text-base font-medium">{formatCurrency(summaryExp)}</Text>
            </View>
          </View>
          <View className="w-1/2 p-1">
            <View className="bg-white/5 border border-white/10 rounded-xl p-3">
              <Text className="text-[10px] text-gray-400 uppercase">{t("muhasebe.odemeTakvimi.summaryNet", "Net")}</Text>
              <Text className={`text-base font-medium ${summaryNet >= 0 ? 'text-white' : 'text-[#ff7b7b]'}`}>{summaryNet > 0 ? '+' : ''}{formatCurrency(summaryNet)}</Text>
            </View>
          </View>
          <View className="w-1/2 p-1">
            <View className="bg-[#ff7b7b]/10 border border-[#ff7b7b]/30 rounded-xl p-3">
              <Text className="text-[10px] text-[#ff7b7b] uppercase">{t("muhasebe.odemeTakvimi.summaryOverdue", "Geciken")} ({summaryOverdueCount})</Text>
              <Text className="text-[#ff7b7b] text-base font-medium">{formatCurrency(summaryOverdueAmount)}</Text>
            </View>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#3ccf8e" className="mt-10" />
        ) : (
          <FlatList
            ref={flatListRef}
            data={listData}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 40 }}
            onScrollToIndexFailed={info => {
              const wait = new Promise(resolve => setTimeout(resolve, 500));
              wait.then(() => {
                flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
              });
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
