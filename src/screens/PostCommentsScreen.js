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
  Alert
} from 'react-native';
import { Ionicons, MaterialIcons, Feather, AntDesign } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase , GlobalAppBar } from '../shared';


export default function PostCommentsScreen({ route, navigation }) {
  const { post, commentFocus } = route.params || {};
  
  const [comments, setComments] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  
  // Private Reply Modal State
  const [privateReplyModalVisible, setPrivateReplyModalVisible] = useState(false);
  const [selectedCommentForDM, setSelectedCommentForDM] = useState(null);
  const [privateMessageText, setPrivateMessageText] = useState('');
  
  const inputRef = useRef(null);

  const fetchComments = async (postId) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && postId && post?.accountId) {
        const { data: zernioRes } = await supabase.functions.invoke('zernio-client', {
          body: { 
             action: 'sync-post-comments', 
             payload: { userId: session.user.id, postId, accountId: post.accountId } 
          }
        });
        if (zernioRes?.data?.comments) {
          const liveComments = zernioRes.data.comments.map(c => ({
            id: c.id || Math.random().toString(),
            content: c.message || '',
            username: c.from?.username || c.from?.name || 'Kullanıcı',
            created_at: c.createdTime || new Date().toISOString(),
            liked: false, // Default state
            hidden: false,
          }));
          setComments(liveComments);
          return;
        }
      }
    } catch (e) {
      console.log("Live post comments fetch error:", e);
    }

    // Fallback to local
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setComments(data);
    }
  };

  useEffect(() => {
    if (!post?.id && !commentFocus?.post_id) return;
    
    const targetPostId = post?.id || commentFocus?.post_id;

    setTimeout(() => {
      fetchComments(targetPostId);
    }, 0);

    const channel = supabase
      .channel(`realtime_comments_${targetPostId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments', filter: `post_id=eq.${targetPostId}` }, () => {
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

  const handleDeleteComment = (commentId) => {
    Alert.alert(
      "Sadece Bu Ekrandan Silinir",
      "Yorum orijinal platformdan silinmez, sadece AI-Esnaf ekranından kaldırılır. Emin misiniz?",
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase.from('comments').delete().eq('id', commentId);
            if (error) {
              console.error("Yorum silme hatası:", error);
              alert("Yorum silinemedi.");
            }
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

  const handleSendPublicReply = () => {
    if (!replyText.trim()) return;
    
    // Simulate sending reply to comment or post
    alert(`Public Reply sent ${replyingTo ? `to @${replyingTo.username}` : 'to post'}`);
    setReplyText('');
    setReplyingTo(null);
    // TODO: Zernio POST /v1/inbox/comments/{postId} (with commentId if reply)
  };

  const handleSendPrivateReply = () => {
    if (!privateMessageText.trim()) return;
    
    alert(`Private message sent to @${selectedCommentForDM?.username}`);
    setPrivateReplyModalVisible(false);
    setSelectedCommentForDM(null);
    setPrivateMessageText('');
    // TODO: Zernio POST /v1/inbox/comments/{postId}/{commentId}/private-reply
  };

  const renderComment = ({ item }) => {
    if (item.hidden) {
      return (
        <View className="mb-4 bg-white/5 p-4 rounded-xl border border-white/10 flex-row justify-between items-center opacity-50">
          <Text className="text-[#849495] text-[12px] italic">Bu yorum gizlendi.</Text>
          <TouchableOpacity onPress={() => toggleHide(item.id)} className="bg-white/10 px-3 py-1 rounded">
            <Text className="text-white text-[10px]">Göster (Unhide)</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View className="mb-4 bg-white/5 p-4 rounded-xl border border-white/10">
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
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0A0A0B]" edges={['top', 'left', 'right']}>
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
              <Text className="text-[#849495] text-[12px]" numberOfLines={2} ellipsizeMode="tail">{post.content || 'İçerik yok'}</Text>
            </View>
          </View>
        )}

        <FlatList
          data={comments}
          keyExtractor={item => item.id}
          renderItem={renderComment}
          contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        />

        {/* Public Reply Input Bar */}
        <View className="px-4 py-3 bg-[#0A0A0B]/90 border-t border-white/10">
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
