import React, { useEffect, useState } from 'react';
import { View, Text, SectionList, StyleSheet, ImageBackground } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlobalAppBar, supabase } from '../../../../shared';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const formatCurrency = (amount) => {
  return Number(amount).toLocaleString('tr-TR');
};

const getBadgeStyle = (status) => {
  switch (status) {
    case 'paid':
      return { bg: 'rgba(0, 255, 127, 0.15)', text: '#00ff7f', label: 'Ödendi' };
    case 'unpaid':
      return { bg: 'rgba(255, 74, 74, 0.15)', text: '#ff4a4a', label: 'Devretti' };
    case 'partial':
      return { bg: 'rgba(255, 165, 0, 0.15)', text: '#ffa500', label: 'Kısmi' };
    default:
      return { bg: 'rgba(255, 255, 255, 0.1)', text: '#ffffff', label: 'Bilinmiyor' };
  }
};

const getIconForType = (type) => {
  return type === 'income' ? 'arrow-downward' : 'arrow-upward';
};

const getIconColorForType = (type) => {
  return type === 'income' ? '#00f0ff' : '#b600f8';
};

export default function IsletmemScreen({ navigation }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [sections, setSections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPastDocuments = async () => {
      try {
        const { data: documents, error } = await supabase
          .from('finance_documents')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // Filter out current month
        const pastDocs = (documents || []).filter(doc => {
          const dDate = new Date(doc.created_at);
          return !(dDate.getMonth() === currentMonth && dDate.getFullYear() === currentYear);
        });

        // Group by Month Year
        const grouped = pastDocs.reduce((acc, doc) => {
          const dDate = new Date(doc.created_at);
          const monthYear = dDate.toLocaleString('tr-TR', { month: 'long', year: 'numeric' });
          if (!acc[monthYear]) {
            acc[monthYear] = [];
          }
          acc[monthYear].push(doc);
          return acc;
        }, {});

        const sectionData = Object.keys(grouped).map(key => ({
          title: key,
          data: grouped[key]
        }));

        setSections(sectionData);
      } catch (err) {
        console.warn("Error fetching past documents", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPastDocuments();
  }, []);

  const renderItem = ({ item }) => {
    const amount = Number(item.amount_minor) / 100;
    const badge = getBadgeStyle(item.payment_status);
    const dateStr = new Date(item.created_at).toLocaleDateString('tr-TR');

    return (
      <View style={styles.card}>
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center">
            <View style={[styles.iconBox, { backgroundColor: getIconColorForType(item.type) + '20' }]}>
              <MaterialIcons name={getIconForType(item.type)} size={18} color={getIconColorForType(item.type)} />
            </View>
            <View className="ml-3">
              <Text className="text-white text-sm font-bold">
                {item.type === 'income' ? 'Gelir' : 'Gider'} Faturası
              </Text>
              <Text className="text-[#b9cacb] text-xs opacity-70 mt-0.5">{dateStr}</Text>
            </View>
          </View>
          <Text className="text-white font-bold text-base">
            {item.type === 'income' ? '+' : '-'}{formatCurrency(amount)} ₺
          </Text>
        </View>

        <View className="flex-row justify-between items-center mt-2 border-t border-[#ffffff10] pt-2">
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text style={{ color: badge.text, fontSize: 10, fontWeight: 'bold' }}>{badge.label}</Text>
          </View>
          <Text className="text-[#b9cacb] text-[10px] opacity-50">ID: {item.id.slice(0, 8)}...</Text>
        </View>
      </View>
    );
  };

  const renderSectionHeader = ({ section: { title } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{title.toUpperCase()}</Text>
    </View>
  );

  return (
    <View className="flex-1 bg-[#0A0A0B]">
      <ImageBackground 
        source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDUpjAKmMNnHDAuGn7KDAmiX4BVuWBLEG-5a7fHFVu_x7Jxrfh8UzY6rM-oy3AiqN0b1h6_K5iobCNsv2B4iHnz_lPjQ6QXfGvJ4UZmCcQLcr6H8o6m3I1JVFmgqk7UubXZx96-wpkV8-ScZZBzzkpl4-_WMzeHLyFljEKugxDZQXZgdkjst86sxa7hU95rBimeOBSnqHbdwH9bj_yj1tbla3T_HPG2xI6XkgTpyJRiDhmg9Po0q7NWy9DKn3JnR0b5tcpUj4Vcxr3w' }}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      >
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(10, 10, 11, 0.85)' }]} />
      </ImageBackground>

      <GlobalAppBar 
        level={3} 
        module="finans" 
        title="İşletmem (Geçmiş)" 
        onBack={() => navigation.goBack()}
      />

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-[#00f0ff]">Geçmiş kayıtlar yükleniyor...</Text>
        </View>
      ) : sections.length === 0 ? (
        <View className="flex-1 justify-center items-center px-6">
          <MaterialIcons name="history" size={48} color="rgba(255,255,255,0.2)" />
          <Text className="text-[#b9cacb] text-center mt-4">Geçmiş döneme ait herhangi bir hesap kaydınız bulunmuyor.</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 20 }}
          stickySectionHeadersEnabled={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(32, 31, 34, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sectionHeader: {
    marginBottom: 12,
    marginTop: 8,
  },
  sectionHeaderText: {
    color: '#00f0ff',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  }
});
