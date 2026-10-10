import React from 'react';
import { View, TouchableWithoutFeedback, StyleSheet, ScrollView, Image, Animated, Text, TouchableOpacity, Switch } from 'react-native';
import { styles } from './dashboardStyles';
import { Skeleton, BreathingIcon } from './DashboardUi';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { COLORS } from './dashboardTheme';

export function DashboardHero({ BAR_IMAGES, aiActive, handleHeroImageChange, handleToggleAiActive, hintAnim, innerWidth, insets, isFocused, isLoading, navigation, scrollRef, showHint, t, unreadCount, userProfile }) {
  return (
    <View style={{
      borderBottomLeftRadius: 32,
      borderBottomRightRadius: 32,
      borderBottomWidth: 1.5,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: 'rgba(0, 162, 255, 0.6)',
      shadowColor: '#00a2ff',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.6,
      shadowRadius: 20,
      elevation: 15,
      backgroundColor: '#131315',
      marginBottom: 20,
    }}>
      {/* HERO: cesur renk bloğu - profil, bildirim ve AI durumu tek odakta */}
      <View style={[styles.hero, { overflow: 'hidden', marginBottom: 0 }]}>
      <TouchableWithoutFeedback onLongPress={handleHeroImageChange}>
        <View style={StyleSheet.absoluteFill}>
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
          >
            {(userProfile.heroImageUrl ? [{ id: 'custom', uri: userProfile.heroImageUrl, isUserImage: true }, ...BAR_IMAGES] : BAR_IMAGES).map((img, idx) => (
              <Image key={idx} source={img.isUserImage ? { uri: img.uri } : img} style={{ width: innerWidth, height: '100%', resizeMode: 'cover' }} />
            ))}
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
      
      {showHint && (
        <Animated.View style={{
          position: 'absolute', top: 80, left: 0, right: 0, alignItems: 'center', opacity: hintAnim, zIndex: 99
        }} pointerEvents="none">
          <View style={{ backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 }}>
            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>Kendi resmini eklemek için basılı tut</Text>
          </View>
        </Animated.View>
      )}
    
      <View style={[styles.heroTopRow, { paddingTop: Math.max(insets.top, 16) }]}>
        <TouchableOpacity
          style={styles.heroAvatarOuter}
          onPress={() => navigation.navigate('Profil')}
        >
          <View style={styles.heroAvatarHalo} />
          <View style={styles.heroAvatarWrapper}>
            {isLoading ? (
              <Skeleton width="100%" height="100%" borderRadius={22} />
            ) : (
              <Image
                source={{ uri: userProfile.avatarUrl || 'https://ui-avatars.com/api/?name=Kullanici' }}
                style={styles.heroAvatarImage}
              />
            )}
          </View>
          {!isLoading && <View style={styles.onlineDot} />}
        </TouchableOpacity>
    
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity style={[styles.heroIconBtn, { marginRight: 8, backgroundColor: 'rgba(255,255,255,0.15)' }]} onPress={handleHeroImageChange}>
            <Ionicons name="image-outline" size={18} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.heroIconBtn} onPress={() => navigation.navigate('Inbox', { screen: 'Bildirimler' })}>
            <MaterialIcons name="notifications" size={20} color={COLORS.background} />
            {unreadCount > 0 && <View style={styles.notificationBadge} />}
          </TouchableOpacity>
        </View>
      </View>
    
      <Text style={styles.heroGreeting}>{t('dashboardScreen.greeting.hello')}</Text>
      {isLoading ? (
        <Skeleton width={140} height={26} style={{ marginTop: 6, marginBottom: 18 }} />
      ) : (
        <Text style={styles.heroName}>{userProfile.fullName}</Text>
      )}
    
      {/* AI Asistan durumu — hero'nun içine gömülü tek odak kartı */}
      <View style={styles.heroAiCard}>
        <BreathingIcon active={aiActive && !isLoading}>
          <View style={styles.heroAiIconWrapper}>
            {isFocused && (
              <Image
                source={require('../../../assets/images/robot1.gif')}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            )}
          </View>
        </BreathingIcon>
        <View style={styles.heroAiTexts}>
          {isLoading ? (
            <>
              <Skeleton width={120} height={14} style={{ marginBottom: 6 }} />
              <Skeleton width={160} height={11} />
            </>
          ) : (
            <>
              <Text style={styles.heroAiTitle}>{aiActive ? t('dashboardScreen.ai.activeTitle') : t('dashboardScreen.ai.inactiveTitle')}</Text>
              <Text style={styles.heroAiSubtitle}>{aiActive ? t('dashboardScreen.ai.activeSubtitle') : t('dashboardScreen.ai.inactiveSubtitle')}</Text>
            </>
          )}
        </View>
        {!isLoading && (
          <Switch
            value={aiActive}
            onValueChange={handleToggleAiActive}
            trackColor={{ false: 'rgba(255,255,255,0.15)', true: 'rgba(56, 189, 248, 0.35)' }}
            thumbColor={aiActive ? '#38BDF8' : '#fff'}
            ios_backgroundColor="rgba(255,255,255,0.2)"
          />
        )}
      </View>
    </View>
    </View>
  );
}
