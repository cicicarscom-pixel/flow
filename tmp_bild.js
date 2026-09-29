
  
  // MAIN SCREEN
  
> const BildirimlerTab = ({ navigation }) => {
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
        >
          <Tab.Screen name="Mesajlar" component={MesajlarTab} options={{ tabBarLabel: t('sosyalMedya.inbox.tabs.messages') }} />
          <Tab.Screen name="Yorumlar" component={YorumlarTab} options={{ tabBarLabel: t('sosyalMedya.inbox.tabs.comments') }} />
>         <Tab.Screen name="Bildirimler" component={BildirimlerTab} options={{ tabBarLabel: 'Bildirimler' }} />
          <Tab.Screen name="Değerlendirmeler" component={DegerlendirmelerTab} options={{ tabBarLabel: t('sosyalMedya.inbox.tabs.reviews') }} />
        </Tab.Navigator>
      </SafeAreaView>
    );
  }
  
  const styles = StyleSheet.create({
    tabContainer: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    glassCard: {
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.15)',
    }
  });
  

