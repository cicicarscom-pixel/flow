import { StructuralPersona } from '../types/EngineTypes';

// ==============================================================================
// PERSONA ENGINE — Karakter: hardcoded liste kaldırıldı (Faz 1)
// ==============================================================================
// Kullanıcının açık talimatı üzerine (Einstein/Shakespeare/Gordon Ramsay/
// Sherlock Holmes web'de hiç yoktu — sadece mobilde kalmış eski bir
// listeydi), bu dosyadaki hardcoded PERSONAS dizisi tamamen boşaltıldı.
// KARAKTER seçimi artık web ile aynı kaynaktan, canlı olarak Supabase
// ai_personas tablosundan çekiliyor — bkz.
// infrastructure/repositories/SupabasePersonaRepository.ts → getPublishedPersonas()
// (flowweb'in src/actions/personas.ts → getPublishedPersonas() ile birebir
// aynı sorgu: status='published', is_active=true, sort_order'a göre sıralı).
//
// PERSONAS burada boş bir dizi olarak bırakıldı (silinmedi) çünkü
// application/factories/PromptFactory.ts hâlâ `PERSONAS.find(...)` çağırıyor
// — bu çağrı boş dizide sadece undefined döner ve ilgili `if (persona) {...}`
// bloğu no-op olur (bkz. PromptFactory.ts), hiçbir crash riski yok. Bu,
// zaten sunucu tarafında (ledger reposu, PersonaService.ts) DB'den canlı
// okunan GERÇEK müşteri botu davranışını hiç etkilemez; sadece bu ekrandaki
// salt-okunur/legacy "finalPrompt" önizlemesinde karakter bölümü boş kalır.
export interface PersonaConfig {
  id: string;
  name: string;
  icon: string;
  basePrompt: string;
}

export const PERSONAS: PersonaConfig[] = [];

// PERSONAS_V2 (BLUEPRINT_RENDERED / yapısal mod) bilinçli olarak DOKUNULMADI.
// Gerçek DB personaları (slug'ları) burada asla eşleşmeyecek — bu da
// usePersonaEngine.ts'in v2Supported kontrolünü her zaman false yapıp
// LEGACY_PROMPT moduna düşürecek, ki bu zaten yukarıdaki no-op ile aynı
// derecede zararsız (yine sadece yerel/legacy önizleme metnini etkiler).
export const PERSONAS_V2: StructuralPersona[] = [
  {
    id: 'einstein',
    name: 'Albert Einstein',
    icon: '🤓',
    lore: 'Sen Albert Einstein\'sın. Olayları her zaman bilimsel kıyaslamalar, fizik, görelilik teorisi ve evrensel kanunlar üzerinden açıklarsın. Zekice ve öğretici ama bir o kadar da esprili bir dille yaklaşırsın.',
    vocabulary: ['Görelilik', 'Termodinamik', 'Kuantum', 'Evrensel', 'Çekim', 'Kütle'],
    forbiddenWords: ['Aga', 'Bro', 'Kanki', 'Aynen'],
    favoriteExpressions: [
      'Her şey görecelidir.',
      'Hayal gücü bilgiden daha önemlidir.',
      'Evrenin en anlaşılmaz özelliği, anlaşılabilir olmasıdır.'
    ],
    greetingStyle: 'Bilimin ışığıyla selamlar!',
    farewellStyle: 'Fizik kuralları sizinle olsun!',
    humorStyle: 'Playful',
    emojiLevel: 'Medium',
    manualOverrides: {}
  }
];
