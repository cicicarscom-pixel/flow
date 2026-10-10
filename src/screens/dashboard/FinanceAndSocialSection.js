import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from './dashboardStyles';
import { CustomGlassCard, Skeleton } from './DashboardUi';
import { COLORS } from './dashboardTheme';
import { MaterialIcons } from '@expo/vector-icons';
import InvoiceSummaryCard from '../../shared/ui/InvoiceSummaryCard';
import { todayInTimezone } from '../../lib/dates';
import SocialSummaryCard from '../../shared/ui/SocialSummaryCard';

export function FinanceAndSocialSection({ financeStats, formatCurrency, hasSocialAccounts, i18n, isLoading, latestInvoice, navigation, orgTz, socialAccounts, socialStats, t }) {
  return (
    <>
      {/* Gelir / Gider */}
      <View style={styles.financeGrid}>
        <CustomGlassCard style={styles.financeCard}>
          <View style={styles.financeHeaderRow}>
            <View style={[styles.financeBadge, { backgroundColor: 'rgba(34, 181, 115, 0.12)', borderColor: 'rgba(34, 181, 115, 0.25)' }]}>
              <Text style={[styles.financeBadgeText, { color: COLORS.tertiaryFixed }]}>{t('dashboardScreen.finance.income')}</Text>
            </View>
            <MaterialIcons name="trending-up" size={18} color={COLORS.tertiary} />
          </View>
          {isLoading ? (
            <Skeleton width="80%" height={26} style={{ marginBottom: 12 }} />
          ) : (
            <Text style={styles.financeValueText}>{formatCurrency(financeStats.income, i18n.language)} </Text>
          )}
      
        </CustomGlassCard>
      
        <CustomGlassCard style={styles.financeCard}>
          <View style={styles.financeHeaderRow}>
            <View style={[styles.financeBadge, { backgroundColor: 'rgba(255, 180, 171, 0.1)', borderColor: 'rgba(255, 180, 171, 0.2)' }]}>
              <Text style={[styles.financeBadgeText, { color: COLORS.error }]}>{t('dashboardScreen.finance.expense')}</Text>
            </View>
            <MaterialIcons name="trending-down" size={18} color={COLORS.error} />
          </View>
          {isLoading ? (
            <Skeleton width="80%" height={26} style={{ marginBottom: 12 }} />
          ) : (
            <Text style={styles.financeValueText}>{formatCurrency(financeStats.expense, i18n.language)} </Text>
          )}
      
        </CustomGlassCard>
      </View>
      
      {/* Fatura Tarayıcı */}
      <CustomGlassCard style={styles.invoiceCard} glowColor="#F59E0B">
        <InvoiceSummaryCard
          invoice={latestInvoice}
          todayYmd={todayInTimezone(orgTz)}
          onScan={() => navigation.navigate('Muhasebe', { screen: 'VeriGirisi' })}
        />
      </CustomGlassCard>
      
      {/* Tüm Hesaplar — sosyal özet */}
      <CustomGlassCard style={styles.socialCard} glowColor="#A5B4FC">
        {hasSocialAccounts ? (
          <SocialSummaryCard
            accounts={socialAccounts}
            totalFollowers={socialStats.followers}
            trend={socialStats.trend}
            loading={isLoading}
            onViewAnalytics={() => navigation.navigate('Analiz')}
          />
        ) : (
          <View style={{ paddingVertical: 10, alignItems: 'center' }}>
            <Text style={styles.sectionTitle}>{t('dashboardScreen.social.allAccounts')}</Text>
            <Text style={{ color: COLORS.onSurfaceVariant, fontSize: 13, textAlign: 'center', marginTop: 8 }}>{t('dashboardScreen.social.noAccounts')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Sosyal Medya')} style={{ marginTop: 10 }}>
              <Text style={{ color: '#00F2FE', fontSize: 13, fontWeight: '500' }}>{t('dashboardScreen.social.connectAccount')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </CustomGlassCard>
    </>
  );
}
