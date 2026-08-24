import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Colors, ModuleAccent, Radius } from '@/core/theme/designSystem';

export default function GlobalAppBar({
  level = 2,
  module = 'genel',
  title = '',
  showProfile = false,
  actions = [],
  onBackPress,
  onMenuPress
}) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  // Determine accent color (aynı modül eşlemesi, yeni token'lardan)
  const accentColor = ModuleAccent[module] ?? ModuleAccent.genel;

  const handleBack = () => {
    if (onBackPress) onBackPress();
    else if (navigation.canGoBack()) navigation.goBack();
  };

  return (
    <View style={[styles.wrapper, { paddingTop: insets.top }]}>
      <View style={styles.row}>
        {/* Left Section */}
        <View style={styles.leftSection}>
          {level === 1 ? (
            <TouchableOpacity onPress={onMenuPress} style={styles.iconButton} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityRole="button" accessibilityLabel="Menü">
              <MaterialIcons name="menu" size={22} color={Colors.textPrimary} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={handleBack} style={styles.iconButton} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityRole="button" accessibilityLabel="Geri">
              <MaterialIcons name="arrow-back" size={22} color={Colors.textPrimary} />
            </TouchableOpacity>
          )}

          <Text
            style={styles.title}
            numberOfLines={1}
          >
            {title || (level === 1 ? "Workigom AI" : "")}
          </Text>
        </View>

        {/* Right Section */}
        <View style={styles.rightSection}>
          {actions.map((action, index) => (
            <TouchableOpacity
              key={index}
              onPress={action.onPress}
              style={[styles.iconButton, styles.actionButtonSpacing]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel={action.accessibilityLabel || action.icon}
            >
              <MaterialIcons name={action.icon} size={22} color={Colors.textPrimary} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
      {/* Modül vurgu çizgisi — eskiden 2px "sert" çizgi, artık yumuşak/kademeli */}
      {accentColor !== 'transparent' && (
        <View style={[styles.accentLine, { backgroundColor: accentColor }]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: Colors.bgBase,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 60,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceElevated,
  },
  actionButtonSpacing: {
    marginLeft: 8,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.2,
    marginLeft: 10,
    flexShrink: 1,
  },
  accentLine: {
    height: 2,
    opacity: 0.6,
  },
});
