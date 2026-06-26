import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  FlatList, 
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Modal,
  TouchableWithoutFeedback,
  Alert
} from 'react-native';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase , ChatInputBar , GlobalAppBar } from '../../../../shared';



// Glassmorphism Bubble Component
const GlassBubble = ({ children, isOwn, style }) => (
  <View style={[
    styles.glassBubble, 
    isOwn ? styles.glassBubbleOwn : styles.glassBubbleOther,
    style
  ]}>
    {children}
  </View>
);

export default function ChatScreen({ route, navigation }) {
  const { t } = useTranslation();
  const { name = 'Ayşe Kaya', platform = 'instagram', accountId = 'acc_123', conversationId } = route.params || {};
  
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const flatListRef = useRef(null);

  const fetchMessages = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && conversationId && accountId) {
        const { data: zernioRes } = await supabase.functions.invoke('zernio-client', {
          body: { 
             action: 'sync-chat', 
             payload: { userId: session.user.id, conversationId, accountId } 
          }
        });
        if (zernioRes?.data?.messages) {
          const liveMessages = zernioRes.data.messages.map(m => ({
            id: m.id || Math.random().toString(),
            content: m.message || '',
            direction: m.from?.isOwner ? 'outgoing' : 'incoming',
            created_at: m.createdTime || new Date().toISOString(),
          }));
          setMessages(liveMessages); // Zernio returns newest first, keep it for inverted FlatList
          return;
        }
      }
    } catch (e) {
      console.log("Live chat fetch error:", e);
    }

    // Fallback to local
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setMessages(data);
    }
  };

  useEffect(() => {
    if (!conversationId) return;

    setTimeout(() => {
      fetchMessages();
    }, 0);

    const channel = supabase
      .channel(`chat_${conversationId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, () => {
        fetchMessages();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || !conversationId) return;
    
    const tempText = inputText.trim();
    setInputText('');

    // TODO: In production, call Supabase Edge Function 'zernio-client' to send via API.
    // For now, insert directly to DB so it shows up in UI via Realtime.
    const { data: userData } = await supabase.auth.getUser();
    
    // We assume there's a profile linked, but for demo we just insert if RLS allows, 
    // or if we temporarily disable RLS, or if the user is authenticated.
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      zernio_message_id: `mock_${Date.now()}`,
      direction: 'outgoing',
      content: tempText,
      // profile_id: userData?.user?.id 
    });
  };

  const handleDelete = () => {
    if (!selectedMessage) return;
    
    Alert.alert(
      t('sosyalMedya.alerts.deleteMessageOnlyLocal'),
      t('sosyalMedya.alerts.deleteMessageLocalConfirm'),
      [
        { text: t('sosyalMedya.alerts.cancel'), style: "cancel" },
        { 
          text: t('sosyalMedya.alerts.delete'), 
          style: "destructive",
          onPress: async () => {
            const messageId = selectedMessage.id;
            setSelectedMessage(null);
            
            const { error } = await supabase.from('messages').delete().eq('id', messageId);
            if (error) {
              console.error("Mesaj silme hatası:", error);
              alert(t('sosyalMedya.alerts.deleteMessageError'));
            }
          }
        }
      ]
    );
  };

  const handleReaction = (emoji) => {
    if (!selectedMessage) return;
    setMessages(prev => prev.map(m => {
      if (m.id === selectedMessage.id) {
        const hasReacted = m.reactions.includes(emoji);
        const newReactions = hasReacted 
          ? m.reactions.filter(r => r !== emoji) // Remove reaction
          : [...m.reactions, emoji]; // Add reaction
        return { ...m, reactions: newReactions };
      }
      return m;
    }));
    setSelectedMessage(null);
    // TODO: Zernio POST /v1/inbox/conversations/{conv}/messages/{msg}/reactions
  };

  const handleUploadMedia = () => {
    // TODO: Zernio POST /v1/media/upload-direct
    alert(t('sosyalMedya.alerts.uploadMediaSim'));
  };

  const handleUpdateStatus = () => {
    // TODO: Zernio PUT /v1/inbox/conversations/{conv}
    alert(t('sosyalMedya.alerts.archiveSim'));
  };

  const renderMessage = ({ item }) => {
    const isOwn = item.direction === 'outgoing';
    const msgTime = new Date(item.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

    return (
      <View style={[styles.messageRow, isOwn ? styles.messageRowOwn : styles.messageRowOther]}>
        <TouchableOpacity 
          onPress={() => setSelectedMessage(item)}
          onLongPress={() => setSelectedMessage(item)}
          delayLongPress={250}
          activeOpacity={0.7}
        >
          <GlassBubble isOwn={isOwn}>
            <Text className="text-[#e5e2e3] text-[14px] leading-5">{item.content}</Text>
            
            <View className="flex-row justify-end items-center mt-1">
              <Text className="text-white/50 text-[10px]">{msgTime}</Text>
              {isOwn && <Ionicons name="checkmark-done" size={12} color="#00f0ff" style={{ marginLeft: 4 }} />}
            </View>

            {item.reactions && item.reactions.length > 0 && (
              <View className={`absolute -bottom-3 ${isOwn ? '-left-2' : '-right-2'} bg-[#0A0A0B] rounded-full px-1.5 py-0.5 border border-white/10`}>
                <Text className="text-[10px]">{item.reactions.join(' ')}</Text>
              </View>
            )}
          </GlassBubble>
        </TouchableOpacity>
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
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(10, 10, 11, 0.90)' }]} />
      </ImageBackground>

      {/* App Bar */}
      <GlobalAppBar 
        level={3} 
        module="genel" 
        title={name} 
        showProfile={false} 
        actions={[{ icon: 'more-vert', onPress: handleUpdateStatus }]} 
      />

      {/* Chat Messages */}
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : (Platform.Version < 30 ? 'padding' : undefined)}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          inverted={true}
        />

        {/* Input Area */}
        <ChatInputBar 
          inputText={inputText}
          setInputText={setInputText}
          handleSend={handleSendMessage}
          placeholder={t('sosyalMedya.chat.typeMessage')}
          onAttachImage={handleUploadMedia}
          onAttachGallery={handleUploadMedia}
        />
      </KeyboardAvoidingView>

      {/* Message Context Menu Modal */}
      <Modal visible={!!selectedMessage} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setSelectedMessage(null)}>
          <View className="flex-1 bg-black/60 justify-center items-center px-6">
            <TouchableWithoutFeedback>
              <View className="w-full bg-[#131314] rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
                
                <View className="p-4 border-b border-white/5 flex-row justify-center space-x-6">
                  {['👍', '❤️', '🔥', '😂'].map(emoji => (
                    <TouchableOpacity 
                      key={emoji} 
                      onPress={() => handleReaction(emoji)}
                      className="w-12 h-12 bg-white/5 rounded-full items-center justify-center border border-white/10"
                    >
                      <Text className="text-xl">{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {selectedMessage?.isOwn && (
                  <TouchableOpacity 
                    className="p-4 border-b border-white/5 flex-row items-center"
                    onPress={() => {
                      setSelectedMessage(null);
                      // TODO: Edit message logic (only Telegram in API, but good to have stub)
                      alert(t('sosyalMedya.alerts.editMessageTelegramOnly'));
                    }}
                  >
                    <Feather name="edit-2" size={18} color="#00f0ff" style={{ marginRight: 12 }} />
                    <Text className="text-[#00f0ff] font-medium text-[16px]">{t('sosyalMedya.chat.edit')}</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity 
                  className="p-4 flex-row items-center bg-red-500/10"
                  onPress={handleDelete}
                >
                  <Feather name="trash-2" size={18} color="#ff0050" style={{ marginRight: 12 }} />
                  <Text className="text-[#ff0050] font-medium text-[16px]">{t('sosyalMedya.chat.delete')}</Text>
                </TouchableOpacity>

              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  messageRow: {
    flexDirection: 'row',
    marginBottom: 20,
    width: '100%',
  },
  messageRowOwn: {
    justifyContent: 'flex-end',
  },
  messageRowOther: {
    justifyContent: 'flex-start',
  },
  glassBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    backdropFilter: 'blur(10px)', // Note: backdropFilter doesn't work natively in RN, we use rgba backgrounds
  },
  glassBubbleOwn: {
    backgroundColor: 'rgba(188, 19, 254, 0.15)', // Magenta tint
    borderColor: 'rgba(188, 19, 254, 0.3)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 4,
  },
  glassBubbleOther: {
    backgroundColor: 'rgba(0, 240, 255, 0.1)', // Cyan tint
    borderColor: 'rgba(0, 240, 255, 0.2)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 20,
  }
});
