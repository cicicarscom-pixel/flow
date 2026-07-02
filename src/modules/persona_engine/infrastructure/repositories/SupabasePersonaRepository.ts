import { supabase } from '../../../../shared';

export class SupabasePersonaRepository {
  /**
   * Kullanıcının prompt konfigürasyonunu ve nihai metnini veritabanına kaydeder/günceller.
   */
  async savePersonaConfig(userId: string, config: object, finalPrompt: string, engineMode: string, isActive: boolean, whatsappBotActive: boolean = true, socialBotActive: boolean = true): Promise<any> {
    if (!userId) throw new Error("User ID is required");

    try {
      // Önce mevcut kaydı kontrol et
      const { data: existingData, error: fetchError } = await supabase
        .from('bot_settings')
        .select('id')
        .eq('merchant_id', userId)
        .limit(1);
        
      if (fetchError) throw fetchError;

      const payload = {
        system_prompt: finalPrompt,
        prompt_config: config,
        engine_mode: engineMode,
        is_active: isActive,
        whatsapp_bot_active: whatsappBotActive,
        social_bot_active: socialBotActive,
        updated_at: new Date().toISOString()
      };

      let response;
      if (existingData && existingData.length > 0) {
        // Güncelleme (Upsert)
        response = await supabase
          .from('bot_settings')
          .update(payload)
          .eq('merchant_id', userId);
      } else {
        // Yeni kayıt
        response = await supabase
          .from('bot_settings')
          .insert([{ merchant_id: userId, ...payload }]);
      }

      if (response.error) throw response.error;
      
      return { success: true };
    } catch (error) {
      console.error('SupabasePersonaRepository Error:', error);
      throw error;
    }
  }
}

export const personaRepository = new SupabasePersonaRepository();
