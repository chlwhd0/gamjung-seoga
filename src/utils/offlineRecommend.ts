// AI 서버(/api/recommend)에 연결할 수 없을 때(예: GitHub Pages 배포) 쓰는 기본 도서 추천.
// 마음의 날씨(분노·불안 …)와 기분의 세기(살짝~몹시)에 맞춰 미리 골라 둔 실제 도서를 보여 줍니다.

import { DEFAULT_BOOKS, DefaultBook } from '../data/defaultBooks';

export interface OfflineBook {
  title: string;
  author: string;
  genre: string;
  quote: string;
  reason: string;
  gist: boolean;
}

export interface OfflineResult {
  emotion: string;
  crisis: boolean;
  books: OfflineBook[];
  source: 'offline';
}

const CRISIS_TERMS = ['자살', '죽고 싶', '죽고싶', '자해', '생을 마감', '세상을 떠나', '사라지고 싶', '극단적 선택'];

const MOOD_WORDS: Array<[string, string[]]> = [
  ['불안', ['불안', '초조', '걱정', '두려', '발표', '시험', '면접']],
  ['슬픔', ['슬픔', '슬프', '우울', '눈물', '이별', '상실']],
  ['분노', ['분노', '화', '억울', '짜증', '배신']],
  ['외로움', ['외로', '고독', '혼자', '쓸쓸']],
  ['무기력', ['무기력', '허무', '공허', '의욕']],
  ['지침', ['지침', '지쳐', '피곤', '번아웃', '휴식', '과로']],
  ['설렘', ['설렘', '설레', '시작', '기대', '두근', '봄']],
  ['기쁨', ['기쁨', '기뻐', '행복', '신나', '성공', '합격']],
  ['평온', ['평온', '여유', '차분', '안식', '명상']],
];

// 기분의 세기: 직접 적은 글에서 세기를 짐작합니다 (못 찾으면 보통인 3단계)
const LEVEL_WORDS: Array<[number, string[]]> = [
  [5, ['몹시', '극도', '죽을 만큼', '미칠', '견딜 수 없', '최악']],
  [4, ['많이', '너무', '정말', '진짜', '매우', '엄청', '심하게']],
  [2, ['조금', '약간', '좀']],
  [1, ['살짝', '가볍게', '미세하게']],
  [3, ['꽤', '제법', '상당히']],
];

export function isCrisisText(text: string): boolean {
  return CRISIS_TERMS.some(t => text.includes(t));
}

export function inferMood(text: string): string {
  const t = text.toLowerCase();
  for (const [mood, words] of MOOD_WORDS) {
    if (words.some(w => t.includes(w))) return mood;
  }
  return '평온';
}

export function inferLevel(text: string): number {
  for (const [level, words] of LEVEL_WORDS) {
    if (words.some(w => text.includes(w))) return level;
  }
  return 3;
}

const normalize = (s: string) => s.replace(/\s+/g, '').toLowerCase();

/**
 * @param base   고른 마음의 날씨 또는 직접 적은 글
 * @param level  기분의 세기 1~5 (직접 적은 글이면 글에서 짐작한 값을 씁니다)
 * @param typed  직접 적은 글인지 여부
 * @param exclude 이미 보여 준 책 제목들 ("다시 추천"에서 제외)
 * @param count   보여 줄 책 권수
 */
export function recommendOffline(
  base: string,
  level: number,
  typed: boolean,
  exclude: string[] = [],
  count: number = 3
): OfflineResult {
  if (typed && isCrisisText(base)) {
    return { emotion: '', crisis: true, books: [], source: 'offline' };
  }

  const mood = typed ? inferMood(base) : (DEFAULT_BOOKS[base] ? base : inferMood(base));
  const lv = typed ? inferLevel(base) : Math.min(5, Math.max(1, Math.round(level) || 3));
  const excluded = new Set(exclude.map(normalize));

  // 같은 마음의 날씨 안에서, 고른 세기와 가까운 책부터 (같은 거리면 세기가 낮은 쪽 먼저)
  const pool: DefaultBook[] = [...(DEFAULT_BOOKS[mood] || DEFAULT_BOOKS['평온'])]
    .filter(b => !excluded.has(normalize(b.title)))
    .sort((a, b) => Math.abs(a.level - lv) - Math.abs(b.level - lv) || a.level - b.level);

  const books: OfflineBook[] = pool.slice(0, Math.max(1, Math.min(5, count))).map(b => ({
    title: b.title,
    author: b.author,
    genre: b.genre,
    quote: b.quote,
    reason: b.reason,
    gist: true,
  }));

  return { emotion: mood, crisis: false, books, source: 'offline' };
}
