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

  const keyBeep = useCallback(() => beep(880, 0.06, 'square', 0.12), [beep]);
  const okBeep = useCallback(() => {
    beep(660, 0.1, 'sine', 0.2);
    setTimeout(() => beep(880, 0.15, 'sine', 0.25), 110);
  }, [beep]);
  const cardBeep = useCallback(() => {
    beep(1200, 0.08, 'sine', 0.25);
    setTimeout(() => beep(1500, 0.12, 'sine', 0.3), 90);
  }, [beep]);
  const successSound = useCallback(() => {
    beep(523, 0.15, 'sine', 0.3);
    setTimeout(() => beep(659, 0.15, 'sine', 0.3), 160);
    setTimeout(() => beep(784, 0.35, 'sine', 0.4), 320);
  }, [beep]);

  return { keyBeep, okBeep, cardBeep, successSound };
}

function formatAmount(raw: string) {
  if (!raw) return '0,00';
  return (parseInt(raw, 10) / 100).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function now() {
  return new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function nowDate() {
  return new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function Index() {
  const [screen, setScreen] = useState<Screen>('amount');
  const [amount, setAmount] = useState('');
  const [progress, setProgress] = useState(0);
  const [time] = useState(now());
  const { keyBeep, okBeep, cardBeep, successSound } = useSound();

  const formatted = formatAmount(amount);

  const handleKey = (k: string) => {
    keyBeep();
    if (amount.length >= 8) return;
    setAmount(prev => prev + k);
  };

  const handleDelete = () => { keyBeep(); setAmount(prev => prev.slice(0, -1)); };
  const handleClear = () => { keyBeep(); setAmount(''); };

  const handleOk = () => {
    if (!amount || parseInt(amount) === 0) return;
    okBeep();
    setScreen('amount_ok');
    setTimeout(() => setScreen('card'), 1400);
  };

  const handleCancel = () => {
    keyBeep();
    setAmount('');
    setScreen('amount');
  };

  const handleCardTap = () => {
    if (screen !== 'card') return;
    cardBeep();
    setScreen('processing');
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) { clearInterval(interval); return 100; }
        return prev + 7;
      });
    }, 80);
    setTimeout(() => {
      clearInterval(interval);
      setProgress(100);
      successSound();
      setScreen('success');
      setTimeout(() => {
        setAmount('');
        setProgress(0);
        setScreen('amount');
      }, 2800);
    }, 1400);
  };

  return (
    <div className="fixed inset-0 flex flex-col font-sans overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #1a4a26 0%, #0f2d18 30%, #082010 60%, #051509 100%)' }}>

      {/* ── ШАПКА ── */}
      <div className="flex items-center justify-between px-8 py-4 flex-shrink-0"
        style={{ background: 'rgba(0,0,0,0.35)', borderBottom: '1px solid rgba(33,160,56,0.25)' }}>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #21A038 0%, #0d7a2a 100%)', boxShadow: '0 0 16px rgba(33,160,56,0.5)' }}>
            <span className="text-white text-sm font-black">СБ</span>
          </div>
          <div>
            <p className="text-white text-lg font-bold tracking-[0.15em]">СБЕРБАНК</p>
            <p className="text-[#4ade80] text-[10px] font-mono tracking-widest opacity-70">ПЛАТЁЖНЫЙ ТЕРМИНАЛ</p>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="text-right">
            <p className="text-[#4ade80] text-xs font-mono opacity-60">ТЕРМИНАЛ</p>
            <p className="text-white text-sm font-mono font-bold">TRM-00847</p>
          </div>
          <div className="text-right">
            <p className="text-[#4ade80] text-xs font-mono opacity-60">ДАТА</p>
            <p className="text-white text-sm font-mono">{nowDate()}</p>
          </div>
          <div className="text-right">
            <p className="text-[#4ade80] text-xs font-mono opacity-60">ВРЕМЯ</p>
            <p className="text-white text-sm font-mono font-bold">{time}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full animate-pulse"
              style={{ background: screen === 'success' ? '#4ade80' : '#21A038', boxShadow: '0 0 8px #21A038' }} />
            <span className="text-[#4ade80] text-xs font-mono font-bold tracking-wider">
              {screen === 'amount' || screen === 'amount_ok' ? 'ГОТОВ'
                : screen === 'card' ? 'ОЖИДАНИЕ'
                : screen === 'processing' ? 'ОБРАБОТКА'
                : 'ОПЛАЧЕНО'}
            </span>
          </div>
        </div>
      </div>

      {/* ── ОСНОВНАЯ ОБЛАСТЬ ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Левая панель — экран */}
        <div className="flex-1 flex flex-col items-center justify-center px-12 py-8">

          {/* ── ВВОД СУММЫ ── */}
          {screen === 'amount' && (
            <div className="w-full max-w-sm flex flex-col gap-6 animate-slide-up">
              <div className="text-center">
                <p className="text-[#4ade80] text-xs font-mono tracking-[0.3em] uppercase opacity-70 mb-1">Сумма к оплате</p>
                <div className="rounded-2xl px-8 py-6 text-right relative overflow-hidden"
                  style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(33,160,56,0.3)', boxShadow: 'inset 0 2px 16px rgba(0,0,0,0.6)' }}>
                  <div className="absolute top-0 left-0 right-0 h-px"
                    style={{ background: 'linear-gradient(90deg, transparent, rgba(33,160,56,0.6), transparent)' }} />
                  <div className="flex items-end justify-end gap-3">
                    <span className="text-5xl font-mono font-light text-white tracking-wider">{formatted}</span>
                    <span className="text-2xl font-mono text-[#21A038] font-bold mb-1">₽</span>
                  </div>
                  {amount && (
                    <p className="text-[#4ade80] text-xs font-mono opacity-50 mt-1 text-right">
                      {(parseInt(amount) / 100).toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' })}
                    </p>
                  )}
                </div>
              </div>
              <p className="text-center text-[#2d5a3a] text-xs font-mono tracking-widest">ВВЕДИТЕ СУММУ И НАЖМИТЕ ОК</p>
            </div>
          )}

          {/* ── ГАЛОЧКА ПРИНЯТО ── */}
          {screen === 'amount_ok' && (
            <div className="flex flex-col items-center gap-6 animate-slide-up">
              <div className="w-28 h-28 rounded-full flex items-center justify-center"
                style={{
                  background: 'rgba(33,160,56,0.15)',
                  border: '3px solid #21A038',
                  boxShadow: '0 0 60px rgba(33,160,56,0.4), 0 0 120px rgba(33,160,56,0.15)'
                }}>
                <Icon name="Check" size={56} className="text-[#4ade80]" />
              </div>
              <div className="text-center">
                <p className="text-[#4ade80] text-2xl font-mono font-bold tracking-widest mb-2">СУММА ПРИНЯТА</p>
                <p className="text-white text-4xl font-mono font-light">{formatted} ₽</p>
              </div>
            </div>
          )}

          {/* ── ПРИЛОЖИТЕ КАРТУ ── */}
          {screen === 'card' && (
            <div className="flex flex-col items-center gap-8 animate-slide-up w-full max-w-sm">
              <div className="text-center">
                <p className="text-[#4ade80] text-xs font-mono tracking-[0.25em] opacity-70 mb-2 uppercase">К оплате</p>
                <p className="text-white text-5xl font-mono font-light">{formatted} <span className="text-[#21A038] font-bold">₽</span></p>
              </div>

              <div
                className="flex flex-col items-center gap-5 cursor-pointer select-none w-full py-10 rounded-3xl transition-all duration-150 active:scale-[0.98]"
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  border: '2px dashed rgba(33,160,56,0.4)',
                  boxShadow: '0 0 40px rgba(33,160,56,0.08)'
                }}
                onClick={handleCardTap}>

                <div className="relative flex items-center justify-center w-32 h-32">
                  <div className="absolute w-32 h-32 rounded-full animate-ping opacity-[0.08]"
                    style={{ background: '#21A038' }} />
                  <div className="absolute w-24 h-24 rounded-full animate-ping opacity-[0.12]"
                    style={{ background: '#21A038', animationDelay: '0.4s' }} />
                  <div className="absolute w-16 h-16 rounded-full animate-ping opacity-[0.18]"
                    style={{ background: '#21A038', animationDelay: '0.8s' }} />
                  <div className="w-20 h-20 rounded-full flex items-center justify-center relative z-10"
                    style={{
                      background: 'rgba(33,160,56,0.15)',
                      border: '2px solid rgba(33,160,56,0.6)',
                      boxShadow: '0 0 30px rgba(33,160,56,0.3)'
                    }}>
                    <Icon name="Wifi" size={36} className="text-[#4ade80]" />
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-white text-lg font-sans font-medium mb-1">Приложите карту к экрану</p>
                  <p className="text-[#2d5a3a] text-xs font-mono tracking-wider">ИЛИ НАЖМИТЕ ЗДЕСЬ</p>
                </div>
              </div>
            </div>
          )}

          {/* ── ОБРАБОТКА ── */}
          {screen === 'processing' && (
            <div className="flex flex-col items-center gap-8 animate-slide-up">
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 rounded-full"
                  style={{ border: '2px solid rgba(33,160,56,0.2)' }} />
                <div className="absolute inset-0 rounded-full border-t-2 border-[#21A038] animate-spin"
                  style={{ boxShadow: '0 0 12px rgba(33,160,56,0.5)' }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Icon name="Wifi" size={32} className="text-[#4ade80]" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-white text-xl font-mono mb-2 tracking-wider">Обработка платежа</p>
                <p className="text-[#2d5a3a] text-xs font-mono tracking-widest">НЕ УБИРАЙТЕ КАРТУ...</p>
              </div>
              <div className="w-64 rounded-full overflow-hidden"
                style={{ height: 6, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(33,160,56,0.2)' }}>
                <div className="h-full rounded-full transition-all duration-100"
                  style={{
                    width: `${progress}%`,
                    background: 'linear-gradient(90deg, #0d7a2a, #21A038, #4ade80)',
                    boxShadow: '0 0 8px rgba(33,160,56,0.6)'
                  }} />
              </div>
              <p className="text-[#4ade80] text-4xl font-mono font-light">{formatted} ₽</p>
            </div>
          )}

          {/* ── УСПЕХ ── */}
          {screen === 'success' && (
            <div className="flex flex-col items-center gap-6 animate-slide-up">
              <div className="w-32 h-32 rounded-full flex items-center justify-center"
                style={{
                  background: 'rgba(33,160,56,0.15)',
                  border: '3px solid #21A038',
                  boxShadow: '0 0 60px rgba(33,160,56,0.5), 0 0 120px rgba(33,160,56,0.2)'
                }}>
                <Icon name="Check" size={60} className="text-[#4ade80]" />
              </div>
              <div className="text-center">
                <p className="text-[#4ade80] text-3xl font-mono font-bold tracking-widest mb-2">ОПЛАЧЕНО</p>
                <p className="text-white text-5xl font-mono font-light mb-4">{formatted} ₽</p>
                <p className="text-[#2d5a3a] text-xs font-mono tracking-widest">ВОЗВРАТ К НАЧАЛУ...</p>
              </div>
            </div>
          )}
        </div>

        {/* Разделитель */}
        <div className="w-px flex-shrink-0 my-8"
          style={{ background: 'linear-gradient(to bottom, transparent, rgba(33,160,56,0.3), transparent)' }} />

        {/* Правая панель — клавиатура (только на экране ввода суммы) */}
        <div className="w-80 flex-shrink-0 flex flex-col justify-center px-8 py-8 gap-3">
          {(screen === 'amount') ? (
            <>
              {/* Цифры 1–9 */}
              <div className="grid grid-cols-3 gap-3">
                {['1','2','3','4','5','6','7','8','9'].map(k => (
                  <button key={k} onClick={() => handleKey(k)}
                    className="h-16 rounded-xl text-white font-mono text-2xl font-semibold transition-all duration-100 active:scale-95 select-none"
                    style={{
                      background: 'linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%)',
                      border: '1px solid rgba(33,160,56,0.2)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)'
                    }}>
                    {k}
                  </button>
                ))}
              </div>

              {/* Нижний ряд */}
              <div className="grid grid-cols-3 gap-3">
                <button onClick={handleClear}
                  className="h-16 rounded-xl font-mono text-sm font-bold transition-all duration-100 active:scale-95 select-none"
                  style={{
                    background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    color: '#ef4444',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                  }}>
                  СБР
                </button>
                <button onClick={() => handleKey('0')}
                  className="h-16 rounded-xl text-white font-mono text-2xl font-semibold transition-all duration-100 active:scale-95 select-none"
                  style={{
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%)',
                    border: '1px solid rgba(33,160,56,0.2)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)'
                  }}>
                  0
                </button>
                <button onClick={handleDelete}
                  className="h-16 rounded-xl flex items-center justify-center transition-all duration-100 active:scale-95 select-none"
                  style={{
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%)',
                    border: '1px solid rgba(33,160,56,0.2)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                  }}>
                  <Icon name="Delete" size={22} className="text-[#6b7280]" />
                </button>
              </div>

              {/* ОТМЕНА / ОК */}
              <div className="grid grid-cols-2 gap-3 mt-1">
                <button onClick={handleCancel}
                  className="h-14 rounded-xl font-mono text-sm font-bold tracking-widest transition-all duration-100 active:scale-95 select-none"
                  style={{
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.35)',
                    color: '#ef4444',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                  }}>
                  ОТМЕНА
                </button>
                <button onClick={handleOk}
                  className="h-14 rounded-xl font-mono text-sm font-bold tracking-widest transition-all duration-100 active:scale-95 select-none"
                  style={{
                    background: 'linear-gradient(135deg, rgba(33,160,56,0.3), rgba(13,122,42,0.3))',
                    border: '1px solid rgba(33,160,56,0.5)',
                    color: '#4ade80',
                    boxShadow: '0 2px 12px rgba(33,160,56,0.2), inset 0 1px 0 rgba(33,160,56,0.15)'
                  }}>
                  ОК
                </button>
              </div>
            </>
          ) : (
            /* На остальных экранах — кнопка отмены если нужна */
            (screen === 'card') && (
              <div className="flex flex-col items-center gap-4">
                <button onClick={handleCancel}
                  className="w-full h-14 rounded-xl font-mono text-sm font-bold tracking-widest transition-all active:scale-95 select-none"
                  style={{
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.35)',
                    color: '#ef4444'
                  }}>
                  ОТМЕНА
                </button>
                <p className="text-[#1a3a22] text-xs font-mono text-center tracking-wider">
                  НАЖМИТЕ НА ЛЕВОЙ<br />ЧАСТИ ЭКРАНА
                </p>
              </div>
            )
          )}
        </div>
      </div>

      {/* ── ПОДВАЛ ── */}
      <div className="flex items-center justify-between px-8 py-3 flex-shrink-0"
        style={{ background: 'rgba(0,0,0,0.4)', borderTop: '1px solid rgba(33,160,56,0.15)' }}>
        <div className="flex items-center gap-6">
          {['VISA', 'MASTERCARD', 'МИР', 'NFC'].map(s => (
            <span key={s} className="text-[#1a3a22] text-[9px] font-mono tracking-widest px-2 py-1 rounded"
              style={{ border: '1px solid rgba(33,160,56,0.1)' }}>{s}</span>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full"
            style={{ background: '#21A038', boxShadow: '0 0 6px #21A038' }} />
          <span className="text-[#1a3a22] text-[9px] font-mono tracking-widest">ЗАЩИЩЁННОЕ СОЕДИНЕНИЕ</span>
        </div>
        <p className="text-[#1a3a22] text-[9px] font-mono tracking-widest">© СБЕРБАНК · POS v2.4.1</p>
      </div>
    </div>
  );
}
