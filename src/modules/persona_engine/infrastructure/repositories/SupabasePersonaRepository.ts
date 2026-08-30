import { supabase } from '../../../../shared';

export class SupabasePersonaRepository {
  /**
   * Kullanıcının prompt konfigürasyonunu ve nihai metnini veritabanına kaydeder/günceller.
   * PHASE 5b: Artık ham seçimleri organization_ai_settings tablosuna kaydediyor.
   * Geriye dönük uyumluluk ve webhook tetiklemeleri için bot_settings tablosuna da kaydetmeye devam eder.
   */
  async savePersonaConfig(userId: string, config: any, finalPrompt: string, engineMode: string, isActive: boolean, whatsappBotActive: boolean = true, socialBotActive: boolean = true): Promise<any> {
    if (!userId) throw new Error("User ID is required");

    try {
      // 1. organization_ai_settings kayıt işlemi (Phase 5 Refactor)
      let personaId = null;
      if (config?.personaId && config.personaId !== 'standart') {
        // config.personaId is actually the slug. We need to lookup the UUID.
        const { data: persona } = await supabase
          .from('ai_personas')
          .select('id')
          .eq('slug', config.personaId)
          .maybeSingle();
        if (persona) {
          personaId = persona.id;
        }
      }

      const orgSettingsPayload = {
        merchant_id: userId,
        persona_id: personaId,
        business_role: config?.roleId === 'custom' ? config?.customRoleText : config?.roleId,
        tone: config?.moodId,
        custom_instruction: config?.customRoleText,
        assistant_enabled: isActive,
        updated_at: new Date().toISOString()
      };

      const { error: orgError } = await supabase
        .from('organization_ai_settings')
        .upsert(orgSettingsPayload, { onConflict: 'merchant_id' });
        
      if (orgError) {
        console.error('Error saving to organization_ai_settings:', orgError);
        // Continue anyway to preserve legacy save
      }

      // 2. bot_settings kayıt işlemi (Geriye Dönük Uyumluluk)
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
