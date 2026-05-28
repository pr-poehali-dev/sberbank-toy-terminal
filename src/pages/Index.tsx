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

function formatAmount(raw: string) {
  if (!raw) return '0,00';
  return (parseInt(raw, 10) / 100).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function Index() {
  const [screen, setScreen] = useState<Screen>('amount');
  const [amount, setAmount] = useState('');
  const [progress, setProgress] = useState(0);
  const { keyBeep, okBeep, cardBeep, successSound } = useSound();

  const formatted = formatAmount(amount);

  const handleKey = (k: string) => {
    keyBeep();
    if (amount.length >= 8) return;
    setAmount(prev => prev + k);
  };
  const handleDelete = () => { keyBeep(); setAmount(prev => prev.slice(0, -1)); };
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
      clearInterval(iv);
      setProgress(100);
      successSound();
      setScreen('success');
      setTimeout(() => { setAmount(''); setProgress(0); setScreen('amount'); }, 2600);
    }, 1400);
  };

  return (
    <div className="fixed inset-0 flex flex-col font-sans select-none"
      style={{ background: '#0e1f12' }}>

      {/* ШАПКА */}
      <div className="flex items-center justify-between px-6 py-3 flex-shrink-0"
        style={{ background: '#0a1a0d', borderBottom: '1px solid rgba(33,160,56,0.3)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#21A038,#0d6e25)', boxShadow: '0 0 12px rgba(33,160,56,0.5)' }}>
            <span className="text-white text-[11px] font-black">СБ</span>
          </div>
          <div>
            <p className="text-white text-sm font-bold tracking-[0.12em] leading-none">СБЕРБАНК</p>
            <p className="text-[#21A038] text-[9px] font-mono tracking-widest opacity-80 leading-none mt-0.5">POS TERMINAL</p>
          </div>
        </div>
        <div className="flex items-center gap-5">
          <span className="text-[#2a5c35] text-[10px] font-mono">TRM-00847</span>
          <span className="text-[#2a5c35] text-[10px] font-mono">{new Date().toLocaleDateString('ru-RU')}</span>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full animate-pulse"
              style={{ background: '#21A038', boxShadow: '0 0 6px #21A038' }} />
            <span className="text-[#21A038] text-[10px] font-mono font-bold">
              {screen === 'amount' || screen === 'amount_ok' ? 'ГОТОВ' : screen === 'card' ? 'ОЖИДАНИЕ' : screen === 'processing' ? 'ОБРАБОТКА' : 'ОПЛАЧЕНО'}
            </span>
          </div>
        </div>
      </div>

      {/* КОНТЕНТ */}
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* ЛЕВАЯ — информация / статус */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 min-w-0">

          {screen === 'amount' && (
            <div className="w-full max-w-xs text-center">
              <p className="text-[#2a5c35] text-[11px] font-mono tracking-[0.25em] uppercase mb-4">Сумма к оплате</p>
              <div className="rounded-2xl py-5 px-6 text-right mb-4"
                style={{ background: '#060f08', border: '1px solid rgba(33,160,56,0.25)', boxShadow: 'inset 0 2px 12px rgba(0,0,0,0.5)' }}>
                <div className="flex items-end justify-end gap-2">
                  <span className="text-white font-mono font-light tracking-wider" style={{ fontSize: 'clamp(26px,4.5vw,52px)' }}>
                    {formatted}
                  </span>
                  <span className="text-[#21A038] font-mono font-bold mb-1" style={{ fontSize: 'clamp(16px,2.5vw,28px)' }}>₽</span>
                </div>
              </div>
              <p className="text-[#1a3a1f] text-[10px] font-mono tracking-widest">ВВЕДИТЕ СУММУ → ОК</p>
            </div>
          )}

          {screen === 'amount_ok' && (
            <div className="flex flex-col items-center gap-5">
              <div className="w-24 h-24 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(33,160,56,0.12)', border: '2px solid #21A038', boxShadow: '0 0 50px rgba(33,160,56,0.4)' }}>
                <Icon name="Check" size={48} className="text-[#4ade80]" />
              </div>
              <p className="text-[#4ade80] text-xl font-mono font-bold tracking-widest">СУММА ПРИНЯТА</p>
              <p className="text-white font-mono font-light" style={{ fontSize: 'clamp(24px,4vw,44px)' }}>{formatted} ₽</p>
            </div>
          )}

          {screen === 'card' && (
            <div className="flex flex-col items-center gap-6 w-full max-w-xs cursor-pointer" onClick={handleCardTap}>
              <div className="text-center">
                <p className="text-[#2a5c35] text-[11px] font-mono tracking-[0.2em] uppercase mb-2">К оплате</p>
                <p className="text-white font-mono font-light" style={{ fontSize: 'clamp(28px,5vw,52px)' }}>
                  {formatted} <span className="text-[#21A038] font-bold">₽</span>
                </p>
              </div>
              <div className="flex flex-col items-center gap-4 py-7 px-10 rounded-3xl w-full active:opacity-80 transition-opacity"
                style={{ background: 'rgba(0,0,0,0.25)', border: '2px dashed rgba(33,160,56,0.35)' }}>
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <div className="absolute w-20 h-20 rounded-full animate-ping opacity-[0.07]" style={{ background: '#21A038' }} />
                  <div className="absolute w-14 h-14 rounded-full animate-ping opacity-[0.12]" style={{ background: '#21A038', animationDelay: '0.5s' }} />
                  <div className="w-16 h-16 rounded-full flex items-center justify-center z-10"
                    style={{ background: 'rgba(33,160,56,0.15)', border: '2px solid rgba(33,160,56,0.5)', boxShadow: '0 0 24px rgba(33,160,56,0.3)' }}>
                    <Icon name="Wifi" size={30} className="text-[#4ade80]" />
                  </div>
                </div>
                <p className="text-white text-base font-sans font-medium">Приложите карту</p>
                <p className="text-[#1a3a1f] text-[10px] font-mono tracking-widest">ИЛИ НАЖМИТЕ ЗДЕСЬ</p>
              </div>
            </div>
          )}

          {screen === 'processing' && (
            <div className="flex flex-col items-center gap-6">
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 rounded-full" style={{ border: '2px solid rgba(33,160,56,0.15)' }} />
                <div className="absolute inset-0 rounded-full border-t-2 border-[#21A038] animate-spin"
                  style={{ boxShadow: '0 0 10px rgba(33,160,56,0.4)' }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Icon name="Wifi" size={28} className="text-[#4ade80]" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-white text-lg font-mono tracking-wider mb-1">Обработка...</p>
                <p className="text-[#1a3a1f] text-[10px] font-mono tracking-widest">НЕ УБИРАЙТЕ КАРТУ</p>
              </div>
              <div className="w-56 rounded-full overflow-hidden"
                style={{ height: 5, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(33,160,56,0.15)' }}>
                <div className="h-full rounded-full transition-all duration-75"
                  style={{ width: `${progress}%`, background: 'linear-gradient(90deg,#0d6e25,#21A038,#4ade80)', boxShadow: '0 0 6px rgba(33,160,56,0.5)' }} />
              </div>
              <p className="text-[#4ade80] font-mono font-light" style={{ fontSize: 'clamp(24px,4vw,44px)' }}>{formatted} ₽</p>
            </div>
          )}

          {screen === 'success' && (
            <div className="flex flex-col items-center gap-5">
              <div className="w-28 h-28 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(33,160,56,0.12)', border: '3px solid #21A038', boxShadow: '0 0 60px rgba(33,160,56,0.45), 0 0 120px rgba(33,160,56,0.15)' }}>
                <Icon name="Check" size={56} className="text-[#4ade80]" />
              </div>
              <p className="text-[#4ade80] font-mono font-bold tracking-widest" style={{ fontSize: 'clamp(20px,3vw,34px)' }}>ОПЛАЧЕНО</p>
              <p className="text-white font-mono font-light" style={{ fontSize: 'clamp(28px,4.5vw,52px)' }}>{formatted} ₽</p>
              <p className="text-[#1a3a1f] text-[10px] font-mono tracking-widest mt-2">ВОЗВРАТ К НАЧАЛУ...</p>
            </div>
          )}
        </div>

        {/* РАЗДЕЛИТЕЛЬ */}
        <div className="w-px my-6 flex-shrink-0"
          style={{ background: 'linear-gradient(to bottom,transparent,rgba(33,160,56,0.25),transparent)' }} />

        {/* ПРАВАЯ — клавиатура */}
        <div className="w-72 flex-shrink-0 flex flex-col justify-center px-6 py-4 gap-2.5">
          {screen === 'amount' && (
            <>
              <div className="grid grid-cols-3 gap-2.5">
                {['1','2','3','4','5','6','7','8','9'].map(k => (
                  <button key={k} onClick={() => handleKey(k)}
                    className="rounded-xl text-white font-mono font-semibold transition-all duration-75 active:scale-95"
                    style={{
                      height: 'clamp(50px,7vh,70px)',
                      fontSize: 'clamp(18px,2.5vh,26px)',
                      background: 'linear-gradient(180deg,rgba(255,255,255,0.06) 0%,rgba(255,255,255,0.02) 100%)',
                      border: '1px solid rgba(33,160,56,0.18)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05)'
                    }}>
                    {k}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                <button onClick={handleClear}
                  className="rounded-xl font-mono font-bold transition-all duration-75 active:scale-95"
                  style={{
                    height: 'clamp(50px,7vh,70px)',
                    fontSize: 'clamp(11px,1.5vh,14px)',
                    background: 'rgba(239,68,68,0.07)',
                    border: '1px solid rgba(239,68,68,0.22)',
                    color: '#f87171',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                  }}>
                  СБР
                </button>
                <button onClick={() => handleKey('0')}
                  className="rounded-xl text-white font-mono font-semibold transition-all duration-75 active:scale-95"
                  style={{
                    height: 'clamp(50px,7vh,70px)',
                    fontSize: 'clamp(18px,2.5vh,26px)',
                    background: 'linear-gradient(180deg,rgba(255,255,255,0.06) 0%,rgba(255,255,255,0.02) 100%)',
                    border: '1px solid rgba(33,160,56,0.18)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05)'
                  }}>
                  0
                </button>
                <button onClick={handleDelete}
                  className="rounded-xl flex items-center justify-center transition-all duration-75 active:scale-95"
                  style={{
                    height: 'clamp(50px,7vh,70px)',
                    background: 'linear-gradient(180deg,rgba(255,255,255,0.06) 0%,rgba(255,255,255,0.02) 100%)',
                    border: '1px solid rgba(33,160,56,0.18)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.35)'
                  }}>
                  <Icon name="Delete" size={20} className="text-[#4b5563]" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2.5 mt-1">
                <button onClick={handleCancel}
                  className="rounded-xl font-mono font-bold tracking-widest transition-all duration-75 active:scale-95"
                  style={{
                    height: 'clamp(48px,6.5vh,66px)',
                    fontSize: 'clamp(11px,1.5vh,13px)',
                    background: 'rgba(239,68,68,0.09)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    color: '#f87171',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                  }}>
                  ОТМЕНА
                </button>
                <button onClick={handleOk}
                  className="rounded-xl font-mono font-bold tracking-widest transition-all duration-75 active:scale-95"
                  style={{
                    height: 'clamp(48px,6.5vh,66px)',
                    fontSize: 'clamp(11px,1.5vh,13px)',
                    background: 'linear-gradient(135deg,rgba(33,160,56,0.28),rgba(13,110,37,0.28))',
                    border: '1px solid rgba(33,160,56,0.48)',
                    color: '#4ade80',
                    boxShadow: '0 2px 12px rgba(33,160,56,0.18), inset 0 1px 0 rgba(33,160,56,0.12)'
                  }}>
                  ОК
                </button>
              </div>
            </>
          )}

          {screen === 'card' && (
            <button onClick={handleCancel}
              className="w-full rounded-xl font-mono font-bold tracking-widest transition-all active:scale-95"
              style={{
                height: 'clamp(48px,6.5vh,66px)',
                fontSize: 'clamp(11px,1.5vh,13px)',
                background: 'rgba(239,68,68,0.09)',
                border: '1px solid rgba(239,68,68,0.3)',
                color: '#f87171'
              }}>
              ОТМЕНА
            </button>
          )}
        </div>
      </div>

      {/* ПОДВАЛ */}
      <div className="flex items-center justify-between px-6 py-2 flex-shrink-0"
        style={{ background: '#0a1a0d', borderTop: '1px solid rgba(33,160,56,0.2)' }}>
        <div className="flex items-center gap-4">
          {['VISA', 'MC', 'МИР', 'NFC'].map(s => (
            <span key={s} className="font-mono px-2 py-0.5 rounded text-[9px] tracking-wider"
              style={{ color: '#1a3a22', border: '1px solid rgba(33,160,56,0.12)' }}>{s}</span>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Icon name="Shield" size={11} className="text-[#1a3a22]" />
          <span className="text-[#1a3a22] text-[9px] font-mono tracking-widest">ЗАЩИЩЁННОЕ СОЕДИНЕНИЕ</span>
        </div>
        <span className="text-[#1a3a22] text-[9px] font-mono tracking-widest">© СБЕРБАНК · v2.4.1</span>
      </div>
    </div>
  );
}
