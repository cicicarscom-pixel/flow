import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { supabase } from '../shared';
import * as Linking from 'expo-linking';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { makeRedirectUri } from 'expo-auth-session';

export default function VerifyEmailScreen({ emailFromProps }) {
  const [email, setEmail] = useState(emailFromProps || null);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // If not passed from props, try to get from session
    if (!emailFromProps) {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) setEmail(user.email);
      });
    }

    // Handle deep link (when user clicks email link and returns to app)
    const handleDeepLink = (event) => {
      const url = event.url;
      if (url) {
        // Just refresh the session when app opens from any link
        supabase.auth.getSession();
      }
    };
    const linkSubscription = Linking.addEventListener('url', handleDeepLink);

    return () => {
      linkSubscription.remove();
    };
  }, []);

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    setMessage('');
    
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: makeRedirectUri(),
      }
    });

    if (error) {
      setMessage('Bağlantı gönderilirken bir hata oluştu: ' + error.message);
    } else {
      setMessage('Doğrulama bağlantısı tekrar gönderildi.');
    }
    
    setResending(false);
  };

  const handleCheckStatus = async () => {
    setMessage('');
    const { data: { session }, error } = await supabase.auth.getSession();
    if (session?.user?.email_confirmed_at) {
      setMessage('E-posta doğrulandı! Yönlendiriliyorsunuz...');
      // App.js onAuthStateChange listener will automatically navigate
    } else {
      setMessage('Henüz doğrulanmamış. Lütfen e-postanızı kontrol edin.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name="email-check-outline" size={32} color="#3b82f6" />
        </View>
        
        <Text style={styles.title}>E-postanızı Doğrulayın</Text>
        
        {email && <Text style={styles.emailText}>{email}</Text>}
        
        <Text style={styles.description}>
          E-posta adresinize bir doğrulama linki gönderdik. Devam etmek için lütfen e-postanızı onaylayın.
        </Text>

        <TouchableOpacity 
          style={styles.button} 
          onPress={handleCheckStatus}
        >
          <Text style={styles.buttonText}>Onayladım, Devam Et</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.outlineButton, resending && styles.disabledButton]} 
          onPress={handleResend}
          disabled={resending}
        >
          {resending ? (
            <ActivityIndicator color="#3b82f6" />
          ) : (
            <Text style={styles.outlineButtonText}>Tekrar Gönder</Text>
          )}
        </TouchableOpacity>
        
        {message ? <Text style={styles.messageText}>{message}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#1E293B',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  iconContainer: {
    width: 64,
    height: 64,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  emailText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  button: {
    backgroundColor: '#3b82f6',
    width: '100%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  outlineButton: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  outlineButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  messageText: {
    color: '#60a5fa',
    fontSize: 14,
    marginTop: 16,
    textAlign: 'center',
  }
});
