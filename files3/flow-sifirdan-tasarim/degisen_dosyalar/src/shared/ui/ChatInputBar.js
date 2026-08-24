/* eslint-disable react-hooks/refs */
import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, Text, Animated, StyleSheet, Keyboard, Platform } from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ChatInputBar({
  inputText,
  setInputText,
  handleSend,
  placeholder = "Bir mesaj yazın...",
  onAttachImage,
  onAttachGallery,
  onAttachDocument,
  containerStyle,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(10)).current;

  const insets = useSafeAreaInsets();
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const bottomPadding = keyboardVisible ? 0 : Math.max(insets.bottom - 4, 0);

  useEffect(() => {
    if (isMenuOpen) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 10,
          duration: 150,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [isMenuOpen]);

  const handleAction = (action) => {
    setIsMenuOpen(false);
    if (action) action();
  };

  return (
    <View style={[{ zIndex: 50, paddingBottom: bottomPadding }, containerStyle]}>
      {/* Floating Attachment Menu */}
      <Animated.View 
        style={[
          styles.floatingMenu, 
          { 
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            pointerEvents: isMenuOpen ? 'auto' : 'none'
          }
        ]}
      >
        {onAttachImage && (
          <TouchableOpacity onPress={() => handleAction(onAttachImage)} style={styles.menuItem}>
            <MaterialIcons name="camera-alt" size={22} color="#22B573" />
            <Text style={styles.menuText}>Kamera</Text>
          </TouchableOpacity>
        )}
        {onAttachGallery && (
          <TouchableOpacity onPress={() => handleAction(onAttachGallery)} style={styles.menuItem}>
            <MaterialIcons name="photo-library" size={22} color="#22B573" />
            <Text style={styles.menuText}>Galeri</Text>
          </TouchableOpacity>
        )}
        {onAttachDocument && (
          <TouchableOpacity onPress={() => handleAction(onAttachDocument)} style={[styles.menuItem, { borderBottomWidth: 0 }]}>
            <MaterialIcons name="picture-as-pdf" size={22} color="#22B573" />
            <Text style={styles.menuText}>Belge</Text>
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* Input Bar */}
      <View 
        className="flex-row items-center px-3 py-3 mx-4 rounded-3xl border border-white/5 relative z-40"
        style={{
          backgroundColor: 'rgba(22, 27, 38, 0.85)',
          shadowColor: '#22B573',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
          elevation: 10,
        }}
      >
        
        {/* Toggle Attachments Button */}
        <TouchableOpacity 
          onPress={() => setIsMenuOpen(!isMenuOpen)}
          className="w-10 h-10 rounded-full items-center justify-center bg-white/5 mr-2"
        >
          <Animated.View style={{ transform: [{ rotate: isMenuOpen ? '45deg' : '0deg' }] }}>
            <MaterialIcons name="add" size={24} color={isMenuOpen ? "#22B573" : "#A79E96"} />
          </Animated.View>
        </TouchableOpacity>
        
        {/* Expanding Input */}
        <View className="flex-1 bg-white/[0.03] border border-white/10 rounded-2xl flex-row items-end px-3 py-1">
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder={placeholder}
            placeholderTextColor="rgba(167, 158, 150, 0.5)"
            className="flex-1 text-[#F6F1EC] text-sm py-2 min-h-[40px] max-h-[120px]"
            multiline={true}
            textAlignVertical="center"
          />
        </View>

        {/* Send Button */}
        <TouchableOpacity 
          onPress={() => {
            if (inputText.trim()) {
              handleSend();
              setIsMenuOpen(false);
            }
          }}
          className={`ml-2 w-10 h-10 rounded-full items-center justify-center mb-1 ${inputText.trim() ? 'bg-[#22B573]/20' : 'bg-white/5'}`}
        >
          <MaterialIcons name="send" size={18} color={inputText.trim() ? "#22B573" : "#A79E96"} />
        </TouchableOpacity>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
    floatingMenu: {
      position: 'absolute',
      bottom: 85, 
      left: 16,
      backgroundColor: 'rgba(28, 28, 30, 0.98)',
      borderRadius: 24,
      paddingVertical: 8,
      paddingHorizontal: 8,
      shadowColor: '#22B573',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 15,
      elevation: 10,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.08)',
      zIndex: 50,
      minWidth: 150,
    },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  menuText: {
    color: '#F6F1EC',
    fontSize: 15,
    marginLeft: 14,
    fontWeight: '500',
    letterSpacing: 0.3,
  }
});
