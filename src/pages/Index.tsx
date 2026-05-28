import { useState, useEffect, useRef, useCallback } from 'react';
import Icon from '@/components/ui/icon';

type Screen = 'amount' | 'card' | 'confirm' | 'processing' | 'success' | 'error';

const SBER_GREEN = '#21A038';
const SBER_DARK = '#1a1a2e';

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

  const cardBeep = useCallback(() => {
    beep(1200, 0.08, 'sine', 0.2);
    setTimeout(() => beep(1400, 0.08, 'sine', 0.2), 100);
  }, [beep]);

  const successSound = useCallback(() => {
    beep(523, 0.15, 'sine', 0.3);
    setTimeout(() => beep(659, 0.15, 'sine', 0.3), 160);
    setTimeout(() => beep(784, 0.3, 'sine', 0.35), 320);
  }, [beep]);

  const errorSound = useCallback(() => {
    beep(300, 0.2, 'square', 0.25);
    setTimeout(() => beep(250, 0.3, 'square', 0.2), 220);
  }, [beep]);

  return { keyBeep, cardBeep, successSound, errorSound };
}

function TerminalScreen({ screen, amount, cardAnim, progress, onKeyPress, onDelete, onClear, onConfirm, onCancel, onReset }:
  {
    screen: Screen; amount: string; cardAnim: boolean; progress: number;
    onKeyPress: (k: string) => void; onDelete: () => void; onClear: () => void;
    onConfirm: () => void; onCancel: () => void; onReset: () => void;
  }) {

  const formatted = amount
    ? (parseInt(amount, 10) / 100).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '0,00';

  if (screen === 'amount') {
    return (
      <div className="flex flex-col h-full">
        <div className="bg-[#0a3d1f] px-4 py-3 flex items-center justify-between border-b border-[#1a5a2e]">
          <span className="text-[#4ade80] text-xs font-mono tracking-wider">СБЕРБАНК</span>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse" />
            <span className="text-[#4ade80] text-xs font-mono">ГОТОВ</span>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6 py-4 bg-[#0d1117]">
          <p className="text-[#6b7280] text-xs font-mono tracking-widest mb-2 uppercase">Сумма оплаты</p>
          <div className="w-full bg-[#0a1628] border border-[#1e3a5f] rounded px-4 py-3 mb-1 min-h-[64px] flex items-center justify-end">
            <span className="text-white text-3xl font-mono font-medium tracking-wider">
              {formatted}
            </span>
          </div>
          <div className="w-full flex justify-end pr-1">
            <span className="text-[#4ade80] text-sm font-mono">₽</span>
          </div>
          <p className="text-[#374151] text-xs font-mono mt-3">Введите сумму и нажмите ОК</p>
        </div>

        <NumPad onKey={onKeyPress} onDelete={onDelete} onClear={onClear} onConfirm={onConfirm} onCancel={onCancel} />
      </div>
    );
  }

  if (screen === 'card') {
    return (
      <div className="flex flex-col h-full">
        <div className="bg-[#0a3d1f] px-4 py-3 flex items-center justify-between border-b border-[#1a5a2e]">
          <span className="text-[#4ade80] text-xs font-mono tracking-wider">СБЕРБАНК</span>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            <span className="text-yellow-400 text-xs font-mono">ОЖИДАНИЕ</span>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center bg-[#0d1117] px-6 gap-6">
          <div className="text-center">
            <p className="text-[#9ca3af] text-xs font-mono tracking-widest mb-1 uppercase">К оплате</p>
            <p className="text-[#4ade80] text-2xl font-mono font-semibold">{formatted} ₽</p>
          </div>

          <div className="relative w-full flex flex-col items-center gap-4">
            <p className="text-white text-sm font-sans text-center leading-relaxed">
              Приложите или вставьте карту
            </p>

            <div className="relative w-48 h-8 flex items-center justify-center">
              {cardAnim ? (
                <div className="animate-card-swipe absolute">
                  <div className="w-32 h-20 rounded-lg bg-gradient-to-br from-[#c9a227] via-[#f0d060] to-[#b8860b] shadow-lg flex flex-col justify-between p-2 border border-yellow-400/30">
                    <div className="w-8 h-5 rounded bg-[#c9a227] border border-yellow-700/50" />
                    <div className="text-right">
                      <p className="text-[8px] font-mono text-yellow-900 font-bold">**** **** **** 7734</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-10 border-2 border-dashed border-[#374151] rounded-lg flex items-center justify-center">
                    <Icon name="CreditCard" size={20} className="text-[#374151]" />
                  </div>
                  <div className="flex gap-3 items-center">
                    <div className="w-10 h-10 border-2 border-dashed border-[#374151] rounded-full flex items-center justify-center">
                      <Icon name="Wifi" size={14} className="text-[#374151]" />
                    </div>
                    <span className="text-[#374151] text-xs font-mono">NFC</span>
                  </div>
                </div>
              )}
            </div>

            {!cardAnim && (
              <div className="flex items-center gap-1 mt-2">
                <div className="w-1 h-1 rounded-full bg-[#4ade80] animate-pulse" style={{ animationDelay: '0ms' }} />
                <div className="w-1 h-1 rounded-full bg-[#4ade80] animate-pulse" style={{ animationDelay: '300ms' }} />
                <div className="w-1 h-1 rounded-full bg-[#4ade80] animate-pulse" style={{ animationDelay: '600ms' }} />
              </div>
            )}
          </div>
        </div>

        <div className="px-4 py-3 border-t border-[#1a1a2e] bg-[#070d17]">
          <button onClick={onCancel} className="w-full py-2 text-xs font-mono text-[#ef4444] border border-[#ef4444]/30 rounded hover:bg-[#ef4444]/10 transition-colors">
            ОТМЕНА
          </button>
        </div>
      </div>
    );
  }

  if (screen === 'confirm') {
    return (
      <div className="flex flex-col h-full">
        <div className="bg-[#0a3d1f] px-4 py-3 flex items-center justify-between border-b border-[#1a5a2e]">
          <span className="text-[#4ade80] text-xs font-mono tracking-wider">СБЕРБАНК</span>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-yellow-400" />
            <span className="text-yellow-400 text-xs font-mono">ПОДТВЕРЖДЕНИЕ</span>
          </div>
        </div>
        <div className="flex-1 flex flex-col bg-[#0d1117] px-5 py-4 gap-3 animate-slide-up">
          <p className="text-[#9ca3af] text-xs font-mono tracking-widest uppercase mb-1">Детали платежа</p>

          <div className="bg-[#0a1628] border border-[#1e3a5f] rounded p-3 space-y-2">
            <Row label="Сумма" value={`${formatted} ₽`} accent />
            <div className="border-t border-[#1e3a5f]" />
            <Row label="Карта" value="**** 7734" />
            <Row label="Дата" value={new Date().toLocaleDateString('ru-RU')} />
            <Row label="Время" value={new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} />
            <div className="border-t border-[#1e3a5f]" />
            <Row label="Получатель" value="МАГАЗИН №1" />
            <Row label="Терминал" value="TRM-00847" />
          </div>

          <p className="text-[#6b7280] text-xs font-mono text-center mt-1">Подтвердите оплату на экране</p>
        </div>

        <div className="px-4 py-3 border-t border-[#1a1a2e] bg-[#070d17] flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 text-xs font-mono text-[#ef4444] border border-[#ef4444]/30 rounded hover:bg-[#ef4444]/10 transition-colors">
            ОТМЕНА
          </button>
          <button onClick={onConfirm} className="flex-1 py-2.5 text-xs font-mono text-white bg-[#21A038] rounded hover:bg-[#1a8030] transition-colors font-bold">
            ОПЛАТИТЬ
          </button>
        </div>
      </div>
    );
  }

  if (screen === 'processing') {
    return (
      <div className="flex flex-col h-full">
        <div className="bg-[#0a3d1f] px-4 py-3 flex items-center justify-between border-b border-[#1a5a2e]">
          <span className="text-[#4ade80] text-xs font-mono tracking-wider">СБЕРБАНК</span>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-blue-400 text-xs font-mono">ОБРАБОТКА</span>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center bg-[#0d1117] gap-5 px-6">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-2 border-[#1e3a5f] flex items-center justify-center">
              <div className="w-16 h-16 rounded-full border-t-2 border-[#21A038] animate-spin absolute" />
              <Icon name="Wifi" size={24} className="text-[#4ade80]" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-white text-sm font-mono mb-1">Обработка платежа</p>
            <p className="text-[#6b7280] text-xs font-mono">Не убирайте карту...</p>
          </div>

          <div className="w-full bg-[#0a1628] border border-[#1e3a5f] rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#21A038] to-[#4ade80] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="font-mono text-[#4ade80] text-2xl font-semibold">{formatted} ₽</div>
        </div>
      </div>
    );
  }

  if (screen === 'success') {
    return (
      <div className="flex flex-col h-full">
        <div className="bg-[#0a3d1f] px-4 py-3 flex items-center justify-between border-b border-[#1a5a2e]">
          <span className="text-[#4ade80] text-xs font-mono tracking-wider">СБЕРБАНК</span>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-[#4ade80]" />
            <span className="text-[#4ade80] text-xs font-mono">ОПЛАЧЕНО</span>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center bg-[#0d1117] gap-5 px-6 animate-slide-up">
          <div className="w-20 h-20 rounded-full bg-[#21A038]/20 border-2 border-[#21A038] flex items-center justify-center animate-pulse-green">
            <Icon name="Check" size={36} className="text-[#4ade80]" />
          </div>
          <div className="text-center">
            <p className="text-[#4ade80] text-xl font-mono font-bold mb-1">ОПЛАТА ПРОШЛА</p>
            <p className="text-[#9ca3af] text-xs font-mono">Платёж успешно проведён</p>
          </div>
          <div className="bg-[#0a1628] border border-[#1e3a5f] rounded p-4 w-full space-y-2">
            <Row label="Сумма" value={`${formatted} ₽`} accent />
            <div className="border-t border-[#1e3a5f]" />
            <Row label="Статус" value="ОДОБРЕНО" />
            <Row label="Код авт." value={Math.random().toString().slice(2, 8).toUpperCase()} />
            <Row label="RRN" value={Math.random().toString().slice(2, 14)} />
          </div>
          <p className="text-[#374151] text-xs font-mono text-center">Спасибо за оплату!</p>
        </div>
        <div className="px-4 py-3 border-t border-[#1a1a2e] bg-[#070d17]">
          <button onClick={onReset} className="w-full py-2.5 text-xs font-mono text-white bg-[#21A038] rounded hover:bg-[#1a8030] transition-colors font-bold">
            НОВЫЙ ПЛАТЁЖ
          </button>
        </div>
      </div>
    );
  }

  if (screen === 'error') {
    return (
      <div className="flex flex-col h-full">
        <div className="bg-[#3d0a0a] px-4 py-3 flex items-center justify-between border-b border-[#5a1a1a]">
          <span className="text-[#f87171] text-xs font-mono tracking-wider">СБЕРБАНК</span>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-[#ef4444]" />
            <span className="text-[#ef4444] text-xs font-mono">ОШИБКА</span>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center bg-[#0d1117] gap-5 px-6 animate-shake">
          <div className="w-20 h-20 rounded-full bg-[#ef4444]/10 border-2 border-[#ef4444] flex items-center justify-center">
            <Icon name="X" size={36} className="text-[#ef4444]" />
          </div>
          <div className="text-center">
            <p className="text-[#ef4444] text-xl font-mono font-bold mb-1">ОТКАЗАНО</p>
            <p className="text-[#9ca3af] text-xs font-mono">Платёж не прошёл</p>
          </div>
          <div className="bg-[#1a0a0a] border border-[#5a1a1a] rounded p-3 w-full">
            <p className="text-[#6b7280] text-xs font-mono text-center">Недостаточно средств или<br />карта заблокирована</p>
          </div>
        </div>
        <div className="px-4 py-3 border-t border-[#1a1a2e] bg-[#070d17]">
          <button onClick={onReset} className="w-full py-2.5 text-xs font-mono text-white bg-[#ef4444]/80 rounded hover:bg-[#ef4444] transition-colors font-bold">
            ПОПРОБОВАТЬ СНОВА
          </button>
        </div>
      </div>
    );
  }

  return null;
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-[#6b7280] text-xs font-mono">{label}</span>
      <span className={`text-xs font-mono font-medium ${accent ? 'text-[#4ade80] text-sm' : 'text-white'}`}>{value}</span>
    </div>
  );
}

function NumPad({ onKey, onDelete, onClear, onConfirm, onCancel }:
  { onKey: (k: string) => void; onDelete: () => void; onClear: () => void; onConfirm: () => void; onCancel: () => void }) {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  return (
    <div className="bg-[#070d17] border-t border-[#1a1a2e] p-3">
      <div className="grid grid-cols-3 gap-2 mb-2">
        {keys.map(k => (
          <button key={k} onClick={() => onKey(k)}
            className="h-11 bg-[#0f1923] border border-[#1e3a5f] rounded text-white font-mono text-lg font-medium hover:bg-[#1a2a3a] active:bg-[#21A038]/30 transition-all select-none">
            {k}
          </button>
        ))}
        <button onClick={onClear}
          className="h-11 bg-[#0f1923] border border-[#1e3a5f] rounded text-[#9ca3af] font-mono text-xs hover:bg-[#1a2a3a] active:bg-red-900/30 transition-all select-none">
          СБР
        </button>
        <button onClick={() => onKey('0')}
          className="h-11 bg-[#0f1923] border border-[#1e3a5f] rounded text-white font-mono text-lg font-medium hover:bg-[#1a2a3a] active:bg-[#21A038]/30 transition-all select-none">
          0
        </button>
        <button onClick={onDelete}
          className="h-11 bg-[#0f1923] border border-[#1e3a5f] rounded flex items-center justify-center hover:bg-[#1a2a3a] active:bg-red-900/30 transition-all select-none">
          <Icon name="Delete" size={18} className="text-[#9ca3af]" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={onCancel}
          className="h-11 bg-[#1a0a0a] border border-[#ef4444]/30 rounded text-[#ef4444] font-mono text-xs font-bold hover:bg-[#ef4444]/10 transition-all select-none">
          ОТМЕНА
        </button>
        <button onClick={onConfirm}
          className="h-11 bg-[#0a3d1f] border border-[#21A038]/50 rounded text-[#4ade80] font-mono text-xs font-bold hover:bg-[#21A038]/20 transition-all select-none">
          ОК
        </button>
      </div>
    </div>
  );
}

export default function Index() {
  const [screen, setScreen] = useState<Screen>('amount');
  const [amount, setAmount] = useState('');
  const [cardAnim, setCardAnim] = useState(false);
  const [progress, setProgress] = useState(0);
  const { keyBeep, cardBeep, successSound, errorSound } = useSound();

  const handleKey = (k: string) => {
    keyBeep();
    if (amount.length >= 8) return;
    setAmount(prev => prev + k);
  };

  const handleDelete = () => {
    keyBeep();
    setAmount(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    keyBeep();
    setAmount('');
  };

  const handleConfirm = () => {
    if (screen === 'amount') {
      if (!amount || parseInt(amount) === 0) return;
      keyBeep();
      setScreen('card');
      simulateCard();
    } else if (screen === 'confirm') {
      setScreen('processing');
      simulateProcessing();
    }
  };

  const simulateCard = () => {
    setTimeout(() => {
      cardBeep();
      setCardAnim(true);
      setTimeout(() => {
        setCardAnim(false);
        setScreen('confirm');
      }, 1900);
    }, 1500);
  };

  const simulateProcessing = () => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 5;
      });
    }, 100);

    setTimeout(() => {
      clearInterval(interval);
      setProgress(100);
      const success = Math.random() > 0.2;
      if (success) {
        successSound();
        setScreen('success');
      } else {
        errorSound();
        setScreen('error');
      }
    }, 2200);
  };

  const handleCancel = () => {
    keyBeep();
    setScreen('amount');
    setCardAnim(false);
    setProgress(0);
  };

  const handleReset = () => {
    keyBeep();
    setAmount('');
    setCardAnim(false);
    setProgress(0);
    setScreen('amount');
  };

  return (
    <div className="min-h-screen bg-[#111827] flex items-center justify-center font-sans p-4"
      style={{ background: 'radial-gradient(ellipse at center, #1a2a1a 0%, #0a0f0a 100%)' }}>

      <div className="flex flex-col items-center gap-4">
        <div className="text-center">
          <p className="text-[#4ade80] text-xs font-mono tracking-[0.3em] uppercase opacity-60">Платёжный терминал</p>
        </div>

        {/* Корпус терминала */}
        <div className="relative"
          style={{
            filter: 'drop-shadow(0 30px 60px rgba(0,0,0,0.8)) drop-shadow(0 0 30px rgba(33,160,56,0.1))'
          }}>

          {/* Основной корпус */}
          <div className="w-72 bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] rounded-3xl p-1.5 shadow-2xl"
            style={{
              background: 'linear-gradient(160deg, #3a3a3a 0%, #1f1f1f 40%, #161616 100%)',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.1)'
            }}>

            {/* Верхняя панель с логотипом */}
            <div className="flex items-center justify-between px-4 py-2.5 mb-1">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #21A038, #0d7a2a)' }}>
                  <span className="text-white text-[8px] font-bold">СБ</span>
                </div>
                <span className="text-white text-xs font-bold tracking-wider" style={{ fontFamily: 'Roboto, sans-serif' }}>СБЕРБАНК</span>
              </div>
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#21A038]" />
                <div className="w-1.5 h-1.5 rounded-full bg-[#21A038] opacity-50" />
                <div className="w-1.5 h-1.5 rounded-full bg-[#21A038] opacity-25" />
              </div>
            </div>

            {/* Экран */}
            <div className="rounded-2xl overflow-hidden border border-black/50 shadow-inner"
              style={{
                background: '#0d1117',
                boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.03)'
              }}>
              <div className="h-[420px] overflow-hidden">
                <TerminalScreen
                  screen={screen}
                  amount={amount}
                  cardAnim={cardAnim}
                  progress={progress}
                  onKeyPress={handleKey}
                  onDelete={handleDelete}
                  onClear={handleClear}
                  onConfirm={handleConfirm}
                  onCancel={handleCancel}
                  onReset={handleReset}
                />
              </div>
            </div>

            {/* Слот для карты */}
            <div className="mt-3 mx-4 relative">
              <div className="h-5 bg-[#111] rounded border border-[#333] flex items-center justify-center gap-2 relative overflow-hidden"
                style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.6)' }}>
                <div className="absolute inset-0 flex items-center px-2 gap-1 justify-center">
                  {[...Array(20)].map((_, i) => (
                    <div key={i} className="w-px h-2 bg-[#222] flex-shrink-0" />
                  ))}
                </div>
                <span className="text-[#444] text-[9px] font-mono relative z-10 bg-[#111] px-1">КАРТА</span>
              </div>
              {(screen === 'card') && (
                <div className="absolute -top-0.5 left-0 right-0 h-0.5 bg-[#21A038] animate-pulse rounded" />
              )}
            </div>

            {/* Нижние LED-индикаторы */}
            <div className="flex items-center justify-center gap-3 py-3">
              <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                screen === 'success' ? 'bg-[#21A038] shadow-[0_0_6px_#21A038]' :
                screen === 'error' ? 'bg-[#ef4444] shadow-[0_0_6px_#ef4444]' :
                screen === 'processing' ? 'bg-blue-400 shadow-[0_0_6px_#60a5fa] animate-pulse' :
                'bg-[#21A038] shadow-[0_0_4px_#21A038]'
              }`} />
              <div className="text-[#333] text-[8px] font-mono tracking-widest">POS-TERMINAL</div>
              <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                screen === 'card' ? 'bg-yellow-400 shadow-[0_0_6px_#facc15] animate-pulse' : 'bg-[#222]'
              }`} />
            </div>

            {/* Логотипы систем */}
            <div className="flex items-center justify-center gap-3 pb-2 px-4">
              <span className="text-[#444] text-[7px] font-mono border border-[#333] rounded px-1.5 py-0.5">VISA</span>
              <span className="text-[#444] text-[7px] font-mono border border-[#333] rounded px-1.5 py-0.5">MasterCard</span>
              <span className="text-[#444] text-[7px] font-mono border border-[#333] rounded px-1.5 py-0.5">МИР</span>
              <span className="text-[#444] text-[7px] font-mono border border-[#333] rounded px-1.5 py-0.5">NFC</span>
            </div>
          </div>

          {/* Тень/подставка */}
          <div className="mx-8 h-3 bg-black/40 rounded-full blur-md mt-1" />
        </div>

        <p className="text-[#374151] text-xs font-mono text-center">
          Нажмите на кнопки терминала для оплаты
        </p>
      </div>
    </div>
  );
}
