// 관리자 구글 로그인 (Firebase Authentication)
//
//  - 관리자 화면 로그인과 "추천 이력" 탭이 같은 로그인을 함께 씁니다.
//    한 번 로그인하면 두 곳 모두 권한 있는 운영자 계정으로 인식됩니다.
//  - 이력 데이터를 읽을 수 있는지는 Firestore 보안 규칙(firestore.rules)이 서버에서 최종 확인합니다.

import { getAuth, signInWithPopup, signOut, GoogleAuthProvider, User } from 'firebase/auth';
import { getFirebaseApp } from './firebaseApp';

export async function signInWithGoogleForAdmin(): Promise<User> {
  const cred = await signInWithPopup(getAuth(getFirebaseApp()), new GoogleAuthProvider());
  return cred.user;
}

export function signOutFirebase(): Promise<void> {
  return signOut(getAuth(getFirebaseApp()));
}

/** 사용자가 로그인 창을 그냥 닫은 경우인지 */
export function isPopupClosed(e: any): boolean {
  return e?.code === 'auth/popup-closed-by-user' || e?.code === 'auth/cancelled-popup-request';
}

/** Firebase 로그인 오류를 읽기 쉬운 안내 문구로 바꿉니다. */
export function describeAuthError(e: any): string {
  switch (e?.code) {
    case 'auth/unauthorized-domain':
      return '이 주소에서는 로그인이 허용되지 않았습니다. gamjung-seoga.web.app 주소에서 열어 주세요.';
    case 'auth/operation-not-allowed':
    case 'auth/configuration-not-found':
      return 'Firebase에서 구글 로그인이 아직 켜져 있지 않습니다. (Firebase 콘솔 → Authentication → 시작하기 → Sign-in method → Google 사용 설정)';
    case 'auth/popup-blocked':
      return '브라우저가 로그인 창을 막았습니다. 이 사이트의 팝업을 허용한 뒤 다시 시도해 주세요.';
    case 'auth/network-request-failed':
      return '네트워크 연결을 확인한 뒤 다시 시도해 주세요.';
    default:
      return '로그인에 실패했습니다. 다시 시도해 주세요.';
  }
}
