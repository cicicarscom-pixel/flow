/* eslint-disable i18next/no-literal-string */
import React, { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
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
          colors={colors ? ['rgba(255,255,255,0)', 'rgba(255,255,255,0)', colors[0], '#ffffff'] : ['rgba(255,255,255,0)', 'rgba(255,255,255,0)', '#C2478D', '#ffffff']}
          locations={[0, 0.4, 0.9, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
      <View style={{ flex: 1, backgroundColor: '#17151A', borderRadius: borderRadius - 2, padding }}>
        {children}
      </View>
    </View>
  );
};

// Removed MOCK_POSTS

const FILTERS = [
  { id: 'all', labelKey: 'postsScreen.filters.all' },
  { id: 'scheduled', labelKey: 'postsScreen.filters.scheduled' },
  { id: 'published', labelKey: 'postsScreen.filters.published' },
  { id: 'failed', labelKey: 'postsScreen.filters.failed' }
];

const UNPUBLISH_SUPPORTED_PLATFORMS = new Set([
  'threads', 'facebook', 'twitter', 'linkedin', 'youtube',
  'pinterest', 'reddit', 'bluesky', 'googlebusiness', 'telegram'
]);

export default function PostsScreen({ navigation }) {
  const { t } = useTranslation();
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
    const s = (post.status || '').toLowerCase();
    if (s === 'deleted') return false;
    if (activeFilter === 'all') return true;
    return s === activeFilter.toLowerCase();
  });

  const getStatusColor = (status) => {
    switch(status) {
      case 'scheduled': return '#22B573'; // Cyan
      case 'published': return '#C2478D'; // Magenta
      case 'failed': return '#EF4444'; // Red
      default: return '#A79E96'; // Gray
    }
  };

  const getStatusLabel = (status) => {
    switch(status) {
      case 'scheduled': return t('postsScreen.status.scheduled');
      case 'published': return t('postsScreen.status.published');
      case 'failed': return t('postsScreen.status.failed');
      default: return t('postsScreen.status.unknown');
    }
  };

  const formatDate = (isoString) => {
    const d = new Date(isoString);
    return `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()} ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  const getPreviewText = (text) => {
    if (!text) return '';
    return text.length > 60 ? text.substring(0, 60) + '...' : text;
  };

  const handleDeletePost = (id) => {
    setDeleteModal({ isOpen: true, postId: id });
  };

  const attemptZernioRemoval = async (post) => {
    if (!post.zernio_post_id) {
      return { removed: true };
    }

    if (post.status !== 'published') {
      const { data, error: invokeError } = await supabase.functions.invoke('zernio-client', {
        body: { action: 'delete-post', payload: { postId: post.zernio_post_id } }
      });
      if (invokeError || data?.success === false) {
        return { removed: false, warning: data?.error || invokeError?.message || 'Unknown error' };
      }
      return { removed: true };
    }

    const platforms = Array.isArray(post.platforms) ? post.platforms : [];
    const manual = [];
    const failed = [];

    for (const platform of platforms) {
      if (!UNPUBLISH_SUPPORTED_PLATFORMS.has(platform)) {
        manual.push(platform);
        continue;
      }
      const { data, error: invokeError } = await supabase.functions.invoke('zernio-client', {
        body: { action: 'unpublish-post', payload: { postId: post.zernio_post_id, platform } }
      });
      if (invokeError || data?.success === false) {
        failed.push(platform);
      }
    }

    const warnings = [];
    if (manual.length > 0) warnings.push(t('postsScreen.alerts.manualPlatformRemoval', { platforms: manual.join(', '), defaultValue: `Lütfen şu platformlardan gönderiyi elle silin: ${manual.join(', ')}` }));
    if (failed.length > 0) warnings.push(t('postsScreen.alerts.platformRemovalFailed', { platforms: failed.join(', '), defaultValue: `Şu platformlardan silinirken hata oluştu: ${failed.join(', ')}` }));

    return { removed: true, warning: warnings.length > 0 ? warnings.join(' ') : undefined };
  };

  const executeDelete = async (deleteFromPlatforms) => {
    if (isDeleting || !deleteModal.postId) return;
    setIsDeleting(true);
    
    try {
      const post = posts.find(p => p.id === deleteModal.postId);
      let zernioResult = { removed: true };

      if (deleteFromPlatforms && post) {
        zernioResult = await attemptZernioRemoval(post);
        if (!zernioResult.removed) {
          console.error("Zernio delete error:", zernioResult.warning);
          Alert.alert(t('postsScreen.alerts.errorTitle'), zernioResult.warning || 'Unknown error');
          return;
        }
      }

      const { error } = await supabase
        .from('posts')
        .update({ status: 'deleted' })
        .eq('id', deleteModal.postId);
        
      if (error) {
        Alert.alert(t('postsScreen.alerts.errorTitle'), t('postsScreen.alerts.deleteError', { message: error.message }));
      } else {
        setPosts(prev => prev.map(p => p.id === deleteModal.postId ? { ...p, status: 'deleted' } : p));
        if (zernioResult.warning) {
          Alert.alert('Bilgi', zernioResult.warning);
        }
      }
    } catch (err) {
      console.error("Delete exception:", err);
      Alert.alert(t('postsScreen.alerts.errorTitle'), t('postsScreen.alerts.deleteException'));
    } finally {
      setIsDeleting(false);
      setDeleteModal({ isOpen: false, postId: null });
    }
  };



  return (
    <SafeAreaView className="flex-1 bg-[#17151A]" edges={['top', 'left', 'right']}>
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
        title={t('postsScreen.title')}
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
              className={`px-4 py-2 rounded-full mr-2 border ${activeFilter === item.id ? 'bg-[#22B573]/20 border-[#22B573]' : 'bg-white/5 border-white/10'}`}
              textClassName={`text-[12px] font-bold ${activeFilter === item.id ? 'text-[#22B573]' : 'text-[#A79E96]'}`}
              title={t(item.labelKey)}
            />
          )}
        />
      </View>

      {/* List (Card Layout) */}
      <View className="flex-1 px-5 mt-2">
        <FlatList
          data={filteredPosts}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={true}
          renderItem={({ item }) => {
            const statusColor = getStatusColor(item.status);
            const isScheduled = item.status === 'scheduled';
            const isVideo = item.media_urls && item.media_urls.length > 0 && (item.media_urls[0].match(/\.(mp4|webm|mov)(\?.*)?$/i) || item.media_urls[0].includes('blob'));

            return (
              <View style={{ marginBottom: 12, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', padding: 12 }}>
                <View className="flex-row items-start">
                  {/* Left: Thumbnail (smaller) */}
                  {item.media_urls && item.media_urls.length > 0 ? (
                    <View style={{ width: 48, height: 48, borderRadius: 8, overflow: 'hidden', marginRight: 12, backgroundColor: '#000' }}>
                      {isVideo ? (
                        <View className="w-full h-full items-center justify-center bg-black/80 border border-white/10 rounded-lg">
                          <MaterialIcons name="play-arrow" size={24} color="#fff" />
                        </View>
                      ) : (
                        <Image source={{ uri: item.media_urls[0] }} style={{ width: 48, height: 48 }} resizeMode="cover" />
                      )}
                    </View>
                  ) : (
                    <View style={{ width: 48, height: 48, borderRadius: 8, marginRight: 12, backgroundColor: 'rgba(255,255,255,0.05)' }} className="items-center justify-center border border-white/5">
                      <Feather name="image" size={20} color="#A79E96" />
                    </View>
                  )}

                  {/* Right: Content & Metadata */}
                  <View className="flex-1">
                    {/* Top line: Text & Date */}
                    <View className="flex-row justify-between items-start mb-1.5">
                      <Text className="text-[#F6F1EC] text-[13px] font-medium flex-1 mr-2 leading-5" numberOfLines={2}>
                        {getPreviewText(item.content || item.title) || t('postCommentsScreen.hiddenComment', { defaultValue: 'Açıklama yok' })}
                      </Text>
                      <Text className="text-[#A79E96] text-[10px] shrink-0 mt-0.5">
                        {item.scheduled_for ? formatDate(item.scheduled_for) : formatDate(item.created_at || new Date().toISOString())}
                      </Text>
                    </View>

                    {/* Middle line: Platforms & Status */}
                    <View className="flex-row items-center flex-wrap mb-1">
                      <View className="flex-row items-center px-1.5 py-0.5 rounded mr-2" style={{ backgroundColor: `${statusColor}15`, borderColor: `${statusColor}30`, borderWidth: 1 }}>
                        <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: statusColor, marginRight: 4 }} />
                        <Text style={{ color: statusColor, fontSize: 9, fontWeight: 'bold' }}>{getStatusLabel(item.status)}</Text>
                      </View>
                      {item.media_storage_source === 'supabase' && (
                        <View className="px-1.5 py-0.5 rounded bg-[#F2994A]/10 border border-[#F2994A]/30 mr-2">
                          <Text className="text-[#F2994A] text-[9px] font-bold">Depo</Text>
                        </View>
                      )}
                      {Array.isArray(item.platforms) && item.platforms.map((platObj, idx) => {
                        const platName = typeof platObj === 'string' ? platObj : platObj.platform;
                        if (!platName) return null;
                        let iconName = `logo-${platName.toLowerCase()}`;
                        if (platName.toLowerCase() === 'twitter') iconName = 'close';
                        return <Ionicons key={idx} name={iconName} size={12} color="#A79E96" style={{ marginRight: 4 }} />;
                      })}
                    </View>
                  </View>
                </View>

                {/* Bottom line: Metrics & Actions */}
                <View className="flex-row items-center justify-between mt-2 pt-2 border-t border-white/5">
                  <View className="flex-row items-center">
                    <View className="flex-row items-center mr-3"><Feather name="heart" size={12} color="#A79E96" /><Text className="text-[#A79E96] text-[10px] ml-1">{item.metrics?.likes ?? item.likes ?? '-'}</Text></View>
                    <View className="flex-row items-center mr-3"><Feather name="message-circle" size={12} color="#A79E96" /><Text className="text-[#A79E96] text-[10px] ml-1">{item.metrics?.comments ?? item.comments ?? '-'}</Text></View>
                    <View className="flex-row items-center mr-3"><Feather name="share-2" size={12} color="#A79E96" /><Text className="text-[#A79E96] text-[10px] ml-1">{item.metrics?.shares ?? item.shares ?? '-'}</Text></View>
                    <View className="flex-row items-center mr-3"><Feather name="bookmark" size={12} color="#A79E96" /><Text className="text-[#A79E96] text-[10px] ml-1">{item.metrics?.saves ?? item.saves ?? '-'}</Text></View>
                    <View className="flex-row items-center"><Feather name="mouse-pointer" size={12} color="#A79E96" /><Text className="text-[#A79E96] text-[10px] ml-1">{item.metrics?.clicks ?? item.clicks ?? '-'}</Text></View>
                  </View>
                  
                  <View className="flex-row items-center">
                    {item.status === 'failed' && (
                      <TouchableOpacity className="p-1.5 rounded-md bg-[#EF4444]/10 border border-[#EF4444]/30 mr-2">
                        <Ionicons name="refresh" size={14} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                    {(item.status === 'scheduled' || item.status === 'published' || item.status === 'failed') && (
                      <TouchableOpacity onPress={() => handleDeletePost(item.id)} className="p-1.5 rounded-md bg-[#EF4444]/10 border border-[#EF4444]/30">
                        <Ionicons name="trash-outline" size={14} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={() => (
            <View className="items-center justify-center mt-20">
              <Feather name="file-text" size={48} color="#A79E96" style={{ opacity: 0.5, marginBottom: 16 }} />
              <Text className="text-[#A79E96] text-[14px] mt-4 text-center">{t('postsScreen.emptyState.noPostsForFilter')}</Text>
            </View>
          )}
        />
      </View>

      {/* Delete Modal */}
      <Modal visible={deleteModal.isOpen} transparent={true} animationType="fade" onRequestClose={() => !isDeleting && setDeleteModal({ isOpen: false, postId: null })}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ width: '100%', maxWidth: 400, backgroundColor: '#ffffff', borderRadius: 16, overflow: 'hidden' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F6F1EC' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Feather name="trash-2" size={18} color="#EF4444" />
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827', marginLeft: 8 }}>{t('postsScreen.deleteModal.title')}</Text>
              </View>
              <TouchableOpacity onPress={() => !isDeleting && setDeleteModal({ isOpen: false, postId: null })} disabled={isDeleting} style={{ padding: 4 }}>
                <Feather name="x" size={20} color="#A79E96" />
              </TouchableOpacity>
            </View>
            
            <View style={{ padding: 20 }}>
              <Text style={{ fontSize: 14, color: '#4b5563', marginBottom: 20 }}>{t('postsScreen.deleteModal.subtitle')}</Text>
              
              <TouchableOpacity 
                disabled={isDeleting}
                onPress={() => executeDelete(false)}
                style={{ flexDirection: 'row', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 12 }}
              >
                <View style={{ backgroundColor: 'rgba(255, 59, 48, 0.1)', padding: 8, borderRadius: 8, marginRight: 12, alignSelf: 'flex-start', marginTop: 2 }}>
                  <Feather name="trash-2" size={18} color="#EF4444" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '500', color: '#111827', marginBottom: 4 }}>{t('postsScreen.deleteModal.panelOnly.title')}</Text>
                  <Text style={{ fontSize: 12, color: '#756D66', lineHeight: 18 }}>{t('postsScreen.deleteModal.panelOnly.description')}</Text>
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
                  <Text style={{ fontSize: 15, fontWeight: '500', color: '#111827', marginBottom: 4 }}>{t('postsScreen.deleteModal.platformsToo.title')}</Text>
                  <Text style={{ fontSize: 12, color: '#756D66', lineHeight: 18, marginBottom: 8 }}>{t('postsScreen.deleteModal.platformsToo.description')}</Text>
                  <View style={{ flexDirection: 'row', backgroundColor: '#fefce8', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#fef08a' }}>
                    <Feather name="alert-triangle" size={14} color="#ca8a04" style={{ marginTop: 2, marginRight: 8 }} />
                    <Text style={{ flex: 1, fontSize: 11, color: '#a16207', lineHeight: 16 }}>{t('postsScreen.deleteModal.platformsToo.warning')}</Text>
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
