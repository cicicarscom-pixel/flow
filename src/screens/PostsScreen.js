import React, { useState, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  FlatList, 
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

  const renderPostItem = ({ item }) => {
    const statusColor = getStatusColor(item.status);
    
    return (
      <AnimatedBorderCard 
        marginBottom={16} 
        colors={[`${statusColor}40`, '#131314']}
        padding={16}
      >
        <View className="flex-row justify-between items-start mb-2">
          <Text className="text-[#e5e2e3] font-bold text-[14px] flex-1 mr-2" numberOfLines={1} ellipsizeMode="tail">{item.title || 'İsimsiz Gönderi'}</Text>
          <View className="flex-row items-center bg-white/5 px-2 py-1 rounded border" style={{ borderColor: `${statusColor}30` }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: statusColor, marginRight: 6 }} />
            <Text style={{ color: statusColor, fontSize: 10, fontWeight: 'bold' }}>{getStatusLabel(item.status)}</Text>
          </View>
        </View>

        {item.media_urls && item.media_urls.length > 0 && (
          <Image 
            source={{ uri: item.media_urls[0] }} 
            style={{ width: '100%', height: 160, borderRadius: 8, marginBottom: 12 }} 
            resizeMode="cover"
          />
        )}
        <Text className="text-[#849495] text-[12px] mb-3 leading-5" numberOfLines={2} ellipsizeMode="tail">
          {item.content}
        </Text>

        <View className="flex-row items-center justify-between mt-2 pt-3 border-t border-white/5">
          <View className="flex-row items-center">
            {item.platforms && item.platforms.map((platObj, idx) => {
              const platName = typeof platObj === 'string' ? platObj : platObj.platform;
              if (!platName) return null;
              let iconName = `logo-${platName.toLowerCase()}`;
              if (platName.toLowerCase() === 'twitter') iconName = 'close'; // X icon fallback
              return (
                <View key={idx} className="w-6 h-6 rounded-full bg-white/5 items-center justify-center mr-1">
                  <Ionicons name={iconName} size={12} color="#e5e2e3" />
                </View>
              );
            })}
          </View>
          
          <View className="flex-row items-center">
            <MaterialIcons name="event" size={12} color="#849495" style={{ marginRight: 4 }} />
            <Text className="text-[#849495] text-[10px]">{item.scheduled_for ? formatDate(item.scheduled_for) : 'Planlanmadı'}</Text>
          </View>
        </View>

        {/* Action Buttons based on Status */}
        <View className="flex-row justify-end mt-3">
          {item.status === 'failed' && (
            <CustomButton 
              className="px-3 py-1.5 rounded border border-[#ff0050]/40 bg-[#ff0050]/20"
              textClassName="text-[#ff0050] text-[10px] font-bold"
              title="Yeniden Dene"
              leftIcon={<Ionicons name="refresh" size={12} color="#ff0050" />}
            />
          )}
          {item.status === 'scheduled' && (
            <CustomButton 
              className="px-3 py-1.5 rounded border border-[#00f0ff]/30 bg-[#00f0ff]/10 ml-2"
              textClassName="text-[#00f0ff] text-[10px] font-bold"
              title="Sil"
              leftIcon={<Ionicons name="trash-outline" size={12} color="#00f0ff" />}
            />
          )}
          {item.status === 'published' && (
            <CustomButton 
              className="px-3 py-1.5 rounded border border-[#bc13fe]/30 bg-[#bc13fe]/10 ml-2"
              textClassName="text-[#bc13fe] text-[10px] font-bold"
              title="Yayından Kaldır"
              leftIcon={<Ionicons name="cloud-offline-outline" size={12} color="#bc13fe" />}
            />
          )}
        </View>
      </AnimatedBorderCard>
    );
  };

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

      {/* List */}
      <FlatList
        data={filteredPosts}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        renderItem={renderPostItem}
        ListEmptyComponent={() => (
          <View className="items-center justify-center mt-20">
            <Feather name="file-text" size={48} color="#849495" style={{ opacity: 0.5, mb: 16 }} />
            <Text className="text-[#849495] text-[14px] mt-4">Bu duruma ait gönderi bulunamadı.</Text>
          </View>
        )}
      />
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
