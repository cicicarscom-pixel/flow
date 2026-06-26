const fs = require('fs');

// 1. Patch TabNavigator.js - Add RandevuScreen import and BotYonetimiStack
const tabPath = 'src/core/navigation/TabNavigator.js';
let tabCode = fs.readFileSync(tabPath, 'utf8');

// Add import for RandevuScreen after the existing imports
tabCode = tabCode.replace(
  "import { AiMuhasebeScreen } from '../../modules/muhasebe';",
  "import { AiMuhasebeScreen } from '../../modules/muhasebe';\nimport RandevuScreen from '../../modules/randevu/presentation/screens/RandevuScreen';"
);

// Add BotYonetimiStack function before the existing AiMuhasebeStack
tabCode = tabCode.replace(
  "function AiMuhasebeStack() {",
  "function BotYonetimiStack() {\n  return (\n    <Stack.Navigator screenOptions={{ headerShown: false }}>\n      <Stack.Screen name=\"BotYonetimiMain\" component={BotYonetimiScreen} />\n      <Stack.Screen name=\"RandevuMain\" component={RandevuScreen} />\n    </Stack.Navigator>\n  );\n}\n\nfunction AiMuhasebeStack() {"
);

// Replace BotYonetimiScreen component with BotYonetimiStack in Tab.Screen
tabCode = tabCode.replace(
  'component={BotYonetimiScreen} />',
  'component={BotYonetimiStack} />'
);

fs.writeFileSync(tabPath, tabCode, 'utf8');
console.log('TabNavigator.js patched successfully');

// 2. Patch BotYonetimiScreen.js - Add Randevu button at the bottom
const botPath = 'src/modules/sosyal_medya/presentation/screens/BotYonetimiScreen.js';
let botCode = fs.readFileSync(botPath, 'utf8');

// Find the last </AnimatedBorderCard> closing followed by </View>
// We need to add button AFTER the last content block but before the closing of the scroll area
const insertTarget = '            </AnimatedBorderCard>\n            </View>';
const insertTargetCRLF = '            </AnimatedBorderCard>\r\n            </View>';

const randevuButton = `
            {/* Randevu Sistemi Button */}
            <View className="mb-8 px-[20px]">
              <AnimatedBorderCard 
                style={[styles.glowBorderCyan, { shadowColor: '#4edea3', borderColor: 'rgba(78, 222, 163, 0.5)' }]} 
                colors={['#4edea3', '#131314', '#4edea3', '#131314']}
                padding={0}
                borderRadius={12}
              >
                <CustomButton
                  title={"Randevu Yonetimi"}
                  onPress={() => navigation.navigate('RandevuMain')}
                  className="bg-transparent py-3 px-4"
                  textClassName="text-[#4edea3] text-[12px] font-bold uppercase tracking-widest"
                  leftIcon={<Ionicons name="calendar-outline" size={16} color="#4edea3" />}
                />
              </AnimatedBorderCard>
            </View>`;

// Find last occurrence
const lastIdxCRLF = botCode.lastIndexOf(insertTargetCRLF);
const lastIdxLF = botCode.lastIndexOf(insertTarget);
const lastIdx = Math.max(lastIdxCRLF, lastIdxLF);

if (lastIdx !== -1) {
  const target = lastIdxCRLF > lastIdxLF ? insertTargetCRLF : insertTarget;
  const insertPos = lastIdx + target.length;
  botCode = botCode.substring(0, insertPos) + '\n' + randevuButton + botCode.substring(insertPos);
  fs.writeFileSync(botPath, botCode, 'utf8');
  console.log('BotYonetimiScreen.js patched successfully');
} else {
  console.log('Could not find insertion point in BotYonetimiScreen.js');
}

console.log('All patches applied!');
