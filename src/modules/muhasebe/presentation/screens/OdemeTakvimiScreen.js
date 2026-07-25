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

  const renderBox = (day, dayOfWeek, monthIndex) => {
    const key = `${monthIndex}-${day}`;
    const transactions = transactionsMap[key] || [];

    const isWeekend = dayOfWeek >= 5;
    const isSpecialDay = day === 9 && monthIndex === 5; // Highlight day 9 like the image

    return (
      <View key={`day-${day}`} className="w-[14.28%] min-h-[90px] p-0.5">
        <View className={`flex-1 rounded-md bg-[#252528] items-center pt-2 pb-1 ${isSpecialDay ? 'border border-[#34c759]' : 'border border-transparent'}`}>
           <View className={isSpecialDay ? "bg-[#34c759] rounded-full w-5 h-5 items-center justify-center -mt-0.5" : ""}>
             <Text className={`${isWeekend ? 'text-[#ff3b30]' : 'text-[#e5e2e3]'} text-[13px] font-bold`}>{day}</Text>
           </View>
           <View className="w-full px-1 mt-1 items-start">
             {transactions.map((t, idx) => {
               // A special case for zero amount (just a label, like the birthday in the image)
               if (t.amount === 0) {
                  return (
                    <View key={idx} className="w-full mb-1 bg-[#849495]/40 rounded-sm px-0.5">
                      <Text numberOfLines={1} className="text-white font-medium text-[8px]">{t.title}</Text>
                    </View>
                  );
               }

               return (
                 <View key={idx} className="w-full mb-1">
                   <Text numberOfLines={1} className={t.type === 'expense' ? "text-[#ff3b30] font-medium text-[9px]" : "text-[#34c759] font-medium text-[9px]"}>{t.title}</Text>
                   <Text numberOfLines={1} className={t.type === 'expense' ? "text-[#ff3b30] font-bold text-[9px]" : "text-[#34c759] font-bold text-[9px]"}>
                     {t.type === 'expense' ? '-' : '+'}{t.amount}
                   </Text>
                 </View>
               );
             })}
           </View>
        </View>
      </View>
    );
  };

  const renderMonth = ({ item, index }) => {
    // For visual consistency, let's pretend all months start with some offset.
    // June 2024 started on a Saturday (index 5)
    const startDayOffset = (index * 2 + 3) % 7; // Just a dummy varied offset for realistic look
    
    let cells = [];
    for (let i = 0; i < startDayOffset; i++) {
      cells.push(<View key={`empty-${i}`} className="w-[14.28%] min-h-[90px]" />);
    }

    // Generate 30 days
    for (let i = 1; i <= 30; i++) {
      const dayOfWeek = (startDayOffset + i - 1) % 7;
      cells.push(renderBox(i, dayOfWeek, index));
    }

    const [monthName, year] = item.split(' ');
    const shortMonth = monthName.substring(0, 3).toUpperCase();

    return (
      <View style={{ width }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 10 }}>
          <View className="bg-[#1c1c1e] rounded-[32px] p-3 pb-6 border border-white/5">
            
            {/* Header Controls for Month */}
            <View className="flex-row items-center justify-between mb-6 mt-2 px-2">
              <View className="flex-row items-center">
                <Text className="text-white text-3xl font-light tracking-widest">{shortMonth}</Text>
                <Text className="text-[#8e8e93] text-xl ml-2 font-light">{year}</Text>
              </View>
              <View className="flex-row gap-4">
                <TouchableOpacity onPress={handlePrev}>
                  <MaterialIcons name="chevron-left" size={28} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleNext}>
                  <MaterialIcons name="chevron-right" size={28} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Weekdays Header */}
            <View className="flex-row justify-between mb-3 px-0.5">
              {[
                t('muhasebe.odemeTakvimi.weekdays.mon'),
                t('muhasebe.odemeTakvimi.weekdays.tue'),
                t('muhasebe.odemeTakvimi.weekdays.wed'),
                t('muhasebe.odemeTakvimi.weekdays.thu'),
                t('muhasebe.odemeTakvimi.weekdays.fri'),
                t('muhasebe.odemeTakvimi.weekdays.sat'),
                t('muhasebe.odemeTakvimi.weekdays.sun')
              ].map((d, i) => (
                <Text key={d} className={`text-center w-[14.28%] text-[10px] font-bold tracking-wider ${i >= 5 ? 'text-[#ff3b30]' : 'text-[#8e8e93]'}`}>
                  {d}
                </Text>
              ))}
            </View>

            {/* Calendar Grid */}
            <View className="flex-row flex-wrap">
              {cells}
            </View>

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
        />
      </View>
    </SafeAreaView>
  );
}
