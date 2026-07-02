import { ROLES } from '../../domain/config/roles';
import { PERSONAS } from '../../domain/config/personas';
import { MOODS } from '../../domain/config/moods';
import { RULES } from '../../domain/config/rules';

export interface PromptConfig {
  role?: string;
  persona?: string;
  mood?: string;
  customRole?: string;
  advancedActive?: boolean;
}

const MASTER_TEMPLATE = `{{RULES}}

{{ROLE_DESCRIPTION}}

{{PERSONA_LORE}}

{{MOOD_TONE}}`;

export class PromptFactory {
  static buildPrompt(config: PromptConfig): string {
    let rulesText = RULES.map(rule => rule.prompt).join("\n\n");

    let roleText = "";
    if (config.customRole && config.customRole.trim() !== '') {
      roleText = `👔 ROL: ${config.customRole}`;
    } else if (config.role) {
      const role = ROLES.find(r => r.id === config.role);
      if (role) {
        roleText = `👔 ROL: ${role.description}`;
      }
    } else {
      roleText = `👔 ROL: Sen kibar ve profesyonel bir müşteri asistanısın.`;
    }

    let personaText = "";
    let moodText = "";

    // Only inject advanced persona and mood if advancedActive is true
    if (config.advancedActive !== false) {
      if (config.persona) {
        const persona = PERSONAS.find(p => p.id === config.persona);
        if (persona) {
          personaText = `🧠 KARAKTER VE HİKAYE: ${persona.basePrompt}`;
        }
      }

      if (config.mood) {
        const mood = MOODS.find(m => m.id === config.mood);
        if (mood) {
          moodText = `🎭 ÜSLUP VE DUYGU: ${mood.prompt}`;
        }
      }
    }

    // Template Replace
    let finalPrompt = MASTER_TEMPLATE;
    finalPrompt = finalPrompt.replace('{{RULES}}', rulesText);
    finalPrompt = finalPrompt.replace('{{ROLE_DESCRIPTION}}', roleText);
    finalPrompt = finalPrompt.replace('{{PERSONA_LORE}}', personaText);
    finalPrompt = finalPrompt.replace('{{MOOD_TONE}}', moodText);

    // Clean up excessive newlines caused by empty replacements
    finalPrompt = finalPrompt.replace(/\n{3,}/g, '\n\n').trim();

    return finalPrompt;
  }
}
