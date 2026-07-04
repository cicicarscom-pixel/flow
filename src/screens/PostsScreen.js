import React, { useState, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  FlatList, 
  ScrollView,
  ImageBackground,
  Animated,
  Easing,
  Image
} from 'react-native';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { supabase , GlobalAppBar } from '../shared';
import { CustomButton } from '../shared';
import { CustomInput } from '../shared';

// Glassmorphism Card Wrapper
const GlassCard = ({ children, style }) => (
  <View style={[styles.glassCard, style]}>
    {children}
  </View>
);

// Animated Border Card
const AnimatedBorderCard = ({ children, style, colors, padding = 16, borderRadius = 12, marginBottom = 0 }) => {
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
      return () => spinValue.stopAnimation();
    }, [])
  );

  // eslint-disable-next-line react-hooks/refs
  const spin = spinValue.interpolate({
    inputRange: [0, 1, 2],
    outputRange: ['0deg', '360deg', '720deg']
  });

  return (
    <View style={[style, { overflow: 'hidden', padding: 2, borderRadius, marginBottom, backgroundColor: 'rgba(255,255,255,0.03)' }]}>
      <Animated.View style={{ 
        position: 'absolute', top: '-100%', bottom: '-100%', left: '-100%', right: '-100%',
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
      <View style={{ flex: 1, backgroundColor: '#0A0A0B', borderRadius: borderRadius - 2, padding }}>
        {children}
      </View>
    </View>
  );
};

// Removed MOCK_POSTS

const FILTERS = [
  { id: 'all', label: 'Tümü' },
  { id: 'scheduled', label: 'Planlanan' },
  { id: 'published', label: 'Yayınlanan' },
  { id: 'failed', label: 'Hatalı' }
];

export default function PostsScreen({ navigation }) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [posts, setPosts] = useState([]);

  const fetchPosts = async () => {
    // 1. Fetch local posts (which now includes Zernio sync via edge function)
    const { data: localData, error: localError } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });
    
    let allPosts = localData || [];
    setPosts(allPosts);
  };

  React.useEffect(() => {
    setTimeout(() => {
      fetchPosts();
    }, 0);

    const channel = supabase
      .channel('realtime_posts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
        fetchPosts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredPosts = posts.filter(post => {
    if (activeFilter === 'all') return true;
    return post.status === activeFilter;
  });

  const getStatusColor = (status) => {
    switch(status) {
      case 'scheduled': return '#00f0ff'; // Cyan
      case 'published': return '#bc13fe'; // Magenta
      case 'failed': return '#ff0050'; // Red
      default: return '#849495'; // Gray
    }
  };

  const getStatusLabel = (status) => {
    switch(status) {
      case 'scheduled': return 'Planlandı';
      case 'published': return 'Yayınlandı';
      case 'failed': return 'Hatalı';
      default: return 'Bilinmiyor';
    }
  };

  const formatDate = (isoString) => {
    const d = new Date(isoString);
    return `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()} ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  const getPreviewText = (text) => {
    if (!text) return '';
    const words = text.trim().split(/\s+/);
    if (words.length > 5) {
      return words.slice(0, 5).join(' ') + '...';
    }
    return text;
  };

  const renderPostItem = ({ item }) => {
    const statusColor = getStatusColor(item.status);
    const isScheduled = item.status === 'scheduled';
    
    return (
      <View className="flex-row items-center border-b border-white/5 py-3 px-5" style={{ opacity: isScheduled ? 0.7 : 1 }}>
        {/* Checkbox Placeholder */}
        <View style={{ width: 40 }} className="justify-center">
           <View className="w-4 h-4 rounded border border-[#849495]/50 bg-transparent" />
        </View>
        
        {/* Content */}
        <View style={{ width: 250 }} className="flex-row items-center pr-4">
           {item.media_urls && item.media_urls.length > 0 ? (
              <Image 
                source={{ uri: item.media_urls[0] }} 
                style={{ width: 40, height: 40, borderRadius: 6, marginRight: 12 }} 
                resizeMode="cover"
              />
           ) : (
              <View style={{ width: 40, height: 40, borderRadius: 6, marginRight: 12, backgroundColor: 'rgba(255,255,255,0.05)' }} className="items-center justify-center">
                 <Feather name="image" size={16} color="#849495" />
              </View>
           )}
           <Text className="text-[#e5e2e3] text-[13px] font-medium flex-1" numberOfLines={2}>
              {getPreviewText(item.content || item.title)}
           </Text>
        </View>
        
        {/* Platforms */}
        <View style={{ width: 100 }} className="flex-row justify-center items-center">
           {Array.isArray(item.platforms) && item.platforms.map((platObj, idx) => {
              const platName = typeof platObj === 'string' ? platObj : platObj.platform;
              if (!platName) return null;
              let iconName = `logo-${platName.toLowerCase()}`;
              if (platName.toLowerCase() === 'twitter') iconName = 'close';
              return (
                <Ionicons key={idx} name={iconName} size={14} color="#e5e2e3" style={{ marginHorizontal: 2 }} />
              );
            })}
        </View>

        {/* Date */}
        <View style={{ width: 150 }} className="items-center justify-center">
           <Text className="text-[#b9cacb] text-[12px]">{item.scheduled_for ? formatDate(item.scheduled_for) : 'Belirtilmedi'}</Text>
        </View>

        {/* Status */}
        <View style={{ width: 120 }} className="items-center justify-center">
           <View className="flex-row items-center px-2 py-1 rounded border" style={{ 
              backgroundColor: isScheduled ? 'rgba(0, 240, 255, 0.15)' : `${statusColor}15`,
              borderColor: isScheduled ? 'rgba(0, 240, 255, 0.4)' : `${statusColor}30` 
           }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: isScheduled ? '#00f0ff' : statusColor, marginRight: 6 }} />
              <Text style={{ color: isScheduled ? '#00f0ff' : statusColor, fontSize: 10, fontWeight: 'bold' }}>{getStatusLabel(item.status)}</Text>
           </View>
        </View>

        {/* Profile */}
        <View style={{ width: 150 }} className="flex-row items-center">
           <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#ffb95f', marginRight: 8 }} />
           <Text className="text-[#e5e2e3] text-[12px]" numberOfLines={1}>Al Esnaf Profil</Text>
        </View>

        {/* Metrics (Dynamic Data) */}
        {[
          item.metrics?.likes ?? item.likes,
          item.metrics?.comments ?? item.comments,
          item.metrics?.shares ?? item.shares,
          item.metrics?.saves ?? item.saves,
          item.metrics?.clicks ?? item.clicks,
          item.metrics?.views ?? item.views,
          item.metrics?.impressions ?? item.impressions,
          item.metrics?.reach ?? item.reach
        ].map((metricValue, idx) => (
           <View key={idx} style={{ width: 60 }} className="items-center justify-center">
              <Text className="text-[#849495] text-[12px]">{metricValue != null ? metricValue : '-'}</Text>
           </View>
        ))}

        {/* Actions (Delete/Retry) placed at the end */}
        <View style={{ width: 80 }} className="flex-row justify-center items-center">
          {item.status === 'failed' && (
            <TouchableOpacity className="p-2 rounded bg-[#ff0050]/20 border border-[#ff0050]/40">
              <Ionicons name="refresh" size={14} color="#ff0050" />
            </TouchableOpacity>
          )}
          {item.status === 'scheduled' && (
            <TouchableOpacity className="p-2 rounded bg-[#00f0ff]/10 border border-[#00f0ff]/30">
              <Ionicons name="trash-outline" size={14} color="#00f0ff" />
            </TouchableOpacity>
          )}
          {item.status === 'published' && (
            <TouchableOpacity className="p-2 rounded bg-[#bc13fe]/10 border border-[#bc13fe]/30">
              <Ionicons name="cloud-offline-outline" size={14} color="#bc13fe" />
            </TouchableOpacity>
          )}
        </View>

      </View>
    );
  };

  const TableHeader = () => (
    <View className="flex-row items-center border-b border-white/10 pb-3 pt-4 mb-2 px-5" style={{ backgroundColor: 'rgba(10, 10, 11, 0.95)' }}>
      {/* Checkbox placeholder */}
      <View style={{ width: 40 }} />
      <Text className="text-[#849495] text-[12px] font-semibold" style={{ width: 250 }}>Content</Text>
      <Text className="text-[#849495] text-[12px] font-semibold text-center" style={{ width: 100 }}>Platforms</Text>
      <Text className="text-[#849495] text-[12px] font-semibold text-center" style={{ width: 150 }}>Date</Text>
      <Text className="text-[#849495] text-[12px] font-semibold text-center" style={{ width: 120 }}>Status</Text>
      <Text className="text-[#849495] text-[12px] font-semibold" style={{ width: 150 }}>Profile</Text>
      <Text className="text-[#849495] text-[10px] font-semibold text-center" style={{ width: 60 }}>Likes</Text>
      <Text className="text-[#849495] text-[10px] font-semibold text-center" style={{ width: 60 }}>Cmts</Text>
      <Text className="text-[#849495] text-[10px] font-semibold text-center" style={{ width: 60 }}>Shrs</Text>
      <Text className="text-[#849495] text-[10px] font-semibold text-center" style={{ width: 60 }}>Saves</Text>
      <Text className="text-[#849495] text-[10px] font-semibold text-center" style={{ width: 60 }}>Clicks</Text>
      <Text className="text-[#849495] text-[10px] font-semibold text-center" style={{ width: 60 }}>Views</Text>
      <Text className="text-[#849495] text-[10px] font-semibold text-center" style={{ width: 60 }}>Impr.</Text>
      <Text className="text-[#849495] text-[10px] font-semibold text-center" style={{ width: 60 }}>Reach</Text>
      <Text className="text-[#849495] text-[10px] font-semibold text-center" style={{ width: 80 }}>Actions</Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#0A0A0B]" edges={['top', 'left', 'right']}>
      {/* Cybernetic Background */}
      <ImageBackground 
        source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDUpjAKmMNnHDAuGn7KDAmiX4BVuWBLEG-5a7fHFVu_x7Jxrfh8UzY6rM-oy3AiqN0b1h6_K5iobCNsv2B4iHnz_lPjQ6QXfGvJ4UZmCcQLcr6H8o6m3I1JVFmgqk7UubXZx96-wpkV8-ScZZBzzkpl4-_WMzeHLyFljEKugxDZQXZgdkjst86sxa7hU95rBimeOBSnqHbdwH9bj_yj1tbla3T_HPG2xI6XkgTpyJRiDhmg9Po0q7NWy9DKn3JnR0b5tcpUj4Vcxr3w' }}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      >
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(10, 10, 11, 0.85)' }]} />
      </ImageBackground>

      {/* App Bar */}
      <GlobalAppBar 
        level={2} 
        module="sosyal" 
        title="Tüm Gönderiler" 
        showProfile={true} 
        actions={[{ icon: 'add', onPress: () => navigation.navigate('DigitalAssistant') }]} 
      />

      {/* Filters */}
      <View className="px-5 py-4">
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={FILTERS}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <CustomButton 
              onPress={() => setActiveFilter(item.id)}
              className={`px-4 py-2 rounded-full mr-2 border ${activeFilter === item.id ? 'bg-[#00f0ff]/20 border-[#00f0ff]' : 'bg-white/5 border-white/10'}`}
              textClassName={`text-[12px] font-bold ${activeFilter === item.id ? 'text-[#00f0ff]' : 'text-[#849495]'}`}
              title={item.label}
            />
          )}
        />
      </View>

      {/* List (Table Layout) */}
      <ScrollView horizontal showsHorizontalScrollIndicator={true} className="flex-1">
        {/* Total width of columns */}
        <View style={{ width: 1410 }}>
          <FlatList
            data={filteredPosts}
            keyExtractor={item => item.id}
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={true}
            ListHeaderComponent={TableHeader}
            stickyHeaderIndices={[0]}
            renderItem={renderPostItem}
            ListEmptyComponent={() => (
              <View className="items-center justify-center mt-20" style={{ width: '100%' }}>
                <Feather name="file-text" size={48} color="#849495" style={{ opacity: 0.5, marginBottom: 16 }} />
                <Text className="text-[#849495] text-[14px] mt-4">Bu duruma ait gönderi bulunamadı.</Text>
              </View>
            )}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  }
});
