const fs = require('fs');

// Patch TabNavigator.js
const tabPath = 'src/core/navigation/TabNavigator.js';
let tabCode = fs.readFileSync(tabPath, 'utf8');

tabCode = tabCode.replace(
  "import { BotYonetimiScreen, SosyalMedyaScreen } from '../../modules/sosyal_medya';",
  "import { BotYonetimiScreen, SosyalMedyaScreen } from '../../modules/sosyal_medya';\nimport RandevuScreen from '../../modules/randevu/presentation/screens/RandevuScreen';"
);

const stackToAdd = "\nconst Stack = createNativeStackNavigator();\n\nfunction BotYonetimiStack() {\n  return (\n    <Stack.Navigator screenOptions={{ headerShown: false }}>\n      <Stack.Screen name=\"BotYonetimiMain\" component={BotYonetimiScreen} />\n      <Stack.Screen name=\"RandevuMain\" component={RandevuScreen} />\n    </Stack.Navigator>\n  );\n}\n";

tabCode = tabCode.replace(
  "const Stack = createNativeStackNavigator();",
  stackToAdd
);

// We know it contains Bot Yönetimi
tabCode = tabCode.replace(
  '<Tab.Screen name="Bot Yönetimi" component={BotYonetimiScreen} />',
  '<Tab.Screen name="Bot Yönetimi" component={BotYonetimiStack} />'
);

fs.writeFileSync(tabPath, tabCode, 'utf8');

// Patch BotYonetimiScreen.js
const botPath = 'src/modules/sosyal_medya/presentation/screens/BotYonetimiScreen.js';
let botCode = fs.readFileSync(botPath, 'utf8');

const targetToReplace = '              </AnimatedBorderCard>\r\n            </View>';
const targetToReplaceUnix = '              </AnimatedBorderCard>\n            </View>';

const btnToAdd = '\n            {/* Randevu Sistemi Button */}\n            <View className="mb-8 px-[20px]">\n              <AnimatedBorderCard \n                style={[styles.glowBorderCyan, { shadowColor: \'#4edea3\', borderColor: \'rgba(78, 222, 163, 0.5)\' }]} \n                colors={[\'#4edea3\', \'#131314\', \'#4edea3\', \'#131314\']}\n                padding={0}\n                borderRadius={12}\n              >\n                <CustomButton\n                  title={"Randevu Yonetimi"}\n                  onPress={() => navigation.navigate(\'RandevuMain\')}\n                  className="bg-transparent py-3 px-4"\n                  textClassName="text-[#4edea3] text-[12px] font-bold uppercase tracking-widest"\n                  leftIcon={<Ionicons name="calendar-outline" size={16} color="#4edea3" />}\n                />\n              </AnimatedBorderCard>\n            </View>\n';

if (botCode.includes(targetToReplace)) {
  botCode = botCode.replace(targetToReplace, targetToReplace + btnToAdd);
} else if (botCode.includes(targetToReplaceUnix)) {
  botCode = botCode.replace(targetToReplaceUnix, targetToReplaceUnix + btnToAdd);
}

fs.writeFileSync(botPath, botCode, 'utf8');
console.log("Patched successfully");
