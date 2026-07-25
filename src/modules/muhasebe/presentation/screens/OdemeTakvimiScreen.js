import React, { useRef, useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, FlatList, Dimensions, StyleSheet, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { GlobalAppBar } from '../../../../shared';
import { CustomButton } from '../../../../shared';
import { CustomInput } from '../../../../shared';
import { useTranslation } from 'react-i18next';
import { container } from '../../../../core/container';
import { GetTransactionsUseCase } from '@application/useCases/GetTransactionsUseCase';

const { width } = Dimensions.get('window');

export default function OdemeTakvimiScreen({ navigation }) {
  const { t } = useTranslation();
  const MONTHS = [
    `${t('muhasebe.odemeTakvimi.months.jan')} 2024`,
    `${t('muhasebe.odemeTakvimi.months.feb')} 2024`,
    `${t('muhasebe.odemeTakvimi.months.mar')} 2024`,
    `${t('muhasebe.odemeTakvimi.months.apr')} 2024`,
    `${t('muhasebe.odemeTakvimi.months.may')} 2024`,
    `${t('muhasebe.odemeTakvimi.months.jun')} 2024`,
    `${t('muhasebe.odemeTakvimi.months.jul')} 2024`,
    `${t('muhasebe.odemeTakvimi.months.aug')} 2024`,
    `${t('muhasebe.odemeTakvimi.months.sep')} 2024`,
    `${t('muhasebe.odemeTakvimi.months.oct')} 2024`,
    `${t('muhasebe.odemeTakvimi.months.nov')} 2024`,
    `${t('muhasebe.odemeTakvimi.months.dec')} 2024`
  ];
  const flatListRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(5); // Default to Haziran
  const [transactionsMap, setTransactionsMap] = useState({});

  const fetchTransactions = async () => {
    try {
      const getTransactionsUseCase = container.resolve(GetTransactionsUseCase);
      const data = await getTransactionsUseCase.execute();
      
      if (data) {
        const map = {};
        data.forEach(t => {
          // Assume date is YYYY-MM-DD
          const [y, m, d] = t.date.split('-');
          const day = parseInt(d, 10);
          const monthIndex = parseInt(m, 10) - 1; // 0-based
          const key = `${monthIndex}-${day}`;
          if (!map[key]) map[key] = [];
          map[key].push(t);
        });
        setTransactionsMap(map);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      fetchTransactions();
    }, 0);
  }, []);

  const handleNext = () => {
    if (currentIndex < MONTHS.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      flatListRef.current?.scrollToIndex({ index: currentIndex - 1, animated: true });
    }
  };

  const renderBox = (day, monthIndex, shortMonth) => {
    const key = `${monthIndex}-${day}`;
    const transactions = transactionsMap[key] || [];

    const incomes = transactions.filter(t => t.type === 'income' || t.type === 'sales' || (!t.type && t.amount > 0));
    const expenses = transactions.filter(t => t.type === 'expense' || t.type === 'ALIS' || (!t.type && t.amount < 0));

    return (
      <View key={`day-${day}`} className="flex-row bg-[#121412] min-h-[64px] mb-1 rounded-xl overflow-hidden border border-[#2d332d]">
        {/* Left: Gelir (Income) + Date */}
        <View className="flex-1 flex-row relative p-2">
          {/* Date */}
          <View className="flex-col mr-2 w-6">
            <Text className="text-[#22c55e] font-bold leading-tight text-sm">{day}</Text>
            <Text className="text-gray-500 font-mono uppercase text-[8px] tracking-tighter">{shortMonth}</Text>
          </View>
          
          {/* Incomes */}
          <View className="flex-1 justify-start">
            {incomes.map((t, idx) => (
              <View key={idx} className="flex-row justify-between items-start mb-1">
                <Text numberOfLines={1} className="text-[11px] text-gray-300 flex-1 mr-1">{t.title}</Text>
                <Text className="text-[11px] text-[#22c55e] font-mono">{Math.abs(t.amount)} ₺</Text>
              </View>
            ))}
          </View>
          
          {/* Vertical center divider */}
          <View className="absolute right-0 top-2 bottom-2 w-[1px] bg-[#2d332d]" />
        </View>

        {/* Right: Gider (Expense) */}
        <View className="flex-1 justify-start p-2">
          {expenses.map((t, idx) => (
            <View key={idx} className="flex-row justify-between items-start mb-1">
              <Text numberOfLines={1} className="text-[11px] text-gray-300 flex-1 mr-1">{t.title}</Text>
              <Text className="text-[11px] text-[#ff3b30] font-mono">{Math.abs(t.amount)} ₺</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderMonth = ({ item, index }) => {
    const [monthName, year] = item.split(' ');
    const shortMonth = monthName.substring(0, 3).toUpperCase();

    // Generate 31 days (assuming max for simplicity, or we can use Date logic for exact days)
    const daysInMonth = new Date(parseInt(year), index + 1, 0).getDate();
    
    let cells = [];
    for (let i = 1; i <= daysInMonth; i++) {
      cells.push(renderBox(i, index, shortMonth));
    }

    return (
      <View style={{ width }} className="flex-1">
        <ScrollView contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 16 }} className="flex-1">
          {/* Header Controls for Month */}
          <View className="flex-row items-center justify-between mb-4 mt-2">
            <View className="flex-row items-center">
              <Text className="text-gray-100 text-2xl font-semibold tracking-wide">{monthName} {year}</Text>
            </View>
            <View className="flex-row gap-4">
              <TouchableOpacity onPress={handlePrev}>
                <MaterialIcons name="chevron-left" size={28} color="#9ca3af" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleNext}>
                <MaterialIcons name="chevron-right" size={28} color="#9ca3af" />
              </TouchableOpacity>
            </View>
          </View>
          
          <View className="mb-4">
            <Text className="text-[#22c55e] font-mono text-sm tracking-widest uppercase">{t('muhasebe.odemeTakvimi.title', 'ÖDEME TAKVİMİ')}</Text>
          </View>

          {/* Weekdays / Category Header */}
          <View className="flex-row justify-between mb-2 px-1">
            <View className="flex-1 items-center">
              <Text className="text-[10px] font-mono tracking-widest text-[#22c55e]/60 uppercase">GELİR</Text>
            </View>
            <View className="flex-1 items-center">
              <Text className="text-[10px] font-mono tracking-widest text-[#22c55e]/60 uppercase">GİDER</Text>
            </View>
          </View>

          {/* Calendar List */}
          <View className="flex-col">
            {cells}
          </View>

        </ScrollView>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0A0A0B]" edges={['top', 'left', 'right']}>
      <ImageBackground 
        source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDUpjAKmMNnHDAuGn7KDAmiX4BVuWBLEG-5a7fHFVu_x7Jxrfh8UzY6rM-oy3AiqN0b1h6_K5iobCNsv2B4iHnz_lPjQ6QXfGvJ4UZmCcQLcr6H8o6m3I1JVFmgqk7UubXZx96-wpkV8-ScZZBzzkpl4-_WMzeHLyFljEKugxDZQXZgdkjst86sxa7hU95rBimeOBSnqHbdwH9bj_yj1tbla3T_HPG2xI6XkgTpyJRiDhmg9Po0q7NWy9DKn3JnR0b5tcpUj4Vcxr3w' }}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      >
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(10, 10, 11, 0.8)' }]} />
      </ImageBackground>
      {/* TopAppBar */}
      <GlobalAppBar 
        level={3} 
        module="finans" 
        title={t('muhasebe.odemeTakvimi.title')} 
        showProfile={false} 
      />

      {/* Main Swipeable Content */}
      <View className="flex-1">
        <FlatList
          ref={flatListRef}
          data={MONTHS}
          keyExtractor={(item) => item}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={5} // Start at Haziran
          getItemLayout={(data, index) => ({ length: width, offset: width * index, index })}
          onMomentumScrollEnd={(e) => {
            const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
            setCurrentIndex(newIndex);
          }}
          renderItem={renderMonth}
          className="bg-[#0a0d0a]" // noir-bg
        />
      </View>
    </SafeAreaView>
  );
}
