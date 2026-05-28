import { useState, useRef, useCallback } from 'react';
import Icon from '@/components/ui/icon';

type Screen = 'amount' | 'amount_ok' | 'card' | 'processing' | 'success';

function useSound() {
  const ctx = useRef<AudioContext | null>(null);
  const getCtx = () => {
    if (!ctx.current) ctx.current = new AudioContext();
    return ctx.current;
  };
  const beep = useCallback((freq: number, duration: number, type: OscillatorType = 'sine', vol = 0.3) => {
    const ac = getCtx();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.frequency.value = freq;
    osc.type = type;
    gain.gain.setValueAtTime(vol, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
    osc.start(ac.currentTime);
    osc.stop(ac.currentTime + duration);
  }, []);

  const keyBeep = useCallback(() => beep(1000, 0.05, 'square', 0.1), [beep]);
  const okBeep = useCallback(() => {
    beep(660, 0.08, 'sine', 0.18);
    setTimeout(() => beep(880, 0.12, 'sine', 0.22), 100);
  }, [beep]);
  const cardBeep = useCallback(() => {
    beep(1200, 0.07, 'sine', 0.22);
    setTimeout(() => beep(1500, 0.1, 'sine', 0.28), 80);
  }, [beep]);
  const successSound = useCallback(() => {
    beep(523, 0.14, 'sine', 0.28);
    setTimeout(() => beep(659, 0.14, 'sine', 0.28), 155);
    setTimeout(() => beep(784, 0.32, 'sine', 0.38), 310);
  }, [beep]);

  return { keyBeep, okBeep, cardBeep, successSound };
}

function fmt(raw: string) {
  if (!raw) return '0,00';
  return (parseInt(raw, 10) / 100).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function Index() {
  const [screen, setScreen] = useState<Screen>('amount');
  const [amount, setAmount] = useState('');
  const [progress, setProgress] = useState(0);
  const { keyBeep, okBeep, cardBeep, successSound } = useSound();
  const formatted = fmt(amount);

  const handleKey = (k: string) => { keyBeep(); if (amount.length < 8) setAmount(p => p + k); };
  const handleDelete = () => { keyBeep(); setAmount(p => p.slice(0, -1)); };
  const handleClear = () => { keyBeep(); setAmount(''); };
  const handleCancel = () => { keyBeep(); setAmount(''); setScreen('amount'); };

  const handleOk = () => {
    if (!amount || parseInt(amount) === 0) return;
    okBeep();
    setScreen('amount_ok');
    setTimeout(() => setScreen('card'), 1300);
  };

  const handleCardTap = () => {
    if (screen !== 'card') return;
    cardBeep();
    setScreen('processing');
    setProgress(0);
    const iv = setInterval(() => setProgress(p => { if (p >= 100) { clearInterval(iv); return 100; } return p + 7; }), 75);
    setTimeout(() => {
      clearInterval(iv); setProgress(100); successSound(); setScreen('success');
      setTimeout(() => { setAmount(''); setProgress(0); setScreen('amount'); }, 2600);
    }, 1400);
  };

  const btnBase: React.CSSProperties = {
    height: 64,
    fontSize: 26,
    borderRadius: 14,
    background: 'linear-gradient(180deg,#1c2e1e 0%,#111a12 100%)',
    border: '1px solid rgba(33,160,56,0.22)',
    color: '#ffffff',
    boxShadow: '0 3px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)',
    fontFamily: 'Roboto Mono, monospace',
    fontWeight: 600,
    cursor: 'pointer',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg,#0a150b 0%,#111 100%)',
      fontFamily: 'Roboto, sans-serif',
    }}>
      {/* Корпус */}
      <div style={{
        width: 340,
        height: '92vh',
        maxHeight: 760,
        minHeight: 600,
        background: 'linear-gradient(170deg,#2c2c2c 0%,#191919 100%)',
        borderRadius: 24,
        boxShadow: '0 40px 100px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.07)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>

        {/* Шапка */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 18px', flexShrink: 0,
          background: '#0c1a0e', borderBottom: '1px solid rgba(33,160,56,0.4)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg,#21A038,#0d6e25)',
              boxShadow: '0 0 10px rgba(33,160,56,0.6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ color: '#fff', fontSize: 10, fontWeight: 900 }}>СБ</span>
            </div>
            <span style={{ color: '#fff', fontSize: 13, fontWeight: 700, letterSpacing: '0.12em' }}>СБЕРБАНК</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%', background: '#21A038',
              boxShadow: '0 0 6px #21A038', animation: 'pulse 2s infinite',
            }} />
            <span style={{ color: '#21A038', fontSize: 10, fontFamily: 'Roboto Mono,monospace', fontWeight: 700, letterSpacing: '0.1em' }}>
              {screen === 'amount' || screen === 'amount_ok' ? 'ГОТОВ' : screen === 'card' ? 'ОЖИДАНИЕ' : screen === 'processing' ? 'ОБРАБОТКА' : 'ОПЛАЧЕНО'}
            </span>
          </div>
        </div>

        {/* Дисплей */}
        <div style={{
          margin: '14px 14px 0', borderRadius: 14, flexShrink: 0,
          background: '#050e06', border: '1px solid rgba(33,160,56,0.2)',
          boxShadow: 'inset 0 2px 14px rgba(0,0,0,0.7)',
          padding: '14px 18px 12px',
        }}>
          {(screen === 'amount') && (
            <>
              <p style={{ color: '#2d6b3a', fontSize: 10, fontFamily: 'Roboto Mono,monospace', letterSpacing: '0.2em', marginBottom: 10 }}>
                СУММА К ОПЛАТЕ
              </p>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', gap: 8, minHeight: 54 }}>
                <span style={{ color: '#fff', fontSize: 46, fontFamily: 'Roboto Mono,monospace', fontWeight: 300, lineHeight: 1 }}>
                  {formatted}
                </span>
                <span style={{ color: '#21A038', fontSize: 26, fontFamily: 'Roboto Mono,monospace', fontWeight: 700, marginBottom: 4 }}>₽</span>
              </div>
              <p style={{ color: '#152215', fontSize: 9, fontFamily: 'Roboto Mono,monospace', letterSpacing: '0.15em', marginTop: 8, textAlign: 'right' }}>
                ВВЕДИТЕ СУММУ И НАЖМИТЕ ОК
              </p>
            </>
          )}
          {screen === 'amount_ok' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 0' }}>
              <Icon name="CheckCircle" size={36} className="text-[#4ade80]" />
              <div>
                <p style={{ color: '#4ade80', fontSize: 12, fontFamily: 'Roboto Mono,monospace', fontWeight: 700, letterSpacing: '0.15em' }}>СУММА ПРИНЯТА</p>
                <p style={{ color: '#fff', fontSize: 30, fontFamily: 'Roboto Mono,monospace', fontWeight: 300 }}>{formatted} ₽</p>
              </div>
            </div>
          )}
          {screen === 'card' && (
            <div style={{ textAlign: 'right' }}>
              <p style={{ color: '#2d6b3a', fontSize: 10, fontFamily: 'Roboto Mono,monospace', letterSpacing: '0.2em', marginBottom: 6 }}>К ОПЛАТЕ</p>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', gap: 8 }}>
                <span style={{ color: '#fff', fontSize: 42, fontFamily: 'Roboto Mono,monospace', fontWeight: 300, lineHeight: 1 }}>{formatted}</span>
                <span style={{ color: '#21A038', fontSize: 24, fontFamily: 'Roboto Mono,monospace', fontWeight: 700, marginBottom: 4 }}>₽</span>
              </div>
            </div>
          )}
          {screen === 'processing' && (
            <div>
              <p style={{ color: '#2d6b3a', fontSize: 10, fontFamily: 'Roboto Mono,monospace', letterSpacing: '0.2em', marginBottom: 8 }}>ОБРАБОТКА ПЛАТЕЖА</p>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', gap: 8, marginBottom: 10 }}>
                <span style={{ color: '#4ade80', fontSize: 38, fontFamily: 'Roboto Mono,monospace', fontWeight: 300, lineHeight: 1 }}>{formatted}</span>
                <span style={{ color: '#21A038', fontSize: 22, fontFamily: 'Roboto Mono,monospace', fontWeight: 700, marginBottom: 3 }}>₽</span>
              </div>
              <div style={{ height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 99, width: `${progress}%`, background: 'linear-gradient(90deg,#0d6e25,#4ade80)', transition: 'width 75ms linear' }} />
              </div>
            </div>
          )}
          {screen === 'success' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 0' }}>
              <Icon name="CheckCircle" size={40} className="text-[#4ade80]" />
              <div>
                <p style={{ color: '#4ade80', fontSize: 14, fontFamily: 'Roboto Mono,monospace', fontWeight: 700, letterSpacing: '0.15em' }}>ОПЛАЧЕНО</p>
                <p style={{ color: '#fff', fontSize: 30, fontFamily: 'Roboto Mono,monospace', fontWeight: 300 }}>{formatted} ₽</p>
              </div>
            </div>
          )}
        </div>

        {/* Центральная зона */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '12px 14px 0' }}>
          {screen === 'card' && (
            <div onClick={handleCardTap} style={{ cursor: 'pointer', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
              padding: '20px 0', borderRadius: 18, background: 'rgba(0,0,0,0.2)', border: '2px dashed rgba(33,160,56,0.3)' }}>
              <div style={{ position: 'relative', width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="animate-ping" style={{ position: 'absolute', width: 80, height: 80, borderRadius: '50%', background: '#21A038', opacity: 0.07 }} />
                <div className="animate-ping" style={{ position: 'absolute', width: 56, height: 56, borderRadius: '50%', background: '#21A038', opacity: 0.12, animationDelay: '0.5s' }} />
                <div style={{ width: 68, height: 68, borderRadius: '50%', background: 'rgba(33,160,56,0.13)', border: '2px solid rgba(33,160,56,0.5)', boxShadow: '0 0 24px rgba(33,160,56,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                  <Icon name="Wifi" size={30} className="text-[#4ade80]" />
                </div>
              </div>
              <p style={{ color: '#fff', fontSize: 15, fontWeight: 500 }}>Приложите карту</p>
              <p style={{ color: '#1a3a1f', fontSize: 9, fontFamily: 'Roboto Mono,monospace', letterSpacing: '0.15em' }}>ИЛИ НАЖМИТЕ ЗДЕСЬ</p>
            </div>
          )}
          {screen === 'processing' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div style={{ position: 'relative', width: 60, height: 60 }}>
                <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid rgba(33,160,56,0.15)' }} />
                <div className="animate-spin" style={{ position: 'absolute', inset: 0, borderRadius: '50%', borderTop: '2px solid #21A038' }} />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="Wifi" size={22} className="text-[#4ade80]" />
                </div>
              </div>
              <p style={{ color: '#1a3a1f', fontSize: 9, fontFamily: 'Roboto Mono,monospace', letterSpacing: '0.15em' }}>НЕ УБИРАЙТЕ КАРТУ</p>
            </div>
          )}
        </div>

        {/* Клавиатура */}
        {screen === 'amount' && (
          <div style={{ padding: '8px 14px 10px', display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {['1','2','3','4','5','6','7','8','9'].map(k => (
                <button key={k} onClick={() => handleKey(k)} style={btnBase}>{k}</button>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <button onClick={handleClear} style={{ ...btnBase, fontSize: 13, background: 'rgba(239,68,68,0.09)', border: '1px solid rgba(239,68,68,0.28)', color: '#f87171' }}>СБР</button>
              <button onClick={() => handleKey('0')} style={btnBase}>0</button>
              <button onClick={handleDelete} style={{ ...btnBase, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="Delete" size={22} className="text-[#4b5563]" />
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 2 }}>
              <button onClick={handleCancel} style={{ ...btnBase, height: 56, fontSize: 13, letterSpacing: '0.1em', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.38)', color: '#f87171' }}>ОТМЕНА</button>
              <button onClick={handleOk} style={{ ...btnBase, height: 56, fontSize: 13, letterSpacing: '0.1em', background: 'linear-gradient(135deg,rgba(33,160,56,0.28),rgba(13,110,37,0.28))', border: '1px solid rgba(33,160,56,0.52)', color: '#4ade80', boxShadow: '0 2px 14px rgba(33,160,56,0.18)' }}>ОК</button>
            </div>
          </div>
        )}

        {screen === 'card' && (
          <div style={{ padding: '8px 14px 10px', flexShrink: 0 }}>
            <button onClick={handleCancel} style={{ ...btnBase, width: '100%', height: 52, fontSize: 13, letterSpacing: '0.1em', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.38)', color: '#f87171' }}>ОТМЕНА</button>
          </div>
        )}

        {/* Слот карты */}
        <div style={{ margin: '4px 16px 6px', flexShrink: 0 }}>
          <div style={{ height: 14, borderRadius: 6, background: '#090909', border: '1px solid rgba(255,255,255,0.05)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', padding: '0 8px', gap: 4 }}>
              {Array.from({ length: 26 }).map((_, i) => <div key={i} style={{ width: 1, height: 8, background: '#181818', flexShrink: 0 }} />)}
            </div>
            <span style={{ color: '#1f1f1f', fontSize: 7, fontFamily: 'Roboto Mono,monospace', background: '#090909', padding: '0 4px', position: 'relative', zIndex: 1, letterSpacing: '0.2em' }}>КАРТА</span>
          </div>
          {screen === 'card' && (
            <div className="animate-pulse" style={{ height: 2, marginTop: 2, borderRadius: 99, background: 'linear-gradient(90deg,transparent,#21A038,transparent)' }} />
          )}
        </div>

        {/* Логотипы */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, paddingBottom: 10, flexShrink: 0 }}>
          {['VISA','MC','МИР','NFC'].map(s => (
            <span key={s} style={{ color: '#1c3520', fontSize: 8, fontFamily: 'Roboto Mono,monospace', padding: '2px 6px', borderRadius: 4, border: '1px solid rgba(33,160,56,0.1)', letterSpacing: '0.1em' }}>{s}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
