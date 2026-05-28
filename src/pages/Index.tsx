import { useState, useRef, useCallback, useEffect } from 'react';
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

  const keyBeep = useCallback(() => beep(880, 0.07, 'square', 0.15), [beep]);
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

function Header({ label, status, color }: { label: string; status: string; color: string }) {
  return (
    <div className="px-4 py-2.5 flex items-center justify-between border-b border-white/5"
      style={{ background: 'rgba(0,0,0,0.4)' }}>
      <span className="text-[#4ade80] text-xs font-mono tracking-wider font-bold">СБЕРБАНК</span>
      <div className="flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: color }} />
        <span className="text-xs font-mono" style={{ color }}>{status}</span>
      </div>
    </div>
  );
}

function NumPad({ onKey, onDelete, onClear, onConfirm, onCancel }: {
  onKey: (k: string) => void; onDelete: () => void; onClear: () => void;
  onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div className="bg-[#06080f] border-t border-white/5 p-3">
      <div className="grid grid-cols-3 gap-2 mb-2">
        {['1','2','3','4','5','6','7','8','9'].map(k => (
          <button key={k} onClick={() => onKey(k)}
            className="h-11 rounded-lg text-white font-mono text-lg font-semibold transition-all active:scale-95 select-none"
            style={{ background: 'linear-gradient(180deg, #1a2535 0%, #0f1820 100%)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {k}
          </button>
        ))}
        <button onClick={onClear}
          className="h-11 rounded-lg text-[#6b7280] font-mono text-[10px] transition-all active:scale-95 select-none"
          style={{ background: 'linear-gradient(180deg, #1a2535 0%, #0f1820 100%)', border: '1px solid rgba(255,255,255,0.08)' }}>
          СБР
        </button>
        <button onClick={() => onKey('0')}
          className="h-11 rounded-lg text-white font-mono text-lg font-semibold transition-all active:scale-95 select-none"
          style={{ background: 'linear-gradient(180deg, #1a2535 0%, #0f1820 100%)', border: '1px solid rgba(255,255,255,0.08)' }}>
          0
        </button>
        <button onClick={onDelete}
          className="h-11 rounded-lg flex items-center justify-center transition-all active:scale-95 select-none"
          style={{ background: 'linear-gradient(180deg, #1a2535 0%, #0f1820 100%)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <Icon name="Delete" size={18} className="text-[#6b7280]" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={onCancel}
          className="h-11 rounded-lg font-mono text-xs font-bold transition-all active:scale-95 select-none"
          style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}>
          ОТМЕНА
        </button>
        <button onClick={onConfirm}
          className="h-11 rounded-lg font-mono text-xs font-bold transition-all active:scale-95 select-none"
          style={{ background: 'rgba(33,160,56,0.2)', border: '1px solid rgba(33,160,56,0.5)', color: '#4ade80' }}>
          ОК
        </button>
      </div>
    </div>
  );
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

  const handleOk = () => {
    if (!amount || parseInt(amount) === 0) return;
    okBeep();
    setScreen('amount_ok');
    setTimeout(() => setScreen('card'), 1200);
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
        return prev + 8;
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
      }, 2500);
    }, 1300);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 font-sans"
      style={{ background: 'radial-gradient(ellipse at 50% 30%, #0d1f0d 0%, #070a07 60%, #040604 100%)' }}>
      <div className="flex flex-col items-center gap-5">

        {/* Терминал */}
        <div className="relative w-72"
          style={{ filter: 'drop-shadow(0 40px 80px rgba(0,0,0,0.9)) drop-shadow(0 0 40px rgba(33,160,56,0.08))' }}>

          {/* Корпус */}
          <div className="rounded-[28px] p-1.5 overflow-hidden"
            style={{
              background: 'linear-gradient(160deg, #343434 0%, #202020 40%, #141414 100%)',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.08)'
            }}>

            {/* Шапка с логотипом */}
            <div className="flex items-center justify-between px-4 py-2.5 mb-0.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #21A038, #0d7a2a)' }}>
                  <span className="text-white text-[8px] font-bold">СБ</span>
                </div>
                <span className="text-white text-xs font-bold tracking-widest">СБЕРБАНК</span>
              </div>
              <div className="flex gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#21A038', boxShadow: '0 0 4px #21A038' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-[#21A038] opacity-40" />
                <div className="w-1.5 h-1.5 rounded-full bg-[#21A038] opacity-15" />
              </div>
            </div>

            {/* Экран */}
            <div className="rounded-xl overflow-hidden"
              style={{ boxShadow: 'inset 0 2px 12px rgba(0,0,0,0.9), 0 0 0 1px rgba(0,0,0,0.6)' }}>
              <div className="bg-[#080d12]" style={{ height: 400 }}>

                {/* === ЭКРАН: ВВОД СУММЫ === */}
                {screen === 'amount' && (
                  <div className="flex flex-col h-full">
                    <Header label="СБЕРБАНК" status="ГОТОВ" color="#4ade80" />
                    <div className="flex-1 flex flex-col items-center justify-center px-5 bg-[#080d12]">
                      <p className="text-[#4b5563] text-[10px] font-mono tracking-[0.2em] uppercase mb-3">Сумма оплаты</p>
                      <div className="w-full rounded-xl px-4 py-4 mb-2 flex items-center justify-end gap-2"
                        style={{ background: '#04080f', border: '1px solid rgba(30,58,95,0.6)' }}>
                        <span className="text-white text-3xl font-mono font-light tracking-wider">{formatted}</span>
                        <span className="text-[#21A038] text-lg font-mono font-bold">₽</span>
                      </div>
                      <p className="text-[#1f2937] text-[10px] font-mono mt-2">Введите сумму → ОК</p>
                    </div>
                    <NumPad onKey={handleKey} onDelete={handleDelete} onClear={handleClear} onConfirm={handleOk} onCancel={handleCancel} />
                  </div>
                )}

                {/* === ЭКРАН: ГАЛОЧКА ОК === */}
                {screen === 'amount_ok' && (
                  <div className="flex flex-col h-full items-center justify-center bg-[#080d12] gap-4">
                    <div className="w-20 h-20 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(33,160,56,0.15)', border: '2px solid #21A038', boxShadow: '0 0 30px rgba(33,160,56,0.3)' }}>
                      <Icon name="Check" size={38} className="text-[#4ade80]" />
                    </div>
                    <p className="text-[#4ade80] text-sm font-mono font-semibold tracking-wider">СУММА ПРИНЯТА</p>
                    <p className="text-white text-2xl font-mono font-light">{formatted} ₽</p>
                  </div>
                )}

                {/* === ЭКРАН: ПРИЛОЖИТЕ КАРТУ === */}
                {screen === 'card' && (
                  <div className="flex flex-col h-full">
                    <Header label="СБЕРБАНК" status="ОЖИДАНИЕ" color="#facc15" />
                    <div
                      className="flex-1 flex flex-col items-center justify-center gap-5 cursor-pointer select-none relative overflow-hidden"
                      style={{ background: '#080d12' }}
                      onClick={handleCardTap}>

                      {/* Пульсирующий фон при касании */}
                      <div className="absolute inset-0 rounded-xl transition-all duration-150 active:bg-white/5" />

                      <div className="text-center">
                        <p className="text-[#6b7280] text-[10px] font-mono tracking-[0.2em] uppercase mb-1">К оплате</p>
                        <p className="text-[#4ade80] text-3xl font-mono font-semibold">{formatted} ₽</p>
                      </div>

                      <div className="flex flex-col items-center gap-4">
                        {/* NFC иконка с пульсацией */}
                        <div className="relative flex items-center justify-center w-24 h-24">
                          <div className="absolute w-24 h-24 rounded-full animate-ping opacity-10"
                            style={{ background: '#21A038' }} />
                          <div className="absolute w-16 h-16 rounded-full animate-ping opacity-20"
                            style={{ background: '#21A038', animationDelay: '0.3s' }} />
                          <div className="w-16 h-16 rounded-full flex items-center justify-center relative z-10"
                            style={{ background: 'rgba(33,160,56,0.15)', border: '2px solid rgba(33,160,56,0.4)' }}>
                            <Icon name="Wifi" size={28} className="text-[#4ade80]" />
                          </div>
                        </div>

                        <div className="text-center">
                          <p className="text-white text-sm font-sans font-medium mb-0.5">Приложите карту</p>
                          <p className="text-[#374151] text-[10px] font-mono">или нажмите на экран</p>
                        </div>
                      </div>
                    </div>

                    <div className="px-4 py-3 border-t border-white/5 bg-[#06080f]">
                      <button onClick={handleCancel}
                        className="w-full py-2 text-[10px] font-mono rounded-lg transition-all"
                        style={{ color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.05)' }}>
                        ОТМЕНА
                      </button>
                    </div>
                  </div>
                )}

                {/* === ЭКРАН: ОБРАБОТКА === */}
                {screen === 'processing' && (
                  <div className="flex flex-col h-full items-center justify-center bg-[#080d12] gap-6 px-6">
                    <div className="relative w-16 h-16">
                      <div className="absolute inset-0 rounded-full border-2 border-[#1e3a5f]" />
                      <div className="absolute inset-0 rounded-full border-t-2 border-[#21A038] animate-spin" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Icon name="Wifi" size={22} className="text-[#4ade80]" />
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-white text-sm font-mono mb-1">Обработка...</p>
                      <p className="text-[#374151] text-[10px] font-mono">Не убирайте карту</p>
                    </div>
                    <div className="w-full rounded-full overflow-hidden h-1.5"
                      style={{ background: '#0a1628', border: '1px solid rgba(30,58,95,0.5)' }}>
                      <div className="h-full rounded-full transition-all duration-100"
                        style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #21A038, #4ade80)' }} />
                    </div>
                    <p className="text-[#4ade80] text-2xl font-mono">{formatted} ₽</p>
                  </div>
                )}

                {/* === ЭКРАН: УСПЕХ === */}
                {screen === 'success' && (
                  <div className="flex flex-col h-full items-center justify-center bg-[#080d12] gap-4 px-6">
                    <div className="w-24 h-24 rounded-full flex items-center justify-center"
                      style={{
                        background: 'rgba(33,160,56,0.15)',
                        border: '2px solid #21A038',
                        boxShadow: '0 0 40px rgba(33,160,56,0.4), 0 0 80px rgba(33,160,56,0.15)'
                      }}>
                      <Icon name="Check" size={44} className="text-[#4ade80]" />
                    </div>
                    <div className="text-center">
                      <p className="text-[#4ade80] text-xl font-mono font-bold tracking-widest mb-1">ОПЛАЧЕНО</p>
                      <p className="text-[#6b7280] text-[10px] font-mono">Платёж успешно проведён</p>
                    </div>
                    <p className="text-white text-2xl font-mono font-light">{formatted} ₽</p>
                    <p className="text-[#1f2937] text-[10px] font-mono">Возврат к началу...</p>
                  </div>
                )}

              </div>
            </div>

            {/* Слот карты */}
            <div className="mx-4 mt-2.5">
              <div className="h-5 rounded flex items-center justify-center relative overflow-hidden"
                style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.06)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.7)' }}>
                <div className="absolute inset-0 flex items-center px-2 gap-0.5">
                  {[...Array(30)].map((_, i) => (
                    <div key={i} className="w-px flex-shrink-0 h-2.5 bg-[#181818]" />
                  ))}
                </div>
                <span className="text-[#2a2a2a] text-[8px] font-mono relative z-10 bg-[#0a0a0a] px-1 tracking-wider">КАРТА</span>
              </div>
              {screen === 'card' && (
                <div className="h-0.5 rounded-full mt-0.5 animate-pulse" style={{ background: 'linear-gradient(90deg, transparent, #21A038, transparent)' }} />
              )}
            </div>

            {/* Индикаторы */}
            <div className="flex items-center justify-center gap-3 py-2.5">
              <div className="w-2 h-2 rounded-full transition-all duration-500"
                style={{
                  background: screen === 'success' ? '#21A038' : screen === 'processing' ? '#60a5fa' : '#21A038',
                  boxShadow: screen === 'success' ? '0 0 8px #21A038' : screen === 'processing' ? '0 0 8px #60a5fa' : '0 0 4px #21A038'
                }} />
              <span className="text-[#1f2937] text-[7px] font-mono tracking-widest">POS-TERMINAL</span>
              <div className="w-2 h-2 rounded-full transition-all duration-500"
                style={{
                  background: screen === 'card' ? '#facc15' : '#111',
                  boxShadow: screen === 'card' ? '0 0 8px #facc15' : 'none'
                }} />
            </div>

            {/* Логотипы платёжных систем */}
            <div className="flex items-center justify-center gap-2 pb-2.5">
              {['VISA', 'MC', 'МИР', 'NFC'].map(s => (
                <span key={s} className="text-[#252525] text-[7px] font-mono px-1.5 py-0.5 rounded"
                  style={{ border: '1px solid #1f1f1f' }}>{s}</span>
              ))}
            </div>
          </div>

          <div className="mx-10 h-3 bg-black/50 rounded-full blur-md mt-1" />
        </div>

        <p className="text-[#1f2937] text-[10px] font-mono tracking-widest text-center">
          СБЕРБАНК · POS TERMINAL · TRM-00847
        </p>
      </div>
    </div>
  );
}
