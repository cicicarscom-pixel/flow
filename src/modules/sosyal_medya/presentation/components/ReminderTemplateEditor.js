import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { supabase, CustomButton } from '../../../../shared';

// WhatsApp randevu hatırlatma metni: işletme kendi metnini yazar, mesaj dilini seçer.
// Doğrulama ve varsayılan metinler veritabanındadır (get_reminder_settings / set_reminder_template).
// Hitap (Sayın / Mr. / Herr…) kodda sabit DEĞİLDİR; isteyen metne kendisi yazar.

const LOCALES = [['tr', 'Türkçe'], ['en', 'English'], ['de', 'Deutsch'], ['fr', 'Français'], ['es', 'Español']];
const PLACEHOLDERS = ['name', 'first_name', 'business', 'date', 'time', 'doctor', 'service'];
const SAMPLES = {
  tr: { name: 'Ayşe Demir', first_name: 'Ayşe', business: 'İşletmeniz', date: '9 Ekim Cuma', time: '10:30', doctor: 'Dr. Mehmet Kaya', service: 'Kontrol' },
  en: { name: 'Alex Morgan', first_name: 'Alex', business: 'Your Business', date: 'Friday 9 October', time: '10:30', doctor: 'Dr. Jane Smith', service: 'Check-up' },
  de: { name: 'Anna Müller', first_name: 'Anna', business: 'Ihre Praxis', date: 'Freitag, 9. Oktober', time: '10:30', doctor: 'Dr. Lena Schmidt', service: 'Kontrolle' },
  fr: { name: 'Claire Martin', first_name: 'Claire', business: 'Votre cabinet', date: 'vendredi 9 octobre', time: '10:30', doctor: 'Dr Marie Dubois', service: 'Contrôle' },
  es: { name: 'Lucía Pérez', first_name: 'Lucía', business: 'Su clínica', date: 'viernes, 9 de octubre', time: '10:30', doctor: 'Dra. Ana Ruiz', service: 'Revisión' },
};

function renderPreview(text, locale) {
  const s = SAMPLES[locale] || SAMPLES.en;
  return String(text || '').replace(/\{([A-Za-z_]+)\}/g, (m, k) => (k in s ? s[k] : m));
}

export default function ReminderTemplateEditor() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [defaults, setDefaults] = useState({});
  const [locale, setLocale] = useState('en');
  const [text, setText] = useState('');
  const [savedKey, setSavedKey] = useState(null);
  const [justSaved, setJustSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const selection = useRef({ start: 0, end: 0 });

  const formKey = JSON.stringify([locale, text]);
  const isDirty = savedKey !== null && formKey !== savedKey;

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await supabase.rpc('get_reminder_settings');
        if (!alive || data?.status !== 'SUCCESS') return;
        const loc = data.locale || 'en';
        const initial = data.template || data.defaults?.[loc] || '';
        setDefaults(data.defaults || {});
        setLocale(loc);
        setText(initial);
        setSavedKey(JSON.stringify([loc, initial]));
      } catch (e) {
        console.warn('Reminder template load error', e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (isDirty) setJustSaved(false);
  }, [isDirty]);

  const changeLocale = (next) => {
    if (next === locale) return;
    // Metin hâlâ eski dilin varsayılanıysa yeni dilin varsayılanına geç; özel metin korunur.
    if (text.trim() === String(defaults[locale] || '').trim() && defaults[next]) setText(defaults[next]);
    setLocale(next);
  };

  const insertPlaceholder = (key) => {
    const token = `{${key}}`;
    const { start, end } = selection.current;
    const s = Math.min(start, text.length);
    const e = Math.min(Math.max(end, s), text.length);
    setText(text.slice(0, s) + token + text.slice(e));
    const pos = s + token.length;
    selection.current = { start: pos, end: pos };
  };

  const handleSave = async () => {
    const keyAtSave = formKey;
    setSaving(true);
    setError('');
    try {
      const isDefault = text.trim() === String(defaults[locale] || '').trim();
      const { data, error: rpcError } = await supabase.rpc('set_reminder_template', {
        p_template: isDefault ? null : text,
        p_locale: locale,
      });
      if (rpcError || !data) throw new Error('rpc');
      if (data.status === 'SUCCESS') {
        setSavedKey(keyAtSave);
        setJustSaved(true);
      } else if (data.status === 'FORBIDDEN') {
        setError(t('reminders.ownerOnly'));
      } else if (data.status === 'UNKNOWN_PLACEHOLDER') {
        setError(t('reminders.unknownPlaceholder', { list: (data.unknown || []).map((k) => `{${k}}`).join(', ') }));
      } else if (data.status === 'TEMPLATE_TOO_LONG') {
        setError(t('reminders.tooLong'));
      } else {
        setError(t('reminders.saveFailed'));
      }
    } catch {
      setError(t('reminders.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  if (loading || savedKey === null) return null;

  return (
    <View className="border-t border-white/5 pt-4">
      <Text className="text-white text-sm font-bold mb-2">{t('reminders.languageLabel')}</Text>
      <View className="flex-row flex-wrap mb-4">
        {LOCALES.map(([code, label]) => (
          <TouchableOpacity
            key={code}
            onPress={() => changeLocale(code)}
            className={`px-3 py-2 rounded-lg mr-2 mb-2 border ${locale === code ? 'bg-[#22B573]/20 border-[#22B573]' : 'bg-white/5 border-white/10'}`}
          >
            <Text className={`text-xs ${locale === code ? 'text-white font-bold' : 'text-gray-300'}`}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text className="text-white text-sm font-bold mb-2">{t('reminders.messageLabel')}</Text>
      <TextInput
        value={text}
        onChangeText={setText}
        onSelectionChange={(e) => { selection.current = e.nativeEvent.selection; }}
        multiline
        maxLength={700}
        textAlignVertical="top"
        className="text-white text-xs bg-white/5 border border-white/10 rounded-lg p-3"
        style={{ minHeight: 150 }}
      />
      <Text className="text-gray-500 text-[10px] mt-1 mb-3">{text.length}/700</Text>

      <Text className="text-gray-400 text-[10px] mb-2">{t('reminders.placeholdersHint')}</Text>
      <View className="flex-row flex-wrap mb-3">
        {PLACEHOLDERS.map((k) => (
          <TouchableOpacity key={k} onPress={() => insertPlaceholder(k)} className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 mr-2 mb-2">
            <Text className="text-[#00DAF3] text-[11px]">{`{${k}}`}</Text>
            <Text className="text-gray-500 text-[9px]">{t(`reminders.ph.${k}`)}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text className="text-gray-400 text-[10px] leading-3 mb-4">{t('reminders.honorificHint')}</Text>

      <Text className="text-white text-sm font-bold mb-2">{t('reminders.previewLabel')}</Text>
      <View className="bg-[#1F2C34] rounded-xl p-3 mb-4">
        <Text className="text-gray-100 text-xs leading-5">{renderPreview(text, locale)}</Text>
      </View>

      {error ? <Text className="text-[#FF7A59] text-xs mb-3">{error}</Text> : null}

      <CustomButton
        title={justSaved && !isDirty ? t('reminders.saved') : t('reminders.save')}
        onPress={handleSave}
        isLoading={saving}
        disabled={!isDirty}
        className="mb-2"
      />
      <TouchableOpacity onPress={() => { if (defaults[locale]) setText(defaults[locale]); }} className="items-center py-2">
        <Text className="text-gray-400 text-xs">{t('reminders.resetDefault')}</Text>
      </TouchableOpacity>
    </View>
  );
}
