import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { styles } from './dashboardStyles';
import { Skeleton } from './DashboardUi';
import { PLATFORM_ICONS, COLORS } from './dashboardTheme';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { formatRelativeTime } from './dashboardFormat';

export function RecentActivitiesSection({ isLoading, recentActivities, t }) {
  return (
    recentActivities.length > 0 && (
    <>
    {/* Son Aktiviteler */}
    <View style={styles.sectionHeaderRow}>
      <Text style={styles.sectionTitle}>{t('dashboardScreen.recentActivity.title')}</Text>
      <TouchableOpacity><Text style={styles.seeAllBtn}>{t('dashboardScreen.recentActivity.seeAll')}</Text></TouchableOpacity>
    </View>
    <View style={styles.activitiesContainer}>
      {isLoading ? (
        <>
          <View style={styles.activityCard}><Skeleton width="100%" height={60} borderRadius={16} /></View>
          <View style={styles.activityCard}><Skeleton width="100%" height={60} borderRadius={16} /></View>
        </>
      ) : recentActivities.length > 0 ? (
        recentActivities.map((act) => (
          <TouchableOpacity key={act.id} style={styles.activityCard} activeOpacity={0.7}>
            <View style={styles.activityAvatarWrap}>
              <Image source={{ uri: act.avatar }} style={styles.activityAvatar} />
              {PLATFORM_ICONS[act.platform] && (
                <View style={[styles.platformBadge, { backgroundColor: PLATFORM_ICONS[act.platform].color }]}>
                  <Ionicons name={PLATFORM_ICONS[act.platform].name} size={10} color="#fff" />
                </View>
              )}
            </View>
            <View style={styles.activityBody}>
              <View style={styles.activityTopRow}>
                <Text style={styles.activityName} numberOfLines={1}>{act.name}</Text>
                <Text style={styles.activityTime}>{formatRelativeTime(act.date, t)}</Text>
              </View>
              <Text style={styles.activityMessage} numberOfLines={1}>{act.message}</Text>
              <View style={styles.activityTagsRow}>
                <View style={[styles.activityTag, { backgroundColor: `${act.color}1A`, borderColor: `${act.color}33` }]}>
                  <Text style={[styles.activityTagText, { color: act.color }]}>{act.type}</Text>
                </View>
                <View style={[styles.activityTag, { backgroundColor: COLORS.surfaceContainer, borderColor: 'rgba(255,255,255,0.05)' }]}>
                  <Text style={[styles.activityTagText, { color: COLORS.onSurfaceVariant }]}>{act.platform}</Text>
                </View>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={COLORS.onSurfaceVariant} style={styles.activityArrow} />
          </TouchableOpacity>
        ))
      ) : (
        <Text style={styles.emptyText}>{t('dashboardScreen.recentActivity.empty')}</Text>
      )}
    </View>
    </>
    
    )
  );
}
