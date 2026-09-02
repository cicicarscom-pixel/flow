import { supabase } from '../../../../shared';

// ==============================================================================
// PERSONA ENGINE — Faz 1: canlı karakter kataloğu + kayıtlı seçim geri yükleme
// ==============================================================================
// getPublishedPersonas() ve getPersonaConfig(), flowweb'in
// src/actions/personas.ts (getPublishedPersonas) ve
// src/actions/aiPersonaSettings.ts (getAiPersonaSettings) dosyalarının
// mobil (React Native) karşılığıdır. TEK fark: web tarafı persona_id → slug
// çözümlemesi için admin (service-role) client kullanıyor; mobilde servis
// rolü anahtarı ASLA bulunmamalı (bir mobil uygulamaya service-role key
// gömmek başlı başına bir güvenlik açığıdır). Bunun yerine normal
// (RLS'e tabi) client ile ai_personas'tan okunuyor — ai_personas'ın kendi
// RLS politikası zaten "status='published' olan satırlar herhangi bir
// authenticated kullanıcı tarafından okunabilir" diyor (bkz. flowweb'deki
// aynı yorum), bu yüzden published bir persona için bu her zaman çalışır.
// Daha sonra unpublish/arşivlenmiş bir persona için slug bulunamazsa (null
// döner) ekran sadece "Standart" seçiliymiş gibi davranır — kilitlenme veya
// hata YOKTUR, aynı savePersonaConfig'teki mevcut slug→id lookup'ının simetriği.
export interface PublishedPersona {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
  avatarUrl: string | null;
  shortBio: string | null;
  defaultPersonaIntensity: number;
  defaultHumorLevel: number;
  defaultModernAdaptation: number;
}

export async function getPublishedPersonas(): Promise<PublishedPersona[]> {
  const { data, error } = await supabase
    .from('ai_personas')
    .select(
      'id, slug, name, icon, short_bio, avatar_url, thumbnail_url, default_persona_intensity, default_humor_level, default_modern_adaptation'
    )
    .eq('status', 'published')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    // Web'deki gibi "fails soft": boş bir liste (sadece Standart görünür)
    // hiçbir zaman ekranı kıran bir hataya dönüşmemeli.
    console.error('[getPublishedPersonas] failed:', error.message);
    return [];
  }

  return (data ?? []).map((p: any) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    icon: p.icon,
    avatarUrl: p.thumbnail_url ?? p.avatar_url,
    shortBio: p.short_bio,
    defaultPersonaIntensity: p.default_persona_intensity,
    defaultHumorLevel: p.default_humor_level,
    defaultModernAdaptation: p.default_modern_adaptation,
  }));
}

export interface RestoredPersonaConfig {
  businessRole: string | null;
  tone: string | null;
  customInstruction: string | null;
  personaSlug: string | null;
  appointmentModuleEnabled: boolean;
  // Faz 2: Karakter Ayarları kadranları (0-100). Web'in kendi initial state'i
  // ile birebir aynı varsayılan (50/50/50) — bkz. flowweb
  // src/app/(dashboard)/ai-asistan/page.tsx satır 276-278.
  personaIntensity: number;
  humorLevel: number;
  modernAdaptation: number;
}

// Ekran açılışında (fetchInitialData) merchant'ın daha önce kaydettiği
// AI Kişiliği seçimlerini organization_ai_settings'ten geri okur.
export async function getPersonaConfig(userId: string): Promise<RestoredPersonaConfig | null> {
  if (!userId) return null;

  const { data: settings, error } = await supabase
    .from('organization_ai_settings')
    .select('business_role, tone, custom_instruction, persona_id, appointment_module_enabled, persona_intensity, humor_level, modern_adaptation')
    .eq('merchant_id', userId)
    .maybeSingle();

  if (error || !settings) return null;

  let personaSlug: string | null = null;
  if (settings.persona_id) {
    const { data: persona } = await supabase
      .from('ai_personas')
      .select('slug')
      .eq('id', settings.persona_id)
      .maybeSingle();
    personaSlug = persona?.slug ?? null;
  }

  return {
    businessRole: settings.business_role ?? null,
    tone: settings.tone ?? null,
    customInstruction: settings.custom_instruction ?? null,
    personaSlug,
    appointmentModuleEnabled: settings.appointment_module_enabled ?? true,
    personaIntensity: settings.persona_intensity ?? 50,
    humorLevel: settings.humor_level ?? 50,
    modernAdaptation: settings.modern_adaptation ?? 50,
  };
}

export class SupabasePersonaRepository {
  /**
   * Kullanıcının AI Kişiliği seçimlerini veritabanına kaydeder/günceller.
   *
   * "Tek Yapı" refactor (Eylül 2026): daha önce burada ikinci bir adım olarak
   * finalPrompt/prompt_config/engine_mode de bot_settings tablosuna yazılıyordu
   * ("Geriye Dönük Uyumluluk" — client'ta OrchestrationEngine ile hesaplanan bir
   * metindi). Bu artık YAPILMIYOR: web'in aynı akışı (saveAiPersonaSettings,
   * Phase 5 guardrail #2) zaten bir süredir bu üç alanı yazmıyordu — mobil de
   * artık aynı hizaya getirildi. Sebep: bu alanlar gerçek müşteri botu için hiç
   * okunmuyordu (bkz. ledger reposu PromptBuilder.buildBotPersonality — bir
   * merchant bu ekranı bir kez bile kaydettiyse organization_ai_settings satırı
   * oluşur ve PersonaService her zaman non-null bir config döner, yani
   * bot_settings.system_prompt fallback'ine ASLA düşülmez). Tek gerçek kaynak
   * artık organization_ai_settings — sunucu tarafında (PersonaService +
   * PersonaPromptBuilder) oradan okunuyor. bot_settings tablosuna sadece kanal
   * aç/kapa anahtarları (is_active/whatsapp_bot_active/social_bot_active) —
   * ki bunlar gerçekten kullanılıyor — yazılmaya devam ediyor.
   */
  async savePersonaConfig(userId: string, config: any, isActive: boolean, whatsappBotActive: boolean = true, socialBotActive: boolean = true): Promise<any> {
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
        // Faz 2: Karakter Ayarları kadranları — web'in saveAiPersonaSettings'i
        // gibi, tanımlıysa doğrudan kullanıcının ayarladığı değeri yazar.
        persona_intensity: config?.personaIntensity ?? 50,
        humor_level: config?.humorLevel ?? 50,
        modern_adaptation: config?.modernAdaptation ?? 50,
        updated_at: new Date().toISOString()
      };

      const { error: orgError } = await supabase
        .from('organization_ai_settings')
        .upsert(orgSettingsPayload, { onConflict: 'merchant_id' });
        
      if (orgError) {
        console.error('Error saving to organization_ai_settings:', orgError);
        // Continue anyway to preserve legacy save
      }

      // 2. bot_settings kayıt işlemi — SADECE kanal aç/kapa anahtarları.
      //    system_prompt/prompt_config/engine_mode artık YAZILMIYOR (yukarıdaki
      //    not). Bu üç kolon nullable/varsayılan değerli olduğu için (bkz.
      //    canlı şema doğrulaması) burada hiç göndermemek insert/update'i
      //    bozmaz — sadece DB'nin kendi varsayılanları veya (update'te)
      //    olduğu gibi kalan eski değer geçerli olur, hangisi olursa olsun
      //    gerçek bot davranışını etkilemez.
      const { data: existingData, error: fetchError } = await supabase
        .from('bot_settings')
        .select('id')
        .eq('merchant_id', userId)
        .limit(1);

      if (fetchError) throw fetchError;

      const payload = {
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
