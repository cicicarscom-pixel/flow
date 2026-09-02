// ==============================================================================
// PERSONA ENGINE — "Tek Yapı" refactor (Eylül 2026)
// ==============================================================================
// Daha önce burada 'domain/config/personas' (PERSONAS/PERSONAS_V2, sadece
// yerel önizleme için) ve 'domain/config/rules' (RULES — "polyglot" kültürel
// adaptasyon kuralı dahil) export ediliyordu. Bu ikisi ve onları tüketen tüm
// client-side prompt hesaplama katmanı (application/engines/OrchestrationEngine,
// application/factories/PromptFactory+BlueprintFactory,
// application/renderers/BaseRenderer+GeminiRenderer, domain/types/EngineTypes)
// KALDIRILDI.
//
// Sebep: bu katmanın ürettiği "finalPrompt" hiçbir zaman gerçek müşteri
// botuna ulaşmıyordu — sadece ekrandaki salt-okunur "İleri Seviye Ayarlar"
// panelinde gösteriliyor ve bot_settings.system_prompt'a (artık okunmayan bir
// legacy fallback koluna) yazılıyordu. Gerçek bot davranışı HER ZAMAN
// organization_ai_settings üzerinden, sunucu tarafında (ledger reposu,
// PersonaService + PersonaPromptBuilder) belirleniyor. İki paralel yapı
// (client'ta "gösterilen" ile sunucuda "gerçekten kullanılan") kafa
// karıştırıcıydı ve "polyglot" kültürel/dil adaptasyon kuralı sadece bu ölü
// client tarafında var olup gerçek bota hiç ulaşmıyordu.
//
// Karar: kültürel/dil adaptasyonu artık sunucu tarafında (ledger repo,
// shared/ai/PromptBuilder.ts → SYSTEM_POLICY madde 1) HER MERCHANT için,
// persona/karakter seçiminden bağımsız, sabit ve kapatılamaz şekilde gömülü.
// Bu yüzden mobildeki "İleri Seviye Ayarlar" paneli ve altındaki tüm bu
// hesaplama katmanı kaldırılarak TEK bir gerçek yapı bırakıldı:
//   UI seçimleri → organization_ai_settings → PersonaService →
//   PersonaPromptBuilder → gerçek prompt.
export * from './domain/config/roles';
export * from './domain/config/moods';
export * from './presentation/hooks/usePersonaEngine';
export * from './presentation/hooks/useSavePersona';
export * from './presentation/hooks/usePlayground';
export { getPublishedPersonas, getPersonaConfig } from './infrastructure/repositories/SupabasePersonaRepository';
export type { PublishedPersona, RestoredPersonaConfig } from './infrastructure/repositories/SupabasePersonaRepository';
export { default as PersonaAvatarCard } from './presentation/components/PersonaAvatarCard';
export { default as DialSlider } from './presentation/components/DialSlider';
