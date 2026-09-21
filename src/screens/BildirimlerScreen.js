import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlobalAppBar, supabase } from '../shared';

const COLORS = {
  background: '#17151A',
  surface: 'rgba(39, 42, 46, 0.4)',
  onSurface: '#F6F1EC',
  onSurfaceVariant: '#A79E96',
  primary: '#22B573',
  error: '#FCA5A5',
  success: '#22B573',
  warning: '#F59E0B'
};

const formatRelativeTime = (dateStr, t) => {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return t('bildirimlerScreen.relativeTime.minutesAgo', { count: Math.max(1, mins) });
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return t('bildirimlerScreen.relativeTime.hoursAgo', { count: hrs });
  return t('bildirimlerScreen.relativeTime.daysAgo', { count: Math.floor(hrs / 24) });
};

export default function BildirimlerScreen({ navigation, isTab = false }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      let organizationId = session.user.id;
      const { data: orgData } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', session.user.id)
        .limit(1);
      if (orgData && orgData.length > 0 && orgData[0].organization_id) {
        organizationId = orgData[0].organization_id;
      }
      
      let regularNotifs = [];
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('profile_id', organizationId);
      if (!error) regularNotifs = data || [];

      const { data: profileData } = await supabase.from('profiles').select('user_type').eq('id', session.user.id).limit(1);
      const userType = profileData?.[0]?.user_type || 'business';

      const { data: broadcasts, error: bError } = await supabase.from('broadcast_notifications').select('*').in('target', ['all', userType]);
      if (bError) console.warn("Broadcast Error:", bError);
      
      const { data: reads } = await supabase.from('broadcast_reads').select('broadcast_id').eq('user_id', session.user.id);
      
      const readSet = new Set(reads?.map(r => r.broadcast_id) || []);
      
      const broadcastNotifs = (broadcasts || []).map(b => ({
         id: b.id,
         is_broadcast: true,
         title: b.title,
         message: b.message,
         created_at: b.created_at,
         is_read: readSet.has(b.id)
      }));
      
      const combined = [...regularNotifs, ...broadcastNotifs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setNotifications(combined);
    } catch (err) {
      console.warn('Bildirimler alınamadı:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    const notifChannel = supabase.channel('mobile_realtime_notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, fetchNotifications)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'broadcast_notifications' }, fetchNotifications)
      .subscribe();
      
    return () => {
      supabase.removeChannel(notifChannel);
    };
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const markAsRead = async (id, currentStatus, is_broadcast) => {
    if (currentStatus) return; // Zaten okunduysa işlem yapma
    
    // UI optimistic update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    
    try {
      if (is_broadcast) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
           await supabase.from('broadcast_reads').insert({ user_id: session.user.id, broadcast_id: id });
        }
      } else {
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('id', id);
      }
    } catch (error) {
      console.warn('Okundu işaretlenirken hata:', error);
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.is_read);
    if (unread.length === 0) return;
    
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const unreadRegular = unread.filter(n => !n.is_broadcast).map(n => n.id);
      const unreadBroadcasts = unread.filter(n => n.is_broadcast).map(n => n.id);
      
      if (unreadRegular.length > 0) {
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .in('id', unreadRegular);
      }
      
      if (unreadBroadcasts.length > 0) {
        const inserts = unreadBroadcasts.map(id => ({ user_id: session.user.id, broadcast_id: id }));
        await supabase.from('broadcast_reads').upsert(inserts, { onConflict: 'user_id, broadcast_id' });
      }
    } catch (error) {
      console.warn('Tümü okundu işaretlenirken hata:', error);
    }
  };

  const deleteNotification = async (id) => {
    Alert.alert(t('bildirimlerScreen.alerts.deleteTitle'), t('bildirimlerScreen.alerts.deleteMessage'), [
      { text: t('bildirimlerScreen.alerts.cancel'), style: 'cancel' },
      {
        text: t('bildirimlerScreen.alerts.delete'),
        style: 'destructive',
        onPress: async () => {
          setNotifications(prev => prev.filter(n => n.id !== id));
          try {
            await supabase
              .from('notifications')
              .delete()
              .eq('id', id);
          } catch (error) {
            console.warn('Bildirim silinemedi:', error);
          }
        }
      }
    ]);
  };

  const getIconForType = (type) => {
    switch (type) {
      case 'ledger': return { name: 'account-balance', color: COLORS.primary };
      case 'system': return { name: 'info-outline', color: COLORS.warning };
      case 'alert': return { name: 'warning', color: COLORS.error };
      case 'success': return { name: 'check-circle', color: COLORS.success };
      default: return { name: 'notifications', color: COLORS.primary };
    }
  };

  const renderItem = ({ item }) => {
    const icon = getIconForType(item.type);
    return (
      <TouchableOpacity 
        style={[styles.notificationCard, !item.is_read && styles.unreadCard]}
        onPress={() => markAsRead(item.id, item.is_read, item.is_broadcast)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconWrapper, { backgroundColor: `${icon.color}1A`, borderColor: `${icon.color}33` }]}>
          <MaterialIcons name={icon.name} size={24} color={icon.color} />
        </View>
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={[styles.title, !item.is_read && { fontWeight: '700', color: '#fff' }]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.time}>{formatRelativeTime(item.created_at, t)}</Text>
          </View>
          <Text style={[styles.message, !item.is_read && { color: COLORS.onSurface }]} numberOfLines={2}>
            {item.message}
          </Text>
        </View>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteNotification(item.id)}>
          <Ionicons name="trash-outline" size={20} color={COLORS.error} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {!isTab && (
        <GlobalAppBar
          title={t('bildirimlerScreen.title')}
          onBack={() => navigation.goBack()}
          rightIcon={notifications.some(n => !n.is_read) ? "checkmark-done" : undefined}
          onRightPress={markAllAsRead}
        />
      )}
      
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.center}>
          <MaterialIcons name="notifications-off" size={64} color="rgba(255,255,255,0.1)" />
          <Text style={styles.emptyText}>{t('bildirimlerScreen.emptyText')}</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={[styles.listContent, { paddingBottom: Math.max(insets.bottom, 20) }]}
          showsVerticalScrollIndicator={false}
          onRefresh={handleRefresh}
          refreshing={refreshing}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 16,
  },
  emptyText: {
    color: COLORS.onSurfaceVariant,
    marginTop: 16,
    fontSize: 14,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  unreadCard: {
    borderColor: 'rgba(0, 218, 243, 0.3)',
    backgroundColor: 'rgba(39, 42, 46, 0.6)',
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    color: COLORS.onSurface,
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  time: {
    color: COLORS.onSurfaceVariant,
    fontSize: 11,
  },
  message: {
    color: COLORS.onSurfaceVariant,
    fontSize: 13,
    lineHeight: 18,
  },
  deleteBtn: {
    padding: 8,
    marginLeft: 8,
  }
});
