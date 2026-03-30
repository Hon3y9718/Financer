import { useState, useEffect, useCallback, useRef } from "react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://rhrcxtsfltmtvtaiwbmg.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJocmN4dHNmbHRtdHZ0YWl3Ym1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4NTgxMjYsImV4cCI6MjA5MDQzNDEyNn0.YpuUerWEmcn9xT_sx8yhHgCjd39WElAGwMwdvR6XV_4";

const fmt = (n) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);
const now = new Date();
const CUR_MONTH = now.getMonth() + 1;
const CUR_YEAR = now.getFullYear();

async function sb(table, method = "GET", body = null, query = "") {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${query}`, {
    method,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      Prefer: method === "POST" ? "return=representation" : "",
    },
    body: body ? JSON.stringify(body) : null,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.status === 204 ? null : res.json();
}

const TABS = [
  { id: "dashboard", label: "Home", icon: "◈" },
  { id: "budget", label: "Budget", icon: "◉" },
  { id: "transactions", label: "Spends", icon: "⟳" },
  { id: "subscriptions", label: "EMIs", icon: "↻" },
  { id: "loans", label: "Loans", icon: "▣" },
  { id: "investments", label: "Invest", icon: "△" },
  { id: "income", label: "Income", icon: "↑" },
  { id: "ai", label: "AI", icon: "✦" },
];

const BUDGET_ICONS = { Food: "🍽", Transport: "🚗", Shopping: "🛍", Entertainment: "🎬", Health: "💊", Utilities: "⚡", Other: "📦" };
const EMI_DUE_WARNING_DAYS = 5;

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  :root{
    --bg:#f7f6f2;--surface:#ffffff;--border:#e8e6e0;--text:#1a1916;--muted:#7a7870;
    --accent:#2d6a4f;--accent2:#e9c46a;--danger:#e76f51;--success:#2d6a4f;
    --radius:12px;--font:'DM Sans',sans-serif;--mono:'DM Mono',monospace;
    --bottom-nav-h:64px;
  }
  @media(prefers-color-scheme:dark){
    :root{--bg:#141412;--surface:#1e1d1a;--border:#2e2d2a;--text:#f0ede6;--muted:#6a6860;--accent:#52b788;--accent2:#e9c46a;--danger:#e76f51;--success:#52b788}
  }
  html,body,#root{height:100%;width:100%}
  body{font-family:var(--font);background:var(--bg);color:var(--text);-webkit-tap-highlight-color:transparent}
  .app{display:flex;height:100%;overflow:hidden}
  .sidebar{width:220px;background:var(--surface);border-right:1px solid var(--border);display:flex;flex-direction:column;padding:1.5rem 0;flex-shrink:0;overflow-y:auto}
  .main{flex:1;overflow-y:auto;padding:2rem;padding-bottom:2rem}
  .bottom-nav{display:none}
  @media(max-width:767px){
    .sidebar{display:none}
    .main{padding:1rem;padding-bottom:calc(var(--bottom-nav-h) + 1.25rem)}
    .bottom-nav{
      display:flex;position:fixed;bottom:0;left:0;right:0;height:var(--bottom-nav-h);
      background:var(--surface);border-top:1px solid var(--border);z-index:50;
      padding:0 2px;padding-bottom:env(safe-area-inset-bottom);
      overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;
    }
    .bottom-nav::-webkit-scrollbar{display:none}
    .page-title{font-size:1.15rem!important;margin-bottom:1rem!important}
    .big-spendable{font-size:1.9rem!important}
    .grid4{grid-template-columns:1fr 1fr!important}
    .form-row{grid-template-columns:1fr 1fr}
  }
  .bn-item{flex:1;min-width:52px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;cursor:pointer;padding:8px 2px;color:var(--muted);transition:color 0.15s;border:none;background:none;font-family:var(--font)}
  .bn-item.active{color:var(--accent)}
  .bn-icon{font-size:1.05rem;line-height:1}
  .bn-label{font-size:0.58rem;font-weight:500;white-space:nowrap}
  .logo{padding:0 1.25rem 1.5rem;font-size:1.3rem;font-weight:600;letter-spacing:-0.5px;display:flex;align-items:center;gap:8px}
  .logo-dot{width:10px;height:10px;border-radius:50%;background:var(--accent);flex-shrink:0}
  .nav-item{display:flex;align-items:center;gap:10px;padding:0.6rem 1.25rem;font-size:0.85rem;color:var(--muted);cursor:pointer;transition:all 0.15s;border-left:2px solid transparent}
  .nav-item:hover{color:var(--text);background:var(--bg)}
  .nav-item.active{color:var(--accent);background:var(--bg);border-left-color:var(--accent);font-weight:500}
  .nav-icon{width:18px;text-align:center;font-size:0.9rem}
  .page-title{font-size:1.4rem;font-weight:600;letter-spacing:-0.3px;margin-bottom:1.25rem}
  .section-title{font-size:0.78rem;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:0.5px}
  .section-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:0.875rem;gap:8px;flex-wrap:wrap}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:0.75rem}
  .grid3{display:grid;grid-template-columns:1fr 1fr;gap:0.75rem}
  .grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:0.75rem}
  @media(min-width:768px){.grid3{grid-template-columns:repeat(3,1fr);gap:1rem}.grid2,.grid4{gap:1rem}}
  .card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:1rem}
  @media(min-width:768px){.card{padding:1.25rem}}
  .card-sm{padding:0.875rem}
  .metric-label{font-size:0.68rem;color:var(--muted);letter-spacing:0.3px;text-transform:uppercase;margin-bottom:4px}
  .metric-val{font-size:1.15rem;font-weight:600;font-family:var(--mono);letter-spacing:-0.5px}
  @media(min-width:768px){.metric-val{font-size:1.4rem}}
  .metric-val.green{color:var(--success)}
  .metric-val.red{color:var(--danger)}
  .metric-val.amber{color:var(--accent2)}
  .big-spendable{font-size:2.4rem;font-weight:600;font-family:var(--mono);letter-spacing:-1px;color:var(--accent)}
  @media(min-width:768px){.big-spendable{font-size:2.8rem}}
  .progress-bar{height:5px;background:var(--border);border-radius:3px;overflow:hidden;margin-top:8px}
  .progress-fill{height:100%;border-radius:3px;background:var(--accent);transition:width 0.5s}
  .btn{display:inline-flex;align-items:center;gap:6px;padding:0.5rem 0.875rem;border-radius:8px;font-size:0.83rem;font-family:var(--font);cursor:pointer;transition:all 0.15s;border:1px solid var(--border);background:var(--surface);color:var(--text);font-weight:500;white-space:nowrap;-webkit-tap-highlight-color:transparent}
  .btn:active{transform:scale(0.97)}
  .btn:hover{background:var(--bg)}
  .btn-primary{background:var(--accent);color:#fff;border-color:var(--accent)}
  .btn-primary:hover{opacity:0.9}
  .btn-sm{padding:0.3rem 0.65rem;font-size:0.75rem}
  .tag{display:inline-block;padding:2px 7px;border-radius:20px;font-size:0.68rem;font-weight:500;white-space:nowrap}
  .tag-green{background:#d8f3dc;color:#1b4332}
  .tag-red{background:#ffe8e0;color:#7f1d1d}
  .tag-amber{background:#fef3c7;color:#78350f}
  .tag-blue{background:#dbeafe;color:#1e3a5f}
  @media(prefers-color-scheme:dark){
    .tag-green{background:#1b4332;color:#d8f3dc}.tag-red{background:#450a0a;color:#fecaca}
    .tag-amber{background:#451a03;color:#fef3c7}.tag-blue{background:#0c1a2e;color:#bfdbfe}
  }
  .list-item{display:flex;align-items:flex-start;justify-content:space-between;padding:0.75rem 0;border-bottom:1px solid var(--border);gap:8px}
  .list-item:last-child{border-bottom:none}
  .item-name{font-size:0.875rem;font-weight:500;line-height:1.3}
  .item-sub{font-size:0.72rem;color:var(--muted);margin-top:3px;line-height:1.4}
  .item-amount{font-family:var(--mono);font-size:0.875rem;font-weight:500;flex-shrink:0}
  .item-actions{display:flex;align-items:center;gap:6px;flex-shrink:0}
  .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.55);display:flex;align-items:flex-end;justify-content:center;z-index:200;padding:0}
  @media(min-width:768px){.modal-overlay{align-items:center;padding:1rem}}
  .modal{background:var(--surface);width:100%;max-width:480px;border-radius:20px 20px 0 0;padding:1.25rem;padding-bottom:calc(1.25rem + env(safe-area-inset-bottom));max-height:92vh;overflow-y:auto}
  @media(min-width:768px){.modal{border-radius:var(--radius);padding:1.5rem;max-height:85vh}}
  .modal-handle{width:36px;height:4px;border-radius:2px;background:var(--border);margin:0 auto 1rem;display:block}
  @media(min-width:768px){.modal-handle{display:none}}
  .modal-title{font-size:1.05rem;font-weight:600;margin-bottom:1.1rem}
  .form-group{margin-bottom:0.875rem}
  .form-label{display:block;font-size:0.78rem;color:var(--muted);margin-bottom:5px;font-weight:500}
  .form-input{width:100%;padding:0.625rem 0.875rem;border:1px solid var(--border);border-radius:8px;font-size:1rem;font-family:var(--font);background:var(--bg);color:var(--text);outline:none;-webkit-appearance:none;appearance:none}
  .form-input:focus{border-color:var(--accent)}
  .form-row{display:grid;grid-template-columns:1fr 1fr;gap:0.75rem}
  .form-actions{display:flex;gap:8px;justify-content:flex-end;margin-top:0.25rem}
  .chat-wrap{display:flex;flex-direction:column;border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;background:var(--surface)}
  .chat-messages{overflow-y:auto;padding:1rem;display:flex;flex-direction:column;gap:0.875rem;min-height:240px;max-height:45vh}
  @media(min-width:768px){.chat-messages{max-height:380px}}
  .chat-msg{max-width:85%;padding:0.65rem 0.9rem;border-radius:12px;font-size:0.875rem;line-height:1.55;word-break:break-word}
  .chat-msg.user{align-self:flex-end;background:var(--accent);color:#fff;border-bottom-right-radius:3px}
  .chat-msg.ai{align-self:flex-start;background:var(--bg);border:1px solid var(--border);border-bottom-left-radius:3px}
  .chat-input-row{display:flex;gap:8px;padding:0.75rem;border-top:1px solid var(--border)}
  .chat-input{flex:1;padding:0.625rem 0.875rem;border:1px solid var(--border);border-radius:8px;font-family:var(--font);font-size:0.875rem;background:var(--bg);color:var(--text);outline:none;min-width:0}
  .chat-input:focus{border-color:var(--accent)}
  .spinner{display:inline-block;width:16px;height:16px;border:2px solid var(--border);border-top-color:var(--accent);border-radius:50%;animation:spin 0.6s linear infinite}
  @keyframes spin{to{transform:rotate(360deg)}}
  .empty{text-align:center;padding:2rem 1rem;color:var(--muted);font-size:0.875rem;line-height:1.6}
  .due-soon{color:var(--danger);font-size:0.7rem;font-weight:500}
  select.form-input option{background:var(--surface);color:var(--text)}
`;

export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [data, setData] = useState({ income: [], budgets: [], transactions: [], subscriptions: [], emis: [], loans: [], credit_cards: [], investments: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null);

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      const [income, budgets, transactions, subscriptions, emis, loans, credit_cards, investments] = await Promise.all([
        sb("income", "GET", null, `?month=eq.${CUR_MONTH}&year=eq.${CUR_YEAR}&order=created_at.desc`),
        sb("budget_categories", "GET", null, `?month=eq.${CUR_MONTH}&year=eq.${CUR_YEAR}&order=created_at.desc`),
        sb("transactions", "GET", null, `?order=date.desc&limit=100`),
        sb("subscriptions", "GET", null, `?status=eq.active&order=created_at.desc`),
        sb("emis", "GET", null, `?status=eq.active&order=created_at.desc`),
        sb("loans", "GET", null, `?status=eq.active&order=created_at.desc`),
        sb("credit_cards", "GET", null, `?order=created_at.desc`),
        sb("investments", "GET", null, `?order=created_at.desc`),
      ]);
      setData({ income, budgets, transactions, subscriptions, emis, loans, credit_cards, investments });
      setError(null);
    } catch (e) {
      setError("Could not connect to database. Check your Supabase setup.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const totalIncome = data.income.reduce((s, i) => s + Number(i.amount), 0);
  const totalSubscriptions = data.subscriptions.reduce((s, i) => s + Number(i.amount), 0);
  const totalEMIs = data.emis.reduce((s, i) => s + Number(i.emi_amount), 0);
  const totalLoanEMIs = data.loans.reduce((s, i) => s + Number(i.emi_amount), 0);
  const totalCCMin = data.credit_cards.reduce((s, i) => s + Number(i.minimum_due || 0), 0);
  const totalInvestments = data.investments.reduce((s, i) => s + Number(i.monthly_contribution || 0), 0);
  const monthExpenses = data.transactions.filter(t => {
    const d = new Date(t.date);
    return t.type === "expense" && d.getMonth() + 1 === CUR_MONTH && d.getFullYear() === CUR_YEAR;
  }).reduce((s, t) => s + Number(t.amount), 0);
  const committed = totalSubscriptions + totalEMIs + totalLoanEMIs + totalCCMin + totalInvestments;
  const spendable = totalIncome - committed - monthExpenses;
  const sharedProps = { data, reload: loadAll, modal, setModal };

  if (loading) return (
    <>
      <style>{CSS}</style>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", flexDirection: "column", gap: 12 }}>
        <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
        <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>Loading your finances…</p>
      </div>
    </>
  );

  return (
    <>
      <style>{CSS}</style>
      <div className="app">
        <aside className="sidebar">
          <div className="logo"><span className="logo-dot" />Brim India</div>
          {TABS.map(t => (
            <div key={t.id} className={`nav-item${tab === t.id ? " active" : ""}`} onClick={() => setTab(t.id)}>
              <span className="nav-icon">{t.icon}</span>{t.label}
            </div>
          ))}
          <div style={{ marginTop: "auto" }}>
            {error && <div style={{ fontSize: "0.72rem", color: "var(--danger)", padding: "0.5rem 1.25rem", lineHeight: 1.4 }}>{error}</div>}
            <div style={{ fontSize: "0.72rem", color: "var(--muted)", padding: "0.25rem 1.25rem 0.5rem" }}>
              {now.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
            </div>
          </div>
        </aside>

        <main className="main">
          {error && (
            <div style={{ background: "#ffe8e0", color: "#7f1d1d", padding: "0.75rem 1rem", borderRadius: 8, marginBottom: "1rem", fontSize: "0.83rem", lineHeight: 1.5 }}>
              {error}
            </div>
          )}
          {tab === "dashboard" && <Dashboard data={data} totalIncome={totalIncome} committed={committed} spendable={spendable} monthExpenses={monthExpenses} totalInvestments={totalInvestments} />}
          {tab === "budget" && <Budget {...sharedProps} />}
          {tab === "transactions" && <Transactions {...sharedProps} />}
          {tab === "subscriptions" && <Subscriptions {...sharedProps} />}
          {tab === "loans" && <Loans {...sharedProps} />}
          {tab === "investments" && <Investments {...sharedProps} />}
          {tab === "income" && <Income {...sharedProps} />}
          {tab === "ai" && <AIAdvisor data={data} totalIncome={totalIncome} committed={committed} spendable={spendable} monthExpenses={monthExpenses} />}
        </main>

        <nav className="bottom-nav">
          {TABS.map(t => (
            <button key={t.id} className={`bn-item${tab === t.id ? " active" : ""}`} onClick={() => setTab(t.id)}>
              <span className="bn-icon">{t.icon}</span>
              <span className="bn-label">{t.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </>
  );
}

function Modal({ onClose, title, children }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <span className="modal-handle" />
        <div className="modal-title">{title}</div>
        {children}
      </div>
    </div>
  );
}

function Dashboard({ data, totalIncome, committed, spendable, monthExpenses, totalInvestments }) {
  const pct = totalIncome > 0 ? Math.min(100, Math.round((monthExpenses / totalIncome) * 100)) : 0;
  const savingsPct = totalIncome > 0 ? Math.round((totalInvestments / totalIncome) * 100) : 0;
  const today = new Date().getDate();
  const upcoming = [
    ...data.subscriptions.filter(s => s.due_day).map(s => ({ name: s.name, amount: s.amount, day: s.due_day, type: "sub" })),
    ...data.emis.filter(e => e.due_day).map(e => ({ name: e.name, amount: e.emi_amount, day: e.due_day, type: "emi" })),
    ...data.loans.filter(l => l.due_day).map(l => ({ name: l.name, amount: l.emi_amount, day: l.due_day, type: "loan" })),
  ].sort((a, b) => a.day - b.day).slice(0, 5);

  return (
    <div>
      <div className="page-title">Dashboard</div>
      <div className="card" style={{ marginBottom: "0.75rem" }}>
        <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>You can still spend this month</div>
        <div className="big-spendable" style={{ color: spendable < 0 ? "var(--danger)" : "var(--accent)" }}>{fmt(spendable)}</div>
        <div style={{ marginTop: "0.5rem", fontSize: "0.72rem", color: "var(--muted)", display: "flex", flexWrap: "wrap", gap: "6px" }}>
          <span>{fmt(totalIncome)} income</span><span>·</span>
          <span>{fmt(committed)} committed</span><span>·</span>
          <span>{fmt(monthExpenses)} spent</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${pct}%`, background: pct > 80 ? "var(--danger)" : pct > 60 ? "var(--accent2)" : "var(--accent)" }} />
        </div>
        <div style={{ fontSize: "0.68rem", color: "var(--muted)", marginTop: 4 }}>{pct}% of income spent</div>
      </div>

      <div className="grid2" style={{ marginBottom: "0.75rem" }}>
        <div className="card card-sm"><div className="metric-label">Income</div><div className="metric-val green">{fmt(totalIncome)}</div></div>
        <div className="card card-sm"><div className="metric-label">Committed</div><div className="metric-val amber">{fmt(committed)}</div></div>
        <div className="card card-sm"><div className="metric-label">Spent</div><div className={`metric-val ${spendable < 0 ? "red" : ""}`}>{fmt(monthExpenses)}</div></div>
        <div className="card card-sm">
          <div className="metric-label">Savings Rate</div>
          <div className={`metric-val ${savingsPct >= 20 ? "green" : savingsPct >= 10 ? "amber" : "red"}`}>{savingsPct}%</div>
        </div>
      </div>

      {upcoming.length > 0 && (
        <div className="card" style={{ marginBottom: "0.75rem" }}>
          <div className="section-header"><div className="section-title">Upcoming dues</div></div>
          {upcoming.map((u, i) => {
            const soon = u.day >= today && u.day <= today + EMI_DUE_WARNING_DAYS;
            return (
              <div key={i} className="list-item">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="item-name">{u.name}</div>
                  <div className="item-sub">Due {u.day}th · <span className="tag tag-blue">{u.type}</span>{soon && <span className="due-soon"> · Soon!</span>}</div>
                </div>
                <div className="item-amount" style={{ color: "var(--danger)" }}>−{fmt(u.amount)}</div>
              </div>
            );
          })}
        </div>
      )}

      <div className="card">
        <div className="section-header"><div className="section-title">Recent transactions</div></div>
        {data.transactions.length === 0 ? <div className="empty">No transactions yet</div> :
          data.transactions.slice(0, 6).map(t => (
            <div key={t.id} className="list-item">
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="item-name">{t.title}</div>
                <div className="item-sub">{t.date} · {t.category || "Uncategorized"}</div>
              </div>
              <div className="item-amount" style={{ color: t.type === "income" ? "var(--success)" : "var(--danger)" }}>
                {t.type === "income" ? "+" : "−"}{fmt(t.amount)}
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}

function Budget({ data, reload, modal, setModal }) {
  const [form, setForm] = useState({ name: "Food", limit_amount: "" });
  const categories = ["Food", "Transport", "Shopping", "Entertainment", "Health", "Utilities", "Other"];
  const save = async () => {
    await sb("budget_categories", "POST", { ...form, icon: BUDGET_ICONS[form.name] || "📦", month: CUR_MONTH, year: CUR_YEAR, limit_amount: Number(form.limit_amount) });
    setModal(null); reload();
  };
  const del = async (id) => { await sb(`budget_categories?id=eq.${id}`, "DELETE"); reload(); };
  const totalLimit = data.budgets.reduce((s, b) => s + Number(b.limit_amount), 0);
  const totalSpent = data.budgets.reduce((s, b) => s + Number(b.spent_amount || 0), 0);

  return (
    <div>
      <div className="section-header">
        <div className="page-title" style={{ marginBottom: 0 }}>Budget</div>
        <button className="btn btn-primary" onClick={() => setModal("budget")}>+ Add</button>
      </div>
      <div className="grid2" style={{ marginBottom: "0.75rem" }}>
        <div className="card card-sm"><div className="metric-label">Total Budget</div><div className="metric-val">{fmt(totalLimit)}</div></div>
        <div className="card card-sm"><div className="metric-label">Total Spent</div><div className={`metric-val ${totalSpent > totalLimit ? "red" : "green"}`}>{fmt(totalSpent)}</div></div>
      </div>
      {data.budgets.length === 0 ? <div className="card"><div className="empty">No budget categories yet.<br />Add one to get started.</div></div> :
        <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
          {data.budgets.map(b => {
            const pct = b.limit_amount > 0 ? Math.min(100, Math.round((b.spent_amount / b.limit_amount) * 100)) : 0;
            return (
              <div key={b.id} className="card card-sm">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                    <span style={{ fontSize: 20, flexShrink: 0 }}>{BUDGET_ICONS[b.name] || "📦"}</span>
                    <div style={{ minWidth: 0 }}>
                      <div className="item-name">{b.name}</div>
                      <div className="item-sub">{fmt(b.spent_amount || 0)} of {fmt(b.limit_amount)}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                    <span className={`tag ${pct >= 90 ? "tag-red" : pct >= 70 ? "tag-amber" : "tag-green"}`}>{pct}%</span>
                    <button className="btn btn-sm" style={{ color: "var(--danger)", padding: "0.25rem 0.5rem" }} onClick={() => del(b.id)}>✕</button>
                  </div>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${pct}%`, background: pct >= 90 ? "var(--danger)" : pct >= 70 ? "var(--accent2)" : "var(--accent)" }} />
                </div>
              </div>
            );
          })}
        </div>
      }
      {modal === "budget" && (
        <Modal onClose={() => setModal(null)} title="Add Budget Category">
          <div className="form-group"><label className="form-label">Category</label>
            <select className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}>
              {categories.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group"><label className="form-label">Monthly Limit (₹)</label>
            <input className="form-input" type="number" inputMode="numeric" value={form.limit_amount} onChange={e => setForm({ ...form, limit_amount: e.target.value })} placeholder="5000" />
          </div>
          <div className="form-actions">
            <button className="btn" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={save}>Save</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Transactions({ data, reload, modal, setModal }) {
  const [form, setForm] = useState({ title: "", amount: "", type: "expense", category: "", date: now.toISOString().slice(0, 10), notes: "" });
  const categories = ["Food", "Transport", "Shopping", "Entertainment", "Health", "Utilities", "Salary", "Freelance", "Other"];
  const save = async () => { await sb("transactions", "POST", { ...form, amount: Number(form.amount) }); setModal(null); reload(); };
  const del = async (id) => { await sb(`transactions?id=eq.${id}`, "DELETE"); reload(); };

  return (
    <div>
      <div className="section-header">
        <div className="page-title" style={{ marginBottom: 0 }}>Transactions</div>
        <button className="btn btn-primary" onClick={() => setModal("tx")}>+ Add</button>
      </div>
      <div className="card">
        {data.transactions.length === 0 ? <div className="empty">No transactions yet.</div> :
          data.transactions.map(t => (
            <div key={t.id} className="list-item">
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="item-name">{t.title}</div>
                <div className="item-sub">{t.date} · {t.category || "Uncategorized"}</div>
              </div>
              <div className="item-actions">
                <div className="item-amount" style={{ color: t.type === "income" ? "var(--success)" : "var(--danger)" }}>
                  {t.type === "income" ? "+" : "−"}{fmt(t.amount)}
                </div>
                <button className="btn btn-sm" style={{ color: "var(--danger)", padding: "0.25rem 0.5rem" }} onClick={() => del(t.id)}>✕</button>
              </div>
            </div>
          ))
        }
      </div>
      {modal === "tx" && (
        <Modal onClose={() => setModal(null)} title="Add Transaction">
          <div className="form-group"><label className="form-label">Title</label><input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Lunch at Zomato" /></div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Amount (₹)</label><input className="form-input" type="number" inputMode="decimal" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Type</label><select className="form-input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option value="expense">Expense</option><option value="income">Income</option></select></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Category</label><select className="form-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}><option value="">Select…</option>{categories.map(c => <option key={c}>{c}</option>)}</select></div>
            <div className="form-group"><label className="form-label">Date</label><input className="form-input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
          </div>
          <div className="form-actions">
            <button className="btn" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={save}>Save</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Subscriptions({ data, reload, modal, setModal }) {
  const [subForm, setSubForm] = useState({ name: "", amount: "", billing_cycle: "monthly", due_day: "", category: "Entertainment", status: "active" });
  const [emiForm, setEmiForm] = useState({ name: "", principal: "", emi_amount: "", interest_rate: "", tenure_months: "", paid_months: 0, start_date: now.toISOString().slice(0, 10), due_day: "" });
  const saveSub = async () => { await sb("subscriptions", "POST", { ...subForm, amount: Number(subForm.amount), due_day: Number(subForm.due_day) || null }); setModal(null); reload(); };
  const saveEmi = async () => { await sb("emis", "POST", { ...emiForm, principal: Number(emiForm.principal), emi_amount: Number(emiForm.emi_amount), interest_rate: Number(emiForm.interest_rate) || null, tenure_months: Number(emiForm.tenure_months), paid_months: Number(emiForm.paid_months), due_day: Number(emiForm.due_day) || null }); setModal(null); reload(); };
  const delSub = async (id) => { await sb(`subscriptions?id=eq.${id}`, "DELETE"); reload(); };
  const delEmi = async (id) => { await sb(`emis?id=eq.${id}`, "DELETE"); reload(); };
  const totalSubs = data.subscriptions.reduce((s, i) => s + Number(i.amount), 0);
  const totalEmis = data.emis.reduce((s, i) => s + Number(i.emi_amount), 0);

  return (
    <div>
      <div className="section-header">
        <div className="page-title" style={{ marginBottom: 0 }}>Subscriptions & EMIs</div>
        <div style={{ display: "flex", gap: 6 }}>
          <button className="btn btn-sm" onClick={() => setModal("sub")}>+ Sub</button>
          <button className="btn btn-primary btn-sm" onClick={() => setModal("emi")}>+ EMI</button>
        </div>
      </div>
      <div className="grid2" style={{ marginBottom: "0.75rem" }}>
        <div className="card card-sm"><div className="metric-label">Subscriptions</div><div className="metric-val red">{fmt(totalSubs)}/mo</div></div>
        <div className="card card-sm"><div className="metric-label">EMIs</div><div className="metric-val amber">{fmt(totalEmis)}/mo</div></div>
      </div>
      {data.subscriptions.length > 0 && (
        <div className="card" style={{ marginBottom: "0.75rem" }}>
          <div className="section-header"><div className="section-title">Subscriptions</div></div>
          {data.subscriptions.map(s => (
            <div key={s.id} className="list-item">
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="item-name">{s.name}</div>
                <div className="item-sub">{s.billing_cycle}{s.due_day ? ` · Due ${s.due_day}th` : ""}</div>
              </div>
              <div className="item-actions">
                <div className="item-amount" style={{ color: "var(--danger)" }}>−{fmt(s.amount)}</div>
                <button className="btn btn-sm" style={{ color: "var(--danger)", padding: "0.25rem 0.5rem" }} onClick={() => delSub(s.id)}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {data.emis.length > 0 && (
        <div className="card">
          <div className="section-header"><div className="section-title">EMIs</div></div>
          {data.emis.map(e => {
            const remaining = e.tenure_months - (e.paid_months || 0);
            const pct = Math.round(((e.paid_months || 0) / e.tenure_months) * 100);
            return (
              <div key={e.id} className="list-item" style={{ flexDirection: "column", alignItems: "stretch", gap: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div><div className="item-name">{e.name}</div><div className="item-sub">{remaining} months left{e.due_day ? ` · Due ${e.due_day}th` : ""}</div></div>
                  <div className="item-actions">
                    <div className="item-amount" style={{ color: "var(--danger)" }}>−{fmt(e.emi_amount)}/mo</div>
                    <button className="btn btn-sm" style={{ color: "var(--danger)", padding: "0.25rem 0.5rem" }} onClick={() => delEmi(e.id)}>✕</button>
                  </div>
                </div>
                <div className="progress-bar" style={{ marginTop: 0 }}><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
                <div style={{ fontSize: "0.68rem", color: "var(--muted)" }}>{pct}% paid off</div>
              </div>
            );
          })}
        </div>
      )}
      {data.subscriptions.length === 0 && data.emis.length === 0 && <div className="card"><div className="empty">No subscriptions or EMIs yet.</div></div>}

      {modal === "sub" && (
        <Modal onClose={() => setModal(null)} title="Add Subscription">
          <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={subForm.name} onChange={e => setSubForm({ ...subForm, name: e.target.value })} placeholder="Netflix" /></div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Amount (₹)</label><input className="form-input" type="number" inputMode="decimal" value={subForm.amount} onChange={e => setSubForm({ ...subForm, amount: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Due Day</label><input className="form-input" type="number" inputMode="numeric" min="1" max="31" value={subForm.due_day} onChange={e => setSubForm({ ...subForm, due_day: e.target.value })} placeholder="15" /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Cycle</label><select className="form-input" value={subForm.billing_cycle} onChange={e => setSubForm({ ...subForm, billing_cycle: e.target.value })}><option value="monthly">Monthly</option><option value="yearly">Yearly</option><option value="quarterly">Quarterly</option></select></div>
            <div className="form-group"><label className="form-label">Category</label><select className="form-input" value={subForm.category} onChange={e => setSubForm({ ...subForm, category: e.target.value })}><option>Entertainment</option><option>Utilities</option><option>Health</option><option>Education</option><option>Other</option></select></div>
          </div>
          <div className="form-actions"><button className="btn" onClick={() => setModal(null)}>Cancel</button><button className="btn btn-primary" onClick={saveSub}>Save</button></div>
        </Modal>
      )}
      {modal === "emi" && (
        <Modal onClose={() => setModal(null)} title="Add EMI">
          <div className="form-group"><label className="form-label">Item Name</label><input className="form-input" value={emiForm.name} onChange={e => setEmiForm({ ...emiForm, name: e.target.value })} placeholder="iPhone EMI" /></div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Principal (₹)</label><input className="form-input" type="number" inputMode="decimal" value={emiForm.principal} onChange={e => setEmiForm({ ...emiForm, principal: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">EMI/month (₹)</label><input className="form-input" type="number" inputMode="decimal" value={emiForm.emi_amount} onChange={e => setEmiForm({ ...emiForm, emi_amount: e.target.value })} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Tenure (months)</label><input className="form-input" type="number" inputMode="numeric" value={emiForm.tenure_months} onChange={e => setEmiForm({ ...emiForm, tenure_months: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Paid months</label><input className="form-input" type="number" inputMode="numeric" value={emiForm.paid_months} onChange={e => setEmiForm({ ...emiForm, paid_months: e.target.value })} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Interest (%)</label><input className="form-input" type="number" inputMode="decimal" value={emiForm.interest_rate} onChange={e => setEmiForm({ ...emiForm, interest_rate: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Due Day</label><input className="form-input" type="number" inputMode="numeric" min="1" max="31" value={emiForm.due_day} onChange={e => setEmiForm({ ...emiForm, due_day: e.target.value })} /></div>
          </div>
          <div className="form-group"><label className="form-label">Start Date</label><input className="form-input" type="date" value={emiForm.start_date} onChange={e => setEmiForm({ ...emiForm, start_date: e.target.value })} /></div>
          <div className="form-actions"><button className="btn" onClick={() => setModal(null)}>Cancel</button><button className="btn btn-primary" onClick={saveEmi}>Save</button></div>
        </Modal>
      )}
    </div>
  );
}

function Loans({ data, reload, modal, setModal }) {
  const [loanForm, setLoanForm] = useState({ name: "", type: "personal", principal: "", outstanding: "", interest_rate: "", emi_amount: "", due_day: "", start_date: now.toISOString().slice(0, 10), end_date: "" });
  const [ccForm, setCCForm] = useState({ name: "", bank: "", credit_limit: "", outstanding: "", minimum_due: "", due_date: "", billing_date: "" });
  const saveLoan = async () => { await sb("loans", "POST", { ...loanForm, principal: Number(loanForm.principal), outstanding: Number(loanForm.outstanding), interest_rate: Number(loanForm.interest_rate) || null, emi_amount: Number(loanForm.emi_amount), due_day: Number(loanForm.due_day) || null }); setModal(null); reload(); };
  const saveCC = async () => { await sb("credit_cards", "POST", { ...ccForm, credit_limit: Number(ccForm.credit_limit), outstanding: Number(ccForm.outstanding), minimum_due: Number(ccForm.minimum_due), billing_date: Number(ccForm.billing_date) || null }); setModal(null); reload(); };
  const delLoan = async (id) => { await sb(`loans?id=eq.${id}`, "DELETE"); reload(); };
  const delCC = async (id) => { await sb(`credit_cards?id=eq.${id}`, "DELETE"); reload(); };
  const totalOutstanding = data.loans.reduce((s, l) => s + Number(l.outstanding), 0);
  const totalCCOut = data.credit_cards.reduce((s, c) => s + Number(c.outstanding), 0);

  return (
    <div>
      <div className="section-header">
        <div className="page-title" style={{ marginBottom: 0 }}>Loans & Cards</div>
        <div style={{ display: "flex", gap: 6 }}>
          <button className="btn btn-sm" onClick={() => setModal("cc")}>+ Card</button>
          <button className="btn btn-primary btn-sm" onClick={() => setModal("loan")}>+ Loan</button>
        </div>
      </div>
      <div className="grid2" style={{ marginBottom: "0.75rem" }}>
        <div className="card card-sm"><div className="metric-label">Loan outstanding</div><div className="metric-val red">{fmt(totalOutstanding)}</div></div>
        <div className="card card-sm"><div className="metric-label">CC outstanding</div><div className="metric-val amber">{fmt(totalCCOut)}</div></div>
      </div>
      {data.loans.length > 0 && (
        <div className="card" style={{ marginBottom: "0.75rem" }}>
          <div className="section-header"><div className="section-title">Loans</div></div>
          {data.loans.map(l => {
            const pct = l.principal > 0 ? Math.round(((l.principal - l.outstanding) / l.principal) * 100) : 0;
            return (
              <div key={l.id} className="list-item" style={{ flexDirection: "column", alignItems: "stretch", gap: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div><div className="item-name">{l.name} <span className="tag tag-blue">{l.type}</span></div><div className="item-sub">Outstanding: {fmt(l.outstanding)} · {fmt(l.emi_amount)}/mo{l.interest_rate ? ` · ${l.interest_rate}%` : ""}</div></div>
                  <button className="btn btn-sm" style={{ color: "var(--danger)", padding: "0.25rem 0.5rem", flexShrink: 0, alignSelf: "flex-start" }} onClick={() => delLoan(l.id)}>✕</button>
                </div>
                <div className="progress-bar" style={{ marginTop: 0 }}><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
                <div style={{ fontSize: "0.68rem", color: "var(--muted)" }}>{pct}% paid off</div>
              </div>
            );
          })}
        </div>
      )}
      {data.credit_cards.length > 0 && (
        <div className="card">
          <div className="section-header"><div className="section-title">Credit Cards</div></div>
          {data.credit_cards.map(c => {
            const utilPct = c.credit_limit > 0 ? Math.round((c.outstanding / c.credit_limit) * 100) : 0;
            return (
              <div key={c.id} className="list-item" style={{ flexDirection: "column", alignItems: "stretch", gap: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div><div className="item-name">{c.name}{c.bank ? ` · ${c.bank}` : ""}</div><div className="item-sub">Outstanding: {fmt(c.outstanding)} · Min due: {fmt(c.minimum_due)}</div></div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0, alignSelf: "flex-start" }}>
                    <span className={`tag ${utilPct > 80 ? "tag-red" : utilPct > 50 ? "tag-amber" : "tag-green"}`}>{utilPct}%</span>
                    <button className="btn btn-sm" style={{ color: "var(--danger)", padding: "0.25rem 0.5rem" }} onClick={() => delCC(c.id)}>✕</button>
                  </div>
                </div>
                <div className="progress-bar" style={{ marginTop: 0 }}><div className="progress-fill" style={{ width: `${utilPct}%`, background: utilPct > 80 ? "var(--danger)" : utilPct > 50 ? "var(--accent2)" : "var(--accent)" }} /></div>
                <div style={{ fontSize: "0.68rem", color: "var(--muted)" }}>Limit: {fmt(c.credit_limit)}{c.due_date ? ` · Due: ${c.due_date}` : ""}</div>
              </div>
            );
          })}
        </div>
      )}
      {data.loans.length === 0 && data.credit_cards.length === 0 && <div className="card"><div className="empty">No loans or credit cards yet.</div></div>}

      {modal === "loan" && (
        <Modal onClose={() => setModal(null)} title="Add Loan">
          <div className="form-row">
            <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={loanForm.name} onChange={e => setLoanForm({ ...loanForm, name: e.target.value })} placeholder="Home Loan" /></div>
            <div className="form-group"><label className="form-label">Type</label><select className="form-input" value={loanForm.type} onChange={e => setLoanForm({ ...loanForm, type: e.target.value })}><option value="home">Home</option><option value="car">Car</option><option value="personal">Personal</option><option value="education">Education</option><option value="business">Business</option></select></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Principal (₹)</label><input className="form-input" type="number" inputMode="decimal" value={loanForm.principal} onChange={e => setLoanForm({ ...loanForm, principal: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Outstanding (₹)</label><input className="form-input" type="number" inputMode="decimal" value={loanForm.outstanding} onChange={e => setLoanForm({ ...loanForm, outstanding: e.target.value })} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">EMI (₹/mo)</label><input className="form-input" type="number" inputMode="decimal" value={loanForm.emi_amount} onChange={e => setLoanForm({ ...loanForm, emi_amount: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Interest (%)</label><input className="form-input" type="number" inputMode="decimal" value={loanForm.interest_rate} onChange={e => setLoanForm({ ...loanForm, interest_rate: e.target.value })} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Due Day</label><input className="form-input" type="number" inputMode="numeric" min="1" max="31" value={loanForm.due_day} onChange={e => setLoanForm({ ...loanForm, due_day: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">End Date</label><input className="form-input" type="date" value={loanForm.end_date} onChange={e => setLoanForm({ ...loanForm, end_date: e.target.value })} /></div>
          </div>
          <div className="form-actions"><button className="btn" onClick={() => setModal(null)}>Cancel</button><button className="btn btn-primary" onClick={saveLoan}>Save</button></div>
        </Modal>
      )}
      {modal === "cc" && (
        <Modal onClose={() => setModal(null)} title="Add Credit Card">
          <div className="form-row">
            <div className="form-group"><label className="form-label">Card Name</label><input className="form-input" value={ccForm.name} onChange={e => setCCForm({ ...ccForm, name: e.target.value })} placeholder="HDFC Regalia" /></div>
            <div className="form-group"><label className="form-label">Bank</label><input className="form-input" value={ccForm.bank} onChange={e => setCCForm({ ...ccForm, bank: e.target.value })} placeholder="HDFC" /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Credit Limit (₹)</label><input className="form-input" type="number" inputMode="decimal" value={ccForm.credit_limit} onChange={e => setCCForm({ ...ccForm, credit_limit: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Outstanding (₹)</label><input className="form-input" type="number" inputMode="decimal" value={ccForm.outstanding} onChange={e => setCCForm({ ...ccForm, outstanding: e.target.value })} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Minimum Due (₹)</label><input className="form-input" type="number" inputMode="decimal" value={ccForm.minimum_due} onChange={e => setCCForm({ ...ccForm, minimum_due: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Due Date</label><input className="form-input" type="date" value={ccForm.due_date} onChange={e => setCCForm({ ...ccForm, due_date: e.target.value })} /></div>
          </div>
          <div className="form-actions"><button className="btn" onClick={() => setModal(null)}>Cancel</button><button className="btn btn-primary" onClick={saveCC}>Save</button></div>
        </Modal>
      )}
    </div>
  );
}

function Investments({ data, reload, modal, setModal }) {
  const [form, setForm] = useState({ name: "", type: "SIP", invested_amount: "", current_value: "", monthly_contribution: "", start_date: now.toISOString().slice(0, 10), maturity_date: "", expected_return: "" });
  const types = ["SIP", "FD", "PPF", "NPS", "Stocks", "MF", "RD", "Gold", "Real Estate", "Other"];
  const save = async () => { await sb("investments", "POST", { ...form, invested_amount: Number(form.invested_amount), current_value: Number(form.current_value) || null, monthly_contribution: Number(form.monthly_contribution) || 0, expected_return: Number(form.expected_return) || null }); setModal(null); reload(); };
  const del = async (id) => { await sb(`investments?id=eq.${id}`, "DELETE"); reload(); };
  const totalInvested = data.investments.reduce((s, i) => s + Number(i.invested_amount), 0);
  const totalCurrent = data.investments.reduce((s, i) => s + Number(i.current_value || i.invested_amount), 0);
  const totalMonthly = data.investments.reduce((s, i) => s + Number(i.monthly_contribution || 0), 0);
  const totalGains = totalCurrent - totalInvested;

  return (
    <div>
      <div className="section-header">
        <div className="page-title" style={{ marginBottom: 0 }}>Investments</div>
        <button className="btn btn-primary" onClick={() => setModal("inv")}>+ Add</button>
      </div>
      <div className="grid2" style={{ marginBottom: "0.75rem" }}>
        <div className="card card-sm"><div className="metric-label">Invested</div><div className="metric-val">{fmt(totalInvested)}</div></div>
        <div className="card card-sm"><div className="metric-label">Current Value</div><div className="metric-val green">{fmt(totalCurrent)}</div></div>
        <div className="card card-sm"><div className="metric-label">Total Gains</div><div className={`metric-val ${totalGains >= 0 ? "green" : "red"}`}>{totalGains >= 0 ? "+" : ""}{fmt(totalGains)}</div></div>
        <div className="card card-sm"><div className="metric-label">Monthly SIP</div><div className="metric-val amber">{fmt(totalMonthly)}</div></div>
      </div>
      <div className="card">
        {data.investments.length === 0 ? <div className="empty">No investments yet.<br />Start tracking your SIPs, FDs, and more.</div> :
          data.investments.map(inv => {
            const curr = Number(inv.current_value || inv.invested_amount);
            const gains = curr - Number(inv.invested_amount);
            const gainPct = inv.invested_amount > 0 ? ((gains / inv.invested_amount) * 100).toFixed(1) : 0;
            return (
              <div key={inv.id} className="list-item">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="item-name">{inv.name} <span className="tag tag-blue">{inv.type}</span></div>
                  <div className="item-sub">Invested: {fmt(inv.invested_amount)}{inv.monthly_contribution > 0 ? ` · ${fmt(inv.monthly_contribution)}/mo` : ""}</div>
                </div>
                <div className="item-actions">
                  <div style={{ textAlign: "right" }}>
                    <div className="item-amount" style={{ color: "var(--success)" }}>{fmt(curr)}</div>
                    <div style={{ fontSize: "0.7rem", color: gains >= 0 ? "var(--success)" : "var(--danger)" }}>{gains >= 0 ? "+" : ""}{gainPct}%</div>
                  </div>
                  <button className="btn btn-sm" style={{ color: "var(--danger)", padding: "0.25rem 0.5rem" }} onClick={() => del(inv.id)}>✕</button>
                </div>
              </div>
            );
          })
        }
      </div>
      {modal === "inv" && (
        <Modal onClose={() => setModal(null)} title="Add Investment">
          <div className="form-row">
            <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Axis Bluechip SIP" /></div>
            <div className="form-group"><label className="form-label">Type</label><select className="form-input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>{types.map(t => <option key={t}>{t}</option>)}</select></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Invested (₹)</label><input className="form-input" type="number" inputMode="decimal" value={form.invested_amount} onChange={e => setForm({ ...form, invested_amount: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Current Value (₹)</label><input className="form-input" type="number" inputMode="decimal" value={form.current_value} onChange={e => setForm({ ...form, current_value: e.target.value })} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Monthly (₹)</label><input className="form-input" type="number" inputMode="decimal" value={form.monthly_contribution} onChange={e => setForm({ ...form, monthly_contribution: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Expected return (%)</label><input className="form-input" type="number" inputMode="decimal" value={form.expected_return} onChange={e => setForm({ ...form, expected_return: e.target.value })} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Start Date</label><input className="form-input" type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Maturity Date</label><input className="form-input" type="date" value={form.maturity_date} onChange={e => setForm({ ...form, maturity_date: e.target.value })} /></div>
          </div>
          <div className="form-actions"><button className="btn" onClick={() => setModal(null)}>Cancel</button><button className="btn btn-primary" onClick={save}>Save</button></div>
        </Modal>
      )}
    </div>
  );
}

function Income({ data, reload, modal, setModal }) {
  const [form, setForm] = useState({ name: "", amount: "", type: "salary" });
  const types = ["salary", "freelance", "business", "rental", "investment", "other"];
  const totalIncome = data.income.reduce((s, i) => s + Number(i.amount), 0);
  const save = async () => { await sb("income", "POST", { ...form, amount: Number(form.amount), month: CUR_MONTH, year: CUR_YEAR }); setModal(null); reload(); };
  const del = async (id) => { await sb(`income?id=eq.${id}`, "DELETE"); reload(); };

  return (
    <div>
      <div className="section-header">
        <div className="page-title" style={{ marginBottom: 0 }}>Income</div>
        <button className="btn btn-primary" onClick={() => setModal("income")}>+ Add</button>
      </div>
      <div className="card card-sm" style={{ marginBottom: "0.75rem", display: "inline-flex", flexDirection: "column" }}>
        <div className="metric-label">Total this month</div>
        <div className="metric-val green">{fmt(totalIncome)}</div>
      </div>
      <div className="card">
        {data.income.length === 0 ? <div className="empty">No income sources for this month.</div> :
          data.income.map(i => (
            <div key={i.id} className="list-item">
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="item-name">{i.name}</div>
                <div className="item-sub"><span className="tag tag-green">{i.type}</span></div>
              </div>
              <div className="item-actions">
                <div className="item-amount" style={{ color: "var(--success)" }}>+{fmt(i.amount)}</div>
                <button className="btn btn-sm" style={{ color: "var(--danger)", padding: "0.25rem 0.5rem" }} onClick={() => del(i.id)}>✕</button>
              </div>
            </div>
          ))
        }
      </div>
      {modal === "income" && (
        <Modal onClose={() => setModal(null)} title="Add Income Source">
          <div className="form-group"><label className="form-label">Source Name</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Monthly Salary" /></div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Amount (₹)</label><input className="form-input" type="number" inputMode="decimal" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Type</label><select className="form-input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>{types.map(t => <option key={t}>{t}</option>)}</select></div>
          </div>
          <div className="form-actions"><button className="btn" onClick={() => setModal(null)}>Cancel</button><button className="btn btn-primary" onClick={save}>Save</button></div>
        </Modal>
      )}
    </div>
  );
}

function AIAdvisor({ data, totalIncome, committed, spendable, monthExpenses }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [insightLoading, setInsightLoading] = useState(false);
  const [insight, setInsight] = useState(null);
  const bottomRef = useRef(null);

  const buildContext = () => {
    const totalSubs = data.subscriptions.reduce((s, i) => s + Number(i.amount), 0);
    const totalEMIs = data.emis.reduce((s, i) => s + Number(i.emi_amount), 0);
    const totalLoans = data.loans.reduce((s, l) => s + Number(l.emi_amount), 0);
    const totalCC = data.credit_cards.reduce((s, c) => s + Number(c.minimum_due || 0), 0);
    const totalInv = data.investments.reduce((s, i) => s + Number(i.monthly_contribution || 0), 0);
    const totalInvested = data.investments.reduce((s, i) => s + Number(i.invested_amount), 0);
    const totalCCOut = data.credit_cards.reduce((s, c) => s + Number(c.outstanding), 0);
    const totalLoanOut = data.loans.reduce((s, l) => s + Number(l.outstanding), 0);
    return `Monthly Income: ₹${totalIncome} | Expenses: ₹${monthExpenses} | Committed: ₹${committed} (subs ₹${totalSubs} + EMIs ₹${totalEMIs} + loans ₹${totalLoans} + CC ₹${totalCC} + invest ₹${totalInv}) | Spendable: ₹${spendable} | Savings rate: ${totalIncome > 0 ? Math.round((totalInv / totalIncome) * 100) : 0}% | Total invested: ₹${totalInvested} | Loan outstanding: ₹${totalLoanOut} | CC outstanding: ₹${totalCCOut}
Subscriptions: ${data.subscriptions.map(s => `${s.name} ₹${s.amount}/mo`).join(", ") || "none"}
EMIs: ${data.emis.map(e => `${e.name} ₹${e.emi_amount}/mo ${e.tenure_months - (e.paid_months || 0)}mo left`).join(", ") || "none"}
Loans: ${data.loans.map(l => `${l.name} ₹${l.outstanding} @ ${l.interest_rate || "?"}%`).join(", ") || "none"}
Investments: ${data.investments.map(i => `${i.name}(${i.type}) ₹${i.invested_amount}`).join(", ") || "none"}
Budget: ${data.budgets.map(b => `${b.name} ₹${b.spent_amount || 0}/₹${b.limit_amount}`).join(", ") || "none"}`;
  };

  const getInsights = async () => {
    setInsightLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: "You are a sharp, empathetic Indian personal finance advisor. Give 3-4 specific, actionable bullet insights starting with an emoji. Focus on what's wrong, what's at risk, and the single most impactful change. 2-3 sentences each. Use ₹.",
          messages: [{ role: "user", content: `Analyse my finances:\n${buildContext()}` }]
        })
      });
      const d = await res.json();
      setInsight(d.content?.[0]?.text || "Could not generate insights.");
    } catch { setInsight("Failed to load insights. Check API connection."); }
    setInsightLoading(false);
  };

  const sendMsg = async () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput("");
    const newMessages = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);
    setLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: `You are a friendly Indian personal finance advisor. Use ₹. Be specific and concise.\n\n${buildContext()}`,
          messages: newMessages.map(m => ({ role: m.role, content: m.content }))
        })
      });
      const d = await res.json();
      setMessages(m => [...m, { role: "assistant", content: d.content?.[0]?.text || "Sorry, couldn't respond." }]);
    } catch {
      setMessages(m => [...m, { role: "assistant", content: "Error reaching AI. Please try again." }]);
    }
    setLoading(false);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  return (
    <div>
      <div className="page-title">AI Advisor</div>
      {!insight ? (
        <div className="card" style={{ marginBottom: "0.75rem", textAlign: "center", padding: "1.5rem 1rem" }}>
          <div style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>✦</div>
          <div style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: "1rem", lineHeight: 1.5 }}>Get a personalised analysis based on your real data.</div>
          <button className="btn btn-primary" onClick={getInsights} disabled={insightLoading}>
            {insightLoading ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Analysing…</> : "✦ Analyse My Finances"}
          </button>
        </div>
      ) : (
        <div className="card" style={{ marginBottom: "0.75rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <div style={{ fontWeight: 600, fontSize: "0.88rem" }}>✦ Financial Insights</div>
            <button className="btn btn-sm" onClick={getInsights} disabled={insightLoading}>
              {insightLoading ? <span className="spinner" style={{ width: 12, height: 12 }} /> : "Refresh"}
            </button>
          </div>
          <div style={{ fontSize: "0.875rem", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{insight}</div>
        </div>
      )}
      <div className="chat-wrap">
        <div className="chat-messages">
          {messages.length === 0 && (
            <div style={{ textAlign: "center", padding: "1.5rem 0.5rem", color: "var(--muted)", fontSize: "0.83rem", lineHeight: 1.6 }}>
              Ask me anything about your finances.<br />
              <span style={{ fontSize: "0.75rem" }}>"How can I reduce EMI burden?" · "Should I prepay my loan?"</span>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`chat-msg ${m.role === "user" ? "user" : "ai"}`} style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>
          ))}
          {loading && <div className="chat-msg ai"><span className="spinner" /></div>}
          <div ref={bottomRef} />
        </div>
        <div className="chat-input-row">
          <input className="chat-input" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMsg()} placeholder="Ask your AI advisor…" />
          <button className="btn btn-primary" onClick={sendMsg} disabled={loading || !input.trim()}>Send</button>
        </div>
      </div>
    </div>
  );
}
