import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import func2url from '../../backend/func2url.json';

const API_TX = func2url.transactions;
const API_ST = func2url.settings;
const ADMIN_PASSWORD = 'io89io89';

type Tab = 'stats' | 'history' | 'settings';

interface Transaction {
  id: number;
  amount: number;
  status: string;
  card_mask: string;
  created_at: string;
}

interface Stats {
  total_count: number;
  total_amount: number;
  today_count: number;
  today_amount: number;
}

interface Settings {
  shop_name: string;
  terminal_id: string;
  min_amount: string;
  max_amount: string;
}

function fmtAmount(kopecks: number) {
  return (kopecks / 100).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₽';
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function statusLabel(s: string) {
  if (s === 'success') return { text: 'Оплачено', color: '#4ade80' };
  if (s === 'cancelled') return { text: 'Отменён', color: '#f87171' };
  if (s === 'refunded') return { text: 'Возврат', color: '#facc15' };
  return { text: s, color: '#9ca3af' };
}

// ── ЭКРАН ВХОДА ──────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [pass, setPass] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = () => {
    if (pass === ADMIN_PASSWORD) {
      onLogin();
    } else {
      setError(true);
      setPass('');
      setTimeout(() => setError(false), 1500);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg,#0a150b 0%,#111 100%)', fontFamily: 'Roboto, sans-serif',
    }}>
      <div style={{
        width: 340, background: '#1a1a1a', borderRadius: 20,
        boxShadow: '0 30px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.07)',
        overflow: 'hidden',
      }}>
        {/* Шапка */}
        <div style={{ background: '#0c1a0e', borderBottom: '1px solid rgba(33,160,56,0.4)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#21A038,#0d6e25)', boxShadow: '0 0 12px rgba(33,160,56,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="Shield" size={16} className="text-white" />
          </div>
          <div>
            <p style={{ color: '#fff', fontSize: 14, fontWeight: 700, letterSpacing: '0.1em' }}>ADMIN ПАНЕЛЬ</p>
            <p style={{ color: '#21A038', fontSize: 9, fontFamily: 'Roboto Mono,monospace', letterSpacing: '0.15em', opacity: 0.8 }}>СБЕРБАНК · TRM-00847</p>
          </div>
        </div>

        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ textAlign: 'center' }}>
            <Icon name="Lock" size={40} className="text-[#21A038]" style={{ margin: '0 auto 8px' }} />
            <p style={{ color: '#9ca3af', fontSize: 12, fontFamily: 'Roboto Mono,monospace', letterSpacing: '0.1em' }}>ВВЕДИТЕ ПАРОЛЬ</p>
          </div>

          <input
            type="password"
            value={pass}
            onChange={e => setPass(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="••••••••"
            style={{
              width: '100%', height: 52, borderRadius: 12, border: `1px solid ${error ? 'rgba(248,113,113,0.5)' : 'rgba(33,160,56,0.25)'}`,
              background: '#050e06', color: '#fff', fontSize: 22, textAlign: 'center',
              fontFamily: 'Roboto Mono,monospace', outline: 'none', boxSizing: 'border-box',
              transition: 'border-color 0.2s',
              letterSpacing: '0.3em',
            }}
          />

          {error && <p style={{ color: '#f87171', fontSize: 11, fontFamily: 'Roboto Mono,monospace', textAlign: 'center', letterSpacing: '0.1em' }}>НЕВЕРНЫЙ ПАРОЛЬ</p>}

          <button
            onClick={handleSubmit}
            style={{
              height: 52, borderRadius: 12, border: '1px solid rgba(33,160,56,0.5)',
              background: 'linear-gradient(135deg,rgba(33,160,56,0.28),rgba(13,110,37,0.28))',
              color: '#4ade80', fontSize: 13, fontFamily: 'Roboto Mono,monospace', fontWeight: 700,
              letterSpacing: '0.1em', cursor: 'pointer',
            }}>
            ВОЙТИ
          </button>

          <a href="/" style={{ color: '#374151', fontSize: 11, fontFamily: 'Roboto Mono,monospace', textAlign: 'center', textDecoration: 'none', letterSpacing: '0.1em' }}>
            ← ВЕРНУТЬСЯ К ТЕРМИНАЛУ
          </a>
        </div>
      </div>
    </div>
  );
}

// ── ГЛАВНАЯ ПАНЕЛЬ ────────────────────────────────────────────────────────────
function AdminPanel({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>('stats');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [settings, setSettings] = useState<Settings>({ shop_name: '', terminal_id: '', min_amount: '', max_amount: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [txRes, stRes] = await Promise.all([
        fetch(API_TX),
        fetch(API_ST),
      ]);
      const txData = await txRes.json();
      const stData = await stRes.json();
      setTransactions(txData.transactions || []);
      setStats(txData.stats || null);
      setSettings(stData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleStatusChange = async (id: number, status: string) => {
    await fetch(API_TX, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    loadData();
  };

  const handleDelete = async (id: number) => {
    await fetch(`${API_TX}?id=${id}`, { method: 'DELETE' });
    loadData();
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    await fetch(API_ST, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const tabStyle = (t: Tab): React.CSSProperties => ({
    flex: 1, height: 40, border: 'none', cursor: 'pointer',
    fontFamily: 'Roboto Mono,monospace', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
    borderRadius: 10,
    background: tab === t ? 'rgba(33,160,56,0.2)' : 'transparent',
    color: tab === t ? '#4ade80' : '#374151',
    borderBottom: tab === t ? '2px solid #21A038' : '2px solid transparent',
    transition: 'all 0.15s',
  });

  return (
    <div style={{
      position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column',
      background: '#0e0e0e', fontFamily: 'Roboto, sans-serif', overflow: 'hidden',
    }}>
      {/* Шапка */}
      <div style={{ background: '#0c1a0e', borderBottom: '1px solid rgba(33,160,56,0.35)', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#21A038,#0d6e25)', boxShadow: '0 0 10px rgba(33,160,56,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="Shield" size={15} className="text-white" />
          </div>
          <div>
            <p style={{ color: '#fff', fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', lineHeight: 1 }}>ADMIN ПАНЕЛЬ</p>
            <p style={{ color: '#21A038', fontSize: 9, fontFamily: 'Roboto Mono,monospace', letterSpacing: '0.12em', opacity: 0.7, lineHeight: 1, marginTop: 2 }}>СБЕРБАНК · TRM-00847</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <a href="/" style={{ color: '#374151', fontSize: 11, fontFamily: 'Roboto Mono,monospace', textDecoration: 'none', letterSpacing: '0.08em' }}>← ТЕРМИНАЛ</a>
          <button onClick={onLogout} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: 8, padding: '6px 14px', fontSize: 11, fontFamily: 'Roboto Mono,monospace', fontWeight: 700, cursor: 'pointer', letterSpacing: '0.08em' }}>ВЫЙТИ</button>
        </div>
      </div>

      {/* Табы */}
      <div style={{ display: 'flex', gap: 4, padding: '10px 16px', background: '#111', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
        <button style={tabStyle('stats')} onClick={() => setTab('stats')}><Icon name="BarChart2" size={13} style={{ display: 'inline', marginRight: 6 }} />СТАТИСТИКА</button>
        <button style={tabStyle('history')} onClick={() => setTab('history')}><Icon name="List" size={13} style={{ display: 'inline', marginRight: 6 }} />ИСТОРИЯ</button>
        <button style={tabStyle('settings')} onClick={() => setTab('settings')}><Icon name="Settings" size={13} style={{ display: 'inline', marginRight: 6 }} />НАСТРОЙКИ</button>
      </div>

      {/* Контент */}
      <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 10 }}>
            <div className="animate-spin" style={{ width: 24, height: 24, borderRadius: '50%', borderTop: '2px solid #21A038', border: '2px solid rgba(33,160,56,0.15)' }} />
            <span style={{ color: '#374151', fontFamily: 'Roboto Mono,monospace', fontSize: 12 }}>ЗАГРУЗКА...</span>
          </div>
        ) : (
          <>
            {/* ── СТАТИСТИКА ── */}
            {tab === 'stats' && stats && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 700, margin: '0 auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[
                    { label: 'Платежей сегодня', value: stats.today_count, sub: 'транзакций', icon: 'Calendar' },
                    { label: 'Выручка сегодня', value: fmtAmount(stats.today_amount), sub: 'рублей', icon: 'TrendingUp' },
                    { label: 'Всего платежей', value: stats.total_count, sub: 'за всё время', icon: 'CreditCard' },
                    { label: 'Общая выручка', value: fmtAmount(stats.total_amount), sub: 'за всё время', icon: 'Wallet' },
                  ].map(c => (
                    <div key={c.label} style={{ background: '#161616', border: '1px solid rgba(33,160,56,0.15)', borderRadius: 16, padding: '18px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <Icon name={c.icon as never} size={16} className="text-[#21A038]" />
                        <span style={{ color: '#4b5563', fontSize: 11, fontFamily: 'Roboto Mono,monospace', letterSpacing: '0.08em' }}>{c.label.toUpperCase()}</span>
                      </div>
                      <p style={{ color: '#fff', fontSize: 28, fontFamily: 'Roboto Mono,monospace', fontWeight: 300, lineHeight: 1, marginBottom: 4 }}>{c.value}</p>
                      <p style={{ color: '#1f3a22', fontSize: 10, fontFamily: 'Roboto Mono,monospace' }}>{c.sub}</p>
                    </div>
                  ))}
                </div>

                {/* Последние платежи */}
                <div style={{ background: '#161616', border: '1px solid rgba(33,160,56,0.15)', borderRadius: 16, padding: '18px 20px' }}>
                  <p style={{ color: '#4b5563', fontSize: 11, fontFamily: 'Roboto Mono,monospace', letterSpacing: '0.08em', marginBottom: 14 }}>ПОСЛЕДНИЕ ПЛАТЕЖИ</p>
                  {transactions.slice(0, 5).map(tx => {
                    const st = statusLabel(tx.status);
                    return (
                      <div key={tx.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <div style={{ display: 'flex', items: 'center', gap: 12 }}>
                          <span style={{ color: '#4b5563', fontSize: 11, fontFamily: 'Roboto Mono,monospace' }}>#{tx.id}</span>
                          <span style={{ color: '#6b7280', fontSize: 11, marginLeft: 12 }}>{fmtDate(tx.created_at)}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{ color: st.color, fontSize: 10, fontFamily: 'Roboto Mono,monospace' }}>{st.text}</span>
                          <span style={{ color: '#fff', fontSize: 14, fontFamily: 'Roboto Mono,monospace', fontWeight: 600 }}>{fmtAmount(tx.amount)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── ИСТОРИЯ ── */}
            {tab === 'history' && (
              <div style={{ maxWidth: 800, margin: '0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <p style={{ color: '#4b5563', fontSize: 11, fontFamily: 'Roboto Mono,monospace', letterSpacing: '0.08em' }}>ВСЕГО ТРАНЗАКЦИЙ: {transactions.length}</p>
                  <button onClick={loadData} style={{ background: 'rgba(33,160,56,0.1)', border: '1px solid rgba(33,160,56,0.3)', color: '#4ade80', borderRadius: 8, padding: '6px 14px', fontSize: 11, fontFamily: 'Roboto Mono,monospace', cursor: 'pointer' }}>ОБНОВИТЬ</button>
                </div>

                {transactions.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 60, color: '#1f3a22', fontFamily: 'Roboto Mono,monospace', fontSize: 12 }}>НЕТ ТРАНЗАКЦИЙ</div>
                ) : transactions.map(tx => {
                  const st = statusLabel(tx.status);
                  return (
                    <div key={tx.id} style={{
                      background: '#161616', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12,
                      padding: '14px 18px', marginBottom: 8,
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
                        <span style={{ color: '#374151', fontSize: 11, fontFamily: 'Roboto Mono,monospace', minWidth: 30 }}>#{tx.id}</span>
                        <div>
                          <p style={{ color: '#6b7280', fontSize: 11, marginBottom: 2 }}>{fmtDate(tx.created_at)}</p>
                          <p style={{ color: '#374151', fontSize: 10, fontFamily: 'Roboto Mono,monospace' }}>{tx.card_mask}</p>
                        </div>
                        <span style={{ color: st.color, fontSize: 10, fontFamily: 'Roboto Mono,monospace', background: `${st.color}18`, border: `1px solid ${st.color}40`, borderRadius: 6, padding: '2px 8px' }}>{st.text}</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ color: '#fff', fontSize: 16, fontFamily: 'Roboto Mono,monospace', fontWeight: 600, minWidth: 100, textAlign: 'right' }}>{fmtAmount(tx.amount)}</span>

                        {tx.status === 'success' && (
                          <button onClick={() => handleStatusChange(tx.id, 'refunded')}
                            style={{ background: 'rgba(250,204,21,0.1)', border: '1px solid rgba(250,204,21,0.3)', color: '#facc15', borderRadius: 8, padding: '5px 10px', fontSize: 10, fontFamily: 'Roboto Mono,monospace', cursor: 'pointer' }}>
                            ВОЗВРАТ
                          </button>
                        )}
                        {tx.status === 'success' && (
                          <button onClick={() => handleStatusChange(tx.id, 'cancelled')}
                            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: 8, padding: '5px 10px', fontSize: 10, fontFamily: 'Roboto Mono,monospace', cursor: 'pointer' }}>
                            ОТМЕНА
                          </button>
                        )}
                        <button onClick={() => handleDelete(tx.id)}
                          style={{ background: 'transparent', border: 'none', color: '#374151', cursor: 'pointer', padding: 4 }}>
                          <Icon name="Trash2" size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── НАСТРОЙКИ ── */}
            {tab === 'settings' && (
              <div style={{ maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { key: 'shop_name', label: 'Название магазина' },
                  { key: 'terminal_id', label: 'Номер терминала' },
                  { key: 'min_amount', label: 'Минимальная сумма (копейки)' },
                  { key: 'max_amount', label: 'Максимальная сумма (копейки)' },
                ].map(f => (
                  <div key={f.key}>
                    <p style={{ color: '#4b5563', fontSize: 10, fontFamily: 'Roboto Mono,monospace', letterSpacing: '0.1em', marginBottom: 6 }}>{f.label.toUpperCase()}</p>
                    <input
                      value={settings[f.key as keyof Settings]}
                      onChange={e => setSettings(s => ({ ...s, [f.key]: e.target.value }))}
                      style={{
                        width: '100%', height: 48, borderRadius: 12,
                        border: '1px solid rgba(33,160,56,0.2)', background: '#111',
                        color: '#fff', fontSize: 14, fontFamily: 'Roboto Mono,monospace',
                        padding: '0 16px', outline: 'none', boxSizing: 'border-box',
                      }}
                    />
                  </div>
                ))}

                <button
                  onClick={handleSaveSettings}
                  style={{
                    height: 52, borderRadius: 12, marginTop: 8,
                    border: '1px solid rgba(33,160,56,0.5)',
                    background: saved ? 'rgba(74,222,128,0.2)' : 'linear-gradient(135deg,rgba(33,160,56,0.28),rgba(13,110,37,0.28))',
                    color: saved ? '#4ade80' : '#4ade80',
                    fontSize: 13, fontFamily: 'Roboto Mono,monospace', fontWeight: 700,
                    letterSpacing: '0.1em', cursor: 'pointer',
                    transition: 'background 0.3s',
                  }}>
                  {saving ? 'СОХРАНЕНИЕ...' : saved ? '✓ СОХРАНЕНО' : 'СОХРАНИТЬ'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── КОРНЕВОЙ КОМПОНЕНТ ────────────────────────────────────────────────────────
export default function Admin() {
  const [auth, setAuth] = useState(false);
  return auth
    ? <AdminPanel onLogout={() => setAuth(false)} />
    : <LoginScreen onLogin={() => setAuth(true)} />;
}
