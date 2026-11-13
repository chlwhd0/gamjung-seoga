import React, { useState, lazy, Suspense } from 'react';
import { 
  ArrowLeft, 
  RotateCcw, 
  Save, 
  Sparkles, 
  Sliders, 
  Filter, 
  Play, 
  Check, 
  AlertCircle, 
  Code, 
  FileText, 
  Cpu, 
  Layers, 
  BookOpen, 
  Plus, 
  X,
  ExternalLink,
  ChevronDown,
  Clock,
  LogOut,
  Users,
  ShieldCheck,
  UserPlus,
  Trash2,
  History
} from 'lucide-react';
import { 
  AdminAIConfig, 
  ToneStyle, 
  SupportedModel, 
  ThinkingLevelOption 
} from '../types/admin';
import { 
  TONE_PRESETS, 
  saveAdminConfig, 
  resetAdminConfig 
} from '../utils/adminConfig';
import { 
  AdminUser, 
  MASTER_ADMIN_EMAIL, 
  loadAllowedAdmins, 
  saveAllowedAdmins 
} from '../utils/googleAuth';

interface AdminDashboardProps {
  initialConfig: AdminAIConfig;
  currentUser?: AdminUser | null;
  onClose: () => void;
  onLogout: () => void;
  onConfigChange: (newConfig: AdminAIConfig) => void;
}

type TabKey = 'persona' | 'model' | 'rules' | 'playground' | 'admins' | 'history';

// 추천 이력 화면은 열 때만 불러옵니다 (Firebase 로그인 코드가 첫 화면을 무겁게 하지 않도록)
const RecommendHistoryPanel = lazy(() => import('./RecommendHistoryPanel'));

const AVAILABLE_GENRES = [
  '소설', '에세이', '인문/철학', '시', '심리/치유', '자기계발', '고전', '과학/교양', '역사/사회'
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  initialConfig,
  currentUser,
  onClose,
  onLogout,
  onConfigChange
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('persona');
  const [config, setConfig] = useState<AdminAIConfig>({ ...initialConfig });
  const [saveToast, setSaveToast] = useState(false);
  const [newExcludedInput, setNewExcludedInput] = useState('');

  // Whitelist management state
  const [allowedAdmins, setAllowedAdmins] = useState<string[]>(() => loadAllowedAdmins());
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [adminNotice, setAdminNotice] = useState<string | null>(null);

  // Simulation Playground State
  const [simInput, setSimInput] = useState('새로운 프로젝트를 앞두고 가슴이 두근거려요');
  const [simLevel, setSimLevel] = useState<number>(3);
  const [simLoading, setSimLoading] = useState(false);
  const [simResult, setSimResult] = useState<any | null>(null);
  const [simError, setSimError] = useState<string | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);
  const [simDuration, setSimDuration] = useState<number | null>(null);

  const handleToneSelect = (toneKey: ToneStyle) => {
    const preset = TONE_PRESETS[toneKey];
    setConfig(prev => ({
      ...prev,
      toneStyle: toneKey,
      curatorPersona: preset.persona
    }));
  };

  const handleGenreToggle = (genre: string) => {
    setConfig(prev => {
      const exists = prev.preferredGenres.includes(genre);
      const next = exists 
        ? prev.preferredGenres.filter(g => g !== genre)
        : [...prev.preferredGenres, genre];
      return { ...prev, preferredGenres: next.length > 0 ? next : ['소설'] };
    });
  };

  const handleAddExcluded = (e: React.FormEvent) => {
    e.preventDefault();
    const val = newExcludedInput.trim();
    if (!val) return;
    if (!config.excludedKeywords.includes(val)) {
      setConfig(prev => ({
        ...prev,
        excludedKeywords: [...prev.excludedKeywords, val]
      }));
    }
    setNewExcludedInput('');
  };

  const handleRemoveExcluded = (keyword: string) => {
    setConfig(prev => ({
      ...prev,
      excludedKeywords: prev.excludedKeywords.filter(k => k !== keyword)
    }));
  };

  const handleSave = () => {
    saveAdminConfig(config);
    onConfigChange(config);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2200);
  };

  const handleReset = () => {
    if (window.confirm('모든 AI 프롬프트와 튜닝 설정을 기본 출고 상태로 복원하시겠습니까?')) {
      const def = resetAdminConfig();
      setConfig(def);
      onConfigChange(def);
      setSaveToast(true);
      setTimeout(() => setSaveToast(false), 2200);
    }
  };

  const handleAddAdminEmail = (e: React.FormEvent) => {
    e.preventDefault();
    const email = newAdminEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      setAdminNotice('올바른 이메일 주소를 입력해 주세요.');
      return;
    }
    if (allowedAdmins.includes(email)) {
      setAdminNotice('이미 등록된 관리자 계정입니다.');
      return;
    }
    const updated = [...allowedAdmins, email];
    setAllowedAdmins(updated);
    saveAllowedAdmins(updated);
    setNewAdminEmail('');
    setAdminNotice(`${email} 계정이 관리자 목록에 추가되었습니다.`);
    setTimeout(() => setAdminNotice(null), 3000);
  };

  const handleRemoveAdminEmail = (email: string) => {
    if (email === MASTER_ADMIN_EMAIL) {
      alert('대표 관리자 계정은 삭제할 수 없습니다.');
      return;
    }
    if (window.confirm(`${email} 계정의 관리자 접근 권한을 해제하시겠습니까?`)) {
      const updated = allowedAdmins.filter(e => e !== email);
      setAllowedAdmins(updated);
      saveAllowedAdmins(updated);
      setAdminNotice(`${email} 계정의 권한이 해제되었습니다.`);
      setTimeout(() => setAdminNotice(null), 3000);
    }
  };

  const runSimulation = async () => {
    if (!simInput.trim() || simLoading) return;
    setSimLoading(true);
    setSimError(null);
    setSimResult(null);
    const start = performance.now();

    try {
      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base: simInput.trim(),
          level: simLevel,
          keyword: simInput.trim(),
          typed: true,
          exclude: config.excludedKeywords,
          adminConfigOverride: config
        })
      });

      const end = performance.now();
      setSimDuration(Math.round(end - start));

      if (!res.ok) {
        throw new Error('시뮬레이션 응답 실패 (' + res.status + ')');
      }

      const data = await res.json();
      setSimResult(data);
    } catch (err: any) {
      setSimError(err.message || '시뮬레이션 중 오류가 발생했습니다.');
    } finally {
      setSimLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--page)] text-[var(--ink)] pb-12 flex flex-col">
      {/* Admin Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[var(--sign-bg)] text-[#F6EAD3] border-b-2 border-double border-[var(--brass)] shadow-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded hover:bg-black/25 text-[#F6EAD3] cursor-pointer transition-colors flex items-center gap-1.5 text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>메인 서가로</span>
            </button>
            <div className="h-4 w-px bg-[var(--brass)]/50" />
            <h1 className="font-serif font-extrabold text-lg sm:text-xl tracking-wide flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[var(--brass)]" />
              서재 관리자 집무실 (AI 튜닝 콘솔)
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Logged in Admin Profile Display */}
            {currentUser && (
              <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-black/25 border border-[var(--brass)]/40 text-xs">
                {currentUser.picture ? (
                  <img
                    src={currentUser.picture}
                    alt={currentUser.name}
                    className="w-5 h-5 rounded-full object-cover border border-[var(--brass)]"
                  />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-[var(--brass)]" />
                )}
                <span className="font-medium text-[#F6EAD3] hidden sm:inline">
                  {currentUser.email === MASTER_ADMIN_EMAIL ? '대표 관리자' : (currentUser.name || '관리자')}
                </span>
                <button
                  type="button"
                  onClick={onLogout}
                  title="관리자 로그아웃"
                  className="ml-1 p-1 hover:text-[var(--err)] text-[#F6EAD3]/80 cursor-pointer transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-1.5 rounded text-xs font-medium border border-[var(--brass)]/60 text-[#F6EAD3]/90 hover:bg-black/20 cursor-pointer flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[var(--brass)]" />
              <span className="hidden sm:inline">기본값 복원</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 rounded text-xs font-bold bg-[var(--leather)] border border-[var(--brass)] text-[var(--on-leather)] hover:brightness-110 active:scale-95 cursor-pointer shadow-sm flex items-center gap-1.5 transition-all"
            >
              <Save className="w-3.5 h-3.5 text-[var(--brass)]" />
              <span>설정 저장 & 적용</span>
            </button>
          </div>
        </div>
      </header>

      {/* Save Success Toast */}
      {saveToast && (
        <div className="fixed top-16 right-6 z-50 bg-[var(--panel)] border-2 border-[var(--ok)] text-[var(--ink)] px-4 py-2.5 rounded shadow-xl flex items-center gap-2 text-xs font-semibold animate-rise">
          <Check className="w-4 h-4 text-[var(--ok)]" />
          <span>AI 튜닝 설정이 성공적으로 저장 및 서비스에 적용되었습니다.</span>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 flex-1 w-full">
        {/* Subtitle / Mode Indicator */}
        <div className="flex items-center justify-between flex-wrap gap-2 mb-5 pb-3 border-b border-[var(--line)]/60 text-xs text-[var(--soft)]">
          <div>
            현재 적용 모델: <strong className="text-[var(--ink)] font-mono">{config.model}</strong>
            <span className="mx-2" aria-hidden="true">·</span>
            사고 깊이: <strong className="text-[var(--ink)] font-mono">{config.thinkingLevel}</strong>
            <span className="mx-2" aria-hidden="true">·</span>
            어조: <strong className="text-[var(--ink)]">{TONE_PRESETS[config.toneStyle].label}</strong>
          </div>
          <div className="text-[11px] font-mono tabular-nums">
            마지막 업데이트: {new Date(config.lastUpdated).toLocaleTimeString()}
          </div>
        </div>

        {/* Tab Selection Navigation */}
        <div className="flex border-b border-[var(--line)] mb-6 overflow-x-auto gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('persona')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'persona'
                ? 'border-[var(--brass)] text-[var(--ink)] bg-[var(--panel)]'
                : 'border-transparent text-[var(--soft)] hover:text-[var(--ink)]'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>1. 페르소나 & 프롬프트</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('model')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'model'
                ? 'border-[var(--brass)] text-[var(--ink)] bg-[var(--panel)]'
                : 'border-transparent text-[var(--soft)] hover:text-[var(--ink)]'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>2. 모델 & 씽킹 설정</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'rules'
                ? 'border-[var(--brass)] text-[var(--ink)] bg-[var(--panel)]'
                : 'border-transparent text-[var(--soft)] hover:text-[var(--ink)]'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>3. 큐레이션 규칙 & 필터</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('playground')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'playground'
                ? 'border-[var(--brass)] text-[var(--ink)] bg-[var(--panel)] shadow-inner'
                : 'border-transparent text-[var(--brass)] hover:text-[var(--ink)]'
            }`}
          >
            <Play className="w-4 h-4 text-[var(--brass)]" />
            <span className="font-bold">4. 실시간 시뮬레이션</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('admins')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'admins'
                ? 'border-[var(--brass)] text-[var(--ink)] bg-[var(--panel)]'
                : 'border-transparent text-[var(--soft)] hover:text-[var(--ink)]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>5. 관리자 권한 목록</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'history'
                ? 'border-[var(--brass)] text-[var(--ink)] bg-[var(--panel)]'
                : 'border-transparent text-[var(--soft)] hover:text-[var(--ink)]'
            }`}
          >
            <History className="w-4 h-4" />
            <span>6. 추천 이력</span>
          </button>
        </div>

        {/* Tab 6: Recommendation History (Firestore) */}
        {activeTab === 'history' && (
          <Suspense fallback={<p className="text-xs text-[var(--soft)]">불러오는 중…</p>}>
            <RecommendHistoryPanel />
          </Suspense>
        )}

        {/* Tab 1: Persona & System Prompt */}
        {activeTab === 'persona' && (
          <div className="space-y-6 animate-rise">
            <div className="bg-[var(--panel)] border border-[var(--line)] p-5 rounded shadow-xs">
              <h3 className="font-serif font-bold text-base text-[var(--ink)] mb-1 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[var(--brass)]" />
                큐레이터 톤앤매너 프리셋 선택
              </h3>
              <p className="text-xs text-[var(--soft)] mb-4">
                서점 큐레이터의 성격과 말투 스타일을 신속하게 프리셋으로 전환할 수 있습니다.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {(Object.keys(TONE_PRESETS) as ToneStyle[]).map((key) => {
                  const preset = TONE_PRESETS[key];
                  const isSelected = config.toneStyle === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleToneSelect(key)}
                      className={`text-left p-3.5 rounded border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[var(--leather)] text-[var(--on-leather)] border-[var(--brass)] shadow-md ring-2 ring-[var(--brass)]'
                          : 'bg-[var(--page)] text-[var(--ink)] border-[var(--line)] hover:border-[var(--brass)]'
                      }`}
                    >
                      <div className="font-bold text-sm mb-1">{preset.label}</div>
                      <div className={`text-xs leading-relaxed ${isSelected ? 'text-[var(--on-leather)]/85' : 'text-[var(--soft)]'}`}>
                        {preset.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-[var(--panel)] border border-[var(--line)] p-5 rounded shadow-xs">
              <div className="flex items-baseline justify-between mb-1.5">
                <label htmlFor="personaDesc" className="font-serif font-bold text-sm text-[var(--ink)]">
                  큐레이터 페르소나 정의 (Persona Profile)
                </label>
                <span className="text-[11px] text-[var(--soft)]">추천 이유(reason) 문장에 반영</span>
              </div>
              <textarea
                id="personaDesc"
                rows={3}
                value={config.curatorPersona}
                onChange={(e) => setConfig(prev => ({ ...prev, curatorPersona: e.target.value }))}
                className="w-full bg-[var(--page)] border border-[var(--line)] rounded p-3 text-xs sm:text-sm text-[var(--ink)] focus:outline-none focus:border-[var(--brass)]"
              />
            </div>

            <div className="bg-[var(--panel)] border border-[var(--line)] p-5 rounded shadow-xs">
              <div className="flex items-baseline justify-between mb-1.5">
                <label htmlFor="sysInstruction" className="font-serif font-bold text-sm text-[var(--ink)]">
                  시스템 인스트럭션 프롬프트 (System Instruction)
                </label>
                <span className="text-[11px] text-[var(--soft)] font-mono tabular-nums">
                  {config.systemInstruction.length} 자
                </span>
              </div>
              <p className="text-xs text-[var(--soft)] mb-2.5">
                AI 모델에게 전달되는 핵심 지침입니다. 추천 도서의 한국 출간 여부 검증 및 환각 방지 규칙이 포함되어 있습니다.
              </p>
              <textarea
                id="sysInstruction"
                rows={11}
                value={config.systemInstruction}
                onChange={(e) => setConfig(prev => ({ ...prev, systemInstruction: e.target.value }))}
                className="w-full bg-[var(--page)] border border-[var(--line)] rounded p-3 text-xs font-mono leading-relaxed text-[var(--ink)] focus:outline-none focus:border-[var(--brass)]"
              />
            </div>
          </div>
        )}

        {/* Tab 2: Model & Reasoning Settings */}
        {activeTab === 'model' && (
          <div className="space-y-6 animate-rise">
            <div className="bg-[var(--panel)] border border-[var(--line)] p-5 rounded shadow-xs">
              <h3 className="font-serif font-bold text-base text-[var(--ink)] mb-1 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[var(--brass)]" />
                추론 인공지능 모델 선택
              </h3>
              <p className="text-xs text-[var(--soft)] mb-4">
                감정서가 서비스에서 도서 큐레이션을 담당할 기본 대규모 언어 모델(LLM)을 지정합니다.
              </p>

              <div className="space-y-3">
                {[
                  {
                    id: 'gemini-3.8-flash' as SupportedModel,
                    name: 'Gemini 3.8 Flash (권장)',
                    desc: 'Google AI Studio 기본 최적화 모델. 감정 어휘 분석 속도가 가장 빠르며 자연스러운 한국어 문장 큐레이션 제공.',
                    badge: '기본 모델'
                  },
                  {
                    id: 'gemini-3.1-flash-lite' as SupportedModel,
                    name: 'Gemini 3.1 Flash-Lite',
                    desc: '초경량 초고속 모델. 모바일 또는 대량 요청 처리 시 레이턴시를 최소화할 때 유용.',
                    badge: '고속 모드'
                  },
                  {
                    id: 'claude-3-5-haiku' as SupportedModel,
                    name: 'Claude 3.5 Haiku',
                    desc: 'Anthropic Claude API 연동 모드 (ANTHROPIC_API_KEY 등록 필요). 문학적 인용구 해석에 강점.',
                    badge: '클로드 모드'
                  }
                ].map((item) => (
                  <label
                    key={item.id}
                    className={`flex items-start gap-3 p-3.5 rounded border cursor-pointer transition-colors ${
                      config.model === item.id 
                        ? 'border-[var(--brass)] bg-[var(--page)] shadow-xs' 
                        : 'border-[var(--line)]/70 hover:border-[var(--line)]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="modelSelector"
                      checked={config.model === item.id}
                      onChange={() => setConfig(prev => ({ ...prev, model: item.id }))}
                      className="mt-1 text-[var(--brass)] focus:ring-[var(--brass)]"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[var(--ink)]">{item.name}</span>
                        <span className="text-[11px] px-2 py-0.5 rounded border border-[var(--brass)] text-[var(--brass)] font-medium">
                          {item.badge}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--soft)] mt-0.5 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-[var(--panel)] border border-[var(--line)] p-5 rounded shadow-xs">
              <h3 className="font-serif font-bold text-base text-[var(--ink)] mb-1 flex items-center gap-2">
                <Layers className="w-4 h-4 text-[var(--brass)]" />
                Gemini 씽킹 레벨 (Reasoning Depth)
              </h3>
              <p className="text-xs text-[var(--soft)] mb-4">
                모델이 책을 고를 때 복합 감정과 심리적 맥락을 얼마나 깊이 사유하고 추론할지 결정합니다.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { level: 'LOW' as ThinkingLevelOption, title: 'LOW (낮은 추론)', note: '최소한의 사유 시간으로 지연시간(Latency) 단축' },
                  { level: 'MEDIUM' as ThinkingLevelOption, title: 'MEDIUM (표준 권장)', note: '지연시간과 큐레이션 품질의 완벽한 균형' },
                  { level: 'HIGH' as ThinkingLevelOption, title: 'HIGH (심층 사유)', note: '복합 감정과 은유적 문장을 극도로 정밀하게 분석' }
                ].map((th) => (
                  <button
                    key={th.level}
                    type="button"
                    onClick={() => setConfig(prev => ({ ...prev, thinkingLevel: th.level }))}
                    className={`p-3 rounded border text-left cursor-pointer transition-all ${
                      config.thinkingLevel === th.level
                        ? 'bg-[var(--leather)] text-[var(--on-leather)] border-[var(--brass)] shadow-sm'
                        : 'bg-[var(--page)] text-[var(--ink)] border-[var(--line)] hover:border-[var(--brass)]'
                    }`}
                  >
                    <div className="font-bold text-xs sm:text-sm mb-1">{th.title}</div>
                    <div className={`text-[11px] leading-tight ${config.thinkingLevel === th.level ? 'text-[var(--on-leather)]/85' : 'text-[var(--soft)]'}`}>
                      {th.note}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Curation Rules & Filters */}
        {activeTab === 'rules' && (
          <div className="space-y-6 animate-rise">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="bg-[var(--panel)] border border-[var(--line)] p-5 rounded shadow-xs">
                <div className="flex items-baseline justify-between mb-2">
                  <label htmlFor="bookCountSlider" className="font-serif font-bold text-sm text-[var(--ink)]">
                    추천 도서 권수
                  </label>
                  <span className="font-serif font-extrabold text-base text-[var(--brass)] tabular-nums">
                    {config.bookCount} 권
                  </span>
                </div>
                <input
                  id="bookCountSlider"
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={config.bookCount}
                  onChange={(e) => setConfig(prev => ({ ...prev, bookCount: Number(e.target.value) }))}
                  className="w-full cursor-pointer accent-[var(--brass)]"
                />
                <div className="flex justify-between text-[11px] text-[var(--soft)] mt-1">
                  <span>1권</span>
                  <span>3권(기본)</span>
                  <span>5권</span>
                </div>
              </div>

              <div className="bg-[var(--panel)] border border-[var(--line)] p-5 rounded shadow-xs">
                <div className="flex items-baseline justify-between mb-2">
                  <label htmlFor="intensitySensitivity" className="font-serif font-bold text-sm text-[var(--ink)]">
                    감정 세기 반영 민감도
                  </label>
                  <span className="font-serif font-extrabold text-base text-[var(--brass)] tabular-nums">
                    Lv. {config.intensitySensitivity}
                  </span>
                </div>
                <input
                  id="intensitySensitivity"
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={config.intensitySensitivity}
                  onChange={(e) => setConfig(prev => ({ ...prev, intensitySensitivity: Number(e.target.value) }))}
                  className="w-full cursor-pointer accent-[var(--brass)]"
                />
                <div className="flex justify-between text-[11px] text-[var(--soft)] mt-1">
                  <span>온화한 포용</span>
                  <span>균형적 반영</span>
                  <span>극적 처방</span>
                </div>
              </div>
            </div>

            <div className="bg-[var(--panel)] border border-[var(--line)] p-5 rounded shadow-xs">
              <h3 className="font-serif font-bold text-sm text-[var(--ink)] mb-1">
                우선 배정 장르 목록
              </h3>
              <p className="text-xs text-[var(--soft)] mb-3">
                선택된 장르 위주로 다채로운 도서를 추천하도록 AI 가중치를 부여합니다.
              </p>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_GENRES.map((genre) => {
                  const active = config.preferredGenres.includes(genre);
                  return (
                    <button
                      key={genre}
                      type="button"
                      onClick={() => handleGenreToggle(genre)}
                      className={`px-3 py-1.5 rounded text-xs font-semibold border cursor-pointer transition-colors ${
                        active
                          ? 'bg-[var(--leather)] text-[var(--on-leather)] border-[var(--brass)]'
                          : 'bg-[var(--page)] text-[var(--soft)] border-[var(--line)] hover:border-[var(--brass)] hover:text-[var(--ink)]'
                      }`}
                    >
                      {genre} {active && '✓'}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-[var(--panel)] border border-[var(--line)] p-5 rounded shadow-xs">
              <h3 className="font-serif font-bold text-sm text-[var(--ink)] mb-1">
                제외 / 금지 도서 및 키워드 필터
              </h3>
              <p className="text-xs text-[var(--soft)] mb-3">
                추천 결과에서 반드시 제외하고 싶은 도서명, 저자, 또는 특정 키워드를 등록합니다.
              </p>

              <form onSubmit={handleAddExcluded} className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newExcludedInput}
                  onChange={(e) => setNewExcludedInput(e.target.value)}
                  placeholder="예: 가상 도서, 미출간작, 특정 도서 제목"
                  className="flex-1 bg-[var(--page)] border border-[var(--line)] rounded px-3 py-2 text-xs sm:text-sm text-[var(--ink)] focus:outline-none focus:border-[var(--brass)]"
                />
                <button
                  type="submit"
                  disabled={!newExcludedInput.trim()}
                  className="px-4 py-2 rounded text-xs font-bold bg-[var(--leather)] border border-[var(--brass)] text-[var(--on-leather)] hover:brightness-110 disabled:opacity-50 cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>추가</span>
                </button>
              </form>

              <div className="flex flex-wrap gap-2 min-h-[2.5rem] p-2 bg-[var(--page)] rounded border border-[var(--line)]/70">
                {config.excludedKeywords.length === 0 ? (
                  <span className="text-xs text-[var(--soft)] p-1">등록된 제외 키워드가 없습니다.</span>
                ) : (
                  config.excludedKeywords.map((k) => (
                    <span
                      key={k}
                      className="inline-flex items-center gap-1.5 bg-[var(--panel)] border border-[var(--brass)] px-2.5 py-1 rounded text-xs text-[var(--ink)]"
                    >
                      <span>{k}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveExcluded(k)}
                        className="text-[var(--soft)] hover:text-[var(--err)] cursor-pointer"
                        aria-label={`${k} 삭제`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>

            <div className="bg-[var(--panel)] border border-[var(--line)] p-4 rounded shadow-xs flex items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-sm text-[var(--ink)]">인용구 엄격 검증 모드</h4>
                <p className="text-xs text-[var(--soft)] mt-0.5">
                  도서 속 실제 문장이 확실하지 않을 때 허구 문장을 지어내지 않고 공란으로 남기도록 강제합니다.
                </p>
              </div>
              <input
                type="checkbox"
                checked={config.strictQuoteCheck}
                onChange={(e) => setConfig(prev => ({ ...prev, strictQuoteCheck: e.target.checked }))}
                className="w-4 h-4 accent-[var(--brass)] cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* Tab 4: Live Simulation Playground */}
        {activeTab === 'playground' && (
          <div className="space-y-6 animate-rise">
            <div className="bg-[var(--panel)] border border-[var(--brass)] p-5 rounded shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-serif font-extrabold text-base text-[var(--ink)] flex items-center gap-2">
                  <Play className="w-4 h-4 text-[var(--brass)]" />
                  실시간 AI 큐레이션 시뮬레이션 플레이그라운드
                </h3>
                <span className="text-xs text-[var(--brass)] font-semibold">
                  현재 조정된 파라미터가 실시간 적용됩니다
                </span>
              </div>
              <p className="text-xs text-[var(--soft)] mb-4 leading-relaxed">
                현재 탭에서 변경한 프롬프트, 모델, 큐레이션 규칙을 실시간으로 실행하여 추천 도서의 퀄리티와 소요 시간을 사전 검증합니다.
              </p>

              <div className="flex flex-wrap items-center gap-1.5 mb-3 text-xs">
                <span className="text-[var(--soft)] mr-1">빠른 테스트 키워드:</span>
                {[
                  '오랜 번아웃으로 온몸이 무겁고 지칠 때',
                  '심야에 혼자 있는 쓸쓸한 방',
                  '새로운 프로젝트 시작 전 두근거리는 설렘',
                  '이유 없이 밀려오는 막연한 공허함'
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setSimInput(preset)}
                    className="px-2.5 py-1 rounded bg-[var(--page)] border border-[var(--line)] hover:border-[var(--brass)] text-[var(--ink)] cursor-pointer text-xs"
                  >
                    {preset}
                  </button>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={simInput}
                  onChange={(e) => setSimInput(e.target.value)}
                  placeholder="테스트할 감정 또는 상황을 입력하세요"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') runSimulation();
                  }}
                  className="flex-1 bg-[var(--page)] border border-[var(--line)] rounded px-3.5 py-2.5 text-xs sm:text-sm text-[var(--ink)] focus:outline-none focus:border-[var(--brass)]"
                />

                <div className="flex items-center gap-2">
                  <select
                    value={simLevel}
                    onChange={(e) => setSimLevel(Number(e.target.value))}
                    className="bg-[var(--page)] border border-[var(--line)] rounded px-3 py-2.5 text-xs text-[var(--ink)] focus:outline-none"
                    aria-label="감정 세기"
                  >
                    <option value={1}>세기 1 (살짝)</option>
                    <option value={2}>세기 2 (조금)</option>
                    <option value={3}>세기 3 (꽤)</option>
                    <option value={4}>세기 4 (많이)</option>
                    <option value={5}>세기 5 (몹시)</option>
                  </select>

                  <button
                    type="button"
                    disabled={!simInput.trim() || simLoading}
                    onClick={runSimulation}
                    className="px-5 py-2.5 rounded font-serif font-bold text-xs sm:text-sm text-[var(--on-leather)] bg-[var(--leather)] border border-[var(--brass)] hover:brightness-110 disabled:opacity-60 cursor-pointer shadow-sm flex items-center gap-2 whitespace-nowrap"
                  >
                    {simLoading ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-[var(--on-leather)]/40 border-t-[var(--on-leather)] rounded-full animate-spin-custom" />
                        <span>생성 중…</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 text-[var(--brass)]" />
                        <span>시뮬레이션 실행</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {simError && (
              <div className="p-4 bg-[var(--err-bg)] border-l-4 border-[var(--err)] text-[var(--ink)] rounded flex items-start gap-2.5 text-xs sm:text-sm">
                <AlertCircle className="w-4 h-4 text-[var(--err)] shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold mb-0.5">시뮬레이션 오류</strong>
                  <span>{simError}</span>
                </div>
              </div>
            )}

            {simResult && (
              <div className="bg-[var(--panel)] border border-[var(--line)] p-5 rounded shadow-sm space-y-4 animate-rise">
                <div className="flex items-center justify-between flex-wrap gap-2 border-b border-[var(--line)] pb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-serif font-extrabold text-base text-[var(--ink)]">
                      시뮬레이션 결과
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full border border-[var(--brass)] bg-[var(--page)] text-[var(--ink)] font-semibold">
                      도출된 감정: <strong>‘{simResult.emotion}’</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-[var(--soft)]">
                    {simDuration !== null && (
                      <span className="flex items-center gap-1 font-mono tabular-nums">
                        <Clock className="w-3.5 h-3.5 text-[var(--brass)]" />
                        <span>{simDuration} ms</span>
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowRawJson(!showRawJson)}
                      className="text-[var(--brass)] hover:underline flex items-center gap-1 cursor-pointer font-mono"
                    >
                      <Code className="w-3.5 h-3.5" />
                      <span>{showRawJson ? 'JSON 접기' : 'Raw JSON 보기'}</span>
                    </button>
                  </div>
                </div>

                {showRawJson && (
                  <div className="p-3 bg-[var(--page)] border border-[var(--line)] rounded font-mono text-xs overflow-x-auto text-[var(--ink)] max-h-60">
                    <pre>{JSON.stringify(simResult, null, 2)}</pre>
                  </div>
                )}

                {simResult.books && simResult.books.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                    {simResult.books.map((b: any, idx: number) => (
                      <div
                        key={idx}
                        className="bg-[var(--page)] border border-[var(--line)] p-3 rounded flex flex-col space-y-2"
                      >
                        <div className="flex items-baseline justify-between">
                          <span className="font-serif font-extrabold text-sm text-[var(--ink)] line-clamp-1">
                            {b.title}
                          </span>
                          <span className="text-[10px] text-[var(--brass)] font-bold px-1.5 py-0.5 border border-[var(--brass)] rounded">
                            {b.genre || '문학'}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--soft)]">{b.author}</p>
                        {b.quote && (
                          <blockquote className="text-xs font-serif italic border-l-2 border-[var(--brass)] pl-2 text-[var(--ink)] my-1 leading-snug">
                            “{b.quote}”
                          </blockquote>
                        )}
                        <p className="text-xs text-[var(--soft)] leading-relaxed mt-auto pt-1">
                          {b.reason}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[var(--soft)]">추천된 도서가 없습니다.</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Admin Whitelist Management */}
        {activeTab === 'admins' && (
          <div className="space-y-6 animate-rise">
            <div className="bg-[var(--panel)] border border-[var(--line)] p-5 rounded shadow-xs">
              <h3 className="font-serif font-bold text-base text-[var(--ink)] mb-1 flex items-center gap-2">
                <Users className="w-4 h-4 text-[var(--brass)]" />
                관리자 구글 계정 목록 (화이트리스트 관리)
              </h3>
              <p className="text-xs text-[var(--soft)] mb-4">
                감정서가 AI 설정에 접근할 수 있는 구글 이메일 계정을 승인하고 관리합니다.
              </p>

              {/* Master Owner Highlight */}
              <div className="p-3.5 mb-4 bg-[var(--page)] border-l-4 border-[var(--brass)] rounded flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[var(--ink)]">대표 관리자 (소유자 계정)</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[var(--leather)] text-[var(--on-leather)]">
                      마스터 소유자
                    </span>
                  </div>
                  <p className="text-xs text-[var(--soft)] mt-0.5">
                    서비스 생성자 계정으로, 관리자 권한이 영구 보장됩니다.
                  </p>
                </div>
                <ShieldCheck className="w-5 h-5 text-[var(--brass)] shrink-0" />
              </div>

              {/* Add New Admin Email Form */}
              <form onSubmit={handleAddAdminEmail} className="flex gap-2 mb-4">
                <input
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="추가할 구글 계정 이메일 입력 (예: coworker@gmail.com)"
                  className="flex-1 bg-[var(--page)] border border-[var(--line)] rounded px-3.5 py-2 text-xs sm:text-sm text-[var(--ink)] focus:outline-none focus:border-[var(--brass)]"
                />
                <button
                  type="submit"
                  disabled={!newAdminEmail.trim()}
                  className="px-4 py-2 rounded text-xs font-bold bg-[var(--leather)] border border-[var(--brass)] text-[var(--on-leather)] hover:brightness-110 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>관리자 등록</span>
                </button>
              </form>

              {adminNotice && (
                <div className="mb-4 p-2.5 bg-[var(--page)] border border-[var(--brass)] text-xs text-[var(--ink)] rounded flex items-center gap-2 animate-rise">
                  <Check className="w-3.5 h-3.5 text-[var(--ok)] shrink-0" />
                  <span>{adminNotice}</span>
                </div>
              )}

              {/* List of Allowed Admins */}
              <div className="border border-[var(--line)] rounded overflow-hidden divide-y divide-[var(--line)]/60 bg-[var(--page)]">
                {allowedAdmins.map((email) => {
                  const isMaster = email === MASTER_ADMIN_EMAIL;
                  return (
                    <div
                      key={email}
                      className="px-4 py-3 flex items-center justify-between text-xs sm:text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium text-[var(--ink)]">
                          {isMaster ? '대표 관리자 (보안 보호)' : email}
                        </span>
                        {isMaster && (
                          <span className="text-[10px] text-[var(--brass)] font-semibold">
                            (마스터 계정)
                          </span>
                        )}
                      </div>

                      {!isMaster && (
                        <button
                          type="button"
                          onClick={() => handleRemoveAdminEmail(email)}
                          title="권한 해제"
                          className="text-[var(--soft)] hover:text-[var(--err)] p-1 cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
