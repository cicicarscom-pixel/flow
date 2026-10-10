import { useTranslation } from 'react-i18next';
import React, { useState, useEffect } from 'react';
import { supabase } from '../../../../../shared';
import { DeviceEventEmitter, ActivityIndicator, View, Text, FlatList } from 'react-native';
import { styles } from './inboxStyles';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from './inboxShared';

export const DegerlendirmelerTab = () => {
  const { t } = useTranslation();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setReviews(data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      fetchReviews();
    }, 0);
    
    const channel = supabase
      .channel('realtime_reviews')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, () => {
        fetchReviews();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const listener = DeviceEventEmitter.addListener('REFRESH_INBOX', fetchReviews);
    return () => {
      listener.remove();
    };
  }, []);

  if (loading) return <ActivityIndicator color="#22B573" style={{ marginTop: 20 }} />;

  return (
    <View style={styles.tabContainer}>
      {reviews.length === 0 ? (
        <View className="flex-1 items-center justify-center p-5">
          <Ionicons name="star-outline" size={48} color="#A79E96" />
          <Text className="text-[#A79E96] mt-4 text-center">{t('sosyalMedya.inbox.noReviews')}</Text>
        </View>
      ) : (
        <FlatList 
          data={reviews}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          renderItem={({ item }) => (
            <GlassCard style={{ padding: 16, marginBottom: 12, borderRadius: 12 }}>
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-[#F6F1EC] font-bold text-[14px]" numberOfLines={1} ellipsizeMode="tail">{item.reviewer_name}</Text>
                <Text className="text-[#A79E96] text-[10px]">
                  {new Date(item.created_at).toLocaleDateString('tr-TR')}
                </Text>
              </View>
              <View className="flex-row mb-2">
                {[1,2,3,4,5].map(star => (
                  <Ionicons 
                    key={star} 
                    name={star <= item.rating ? "star" : "star-outline"} 
                    size={14} 
                    color={star <= item.rating ? "#22B573" : "#A79E96"} 
                    style={{ marginRight: 2 }}
                  />
                ))}
              </View>
              <Text className="text-[#A79E96] text-[12px] leading-5" numberOfLines={4} ellipsizeMode="tail">{item.content}</Text>
            </GlassCard>
          )}
        />
      )}
    </View>
  );
};
