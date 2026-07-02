export enum EngineMode {
  LEGACY_PROMPT = 'v1',
  BLUEPRINT_DEBUG = 'v2_debug',
  BLUEPRINT_RENDERED = 'v2'
}

export interface ToolCapabilities {
  enabledTools: string[];
  capabilities: {
    appointments: boolean;
    invoice: boolean;
    humanHandover: boolean;
    [key: string]: boolean;
  };
}

export interface StructuralPersona {
  id: string;
  name: string;
  icon: string;
  lore: string;
  vocabulary: string[];
  forbiddenWords: string[];
  favoriteExpressions: string[];
  greetingStyle: string;
  farewellStyle: string;
  humorStyle: 'None' | 'Sarcastic' | 'Warm' | 'Playful';
  emojiLevel: 'None' | 'Low' | 'Medium' | 'High';
  manualOverrides?: Partial<StructuralPersona>;
}

export interface PromptConfigV2 {
  version: "2.0";
  role?: string;
  persona?: string;
  mood?: string;
  customRole?: string;
  advancedActive?: boolean;
  capabilities?: ToolCapabilities;
}

export interface CustomerMemory {
  language: string;
  preferredTone: 'Formal' | 'Casual' | 'Friendly';
  lastService?: string;
}

export interface CommunicationConfig {
  country: string;
  currency: string;
  datetimeFormat: string;
  formalityLevel: string;
}

export interface PromptBlueprint {
  rules: string[];             // Priority 1
  safety: string[];            // Priority 2
  communication: string;       // Priority 3
  knowledge: string[];         // Priority 4
  role: string;                // Priority 5
  persona: StructuralPersona | null; // Priority 6
  mood: string;                // Priority 7
  customPrompt: string;        // Priority 8
  tools: ToolCapabilities | null;
}
