import { useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../../../../shared';
import { personaRepository } from '../../infrastructure/repositories/SupabasePersonaRepository';

// "Tek Yapı" refactor (Eylül 2026): finalPrompt/isV2Ready/engineMode parametreleri
// kaldırıldı — bunlar sadece artık silinmiş olan client-side prompt hesaplama
// katmanının (OrchestrationEngine) çıktısıydı ve SupabasePersonaRepository artık
// bunları hiçbir yere yazmıyor (bkz. savePersonaConfig'teki güncel not).
export const useSavePersona = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const saveConfig = async (config: any, isActive: boolean, whatsappBotActive: boolean = true, socialBotActive: boolean = true) => {
    setIsLoading(true);
    setIsSuccess(false);
    setError(null);

    try {
      // 1. Session Kontrolü
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Oturum bulunamadı, lütfen tekrar giriş yapın.");
      }

      // 2. Repository Katmanını Çağırma
      await personaRepository.savePersonaConfig(
        session.user.id,
        config,
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
