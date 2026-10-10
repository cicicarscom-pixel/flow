import { useTranslation } from 'react-i18next';
import { View, Text, StyleSheet, ImageBackground, DeviceEventEmitter } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlobalAppBar } from '../../../../shared';
import BildirimlerScreen from '../../../../screens/BildirimlerScreen';
import { MesajlarTab } from './inbox/MesajlarTab';
import { DegerlendirmelerTab } from './inbox/DegerlendirmelerTab';
import { YorumlarTab } from './inbox/YorumlarTab';


const Tab = createMaterialTopTabNavigator();

// Dört sekme dar ekrana sığsın diye etiket tek satır; gerekirse yazı küçülür.
const renderTabLabel = (text) => {
  const TabLabel = ({ color }) => (
    <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} style={{ color, fontSize: 11, fontWeight: 'bold' }}>{text}</Text>
  );
  return TabLabel;
};

// MAIN SCREEN

const BildirimlerTab = ({ navigation }) => {
  return <BildirimlerScreen navigation={navigation} isTab={true} />;
};

export default function InboxScreen({ navigation }) {
  const { t } = useTranslation();
  return (
    <SafeAreaView className="flex-1 bg-[#17151A]" edges={['top', 'left', 'right']}>
      {/* Cybernetic Background */}
      <ImageBackground 
        source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDUpjAKmMNnHDAuGn7KDAmiX4BVuWBLEG-5a7fHFVu_x7Jxrfh8UzY6rM-oy3AiqN0b1h6_K5iobCNsv2B4iHnz_lPjQ6QXfGvJ4UZmCcQLcr6H8o6m3I1JVFmgqk7UubXZx96-wpkV8-ScZZBzzkpl4-_WMzeHLyFljEKugxDZQXZgdkjst86sxa7hU95rBimeOBSnqHbdwH9bj_yj1tbla3T_HPG2xI6XkgTpyJRiDhmg9Po0q7NWy9DKn3JnR0b5tcpUj4Vcxr3w' }}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      >
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(10, 10, 11, 0.85)' }]} />
      </ImageBackground>

      {/* App Bar */}
      <GlobalAppBar 
        level={3} 
        module="sosyal" 
        title={t('sosyalMedya.ui.inbox')} 
        actions={[
          { icon: 'sync', onPress: () => DeviceEventEmitter.emit('REFRESH_INBOX') }
        ]} 
      />

      <Tab.Navigator
        screenOptions={{
          sceneStyle: { backgroundColor: 'transparent' },
          tabBarStyle: { backgroundColor: 'transparent', elevation: 0, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
          tabBarActiveTintColor: '#22B573',
          tabBarInactiveTintColor: '#A79E96',
          tabBarIndicatorStyle: { backgroundColor: '#22B573', height: 3, borderRadius: 4 },
          tabBarItemStyle: { paddingHorizontal: 2 },
          tabBarLabelStyle: { fontSize: 11, fontWeight: 'bold', textTransform: 'none' },
        }}
      >
        <Tab.Screen name="Mesajlar" component={MesajlarTab} options={{ tabBarLabel: renderTabLabel(t('sosyalMedya.inbox.tabs.messages')) }} />
        <Tab.Screen name="Yorumlar" component={YorumlarTab} options={{ tabBarLabel: renderTabLabel(t('sosyalMedya.inbox.tabs.comments')) }} />
        <Tab.Screen name="Bildirimler" component={BildirimlerTab} options={{ tabBarLabel: renderTabLabel(t('sosyalMedya.inbox.tabs.notifications')) }} />
        <Tab.Screen name="Değerlendirmeler" component={DegerlendirmelerTab} options={{ tabBarLabel: renderTabLabel(t('sosyalMedya.inbox.tabs.reviews')) }} />
      </Tab.Navigator>
    </SafeAreaView>
  );
}

