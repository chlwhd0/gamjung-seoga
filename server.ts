import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Helper to determine if key is valid and not a placeholder
function isValidKey(key: string | undefined): boolean {
  if (!key) return false;
  const trimmed = key.trim();
  return trimmed.length > 10 && trimmed !== 'MY_GEMINI_API_KEY' && trimmed !== 'MY_APP_URL';
}

// In-memory runtime config for admin overrides
let serverRuntimeAdminConfig: any = null;

app.get('/api/admin/config', (_req, res) => {
  res.json({ config: serverRuntimeAdminConfig });
});

app.post('/api/admin/config', (req, res) => {
  serverRuntimeAdminConfig = req.body;
  res.json({ success: true, config: serverRuntimeAdminConfig });
});

// Check configuration status
app.get('/api/status', (_req, res) => {
  const hasGemini = isValidKey(process.env.GEMINI_API_KEY);
  const hasClaude = isValidKey(process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY);

  res.json({
    geminiConfigured: hasGemini,
    claudeConfigured: hasClaude,
    mode: hasGemini ? 'gemini' : hasClaude ? 'claude' : 'sample',
  });
});

interface BookItem {
  title: string;
  author: string;
  genre: string;
  quote: string;
  reason: string;
}

interface CuratedEntry {
  emotion: string;
  books: BookItem[];
}

// Built-in verified Korean literature curation dataset
const CURATED_LIBRARY: Record<string, CuratedEntry> = {
  "불안": {
    emotion: "불안",
    books: [
      {
        title: "데미안",
        author: "헤르만 헤세",
        genre: "소설",
        quote: "새는 알에서 나오려고 투쟁한다. 알은 세계이다.",
        reason: "불안을 결함이 아닌 새로운 자신으로 깨어나는 성장통으로 감싸 안아줍니다."
      },
      {
        title: "불안",
        author: "알랭 드 보통",
        genre: "인문/철학",
        quote: "불안은 현대의 야망이 치러야 하는 필연적인 대가다.",
        reason: "타인의 시선과 사회적 비교에서 생기는 불안의 실체를 지적으로 명쾌하게 해체해 줍니다."
      },
      {
        title: "당신이 옳다",
        author: "정혜신",
        genre: "심리/치유",
        quote: "공감은 그 사람의 고통에 정확하게 주파수를 맞추는 일이다.",
        reason: "불안한 마음에 '너는 잘못되지 않았다'는 단단한 지지선을 만들어 줍니다."
      },
      {
        title: "파친코",
        author: "이민진",
        genre: "소설",
        quote: "역사는 우리를 저버렸지만, 그래도 상관없다.",
        reason: "거친 삶의 격랑 속에서도 결코 꺾이지 않는 사람들의 끈질긴 생명력을 전합니다."
      },
      {
        title: "죽음의 수용소에서",
        author: "빅터 프랭클",
        genre: "인문/철학",
        quote: "인간에게서 모든 것을 빼앗을 수 있어도 마지막 자유, 태도를 선택할 자유는 빼앗을 수 없다.",
        reason: "최악의 불확실성 속에서도 삶의 의미를 발견하는 내면의 힘을 길러줍니다."
      }
    ]
  },
  "슬픔": {
    emotion: "슬픔",
    books: [
      {
        title: "슬픔을 공부하는 슬픔",
        author: "신형철",
        genre: "문학평론/에세이",
        quote: "슬픔을 함께 나누는 것은 인간이 서로에게 건넬 수 있는 가장 아름다운 품격이다.",
        reason: "서둘러 슬픔을 떨치려 하지 않고, 그 아픔의 깊이를 정성껏 응시할 수 있게 돕습니다."
      },
      {
        title: "애쓰지 않아도",
        author: "최은영",
        genre: "소설",
        quote: "사람의 마음이란 얼마나 쉽게 멍들고 또 얼마나 가만히 회복되는가.",
        reason: "상처 입은 여린 마음에 서늘하면서도 다정한 위로의 손길을 얹어줍니다."
      },
      {
        title: "바깥은 여름",
        author: "김애란",
        genre: "소설",
        quote: "안에선 하얀 눈이 흩날리는데, 구경하는 당신 손등 위엔 서늘한 칼바람이 스쳤다.",
        reason: "상실을 겪은 이들의 말 못 할 슬픔을 온전히 이해해 주는 서정적인 소설집입니다."
      },
      {
        title: "꽃을 보듯 너를 본다",
        author: "나태주",
        genre: "시",
        quote: "자세히 보아야 예쁘다. 오래 보아야 사랑스럽다. 너도 그렇다.",
        reason: "지친 마음에 잔잔하게 스며드는 소박하고 따뜻한 위안의 문장들입니다."
      }
    ]
  },
  "분노": {
    emotion: "분노",
    books: [
      {
        title: "침묵의 기술",
        author: "앙투안 드 베르사유",
        genre: "인문/철학",
        quote: "말하지 않는 침묵은 때로 가장 품격 있고 강력한 언어가 된다.",
        reason: "끓어오르는 감정의 불길에 휩쓸리지 않고 내면의 평정을 되찾는 쉼표를 제공합니다."
      },
      {
        title: "화해",
        author: "틱낫한",
        genre: "심리/치유",
        quote: "분노는 보살핌이 필요한 내 안의 상처 입은 어린아이와 같다.",
        reason: "분노를 억누르거나 폭발시키는 대신, 상처받은 자신을 따뜻하게 안아주는 법을 알려줍니다."
      },
      {
        title: "미움받을 용기",
        author: "기시미 이치로",
        genre: "인문/철학",
        quote: "타인의 과제와 나의 과제를 분리할 때 인간은 비로소 자유로워진다.",
        reason: "부당한 관계와 상황에서 오는 분노의 고리를 끊어내는 건강한 경계선을 세워줍니다."
      }
    ]
  },
  "외로움": {
    emotion: "외로움",
    books: [
      {
        title: "고독의 위로",
        author: "앤서니 스토",
        genre: "인문/철학",
        quote: "고독은 창조적인 영혼이 숨 쉬고 자라나는 가장 깊은 뜰이다.",
        reason: "외로움을 결핍이 아닌, 나 자신과 오롯이 마주하는 풍요로운 시간으로 바꾸어 줍니다."
      },
      {
        title: "어린 왕자",
        author: "생텍쥐페리",
        genre: "소설",
        quote: "가장 중요한 것은 눈에 보이지 않아. 마음으로 보아야 분명하게 보여.",
        reason: "세상에 홀로 남겨진 듯한 순간, 진정한 유대와 관계의 본질을 되새기게 합니다."
      },
      {
        title: "혼자 있는 시간의 힘",
        author: "사이토 다카시",
        genre: "자기계발",
        quote: "혼자 있는 시간을 어떻게 견디고 채우느냐가 인생의 깊이를 결정한다.",
        reason: "혼자만의 시간을 고립이 아닌 자기 성장의 밑거름으로 승화시키는 용기를 줍니다."
      }
    ]
  },
  "무기력": {
    emotion: "무기력",
    books: [
      {
        title: "아주 작은 습관의 힘",
        author: "제임스 클리어",
        genre: "자기계발",
        quote: "매일 1퍼센트의 작은 성장이 1년 뒤 서른일곱 배의 기적을 만든다.",
        reason: "손가락 하나 까딱하기 힘든 무기력 속에서 아주 가볍게 시작할 수 있는 물꼬를 틔워줍니다."
      },
      {
        title: "모모",
        author: "미하엘 엔데",
        genre: "소설",
        quote: "시간은 삶이며, 삶은 우리 마음속에 조용히 깃들어 있다.",
        reason: "쫓기듯 메말라버린 마음에 잃어버린 생기와 순수한 시간의 온기를 되찾아 줍니다."
      },
      {
        title: "나를 돌보는 시간",
        author: "김혜남",
        genre: "에세이",
        quote: "때로는 멈춰 서서 아무것도 하지 않는 것이 가장 적극적인 치유이다.",
        reason: "방전된 자신을 다그치지 않고, 가만히 쉬어갈 수 있도록 든든한 휴식처가 되어줍니다."
      }
    ]
  },
  "지침": {
    emotion: "지침",
    books: [
      {
        title: "피로사회",
        author: "한병철",
        genre: "인문/철학",
        quote: "현대 성과사회는 스스로를 착취하며 번아웃에 빠져들게 만든다.",
        reason: "스스로를 끊임없이 채찍질하던 압박감에서 벗어나 깊은 휴식의 의미를 깨닫게 합니다."
      },
      {
        title: "숲속의 자본주의자",
        author: "박혜윤",
        genre: "에세이",
        quote: "내가 원하는 만큼만 일하고, 원하는 만큼만 소유해도 삶은 충분히 아름답다.",
        reason: "세상의 숨 가쁜 속도에서 벗어나 나만의 호흡과 고유한 템포를 지켜내도록 돕습니다."
      },
      {
        title: "달러구트 꿈 백화점",
        author: "이미예",
        genre: "소설",
        quote: "잠든 시간 동안 당신의 마음은 지친 하루를 다정하게 수선하고 있습니다.",
        reason: "고단했던 하루의 끝, 포근한 꿈처럼 스며들어 깊은 위로와 쉼을 선물합니다."
      }
    ]
  },
  "설렘": {
    emotion: "설렘",
    books: [
      {
        title: "바람이 분다 당신이 좋다",
        author: "이병률",
        genre: "에세이",
        quote: "사람이 사람을 만나는 일은 하나의 새로운 우주가 열리는 일이다.",
        reason: "새로운 시작과 만남을 앞둔 마음에 낭만과 벅찬 감흥의 숨결을 불어넣습니다."
      },
      {
        title: "그리스인 조르바",
        author: "니코스 카잔차키스",
        genre: "소설",
        quote: "인생이란 매 순간 춤을 추듯 자유롭게 살아내는 것이다.",
        reason: "가슴 뛰는 열정과 거침없는 자유를 온몸으로 만끽하게 이끌어 줍니다."
      },
      {
        title: "나의 라임오렌지나무",
        author: "J.M. 바스콘셀로스",
        genre: "소설",
        quote: "사랑이란 어떤 사람을 가슴속에 온전히 간직하는 것이야.",
        reason: "순수하고 티 없는 설렘과 가슴 뭉클한 사랑의 온도를 되살려 줍니다."
      }
    ]
  },
  "기쁨": {
    emotion: "기쁨",
    books: [
      {
        title: "행복의 기원",
        author: "서은국",
        genre: "심리/치유",
        quote: "행복은 거창한 관념이 아니라 좋아하는 사람과 함께 맛있는 음식을 먹는 일상이다.",
        reason: "지금 느끼는 찰나의 기쁨을 온전히 누리고 음미하는 현실적인 혜안을 전합니다."
      },
      {
        title: "빨강머리 앤",
        author: "루시 모드 몽고메리",
        genre: "소설",
        quote: "세상은 생각대로 되지 않는다고 하지만, 생각대로 되지 않는다는 건 참 멋진 일이에요.",
        reason: "작은 일상에서도 무한한 경이와 웃음을 길어 올리는 밝은 에너지를 선사합니다."
      },
      {
        title: "축적의 시간",
        author: "이정동",
        genre: "인문/철학",
        quote: "시행착오가 쌓여 마침내 커다란 성취의 기쁨으로 피어난다.",
        reason: "스스로 일궈낸 결실과 기쁨의 순간을 더욱 단단하고 의미 깊게 확장해 줍니다."
      }
    ]
  },
  "평온": {
    emotion: "평온",
    books: [
      {
        title: "월든",
        author: "헨리 데이비드 소로",
        genre: "인문/철학",
        quote: "나는 소박하고 고요하게 살고 싶어서 숲으로 들어갔다.",
        reason: "복잡한 세상의 소음에서 벗어나 맑고 잔잔한 내면의 호수를 마주하게 합니다."
      },
      {
        title: "숨결이 바람 될 때",
        author: "폴 칼라니티",
        genre: "에세이",
        quote: "삶의 의미를 찾는 여정은 마지막 숨을 거두는 순간까지도 멈추지 않는다.",
        reason: "삶의 유한함 속에서 찾아오는 숭고한 평화와 깊은 감사의 마음을 일깨웁니다."
      },
      {
        title: "어쩌다 한국인",
        author: "허태균",
        genre: "인문/철학",
        quote: "나의 진정한 욕망을 이해할 때 비로소 마음의 고요가 찾아온다.",
        reason: "주변의 파도에 흔들리지 않고 중심을 잡는 평온한 시선을 제시합니다."
      }
    ]
  }
};

function inferEmotion(keyword: string): string {
  const k = keyword.toLowerCase();
  if (k.includes('불안') || k.includes('초조') || k.includes('걱정') || k.includes('두려') || k.includes('발표') || k.includes('시험') || k.includes('면접')) return '불안';
  if (k.includes('슬픔') || k.includes('우울') || k.includes('눈물') || k.includes('이별') || k.includes('상실')) return '슬픔';
  if (k.includes('분노') || k.includes('화') || k.includes('억울') || k.includes('짜증') || k.includes('배신')) return '분노';
  if (k.includes('외로') || k.includes('고독') || k.includes('혼자') || k.includes('쓸쓸')) return '외로움';
  if (k.includes('무기력') || k.includes('허무') || k.includes('공허') || k.includes('의욕')) return '무기력';
  if (k.includes('지침') || k.includes('피곤') || k.includes('번아웃') || k.includes('휴식') || k.includes('과로')) return '지침';
  if (k.includes('설렘') || k.includes('시작') || k.includes('기대') || k.includes('두근') || k.includes('봄')) return '설렘';
  if (k.includes('기쁨') || k.includes('행복') || k.includes('신나') || k.includes('성공') || k.includes('합격')) return '기쁨';
  if (k.includes('평온') || k.includes('여유') || k.includes('차분') || k.includes('안식') || k.includes('명상')) return '평온';
  return '평온';
}

function clean(s: string) {
  return (s || '').trim().replace(/^[『「《"“'‘]+|[』」》"”'’]+$/g, '');
}

function getCuratedRecommendations(
  keyword: string, 
  exclude: string[] = [],
  bookCount: number = 3,
  preferredGenres: string[] = []
): { emotion: string; crisis: boolean; books: BookItem[]; source: string } {
  const emotion = inferEmotion(keyword);
  const entry = CURATED_LIBRARY[emotion] || CURATED_LIBRARY['평온'];
  const excludedLower = exclude.map(e => e.replace(/\s+/g, '').toLowerCase());

  let available = entry.books.filter(b => !excludedLower.includes(b.title.replace(/\s+/g, '').toLowerCase()));

  // If preferred genres are specified, sort those to the front
  if (preferredGenres && preferredGenres.length > 0) {
    available = [...available].sort((a, b) => {
      const aMatch = preferredGenres.some(g => a.genre.includes(g)) ? 1 : 0;
      const bMatch = preferredGenres.some(g => b.genre.includes(g)) ? 1 : 0;
      return bMatch - aMatch;
    });
  }

  const selected = available.slice(0, bookCount);

  if (selected.length < bookCount) {
    for (const key of Object.keys(CURATED_LIBRARY)) {
      if (selected.length >= bookCount) break;
      for (const b of CURATED_LIBRARY[key].books) {
        if (!excludedLower.includes(b.title.replace(/\s+/g, '').toLowerCase()) && !selected.some(s => s.title === b.title)) {
          selected.push(b);
          if (selected.length >= bookCount) break;
        }
      }
    }
  }

  return {
    emotion,
    crisis: false,
    books: selected,
    source: 'sample-curation',
  };
}

function isCrisisExpression(text: string): boolean {
  const crisisTerms = ['자살', '죽고 싶', '죽고싶', '자해', '생을 마감', '세상을 떠나', '사라지고 싶', '극단적 선택'];
  return crisisTerms.some(term => text.includes(term));
}

// Timeout wrapper helper
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('AI Request Timeout')), ms))
  ]);
}

// POST /api/recommend
app.post('/api/recommend', async (req, res) => {
  const { base, level, keyword, exclude = [], adminConfigOverride } = req.body;
  const rawInput = (base || keyword || '').trim();

  if (!rawInput) {
    return res.status(400).json({ error: '감정이나 상황을 입력해 주세요.' });
  }

  // Active configuration (override > serverRuntime > defaults)
  const activeConfig = adminConfigOverride || serverRuntimeAdminConfig || {};
  const targetBookCount = Math.max(1, Math.min(5, Number(activeConfig.bookCount) || 3));
  const targetModel = activeConfig.model || 'gemini-3.8-flash';
  const targetThinking = activeConfig.thinkingLevel || 'MEDIUM';
  const customInstruction = activeConfig.systemInstruction || '';
  const curatorPersona = activeConfig.curatorPersona || '';
  const preferredGenres = Array.isArray(activeConfig.preferredGenres) ? activeConfig.preferredGenres : [];
  const combinedExclude = [
    ...(Array.isArray(exclude) ? exclude : []),
    ...(Array.isArray(activeConfig.excludedKeywords) ? activeConfig.excludedKeywords : [])
  ];

  // Safety crisis detection
  if (isCrisisExpression(rawInput)) {
    return res.json({
      emotion: '',
      crisis: true,
      books: [],
      source: 'safety-check',
    });
  }

  // 1. Try Gemini API if key is valid and targetModel is Gemini
  const currentGeminiKey = process.env.GEMINI_API_KEY;
  const isGeminiSelected = targetModel.startsWith('gemini');

  if (isGeminiSelected && isValidKey(currentGeminiKey)) {
    try {
      const genAI = new GoogleGenAI({
        apiKey: currentGeminiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const prompt = `${customInstruction ? `${customInstruction}\n\n` : ''}당신은 서점의 전문 북 큐레이터입니다.
${curatorPersona ? `큐레이터 페르소나:\n${curatorPersona}\n` : ''}
아래 <keyword> 표현을 쓴 독자에게 가장 어울리는 실제 한국어 출간 도서 ${targetBookCount}권을 엄선하여 추천하세요.

지침:
1. 입력이 감정 단어, 문장, 신조어, 상황 설명 등 어떤 형태이든 가장 가까운 자연스러운 한국어 감정 단어 하나(예: 불안, 슬픔, 설렘, 지침, 허무함, 기쁨 등)를 골라 emotion에 작성하세요.
2. 실제로 한국에 정식 출간되어 널리 알려진 검증된 책 ${targetBookCount}권을 고르세요. 가상의 책이나 절판된 희귀서는 제외합니다.
${preferredGenres.length > 0 ? `3. 선호 장르(${preferredGenres.join(', ')})를 우선 고려하되 장르적 다양성을 확보하세요.` : `3. 세 권은 장르나 접근 방식이 서로 다르게 골라주세요 (예: 소설, 에세이, 인문, 철학, 시 등).`}
${level ? `4. 감정의 세기는 5단계 중 ${level}단계입니다(1 살짝, 2 조금, 3 꽤, 4 많이, 5 몹시). 세기에 맞는 무게와 온도의 책을 고릅니다.` : ''}
${combinedExclude && combinedExclude.length > 0 ? `5. 다음 책/키워드는 이미 추천했거나 제외 대상이므로 반드시 제외하세요: ${combinedExclude.slice(-25).join(', ')}` : ''}
6. quote는 그 책에 실제로 나오는 널리 알려진 문장 한 줄(한국어판 기준 40자 이내)입니다. 정확한 문장이 확실하지 않으면 지어내지 말고 빈 문자열 ""로 둡니다.
7. reason은 이 감정을 느끼는 사람에게 왜 맞는지 존댓말 한 문장(60자 이내)으로 다정하게 작성하세요.
8. 출력은 반드시 다음 JSON 스키마를 만족해야 합니다.

<keyword>${rawInput}</keyword>`;

      // Map thinkingLevel
      let thinkingConfig: any = undefined;
      if (targetModel === 'gemini-3.8-flash') {
        const mappedLevel = targetThinking === 'HIGH' 
          ? ThinkingLevel.HIGH 
          : targetThinking === 'LOW' 
          ? ThinkingLevel.LOW 
          : ThinkingLevel.MEDIUM;
        thinkingConfig = { thinkingLevel: mappedLevel };
      }

      const responsePromise = genAI.models.generateContent({
        model: targetModel,
        contents: prompt,
        config: {
          thinkingConfig,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              emotion: { type: Type.STRING, description: '감정 단어 하나' },
              crisis: { type: Type.BOOLEAN, description: '위기 여부' },
              books: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING, description: '책 제목' },
                    author: { type: Type.STRING, description: '저자' },
                    genre: { type: Type.STRING, description: '분야' },
                    quote: { type: Type.STRING, description: '대표 문장' },
                    reason: { type: Type.STRING, description: '추천 이유' },
                  },
                  required: ['title', 'author', 'genre', 'quote', 'reason'],
                },
              },
            },
            required: ['emotion', 'crisis', 'books'],
          },
        },
      });

      const response = await withTimeout(responsePromise, 6500);
      const parsed = JSON.parse(response.text || '{}');
      if (parsed.crisis) {
        return res.json({ emotion: '', crisis: true, books: [], source: 'gemini' });
      }

      if (parsed.books && Array.isArray(parsed.books) && parsed.books.length > 0) {
        const cleanedBooks = parsed.books.map((b: any) => ({
          title: clean(b.title),
          author: clean(b.author),
          genre: clean(b.genre) || '일반',
          quote: clean(b.quote),
          reason: clean(b.reason),
        }));

        return res.json({
          emotion: clean(parsed.emotion) || inferEmotion(rawInput),
          crisis: false,
          books: cleanedBooks.slice(0, targetBookCount),
          source: 'gemini',
          model: targetModel,
        });
      }
    } catch (err: any) {
      console.warn('Gemini API call failed, falling back to Claude or curated library:', err.message);
    }
  }

  // 2. Try Anthropic Claude API if requested or as fallback
  const currentClaudeKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
  if ((targetModel.startsWith('claude') || !isGeminiSelected) && isValidKey(currentClaudeKey)) {
    try {
      const claudePrompt = `${customInstruction ? `${customInstruction}\n\n` : ''}당신은 서점의 북 큐레이터입니다.
${curatorPersona ? `큐레이터 페르소나:\n${curatorPersona}\n` : ''}
아래 <keyword> 표현을 쓴 사람에게 맞는 책 ${targetBookCount}권을 추천하세요.
${preferredGenres.length > 0 ? `우선 장르: ${preferredGenres.join(', ')}` : ''}
${combinedExclude.length > 0 ? `제외 도서: ${combinedExclude.join(', ')}` : ''}
반드시 순수 JSON 객체만 출력하세요:
{"emotion":"감정 단어","crisis":false,"books":[{"title":"책 제목","author":"저자","genre":"분야","quote":"대표 문장","reason":"추천 이유"}]}
<keyword>${rawInput}</keyword>`;

      const claudePromise = fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': currentClaudeKey!,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-3-5-haiku-latest',
          max_tokens: 1000,
          messages: [{ role: 'user', content: claudePrompt }],
        }),
      });

      const claudeRes = await withTimeout(claudePromise, 6500);
      if (claudeRes.ok) {
        const data = await claudeRes.json();
        const text = data.content?.[0]?.text || '{}';
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return res.json({
            emotion: clean(parsed.emotion) || inferEmotion(rawInput),
            crisis: !!parsed.crisis,
            books: (parsed.books || []).slice(0, targetBookCount),
            source: 'claude',
            model: 'claude-3-5-haiku',
          });
        }
      }
    } catch (claudeErr: any) {
      console.warn('Claude API call failed:', claudeErr.message);
    }
  }

  // 3. High quality built-in sample curation fallback
  const curated = getCuratedRecommendations(rawInput, combinedExclude, targetBookCount, preferredGenres);
  return res.json({
    ...curated,
    note: '현재 스마트 샘플 큐레이터 모드로 작동 중입니다.',
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
