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
  const { name = 'Ayşe Kaya', platform = 'instagram', accountId, conversationId, localConversationId } = route.params || {};
  
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [selectedMessage, setSelectedMessage] = useState(null);
  
  // Selection State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  
  const flatListRef = useRef(null);

  const fetchMessages = async () => {
    try {
      // 1. Local fetch
      const { data: localData, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', localConversationId || conversationId)
        .order('created_at', { ascending: false });
      
      let allMessages = localData || [];

      // 2. Live fetch
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && conversationId && accountId) {
          const { data: orgMember } = await supabase.from('organization_members').select('organization_id').eq('user_id', session.user.id).maybeSingle();
          const { data: zernioRes } = await supabase.functions.invoke('zernio-client', {
            body: { 
               action: 'sync-chat', 
               payload: { organizationId: orgMember?.organization_id || session.user.id, userId: session.user.id, conversationId, accountId } 
            }
          });
          if (zernioRes?.data?.messages && zernioRes.data.messages.length > 0) {
            const liveMessages = zernioRes.data.messages.map(m => ({
              id: m.id || Math.random().toString(),
              content: m.message || '',
              direction: m.from?.isOwner ? 'outgoing' : 'incoming',
              created_at: m.createdTime || new Date().toISOString(),
              zernio_message_id: m.id || m._id
            }));
            
            // Merge
            const localZernioIds = allMessages.map(m => m.zernio_message_id).filter(Boolean);
            const newLiveMessages = liveMessages.filter(m => !localZernioIds.includes(m.zernio_message_id));
            allMessages = [...newLiveMessages, ...allMessages].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          }
        }
      } catch (e) {
        console.log("Live chat fetch error:", e);
      }

      setMessages(allMessages);
    } catch (e) {
      console.log("Chat sync error:", e);
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

    // Optimistic Update
    const newMsg = {
      id: Math.random().toString(),
      conversation_id: localConversationId || conversationId,
      content: tempText,
      direction: 'outgoing',
      created_at: new Date().toISOString(),
      zernio_message_id: `mock_${Date.now()}`
    };
    setMessages(prev => [newMsg, ...prev]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      let zernioMsgId = newMsg.zernio_message_id;

      if (session && conversationId && accountId) {
        // Send to Zernio API
        const { data: zernioRes } = await supabase.functions.invoke('zernio-client', {
          body: { 
             action: 'send-message', 
             payload: { 
                conversationId: conversationId,
                accountId: accountId,
                message: tempText
             } 
          }
        });
        if (zernioRes?.data?.id) zernioMsgId = zernioRes.data.id;
      }

      // Save to Supabase local table
      await supabase.from('messages').insert({
        conversation_id: localConversationId || conversationId,
        zernio_message_id: zernioMsgId,
        direction: 'outgoing',
        content: tempText,
        // profile_id: session?.user?.id 
      });
    } catch (e) {
      console.log("Mesaj gönderme hatası:", e);
      alert("Mesaj Zernio'ya gönderilemedi, sadece yerel olarak eklendi.");
    }
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
            } else {
              setMessages(prev => prev.filter(m => m.id !== messageId));
            }
          }
        }
      ]
    );
  };

  const toggleSelection = (messageId) => {
    setSelectedItems(prev => 
      prev.includes(messageId) ? prev.filter(id => id !== messageId) : [...prev, messageId]
    );
  };

  const handleDeleteSelected = () => {
    if (selectedItems.length === 0) return;
    
    Alert.alert(
      t('sosyalMedya.chat.delete'), // Veya yeni bir metin "Mesajları Sil"
      `Seçilen ${selectedItems.length} mesaj yerel veritabanınızdan tamamen silinecektir. Emin misiniz?`,
      [
        { text: t('sosyalMedya.alerts.cancel'), style: "cancel" },
        { 
          text: t('sosyalMedya.alerts.delete'), 
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase.from('messages').delete().in('id', selectedItems);
            if (error) {
              console.error("Toplu mesaj silme hatası:", error);
              alert(t('sosyalMedya.alerts.deleteMessageError'));
            } else {
              setMessages(prev => prev.filter(m => !selectedItems.includes(m.id)));
              setIsSelectionMode(false);
              setSelectedItems([]);
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
        {isSelectionMode && (
          <TouchableOpacity 
            onPress={() => toggleSelection(item.id)}
            className="mr-3 self-center"
          >
            <Ionicons 
              name={selectedItems.includes(item.id) ? "checkmark-circle" : "ellipse-outline"} 
              size={24} 
              color={selectedItems.includes(item.id) ? "#C2478D" : "#A79E96"} 
            />
          </TouchableOpacity>
        )}
        <TouchableOpacity 
          onPress={() => {
            if (isSelectionMode) {
              toggleSelection(item.id);
            } else {
              setSelectedMessage(item);
            }
          }}
          onLongPress={() => {
            if (!isSelectionMode) {
              setIsSelectionMode(true);
              toggleSelection(item.id);
            }
          }}
          delayLongPress={500}
          activeOpacity={0.7}
          style={{ flexShrink: 1, flexDirection: 'row', ...(isSelectionMode ? { flex: 1 } : {}) }}
        >
          <GlassBubble isOwn={isOwn} style={selectedItems.includes(item.id) ? { borderColor: '#C2478D', borderWidth: 1 } : {}}>
            <Text className="text-[#F6F1EC] text-[14px] leading-5">{item.content}</Text>
            
            <View className="flex-row justify-end items-center mt-1">
              <Text className="text-white/50 text-[10px]">{msgTime}</Text>
              {isOwn && <Ionicons name="checkmark-done" size={12} color="#22B573" style={{ marginLeft: 4 }} />}
            </View>

            {item.reactions && item.reactions.length > 0 && (
              <View className={`absolute -bottom-3 ${isOwn ? '-left-2' : '-right-2'} bg-[#17151A] rounded-full px-1.5 py-0.5 border border-white/10`}>
                <Text className="text-[10px]">{item.reactions.join(' ')}</Text>
              </View>
            )}
          </GlassBubble>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#17151A]" edges={['top', 'left', 'right', 'bottom']}>
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

      {isSelectionMode && (
        <View className="flex-row justify-between items-center bg-[#EF4444]/10 px-5 py-4 border-b border-[#EF4444]/30 z-10">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => { setIsSelectionMode(false); setSelectedItems([]); }} className="mr-4">
              <Ionicons name="close" size={24} color="#F6F1EC" />
            </TouchableOpacity>
            <Text className="text-[#F6F1EC] font-bold text-[16px]">{selectedItems.length} Seçildi</Text>
          </View>
          <TouchableOpacity 
            onPress={handleDeleteSelected} 
            disabled={selectedItems.length === 0}
            className={`flex-row items-center px-4 py-2 rounded-lg border ${selectedItems.length > 0 ? 'bg-[#EF4444]/20 border-[#EF4444]/40' : 'bg-white/5 border-white/10'}`}
          >
            <Feather name="trash-2" size={16} color={selectedItems.length > 0 ? "#EF4444" : "#A79E96"} />
            <Text className={`ml-2 text-[14px] font-bold ${selectedItems.length > 0 ? 'text-[#EF4444]' : 'text-[#A79E96]'}`}>Sil</Text>
          </TouchableOpacity>
        </View>
      )}

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
          onAttachGallery={handleUploadMedia}
        />
      </KeyboardAvoidingView>

      {/* Message Context Menu Modal */}
      <Modal visible={!!selectedMessage} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setSelectedMessage(null)}>
          <View className="flex-1 bg-black/60 justify-center items-center px-6">
            <TouchableWithoutFeedback>
              <View className="w-full bg-[#201D24] rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
                
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
                    <Feather name="edit-2" size={18} color="#22B573" style={{ marginRight: 12 }} />
                    <Text className="text-[#22B573] font-medium text-[16px]">{t('sosyalMedya.chat.edit')}</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity 
                  className="p-4 flex-row items-center bg-red-500/10"
                  onPress={handleDelete}
                >
                  <Feather name="trash-2" size={18} color="#EF4444" style={{ marginRight: 12 }} />
                  <Text className="text-[#EF4444] font-medium text-[16px]">{t('sosyalMedya.chat.delete')}</Text>
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
    backgroundColor: 'rgba(194, 71, 141, 0.15)', // Magenta tint
    borderColor: 'rgba(194, 71, 141, 0.3)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 4,
  },
  glassBubbleOther: {
    backgroundColor: 'rgba(34, 181, 115, 0.1)', // Cyan tint
    borderColor: 'rgba(34, 181, 115, 0.2)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 20,
  }
});
