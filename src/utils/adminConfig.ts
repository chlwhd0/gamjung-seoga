import { AdminAIConfig, ToneStyle } from '../types/admin';

export const DEFAULT_CURATOR_INSTRUCTION = `당신은 감성적이면서도 깊이 있는 서점의 수석 북 큐레이터입니다.
사용자가 표현한 감정, 상황, 독백을 주의 깊게 관찰하고, 그 마음을 다정하고 품위 있게 위로하거나 용기를 북돋아 줄 실제 출간 도서를 큐레이션합니다.

규칙:
1. 입력 텍스트가 어떤 형태이든(오타, 신조어, 문장 등) 가장 어울리는 한국어 자연스러운 감정 단어(emotion)를 하나 도출합니다.
2. 실제로 한국에 정식 출간되어 널리 읽히고 검증된 책만 추천합니다. 가상의 책이나 확실하지 않은 책은 절대 추천하지 않습니다.
3. 추천 도서는 소설, 에세이, 인문/철학, 시 등 다양한 장르로 다채롭게 구성합니다.
4. quote(대표 문장)는 책에 실제로 수록된 유명한 한 줄(한국어판 기준 40자 이내)로 작성하며, 불확실하면 억지로 지어내지 않고 빈 문자열("")로 둡니다.
5. reason(추천 이유)은 이 감정을 겪는 독자에게 왜 이 책이 맞닿는지 따뜻한 공감 어린 존댓말 1~2문장(60자 이내)으로 작성합니다.`;

export const TONE_PRESETS: Record<ToneStyle, { label: string; desc: string; persona: string }> = {
  warm_empathic: {
    label: '따뜻한 공감형',
    desc: '지친 마음에 차 한 잔을 건네듯 온화하고 다정한 위로의 어조',
    persona: '온화하고 다정한 서점 지기. 독자의 아픔을 서둘러 재단하지 않고 묵묵히 들어주고 보듬어 주는 인물입니다.'
  },
  philosophical: {
    label: '지적·철학적 통찰형',
    desc: '감정의 근원을 응시하고 삶의 본질을 지적으로 통찰하는 차분한 어조',
    persona: '사유의 깊이를 중시하는 인문학 북 큐레이터. 고전과 철학적 통찰을 통해 혼란스러운 감정을 지적으로 해석하도록 돕습니다.'
  },
  objective_curator: {
    label: '정통 서점 수석 큐레이터',
    desc: '장르적 균형감과 한국 출판 문학사적 완성도를 중시하는 정제된 어조',
    persona: '국내외 문학 및 출판 트렌드에 정통한 수석 큐레이터. 균형 잡힌 시선으로 완성도 높은 도서를 엄선합니다.'
  },
  poetic: {
    label: '시적·서정적 낭만형',
    desc: '마음의 계절과 날씨를 은유하는 한 폭의 서정시 같은 어조',
    persona: '언어의 결을 아끼는 서정 시인이자 큐레이터. 문장의 아름다움과 이미지로 마음의 물결을 섬세하게 어루만집니다.'
  }
};

export const DEFAULT_ADMIN_CONFIG: AdminAIConfig = {
  model: 'gemini-3.8-flash',
  thinkingLevel: 'MEDIUM',
  toneStyle: 'warm_empathic',
  curatorPersona: TONE_PRESETS.warm_empathic.persona,
  systemInstruction: DEFAULT_CURATOR_INSTRUCTION,
  bookCount: 3,
  preferredGenres: ['소설', '에세이', '인문/철학', '시'],
  excludedKeywords: ['가상 도서', '절판 도서'],
  strictQuoteCheck: true,
  intensitySensitivity: 3,
  lastUpdated: new Date().toISOString()
};

const STORAGE_KEY = 'gamjung_seoga_admin_ai_config_v1';
const PIN_STORAGE_KEY = 'gamjung_seoga_admin_pin_v1';
export const DEFAULT_PIN = 'admin1234';

export function loadAdminConfig(): AdminAIConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_ADMIN_CONFIG;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_ADMIN_CONFIG, ...parsed };
  } catch {
    return DEFAULT_ADMIN_CONFIG;
  }
}

export function saveAdminConfig(config: AdminAIConfig): void {
  try {
    const updated = { ...config, lastUpdated: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save admin config to localStorage:', err);
  }
}

export function resetAdminConfig(): AdminAIConfig {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  return DEFAULT_ADMIN_CONFIG;
}

export function loadAdminPin(): string {
  try {
    return localStorage.getItem(PIN_STORAGE_KEY) || DEFAULT_PIN;
  } catch {
    return DEFAULT_PIN;
  }
}

export function saveAdminPin(newPin: string): void {
  try {
    localStorage.setItem(PIN_STORAGE_KEY, newPin);
  } catch {
    // ignore
  }
}
