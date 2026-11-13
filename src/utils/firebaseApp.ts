// Firebase 앱 초기화 (추천 이력 저장·운영자 열람에서 함께 사용)
//
// 아래 값은 비밀 키가 아니라 "이 앱이 어느 Firebase 프로젝트인지" 알려 주는 공개 식별 값입니다.
// 실제 보호는 Firestore 보안 규칙(firestore.rules)이 담당합니다.

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: 'AIzaSyBUs6q_UYf5AmcmDSclA6rsXxr3wbjmzao',
  authDomain: 'gamjung-seoga.firebaseapp.com',
  projectId: 'gamjung-seoga',
  storageBucket: 'gamjung-seoga.firebasestorage.app',
  messagingSenderId: '246543419124',
  appId: '1:246543419124:web:d84feb2b97c26b517340a1',
};

export function getFirebaseApp(): FirebaseApp {
  return getApps()[0] || initializeApp(firebaseConfig);
}
