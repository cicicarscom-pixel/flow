const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'SosyalMedyaScreen.js');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Insert PLATFORMS_DATA after Dimensions
const dimensionStr = "const { width } = Dimensions.get('window');";
const platformDataStr = `
const PLATFORMS_DATA = [
  { id: "facebook", name: "Facebook", color: "#1877F2", glow: "rgba(24,119,242,0.3)", icon: "logo-facebook" },
  { id: "instagram", name: "Instagram", color: "#E1306C", glow: "rgba(225,48,108,0.3)", icon: "logo-instagram" },
  { id: "linkedin", name: "LinkedIn", color: "#0A66C2", glow: "rgba(10,102,194,0.3)", icon: "logo-linkedin" },
  { id: "twitter", name: "X", color: "#ffffff", glow: "rgba(255,255,255,0.3)", icon: "logo-twitter" },
  { id: "tiktok", name: "TikTok", color: "#ffffff", glow: "rgba(255,255,255,0.3)", icon: "logo-tiktok" },
  { id: "youtube", name: "YouTube", color: "#FF0000", glow: "rgba(255,0,0,0.3)", icon: "logo-youtube" },
  { id: "pinterest", name: "Pinterest", color: "#E60023", glow: "rgba(230,0,35,0.3)", icon: "logo-pinterest" },
  { id: "googlebusiness", name: "GBP", color: "#4285F4", glow: "rgba(66,133,244,0.3)", icon: "business" },
  { id: "reddit", name: "Reddit", color: "#FF4500", glow: "rgba(255,69,0,0.3)", icon: "logo-reddit" },
  { id: "telegram", name: "Telegram", color: "#2AABEE", glow: "rgba(42,171,238,0.3)", icon: "paper-plane" },
  { id: "bluesky", name: "Bluesky", color: "#0085ff", glow: "rgba(0,133,255,0.3)", icon: "cloud" },
  { id: "threads", name: "Threads", color: "#ffffff", glow: "rgba(255,255,255,0.3)", icon: "at" },
  { id: "snapchat", name: "Snapchat", color: "#fffc00", glow: "rgba(255,252,0,0.3)", icon: "logo-snapchat" },
  { id: "whatsapp", name: "WhatsApp", color: "#25D366", glow: "rgba(37,211,102,0.3)", icon: "logo-whatsapp" },
  { id: "discord", name: "Discord", color: "#5865F2", glow: "rgba(88,101,242,0.3)", icon: "logo-discord" },
  { id: "meta_ads", name: "Meta Ads", color: "#0668E1", glow: "rgba(6,104,225,0.3)", icon: "megaphone", isAd: true },
  { id: "google_ads", name: "Google Ads", color: "#EA4335", glow: "rgba(234,67,53,0.3)", icon: "logo-google", isAd: true },
  { id: "linkedin_ads", name: "LinkedIn Ads", color: "#0A66C2", glow: "rgba(10,102,194,0.3)", icon: "logo-linkedin", isAd: true },
  { id: "tiktok_ads", name: "TikTok Ads", color: "#ffffff", glow: "rgba(255,255,255,0.3)", icon: "logo-tiktok", isAd: true },
  { id: "pinterest_ads", name: "Pinterest Ads", color: "#E60023", glow: "rgba(230,0,35,0.3)", icon: "logo-pinterest", isAd: true },
  { id: "x_ads", name: "X Ads", color: "#ffffff", glow: "rgba(255,255,255,0.3)", icon: "close", isAd: true },
];
`;
content = content.replace(dimensionStr, dimensionStr + platformDataStr);

// 2. Replace Add Account Panel
const addAccountStart = '{/* Add Account Panel */}';
const yourAccountsStart = '<View className="flex-row justify-between items-center mt-2 mb-4">';

const newAddAccount = `        {/* Add Account Panel */}
        <View style={{ marginBottom: 32 }}>
          <Text className="text-[#F3F4F6] text-[18px] font-semibold mb-4">{t('sosyalMedya.ui.addAccount')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16, paddingRight: 20, paddingLeft: 4 }}>
            {PLATFORMS_DATA.map((p) => {
               const isConnected = socialAccounts.some(acc => acc.platform.toLowerCase() === p.id);
               if (isConnected) return null; // Zaten bağlıysa gösterme
               return (
                 <View
                   key={p.id}
                   style={{
                     width: 140,
                     backgroundColor: 'rgba(32, 31, 34, 0.4)',
                     borderRadius: 16,
                     padding: 14,
                     marginRight: 12,
                     borderWidth: 1,
                     borderColor: p.glow.replace('0.3', '0.4'),
                     shadowColor: p.color,
                     shadowOffset: { width: 0, height: 0 },
                     shadowOpacity: 0.3,
                     shadowRadius: 10,
                     elevation: 5,
                   }}
                 >
                   <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                     <View style={{
                       width: 36, height: 36, borderRadius: 12,
                       backgroundColor: p.id === 'instagram' ? '#1A1D26' : p.color,
                       alignItems: 'center', justifyContent: 'center',
                     }}>
                       {p.id === 'instagram' ? (
                          <LinearGradient
                            colors={['#f09433','#e6683c','#dc2743','#cc2366','#bc1888']}
                            style={{ width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                          >
                             <Ionicons name={p.icon} size={20} color="#fff" />
                          </LinearGradient>
                       ) : (
                         <Ionicons name={p.icon} size={20} color={p.color === '#ffffff' ? '#000' : '#fff'} />
                       )}
                     </View>
                   </View>
                   
                   <Text style={{ fontWeight: '600', fontSize: 13, color: '#F3F4F6', marginBottom: 4 }}>{p.name}</Text>
                   <Text style={{ color: '#9CA3AF', fontSize: 10, marginBottom: 12 }}>Henüz bağlanmadı</Text>
                   
                   <TouchableOpacity 
                     onPress={() => handleConnectZernio(p.id)}
                     style={{ 
                       width: '100%', alignItems: 'center', justifyContent: 'center',
                       backgroundColor: p.glow.replace('0.3', '0.15'),
                       borderColor: p.glow.replace('0.3', '0.4'),
                       borderWidth: 1,
                       borderRadius: 8,
                       paddingVertical: 6,
                     }}
                   >
                     <Text style={{ color: p.color, fontSize: 10, fontWeight: '600' }}>+ Hesap Bağla</Text>
                   </TouchableOpacity>
                 </View>
               );
            })}
          </ScrollView>
        </View>

        `;

content = content.substring(0, content.indexOf(addAccountStart)) + newAddAccount + content.substring(content.indexOf(yourAccountsStart));


// 3. Replace Main Platform Hub Panel
const mainHubStart = '{/* Main Platform Hub Panel */}';
const scrollViewEnd = '</ScrollView>';

const newMainHub = `        {/* Main Platform Hub Panel */}
        <View style={{ marginBottom: 40 }}>
          {isLoadingAccounts ? (
            <ActivityIndicator size="small" color="#22C55E" style={{ marginVertical: 20 }} />
          ) : socialAccounts.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16, paddingRight: 20, paddingLeft: 4 }}>
              {socialAccounts.map((acc, index) => {
                const platformInfo = PLATFORMS_DATA.find(p => p.id === acc.platform.toLowerCase()) || {
                  id: acc.platform, name: acc.platform, color: '#22D3EE', glow: 'rgba(34, 211, 238,0.3)', icon: 'logo-edge'
                };
                
                return (
                 <View
                   key={acc.id || index.toString()}
                   style={{
                     width: 140,
                     backgroundColor: 'rgba(32, 31, 34, 0.4)',
                     borderRadius: 16,
                     padding: 14,
                     marginRight: 12,
                     borderWidth: 1,
                     borderColor: platformInfo.glow.replace('0.3', '0.4'),
                     shadowColor: platformInfo.color,
                     shadowOffset: { width: 0, height: 0 },
                     shadowOpacity: 0.3,
                     shadowRadius: 10,
                     elevation: 5,
                   }}
                 >
                   <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                     <View style={{
                       width: 36, height: 36, borderRadius: 12,
                       backgroundColor: platformInfo.id === 'instagram' ? '#1A1D26' : platformInfo.color,
                       alignItems: 'center', justifyContent: 'center',
                     }}>
                       {platformInfo.id === 'instagram' ? (
                          <LinearGradient
                            colors={['#f09433','#e6683c','#dc2743','#cc2366','#bc1888']}
                            style={{ width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                          >
                             <Ionicons name={platformInfo.icon} size={20} color="#fff" />
                          </LinearGradient>
                       ) : (
                         <Ionicons name={platformInfo.icon} size={20} color={platformInfo.color === '#ffffff' ? '#000' : '#fff'} />
                       )}
                     </View>
                     
                     <View style={{ 
                       paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12,
                       backgroundColor: 'rgba(34, 197, 94,0.15)',
                       borderColor: 'rgba(34, 197, 94,0.3)', borderWidth: 1
                     }}>
                       <Text style={{ fontSize: 9, color: '#22C55E', fontWeight: '600' }}>✓ Bağlı</Text>
                     </View>
                   </View>
                   
                   <Text style={{ fontWeight: '600', fontSize: 13, color: '#F3F4F6', marginBottom: 4 }} numberOfLines={1}>
                     {acc.account_name ? \`@\${acc.account_name}\` : platformInfo.name}
                   </Text>
                   <Text style={{ color: '#9CA3AF', fontSize: 10, marginBottom: 12 }}>Bağlı</Text>
                   
                   <TouchableOpacity 
                     onPress={() => handleDisconnect(acc.id, acc.platform)}
                     style={{ 
                       width: '100%', alignItems: 'center', justifyContent: 'center',
                       backgroundColor: 'rgba(255,255,255,0.05)',
                       borderColor: 'rgba(255,255,255,0.1)',
                       borderWidth: 1,
                       borderRadius: 8,
                       paddingVertical: 6,
                     }}
                   >
                     <Text style={{ color: '#9CA3AF', fontSize: 10, fontWeight: '600' }}>Ayır</Text>
                   </TouchableOpacity>
                 </View>
                );
              })}
            </ScrollView>
          ) : (
            <View style={[styles.glassCard, { padding: 20, borderRadius: 16 }]}>
              <Text className="text-[#9CA3AF] text-[12px] italic">{t('sosyalMedya.ui.noAccountsYet')}</Text>
            </View>
          )}
        </View>`;

content = content.substring(0, content.indexOf(mainHubStart)) + newMainHub + "\n\n" + content.substring(content.lastIndexOf(scrollViewEnd) + scrollViewEnd.length);


fs.writeFileSync(filePath, content, 'utf-8');
console.log("Replacement completed successfully.");
