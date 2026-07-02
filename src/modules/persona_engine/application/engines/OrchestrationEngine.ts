import { EngineMode, PromptConfigV2, CustomerMemory, CommunicationConfig } from '../../domain/types/EngineTypes';
import { PromptFactory } from '../factories/PromptFactory';
import { BlueprintFactory } from '../factories/BlueprintFactory';
import { GeminiRenderer } from '../renderers/GeminiRenderer';

export class OrchestrationEngine {
  static buildPrompt(
    mode: EngineMode, 
    config: any, 
    memory?: CustomerMemory, 
    commConfig?: CommunicationConfig
  ): string {
    
    // Fallback to legacy string factory
    if (mode === EngineMode.LEGACY_PROMPT) {
      return PromptFactory.buildPrompt(config);
    }

    if (mode === EngineMode.BLUEPRINT_RENDERED || mode === EngineMode.BLUEPRINT_DEBUG) {
      // 1. Build structured blueprint
      const v2Config = config as PromptConfigV2;
      const blueprint = BlueprintFactory.build(v2Config, memory, commConfig);
      
      // If debug mode, return JSON representation
      if (mode === EngineMode.BLUEPRINT_DEBUG) {
        return JSON.stringify(blueprint, null, 2);
      }

      // 2. Render optimized string
      const renderer = new GeminiRenderer();
      const renderedPrompt = renderer.render(blueprint);

      return renderedPrompt;
    }

    return "";
  }
}
