// 추천 이력 저장 (Firebase Firestore)
//
//  - 저장하는 것: 마음의 날씨, 기분의 세기, 입력 방식(카드/직접 적기), 추천된 책 제목, 추천 방식, 시각
//  - 저장하지 않는 것: 직접 적은 글, 이름·이메일·IP·기기 식별 값 등 누구인지 알 수 있는 정보
//  - 읽기는 Firestore 보안 규칙(firestore.rules)으로 막혀 있어서, 운영자가 Firebase 콘솔에서만 볼 수 있습니다.
//  - 저장에 실패해도 추천 화면에는 아무 영향이 없습니다. (조용히 무시)
//
// 아래 firebaseConfig 값은 비밀 키가 아니라 "이 앱이 어느 Firebase 프로젝트인지" 알려 주는 공개 식별 값입니다.
// 실제 보호는 보안 규칙이 담당합니다.

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore/lite';

const firebaseConfig = {
  apiKey: 'AIzaSyBUs6q_UYf5AmcmDSclA6rsXxr3wbjmzao',
  authDomain: 'gamjung-seoga.firebaseapp.com',
  projectId: 'gamjung-seoga',
  storageBucket: 'gamjung-seoga.firebasestorage.app',
  messagingSenderId: '246543419124',
  appId: '1:246543419124:web:d84feb2b97c26b517340a1',
};

const MOODS = ['분노', '불안', '슬픔', '외로움', '무기력', '지침', '설렘', '기쁨', '평온'];
const SOURCES = ['offline', 'gemini', 'claude', 'sample-curation'];

export interface HistoryEntry {
  mood: string;
  /** 카드를 골랐을 때의 기분의 세기(1~5), 직접 적었을 때는 null */
  level: number | null;
  typed: boolean;
  titles: string[];
  source: string;
  isAgain: boolean;
}

export function saveRecommendHistory(entry: HistoryEntry): void {
  try {
    // 규칙과 맞지 않는 값은 보내지 않습니다.
    if (!MOODS.includes(entry.mood) || entry.titles.length === 0) return;
    const source = SOURCES.includes(entry.source) ? entry.source : 'sample-curation';

    const app = getApps()[0] || initializeApp(firebaseConfig);
    const db = getFirestore(app);
    addDoc(collection(db, 'recommendations'), {
      mood: entry.mood,
      level: entry.level,
      inputType: entry.typed ? 'text' : 'card',
      titles: entry.titles.slice(0, 5).map(t => String(t).slice(0, 100)),
      source,
      isAgain: entry.isAgain,
      createdAt: serverTimestamp(),
    }).catch(() => {});
  } catch {
    // 저장 실패는 무시합니다.
  }
}
