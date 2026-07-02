import { useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../../../../shared';
import { personaRepository } from '../../infrastructure/repositories/SupabasePersonaRepository';
import { EngineMode } from '../../domain/types/EngineTypes';

export const useSavePersona = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const saveConfig = async (config: any, finalPrompt: string, isV2Ready: boolean, isActive: boolean, whatsappBotActive: boolean = true, socialBotActive: boolean = true) => {
    setIsLoading(true);
    setIsSuccess(false);
    setError(null);

    try {
      // 1. Session Kontrolü
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Oturum bulunamadı, lütfen tekrar giriş yapın.");
      }

      // 2. Engine Mode Belirleme
      const engineMode = isV2Ready ? EngineMode.BLUEPRINT_RENDERED : EngineMode.LEGACY_PROMPT;

      // 3. Repository Katmanını Çağırma
      await personaRepository.savePersonaConfig(
        session.user.id,
        config,
        finalPrompt,
        engineMode,
        isActive,
        whatsappBotActive,
        socialBotActive
      );

      setIsSuccess(true);
      // Başarılı olduğunda UI tarafına da ufak bir geri bildirim verebiliriz
      // Not: İsteğe bağlı olarak bu alerti UI'da da çıkarabilirsiniz.
    } catch (err: any) {
      console.error("Save Persona Error:", err);
      setError(err);
      Alert.alert('Hata', 'Ayarlar kaydedilirken bir hata oluştu: ' + err.message);
      throw err; // UI tarafının hatayı yakalayabilmesi için fırlat
    } finally {
      setIsLoading(false);
    }
  };

  return {
    saveConfig,
    isLoading,
    isSuccess,
    error
  };
};
