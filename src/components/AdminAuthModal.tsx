import React, { useState } from 'react';
import { KeyRound, Lock, X, Check, AlertCircle, Settings } from 'lucide-react';
import { loadAdminPin, saveAdminPin, DEFAULT_PIN } from '../utils/adminConfig';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [showChangePin, setShowChangePin] = useState(false);
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [pinChangeMsg, setPinChangeMsg] = useState<{ text: string; isError: boolean } | null>(null);

  if (!isOpen) return null;

  const currentSavedPin = loadAdminPin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.trim() === currentSavedPin) {
      setError(false);
      setPin('');
      onSuccess();
    } else {
      setError(true);
    }
  };

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

        <div className="flex items-center gap-2.5 mb-2 border-b-2 border-double border-[var(--brass)] pb-3">
          <KeyRound className="w-5 h-5 text-[var(--brass)]" />
          <h2 className="font-serif font-extrabold text-lg tracking-wide text-[var(--ink)]">
            관리자 서재 인증
          </h2>
        </div>

        {!showChangePin ? (
          <>
            <p className="text-xs text-[var(--soft)] mb-5 leading-relaxed">
              AI 큐레이터의 동작과 추천 규칙을 세밀하게 조정할 수 있는 관리자 전용 공간입니다.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="adminPin" className="block text-xs font-semibold mb-1.5 text-[var(--ink)]">
                  관리자 핀코드 입력
                </label>
                <div className="relative">
                  <input
                    id="adminPin"
                    type="password"
                    autoFocus
                    maxLength={20}
                    value={pin}
                    onChange={(e) => {
                      setPin(e.target.value);
                      if (error) setError(false);
                    }}
                    placeholder="비밀번호를 입력하세요"
                    className={`w-full bg-[var(--page)] border rounded px-3 py-2 text-sm text-[var(--ink)] tracking-widest placeholder:tracking-normal focus:outline-none focus:ring-1 transition-all ${
                      error 
                        ? 'border-[var(--err)] ring-1 ring-[var(--err)] bg-[var(--err-bg)]/30' 
                        : 'border-[var(--line)] focus:border-[var(--brass)] focus:ring-[var(--brass)]'
                    }`}
                  />
                  <Lock className="w-4 h-4 text-[var(--soft)] absolute right-3 top-2.5 pointer-events-none" />
                </div>

                {error && (
                  <p className="text-xs text-[var(--err)] font-medium mt-1.5 flex items-center gap-1 animate-rise">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>비밀번호가 올바르지 않습니다.</span>
                  </p>
                )}
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={!pin.trim()}
                  className="w-full font-serif font-bold text-sm py-2.5 px-4 rounded text-[var(--on-leather)] bg-[var(--leather)] border border-[var(--brass)] hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                >
                  관리자 콘솔 접속
                </button>
              </div>

              <div className="pt-2 border-t border-[var(--line)]/60 flex items-center justify-between text-[11px] text-[var(--soft)]">
                <span>초기 기본값: <code className="font-mono font-bold text-[var(--ink)]">{DEFAULT_PIN}</code></span>
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
          </>
        ) : (
          <form onSubmit={handlePinChangeSubmit} className="space-y-3.5">
            <p className="text-xs text-[var(--soft)] mb-2">
              관리자 접속 핀코드를 새로 설정합니다.
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
        )}
      </div>
    </div>
  );
};
