import { useTranslation } from 'react-i18next';
import React, { useState, useEffect } from 'react';
import { supabase, CustomButton } from '../../../../../shared';
import { DeviceEventEmitter, Alert, ActivityIndicator, View, TouchableOpacity, Text, FlatList } from 'react-native';
import { styles } from './inboxStyles';
import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';
import { GlassCard } from './inboxShared';

// TAB COMPONENTS
export const MesajlarTab = ({ navigation }) => {
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

  if (loading) return <ActivityIndicator color="#22B573" style={{ marginTop: 20 }} />;

  return (
    <View style={styles.tabContainer}>
      {isSelectionMode && (
        <View className="flex-row justify-between items-center bg-[#C2478D]/10 px-5 py-4 border-b border-[#C2478D]/30">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => { setIsSelectionMode(false); setSelectedItems([]); }} className="mr-4">
              <Ionicons name="close" size={24} color="#F6F1EC" />
            </TouchableOpacity>
            <Text className="text-[#F6F1EC] font-bold text-[16px]">{t('sosyalMedya.inbox.selectedCount', { count: selectedItems.length })}</Text>
          </View>
          <View className="flex-row items-center">
            <TouchableOpacity onPress={handleSelectAll} className="mr-4 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
              <Text className="text-white text-[14px] font-bold">{t('sosyalMedya.inbox.selectAll')}</Text>
            </TouchableOpacity>
            <CustomButton 
              onPress={handleDeleteSelected} 
            disabled={selectedItems.length === 0}
            className={`px-4 py-2 rounded-lg border ${selectedItems.length > 0 ? 'bg-[#EF4444]/20 border-[#EF4444]/40' : 'bg-white/5 border-white/10'}`}
            textClassName={`text-[14px] font-bold ${selectedItems.length > 0 ? 'text-[#EF4444]' : 'text-[#A79E96]'}`}
            title={t('sosyalMedya.inbox.delete')}
            leftIcon={<Feather name="trash-2" size={16} color={selectedItems.length > 0 ? "#EF4444" : "#A79E96"} />}
          />
          </View>
        </View>
      )}

      {conversations.length === 0 ? (
        <View className="flex-1 items-center justify-center p-5">
          <Ionicons name="chatbubbles-outline" size={48} color="#A79E96" />
          <Text className="text-[#A79E96] mt-4 text-center">{t('sosyalMedya.inbox.noMessages')}</Text>
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
              <GlassCard style={{ padding: 12, marginBottom: 12, borderRadius: 12, borderWidth: isSelectionMode && selectedItems.includes(item.zernio_conversation_id) ? 1 : 0, borderColor: isSelectionMode && selectedItems.includes(item.zernio_conversation_id) ? '#C2478D' : 'transparent' }}>
                <View className="flex-row items-center justify-between">
                  {isSelectionMode && (
                    <View className={`w-6 h-6 rounded-full border mr-3 items-center justify-center ${selectedItems.includes(item.zernio_conversation_id) ? 'bg-[#C2478D] border-[#C2478D]' : 'border-white/30'}`}>
                      {selectedItems.includes(item.zernio_conversation_id) && <Ionicons name="checkmark" size={16} color="#fff" />}
                    </View>
                  )}
                  <View className="flex-row items-center flex-1">
                    <View className="w-12 h-12 rounded-full bg-white/10 items-center justify-center mr-3 relative">
                      <Ionicons name={item.platform === 'instagram' ? 'logo-instagram' : 'logo-facebook'} size={24} color={item.platform === 'instagram' ? '#E8A8CD' : '#22B573'} />
                      {item.unread_count > 0 && (
                        <View className="absolute -top-1 -right-1 bg-[#C2478D] w-5 h-5 rounded-full items-center justify-center border border-[#17151A]">
                          <Text className="text-white text-[10px] font-bold">{item.unread_count}</Text>
                        </View>
                      )}
                    </View>
                    <View className="flex-1">
                      <Text className="text-[#F6F1EC] font-bold text-[14px]" numberOfLines={1} ellipsizeMode="tail">{item.participant_name}</Text>
                      <Text className={`text-[12px] mt-1 ${item.unread_count > 0 ? 'text-[#22B573] font-medium' : 'text-[#A79E96]'}`} numberOfLines={1} ellipsizeMode="tail">
                        {item.lastMessageSnippet}
                      </Text>
                    </View>
                  </View>
                  <View className="items-end">
                    <Text className="text-[#A79E96] text-[10px] mb-2">
                      {new Date(item.updated_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute:'2-digit' })}
                    </Text>
                    
                    <View className="flex-row">
                      {item.unread_count > 0 && (
                        <TouchableOpacity className="w-7 h-7 rounded-full bg-[#22B573]/10 items-center justify-center border border-[#22B573]/30 mr-2">
                          <Ionicons name="checkmark-done" size={14} color="#22B573" />
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
                        className="w-7 h-7 rounded-full bg-[#C2478D]/10 items-center justify-center border border-[#C2478D]/30"
                      >
                        <MaterialIcons name="reply" size={14} color="#C2478D" />
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
        className="absolute bottom-6 right-6 w-14 h-14 bg-[#22B573] rounded-full items-center justify-center shadow-[0_0_15px_rgba(34, 181, 115,0.6)]"
      >
        <Ionicons name="chatbubble-ellipses" size={24} color="#17151A" />
      </TouchableOpacity>
    </View>
  );
};
