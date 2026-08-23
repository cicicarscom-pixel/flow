import React, { useState, useEffect } from 'react';
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

const formatRelativeTime = (dateStr) => {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${Math.max(1, mins)}dk önce`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}sa önce`;
  return `${Math.floor(hrs / 24)}g önce`;
};

export default function BildirimlerScreen({ navigation, isTab = false }) {
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('profile_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (err) {
      console.warn('Bildirimler alınamadı:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const markAsRead = async (id, currentStatus) => {
    if (currentStatus) return; // Zaten okunduysa işlem yapma
    
    // UI optimistic update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);
    } catch (error) {
      console.warn('Okundu işaretlenirken hata:', error);
    }
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('profile_id', session.user.id)
        .eq('is_read', false);
    } catch (error) {
      console.warn('Tümü okundu işaretlenirken hata:', error);
    }
  };

  const deleteNotification = async (id) => {
    Alert.alert('Sil', 'Bu bildirimi silmek istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      { 
        text: 'Sil', 
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
        onPress={() => markAsRead(item.id, item.is_read)}
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
            <Text style={styles.time}>{formatRelativeTime(item.created_at)}</Text>
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
          title="Bildirimler" 
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
          <Text style={styles.emptyText}>Henüz bir bildiriminiz yok.</Text>
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
