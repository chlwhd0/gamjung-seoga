import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  RefreshCw, 
  ExternalLink, 
  ChevronDown, 
  AlertCircle, 
  CheckCircle2, 
  BookOpen, 
  PhoneCall, 
  SlidersHorizontal,
  ShieldCheck
} from 'lucide-react';
import { GoogleAuthModal } from './components/GoogleAuthModal';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminAIConfig } from './types/admin';
import { loadAdminConfig, saveAdminConfig } from './utils/adminConfig';
import { AdminUser, loadAdminSession, clearAdminSession } from './utils/googleAuth';

interface BookItem {
  title: string;
  author: string;
  genre: string;
  quote: string;
  reason: string;
}

interface MoodOption {
  w: string;
  phrase: string;
  svg: React.ReactNode;
}

const MOODS: MoodOption[] = [
  {
    w: "분노",
    phrase: "속에서 불이 끓어요",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
        <path d="M12 3c1 3.2 4.4 4.6 4.4 8.6a4.4 4.4 0 0 1-8.8 0c0-1.7.7-2.9 1.7-3.9.2 1.4.9 2.1 1.7 2.4.4-2.7-.2-4.8 1-7.1z" />
      </svg>
    )
  },
  {
    w: "불안",
    phrase: "안개 속을 걷는 기분",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
        <path d="M3 8c2-2.2 4 2.2 6 0s4 2.2 6 0 4 2.2 6 0M3 13c2-2.2 4 2.2 6 0s4 2.2 6 0 4 2.2 6 0M3 18c2-2.2 4 2.2 6 0s4 2.2 6 0 4 2.2 6 0" />
      </svg>
    )
  },
  {
    w: "슬픔",
    phrase: "마음에 비가 내려요",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
        <path d="M7 14.5a4 4 0 0 1 .4-8A5 5 0 0 1 17 7.6a3.5 3.5 0 0 1 0 6.9H7z" />
        <path d="M9 17.5l-1 3M13 17.5l-1 3M17 17.5l-1 3" />
      </svg>
    )
  },
  {
    w: "외로움",
    phrase: "빈 의자 하나",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
        <path d="M20 14.6A8 8 0 1 1 9.4 4a6.6 6.6 0 0 0 10.6 10.6z" />
      </svg>
    )
  },
  {
    w: "무기력",
    phrase: "낙엽처럼 가라앉아요",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
        <path d="M5 19c0-8.5 5.2-14 15-14 0 10-5.8 15-14.5 15" />
        <path d="M5 19l8-8" />
      </svg>
    )
  },
  {
    w: "지침",
    phrase: "촛불이 다 타 가요",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
        <path d="M9 10.5h6V20H9z" />
        <path d="M12 3c1.6 2 2 3.2 0 4.8C10 6.2 10.4 5 12 3z" />
        <path d="M7 20h10" />
      </svg>
    )
  },
  {
    w: "설렘",
    phrase: "봄바람이 불어와요",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
        <path d="M12 20s-7.2-4.6-7.2-10.2A4.2 4.2 0 0 1 12 7.4a4.2 4.2 0 0 1 7.2 2.4C19.2 15.4 12 20 12 20z" />
      </svg>
    )
  },
  {
    w: "기쁨",
    phrase: "햇살이 가득해요",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7" />
      </svg>
    )
  },
  {
    w: "평온",
    phrase: "따뜻한 차 한 잔",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
        <path d="M5 9.5h11v4.6a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z" />
        <path d="M16 10.5h1.6a2.2 2.2 0 0 1 0 4.4H16" />
        <path d="M9 3.2c-1 1.1 1 2 0 3.2M13 3.2c-1 1.1 1 2 0 3.2" />
      </svg>
    )
  }
];

const LEVELS = ["살짝", "조금", "꽤", "많이", "몹시"];
const COVERS = ["#5A3822", "#6B2E2A", "#3E4A34"];

function hasBatchim(s: string) {
  if (!s) return false;
  const c = s.charCodeAt(s.length - 1);
  return c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 !== 0;
}

function euroRo(s: string) {
  if (!s) return "으로";
  const c = s.charCodeAt(s.length - 1);
  const t = (c - 0xAC00) % 28;
  return c >= 0xAC00 && c <= 0xD7A3 && t !== 0 && t !== 8 ? "으로" : "로";
}

export default function App() {
  const [pickedMood, setPickedMood] = useState<string | null>(null);
  const [gaugeLevel, setGaugeLevel] = useState<number>(3);
  const [freeText, setFreeText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [books, setBooks] = useState<BookItem[]>([]);
  const [currentKeyword, setCurrentKeyword] = useState<string>("");
  const [detectedEmotion, setDetectedEmotion] = useState<string>("");
  const [isCrisis, setIsCrisis] = useState<boolean>(false);
  const [seenTitles, setSeenTitles] = useState<string[]>([]);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [sourceNote, setSourceNote] = useState<string>("");
  const [activeBuyIndex, setActiveBuyIndex] = useState<number | null>(null);
  const [showFixMenu, setShowFixMenu] = useState<boolean>(false);
  const [apiMode, setApiMode] = useState<string>('checking');

  // Admin Google Auth States
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState<boolean>(false);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => loadAdminSession());
  const [adminConfig, setAdminConfig] = useState<AdminAIConfig>(() => loadAdminConfig());

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Check backend API status on mount
  useEffect(() => {
    fetch('/api/status')
      .then(res => res.json())
      .then(data => {
        setApiMode(data.mode);
      })
      .catch(() => {
        setApiMode('sample');
      });
  }, []);

  const handleAdminConfigUpdate = (newConfig: AdminAIConfig) => {
    setAdminConfig(newConfig);
    saveAdminConfig(newConfig);
    fetch('/api/admin/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newConfig)
    }).catch(() => {});
  };

  const handleAdminButtonClick = () => {
    if (adminUser) {
      // Already authenticated with valid Google session
      setIsAdminOpen(true);
    } else {
      setIsGoogleModalOpen(true);
    }
  };

  const handleLogout = () => {
    clearAdminSession();
    setAdminUser(null);
    setIsAdminOpen(false);
  };

  // Close buy dropdowns on outer click or Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.buy-container')) {
        setActiveBuyIndex(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveBuyIndex(null);
        setShowFixMenu(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleMoodClick = (moodWord: string) => {
    if (pickedMood === moodWord) {
      setPickedMood(null);
    } else {
      setPickedMood(moodWord);
      setFreeText("");
    }
    setErrorNotice(null);
  };

  const handleFreeTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setFreeText(val);
    if (val.trim() && pickedMood) {
      setPickedMood(null);
    }
    setErrorNotice(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight + 2, 140) + "px";
    }
  };

  const handleRecommend = async (isAgain = false) => {
    if (loading) return;

    const typed = freeText.trim();
    const base = typed || pickedMood;

    if (!base) {
      setErrorNotice("마음의 날씨 카드를 고르거나 기분을 직접 적어 주세요.");
      return;
    }

    const keyword = typed ? typed : `${LEVELS[gaugeLevel - 1]} ${base}`;

    setLoading(true);
    setErrorNotice(null);
    if (!isAgain) {
      setSuccessNotice(null);
      setIsCrisis(false);
      setBooks([]);
    }

    if (resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    try {
      const exclude = isAgain ? seenTitles : [];
      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base,
          level: typed ? null : gaugeLevel,
          keyword,
          typed: !!typed,
          exclude,
          adminConfigOverride: adminConfig
        })
      });

      if (!res.ok) {
        throw new Error('추천 결과를 받아오지 못했습니다.');
      }

      const data = await res.json();

      if (data.crisis) {
        setIsCrisis(true);
        setBooks([]);
        setCurrentKeyword(keyword);
        setDetectedEmotion("");
        return;
      }

      const newBooks: BookItem[] = data.books || [];
      if (newBooks.length === 0) {
        setErrorNotice(isAgain ? "더 이상 추천할 새로운 책이 없습니다. 다른 표현으로 시도해 보세요." : "추천 도서를 찾지 못했습니다. 다시 시도해 주세요.");
        return;
      }

      setBooks(newBooks);
      setCurrentKeyword(keyword);
      setDetectedEmotion(data.emotion || base);
      setIsCrisis(false);

      const addedTitles = newBooks.map(b => b.title);
      setSeenTitles(prev => [...prev, ...addedTitles]);

      if (data.source) {
        setApiMode(data.source);
      }

      const engineName = data.source === 'gemini' 
        ? (data.model || 'Gemini 3.8 Flash') 
        : data.source === 'claude' 
        ? 'Claude' 
        : '서점 큐레이터';
      setSourceNote(`${engineName}가 큐레이터 역할로 고른 추천입니다. 구매 전 제목과 저자를 확인해 주세요. 대표 문장은 번역판마다 다를 수 있습니다.`);

      if (isAgain) {
        setSuccessNotice(`새로 추천했어요 · 이전 ${seenTitles.length}권은 제외했어요`);
      } else {
        setSuccessNotice(null);
      }
    } catch (err: any) {
      setErrorNotice(err.message || 'AI 추천을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const isLockedGauge = !!freeText.trim();
  const isCtaReady = !!pickedMood || !!freeText.trim();

  // If Admin Dashboard is active, render the Admin View
  if (isAdminOpen) {
    return (
      <AdminDashboard
        initialConfig={adminConfig}
        currentUser={adminUser}
        onClose={() => setIsAdminOpen(false)}
        onLogout={handleLogout}
        onConfigChange={handleAdminConfigUpdate}
      />
    );
  }

  return (
    <div className="min-h-screen pb-16">
      {/* Header Banner */}
      <header className="relative z-10 bg-[var(--sign-bg)] text-[#F6EAD3] border-b-4 border-double border-[var(--brass)] shadow-md">
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-baseline gap-3 flex-wrap">
            <h1 className="font-serif font-extrabold text-2xl md:text-3xl tracking-wider text-[#F6EAD3]">
              감정서가
            </h1>
            <p className="text-sm md:text-base opacity-90 font-light">
              기분으로 찾는 책
            </p>
          </div>
          
          <div className="flex items-center gap-2.5">
            {/* AI Engine Status Indicator */}
            <div className="flex items-center gap-2 text-xs bg-black/25 px-3 py-1.5 rounded-full border border-[var(--brass)]/40 text-[#F6EAD3]/90">
              <span className={`w-2 h-2 rounded-full ${apiMode === 'gemini' ? 'bg-emerald-400' : apiMode === 'claude' ? 'bg-amber-400' : 'bg-blue-400'}`} />
              <span className="font-mono text-[11px]">
                {adminConfig.model}
              </span>
            </div>

            {/* Admin Google Auth Button */}
            <button
              type="button"
              onClick={handleAdminButtonClick}
              title="관리자 AI 튜닝 설정 (Google 로그인)"
              className="p-1.5 px-3 rounded-full bg-black/25 hover:bg-black/40 border border-[var(--brass)]/60 text-[#F6EAD3] cursor-pointer transition-all flex items-center gap-1.5 text-xs font-semibold"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[var(--brass)]" />
              <span>
                {adminUser ? '관리자 집무실' : '관리자 로그인'}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Google Authentication Modal */}
      <GoogleAuthModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        onSuccess={(user) => {
          setAdminUser(user);
          setIsGoogleModalOpen(false);
          setIsAdminOpen(true);
        }}
      />

      {/* Main Content Area */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-6">
        <p className="text-[var(--soft)] mb-6 text-sm sm:text-base">
          지금 마음에 깃든 기분을 고르거나 자유롭게 적어 주세요. 서점 책지기가 마음을 어루만져 줄 책을 골라 드립니다.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Emotion Selection & Inputs */}
          <section className="lg:col-span-5 bg-[var(--panel)] border border-[var(--line)] p-5 rounded shadow-sm">
            <h2 className="font-serif font-bold text-lg text-[var(--ink)] mb-1 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[var(--brass)]" />
              오늘 마음의 날씨
            </h2>
            <p className="text-xs sm:text-sm text-[var(--soft)] mb-4">
              지금 기분과 가장 닮은 카드를 하나 골라 주세요.
            </p>

            {/* 3x3 Emotion Cards Grid */}
            <div className="grid grid-cols-3 gap-2" role="group" aria-label="마음의 날씨 카드">
              {MOODS.map(m => {
                const isSelected = pickedMood === m.w;
                return (
                  <button
                    key={m.w}
                    type="button"
                    onClick={() => handleMoodClick(m.w)}
                    aria-pressed={isSelected}
                    className={`text-center rounded p-2.5 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer min-h-[5.5rem] border ${
                      isSelected
                        ? "bg-[var(--leather)] text-[var(--on-leather)] border-[var(--brass)] shadow-inner ring-2 ring-[var(--brass)]"
                        : "bg-[var(--page)] text-[var(--ink)] border-[var(--line)] hover:border-[var(--brass)] hover:bg-[var(--panel)]"
                    }`}
                  >
                    <div className={`transition-colors ${isSelected ? "text-[var(--on-leather)]" : "text-[var(--brass)]"}`}>
                      {m.svg}
                    </div>
                    <span className="font-serif font-bold text-sm tracking-wide mt-0.5">
                      {m.w}
                    </span>
                    <span className={`text-[10px] leading-tight line-clamp-1 ${isSelected ? "text-[var(--on-leather)]/90" : "text-[var(--soft)]"}`}>
                      {m.phrase}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Intensity Gauge */}
            <div className={`mt-5 pt-4 border-t border-[var(--line)]/60 transition-opacity ${isLockedGauge ? "opacity-50" : "opacity-100"}`}>
              <div className="flex items-baseline justify-between mb-2 text-xs font-semibold">
                <span className="text-[var(--ink)]">기분의 세기</span>
                <span className="font-serif font-extrabold text-base text-[var(--brass)]">
                  {LEVELS[gaugeLevel - 1]}
                </span>
              </div>
              <div className="px-1">
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={gaugeLevel}
                  disabled={isLockedGauge}
                  onChange={(e) => setGaugeLevel(Number(e.target.value))}
                  style={{ '--fill': `${((gaugeLevel - 1) / 4) * 100}%` } as React.CSSProperties}
                  className="gauge-slider"
                  aria-label="기분의 세기"
                />
                <ul className="flex justify-between text-xs text-[var(--soft)] mt-1 px-1">
                  {LEVELS.map((name, i) => (
                    <li
                      key={name}
                      className={i === gaugeLevel - 1 ? "font-bold text-[var(--ink)]" : ""}
                    >
                      {name}
                    </li>
                  ))}
                </ul>
              </div>
              {isLockedGauge && (
                <p className="text-[11px] text-[var(--soft)] mt-2">
                  직접 적은 문장에는 세기 조절이 적용되지 않습니다.
                </p>
              )}
            </div>

            {/* Custom Free Text Input */}
            <div className="mt-5 pt-4 border-t border-[var(--line)]/60">
              <div className="flex items-baseline justify-between mb-1.5 text-xs font-semibold">
                <label htmlFor="freeText" className="text-[var(--ink)]">
                  카드에 없으면 직접 적어 주세요
                </label>
                <span className={`tabular-nums ${freeText.length >= 90 ? "text-[var(--err)] font-bold" : "text-[var(--soft)]"}`}>
                  {freeText.length}/100
                </span>
              </div>
              <textarea
                id="freeText"
                ref={textareaRef}
                rows={2}
                maxLength={100}
                value={freeText}
                onChange={handleFreeTextChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (isCtaReady) handleRecommend(false);
                  }
                }}
                placeholder="예: 허무함, 내일 발표라 잠이 안 와요, 오랜 친구와 이별했어요"
                className="w-full bg-[var(--page)] border border-[var(--line)] rounded p-2.5 text-sm text-[var(--ink)] placeholder:text-[var(--soft)]/70 focus:outline-none focus:border-[var(--brass)] focus:ring-1 focus:ring-[var(--brass)] resize-none transition-colors"
              />
            </div>

            {/* CTA Button */}
            <div className="mt-5">
              <button
                type="button"
                disabled={!isCtaReady || loading}
                onClick={() => handleRecommend(false)}
                className={`w-full font-serif font-bold text-base py-3 px-4 rounded text-[var(--on-leather)] bg-[var(--leather)] shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border border-[var(--brass)] ${
                  !isCtaReady || loading ? "opacity-60 cursor-not-allowed" : "hover:brightness-110 active:scale-[0.99]"
                }`}
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-[var(--on-leather)]/40 border-t-[var(--on-leather)] rounded-full animate-spin-custom" />
                    <span>책을 찾는 중…</span>
                  </>
                ) : (
                  <>
                    <BookOpen className="w-4 h-4 text-[var(--brass)]" />
                    <span>책지기에서 추천받기</span>
                  </>
                )}
              </button>
            </div>
          </section>

          {/* Right Column: Recommendation Results */}
          <section ref={resultsRef} className="lg:col-span-7 bg-[var(--panel)] border border-[var(--line)] p-5 rounded shadow-sm min-h-[500px] flex flex-col">
            {/* Header / Keyword display */}
            <div className="border-b-4 border-double border-[var(--brass)] pb-2 mb-4 flex items-baseline justify-between flex-wrap gap-2">
              <h2 className="font-serif font-extrabold text-xl text-[var(--ink)]">
                {isCrisis ? "도움 안내" : "추천 도서"}
              </h2>
              {currentKeyword && !isCrisis && (
                <span className="font-serif font-bold text-sm text-[var(--brass)] truncate max-w-[280px]">
                  “{currentKeyword}”
                </span>
              )}
            </div>

            {/* Understood Emotion Chip */}
            {detectedEmotion && !isCrisis && freeText.trim() && (
              <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
                <span className="bg-[var(--panel)] border border-[var(--brass)] text-[var(--ink)] px-3 py-1 rounded-full font-medium">
                  입력하신 내용을 <strong>‘{detectedEmotion}’</strong>{euroRo(detectedEmotion)} 이해했어요.
                </span>
                <button
                  type="button"
                  onClick={() => setShowFixMenu(!showFixMenu)}
                  className="text-[var(--soft)] hover:text-[var(--ink)] underline underline-offset-2 cursor-pointer py-0.5"
                >
                  이 감정이 아니에요
                </button>

                {showFixMenu && (
                  <div className="w-full mt-2 p-3 bg-[var(--page)] border border-[var(--line)] rounded flex flex-wrap gap-1.5 items-center">
                    <span className="text-[var(--soft)] mr-1">직접 선택:</span>
                    {MOODS.map(m => (
                      <button
                        key={m.w}
                        type="button"
                        onClick={() => {
                          setPickedMood(m.w);
                          setFreeText("");
                          setShowFixMenu(false);
                          setTimeout(() => {
                            const newKw = `${LEVELS[gaugeLevel - 1]} ${m.w}`;
                            setCurrentKeyword(newKw);
                            handleRecommend(false);
                          }, 50);
                        }}
                        className="px-2.5 py-1 text-xs rounded-full border border-[var(--line)] bg-[var(--panel)] hover:border-[var(--brass)] font-medium text-[var(--ink)] transition-colors"
                      >
                        {m.w}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Error or Notice Alert */}
            {errorNotice && (
              <div className="mb-4 p-3 bg-[var(--err-bg)] border-l-4 border-[var(--err)] text-[var(--ink)] rounded flex items-start gap-2.5 text-xs sm:text-sm">
                <AlertCircle className="w-4 h-4 text-[var(--err)] shrink-0 mt-0.5" />
                <div className="flex-1">{errorNotice}</div>
              </div>
            )}

            {/* Success Notice */}
            {successNotice && (
              <div className="mb-4 p-2.5 bg-[var(--page)] border-l-4 border-[var(--ok)] text-[var(--ink)] rounded flex items-center gap-2 text-xs">
                <CheckCircle2 className="w-4 h-4 text-[var(--ok)] shrink-0" />
                <span>{successNotice}</span>
              </div>
            )}

            {/* Crisis / Safety Support Banner */}
            {isCrisis && (
              <div className="p-5 bg-[var(--err-bg)] border border-[var(--err)] border-l-8 rounded text-[var(--ink)] space-y-3 animate-rise">
                <h3 className="font-serif font-extrabold text-lg text-[var(--ink)] flex items-center gap-2">
                  <PhoneCall className="w-5 h-5 text-[var(--err)]" />
                  먼저 안내해 드릴게요
                </h3>
                <p className="text-sm leading-relaxed">
                  지금 마음이 많이 힘들고 고단하게 느껴집니다. 책을 읽기 전에, 당신의 이야기를 따뜻하게 들어줄 수 있는 곳을 먼저 알려 드려요.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <a
                    href="tel:109"
                    className="flex items-center justify-between p-3 rounded bg-[var(--panel)] border border-[var(--ink)] hover:border-[var(--brass)] text-[var(--ink)] transition-colors no-underline"
                  >
                    <span className="font-semibold text-xs sm:text-sm">자살예방상담전화</span>
                    <span className="font-extrabold text-base font-serif text-[var(--brass)]">109</span>
                  </a>
                  <a
                    href="tel:1577-0199"
                    className="flex items-center justify-between p-3 rounded bg-[var(--panel)] border border-[var(--ink)] hover:border-[var(--brass)] text-[var(--ink)] transition-colors no-underline"
                  >
                    <span className="font-semibold text-xs sm:text-sm">정신건강위기상담전화</span>
                    <span className="font-extrabold text-sm sm:text-base font-serif text-[var(--brass)]">1577-0199</span>
                  </a>
                </div>
                <p className="text-xs text-[var(--soft)] pt-1">
                  지금 바로 위험하거나 위급한 상황이라면 119(응급) 또는 112(경찰)에 연락해 주세요.
                </p>
              </div>
            )}

            {/* Loading Shimmer Skeleton */}
            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-2">
                {Array.from({ length: adminConfig.bookCount || 3 }).map((_, i) => (
                  <div key={i} className="flex flex-col space-y-2">
                    <div className="aspect-[2/3] w-full max-w-[170px] mx-auto rounded border border-[var(--line)] animate-shimmer" />
                    <div className="h-4 bg-[var(--track)] rounded w-3/4 animate-shimmer" />
                    <div className="h-3 bg-[var(--track)] rounded w-1/2 animate-shimmer" />
                    <div className="h-10 bg-[var(--track)] rounded w-full animate-shimmer mt-2" />
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!loading && !isCrisis && books.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[var(--soft)]">
                <BookOpen className="w-12 h-12 text-[var(--line)] mb-3" />
                <p className="font-serif text-base text-[var(--ink)] font-semibold mb-1">
                  서가가 비어 있습니다
                </p>
                <p className="text-xs sm:text-sm max-w-sm">
                  {pickedMood 
                    ? `‘${pickedMood}’ 카드를 고르셨어요. “책지기에서 추천받기”를 누르면 ${adminConfig.bookCount}권의 책이 진열됩니다.`
                    : freeText.trim()
                    ? `적어주신 마음으로 “책지기에서 추천받기”를 누르면 알맞은 책을 찾아드립니다.`
                    : `왼쪽에서 마음의 날씨 카드를 선택하거나 기분을 직접 입력해 보세요.`}
                </p>
              </div>
            )}

            {/* Books Grid */}
            {!loading && !isCrisis && books.length > 0 && (
              <div className={`grid grid-cols-1 ${books.length >= 4 ? 'sm:grid-cols-2 md:grid-cols-4' : books.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3'} gap-5 my-2`}>
                {books.map((b, idx) => {
                  const coverColor = COVERS[idx % COVERS.length];
                  const isBuyOpen = activeBuyIndex === idx;
                  const encodedTitle = encodeURIComponent(b.title);

                  return (
                    <article
                      key={`${b.title}-${idx}`}
                      className="flex flex-col border sm:border-0 border-[var(--line)]/50 p-3 sm:p-0 rounded bg-[var(--page)] sm:bg-transparent animate-rise"
                      style={{ animationDelay: `${idx * 100}ms` }}
                    >
                      <div 
                        className="relative aspect-[2/3] w-full max-w-[170px] mx-auto rounded-r-md rounded-l-sm overflow-hidden flex flex-col shadow-md transition-transform hover:-translate-y-1 duration-200"
                        style={{
                          backgroundColor: coverColor,
                          boxShadow: "inset 6px 0 0 rgba(0,0,0,0.3), inset 0 0 0 4px " + coverColor + ", inset 0 0 0 5px rgba(246,234,211,0.3), 0 4px 10px rgba(0,0,0,0.15)"
                        }}
                      >
                        <div className="flex-1 flex items-center justify-center p-3 pl-4 text-center">
                          <span className="font-serif font-extrabold text-[#F6EAD3] text-sm sm:text-base leading-snug drop-shadow-sm">
                            {b.title}
                          </span>
                        </div>

                        {b.genre && (
                          <div className="bg-[#C9993F] text-[#2B1D0E] font-bold text-[10px] sm:text-[11px] px-2 py-0.5 sm:py-1 text-center tracking-wider">
                            {b.genre}
                          </div>
                        )}
                      </div>

                      <div className="mt-3 flex-1 flex flex-col">
                        <h3 className="font-serif font-extrabold text-sm sm:text-base text-[var(--ink)] leading-snug">
                          {b.title}
                        </h3>
                        <p className="text-xs text-[var(--soft)] mt-0.5 mb-1.5">
                          {b.author} {b.genre && `| ${b.genre}`}
                        </p>

                        {b.quote && (
                          <blockquote className="text-xs font-serif italic text-[var(--ink)] border-l-2 border-[var(--brass)] pl-2.5 my-1.5 leading-relaxed opacity-95">
                            “{b.quote}”
                          </blockquote>
                        )}

                        <p className="text-xs text-[var(--soft)] leading-relaxed mt-1 flex-1">
                          {b.reason}
                        </p>

                        <div className="relative mt-3 buy-container">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveBuyIndex(isBuyOpen ? null : idx);
                            }}
                            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded text-xs font-bold text-[var(--on-leather)] bg-[var(--leather)] hover:border-[var(--brass)] border border-transparent shadow-sm cursor-pointer transition-colors"
                          >
                            <span>구매하기</span>
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isBuyOpen ? 'rotate-180' : ''}`} />
                          </button>

                          {isBuyOpen && (
                            <div className="absolute bottom-full mb-1 left-0 right-0 sm:left-auto sm:right-0 sm:w-48 bg-[var(--panel)] border border-[var(--line)] rounded shadow-xl p-1.5 z-30 flex flex-col gap-1 text-xs">
                              <a
                                href={`https://search.kyobobook.co.kr/search?keyword=${encodedTitle}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between p-2 rounded hover:bg-[var(--page)] text-[var(--ink)] font-medium transition-colors"
                              >
                                <span>교보문고에서 찾기</span>
                                <ExternalLink className="w-3.5 h-3.5 text-[var(--brass)]" />
                              </a>
                              <a
                                href={`https://www.yes24.com/Product/Search?domain=BOOK&query=${encodedTitle}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between p-2 rounded hover:bg-[var(--page)] text-[var(--ink)] font-medium transition-colors"
                              >
                                <span>YES24에서 찾기</span>
                                <ExternalLink className="w-3.5 h-3.5 text-[var(--brass)]" />
                              </a>
                              <a
                                href={`https://www.aladin.co.kr/search/wsearchresult.aspx?SearchTarget=Book&SearchWord=${encodedTitle}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between p-2 rounded hover:bg-[var(--page)] text-[var(--ink)] font-medium transition-colors"
                              >
                                <span>알라딘에서 찾기</span>
                                <ExternalLink className="w-3.5 h-3.5 text-[var(--brass)]" />
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {/* Footer Actions: "다른 책 보기" Button */}
            {!loading && !isCrisis && books.length > 0 && (
              <div className="mt-auto pt-4 border-t border-[var(--line)] flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleRecommend(true)}
                  className="font-serif font-bold text-xs sm:text-sm px-4 py-2 rounded bg-[var(--panel)] border-2 border-[var(--brass)] text-[var(--ink)] hover:bg-[var(--page)] active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-[var(--brass)]" />
                  <span>다른 책 보기</span>
                </button>

                {sourceNote && (
                  <p className="text-[11px] text-[var(--soft)] max-w-sm leading-tight text-right">
                    {sourceNote}
                  </p>
                )}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
