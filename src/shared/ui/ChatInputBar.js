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
            <MaterialIcons name="camera-alt" size={22} color="#00f0ff" />
            <Text style={styles.menuText}>Kamera</Text>
          </TouchableOpacity>
        )}
        {onAttachGallery && (
          <TouchableOpacity onPress={() => handleAction(onAttachGallery)} style={styles.menuItem}>
            <MaterialIcons name="photo-library" size={22} color="#00f0ff" />
            <Text style={styles.menuText}>Galeri</Text>
          </TouchableOpacity>
        )}
        {onAttachDocument && (
          <TouchableOpacity onPress={() => handleAction(onAttachDocument)} style={[styles.menuItem, { borderBottomWidth: 0 }]}>
            <MaterialIcons name="picture-as-pdf" size={22} color="#00f0ff" />
            <Text style={styles.menuText}>Belge</Text>
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* Input Bar */}
      <View 
        className="flex-row items-center px-3 py-3 mx-4 rounded-3xl border border-white/5 relative z-40"
        style={{
          backgroundColor: 'rgba(22, 27, 38, 0.85)',
          shadowColor: '#00F2FE',
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
            <MaterialIcons name="add" size={24} color={isMenuOpen ? "#00f0ff" : "#b9cacb"} />
          </Animated.View>
        </TouchableOpacity>
        
        {/* Expanding Input */}
        <View className="flex-1 bg-white/[0.03] border border-white/10 rounded-2xl flex-row items-end px-3 py-1">
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder={placeholder}
            placeholderTextColor="rgba(132, 148, 149, 0.5)"
            className="flex-1 text-[#e5e2e3] text-sm py-2 min-h-[40px] max-h-[120px]"
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
          className={`ml-2 w-10 h-10 rounded-full items-center justify-center mb-1 ${inputText.trim() ? 'bg-[#00f0ff]/20' : 'bg-white/5'}`}
        >
          <MaterialIcons name="send" size={18} color={inputText.trim() ? "#00f0ff" : "#b9cacb"} />
        </TouchableOpacity>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
    floatingMenu: {
      position: 'absolute',
      bottom: 70, 
      left: 16,
      backgroundColor: 'rgba(22, 27, 38, 0.95)',
      borderRadius: 16,
      paddingVertical: 8,
      paddingHorizontal: 16,
      shadowColor: '#00F2FE',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 10,
      elevation: 5,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.05)',
      zIndex: 50,
    },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  menuText: {
    color: '#e5e2e3',
    fontSize: 14,
    marginLeft: 12,
    fontWeight: '500',
  }
});
