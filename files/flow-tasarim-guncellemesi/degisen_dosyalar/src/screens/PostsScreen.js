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
  Image,
  Modal,
  Alert
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
          colors={colors ? ['rgba(255,255,255,0)', 'rgba(255,255,255,0)', colors[0], '#ffffff'] : ['rgba(255,255,255,0)', 'rgba(255,255,255,0)', '#A855F7', '#ffffff']}
          locations={[0, 0.4, 0.9, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
      <View style={{ flex: 1, backgroundColor: '#0A0B0F', borderRadius: borderRadius - 2, padding }}>
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
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, postId: null });
  const [isDeleting, setIsDeleting] = useState(false);

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
      case 'scheduled': return '#22D3EE'; // Cyan
      case 'published': return '#A855F7'; // Magenta
      case 'failed': return '#EF4444'; // Red
      default: return '#9CA3AF'; // Gray
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

  const handleDeletePost = (id) => {
    setDeleteModal({ isOpen: true, postId: id });
  };

  const executeDelete = async (deleteFromPlatforms) => {
    if (isDeleting || !deleteModal.postId) return;
    setIsDeleting(true);
    
    try {
      const post = posts.find(p => p.id === deleteModal.postId);
      if (post?.zernio_post_id) {
        const { error: invokeError } = await supabase.functions.invoke('zernio-client', {
          body: { action: 'delete-post', postId: post.zernio_post_id, deleteFromPlatforms }
        });
        if (invokeError) {
          console.error("Zernio delete error:", invokeError);
        }
      }

      const { error } = await supabase
        .from('posts')
        .update({ status: 'deleted' })
        .eq('id', deleteModal.postId);
        
      if (error) {
        Alert.alert("Hata", "Gönderi silinirken hata oluştu: " + error.message);
      } else {
        setPosts(prev => prev.map(p => p.id === deleteModal.postId ? { ...p, status: 'deleted' } : p));
      }
    } catch (err) {
      console.error("Delete exception:", err);
      Alert.alert("Hata", "İşlem sırasında hata oluştu.");
    } finally {
      setIsDeleting(false);
      setDeleteModal({ isOpen: false, postId: null });
    }
  };

  const renderPostItem = ({ item }) => {
    const statusColor = getStatusColor(item.status);
    const isScheduled = item.status === 'scheduled';
    
    return (
      <View className="flex-row items-center border-b border-white/5 py-3 px-5" style={{ opacity: isScheduled ? 0.7 : 1 }}>
        {/* Checkbox Placeholder */}
        <View style={{ width: 40 }} className="justify-center">
           <View className="w-4 h-4 rounded border border-[#9CA3AF]/50 bg-transparent" />
        </View>
        
        {/* Content */}
        <View style={{ width: 250 }} className="flex-row items-center pr-4">
           {item.media_urls && item.media_urls.length > 0 ? (
              <Image 
                source={{ uri: item.media_urls[0] }} 
                style={{ width: 40, height: 40, borderRadius: 8, marginRight: 12 }} 
                resizeMode="cover"
              />
           ) : (
              <View style={{ width: 40, height: 40, borderRadius: 8, marginRight: 12, backgroundColor: 'rgba(255,255,255,0.05)' }} className="items-center justify-center">
                 <Feather name="image" size={16} color="#9CA3AF" />
              </View>
           )}
           <Text className="text-[#F3F4F6] text-[13px] font-medium flex-1" numberOfLines={2}>
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
                <Ionicons key={idx} name={iconName} size={14} color="#F3F4F6" style={{ marginHorizontal: 2 }} />
              );
            })}
        </View>

        {/* Date */}
        <View style={{ width: 150 }} className="items-center justify-center">
           <Text className="text-[#9CA3AF] text-[12px]">{item.scheduled_for ? formatDate(item.scheduled_for) : 'Belirtilmedi'}</Text>
        </View>

        {/* Status */}
        <View style={{ width: 120 }} className="items-center justify-center">
           <View className="flex-row items-center px-2 py-1 rounded border" style={{ 
              backgroundColor: isScheduled ? 'rgba(34, 211, 238, 0.15)' : `${statusColor}15`,
              borderColor: isScheduled ? 'rgba(34, 211, 238, 0.4)' : `${statusColor}30` 
           }}>
              <View style={{ width: 6, height: 6, borderRadius: 4, backgroundColor: isScheduled ? '#22D3EE' : statusColor, marginRight: 6 }} />
              <Text style={{ color: isScheduled ? '#22D3EE' : statusColor, fontSize: 10, fontWeight: 'bold' }}>{getStatusLabel(item.status)}</Text>
           </View>
        </View>

        {/* Profile */}
        <View style={{ width: 150 }} className="flex-row items-center">
           <View style={{ width: 6, height: 6, borderRadius: 4, backgroundColor: '#F59E0B', marginRight: 8 }} />
           <Text className="text-[#F3F4F6] text-[12px]" numberOfLines={1}>Al Esnaf Profil</Text>
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
              <Text className="text-[#9CA3AF] text-[12px]">{metricValue != null ? metricValue : '-'}</Text>
           </View>
        ))}

        {/* Actions (Delete/Retry) placed at the end */}
        <View style={{ width: 80 }} className="flex-row justify-center items-center">
          {item.status === 'failed' && (
            <TouchableOpacity className="p-2 rounded bg-[#EF4444]/20 border border-[#EF4444]/40">
              <Ionicons name="refresh" size={14} color="#EF4444" />
            </TouchableOpacity>
          )}
          {item.status === 'scheduled' && (
            <TouchableOpacity onPress={() => handleDeletePost(item.id)} className="p-2 rounded bg-[#22D3EE]/10 border border-[#22D3EE]/30">
              <Ionicons name="trash-outline" size={14} color="#22D3EE" />
            </TouchableOpacity>
          )}
          {item.status === 'published' && (
            <>
              <TouchableOpacity className="p-2 rounded bg-[#A855F7]/10 border border-[#A855F7]/30">
                <Ionicons name="cloud-offline-outline" size={14} color="#A855F7" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDeletePost(item.id)} className="p-2 rounded bg-[#EF4444]/10 border border-[#EF4444]/30 ml-1">
                <Ionicons name="trash-outline" size={14} color="#EF4444" />
              </TouchableOpacity>
            </>
          )}
        </View>

      </View>
    );
  };

  const TableHeader = () => (
    <View className="flex-row items-center border-b border-white/10 pb-3 pt-4 mb-2 px-5" style={{ backgroundColor: 'rgba(10, 10, 11, 0.95)' }}>
      {/* Checkbox placeholder */}
      <View style={{ width: 40 }} />
      <Text className="text-[#9CA3AF] text-[12px] font-semibold" style={{ width: 250 }}>Content</Text>
      <Text className="text-[#9CA3AF] text-[12px] font-semibold text-center" style={{ width: 100 }}>Platforms</Text>
      <Text className="text-[#9CA3AF] text-[12px] font-semibold text-center" style={{ width: 150 }}>Date</Text>
      <Text className="text-[#9CA3AF] text-[12px] font-semibold text-center" style={{ width: 120 }}>Status</Text>
      <Text className="text-[#9CA3AF] text-[12px] font-semibold" style={{ width: 150 }}>Profile</Text>
      <Text className="text-[#9CA3AF] text-[10px] font-semibold text-center" style={{ width: 60 }}>Likes</Text>
      <Text className="text-[#9CA3AF] text-[10px] font-semibold text-center" style={{ width: 60 }}>Cmts</Text>
      <Text className="text-[#9CA3AF] text-[10px] font-semibold text-center" style={{ width: 60 }}>Shrs</Text>
      <Text className="text-[#9CA3AF] text-[10px] font-semibold text-center" style={{ width: 60 }}>Saves</Text>
      <Text className="text-[#9CA3AF] text-[10px] font-semibold text-center" style={{ width: 60 }}>Clicks</Text>
      <Text className="text-[#9CA3AF] text-[10px] font-semibold text-center" style={{ width: 60 }}>Views</Text>
      <Text className="text-[#9CA3AF] text-[10px] font-semibold text-center" style={{ width: 60 }}>Impr.</Text>
      <Text className="text-[#9CA3AF] text-[10px] font-semibold text-center" style={{ width: 60 }}>Reach</Text>
      <Text className="text-[#9CA3AF] text-[10px] font-semibold text-center" style={{ width: 80 }}>Actions</Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#0A0B0F]" edges={['top', 'left', 'right']}>
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
              className={`px-4 py-2 rounded-full mr-2 border ${activeFilter === item.id ? 'bg-[#22D3EE]/20 border-[#22D3EE]' : 'bg-white/5 border-white/10'}`}
              textClassName={`text-[12px] font-bold ${activeFilter === item.id ? 'text-[#22D3EE]' : 'text-[#9CA3AF]'}`}
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
                <Feather name="file-text" size={48} color="#9CA3AF" style={{ opacity: 0.5, marginBottom: 16 }} />
                <Text className="text-[#9CA3AF] text-[14px] mt-4">Bu duruma ait gönderi bulunamadı.</Text>
              </View>
            )}
          />
        </View>
      </ScrollView>

      {/* Delete Modal */}
      <Modal visible={deleteModal.isOpen} transparent={true} animationType="fade" onRequestClose={() => !isDeleting && setDeleteModal({ isOpen: false, postId: null })}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ width: '100%', maxWidth: 400, backgroundColor: '#ffffff', borderRadius: 16, overflow: 'hidden' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Feather name="trash-2" size={18} color="#EF4444" />
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827', marginLeft: 8 }}>Gönderiyi sil</Text>
              </View>
              <TouchableOpacity onPress={() => !isDeleting && setDeleteModal({ isOpen: false, postId: null })} disabled={isDeleting} style={{ padding: 4 }}>
                <Feather name="x" size={20} color="#9ca3af" />
              </TouchableOpacity>
            </View>
            
            <View style={{ padding: 20 }}>
              <Text style={{ fontSize: 14, color: '#4b5563', marginBottom: 20 }}>Bu gönderiyi nasıl silmek istediğinizi seçin.</Text>
              
              <TouchableOpacity 
                disabled={isDeleting}
                onPress={() => executeDelete(false)}
                style={{ flexDirection: 'row', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 12 }}
              >
                <View style={{ backgroundColor: 'rgba(255, 59, 48, 0.1)', padding: 8, borderRadius: 8, marginRight: 12, alignSelf: 'flex-start', marginTop: 2 }}>
                  <Feather name="trash-2" size={18} color="#EF4444" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '500', color: '#111827', marginBottom: 4 }}>Sadece Workigom Flow'dan sil</Text>
                  <Text style={{ fontSize: 12, color: '#6b7280', lineHeight: 18 }}>Workigom Flow panelinizden kaldırılır. Gönderi Facebook ve Instagram'da yayınlanmaya devam eder.</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                disabled={isDeleting}
                onPress={() => executeDelete(true)}
                style={{ flexDirection: 'row', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb' }}
              >
                <View style={{ backgroundColor: 'rgba(236, 72, 153, 0.1)', padding: 8, borderRadius: 8, marginRight: 12, alignSelf: 'flex-start', marginTop: 2 }}>
                  <Feather name="globe" size={18} color="#ec4899" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '500', color: '#111827', marginBottom: 4 }}>Platformlardan ve Workigom Flow'dan sil</Text>
                  <Text style={{ fontSize: 12, color: '#6b7280', lineHeight: 18, marginBottom: 8 }}>Facebook'tan kalıcı olarak silinir ve Workigom Flow'dan kaldırılır.</Text>
                  <View style={{ flexDirection: 'row', backgroundColor: '#fefce8', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#fef08a' }}>
                    <Feather name="alert-triangle" size={14} color="#ca8a04" style={{ marginTop: 2, marginRight: 8 }} />
                    <Text style={{ flex: 1, fontSize: 11, color: '#a16207', lineHeight: 16 }}>Instagram API üzerinden silmeyi desteklemediğinden, Instagram'dan manuel olarak silinmesi gerekebilir.</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
