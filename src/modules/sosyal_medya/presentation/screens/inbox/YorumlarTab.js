import { useTranslation } from 'react-i18next';
import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../../../../../shared';
import { Alert, DeviceEventEmitter, ActivityIndicator, View, TouchableOpacity, Text, FlatList, RefreshControl, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles } from './inboxStyles';
import { Ionicons, Feather } from '@expo/vector-icons';
import { getPlatformIconName } from './inboxShared';

export const YorumlarTab = ({ navigation }) => {
  const { t } = useTranslation();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const [privateReplyingTo, setPrivateReplyingTo] = useState(null);
  const [privateReplyText, setPrivateReplyText] = useState('');
  const [sendingPrivateReply, setSendingPrivateReply] = useState(false);

  const handleHideComment = async (comment) => {
    try {
      deletedIdsRef.current.add(comment.id);
      if (comment.zernio_comment_id) deletedIdsRef.current.add(comment.zernio_comment_id);
      setComments(prev => prev.filter(c => c.id !== comment.id && c.zernio_comment_id !== comment.zernio_comment_id));
      await supabase.from('comments').update({ hidden: true }).eq('id', comment.id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDMClick = (item) => {
    if (privateReplyingTo === item.id) {
      setPrivateReplyingTo(null);
    } else {
      setPrivateReplyingTo(item.id);
      setPrivateReplyText('');
      if (replyingTo === item.id) setReplyingTo(null);
    }
  };

  const submitPrivateReply = async (parentComment) => {
    if (!privateReplyText.trim()) return;
    setSendingPrivateReply(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data: orgMember } = await supabase.from('organization_members').select('organization_id').eq('user_id', session?.user?.id).maybeSingle();
      const orgId = orgMember?.organization_id || session?.user?.id;

      const payload = {
        action: 'send-private-reply',
        payload: {
          userId: session?.user?.id,
          organizationId: orgId,
          accountId: parentComment.posts?.accountId || parentComment.accountId,
          postId: parentComment.zernio_post_id,
          commentId: parentComment.zernio_comment_id,
          platform: parentComment.platform,
          message: privateReplyText
        }
      };
      
      const res = await supabase.functions.invoke('zernio-client', { body: payload });
      if (res.error || res.data?.error) throw new Error(res.error?.message || res.data?.error);
      
      Alert.alert("Başarılı", "Özel mesaj (DM) başarıyla gönderildi.");
      
      setPrivateReplyText('');
      setPrivateReplyingTo(null);
    } catch (e) {
      console.error(e);
      Alert.alert("Hata", e.message || "Özel mesaj gönderilemedi.");
    } finally {
      setSendingPrivateReply(false);
    }
  };

  const submitReply = async (parentComment) => {
    if (!replyText.trim()) return;
    setSendingReply(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data: orgMember } = await supabase.from('organization_members').select('organization_id').eq('user_id', session?.user?.id).maybeSingle();
      const orgId = orgMember?.organization_id || session?.user?.id;

      const payload = {
        action: 'reply-comment',
        payload: {
          userId: session?.user?.id,
          organizationId: orgId,
          commentId: parentComment.zernio_comment_id || parentComment.id,
          platform: parentComment.platform,
          message: replyText
        }
      };
      
      const res = await supabase.functions.invoke('zernio-client', { body: payload });
      if (res.error || res.data?.error) throw new Error(res.error?.message || res.data?.error);
      
      const newReply = {
        id: 'temp_' + Date.now(),
        content: `@${parentComment.username} ${replyText}`,
        created_at: new Date().toISOString(),
        username: 'Mağaza (Ben)',
        platform: parentComment.platform,
        is_owner: true,
        is_business_reply: true,
        zernio_post_id: parentComment.zernio_post_id || parentComment.posts?.id,
        posts: parentComment.posts
      };
      
      setComments(prev => [newReply, ...prev]);
      
      setReplyText('');
      setReplyingTo(null);
    } catch (e) {
      console.error(e);
      Alert.alert("Hata", e.message || "Yanıt gönderilemedi.");
    } finally {
      setSendingReply(false);
    }
  };
  
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
              // İşletme kimliği (org_id) veritabanında DEFAULT current_org_id() ile çözülür; istemci göndermez.
              await supabase.from('ai_communication_logs').insert(
                zernioIds.map(id => ({
                  platform: 'zernio_deleted_comment',
                  sender_id: id,
                  user_message: '[DELETED]'
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
        .select('*, posts(*)')
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
    } catch {
      setLoading(false);
    }

    // ── FAZ 1.5: Sadece resimleri hızlıca çek (~2sn, tek API çağrısı) ──
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const { data: orgMember } = await supabase.from('organization_members').select('organization_id').eq('user_id', session.user.id).maybeSingle();
      const orgId = orgMember?.organization_id || session.user.id;

      const invokeWithTimeout = (funcName, body, ms = 10000) => {
        return Promise.race([
          supabase.functions.invoke(funcName, body),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms))
        ]);
      };

      const picResObj = await invokeWithTimeout('zernio-client', {
        body: { action: 'get-inbox-pictures', payload: { organizationId: orgId } }
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

      const { data: orgMember } = await supabase.from('organization_members').select('organization_id').eq('user_id', session.user.id).maybeSingle();
      const orgId = orgMember?.organization_id || session.user.id;

      const invokeWithTimeout = (funcName, body, ms = 15000) => {
        return Promise.race([
          supabase.functions.invoke(funcName, body),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms))
        ]);
      };

      const zernioResObj = await invokeWithTimeout('zernio-client', {
        body: { action: 'sync-comments', payload: { organizationId: orgId } }
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
            content: c.post?.content,
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
  const [connectedPlatforms, setConnectedPlatforms] = useState(new Set());

  useEffect(() => {
     const fetchConnectedPlatforms = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) return;
        const { data: orgMember } = await supabase.from('organization_members').select('organization_id').eq('user_id', session.user.id).maybeSingle();
        const orgId = orgMember?.organization_id || session.user.id;
        const { data } = await supabase
           .schema('integration')
           .from('social_accounts')
           .select('platform')
           .eq('organization_id', orgId)
           .eq('is_active', true)
           .eq('needs_reconnection', false);
        setConnectedPlatforms(new Set((data || []).map(r => r.platform?.toLowerCase())));
     };
     fetchConnectedPlatforms();
  }, []);

  const uniquePosts = React.useMemo(() => {
    const postsMap = new Map();
    comments
      .filter(c => connectedPlatforms.size === 0 || connectedPlatforms.has((c.platform || c.posts?.platform)?.toLowerCase()))
      .filter(c => c.posts?.status !== 'deleted')
      .forEach(c => {
      const pId = c.zernio_post_id || c.posts?.id;
      if (pId && !postsMap.has(pId)) {
        postsMap.set(pId, {
          id: pId,
          picture: c._pictureUrl || c.posts?.media_urls?.[0],
          platform: c.platform || c.posts?.platform || 'instagram',
          title: c.posts?.title || 'Gönderi',
          content: c.posts?.content || c.posts?.title || 'Sosyal Medya Gönderisi',
          postsObj: c.posts
        });
      }
    });
    return Array.from(postsMap.values());
  }, [comments, connectedPlatforms]);

  const [selectedPostId, setSelectedPostId] = useState(null);

  useEffect(() => {
    if (!selectedPostId && uniquePosts.length > 0) {
      setSelectedPostId(uniquePosts[0].id);
    } else if (selectedPostId && !uniquePosts.find(p => p.id === selectedPostId)) {
      if (uniquePosts.length > 0) setSelectedPostId(uniquePosts[0].id);
      else setSelectedPostId(null);
    }
  }, [uniquePosts, selectedPostId]);

  const displayedComments = React.useMemo(() => {
    if (!selectedPostId) return [];
    const postComments = comments.filter(c => (c.zernio_post_id || c.posts?.id) === selectedPostId);
    
    // Sort oldest first to group replies properly
    const sorted = [...postComments].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    const parents = [];
    
    sorted.forEach(c => {
      const isBusiness = c.is_owner || c.role === 'merchant' || c.username === 'Ben' || c.username === 'Sen' || c.is_business_reply;
      let matchedParent = null;
      
      if (isBusiness) {
        for (let i = parents.length - 1; i >= 0; i--) {
          const p = parents[i];
          if (c.content && p.username && c.content.includes(`@${p.username}`)) {
            matchedParent = p;
            break;
          }
        }
        if (!matchedParent && parents.length > 0) {
          matchedParent = parents[parents.length - 1];
        }
      }
      
      if (matchedParent && isBusiness) {
        if (!matchedParent.replies) matchedParent.replies = [];
        matchedParent.replies.push(c);
      } else {
        c.replies = [];
        parents.push(c);
      }
    });
    
    // Sort parents back to newest first
    return parents.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [comments, selectedPostId]);

  if (loading) return <ActivityIndicator color="#C2478D" style={{ marginTop: 20 }} />;

  return (
    <View style={styles.tabContainer}>
      {isSelectionMode && (
        <View className="flex-row justify-between items-center bg-[#EF4444]/10 px-5 py-3 border-b border-[#EF4444]/30 z-10">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => { setIsSelectionMode(false); setSelectedItems([]); }} className="mr-4">
              <Ionicons name="close" size={24} color="#F6F1EC" />
            </TouchableOpacity>
            <Text className="text-[#F6F1EC] font-bold text-[14px]">{selectedItems.length} {t('sosyalMedya.inbox.selected', 'Seçildi')}</Text>
          </View>
          <View className="flex-row items-center">
            <TouchableOpacity onPress={handleSelectAll} className="mr-3 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
              <Text className="text-white text-[12px] font-bold">{t('sosyalMedya.inbox.selectAll', 'Tümünü Seç')}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={handleDeleteSelected} 
            disabled={selectedItems.length === 0}
            className={`flex-row items-center px-4 py-2 rounded-lg border ${selectedItems.length > 0 ? 'bg-[#EF4444]/20 border-[#EF4444]/40' : 'bg-white/5 border-white/10'}`}
          >
            <Feather name="trash-2" size={14} color={selectedItems.length > 0 ? "#EF4444" : "#A79E96"} />
            <Text className={`ml-2 text-[12px] font-bold ${selectedItems.length > 0 ? 'text-[#EF4444]' : 'text-[#A79E96]'}`}>{t('sosyalMedya.inbox.delete', 'Sil')}</Text>
          </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Main Post List */}
      <FlatList
        data={uniquePosts}
        showsVerticalScrollIndicator={false}
        keyExtractor={item => item.id}
        contentContainerStyle={[
          { padding: 20, paddingBottom: 160 },
          uniquePosts.length === 0 && { flex: 1, justifyContent: 'center' }
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#C2478D"
            colors={["#C2478D"]}
            progressBackgroundColor="#201D24"
          />
        }
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center p-5">
            <Ionicons name="chatbubble-ellipses-outline" size={48} color="#A79E96" />
            <Text className="text-[#A79E96] mt-4 text-center">
              {t('sosyalMedya.inbox.noComments', 'Henüz yorum bulunmuyor.')}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const textContent = item.content || '';
          const snippet = textContent.match(/[^.!?]+[.!?]+/g) 
            ? textContent.match(/[^.!?]+[.!?]+/g).slice(0, 3).join(' ') 
            : textContent.substring(0, 100) + (textContent.length > 100 ? '...' : '');

          return (
            <TouchableOpacity 
              onPress={() => navigation.navigate('PostCommentsScreen', {
                post: item.postsObj || {
                  zernio_post_id: item.id,
                  content: item.content,
                  platform: item.platform,
                  media_urls: item.picture ? [item.picture] : []
                }
              })}
              activeOpacity={0.8}
              className="mb-4 p-4 rounded-xl border border-white/5 flex-row items-center bg-white/5"
            >
              <View className="relative">
                {item.picture ? (
                  <Image source={{ uri: item.picture }} className="w-16 h-16 rounded-lg bg-[#201D24]" />
                ) : (
                  <View className="w-16 h-16 rounded-lg bg-[#201D24] items-center justify-center border border-white/5">
                    <Ionicons name="image-outline" size={24} color="#A79E96" />
                  </View>
                )}
                <View className="absolute -bottom-1 -right-1 bg-[#17151A] rounded-full p-1 border border-white/10">
                  <Ionicons name={getPlatformIconName(item.platform)} size={12} color={item.platform === 'instagram' ? '#E8A8CD' : '#22B573'} />
                </View>
              </View>
              
              <View className="ml-4 flex-1 justify-center">
                <Text className="text-[#F6F1EC] text-[13px] leading-tight mb-1 font-semibold" numberOfLines={1}>
                  {item.title || 'Gönderi'}
                </Text>
                <Text className="text-[#A79E96] text-[11px] leading-tight" numberOfLines={2} ellipsizeMode="tail">
                  {snippet}
                </Text>
                <View className="flex-row items-center mt-2">
                  <Text className="text-[#C2478D] text-[10px] font-bold uppercase">{t('sosyalMedya.inbox.viewComments', 'Yorumları Gör')}</Text>
                  <Ionicons name="chevron-forward" size={10} color="#C2478D" style={{ marginLeft: 2 }} />
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
};
