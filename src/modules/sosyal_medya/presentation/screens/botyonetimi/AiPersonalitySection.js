import React from 'react';
import { View, Animated, Text, ScrollView, Alert, TouchableOpacity, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PersonaAvatarCard, ROLES, ROLE_I18N_KEY_BY_ID, MOODS, MOOD_I18N_KEY_BY_ID, DialSlider } from '../../../../persona_engine';
import { supabase } from '../../../../../shared';
import { Ionicons } from '@expo/vector-icons';

export function AiPersonalitySection({ addRoleOpen, customRoles, humorLevel, modernAdaptation, newRoleText, personaIntensity, personas, personasLoading, promptConfig, rgbSpin, setAddRoleOpen, setCustomRole, setCustomRoles, setHumorLevel, setIsSaveBtnActive, setModernAdaptation, setMood, setNewRoleText, setPersona, setPersonaIntensity, setRole, t }) {
  return (
    <View style={{
      overflow: 'hidden',
      padding: 2, 
      borderRadius: 20,
      marginBottom: 16,
      shadowColor: '#FF7A59',
      shadowOpacity: 0.35,
      shadowRadius: 20,
      elevation: 10,
    }}>
      <Animated.View style={{ 
        position: 'absolute',
        top: '50%', left: '50%',
        width: 1500, height: 1500,
        marginTop: -750, marginLeft: -750,
        transform: [{ rotate: rgbSpin }],
      }}>
        <LinearGradient
          colors={['#22B573', '#FF7A59', '#C2478D', '#FF7A59', '#22B573']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
    
      <View style={{ backgroundColor: '#2A2631', borderRadius: 16 }} className="p-4">
        <Text className="text-white text-sm font-bold mb-3">{t('personas.title')}</Text>
    
      {/* 1. 👔 Roller (Sektör) — Faz 2: web'deki gibi portre kart
          carousel'i (PersonaAvatarCard), eski pill/chip yerine.
          i18n Faz 2: `label` artık role.title (Türkçe sabit) değil,
          ROLE_I18N_KEY_BY_ID ile personas.roles.* çevirisinden
          üretiliyor — role.id hiç değişmiyor (bkz. roles.ts notu). */}
      <View className="mb-4">
        <Text className="text-white/40 text-[9px] font-bold uppercase tracking-wider mb-1.5">{t('personas.businessRole')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <PersonaAvatarCard
            label={t('personas.addRole.card')}
            icon="➕"
            accentColor="#22B573"
            selected={addRoleOpen}
            onPress={() => setAddRoleOpen(v => !v)}
          />
          {(() => {
            const inList = customRoles.some(r => r.label === promptConfig.customRoleText);
            const orphan = promptConfig.roleId === 'custom' && promptConfig.customRoleText && !inList
              ? [{ id: '__current', label: promptConfig.customRoleText }] : [];
            const askRemove = (r) => {
              Alert.alert(t('personas.addRole.remove'), t('personas.addRole.confirm', { name: r.label }), [
                { text: t('personas.addRole.cancel'), style: 'cancel' },
                { text: t('personas.addRole.remove'), style: 'destructive', onPress: async () => {
                  const { error } = await supabase.from('custom_business_roles').delete().eq('id', r.id);
                  if (error) return;
                  setCustomRoles(list => list.filter(x => x.id !== r.id));
                  if (promptConfig.roleId === 'custom' && promptConfig.customRoleText === r.label) { setCustomRole(''); setIsSaveBtnActive(true); }
                } },
              ]);
            };
            return [...orphan, ...customRoles].map(r => (
              <View key={r.id} style={{ position: 'relative' }}>
                <PersonaAvatarCard
                  label={r.label}
                  icon="🏷️"
                  accentColor="#FF7A59"
                  selected={promptConfig.roleId === 'custom' && promptConfig.customRoleText === r.label}
                  onPress={() => { setCustomRole(r.label); setIsSaveBtnActive(true); }}
                />
                {r.id !== '__current' ? (
                  <TouchableOpacity
                    onPress={() => askRemove(r)}
                    accessibilityLabel={t('personas.addRole.remove')}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={{ position: 'absolute', top: 2, right: 6, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' }}
                  >
                    <Ionicons name="close" size={14} color="#fff" />
                  </TouchableOpacity>
                ) : null}
              </View>
            ));
          })()}
          {ROLES.map(role => (
            <PersonaAvatarCard
              key={role.id}
              label={t(`personas.roles.${ROLE_I18N_KEY_BY_ID[role.id]}`)}
              icon={role.icon}
              avatarUrl={role.avatarUrl}
              accentColor="#FF7A59"
              selected={promptConfig.roleId === role.id}
              onPress={() => { setRole(role.id); setIsSaveBtnActive(true); }}
            />
          ))}
        </ScrollView>
      </View>
    
      {addRoleOpen && (
        <View className="bg-black/40 border border-white/5 rounded-xl p-2 mb-4">
          <TextInput
            value={newRoleText}
            onChangeText={setNewRoleText}
            placeholder={t('personas.addRole.placeholder')}
            placeholderTextColor="#A79E96"
            maxLength={60}
            autoFocus
            style={{ color: '#F6F1EC', fontSize: 12, paddingVertical: 4, paddingHorizontal: 8 }}
          />
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 6 }}>
            <TouchableOpacity onPress={() => { setAddRoleOpen(false); setNewRoleText(''); }} style={{ paddingVertical: 8, paddingHorizontal: 14, marginRight: 8 }}>
              <Text style={{ color: '#A79E96', fontWeight: '600' }}>{t('personas.addRole.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              disabled={!newRoleText.trim()}
              onPress={async () => {
                const label = newRoleText.replace(/\s+/g, ' ').trim().slice(0, 60);
                if (!label) return;
                const existing = customRoles.find(r => r.label.toLowerCase() === label.toLowerCase());
                if (existing) { setCustomRole(existing.label); setIsSaveBtnActive(true); setAddRoleOpen(false); setNewRoleText(''); return; }
                const { data, error } = await supabase.from('custom_business_roles').insert({ label }).select('id, label').single();
                if (error || !data) { Alert.alert(t('sosyalMedya.alerts.error'), t('personas.addRole.error')); return; }
                setCustomRoles(r => [...r, data]);
                setCustomRole(data.label);
                setIsSaveBtnActive(true);
                setAddRoleOpen(false);
                setNewRoleText('');
              }}
              style={{ paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10, backgroundColor: '#22B573', opacity: newRoleText.trim() ? 1 : 0.5 }}
            >
              <Text style={{ color: '#fff', fontWeight: '800' }}>{t('personas.addRole.save')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    
      {/* 2. 🧠 Personalar (Karakter) — artık web ile aynı kaynaktan
          (ai_personas) canlı çekiliyor. "Standart" kartı web'deki
          gibi DB'ye bağlı olmayan, sabit/senkron bir kart:
          promptConfig.personaId boşsa (kayıtlı persona yoksa)
          seçili görünür. */}
      <View className="mb-4">
        <Text className="text-white/40 text-[9px] font-bold uppercase tracking-wider mb-1.5">{t('personas.character')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <PersonaAvatarCard
            label={t('personas.standardLabel')}
            icon="🤖"
            accentColor="#C2478D"
            selected={!promptConfig.personaId}
            onPress={() => { setPersona(''); setIsSaveBtnActive(true); }}
          />
    
          {personasLoading && (
            <Text className="text-[11px] text-gray-400 self-center px-2">{t('personas.loading')}</Text>
          )}
    
          {!personasLoading && personas.length === 0 && (
            <Text className="text-[11px] text-gray-400 self-center px-2">{t('personas.empty')}</Text>
          )}
    
          {personas.map(persona => (
            <PersonaAvatarCard
              key={persona.slug}
              label={persona.name}
              icon={persona.icon}
              avatarUrl={persona.avatarUrl}
              accentColor="#C2478D"
              selected={promptConfig.personaId === persona.slug}
              onPress={() => { setPersona(persona.slug); setIsSaveBtnActive(true); }}
            />
          ))}
        </ScrollView>
      </View>
    
      {/* 3. 🎭 Mood / Üslup — i18n Faz 2: `label` artık mood.title
          değil, MOOD_I18N_KEY_BY_ID ile personas.tones.*
          çevirisinden üretiliyor — mood.id hiç değişmiyor. */}
      <View style={{ marginBottom: promptConfig.personaId ? 16 : 0 }}>
        <Text className="text-white/40 text-[9px] font-bold uppercase tracking-wider mb-1.5">{t('personas.tone')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {MOODS.map(mood => (
            <PersonaAvatarCard
              key={mood.id}
              label={t(`personas.tones.${MOOD_I18N_KEY_BY_ID[mood.id]}`)}
              icon={mood.icon}
              avatarUrl={mood.avatarUrl}
              accentColor="#F59E0B"
              selected={promptConfig.moodId === mood.id}
              onPress={() => { setMood(mood.id); setIsSaveBtnActive(true); }}
            />
          ))}
        </ScrollView>
      </View>
    
      {/* 4. 🎚️ Karakter Ayarları (kadranlar) — web'deki showDials
          mantığıyla birebir aynı: sadece gerçek bir karakter
          seçiliyken (Standart değilken) görünür. Faz 2'de eklendi;
          daha önce mobilde bu üç kadran hiç yoktu. */}
      {!!promptConfig.personaId && (
        <View style={{ paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' }}>
          <Text className="text-white/40 text-[9px] font-bold uppercase tracking-wider mb-3">{t('personas.characterSettings')}</Text>
          <DialSlider
            label={t('personas.sliders.characterIntensity')}
            value={personaIntensity}
            onChange={(v) => { setPersonaIntensity(v); setIsSaveBtnActive(true); }}
            accentColor="#C2478D"
          />
          <DialSlider
            label={t('personas.sliders.humorLevel')}
            value={humorLevel}
            onChange={(v) => { setHumorLevel(v); setIsSaveBtnActive(true); }}
            accentColor="#F59E0B"
          />
          <DialSlider
            label={t('personas.sliders.modernAdaptation')}
            value={modernAdaptation}
            onChange={(v) => { setModernAdaptation(v); setIsSaveBtnActive(true); }}
            accentColor="#22B573"
          />
        </View>
      )}
    </View>
    </View>
  );
}
