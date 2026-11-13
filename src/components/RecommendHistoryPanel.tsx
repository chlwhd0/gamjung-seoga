import React, { useCallback, useEffect, useState } from 'react';
import { History, RefreshCw, LogIn, LogOut, ShieldCheck, AlertCircle } from 'lucide-react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, collection, query, orderBy, limit, getDocs } from 'firebase/firestore/lite';
import { getFirebaseApp } from '../utils/firebaseApp';
import { signInWithGoogleForAdmin, signOutFirebase, isPopupClosed, describeAuthError } from '../utils/firebaseAdminAuth';

// 운영자 전용 "추천 이력" 화면
//  - Firebase 로그인(구글)을 거치고, 읽기 권한은 Firestore 보안 규칙(firestore.rules)이 서버에서 확인합니다.
//  - 즉, 이 화면의 로그인 확인을 우회해도 운영자 계정이 아니면 데이터를 가져올 수 없습니다.

const LEVELS = ['살짝', '조금', '꽤', '많이', '몹시'];
const MAX_ROWS = 200;

interface Row {
  id: string;
  time: Date | null;
  mood: string;
  level: number | null;
  inputType: string;
  titles: string[];
  source: string;
  isAgain: boolean;
}

const sourceLabel = (s: string) =>
  s === 'offline' ? '기본 도서' : s === 'gemini' ? 'Gemini' : s === 'claude' ? 'Claude' : '서점 큐레이터';

export const RecommendHistoryPanel: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const auth = getAuth(getFirebaseApp());
    return onAuthStateChanged(auth, u => {
      setUser(u);
      setAuthReady(true);
    });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const db = getFirestore(getFirebaseApp());
      const snap = await getDocs(query(collection(db, 'recommendations'), orderBy('createdAt', 'desc'), limit(MAX_ROWS)));
      setRows(
        snap.docs.map(d => {
          const v: any = d.data();
          return {
            id: d.id,
            time: v.createdAt?.toDate ? v.createdAt.toDate() : null,
            mood: v.mood || '',
            level: typeof v.level === 'number' ? v.level : null,
            inputType: v.inputType || '',
            titles: Array.isArray(v.titles) ? v.titles : [],
            source: v.source || '',
            isAgain: !!v.isAgain,
          };
        })
      );
    } catch (e: any) {
      setRows([]);
      setError(
        e?.code === 'permission-denied'
          ? '이 계정은 운영자 계정이 아니라서 추천 이력을 볼 수 없습니다. 운영자 구글 계정으로 다시 로그인해 주세요.'
          : '추천 이력을 불러오지 못했습니다. 잠시 뒤 다시 시도해 주세요.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) load();
    else setRows([]);
  }, [user, load]);

  const handleLogin = async () => {
    setError(null);
    try {
      await signInWithGoogleForAdmin();
    } catch (e: any) {
      if (isPopupClosed(e)) return;
      setError(describeAuthError(e));
    }
  };

  const handleLogout = () => signOutFirebase();

  // 집계
  const moodCount: Record<string, number> = {};
  const levelCount: Record<number, number> = {};
  let typedCount = 0;
  rows.forEach(r => {
    moodCount[r.mood] = (moodCount[r.mood] || 0) + 1;
    if (r.level) levelCount[r.level] = (levelCount[r.level] || 0) + 1;
    if (r.inputType === 'text') typedCount++;
  });
  const moodEntries = Object.entries(moodCount).sort((a, b) => b[1] - a[1]);
  const maxMood = Math.max(1, ...moodEntries.map(([, n]) => n));

  return (
    <div className="space-y-6 animate-rise">
      <div className="bg-[var(--panel)] border border-[var(--line)] p-5 rounded shadow-xs">
        <h3 className="font-serif font-bold text-base text-[var(--ink)] mb-1 flex items-center gap-2">
          <History className="w-4 h-4 text-[var(--brass)]" />
          추천 이력 (운영자 전용)
        </h3>
        <p className="text-xs text-[var(--soft)] leading-relaxed mb-4">
          방문자가 추천받은 기록입니다. 고른 마음의 날씨·기분의 세기·추천된 책만 저장되고, 직접 적은 글과 개인 정보는 저장하지 않습니다.
          최근 {MAX_ROWS}건까지 보여 줍니다.
        </p>

        {!authReady ? (
          <p className="text-xs text-[var(--soft)]">로그인 상태를 확인하는 중…</p>
        ) : !user ? (
          <div className="space-y-3">
            <div className="flex items-start gap-2 text-xs text-[var(--soft)] bg-[var(--page)] border border-[var(--line)] rounded p-3">
              <ShieldCheck className="w-4 h-4 text-[var(--brass)] shrink-0 mt-0.5" />
              <span>관리자 로그인 화면에서 Google 계정으로 로그인했다면 바로 보입니다. 비밀번호로 로그인했다면 여기서 운영자 구글 계정으로 한 번 더 로그인해 주세요. 권한은 서버(Firestore 보안 규칙)가 확인합니다.</span>
            </div>
            <button
              type="button"
              onClick={handleLogin}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded border border-[var(--brass)] bg-[var(--leather)] text-[var(--on-leather)] cursor-pointer hover:brightness-110"
            >
              <LogIn className="w-4 h-4" />
              운영자 구글 계정으로 로그인
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs text-[var(--soft)]">
              로그인: <b className="text-[var(--ink)]">{user.email}</b>
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={load}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded border border-[var(--line)] text-[var(--ink)] cursor-pointer hover:bg-[var(--page)] disabled:opacity-60"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin-custom' : ''}`} />
                새로고침
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded border border-[var(--line)] text-[var(--ink)] cursor-pointer hover:bg-[var(--page)]"
              >
                <LogOut className="w-3.5 h-3.5" />
                로그아웃
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-3 flex items-start gap-2 text-xs text-[var(--err)] bg-[var(--err-bg)] rounded p-3">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {user && !error && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              ['전체 기록', `${rows.length}건`],
              ['카드로 고름', `${rows.length - typedCount}건`],
              ['직접 적음', `${typedCount}건`],
              ['가장 많은 감정', moodEntries[0] ? `${moodEntries[0][0]} (${moodEntries[0][1]})` : '-'],
            ].map(([label, value]) => (
              <div key={label} className="bg-[var(--panel)] border border-[var(--line)] rounded p-3">
                <div className="text-[11px] text-[var(--soft)]">{label}</div>
                <div className="font-serif font-bold text-base text-[var(--ink)] mt-1">{value}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-[var(--panel)] border border-[var(--line)] p-4 rounded">
              <h4 className="font-serif font-bold text-sm text-[var(--ink)] mb-3">마음의 날씨별</h4>
              {moodEntries.length === 0 ? (
                <p className="text-xs text-[var(--soft)]">아직 기록이 없습니다.</p>
              ) : (
                <ul className="space-y-1.5">
                  {moodEntries.map(([m, n]) => (
                    <li key={m} className="flex items-center gap-2 text-xs">
                      <span className="w-14 text-[var(--ink)]">{m}</span>
                      <div className="flex-1 h-2 bg-[var(--track)] rounded">
                        <div className="h-2 rounded bg-[var(--brass)]" style={{ width: `${(n / maxMood) * 100}%` }} />
                      </div>
                      <span className="w-8 text-right tabular-nums text-[var(--soft)]">{n}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="bg-[var(--panel)] border border-[var(--line)] p-4 rounded">
              <h4 className="font-serif font-bold text-sm text-[var(--ink)] mb-3">기분의 세기별 (카드 선택만)</h4>
              <ul className="space-y-1.5">
                {LEVELS.map((label, i) => {
                  const n = levelCount[i + 1] || 0;
                  const max = Math.max(1, ...Object.values(levelCount));
                  return (
                    <li key={label} className="flex items-center gap-2 text-xs">
                      <span className="w-14 text-[var(--ink)]">{label}</span>
                      <div className="flex-1 h-2 bg-[var(--track)] rounded">
                        <div className="h-2 rounded bg-[var(--brass)]" style={{ width: `${(n / max) * 100}%` }} />
                      </div>
                      <span className="w-8 text-right tabular-nums text-[var(--soft)]">{n}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <div className="bg-[var(--panel)] border border-[var(--line)] rounded overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-[var(--soft)] border-b border-[var(--line)]">
                  <th className="px-3 py-2 font-semibold whitespace-nowrap">시각</th>
                  <th className="px-3 py-2 font-semibold">감정</th>
                  <th className="px-3 py-2 font-semibold">세기</th>
                  <th className="px-3 py-2 font-semibold whitespace-nowrap">입력</th>
                  <th className="px-3 py-2 font-semibold">추천된 책</th>
                  <th className="px-3 py-2 font-semibold whitespace-nowrap">방식</th>
                </tr>
              </thead>
              <tbody>
                {loading && rows.length === 0 ? (
                  <tr><td colSpan={6} className="px-3 py-6 text-center text-[var(--soft)]">불러오는 중…</td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan={6} className="px-3 py-6 text-center text-[var(--soft)]">아직 기록이 없습니다.</td></tr>
                ) : (
                  rows.map(r => (
                    <tr key={r.id} className="border-b border-[var(--line)] last:border-0 align-top">
                      <td className="px-3 py-2 whitespace-nowrap tabular-nums text-[var(--soft)]">
                        {r.time ? r.time.toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>
                      <td className="px-3 py-2 font-semibold text-[var(--ink)]">{r.mood}</td>
                      <td className="px-3 py-2 text-[var(--ink)]">{r.level ? LEVELS[r.level - 1] : '-'}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-[var(--soft)]">
                        {r.inputType === 'text' ? '직접 적음' : '카드'}{r.isAgain ? ' · 다른 책' : ''}
                      </td>
                      <td className="px-3 py-2 text-[var(--ink)]">{r.titles.join(', ')}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-[var(--soft)]">{sourceLabel(r.source)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default RecommendHistoryPanel;
