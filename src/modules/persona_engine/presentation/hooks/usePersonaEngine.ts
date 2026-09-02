import { useState, useCallback } from 'react';

// ==============================================================================
// PERSONA ENGINE — "Tek Yapı" refactor (Eylül 2026)
// ==============================================================================
// Bu hook artık SADECE ekrandaki Rol/Karakter/Üslup seçim state'ini yönetiyor.
// Daha önce burada OrchestrationEngine üzerinden bir "finalPrompt"/"debugData"
// da hesaplanıyordu — bu metin hiçbir zaman gerçek müşteri botuna ulaşmıyordu,
// sadece artık kaldırılmış olan "İleri Seviye Ayarlar" panelinde salt-okunur
// gösteriliyordu. Gerçek bot davranışı zaten her zaman sunucu tarafında
// (ledger reposu, PersonaService + PersonaPromptBuilder) organization_ai_settings
// okunarak belirleniyordu — bkz. persona_engine/index.ts'teki üst not.
//
// `advancedActive` de aynı sebeple kaldırıldı: sadece o ölü client-side
// hesaplamayı (BlueprintFactory) açıp kapatan bir anahtardı, hiçbir zaman
// organization_ai_settings'e yazılmadı veya sunucu tarafında okunmadı.
export interface UIConfig {
  roleId?: string;
  customRoleText?: string;
  personaId?: string;
  moodId?: string;
}

export const usePersonaEngine = (initialConfig?: UIConfig) => {
  const [config, setConfig] = useState<UIConfig>(initialConfig || {});

  // --- Eylemler (State Update Functions) ---
  const setRole = useCallback((id: string) => {
    setConfig(prev => ({
      ...prev,
      roleId: prev.roleId === id ? '' : id,
      customRoleText: prev.roleId !== id ? '' : prev.customRoleText
    }));
  }, []);

  const setCustomRole = useCallback((text: string) => {
    setConfig(prev => ({
      ...prev,
      customRoleText: text,
      roleId: 'custom'
    }));
  }, []);

  const setPersona = useCallback((id: string) => {
    setConfig(prev => ({ ...prev, personaId: prev.personaId === id ? '' : id }));
  }, []);

  const setMood = useCallback((id: string) => {
    setConfig(prev => ({ ...prev, moodId: prev.moodId === id ? '' : id }));
  }, []);

  const resetConfig = useCallback(() => {
    setConfig({});
  }, []);

  return {
    config,
    setRole,
    setCustomRole,
    setPersona,
    setMood,
    resetConfig
  };
};
