import React, { useState, useRef, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, Modal, Animated, StyleSheet, 
  Dimensions, TextInput, ScrollView, KeyboardAvoidingView, Platform, TouchableWithoutFeedback
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Country, State, City } from 'country-state-city';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function AddressSelector({ onAddressChange, initialData }) {
  // Selection State
  const [country, setCountry] = useState(initialData?.country || null);
  const [city, setCity] = useState(initialData?.city || null);
  const [district, setDistrict] = useState(initialData?.district || null);
  const [fullAddress, setFullAddress] = useState(initialData?.fullAddress || '');

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState(null); // 'country', 'city', 'district'
  const [searchQuery, setSearchQuery] = useState('');
  
  // Animation
  const [slideAnim] = useState(() => new Animated.Value(SCREEN_HEIGHT));
  const [fadeAnim] = useState(() => new Animated.Value(0));

  // Sync with async initial data
  useEffect(() => {
    if (initialData) {
      setCountry(initialData.country || null);
      setCity(initialData.city || null);
      setDistrict(initialData.district || null);
      setFullAddress(initialData.fullAddress || '');
    }
  }, [initialData]);  // Derived Options for Modal
  let currentOptions = [];
  if (modalType === 'country') {
    currentOptions = Country.getAllCountries().map(c => ({ id: c.isoCode, name: c.name }));
  } else if (modalType === 'city' && country) {
    currentOptions = State.getStatesOfCountry(country).map(s => ({ id: s.isoCode, name: s.name }));
  } else if (modalType === 'district' && country && city) {
    currentOptions = City.getCitiesOfState(country, city).map(c => ({ id: c.name, name: c.name }));
  }

  const filteredOptions = currentOptions.filter(opt => 
    opt.name.toLowerCase().includes(searchQuery.toLowerCase())
  );useEffect(() => {
    // Notify parent component when state changes
    if (onAddressChange) {
      onAddressChange({ country, city, district, fullAddress });
    }
  }, [country, city, district, fullAddress]);

  const openModal = (type) => {
    setModalType(type);
    setSearchQuery('');
    setModalVisible(true);
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 65,
        friction: 11,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();
  };

  const closeModal = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      })
    ]).start(() => {
      setModalVisible(false);
      setModalType(null);
    });
  };  const handleSelect = (item) => {
    if (modalType === 'country') {
      setCountry(item.id);
      setCity(null);
      setDistrict(null);
    } else if (modalType === 'city') {
      setCity(item.id);
      setDistrict(null);
    } else if (modalType === 'district') {
      setDistrict(item.id);
    }
    closeModal();
  };const renderSelectorButton = (label, value, type, disabled) => {
    const isActive = !!value;
    return (
      <TouchableOpacity 
        style={[
          styles.selectorButton, 
          isActive && styles.selectorButtonActive,
          disabled && styles.selectorButtonDisabled
        ]}
        onPress={() => openModal(type)}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <View>
          <Text style={styles.selectorLabel}>{label}</Text>
          <Text style={[styles.selectorValue, !value && styles.selectorPlaceholder]}>
            {value || `Select ${label}...`}
          </Text>
        </View>
        <MaterialIcons 
          name="keyboard-arrow-down" 
          size={24} 
          color={isActive ? '#22B573' : '#A79E96'} 
        />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Cascading Selectors */}
      {renderSelectorButton('Country', country ? Country.getCountryByCode(country)?.name : null, 'country', false)}
      {renderSelectorButton('City / State', (country && city) ? State.getStateByCodeAndCountry(city, country)?.name : null, 'city', !country)}
      {renderSelectorButton('District', district, 'district', !city)}

      {/* Full Address Input */}
<View style={[styles.inputContainer, fullAddress.length > 0 && styles.inputContainerActive]}>
        <Text style={styles.selectorLabel}>Full Address</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Street, Building No, Apartment..."
          placeholderTextColor="#A79E9680"
          multiline
          numberOfLines={4}
          value={fullAddress}
          onChangeText={setFullAddress}
          keyboardAppearance="dark"
        />
      </View>

      {/* Bottom Sheet Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="none"
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView 
          style={styles.modalOverlay} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableWithoutFeedback onPress={closeModal}>
            <Animated.View style={[styles.modalBackdrop, { opacity: fadeAnim }]} />
          </TouchableWithoutFeedback>
          
          <Animated.View 
            style={[
              styles.bottomSheet,
              { transform: [{ translateY: slideAnim }] }
            ]}
          >
            <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
            
            <View style={styles.sheetContent}>
              <View style={styles.dragHandleWrapper}>
                <View style={styles.dragHandle} />
              </View>

              <Text style={styles.sheetTitle}>
                Select {modalType?.charAt(0).toUpperCase() + modalType?.slice(1)}
              </Text>

              <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#A79E96" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search..."
                  placeholderTextColor="#A79E9680"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCapitalize="words"
                  autoCorrect={false}
                  keyboardAppearance="dark"
                />
              </View>

              <ScrollView 
                style={styles.optionsList} 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 40 }}
              >
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((item, index) => (                    <TouchableOpacity 
                      key={index} 
                      style={styles.optionItem}
                      onPress={() => handleSelect(item)}
                    >
                      <Text style={styles.optionText}>{item.name}</Text>
                      <MaterialIcons name="chevron-right" size={20} color="#A79E9650" />
                    </TouchableOpacity>))
                ) : (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>No results found.</Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 16,
  },
  selectorButton: {
    backgroundColor: 'rgba(39, 42, 46, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectorButtonActive: {
    borderColor: 'rgba(0, 229, 255, 0.4)', // cyan neon subtle border
    backgroundColor: 'rgba(0, 229, 255, 0.03)',
  },
  selectorButtonDisabled: {
    opacity: 0.5,
  },
  selectorLabel: {
    color: '#A79E96', // onSurfaceVariant
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  selectorValue: {
    color: '#F6F1EC', // onSurface
    fontSize: 16,
    fontWeight: '600',
  },
  selectorPlaceholder: {
    color: '#A79E9680',
    fontWeight: '400',
  },
  inputContainer: {
    backgroundColor: 'rgba(39, 42, 46, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    minHeight: 120,
  },
  inputContainerActive: {
    borderColor: 'rgba(194, 71, 141, 0.4)', // purple neon for text input when filled
    backgroundColor: 'rgba(194, 71, 141, 0.03)',
  },
  textInput: {
    color: '#F6F1EC',
    fontSize: 15,
    marginTop: 8,
    textAlignVertical: 'top',
    flex: 1,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  bottomSheet: {
    height: SCREEN_HEIGHT * 0.7,
    backgroundColor: 'rgba(17, 20, 23, 0.85)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomWidth: 0,
    overflow: 'hidden',
  },
  sheetContent: {
    flex: 1,
    padding: 20,
  },
  dragHandleWrapper: {
    alignItems: 'center',
    marginBottom: 20,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  sheetTitle: {
    color: '#F6F1EC',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#F6F1EC',
    fontSize: 16,
  },
  optionsList: {
    flex: 1,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  optionText: {
    color: '#F6F1EC',
    fontSize: 16,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#A79E96',
    fontSize: 14,
  },
});

