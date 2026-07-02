import { useState, useEffect, useCallback } from 'react';
import { OrchestrationEngine } from '../../application/engines/OrchestrationEngine';
import { EngineMode, PromptConfigV2 } from '../../domain/types/EngineTypes';
import { PERSONAS_V2 } from '../../domain/config/personas';

export interface UIConfig {
  roleId?: string;
  customRoleText?: string;
  personaId?: string;
  moodId?: string;
  advancedActive?: boolean;
}

export const usePersonaEngine = (initialConfig?: UIConfig) => {
  const [config, setConfig] = useState<UIConfig>(initialConfig || { advancedActive: true });
  const [finalPrompt, setFinalPrompt] = useState<string>('');
  const [debugData, setDebugData] = useState<string>('');
  const [isV2Ready, setIsV2Ready] = useState<boolean>(true);

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
      roleId: text.trim().length > 0 ? '' : prev.roleId 
    }));
  }, []);

  const setPersona = useCallback((id: string) => {
    setConfig(prev => ({ ...prev, personaId: prev.personaId === id ? '' : id }));
  }, []);

  const setMood = useCallback((id: string) => {
    setConfig(prev => ({ ...prev, moodId: prev.moodId === id ? '' : id }));
  }, []);

  const setAdvancedActive = useCallback((active: boolean) => {
    setConfig(prev => ({ ...prev, advancedActive: active }));
  }, []);

  const resetConfig = useCallback(() => {
    setConfig({ advancedActive: true });
  }, []);

  // --- Engine Entegrasyonu (Dual Mode) ---
  useEffect(() => {
    // V2 Uyumluluk Kontrolü: Seçilen persona PERSONAS_V2 içinde var mı?
    let v2Supported = true;
    if (config.personaId) {
      const existsInV2 = PERSONAS_V2.some(p => p.id === config.personaId);
      if (!existsInV2) {
        v2Supported = false;
      }
    }
    setIsV2Ready(v2Supported);

    // OrchestrationEngine'in anlayacağı Domain Config
    const engineConfig: PromptConfigV2 = {
      version: '2.0',
      role: config.roleId,
      persona: config.personaId,
      mood: config.moodId,
      customRole: config.customRoleText,
      advancedActive: config.advancedActive,
    };

    // Mod seçimi
    const modeToUse = v2Supported ? EngineMode.BLUEPRINT_RENDERED : EngineMode.LEGACY_PROMPT;

    try {
      // 1. Üretime Yönelik Nihai Metin
      const generated = OrchestrationEngine.buildPrompt(modeToUse, engineConfig);
      setFinalPrompt(generated);

      // 2. Geliştirici & UI Debug İçin JSON Blueprint (Sadece V2'de mevcut)
      if (v2Supported) {
        const debugOutput = OrchestrationEngine.buildPrompt(EngineMode.BLUEPRINT_DEBUG, engineConfig);
        setDebugData(debugOutput);
      } else {
        setDebugData(JSON.stringify({ status: "legacy_mode_active", fallbackReason: "Persona not converted to V2 Structural Format" }, null, 2));
      }
    } catch (err) {
      console.error("OrchestrationEngine entegrasyon hatası:", err);
    }

  }, [config]);

  return {
    config,
    finalPrompt,
    debugData,
    isV2Ready,
    setRole,
    setCustomRole,
    setPersona,
    setMood,
    setAdvancedActive,
    resetConfig
  };
};
