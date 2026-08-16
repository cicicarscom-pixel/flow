import React, { useRef, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  FlatList, 
  ImageBackground, 
  Image,
  Animated,
  Easing,
  ActivityIndicator,
  Alert,
  RefreshControl,
  DeviceEventEmitter
} from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase , GlobalAppBar } from '../../../../shared';
import { CustomButton } from '../../../../shared';
import { CustomInput } from '../../../../shared';


const Tab = createMaterialTopTabNavigator();

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
          colors={colors ? ['rgba(255,255,255,0)', 'rgba(255,255,255,0)', colors[0], '#ffffff'] : ['rgba(255,255,255,0)', 'rgba(255,255,255,0)', '#00f0ff', '#ffffff']}
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

// TAB COMPONENTS
const MesajlarTab = ({ navigation }) => {
  const { t } = useTranslation();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);

  const fetchConversations = async () => {
    try {
      const { data: localData, error } = await supabase
        .from('conversations')
        .select(`
          *,
          messages (
            content,
            created_at
          )
        `)
        .order('updated_at', { ascending: false });
      
      if (error) {
        console.error("Local conversations fetch error:", error);
      }
      
      const enhancedData = (localData || []).map(conv => {
        let lastMessageSnippet = t('sosyalMedya.inbox.tapToViewLastMessage');
        if (conv.messages && conv.messages.length > 0) {
          // Sort messages by created_at desc to get the latest
          const sortedMessages = [...conv.messages].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          lastMessageSnippet = sortedMessages[0].content;
        }
        return { ...conv, lastMessageSnippet };
      });
      
      setConversations(enhancedData);
    } catch (e) {
      console.log('Conversations fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      fetchConversations();
    }, 0);
    
    const channel = supabase
      .channel('realtime_conversations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, (payload) => {
        console.log('Conversations changed:', payload);
        fetchConversations(); // Re-fetch on any change for simplicity
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const listener = DeviceEventEmitter.addListener('REFRESH_INBOX', fetchConversations);
    return () => {
      listener.remove();
    };
  }, []);

  const toggleSelection = (zId) => {
    setSelectedItems(prev => 
      prev.includes(zId) ? prev.filter(i => i !== zId) : [...prev, zId]
    );
  };

  const handleSelectAll = () => {
    const allIds = conversations.map(c => c.zernio_conversation_id || c.id).filter(Boolean);
    if (selectedItems.length === allIds.length && allIds.length > 0) {
      setSelectedItems([]);
    } else {
      setSelectedItems(allIds);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedItems.length === 0) return;
    
    Alert.alert(
      t('sosyalMedya.alerts.deleteChats'),
      t('sosyalMedya.alerts.deleteChatsConfirm', { count: selectedItems.length }),
      [
        { text: t('sosyalMedya.alerts.cancel'), style: "cancel" },
        {
          text: t('sosyalMedya.alerts.delete'),
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase.from('conversations').delete().in('zernio_conversation_id', selectedItems);
            await supabase.from('ai_communication_logs').delete().in('sender_id', selectedItems);
            if (error) {
              console.error("Sohbet silme hatası:", error);
              alert(t('sosyalMedya.alerts.deleteChatError'));
            } else {
              setIsSelectionMode(false);
              setSelectedItems([]);
            }
          }
        }
      ]
    );
  };

  if (loading) return <ActivityIndicator color="#00f0ff" style={{ marginTop: 20 }} />;

  return (
    <View style={styles.tabContainer}>
      {isSelectionMode && (
        <View className="flex-row justify-between items-center bg-[#bc13fe]/10 px-5 py-4 border-b border-[#bc13fe]/30">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => { setIsSelectionMode(false); setSelectedItems([]); }} className="mr-4">
              <Ionicons name="close" size={24} color="#e5e2e3" />
            </TouchableOpacity>
            <Text className="text-[#e5e2e3] font-bold text-[16px]">{t('sosyalMedya.inbox.selectedCount', { count: selectedItems.length })}</Text>
          </View>
          <View className="flex-row items-center">
            <TouchableOpacity onPress={handleSelectAll} className="mr-4 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
              <Text className="text-white text-[14px] font-bold">Tümünü Seç</Text>
            </TouchableOpacity>
            <CustomButton 
              onPress={handleDeleteSelected} 
            disabled={selectedItems.length === 0}
            className={`px-4 py-2 rounded-lg border ${selectedItems.length > 0 ? 'bg-[#ff0050]/20 border-[#ff0050]/40' : 'bg-white/5 border-white/10'}`}
            textClassName={`text-[14px] font-bold ${selectedItems.length > 0 ? 'text-[#ff0050]' : 'text-[#849495]'}`}
            title={t('sosyalMedya.inbox.delete')}
            leftIcon={<Feather name="trash-2" size={16} color={selectedItems.length > 0 ? "#ff0050" : "#849495"} />}
          />
          </View>
        </View>
      )}

      {conversations.length === 0 ? (
        <View className="flex-1 items-center justify-center p-5">
          <Ionicons name="chatbubbles-outline" size={48} color="#849495" />
          <Text className="text-[#849495] mt-4 text-center">{t('sosyalMedya.inbox.noMessages')}</Text>
        </View>
      ) : (
        <FlatList 
          data={conversations}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 20, paddingBottom: 160 }}
          renderItem={({ item }) => (
            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={() => {
                if (isSelectionMode) {
                  toggleSelection(item.zernio_conversation_id);
                } else {
                  navigation.navigate('ChatScreen', {
                    name: item.participant_name,
                    platform: item.platform,
                    conversationId: item.zernio_conversation_id,
                    localConversationId: item.id,
                    accountId: item.accountId
                  });
                }
              }}
              onLongPress={() => {
                if (!isSelectionMode) {
                  setIsSelectionMode(true);
                  setSelectedItems([item.zernio_conversation_id]);
                }
              }}
              delayLongPress={250}
            >
              <GlassCard style={{ padding: 12, marginBottom: 12, borderRadius: 12, borderWidth: isSelectionMode && selectedItems.includes(item.zernio_conversation_id) ? 1 : 0, borderColor: isSelectionMode && selectedItems.includes(item.zernio_conversation_id) ? '#bc13fe' : 'transparent' }}>
                <View className="flex-row items-center justify-between">
                  {isSelectionMode && (
                    <View className={`w-6 h-6 rounded-full border mr-3 items-center justify-center ${selectedItems.includes(item.zernio_conversation_id) ? 'bg-[#bc13fe] border-[#bc13fe]' : 'border-white/30'}`}>
                      {selectedItems.includes(item.zernio_conversation_id) && <Ionicons name="checkmark" size={16} color="#fff" />}
                    </View>
                  )}
                  <View className="flex-row items-center flex-1">
                    <View className="w-12 h-12 rounded-full bg-white/10 items-center justify-center mr-3 relative">
                      <Ionicons name={item.platform === 'instagram' ? 'logo-instagram' : 'logo-facebook'} size={24} color={item.platform === 'instagram' ? '#ebb2ff' : '#00f0ff'} />
                      {item.unread_count > 0 && (
                        <View className="absolute -top-1 -right-1 bg-[#bc13fe] w-5 h-5 rounded-full items-center justify-center border border-[#0A0A0B]">
                          <Text className="text-white text-[10px] font-bold">{item.unread_count}</Text>
                        </View>
                      )}
                    </View>
                    <View className="flex-1">
                      <Text className="text-[#e5e2e3] font-bold text-[14px]" numberOfLines={1} ellipsizeMode="tail">{item.participant_name}</Text>
                      <Text className={`text-[12px] mt-1 ${item.unread_count > 0 ? 'text-[#00f0ff] font-medium' : 'text-[#849495]'}`} numberOfLines={1} ellipsizeMode="tail">
                        {item.lastMessageSnippet}
                      </Text>
                    </View>
                  </View>
                  <View className="items-end">
                    <Text className="text-[#849495] text-[10px] mb-2">
                      {new Date(item.updated_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute:'2-digit' })}
                    </Text>
                    
                    <View className="flex-row">
                      {item.unread_count > 0 && (
                        <TouchableOpacity className="w-7 h-7 rounded-full bg-[#00f0ff]/10 items-center justify-center border border-[#00f0ff]/30 mr-2">
                          <Ionicons name="checkmark-done" size={14} color="#00f0ff" />
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity 
                        onPress={() => navigation.navigate('ChatScreen', {
                          name: item.participant_name,
                          platform: item.platform,
                          conversationId: item.zernio_conversation_id,
                          localConversationId: item.id,
                          accountId: item.accountId
                        })}
                        className="w-7 h-7 rounded-full bg-[#bc13fe]/10 items-center justify-center border border-[#bc13fe]/30"
                      >
                        <MaterialIcons name="reply" size={14} color="#bc13fe" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </GlassCard>
            </TouchableOpacity>
          )}
        />
      )}
      
      {/* Create Conversation FAB */}
      <TouchableOpacity 
        onPress={() => alert(t('sosyalMedya.alerts.newChatApiSoon'))}
        className="absolute bottom-6 right-6 w-14 h-14 bg-[#00f0ff] rounded-full items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.6)]"
      >
        <Ionicons name="chatbubble-ellipses" size={24} color="#0A0A0B" />
      </TouchableOpacity>
    </View>
  );
};

const YorumlarTab = ({ navigation }) => {
  const { t } = useTranslation();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Silinen ID'lerin senkron ref'i — race condition'ı önler
  // AsyncStorage asenkron, Phase 2 closure eski değeri yakalayabilir.
  // Bu ref silme anında HEMEN güncellenir, herhangi bir await beklenmez.
  const deletedIdsRef = useRef(new Set());

  // Selection State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);

  const toggleSelection = (id) => {
    setSelectedItems(prev => prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]);
  };

  const handleSelectAll = () => {
    const allIds = comments.map(c => c.zernio_comment_id || c.id).filter(Boolean);
    if (selectedItems.length === allIds.length && allIds.length > 0) {
      setSelectedItems([]);
    } else {
      setSelectedItems(allIds);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedItems.length === 0) return;
    Alert.alert(
      "Yorumları Sil",
      `Seçilen ${selectedItems.length} yorum tamamen silinecektir. Emin misiniz?`,
      [
        { text: "İptal", style: "cancel" },
        { 
          text: "Sil", 
          style: "destructive",
          onPress: async () => {
            const uuids = selectedItems.filter(id => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id));
            const zernioIds = selectedItems.filter(id => !uuids.includes(id));
            
            const { data: globalLogs } = await supabase.from('ai_communication_logs')
              .select('sender_id')
              .eq('platform', 'zernio_deleted_comment');
            const globallyDeletedIds = globalLogs ? globalLogs.map(l => l.sender_id) : [];

            const allDeletedIds = [
              ...Array.from(deletedIdsRef.current),
              ...selectedItems,
              ...selectedItems.map(id => {
                const c = comments.find(cm => cm.id === id);
                return c?.zernio_comment_id;
              }).filter(Boolean),
              ...globallyDeletedIds
            ];
            const uniqueIds = [...new Set(allDeletedIds)];

            uniqueIds.forEach(id => deletedIdsRef.current.add(id));

            try {
              const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
              const raw = await AsyncStorage.getItem('deleted_comments');
              const existing = raw ? JSON.parse(raw) : [];
              const now = Date.now();
              const normalized = existing
                .map(d => typeof d === 'string' ? { id: d, deletedAt: 0 } : d)
                .filter(d => (now - d.deletedAt) < THIRTY_DAYS);
              const newItems = uniqueIds.map(id => ({ id, deletedAt: now }));
              const seen = new Set();
              const deduped = [...normalized, ...newItems].filter(d => {
                if (seen.has(d.id)) return false;
                seen.add(d.id);
                return true;
              });
              await AsyncStorage.setItem('deleted_comments', JSON.stringify(deduped));
            } catch (_) {}

            if (uuids.length > 0) await supabase.from('comments').delete().in('id', uuids);
            if (zernioIds.length > 0) {
              await supabase.from('comments').delete().in('zernio_comment_id', zernioIds);
              const { data: { session } } = await supabase.auth.getSession();
              await supabase.from('ai_communication_logs').insert(
                zernioIds.map(id => ({
                  platform: 'zernio_deleted_comment',
                  sender_id: id,
                  user_message: '[DELETED]',
                  merchant_id: session?.user?.id
                }))
              );
            }
            
            setComments(prev => prev.filter(c => !uniqueIds.includes(c.id) && !uniqueIds.includes(c.zernio_comment_id)));
            setIsSelectionMode(false);
            setSelectedItems([]);
          }
        }
      ]
    );
  };

  // Deterministik ID — Math.random() yerine kararlı hash
  // FlatList key tutarlılığını garantiler, her render'da yeniden mount olmaz
  const makeStableId = (c) => {
    if (c.id || c._id) return String(c.id || c._id);
    const str = `${c.post?.id || ''}|${c.from?.username || c.username || ''}|${c.createdTime || c.createdAt || ''}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = Math.imul(31, hash) + str.charCodeAt(i) | 0;
    }
    return `gen_${Math.abs(hash)}`;
  };

  const fetchComments = async () => {
    const CACHE_KEY = 'zernio_pic_cache';
    const DELETED_KEY = 'deleted_comments';
    const CACHE_TTL_MS = 6 * 24 * 60 * 60 * 1000;  // 6 gün
    const THIRTY_DAYS  = 30 * 24 * 60 * 60 * 1000;

    // ── FAZ 0: Global Silinenleri Çek ──
    try {
      const { data: globalLogs } = await supabase.from('ai_communication_logs')
        .select('sender_id')
        .eq('platform', 'zernio_deleted_comment');
      if (globalLogs) {
        globalLogs.forEach(l => deletedIdsRef.current.add(l.sender_id));
      }
    } catch (_) {}

    // ── FAZ 1: Yerel DB'yi anında göster ──
    let cachedPics = {};
    try {
      const raw = await AsyncStorage.getItem(CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.entries && parsed.cachedAt) {
          // Yeni TTL formatı: { entries, cachedAt }
          if (Date.now() - parsed.cachedAt < CACHE_TTL_MS) cachedPics = parsed.entries;
          // else: süresi dolmuş, boş bırak (yeniden çekilecek)
        } else {
          cachedPics = parsed; // Eski format: geriye dönük uyumluluk
        }
      }
    } catch (_) {}

    try {
      const { data: localData } = await supabase
        .from('comments')
        .select('*')
        .order('created_at', { ascending: false });

      let localComments = (localData || []).map(c => ({
        ...c,
        _pictureUrl: (c.zernio_post_id && cachedPics['post_' + c.zernio_post_id])
          || (c.zernio_comment_id && cachedPics[c.zernio_comment_id])
          || null,
      }));

      // Silinmiş yorumları filtrele
      localComments = localComments.filter(
        c => !deletedIdsRef.current.has(c.id) && !deletedIdsRef.current.has(c.zernio_comment_id)
      );

      setComments(prev => {
        if (!prev || prev.length === 0) return localComments;
        
        // Zernio'dan (Faz 2) gelmiş olan ancak henüz yerel veritabanında olmayan yorumları koru
        const map = new Map();
        prev.forEach(c => map.set(c.zernio_comment_id || c.id, c));
        localComments.forEach(c => map.set(c.zernio_comment_id || c.id, c));
        
        const merged = Array.from(map.values());
        // Tarihe göre yeniden sırala
        merged.sort((a, b) => new Date(b.created_at || b.createdAt || b.createdTime || 0).getTime() - new Date(a.created_at || a.createdAt || a.createdTime || 0).getTime());
        return merged;
      });
      
      setLoading(false);
    } catch (e) {
      setLoading(false);
    }

    // ── FAZ 1.5: Sadece resimleri hızlıca çek (~2sn, tek API çağrısı) ──
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const invokeWithTimeout = (funcName, body, ms = 10000) => {
        return Promise.race([
          supabase.functions.invoke(funcName, body),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms))
        ]);
      };

      const picResObj = await invokeWithTimeout('zernio-client', {
        body: { action: 'get-inbox-pictures', payload: { userId: session.user.id } }
      }, 5000);
      const picRes = picResObj.data;


      const newPictures = picRes?.data?.pictures || picRes?.pictures || {};
      if (Object.keys(newPictures).length > 0) {
        const newCache = { ...cachedPics };
        Object.entries(newPictures).forEach(([postId, url]) => {
          newCache['post_' + postId] = url;
        });
        cachedPics = newCache;
        try {
          // TTL'li format ile kaydet
          await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ entries: newCache, cachedAt: Date.now() }));
        } catch (_) {}

        setComments(prev => prev.map(c => {
          if (c._pictureUrl) return c;
          const pic = (c.zernio_post_id && newCache['post_' + c.zernio_post_id]) || null;
          return pic ? { ...c, _pictureUrl: pic } : c;
        }));
      }
    } catch (e) {
      console.log('Picture fetch error:', e);
    }

    // ── FAZ 2: Arka planda tam sync (yeni yorumlar için) ──
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const invokeWithTimeout = (funcName, body, ms = 15000) => {
        return Promise.race([
          supabase.functions.invoke(funcName, body),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms))
        ]);
      };

      const zernioResObj = await invokeWithTimeout('zernio-client', {
        body: { action: 'sync-comments', payload: { userId: session.user.id } }
      }, 15000);
      const zernioRes = zernioResObj.data;

      const rawComments = zernioRes?.data?.comments || zernioRes?.comments || [];
      if (rawComments.length === 0) return;

      // Güncel resim önbelleğini oluştur
      const extraCache = { ...cachedPics };
      rawComments.forEach(c => {
        const cid = c.id || c._id;
        const pic = c.post?.picture || null;
        if (cid && pic) extraCache[cid] = pic;
        if (c.post?.id && pic) extraCache['post_' + c.post.id] = pic;
      });
      try {
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ entries: extraCache, cachedAt: Date.now() }));
      } catch (_) {}

      const liveComments = rawComments.map(c => {
        const pic = c.post?.picture
          || extraCache[c.id || c._id]
          || extraCache['post_' + c.post?.id]
          || null;
        return {
          id: makeStableId(c),
          content: c.message || c.content || c.text || '',
          author_name: c.from?.name || c.from?.username || c.username || c.author?.name || 'Kullanıcı',
          created_at: c.createdTime || c.createdAt || c.timestamp || new Date().toISOString(),
          zernio_comment_id: c.id || c._id,
          zernio_post_id: c.post?.id,
          username: c.from?.username || c.from?.name || c.username || c.author?.name || 'user',
          platform: c.post?.platform || c.platform || 'facebook',
          _pictureUrl: pic,
          posts: {
            id: c.post?.id,
            accountId: c.post?.accountId,
            title: c.post?.content ? c.post.content.substring(0, 50) + '...' : 'Sosyal Medya Gönderisi',
            media_urls: pic ? [pic] : []
          }
        };
      });

      // Silinmiş yorumları Phase 2'den de filtrele — senkron ref kullan
      // Race condition yok: handleDeleteSelected ref'i await öncesinde güncelledi
      const filteredLive = liveComments.filter(
        c => !deletedIdsRef.current.has(c.id) && !deletedIdsRef.current.has(c.zernio_comment_id)
      );

      setComments(prev => {
        const liveIds = new Set(filteredLive.map(c => c.zernio_comment_id).filter(Boolean));
        const localOnly = prev.filter(c => {
          // Zernio'dan canlı gelen veri ile üst üste gelmesin
          if (c.zernio_comment_id && liveIds.has(c.zernio_comment_id)) return false;
          // Kullanıcının sildiği yorumlar geri gelmesin (temel düzeltme)
          if (deletedIdsRef.current.has(c.id) || deletedIdsRef.current.has(c.zernio_comment_id)) return false;
          return true;
        });
        return [...filteredLive, ...localOnly]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      });
    } catch (e) {
      console.log('Background sync error:', e);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchComments().finally(() => setRefreshing(false));
  };
  useEffect(() => {
    // fetchComments, deletedIdsRef dolduğunda başlar (soğuk başlangıç güvenliği)
    // AsyncStorage okumadan önce fetchComments başlarsa silinen yorumlar görünür
    // .finally() sayesinde AsyncStorage hatası olsa bile fetchComments çalışır
    AsyncStorage.getItem('deleted_comments')
      .then(raw => {
        if (!raw) return;
        try {
          const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
          const now = Date.now();
          JSON.parse(raw).forEach(d => {
            const id = typeof d === 'string' ? d : d.id;
            const age = typeof d === 'object' ? (now - d.deletedAt) : Infinity;
            if (age < THIRTY_DAYS) deletedIdsRef.current.add(id);
          });
        } catch (_) {}
      })
      .catch(() => {})
      .finally(() => {
        fetchComments();
      });
    
    const channel = supabase
      .channel('realtime_comments')
      // Yeni yorum geldi → tam yenileme (resimler dahil)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments' }, () => {
        fetchComments();
      })
      // Satır güncellendi (ai_status, media_urls vb.) → sadece o satırı güncelle
      // fetchComments() çağrılmaz → döngü riski yok
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'comments' }, (payload) => {
        const updated = payload.new;
        setComments(prev => prev.map(c => {
          const match = c.id === updated.id || c.zernio_comment_id === updated.zernio_comment_id;
          if (!match) return c;
          return { ...c, ...updated, _pictureUrl: c._pictureUrl }; // Mevcut resmi koru
        }));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const listener = DeviceEventEmitter.addListener('REFRESH_INBOX', onRefresh);
    return () => {
      listener.remove();
    };
  }, []);

  if (loading) return <ActivityIndicator color="#bc13fe" style={{ marginTop: 20 }} />;

  return (
    <View style={styles.tabContainer}>
      {isSelectionMode && (
        <View className="flex-row justify-between items-center bg-[#ff0050]/10 px-5 py-3 border-b border-[#ff0050]/30 z-10">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => { setIsSelectionMode(false); setSelectedItems([]); }} className="mr-4">
              <Ionicons name="close" size={24} color="#e5e2e3" />
            </TouchableOpacity>
            <Text className="text-[#e5e2e3] font-bold text-[14px]">{selectedItems.length} Seçildi</Text>
          </View>
          <View className="flex-row items-center">
            <TouchableOpacity onPress={handleSelectAll} className="mr-3 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
              <Text className="text-white text-[12px] font-bold">Tümünü Seç</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={handleDeleteSelected} 
            disabled={selectedItems.length === 0}
            className={`flex-row items-center px-4 py-2 rounded-lg border ${selectedItems.length > 0 ? 'bg-[#ff0050]/20 border-[#ff0050]/40' : 'bg-white/5 border-white/10'}`}
          >
            <Feather name="trash-2" size={14} color={selectedItems.length > 0 ? "#ff0050" : "#849495"} />
            <Text className={`ml-2 text-[12px] font-bold ${selectedItems.length > 0 ? 'text-[#ff0050]' : 'text-[#849495]'}`}>Sil</Text>
          </TouchableOpacity>
          </View>
        </View>
      )}

      <FlatList 
        data={comments}
        keyExtractor={item => item.id}
        contentContainerStyle={[
          { padding: 20, paddingBottom: 160 },
          comments.length === 0 && { flex: 1, justifyContent: 'center' } // Center empty state
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#bc13fe"
            colors={["#bc13fe"]}
            progressBackgroundColor="#131314"
          />
        }
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center p-5">
            <Ionicons name="chatbubble-ellipses-outline" size={48} color="#849495" />
            <Text className="text-[#849495] mt-4 text-center">{t('sosyalMedya.inbox.noComments')}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => {
              if (isSelectionMode) toggleSelection(item.id);
            }}
          >
            <GlassCard style={{ padding: 12, marginBottom: 12, borderRadius: 12, flexDirection: 'row', borderWidth: isSelectionMode && selectedItems.includes(item.id) ? 1 : 0, borderColor: isSelectionMode && selectedItems.includes(item.id) ? '#bc13fe' : 'transparent' }}>
              
              {isSelectionMode && (
                <View className={`w-6 h-6 rounded-full border mr-3 items-center justify-center self-center ${selectedItems.includes(item.id) ? 'bg-[#bc13fe] border-[#bc13fe]' : 'border-white/30'}`}>
                  {selectedItems.includes(item.id) && <Ionicons name="checkmark" size={16} color="#fff" />}
                </View>
              )}

              {item._pictureUrl || item.posts?.media_urls?.[0] ? (
                <Image source={{ uri: item._pictureUrl || item.posts.media_urls[0] }} className="w-16 h-16 rounded-lg mr-3 bg-[#131314]" />
              ) : (
                <View className="w-16 h-16 rounded-lg mr-3 bg-[#131314] items-center justify-center border border-white/5">
                  <Ionicons name="image-outline" size={20} color="#849495" />
                </View>
              )}
              <View className="flex-1 justify-between">
                <View className="flex-row justify-between items-center mb-1">
                  <View className="flex-row items-center flex-1 pr-2">
                    <Ionicons name={`logo-${item.platform}`} size={14} color={item.platform === 'instagram' ? '#ebb2ff' : '#00f0ff'} style={{ marginRight: 4 }} />
                    <Text className="text-[#00f0ff] font-bold text-[12px]" numberOfLines={1} ellipsizeMode="tail">@{item.username}</Text>
                  </View>
                  <Text className="text-[#849495] text-[10px]">
                    {new Date(item.created_at).toLocaleDateString('tr-TR')}
                  </Text>
                </View>
                <Text className="text-[#e5e2e3] text-[11px] mb-2" numberOfLines={2} ellipsizeMode="tail">{item.content || item.title || ''}</Text>
                
                <View className="flex-row items-center justify-between" pointerEvents={isSelectionMode ? "none" : "auto"}>
                  <View className="flex-row items-center">
                    <View className="flex-row items-center mr-3">
                      <Ionicons name="chatbubble-ellipses" size={12} color="#bc13fe" style={{ marginRight: 4 }} />
                      <Text className="text-[#bc13fe] text-[10px] font-bold">{t('sosyalMedya.inbox.details')}</Text>
                    </View>
                  </View>
                  
                  <View className="flex-row items-center">
                    {!isSelectionMode && (
                      <TouchableOpacity 
                        onPress={() => { setIsSelectionMode(true); toggleSelection(item.id); }} 
                        className="mr-2 px-2 py-1 bg-red-500/10 rounded border border-red-500/30 flex-row items-center"
                      >
                        <Feather name="trash-2" size={12} color="#ff0050" />
                      </TouchableOpacity>
                    )}
                    
                    <CustomButton 
                      onPress={() => navigation.navigate('PostCommentsScreen', { post: item.posts, commentFocus: item })}
                      className="px-2 py-1 rounded border border-[#bc13fe]/30 bg-[#bc13fe]/20"
                      textClassName="text-[#bc13fe] text-[9px] font-bold"
                      title={t('sosyalMedya.inbox.viewComments')}
                    />
                  </View>
                </View>
              </View>
            </GlassCard>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const DegerlendirmelerTab = () => {
  const { t } = useTranslation();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setReviews(data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      fetchReviews();
    }, 0);
    
    const channel = supabase
      .channel('realtime_reviews')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, () => {
        fetchReviews();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const listener = DeviceEventEmitter.addListener('REFRESH_INBOX', fetchReviews);
    return () => {
      listener.remove();
    };
  }, []);

  if (loading) return <ActivityIndicator color="#00f0ff" style={{ marginTop: 20 }} />;

  return (
    <View style={styles.tabContainer}>
      {reviews.length === 0 ? (
        <View className="flex-1 items-center justify-center p-5">
          <Ionicons name="star-outline" size={48} color="#849495" />
          <Text className="text-[#849495] mt-4 text-center">{t('sosyalMedya.inbox.noReviews')}</Text>
        </View>
      ) : (
        <FlatList 
          data={reviews}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          renderItem={({ item }) => (
            <GlassCard style={{ padding: 16, marginBottom: 12, borderRadius: 12 }}>
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-[#e5e2e3] font-bold text-[14px]" numberOfLines={1} ellipsizeMode="tail">{item.reviewer_name}</Text>
                <Text className="text-[#849495] text-[10px]">
                  {new Date(item.created_at).toLocaleDateString('tr-TR')}
                </Text>
              </View>
              <View className="flex-row mb-2">
                {[1,2,3,4,5].map(star => (
                  <Ionicons 
                    key={star} 
                    name={star <= item.rating ? "star" : "star-outline"} 
                    size={14} 
                    color={star <= item.rating ? "#00f0ff" : "#849495"} 
                    style={{ marginRight: 2 }}
                  />
                ))}
              </View>
              <Text className="text-[#b9cacb] text-[12px] leading-5" numberOfLines={4} ellipsizeMode="tail">{item.content}</Text>
            </GlassCard>
          )}
        />
      )}
    </View>
  );
};

// MAIN SCREEN
export default function InboxScreen({ navigation }) {
  const { t } = useTranslation();
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
        level={3} 
        module="sosyal" 
        title={t('sosyalMedya.ui.inbox')} 
        actions={[
          { icon: 'sync', onPress: () => DeviceEventEmitter.emit('REFRESH_INBOX') }
        ]} 
      />

      <Tab.Navigator
        screenOptions={{
          sceneStyle: { backgroundColor: 'transparent' },
          tabBarStyle: { backgroundColor: 'transparent', elevation: 0, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
          tabBarActiveTintColor: '#00f0ff',
          tabBarInactiveTintColor: '#849495',
          tabBarIndicatorStyle: { backgroundColor: '#00f0ff', height: 3, borderRadius: 3 },
          tabBarLabelStyle: { fontSize: 11, fontWeight: 'bold', textTransform: 'none' },
        }}
      >
        <Tab.Screen name="Mesajlar" component={MesajlarTab} options={{ tabBarLabel: t('sosyalMedya.inbox.tabs.messages') }} />
        <Tab.Screen name="Yorumlar" component={YorumlarTab} options={{ tabBarLabel: t('sosyalMedya.inbox.tabs.comments') }} />
        <Tab.Screen name="Değerlendirmeler" component={DegerlendirmelerTab} options={{ tabBarLabel: t('sosyalMedya.inbox.tabs.reviews') }} />
      </Tab.Navigator>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  }
});
