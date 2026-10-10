import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { styles } from './dashboardStyles';
import { Skeleton, CustomGlassCard } from './DashboardUi';
import { COLORS } from './dashboardTheme';
import { MaterialIcons } from '@expo/vector-icons';

export function UpcomingPaymentsSection({ formatCurrency, formatDayMonth, i18n, isLoading, t, upcomingPayments }) {
  return (
    <>
      {/* Yaklaşan Ödemeler */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>{t('dashboardScreen.upcomingPayments.title')}</Text>
      </View>
      {isLoading ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.paymentsScroll} scrollEnabled={false}>
          <Skeleton width={200} height={120} borderRadius={20} />
          <Skeleton width={200} height={120} borderRadius={20} style={{ marginLeft: 12 }} />
        </ScrollView>
      ) : upcomingPayments.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.paymentsScroll} snapToInterval={216} decelerationRate="fast">
          {upcomingPayments.map((payment, index) => {
            const colors = [COLORS.error, COLORS.tertiary, COLORS.primary, COLORS.secondary];
            const pColor = colors[index % colors.length];
            return (
              <CustomGlassCard key={payment.id || index} style={styles.paymentCard}>
                <View style={styles.paymentDateRow}>
                  <MaterialIcons name="event" size={16} color={pColor} />
                  <Text style={[styles.paymentDateText, { color: pColor }]}>{formatDayMonth(payment.date, t).toUpperCase()}</Text>
                </View>
                <Text style={styles.paymentTitle} numberOfLines={1}>{payment.description || t('dashboardScreen.upcomingPayments.defaultTitle')}</Text>
                <View style={styles.paymentBottomRow}>
                  <Text style={styles.paymentAmount}>{formatCurrency(payment.amount, i18n.language)} </Text>
                  <TouchableOpacity style={styles.paymentMoreBtn}>
                    <MaterialIcons name="more-horiz" size={18} color={COLORS.onSurfaceVariant} />
                  </TouchableOpacity>
                </View>
              </CustomGlassCard>
            );
          })}
        </ScrollView>
      ) : (
        <Text style={styles.emptyText}>{t('dashboardScreen.upcomingPayments.empty')}</Text>
      )}
    </>
  );
}
