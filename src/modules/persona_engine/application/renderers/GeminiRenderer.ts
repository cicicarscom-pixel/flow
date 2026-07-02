import { BaseRenderer } from './BaseRenderer';
import { PromptBlueprint } from '../../domain/types/EngineTypes';

export class GeminiRenderer extends BaseRenderer {
  render(blueprint: PromptBlueprint): string {
    let output = "";

    const addSection = (title: string, content: string | string[]) => {
      if (!content) return;
      if (Array.isArray(content) && content.length === 0) return;
      
      output += `\n\n[${title}]\n`;
      if (Array.isArray(content)) {
        output += content.map(item => `- ${item}`).join('\n');
      } else {
        output += content;
      }
    };

    // Priority 1 & 2: Rules & Safety (Crucial for Gemini compression)
    addSection("SYSTEM_RULES", [...blueprint.rules, ...blueprint.safety]);

    // Priority 3: Communication
    if (blueprint.communication) {
      addSection("COMMUNICATION_PROTOCOL", blueprint.communication);
    }

    // Priority 4: Knowledge
    if (blueprint.knowledge.length > 0) {
      addSection("KNOWLEDGE_BASE_DIRECTIVES", blueprint.knowledge);
    }

    // Priority 5: Role
    if (blueprint.role) {
      addSection("ROLE", blueprint.role);
    }

    // Priority 6: Persona
    if (blueprint.persona) {
      const p = blueprint.persona;
      let pText = `${p.lore}\n`;
      if (p.vocabulary.length > 0) pText += `Vocabulary: ${p.vocabulary.join(', ')}\n`;
      if (p.forbiddenWords.length > 0) pText += `Forbidden Words: ${p.forbiddenWords.join(', ')}\n`;
      if (p.favoriteExpressions.length > 0) pText += `Favorite Expressions: ${p.favoriteExpressions.join(', ')}\n`;
      pText += `Greeting: ${p.greetingStyle}\nFarewell: ${p.farewellStyle}\n`;
      pText += `Humor Style: ${p.humorStyle}\nEmoji Level: ${p.emojiLevel}`;
      
      addSection("STRUCTURAL_PERSONA", pText.trim());
    }

    // Priority 7: Mood
    if (blueprint.mood) {
      addSection("MOOD", blueprint.mood);
    }

    // Priority 8: Custom Prompt
    if (blueprint.customPrompt) {
      addSection("CUSTOM_INSTRUCTIONS", blueprint.customPrompt);
    }

    // Priority 9: Tools
    if (blueprint.tools && blueprint.tools.enabledTools.length > 0) {
      addSection("ALLOWED_TOOLS", blueprint.tools.enabledTools);
    }

    // Clean up excessive newlines
    return output.replace(/\n{3,}/g, '\n\n').trim();
  }
}
