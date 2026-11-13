// Firebase 앱 초기화 (추천 이력 저장·운영자 열람에서 함께 사용)
//
// 아래 값은 비밀 키가 아니라 "이 앱이 어느 Firebase 프로젝트인지" 알려 주는 공개 식별 값입니다.
// 실제 보호는 Firestore 보안 규칙(firestore.rules)이 담당합니다.

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: 'AIzaSyAvIh39nDTyV-BlqChyumh53g8xnJl27JY',
  authDomain: 'gamjung-seoga-v2.firebaseapp.com',
  projectId: 'gamjung-seoga-v2',
  storageBucket: 'gamjung-seoga-v2.firebasestorage.app',
  messagingSenderId: '1049582644068',
  appId: '1:1049582644068:web:a0849cbc9795e1aee62871',
};

export function getFirebaseApp(): FirebaseApp {
  return getApps()[0] || initializeApp(firebaseConfig);
}
