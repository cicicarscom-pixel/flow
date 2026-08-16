import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  FlatList, 
  ImageBackground, 
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal,
  TouchableWithoutFeedback,
  Pressable,
  Alert
} from 'react-native';
import { Ionicons, MaterialIcons, Feather, AntDesign } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase , GlobalAppBar } from '../shared';


export default function PostCommentsScreen({ route, navigation }) {
  const { post, commentFocus } = route.params || {};
  const insets = useSafeAreaInsets();
  
  const [comments, setComments] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  
  // Selection State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  
  // Private Reply Modal State
  const [privateReplyModalVisible, setPrivateReplyModalVisible] = useState(false);
  const [selectedCommentForDM, setSelectedCommentForDM] = useState(null);
  const [privateMessageText, setPrivateMessageText] = useState('');
  
  const inputRef = useRef(null);

  const fetchComments = async (targetId) => {
    try {
      // 1. Local fetch
      let localData = [];
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId);
      
      if (isUuid) {
        const { data } = await supabase.from('comments').select('*').eq('post_id', targetId).order('created_at', { ascending: false });
        localData = data || [];
      } else {
        const { data } = await supabase.from('comments').select('*').eq('zernio_post_id', targetId).order('created_at', { ascending: false });
        localData = data || [];
      }
      
      let allComments = localData;

      // 2. Live fetch
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const accId = post?.accountId || commentFocus?.posts?.accountId;
        const zernioPostId = post?.zernio_post_id || (isUuid ? commentFocus?.zernio_post_id : targetId);
        
        if (session && zernioPostId) {
          const { data: zernioRes } = await supabase.functions.invoke('zernio-client', {
            body: { 
               action: 'sync-post-comments', 
               payload: { userId: session.user.id, postId: zernioPostId, accountId: accId } 
            }
          });
          const rawComments = zernioRes?.data?.comments || zernioRes?.comments || [];
          if (rawComments.length > 0) {
            const liveComments = rawComments.map(c => ({
              id: c.id || Math.random().toString(),
              content: c.message || '',
              username: c.from?.username || c.from?.name || 'Kullanıcı',
              created_at: c.createdTime || new Date().toISOString(),
              zernio_comment_id: c.id || c._id,
              liked: false, // Default state
              hidden: false,
            }));
            
            // Merge
            const localZernioIds = allComments.map(c => c.zernio_comment_id).filter(Boolean);
            const newLiveComments = liveComments.filter(c => !localZernioIds.includes(c.zernio_comment_id));
            allComments = [...newLiveComments, ...allComments].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          }
        }
      } catch (e) {
        console.log("Live post comments fetch error:", e);
      }

      // Filter out logically deleted comments
      try {
        const deletedStr = await AsyncStorage.getItem('deleted_comments');
        if (deletedStr) {
          const deletedIds = JSON.parse(deletedStr);
          allComments = allComments.filter(c => !deletedIds.includes(c.id) && !deletedIds.includes(c.zernio_comment_id));
        }
      } catch (e) {
        console.log("Error reading deleted_comments", e);
      }

      setComments(allComments);
    } catch (e) {
      console.log("Comments sync error:", e);
    }
  };

  useEffect(() => {
    const targetPostId = post?.id || post?.zernio_post_id || commentFocus?.post_id || commentFocus?.zernio_post_id;
    if (!targetPostId) return;

    setTimeout(() => {
      fetchComments(targetPostId);
    }, 0);

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetPostId);
    const filterCol = isUuid ? 'post_id' : 'zernio_post_id';

    const channel = supabase
      .channel(`realtime_comments_${targetPostId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments', filter: `${filterCol}=eq.${targetPostId}` }, () => {
        fetchComments(targetPostId);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [post?.id, commentFocus?.post_id]);

  const toggleLike = (commentId) => {
    setComments(prev => prev.map(c => 
      c.id === commentId ? { ...c, liked: !c.liked } : c
    ));
    // TODO: Zernio POST/DELETE /v1/inbox/comments/{postId}/{commentId}/like
  };

  const toggleHide = (commentId) => {
    setComments(prev => prev.map(c => 
      c.id === commentId ? { ...c, hidden: !c.hidden } : c
    ));
    // TODO: Zernio POST/DELETE /v1/inbox/comments/{postId}/{commentId}/hide
  };

  const threadedComments = React.useMemo(() => {
    const roots = [];
    const replies = [];
    
    comments.forEach(c => {
       const copy = { ...c, replies: [] };
       const isReply = copy.content?.startsWith('↳ @') || copy.content?.startsWith('@') || copy.parent_id;
       if (isReply) replies.push(copy);
       else roots.push(copy);
    });
    
    replies.forEach(reply => {
       const match = reply.content?.match(/^↳?\s*@([^:]+):/);
       const targetUsername = match ? match[1].trim() : null;
       
       let parent = null;
       if (reply.parent_id) {
          parent = roots.find(r => r.zernio_comment_id === reply.parent_id || r.id === reply.parent_id);
       } else if (targetUsername) {
          parent = roots.find(r => r.username === targetUsername);
       }
       
       if (parent) {
          if (!parent.replies) parent.replies = [];
          parent.replies.push(reply);
       } else {
          roots.push(reply);
       }
    });
    
    roots.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    roots.forEach(r => {
       if (r.replies) r.replies.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    });
    
    return roots;
  }, [comments]);

  const handleDeleteComment = (commentId) => {
    Alert.alert(
      "Yorumu Sil",
      "Bu yorum yerel veritabanınızdan tamamen silinecektir. Emin misiniz?",
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(commentId);
            let dbError = null;
            
            // AsyncStorage logic to prevent reappear
            try {
              const deletedStr = await AsyncStorage.getItem('deleted_comments');
              const deletedIds = deletedStr ? JSON.parse(deletedStr) : [];
              if (!deletedIds.includes(commentId)) deletedIds.push(commentId);
              await AsyncStorage.setItem('deleted_comments', JSON.stringify(deletedIds));
            } catch (e) {}
            
            if (isUuid) {
              const { error } = await supabase.from('comments').delete().eq('id', commentId);
              dbError = error;
            } else {
              const { error } = await supabase.from('comments').delete().eq('zernio_comment_id', commentId);
              dbError = error;
            }

            if (dbError && !dbError.message?.includes('invalid input syntax for type uuid')) {
              console.error("Yorum silme hatası:", dbError);
              alert("Yorum silinemedi.");
            } else {
              setComments(prev => prev.filter(c => c.id !== commentId));
            }
          }
        }
      ]
    );
  };

  const toggleSelection = (commentId) => {
    setSelectedItems(prev => 
      prev.includes(commentId) ? prev.filter(id => id !== commentId) : [...prev, commentId]
    );
  };

  const handleDeleteSelected = () => {
    if (selectedItems.length === 0) return;
    
    Alert.alert(
      "Yorumları Sil",
      `Seçilen ${selectedItems.length} yorum yerel veritabanınızdan tamamen silinecektir. Emin misiniz?`,
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            const uuids = selectedItems.filter(id => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id));
            const zernioIds = selectedItems.filter(id => !uuids.includes(id));
            
            // AsyncStorage logic
            try {
              const deletedStr = await AsyncStorage.getItem('deleted_comments');
              const deletedIds = deletedStr ? JSON.parse(deletedStr) : [];
              const newDeleted = [...new Set([...deletedIds, ...selectedItems])];
              await AsyncStorage.setItem('deleted_comments', JSON.stringify(newDeleted));
            } catch (e) {}

            let hasError = false;
            if (uuids.length > 0) {
              const { error } = await supabase.from('comments').delete().in('id', uuids);
              if (error) hasError = true;
            }
            if (zernioIds.length > 0) {
              const { error } = await supabase.from('comments').delete().in('zernio_comment_id', zernioIds);
              if (error) hasError = true;
            }

            if (hasError) {
              alert("Bazı yorumlar silinirken hata oluştu, ancak ekrandan gizlendi.");
            }
            
            setComments(prev => prev.filter(c => !selectedItems.includes(c.id)));
            setIsSelectionMode(false);
            setSelectedItems([]);
          }
        }
      ]
    );
  };

  const initiatePublicReply = (comment) => {
    setReplyingTo(comment);
    inputRef.current?.focus();
  };

  const initiatePrivateReply = (comment) => {
    setSelectedCommentForDM(comment);
    setPrivateMessageText('');
    setPrivateReplyModalVisible(true);
  };

  const handleSendPublicReply = async () => {
    if (!replyText.trim()) return;
    
    const tempText = replyText.trim();
    const isReplyToComment = !!replyingTo;
    const replyUsername = replyingTo ? replyingTo.username : null;
    const targetCommentId = isReplyToComment ? replyingTo.zernio_comment_id : undefined;

    setReplyText('');
    setReplyingTo(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      let zernioCommentId = `mock_${Date.now()}`;
      
      if (session && post?.id && post?.accountId) {
        // Send to Zernio API first to guarantee delivery!
        const { data: zernioRes, error: zernioError } = await supabase.functions.invoke('zernio-client', {
          body: { 
             action: 'reply-comment', 
             payload: { 
                postId: post.zernio_post_id || post.id,
                accountId: post.accountId,
                message: tempText,
                commentId: targetCommentId
             } 
          }
        });
        
        if (zernioError || zernioRes?.error) {
           throw new Error(zernioError?.message || zernioRes?.error || "Zernio API failed");
        }
        
        if (zernioRes?.id) {
           zernioCommentId = zernioRes.id;
        } else if (zernioRes?.data?.id) {
           zernioCommentId = zernioRes.data.id;
        }
      }
      
      const localUsername = 'Mağaza (Ben)';
      const localContent = isReplyToComment ? `↳ @${replyUsername}:\n${tempText}` : tempText;

      // Optimistic UI Update (only if API succeeds)
      const newComment = {
        id: Math.random().toString(),
        post_id: post?.id,
        content: localContent,
        username: localUsername, 
        created_at: new Date().toISOString(),
        liked: false,
        hidden: false,
      };
      setComments(prev => [newComment, ...prev]);

      // Save to Supabase local table
      await supabase.from('comments').insert({
        post_id: post?.id,
        zernio_comment_id: zernioCommentId,
        zernio_post_id: post?.zernio_post_id || post?.id,
        content: localContent,
        username: localUsername,
        platform: post?.platform || 'unknown'
      });
    } catch (e) {
      console.log("Reply send error:", e);
      alert("Yanıt gönderilemedi. Lütfen tekrar deneyin.");
    }
  };

  const handleSendPrivateReply = () => {
    if (!privateMessageText.trim()) return;
    
    alert(`Private message sent to @${selectedCommentForDM?.username}`);
    setPrivateReplyModalVisible(false);
    setSelectedCommentForDM(null);
    setPrivateMessageText('');
    // TODO: Zernio POST /v1/inbox/comments/{postId}/{commentId}/private-reply
  };

  const renderComment = ({ item, isNested = false }) => {
    if (item.hidden) {
      return (
        <View key={item.id} className={`mb-4 bg-white/5 p-4 rounded-xl border border-white/10 flex-row justify-between items-center opacity-50 ${isNested ? 'ml-8' : ''}`}>
          <Text className="text-[#849495] text-[12px] italic">Bu yorum gizlendi.</Text>
          <TouchableOpacity onPress={() => toggleHide(item.id)} className="bg-white/10 px-3 py-1 rounded">
            <Text className="text-white text-[10px]">Göster (Unhide)</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View key={item.id}>
      <Pressable
        onLongPress={() => {
          if (!isSelectionMode) {
            setIsSelectionMode(true);
            toggleSelection(item.id);
          }
        }}
        onPress={() => {
          if (isSelectionMode) {
            toggleSelection(item.id);
          }
        }}
        delayLongPress={500}
      >
        {({ pressed }) => (
          <View className={`mb-4 p-4 rounded-xl border flex-row items-start ${isNested ? 'ml-8' : ''} ${selectedItems.includes(item.id) ? 'bg-[#bc13fe]/20 border-[#bc13fe]/40' : 'bg-white/5 border-white/10'} ${pressed && !isSelectionMode ? 'opacity-80' : ''}`}>
            {isSelectionMode && (
              <View className="mr-3 mt-1">
                <Ionicons 
                  name={selectedItems.includes(item.id) ? "checkmark-circle" : "ellipse-outline"} 
                  size={20} 
                  color={selectedItems.includes(item.id) ? "#bc13fe" : "#849495"} 
                />
              </View>
            )}
            <View className="flex-1" pointerEvents={isSelectionMode ? "none" : "auto"}>
            <View className="flex-row justify-between items-start mb-2">
              <View className="flex-row items-center flex-1 pr-2">
                <View className="w-8 h-8 rounded-full bg-white/10 items-center justify-center mr-2">
                  <Ionicons name="person" size={14} color="#00f0ff" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-bold text-[13px]" numberOfLines={1} ellipsizeMode="tail">{item.username}</Text>
                  <Text className="text-[#849495] text-[10px]">
                    {new Date(item.created_at).toLocaleDateString('tr-TR')}
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center space-x-3">
                <TouchableOpacity onPress={() => toggleLike(item.id)}>
                  <Ionicons name={item.liked ? "heart" : "heart-outline"} size={16} color={item.liked ? "#ff0050" : "#849495"} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => toggleHide(item.id)}>
                  <Feather name="eye-off" size={16} color="#849495" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteComment(item.id)} style={{ marginLeft: 12 }}>
                  <Feather name="trash-2" size={16} color="#ff0050" />
                </TouchableOpacity>
              </View>
            </View>
            
            <Text className="text-[#e5e2e3] text-[13px] leading-5 mb-3">{item.content}</Text>
            
            <View className="flex-row items-center justify-between border-t border-white/5 pt-2">
              <TouchableOpacity 
                onPress={() => initiatePublicReply(item)}
                className="flex-row items-center"
              >
                <Feather name="message-circle" size={14} color="#bc13fe" style={{ marginRight: 4 }} />
                <Text className="text-[#bc13fe] text-[11px] font-bold">Yanıtla</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => initiatePrivateReply(item)}
                className="flex-row items-center bg-[#00f0ff]/10 px-2 py-1 rounded border border-[#00f0ff]/30"
              >
                <Ionicons name="mail" size={12} color="#00f0ff" style={{ marginRight: 4 }} />
                <Text className="text-[#00f0ff] text-[10px] font-bold">DM Gönder</Text>
              </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </Pressable>
      {item.replies?.length > 0 && (
        <View>
          {item.replies.map(reply => renderComment({ item: reply, isNested: true }))}
        </View>
      )}
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0A0A0B]" edges={['top', 'left', 'right', 'bottom']}>
      <ImageBackground 
        source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDUpjAKmMNnHDAuGn7KDAmiX4BVuWBLEG-5a7fHFVu_x7Jxrfh8UzY6rM-oy3AiqN0b1h6_K5iobCNsv2B4iHnz_lPjQ6QXfGvJ4UZmCcQLcr6H8o6m3I1JVFmgqk7UubXZx96-wpkV8-ScZZBzzkpl4-_WMzeHLyFljEKugxDZQXZgdkjst86sxa7hU95rBimeOBSnqHbdwH9bj_yj1tbla3T_HPG2xI6XkgTpyJRiDhmg9Po0q7NWy9DKn3JnR0b5tcpUj4Vcxr3w' }}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      >
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(10, 10, 11, 0.95)' }]} />
      </ImageBackground>

      {/* App Bar */}
      <GlobalAppBar 
        level={3} 
        module="sosyal" 
        title="Yorumlar" 
        showProfile={false} 
      />

      {isSelectionMode && (
        <View className="flex-row justify-between items-center bg-[#ff0050]/10 px-5 py-4 border-b border-[#ff0050]/30">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => { setIsSelectionMode(false); setSelectedItems([]); }} className="mr-4">
              <Ionicons name="close" size={24} color="#e5e2e3" />
            </TouchableOpacity>
            <Text className="text-[#e5e2e3] font-bold text-[16px]">{selectedItems.length} Seçildi</Text>
          </View>
          <TouchableOpacity 
            onPress={handleDeleteSelected} 
            disabled={selectedItems.length === 0}
            className={`flex-row items-center px-4 py-2 rounded-lg border ${selectedItems.length > 0 ? 'bg-[#ff0050]/20 border-[#ff0050]/40' : 'bg-white/5 border-white/10'}`}
          >
            <Feather name="trash-2" size={16} color={selectedItems.length > 0 ? "#ff0050" : "#849495"} />
            <Text className={`ml-2 text-[14px] font-bold ${selectedItems.length > 0 ? 'text-[#ff0050]' : 'text-[#849495]'}`}>Sil</Text>
          </TouchableOpacity>
        </View>
      )}

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Post Summary Header */}
        {post && (
          <View className="px-4 py-4 bg-[#131314]/80 border-b border-white/10 flex-row items-center">
            {post.media_urls && post.media_urls[0] && (
              <Image source={{ uri: post.media_urls[0] }} className="w-12 h-12 rounded bg-white/10 mr-3" />
            )}
            <View className="flex-1">
              <Text className="text-[#849495] text-[12px]" numberOfLines={2} ellipsizeMode="tail">{post.content || post.title || 'İçerik yok'}</Text>
            </View>
          </View>
        )}

        <FlatList
          data={threadedComments}
          keyExtractor={item => item.id}
          renderItem={({ item }) => renderComment({ item })}
          contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        />

        {/* Public Reply Input Bar */}
        <View 
          className="px-4 pt-3 bg-[#0A0A0B]/90 border-t border-white/10"
          style={{ paddingBottom: Math.max(insets.bottom, 12) }}
        >
          {replyingTo && (
            <View className="flex-row justify-between items-center mb-2 bg-white/5 px-3 py-1.5 rounded-lg border border-[#bc13fe]/30">
              <Text className="text-[#bc13fe] text-[11px]">@{replyingTo.username} kişisine yanıt veriliyor</Text>
              <TouchableOpacity onPress={() => setReplyingTo(null)}>
                <Ionicons name="close-circle" size={16} color="#849495" />
              </TouchableOpacity>
            </View>
          )}
          <View className="flex-row items-center">
            <View className="flex-1 bg-white/5 rounded-full px-4 py-2 border border-white/10 flex-row items-center">
              <TextInput
                ref={inputRef}
                className="flex-1 text-[#e5e2e3] text-[14px]"
                placeholder={replyingTo ? "Yanıtınızı yazın..." : "Gönderiye yorum ekle..."}
                placeholderTextColor="#849495"
                value={replyText}
                onChangeText={setReplyText}
              />
            </View>
            <TouchableOpacity 
              onPress={handleSendPublicReply}
              disabled={!replyText.trim()}
              className={`ml-3 w-10 h-10 rounded-full items-center justify-center ${replyText.trim() ? 'bg-[#bc13fe]' : 'bg-white/10'}`}
            >
              <Ionicons name="send" size={16} color={replyText.trim() ? "#fff" : "#849495"} style={{ marginLeft: 2 }} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Quick Private Reply Modal */}
      <Modal visible={privateReplyModalVisible} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setPrivateReplyModalVisible(false)}>
          <View className="flex-1 bg-black/60 justify-end">
            <TouchableWithoutFeedback>
              <View className="bg-[#131314] rounded-t-3xl border-t border-white/10 p-6 pb-10">
                <View className="flex-row justify-between items-center mb-4">
                  <View>
                    <Text className="text-white font-bold text-[18px]">Hızlı Yanıt (DM)</Text>
                    <Text className="text-[#849495] text-[12px] mt-1">@{selectedCommentForDM?.username} kullanıcısına gizli mesaj gönder</Text>
                  </View>
                  <TouchableOpacity onPress={() => setPrivateReplyModalVisible(false)} className="bg-white/10 p-2 rounded-full">
                    <Ionicons name="close" size={20} color="#e5e2e3" />
                  </TouchableOpacity>
                </View>

                <View className="bg-white/5 rounded-xl border border-white/10 p-4 mb-4">
                  <Text className="text-[#00f0ff] text-[11px] font-bold mb-2">YORUMU:</Text>
                  <Text className="text-[#e5e2e3] text-[13px] italic" numberOfLines={3} ellipsizeMode="tail">&quot;{selectedCommentForDM?.content}&quot;</Text>
                </View>

                <View className="bg-white/5 rounded-xl border border-[#00f0ff]/30 p-2 mb-6 min-h-[100px]">
                  <TextInput
                    className="text-white text-[15px] flex-1"
                    placeholder="Özel mesajınızı buraya yazın..."
                    placeholderTextColor="#849495"
                    multiline
                    textAlignVertical="top"
                    value={privateMessageText}
                    onChangeText={setPrivateMessageText}
                  />
                </View>

                <TouchableOpacity 
                  onPress={handleSendPrivateReply}
                  disabled={!privateMessageText.trim()}
                  className={`w-full py-4 rounded-xl items-center shadow-[0_0_15px_rgba(0,240,255,0.3)] ${privateMessageText.trim() ? 'bg-[#00f0ff]' : 'bg-[#00f0ff]/30'}`}
                >
                  <Text className={`font-bold text-[16px] ${privateMessageText.trim() ? 'text-[#0A0A0B]' : 'text-[#849495]'}`}>Gönder</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

    </SafeAreaView>
  );
}
