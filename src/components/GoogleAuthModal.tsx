import React, { useState } from 'react';
import { 
  ShieldCheck, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  Lock, 
  Settings, 
  Check, 
  ShieldAlert,
  Key,
  ExternalLink
} from 'lucide-react';
import { 
  AdminUser, 
  MASTER_ADMIN_EMAIL, 
  isAuthorizedAdmin,
  saveAdminSession,
  loadGoogleClientId,
  saveGoogleClientId
} from '../utils/googleAuth';
import { 
  loadAdminPin, 
  saveAdminPin, 
  DEFAULT_PIN 
} from '../utils/adminConfig';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: AdminUser) => void;
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [isSuccess, setIsSuccess] = useState<AdminUser | null>(null);
  const [unauthorizedEmail, setUnauthorizedEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Client ID Setup Modal state
  const [showClientIdSetup, setShowClientIdSetup] = useState(false);
  const [clientIdInput, setClientIdInput] = useState(() => loadGoogleClientId());

  // Password change state
  const [showChangePin, setShowChangePin] = useState(false);
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [pinChangeMsg, setPinChangeMsg] = useState<{ text: string; isError: boolean } | null>(null);

  if (!isOpen) return null;

  const currentSavedPin = loadAdminPin();
  const configuredClientId = loadGoogleClientId();

  // Handle successful login
  const handleAuthSuccess = (user: AdminUser) => {
    setIsSuccess(user);
    saveAdminSession(user);
    setTimeout(() => {
      onSuccess(user);
    }, 600);
  };

  // 1. Google Login Button Click
  const handleGoogleLoginClick = () => {
    const g = (window as any).google;

    // If client ID is configured and Google OAuth2 SDK is available, trigger real Google popup
    if (configuredClientId && g?.accounts?.oauth2) {
      setIsLoading(true);
      try {
        const client = g.accounts.oauth2.initTokenClient({
          client_id: configuredClientId,
          scope: 'email profile openid',
          callback: async (tokenResponse: any) => {
            if (tokenResponse?.access_token) {
              try {
                // Fetch real Google account profile
                const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                });
                const googleData = await res.json();
                
                if (googleData?.email) {
                  if (isAuthorizedAdmin(googleData.email)) {
                    handleAuthSuccess({
                      email: googleData.email,
                      name: googleData.name || googleData.email.split('@')[0],
                      picture: googleData.picture,
                      sub: googleData.sub || Date.now().toString(),
                      loginAt: new Date().toISOString()
                    });
                  } else {
                    setUnauthorizedEmail(googleData.email);
                  }
                }
              } catch (fetchErr) {
                console.error('Failed to fetch userinfo:', fetchErr);
                alert('구글 사용자 정보를 불러오지 못했습니다.');
              } finally {
                setIsLoading(false);
              }
            } else {
              setIsLoading(false);
            }
          },
          error_callback: (err: any) => {
            console.error('Google OAuth Error:', err);
            setIsLoading(false);
            setShowClientIdSetup(true);
          }
        });
        client.requestAccessToken();
      } catch (err) {
        console.error('Google Init Error:', err);
        setIsLoading(false);
        setShowClientIdSetup(true);
      }
    } else {
      // If client ID is not configured yet, explain to user and offer setup or direct dev test
      setShowClientIdSetup(true);
    }
  };

  // Fast Dev / Test Login as Master Admin
  const handleDevAdminLogin = () => {
    handleAuthSuccess({
      email: MASTER_ADMIN_EMAIL,
      name: '감정서가 관리자 (테스트)',
      picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
      sub: 'master-owner-google-sub',
      loginAt: new Date().toISOString()
    });
  };

  // Save Google Client ID
  const handleSaveClientId = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientIdInput.trim()) return;
    saveGoogleClientId(clientIdInput.trim());
    setShowClientIdSetup(false);
    setTimeout(() => {
      handleGoogleLoginClick();
    }, 150);
  };

  // 2. PIN / Password Login
  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.trim() === currentSavedPin) {
      setPinError(false);
      handleAuthSuccess({
        email: MASTER_ADMIN_EMAIL,
        name: '관리자 (비밀번호 인증)',
        sub: 'pin-auth-sub',
        loginAt: new Date().toISOString()
      });
    } else {
      setPinError(true);
    }
  };

  // PIN Change handler
  const handlePinChangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentPinInput.trim() !== currentSavedPin) {
      setPinChangeMsg({ text: '현재 비밀번호가 일치하지 않습니다.', isError: true });
      return;
    }
    if (newPinInput.trim().length < 4) {
      setPinChangeMsg({ text: '새 비밀번호는 4자리 이상이어야 합니다.', isError: true });
      return;
    }
    saveAdminPin(newPinInput.trim());
    setPinChangeMsg({ text: '비밀번호가 성공적으로 변경되었습니다.', isError: false });
    setCurrentPinInput('');
    setNewPinInput('');
    setTimeout(() => {
      setShowChangePin(false);
      setPinChangeMsg(null);
    }, 1200);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-sm bg-[var(--panel)] border-2 border-[var(--brass)] rounded shadow-2xl p-6 text-[var(--ink)] animate-rise relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="absolute top-4 right-4 text-[var(--soft)] hover:text-[var(--ink)] cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2.5 mb-2 border-b-2 border-double border-[var(--brass)] pb-3">
          <ShieldCheck className="w-5 h-5 text-[var(--brass)]" />
          <h2 className="font-serif font-extrabold text-lg tracking-wide text-[var(--ink)]">
            관리자 서재 인증
          </h2>
        </div>

        {/* Success Feedback */}
        {isSuccess ? (
          <div className="p-4 my-3 bg-[var(--page)] border-2 border-[var(--ok)] rounded text-center space-y-2 animate-rise">
            <CheckCircle2 className="w-8 h-8 text-[var(--ok)] mx-auto" />
            <h3 className="font-serif font-bold text-sm text-[var(--ink)]">
              관리자 인증 성공
            </h3>
            <p className="text-xs text-[var(--soft)]">
              관리자 권한이 확인되었습니다. 집무실로 이동합니다…
            </p>
          </div>
        ) : unauthorizedEmail ? (
          /* Unauthorized Real Google Account Notice */
          <div className="p-4 bg-[var(--err-bg)] border-2 border-[var(--err)] rounded space-y-3 animate-rise my-2">
            <div className="flex items-center gap-2 text-[var(--err)]">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <h3 className="font-serif font-bold text-sm text-[var(--ink)]">
                접근 권한이 없는 계정입니다
              </h3>
            </div>
            <p className="text-xs text-[var(--ink)] leading-relaxed">
              선택하신 구글 계정(<strong>{unauthorizedEmail}</strong>)은 관리자 목록에 등록되어 있지 않습니다.
            </p>
            <div className="p-2.5 bg-[var(--panel)] rounded text-xs text-[var(--soft)] border border-[var(--err)]/40">
              사전에 등록 및 승인된 관리자 계정으로만 접근이 가능합니다.
            </div>
            <button
              type="button"
              onClick={() => {
                setUnauthorizedEmail(null);
                handleGoogleLoginClick();
              }}
              className="w-full py-2 px-3 rounded text-xs font-bold text-[var(--on-leather)] bg-[var(--leather)] border border-[var(--brass)] hover:brightness-110 cursor-pointer shadow-sm"
            >
              다른 구글 계정으로 다시 선택
            </button>
          </div>
        ) : showClientIdSetup ? (
          /* Google Client ID Setup Notice / Fast Dev Pass */
          <div className="space-y-3 my-2 animate-rise">
            <div className="p-3 bg-[var(--page)] border border-[var(--brass)] rounded text-xs space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-[var(--ink)]">
                <Key className="w-4 h-4 text-[var(--brass)]" />
                <span>Google OAuth 설정 안내</span>
              </div>
              <p className="text-[11px] text-[var(--soft)] leading-relaxed">
                실제 구글 계정 선택 팝업을 띄우려면 Google Cloud Console에서 발급받은 <strong>OAuth Client ID</strong>가 필요합니다.
              </p>
            </div>

            <form onSubmit={handleSaveClientId} className="space-y-2">
              <label className="block text-xs font-semibold text-[var(--ink)]">
                Google Client ID 입력
              </label>
              <input
                type="text"
                value={clientIdInput}
                onChange={(e) => setClientIdInput(e.target.value)}
                placeholder="예: 123456...apps.googleusercontent.com"
                className="w-full bg-[var(--page)] border border-[var(--line)] rounded p-2 text-xs font-mono text-[var(--ink)] focus:outline-none focus:border-[var(--brass)]"
              />
              <button
                type="submit"
                disabled={!clientIdInput.trim()}
                className="w-full py-2 rounded text-xs font-bold bg-[var(--leather)] border border-[var(--brass)] text-[var(--on-leather)] hover:brightness-110 cursor-pointer disabled:opacity-50"
              >
                Client ID 저장하고 실제 팝업 로그인
              </button>
            </form>

            <div className="pt-2 border-t border-[var(--line)]/60 text-center space-y-2">
              <button
                type="button"
                onClick={handleDevAdminLogin}
                className="w-full py-2 px-3 rounded text-xs font-semibold bg-[var(--page)] border border-[var(--line)] hover:border-[var(--brass)] text-[var(--ink)] cursor-pointer"
              >
                테스트용 관리자 권한으로 바로 체험하기
              </button>
              <button
                type="button"
                onClick={() => setShowClientIdSetup(false)}
                className="text-[11px] text-[var(--soft)] hover:underline cursor-pointer"
              >
                뒤로 가기 (비밀번호로 로그인)
              </button>
            </div>
          </div>
        ) : showChangePin ? (
          /* Password Change View */
          <form onSubmit={handlePinChangeSubmit} className="space-y-3.5 my-2">
            <p className="text-xs text-[var(--soft)] mb-2">
              관리자 접속 비밀번호를 새로 설정합니다.
            </p>

            <div>
              <label className="block text-xs font-semibold mb-1 text-[var(--ink)]">현재 비밀번호</label>
              <input
                type="password"
                required
                value={currentPinInput}
                onChange={(e) => setCurrentPinInput(e.target.value)}
                placeholder="현재 비밀번호"
                className="w-full bg-[var(--page)] border border-[var(--line)] rounded px-3 py-1.5 text-xs text-[var(--ink)] focus:outline-none focus:border-[var(--brass)]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-[var(--ink)]">새 비밀번호 (4자리 이상)</label>
              <input
                type="password"
                required
                value={newPinInput}
                onChange={(e) => setNewPinInput(e.target.value)}
                placeholder="새 비밀번호"
                className="w-full bg-[var(--page)] border border-[var(--line)] rounded px-3 py-1.5 text-xs text-[var(--ink)] focus:outline-none focus:border-[var(--brass)]"
              />
            </div>

            {pinChangeMsg && (
              <p className={`text-xs font-medium flex items-center gap-1 ${pinChangeMsg.isError ? 'text-[var(--err)]' : 'text-[var(--ok)]'}`}>
                {pinChangeMsg.isError ? <AlertCircle className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                <span>{pinChangeMsg.text}</span>
              </p>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowChangePin(false);
                  setPinChangeMsg(null);
                }}
                className="flex-1 py-1.5 px-3 rounded text-xs font-medium bg-[var(--page)] border border-[var(--line)] hover:border-[var(--brass)] text-[var(--ink)] cursor-pointer"
              >
                취소
              </button>
              <button
                type="submit"
                className="flex-1 py-1.5 px-3 rounded text-xs font-bold text-[var(--on-leather)] bg-[var(--leather)] border border-[var(--brass)] cursor-pointer hover:brightness-110"
              >
                변경 저장
              </button>
            </div>
          </form>
        ) : (
          /* Normal Auth View */
          <div className="space-y-4 my-2">
            <p className="text-xs text-[var(--soft)] leading-relaxed">
              Google 계정 또는 관리자 비밀번호를 통해 집무실에 진입할 수 있습니다.
            </p>

            {/* 1. Google Login Button */}
            <div>
              <button
                type="button"
                disabled={isLoading}
                onClick={handleGoogleLoginClick}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 shadow-sm font-semibold text-xs sm:text-sm cursor-pointer transition-all hover:shadow active:scale-[0.99] disabled:opacity-50"
              >
                {/* Google 4-color SVG Logo */}
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{isLoading ? '구글 계정 확인 중…' : 'Google 계정으로 로그인'}</span>
              </button>
            </div>

            {/* Divider */}
            <div className="relative my-3 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--line)]" />
              </div>
              <span className="relative bg-[var(--panel)] px-2.5 text-[11px] text-[var(--soft)] font-medium">
                또는 비밀번호로 로그인
              </span>
            </div>

            {/* 2. Password Form */}
            <form onSubmit={handlePinSubmit} className="space-y-3">
              <div>
                <label htmlFor="adminPasswordInput" className="block text-xs font-semibold mb-1 text-[var(--ink)]">
                  관리자 비밀번호
                </label>
                <div className="relative">
                  <input
                    id="adminPasswordInput"
                    type="password"
                    maxLength={30}
                    value={pin}
                    onChange={(e) => {
                      setPin(e.target.value);
                      if (pinError) setPinError(false);
                    }}
                    placeholder="비밀번호 입력"
                    className={`w-full bg-[var(--page)] border rounded px-3 py-2 text-xs sm:text-sm text-[var(--ink)] tracking-widest placeholder:tracking-normal focus:outline-none focus:ring-1 transition-all ${
                      pinError 
                        ? 'border-[var(--err)] ring-1 ring-[var(--err)] bg-[var(--err-bg)]/30' 
                        : 'border-[var(--line)] focus:border-[var(--brass)] focus:ring-[var(--brass)]'
                    }`}
                  />
                  <Lock className="w-4 h-4 text-[var(--soft)] absolute right-3 top-2.5 pointer-events-none" />
                </div>

                {pinError && (
                  <p className="text-xs text-[var(--err)] font-medium mt-1.5 flex items-center gap-1 animate-rise">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>비밀번호가 올바르지 않습니다.</span>
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={!pin.trim()}
                className="w-full font-serif font-bold text-xs sm:text-sm py-2.5 px-4 rounded text-[var(--on-leather)] bg-[var(--leather)] border border-[var(--brass)] hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                비밀번호로 로그인
              </button>

              <div className="pt-2 border-t border-[var(--line)]/60 flex items-center justify-between text-[11px] text-[var(--soft)]">
                <span>초기 비밀번호: <code className="font-mono font-bold text-[var(--ink)]">{DEFAULT_PIN}</code></span>
                <button
                  type="button"
                  onClick={() => setShowChangePin(true)}
                  className="hover:text-[var(--ink)] underline underline-offset-2 cursor-pointer flex items-center gap-1"
                >
                  <Settings className="w-3 h-3" />
                  <span>비밀번호 변경</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
