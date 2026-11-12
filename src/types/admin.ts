export type ToneStyle = 'warm_empathic' | 'philosophical' | 'objective_curator' | 'poetic';

export type SupportedModel = 'gemini-3.8-flash' | 'gemini-3.1-flash-lite' | 'claude-3-5-haiku';

export type ThinkingLevelOption = 'LOW' | 'MEDIUM' | 'HIGH';

export interface AdminAIConfig {
  // Model settings
  model: SupportedModel;
  thinkingLevel: ThinkingLevelOption;

  // Persona & Instructions
  toneStyle: ToneStyle;
  curatorPersona: string;
  systemInstruction: string;

  // Curation Rules & Filters
  bookCount: number; // 1 to 5 books (default 3)
  preferredGenres: string[];
  excludedKeywords: string[];
  strictQuoteCheck: boolean;
  intensitySensitivity: number; // 1 (mild) to 5 (strong impact on book tone)

  // Meta
  lastUpdated: string;
}
