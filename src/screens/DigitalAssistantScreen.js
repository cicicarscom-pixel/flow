import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  ScrollView,
  StyleSheet,
  Dimensions,
  ImageBackground,
  Image,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator,
  Modal
} from 'react-native';
import { MaterialIcons, Ionicons, Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { supabase , ChatInputBar , GlobalAppBar } from '../shared';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';



export default function DigitalAssistantScreen({ route, navigation }) {
  const [inputText, setInputText] = useState('');
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [selectedMediaBase64, setSelectedMediaBase64] = useState(null);
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [loading, setLoading] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState(null);
  const scrollViewRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'ai',
      type: 'welcome',
      text: 'Merhaba! Bugün nasıl bir içerik planlayalım? Bana ne paylaşmak istediğinizi söyleyin.',
      timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const handlePickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setSelectedMedia(result.assets[0].uri);
      setSelectedMediaBase64(result.assets[0].base64);
    }
  };

  const handleSend = async () => {
    if ((inputText.trim() === '' && !selectedMedia) || loading) return;
    
    const userText = inputText;
    const userImage = selectedMedia;
    const userImageBase64 = selectedMediaBase64;
    
    const userMsg = {
      id: Date.now(),
      role: 'user',
      text: userText,
      image: userImage,
      timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setSelectedMedia(null);
    setSelectedMediaBase64(null);
    setLoading(true);
    
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
    
    try {
      const payload = {
        mode: 'social',
        prompt: userText || "Lütfen bu görsel için harika bir gönderi hazırla.",
        aspectRatio: aspectRatio
      };

      if (userImageBase64) {
        payload.image = userImageBase64;
        payload.mimeType = 'image/jpeg';
      }

      const { data: result, error } = await supabase.functions.invoke('gemini-chat', {
        body: payload
      });

      if (error) throw error;
      if (result.error) throw new Error(result.error);

      // Extract hashtags from the generated text if possible
      const textResponse = result.text || "";
      const words = textResponse.split(/\s+/);
      const hashtags = words.filter(w => w.startsWith('#'));
      
      const aiResponse = {
        id: Date.now() + 1,
        role: 'ai',
        type: 'drafts',
        imageDraft: result.generatedImage ? `data:image/jpeg;base64,${result.generatedImage}` : null,
        textDraft: textResponse,
        hashtags: hashtags.length > 0 ? hashtags : [],
        timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
      };
      
      setMessages(prev => [...prev, aiResponse]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'ai',
        type: 'error',
        text: 'Bir hata oluştu. Lütfen AI Hesap sekmesinden Gemini API anahtarınızın doğru girildiğinden emin olun.',
        timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0A0A0B]" edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : (Platform.Version < 30 ? 'padding' : undefined)}
        className="flex-1"
      >
        {/* Solid Black Background like screenshot */}
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#000000' }]} />

      {/* Top AppBar */}
      <GlobalAppBar 
        level={2} 
        module="ai" 
        title="AI Üretim Asistanı" 
        showProfile={true} 
        actions={[{ icon: 'more-vert', onPress: () => {} }]} 
      />


      {/* Main Chat Content */}
      <ScrollView 
        ref={scrollViewRef}
        className="flex-1 px-5 pt-6" 
        contentContainerStyle={{ paddingBottom: 20 }}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((msg) => {
          if (msg.role === 'ai' && msg.type === 'welcome') {
            return (
              <View key={msg.id} className="w-[85%] self-start mb-6">
                <View className="bg-white/[0.03] border border-[#dbfcff]/10 rounded-2xl rounded-tl-none p-4 mb-2">
                  <Text className="text-[#b9cacb] text-sm leading-5">{msg.text}</Text>
                </View>
                <Text className="text-[10px] text-[#849495] px-1 font-medium">AI Assistant • {msg.timestamp}</Text>
              </View>
            );
          }
          
          if (msg.role === 'user') {
            return (
              <View key={msg.id} className="w-[85%] self-end mb-6 items-end">
                <View className="bg-[#00f0ff]/10 border border-[#00f0ff]/20 p-3 rounded-2xl rounded-tr-none mb-2">
                  {msg.text ? <Text className="text-[#e5e2e3] text-sm mb-3">{msg.text}</Text> : null}
                  {msg.image && (
                    <TouchableOpacity activeOpacity={0.8} onPress={() => setFullScreenImage(msg.image)}>
                      <Image 
                        source={{ uri: msg.image }}
                        className="w-full aspect-square rounded-xl max-w-[250px]"
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  )}
                </View>
                <Text className="text-[10px] text-[#849495] px-1 font-medium">Siz • {msg.timestamp}</Text>
              </View>
            );
          }
          
          if (msg.role === 'ai' && msg.type === 'error') {
            return (
              <View key={msg.id} className="w-[85%] self-start mb-6">
                <View className="bg-red-500/10 border border-red-500/30 rounded-2xl rounded-tl-none p-4 mb-2">
                  <Text className="text-red-400 text-sm leading-5">{msg.text}</Text>
                </View>
                <Text className="text-[10px] text-[#849495] px-1 font-medium">AI Assistant • {msg.timestamp}</Text>
              </View>
            );
          }
          
          if (msg.role === 'ai' && msg.type === 'drafts') {
            return (
              <View key={msg.id}>
                {/* AI Image Draft Bubble (Only if AI generated an image) */}
                {msg.imageDraft && (
                  <View className="w-[85%] self-start mb-6">
                    <View className="bg-white/[0.03] border border-[#dbfcff]/10 rounded-2xl rounded-tl-none p-3 mb-2">
                      <TouchableOpacity activeOpacity={0.8} onPress={() => setFullScreenImage(msg.imageDraft)}>
                        <Image 
                          source={{ uri: msg.imageDraft }}
                          className="w-full aspect-square rounded-xl mb-3"
                          resizeMode="cover"
                        />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        onPress={() => navigation.navigate('AiUretim', { selectedImage: msg.imageDraft })}
                        className="bg-[#00f0ff]/10 py-2.5 rounded-xl border border-[#00f0ff]/20 flex-row items-center justify-center"
                      >
                        <Text className="text-[#00f0ff] font-bold text-sm">🖼️ Bu Görseli Seç</Text>
                      </TouchableOpacity>
                    </View>
                    <Text className="text-[10px] text-[#849495] px-1 font-medium">AI Assistant • {msg.timestamp}</Text>
                  </View>
                )}

                {/* AI Text Draft Bubble (Only if AI generated text) */}
                {msg.textDraft ? (
                  <View className="w-[85%] self-start mb-6">
                    <View className="bg-white/[0.03] border border-[#dbfcff]/10 border-l-[3px] border-l-[#00dbe9] rounded-2xl rounded-tl-none p-4 mb-2">
                      <Text className="text-[#e5e2e3] text-sm leading-6 mb-4">{msg.textDraft}</Text>
                      {msg.hashtags && msg.hashtags.length > 0 && (
                        <View className="flex-row flex-wrap gap-2 mb-4">
                          {msg.hashtags.map((tag, idx) => (
                            <Text key={idx} className="text-[#00f0ff] text-xs font-medium">{tag}</Text>
                          ))}
                        </View>
                      )}
                      <View className="flex-row gap-2">
                        <TouchableOpacity className="flex-1 bg-[#bc13fe]/10 py-2.5 rounded-xl border border-[#bc13fe]/20 flex-row items-center justify-center">
                          <Text className="text-[#bc13fe] font-bold text-xs">🔄 Tekrar Üret</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          onPress={() => navigation.navigate('AiUretim', { selectedText: msg.textDraft })}
                          className="flex-1 bg-[#00f0ff]/10 py-2.5 rounded-xl border border-[#00f0ff]/20 flex-row items-center justify-center"
                        >
                          <Text className="text-[#00f0ff] font-bold text-xs">📝 Bu Metni Seç</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    <Text className="text-[10px] text-[#849495] px-1 font-medium">AI Assistant • {msg.timestamp}</Text>
                  </View>
                ) : null}
              </View>
            );
          }
          return null;
        })}
        {loading && (
          <View className="w-[85%] self-start mb-6">
            <View className="bg-white/[0.03] border border-[#dbfcff]/10 rounded-2xl rounded-tl-none p-4 mb-2 flex-row items-center">
              <ActivityIndicator size="small" color="#00f0ff" className="mr-3" />
              <Text className="text-[#b9cacb] text-sm font-medium">AI içerik üretiyor...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Interactive Footer Area */}
      <View className="bg-[#131314] px-5 pt-3 pb-2 border-t border-white/5 z-50">
        
        {/* Aspect Ratio Selector */}
        <View className="flex-row items-center mb-3">
          <Text className="text-[#b9cacb] text-xs mr-3">Görsel Boyutu:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
            {['1:1', '9:16', '16:9', '4:3', '3:4'].map(ratio => (
              <TouchableOpacity 
                key={ratio}
                onPress={() => setAspectRatio(ratio)}
                className={`px-3 py-1.5 rounded-full border ${aspectRatio === ratio ? 'bg-[#00f0ff]/20 border-[#00f0ff]/50' : 'bg-white/5 border-white/10'}`}
              >
                <Text className={`text-xs font-medium ${aspectRatio === ratio ? 'text-[#00f0ff]' : 'text-[#849495]'}`}>{ratio}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        
        {/* Selected Media Preview */}
        {selectedMedia && (
          <View className="mb-3 w-16 h-16 rounded-xl border border-white/10 overflow-hidden relative">
            <Image source={{ uri: selectedMedia }} className="w-full h-full" resizeMode="cover" />
            <TouchableOpacity 
              onPress={() => setSelectedMedia(null)}
              className="absolute top-1 right-1 bg-black/60 rounded-full w-5 h-5 items-center justify-center"
            >
              <MaterialIcons name="close" size={12} color="white" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Input Area */}
      <ChatInputBar 
        inputText={inputText}
        setInputText={setInputText}
        handleSend={handleSend}
        placeholder="Bir mesaj yazın..."
        onAttachImage={handlePickImage}
        onAttachGallery={handlePickImage}
      />
    </KeyboardAvoidingView>

      {/* Full Screen Image Modal */}
      <Modal visible={!!fullScreenImage} transparent={true} animationType="fade">
        <View className="flex-1 bg-black justify-center items-center">
          <TouchableOpacity 
            className="absolute top-12 right-5 z-50 p-2 bg-white/10 rounded-full"
            onPress={() => setFullScreenImage(null)}
          >
            <MaterialIcons name="close" size={28} color="white" />
          </TouchableOpacity>
          {fullScreenImage && (
            <Image 
              source={{ uri: fullScreenImage }} 
              className="w-full h-full" 
              resizeMode="contain" 
            />
          )}
        </View>
      </Modal>

    </SafeAreaView>
  );
}
