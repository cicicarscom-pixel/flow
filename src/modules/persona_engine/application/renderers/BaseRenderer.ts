import { PromptBlueprint } from '../../domain/types/EngineTypes';

export abstract class BaseRenderer {
  abstract render(blueprint: PromptBlueprint): string;
}
