import { useState, useEffect, useCallback } from "react";

const SUPABASE_URL = "https://dfamerkhelwopkqvgmle.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmYW1lcmtoZWx3b3BrcXZnbWxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwNjcyODksImV4cCI6MjA5NDY0MzI4OX0.vkbDzKbIdBBzcnRJVn639032MckArlIFCWG4Oju7T3M";
const WP_SITE = "YOUR_WORDPRESS_SITE";
const WP_USER = "YOUR_WP_USERNAME";
const WP_APP_PASSWORD = "YOUR_WP_APP_PASSWORD";

const i18n = {
  zh: {
    siteTitle: "内容中心", siteDesc: "温度记录仪 · 招投标内容管理",
    addContent: "新建内容", tabContents: "内容库", tabLeads: "招标线索",
    filterAll: "全部", filterPending: "待审核", filterApproved: "已通过", filterRejected: "已拒绝",
    statusPending: "待审核", statusApproved: "已通过", statusRejected: "已拒绝",
    typeBlog: "Blog", typeWechat: "公众号",
    langAll: "全部", langZh: "中文", langEn: "EN", langBi: "双语",
    loading: "加载中...", noContent: "暂无内容", noContentHint: "点击上方「新建内容」开始",
    noLeads: "暂无线索",
    addTitle: "新建内容", phTitle: "输入文章标题", phBody: "输入正文内容，支持 Markdown 格式",
    phTags: "标签，逗号分隔", submit: "发布到审核", cancel: "取消",
    contentLang: "语言", contentType: "类型",
    detailTitle: "内容预览", copyBody: "复制正文", reviewNote: "审核备注", phNote: "可选，输入备注...",
    approveWP: "通过并发布 WP", approve: "审核通过", reject: "驳回", publishing: "发布中...",
    buyer: "采购方", region: "地区", budget: "预算", deadline: "截止", wan: "万",
    toastAdded: "已提交审核", toastApproved: "已通过", toastApprovedWP: "已通过并发布到 WordPress",
    toastRejected: "已驳回", toastCopied: "已复制", toastTitleBodyReq: "标题和正文不能为空",
    toastLoadFail: "加载失败", toastLeadFail: "加载线索失败", toastAddFail: "提交失败", toastOpFail: "操作失败",
    statusLabel: "状态", langLabel: "语言",
  },
  en: {
    siteTitle: "Content Hub", siteDesc: "Temperature Logger · Bid Content Management",
    addContent: "New Content", tabContents: "Library", tabLeads: "Leads",
    filterAll: "All", filterPending: "Pending", filterApproved: "Approved", filterRejected: "Rejected",
    statusPending: "Pending", statusApproved: "Approved", statusRejected: "Rejected",
    typeBlog: "Blog", typeWechat: "WeChat",
    langAll: "All", langZh: "中文", langEn: "EN", langBi: "Bilingual",
    loading: "Loading...", noContent: "No content yet", noContentHint: "Click \"New Content\" to start",
    noLeads: "No leads yet",
    addTitle: "New Content", phTitle: "Enter article title", phBody: "Enter body content, Markdown supported",
    phTags: "Tags, comma separated", submit: "Submit for Review", cancel: "Cancel",
    contentLang: "Language", contentType: "Type",
    detailTitle: "Preview", copyBody: "Copy Body", reviewNote: "Review Note", phNote: "Optional note...",
    approveWP: "Approve & Publish WP", approve: "Approve", reject: "Reject", publishing: "Publishing...",
    buyer: "Buyer", region: "Region", budget: "Budget", deadline: "Deadline", wan: "0k",
    toastAdded: "Submitted for review", toastApproved: "Approved", toastApprovedWP: "Approved & published to WordPress",
    toastRejected: "Rejected", toastCopied: "Copied", toastTitleBodyReq: "Title and body required",
    toastLoadFail: "Load failed", toastLeadFail: "Failed to load leads", toastAddFail: "Submit failed", toastOpFail: "Failed",
    statusLabel: "Status", langLabel: "Language",
  },
};

async function supaFetch(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options, headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json",
      Prefer: options.method === "PATCH" ? "return=representation" : "return=minimal", ...options.headers },
  });
  if (!res.ok) throw new Error(`${res.status}`);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function publishToWordPress(title, body) {
  if (WP_SITE === "YOUR_WORDPRESS_SITE") return null;
  const res = await fetch(`${WP_SITE}/wp-json/wp/v2/posts`, {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: "Basic " + btoa(`${WP_USER}:${WP_APP_PASSWORD}`) },
    body: JSON.stringify({ title, content: body, status: "publish" }),
  });
  if (!res.ok) throw new Error("WP failed");
  return await res.json();
}

export default function App() {
  const [lang, setLang] = useState("zh");
  const t = i18n[lang];

  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [langFilter, setLangFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [reviewNote, setReviewNote] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [toast, setToast] = useState(null);
  const [tab, setTab] = useState("contents");
  const [leads, setLeads] = useState([]);
  const [addMode, setAddMode] = useState(false);
  const [newContent, setNewContent] = useState({ content_type: "blog", title: "", body: "", summary: "", tags: "", lang: "zh" });

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 2500); };

  const fetchContents = useCallback(async () => {
    setLoading(true);
    try {
      let path = "contents?select=*,bid_leads(title,buyer,region)&order=created_at.desc";
      if (filter !== "all") path += `&review_status=eq.${filter}`;
      if (langFilter !== "all") path += `&lang=eq.${langFilter}`;
      setContents((await supaFetch(path)) || []);
    } catch (e) { showToast(t.toastLoadFail, "error"); }
    setLoading(false);
  }, [filter, langFilter]);

  const fetchLeads = useCallback(async () => {
    try { setLeads((await supaFetch("bid_leads?order=created_at.desc&limit=50")) || []); }
    catch { showToast(t.toastLeadFail, "error"); }
  }, []);

  useEffect(() => { fetchContents(); }, [fetchContents]);
  useEffect(() => { if (tab === "leads") fetchLeads(); }, [tab, fetchLeads]);

  const handleApprove = async (item) => {
    setPublishing(true);
    try {
      let wpId = null;
      if (item.content_type === "blog") { const r = await publishToWordPress(item.title, item.body); if (r) wpId = String(r.id); }
      await supaFetch(`contents?id=eq.${item.id}`, { method: "PATCH", body: JSON.stringify({ review_status: "approved", reviewer_note: reviewNote || null, wp_post_id: wpId, published_at: new Date().toISOString(), updated_at: new Date().toISOString() }) });
      showToast(wpId ? t.toastApprovedWP : t.toastApproved);
      setSelected(null); setReviewNote(""); fetchContents();
    } catch (e) { showToast(t.toastOpFail, "error"); }
    setPublishing(false);
  };

  const handleReject = async (item) => {
    try {
      await supaFetch(`contents?id=eq.${item.id}`, { method: "PATCH", body: JSON.stringify({ review_status: "rejected", reviewer_note: reviewNote || null, updated_at: new Date().toISOString() }) });
      showToast(t.toastRejected); setSelected(null); setReviewNote(""); fetchContents();
    } catch (e) { showToast(t.toastOpFail, "error"); }
  };

  const handleAddContent = async () => {
    if (!newContent.title || !newContent.body) { showToast(t.toastTitleBodyReq, "error"); return; }
    try {
      await supaFetch("contents", { method: "POST", body: JSON.stringify({ ...newContent, review_status: "pending" }) });
      showToast(t.toastAdded); setAddMode(false); setNewContent({ content_type: "blog", title: "", body: "", summary: "", tags: "", lang: "zh" }); fetchContents();
    } catch (e) { showToast(t.toastAddFail, "error"); }
  };

  const copyToClipboard = (txt) => { navigator.clipboard.writeText(txt).then(() => showToast(t.toastCopied)); };
  const fmtDate = (d) => { const dt = new Date(d); return `${dt.getMonth()+1}/${dt.getDate()}`; };

  const statusStyle = { pending: { bg: "#FFF8EB", color: "#A16207", dot: "#FACC15" }, approved: { bg: "#ECFDF5", color: "#047857", dot: "#34D399" }, rejected: { bg: "#FEF2F2", color: "#B91C1C", dot: "#F87171" } };
  const langStyle = { zh: { label: "中", bg: "#FEF3C7", color: "#92400E" }, en: { label: "EN", bg: "#DBEAFE", color: "#1E40AF" }, bi: { label: "BI", bg: "#EDE9FE", color: "#5B21B6" } };

  const pendingCount = contents.filter(c => c.review_status === "pending").length;
  const approvedCount = contents.filter(c => c.review_status === "approved").length;

  return (
    <div style={{ minHeight: "100vh", background: "#F8F7F4" }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Noto+Sans+SC:wght@300;400;500;600&display=swap" rel="stylesheet" />

      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; }
        @keyframes toast-in { from { transform: translateY(-12px) scale(0.95); opacity: 0 } to { transform: translateY(0) scale(1); opacity: 1 } }
        @keyframes fade-up { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes slide-in { from { transform: translateX(100%) } to { transform: translateX(0) } }
        @keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: .6 } }
        .item { transition: all 0.15s ease; border: 1.5px solid transparent; }
        .item:hover { border-color: #D6D3C8; transform: translateY(-1px); box-shadow: 0 4px 20px rgba(0,0,0,0.04); }
        .btn { transition: all 0.15s ease; }
        .btn:hover { transform: translateY(-1px); box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
        .btn:active { transform: translateY(0); }
        textarea:focus, input:focus { outline: none; border-color: #A3A096 !important; }
        .chip { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; border-radius: 100px; font-size: 11px; font-weight: 500; letter-spacing: 0.02em; white-space: nowrap; }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)", zIndex: 999, animation: "toast-in 0.25s ease" }}>
          <div style={{ padding: "10px 20px", borderRadius: 100, fontSize: 13, fontWeight: 500, fontFamily: "'Outfit', 'Noto Sans SC', sans-serif",
            background: toast.type === "error" ? "#1C1917" : "#1C1917", color: "#fff",
            boxShadow: "0 8px 32px rgba(0,0,0,0.16)", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: toast.type === "error" ? "#F87171" : "#34D399" }} />
            {toast.msg}
          </div>
        </div>
      )}

      {/* Sidebar + Main layout */}
      <div style={{ display: "flex", minHeight: "100vh" }}>

        {/* Sidebar */}
        <nav style={{ width: 220, background: "#1C1917", color: "#fff", padding: "28px 0", display: "flex", flexDirection: "column", flexShrink: 0 }}>
          {/* Logo */}
          <div style={{ padding: "0 24px", marginBottom: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #34D399, #059669)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, fontFamily: "'Outfit'" }}>T</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, fontFamily: "'Outfit', sans-serif", letterSpacing: -0.3 }}>{t.siteTitle}</div>
                <div style={{ fontSize: 10, color: "#A8A29E", fontFamily: "'Outfit', 'Noto Sans SC'", letterSpacing: 0.3 }}>{t.siteDesc}</div>
              </div>
            </div>
          </div>

          {/* Nav items */}
          <div style={{ flex: 1 }}>
            {[{ key: "contents", label: t.tabContents, icon: "M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2" },
              { key: "leads", label: t.tabLeads, icon: "M13 10V3L4 14h7v7l9-11h-7z" }].map((n) => (
              <button key={n.key} onClick={() => setTab(n.key)} style={{
                width: "100%", padding: "10px 24px", border: "none", background: tab === n.key ? "rgba(255,255,255,0.08)" : "transparent",
                color: tab === n.key ? "#fff" : "#A8A29E", fontSize: 13, fontWeight: 500, fontFamily: "'Outfit', 'Noto Sans SC', sans-serif",
                cursor: "pointer", display: "flex", alignItems: "center", gap: 10, textAlign: "left",
                borderLeft: tab === n.key ? "2px solid #34D399" : "2px solid transparent",
              }}>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d={n.icon}/></svg>
                {n.label}
              </button>
            ))}
          </div>

          {/* Language switch at bottom */}
          <div style={{ padding: "0 24px" }}>
            <div style={{ display: "flex", background: "rgba(255,255,255,0.06)", borderRadius: 8, padding: 3 }}>
              {["zh", "en"].map((l) => (
                <button key={l} onClick={() => setLang(l)} style={{
                  flex: 1, padding: "6px 0", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: "pointer",
                  fontFamily: "'Outfit', sans-serif",
                  background: lang === l ? "rgba(255,255,255,0.12)" : "transparent",
                  color: lang === l ? "#fff" : "#78716C",
                }}>{l === "zh" ? "中文" : "English"}</button>
              ))}
            </div>
          </div>
        </nav>

        {/* Main content */}
        <main style={{ flex: 1, padding: "28px 36px", fontFamily: "'Outfit', 'Noto Sans SC', sans-serif", overflow: "auto" }}>

          {/* Top bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: "#1C1917", letterSpacing: -0.5, fontFamily: "'Outfit', 'Noto Sans SC'" }}>{tab === "contents" ? t.tabContents : t.tabLeads}</h1>
              {tab === "contents" && <p style={{ margin: "4px 0 0", fontSize: 13, color: "#A8A29E" }}>
                {pendingCount > 0 ? `${pendingCount} ${t.filterPending}` : ""}{pendingCount > 0 && approvedCount > 0 ? " · " : ""}{approvedCount > 0 ? `${approvedCount} ${t.filterApproved}` : ""}
              </p>}
            </div>
            {tab === "contents" && (
              <button className="btn" onClick={() => setAddMode(true)} style={{
                padding: "9px 20px", borderRadius: 10, border: "none", cursor: "pointer",
                background: "#1C1917", color: "#fff", fontSize: 13, fontWeight: 500, fontFamily: "'Outfit', 'Noto Sans SC'",
                display: "flex", alignItems: "center", gap: 6,
              }}>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
                {t.addContent}
              </button>
            )}
          </div>

          {/* Filters */}
          {tab === "contents" && (
            <div style={{ display: "flex", gap: 20, marginBottom: 24, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 11, color: "#A8A29E", fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5 }}>{t.statusLabel}</span>
                <div style={{ display: "flex", background: "#ECEAE3", borderRadius: 8, padding: 2 }}>
                  {[{ key: "all", label: t.filterAll }, { key: "pending", label: t.filterPending }, { key: "approved", label: t.filterApproved }, { key: "rejected", label: t.filterRejected }].map((f) => (
                    <button key={f.key} onClick={() => setFilter(f.key)} style={{
                      padding: "5px 12px", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: "pointer",
                      fontFamily: "'Outfit', 'Noto Sans SC'",
                      background: filter === f.key ? "#fff" : "transparent",
                      color: filter === f.key ? "#1C1917" : "#78716C",
                      boxShadow: filter === f.key ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
                    }}>{f.label}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 11, color: "#A8A29E", fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5 }}>{t.langLabel}</span>
                <div style={{ display: "flex", background: "#ECEAE3", borderRadius: 8, padding: 2 }}>
                  {[{ key: "all", label: t.langAll }, { key: "zh", label: t.langZh }, { key: "en", label: t.langEn }, { key: "bi", label: t.langBi }].map((f) => (
                    <button key={f.key} onClick={() => setLangFilter(f.key)} style={{
                      padding: "5px 12px", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: "pointer",
                      fontFamily: "'Outfit', 'Noto Sans SC'",
                      background: langFilter === f.key ? "#fff" : "transparent",
                      color: langFilter === f.key ? "#1C1917" : "#78716C",
                      boxShadow: langFilter === f.key ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
                    }}>{f.label}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Add content panel */}
          {addMode && (
            <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
              onClick={(e) => { if (e.target === e.currentTarget) setAddMode(false); }}>
              <div style={{ width: 560, maxWidth: "92vw", maxHeight: "88vh", overflow: "auto", background: "#fff", borderRadius: 16, padding: 32, animation: "fade-up 0.25s ease", boxShadow: "0 24px 64px rgba(0,0,0,0.12)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, fontFamily: "'Outfit', 'Noto Sans SC'" }}>{t.addTitle}</h2>
                  <button onClick={() => setAddMode(false)} style={{ border: "none", background: "#F5F4F0", width: 32, height: 32, borderRadius: 8, cursor: "pointer", fontSize: 16, color: "#78716C", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                </div>

                {/* Type + Lang row */}
                <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#A8A29E", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 6 }}>{t.contentType}</label>
                    <div style={{ display: "flex", gap: 6 }}>
                      {[{ k: "blog", l: t.typeBlog }, { k: "wechat", l: t.typeWechat }].map((tp) => (
                        <button key={tp.k} onClick={() => setNewContent({ ...newContent, content_type: tp.k })} className="btn" style={{
                          padding: "7px 16px", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer",
                          fontFamily: "'Outfit', 'Noto Sans SC'",
                          border: newContent.content_type === tp.k ? "1.5px solid #1C1917" : "1.5px solid #E7E5E4",
                          background: newContent.content_type === tp.k ? "#1C1917" : "#fff",
                          color: newContent.content_type === tp.k ? "#fff" : "#57534E",
                        }}>{tp.l}</button>
                      ))}
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#A8A29E", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 6 }}>{t.contentLang}</label>
                    <div style={{ display: "flex", gap: 6 }}>
                      {[{ k: "zh", l: "中文", bg: "#FEF3C7", c: "#92400E", bc: "#F59E0B" }, { k: "en", l: "EN", bg: "#DBEAFE", c: "#1E40AF", bc: "#3B82F6" }, { k: "bi", l: lang === "zh" ? "双语" : "BI", bg: "#EDE9FE", c: "#5B21B6", bc: "#8B5CF6" }].map((l) => (
                        <button key={l.k} onClick={() => setNewContent({ ...newContent, lang: l.k })} className="btn" style={{
                          padding: "7px 16px", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer",
                          fontFamily: "'Outfit', 'Noto Sans SC'",
                          border: newContent.lang === l.k ? `1.5px solid ${l.bc}` : "1.5px solid #E7E5E4",
                          background: newContent.lang === l.k ? l.bg : "#fff",
                          color: newContent.lang === l.k ? l.c : "#57534E",
                        }}>{l.l}</button>
                      ))}
                    </div>
                  </div>
                </div>

                <input placeholder={t.phTitle} value={newContent.title} onChange={(e) => setNewContent({ ...newContent, title: e.target.value })}
                  style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "1.5px solid #E7E5E4", fontSize: 15, fontWeight: 500, marginBottom: 12, fontFamily: "'Outfit', 'Noto Sans SC'", color: "#1C1917" }} />
                <textarea placeholder={t.phBody} value={newContent.body} onChange={(e) => setNewContent({ ...newContent, body: e.target.value })} rows={10}
                  style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "1.5px solid #E7E5E4", fontSize: 14, marginBottom: 12, resize: "vertical", fontFamily: "'Outfit', 'Noto Sans SC'", lineHeight: 1.7, color: "#1C1917" }} />
                <input placeholder={t.phTags} value={newContent.tags} onChange={(e) => setNewContent({ ...newContent, tags: e.target.value })}
                  style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "1.5px solid #E7E5E4", fontSize: 13, marginBottom: 20, fontFamily: "'Outfit', 'Noto Sans SC'", color: "#57534E" }} />

                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                  <button onClick={() => setAddMode(false)} className="btn" style={{ padding: "9px 20px", borderRadius: 10, border: "1.5px solid #E7E5E4", background: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "'Outfit', 'Noto Sans SC'", color: "#57534E" }}>{t.cancel}</button>
                  <button onClick={handleAddContent} className="btn" style={{ padding: "9px 24px", borderRadius: 10, border: "none", background: "#1C1917", color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "'Outfit', 'Noto Sans SC'" }}>{t.submit}</button>
                </div>
              </div>
            </div>
          )}

          {/* Content list */}
          {tab === "contents" && (
            loading ? <div style={{ textAlign: "center", padding: 60, color: "#A8A29E", fontSize: 14 }}><div style={{ animation: "pulse 1.5s ease infinite" }}>{t.loading}</div></div>
            : contents.length === 0 ? <div style={{ textAlign: "center", padding: "80px 20px" }}><div style={{ fontSize: 40, marginBottom: 12 }}>📭</div><p style={{ fontSize: 15, color: "#78716C", margin: "0 0 4px", fontWeight: 500 }}>{t.noContent}</p><p style={{ fontSize: 13, color: "#A8A29E" }}>{t.noContentHint}</p></div>
            : <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {contents.map((item, i) => {
                  const st = statusStyle[item.review_status] || statusStyle.pending;
                  const cl = langStyle[item.lang] || langStyle.zh;
                  return (
                    <div key={item.id} className="item" onClick={() => { setSelected(item); setReviewNote(item.reviewer_note || ""); }}
                      style={{ background: "#fff", borderRadius: 12, padding: "14px 20px", cursor: "pointer", animation: `fade-up 0.3s ease ${i * 0.04}s both` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                            <span className="chip" style={{ background: st.bg, color: st.color }}>
                              <span style={{ width: 5, height: 5, borderRadius: "50%", background: st.dot }} />
                              {(statusStyle.pending === st ? t.statusPending : statusStyle.approved === st ? t.statusApproved : t.statusRejected)}
                            </span>
                            <span className="chip" style={{ background: "#F5F4F0", color: "#57534E" }}>
                              {item.content_type === "blog" ? t.typeBlog : t.typeWechat}
                            </span>
                            <span className="chip" style={{ background: cl.bg, color: cl.color }}>{cl.label}</span>
                            {item.wp_post_id && <span className="chip" style={{ background: "#DBEAFE", color: "#1E40AF" }}>WP</span>}
                          </div>
                          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 500, color: "#1C1917", fontFamily: "'Outfit', 'Noto Sans SC'", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</h3>
                          {item.bid_leads && <p style={{ margin: "4px 0 0", fontSize: 12, color: "#A8A29E" }}>{item.bid_leads.buyer} · {item.bid_leads.region}</p>}
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 16 }}>
                          <span style={{ fontSize: 12, color: "#D6D3D1", fontWeight: 500, fontFamily: "'Outfit'" }}>{fmtDate(item.created_at)}</span>
                        </div>
                      </div>
                      {item.tags && <div style={{ display: "flex", gap: 4, marginTop: 8, flexWrap: "wrap" }}>{item.tags.split(",").map((tag) => <span key={tag} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 100, background: "#F5F4F0", color: "#78716C", fontWeight: 500 }}>{tag.trim()}</span>)}</div>}
                    </div>
                  );
                })}
              </div>
          )}

          {/* Leads */}
          {tab === "leads" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {leads.length === 0 ? <div style={{ textAlign: "center", padding: "80px 20px" }}><div style={{ fontSize: 40, marginBottom: 12 }}>📋</div><p style={{ fontSize: 15, color: "#78716C", fontWeight: 500 }}>{t.noLeads}</p></div>
              : leads.map((lead, i) => (
                <div key={lead.id} className="item" style={{ background: "#fff", borderRadius: 12, padding: "14px 20px", animation: `fade-up 0.3s ease ${i * 0.04}s both` }}>
                  <h3 style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 500, color: "#1C1917", fontFamily: "'Outfit', 'Noto Sans SC'" }}>{lead.title}</h3>
                  <div style={{ display: "flex", gap: 12, fontSize: 12, color: "#A8A29E", flexWrap: "wrap" }}>
                    {lead.buyer && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ color: "#D6D3D1" }}>●</span> {t.buyer}: {lead.buyer}</span>}
                    {lead.region && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ color: "#D6D3D1" }}>●</span> {t.region}: {lead.region}</span>}
                    {lead.budget && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ color: "#D6D3D1" }}>●</span> {t.budget}: {lead.budget}{t.wan}</span>}
                    {lead.deadline && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ color: "#D6D3D1" }}>●</span> {t.deadline}: {lead.deadline}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Detail slide panel */}
      {selected && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", justifyContent: "flex-end" }}>
          <div style={{ flex: 1, background: "rgba(0,0,0,0.3)", backdropFilter: "blur(2px)" }} onClick={() => { setSelected(null); setReviewNote(""); }} />
          <div style={{ width: 520, maxWidth: "92vw", background: "#fff", overflowY: "auto", padding: 32, animation: "slide-in 0.25s ease", boxShadow: "-8px 0 32px rgba(0,0,0,0.08)", fontFamily: "'Outfit', 'Noto Sans SC', sans-serif" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: "#1C1917" }}>{t.detailTitle}</h2>
              <button onClick={() => { setSelected(null); setReviewNote(""); }} style={{ border: "none", background: "#F5F4F0", width: 32, height: 32, borderRadius: 8, cursor: "pointer", fontSize: 16, color: "#78716C", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>

            <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
              {(() => { const st = statusStyle[selected.review_status] || statusStyle.pending; return <span className="chip" style={{ background: st.bg, color: st.color }}><span style={{ width: 5, height: 5, borderRadius: "50%", background: st.dot }} />{statusStyle.pending === st ? t.statusPending : statusStyle.approved === st ? t.statusApproved : t.statusRejected}</span>; })()}
              <span className="chip" style={{ background: "#F5F4F0", color: "#57534E" }}>{selected.content_type === "blog" ? t.typeBlog : t.typeWechat}</span>
              {(() => { const cl = langStyle[selected.lang] || langStyle.zh; return <span className="chip" style={{ background: cl.bg, color: cl.color }}>{cl.label}</span>; })()}
            </div>

            <h3 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 600, lineHeight: 1.5, color: "#1C1917" }}>{selected.title}</h3>

            {selected.content_type === "wechat" && (
              <button onClick={() => copyToClipboard(selected.body)} className="btn" style={{ padding: "7px 14px", borderRadius: 8, border: "1.5px solid #E7E5E4", background: "#fff", fontSize: 12, fontWeight: 500, cursor: "pointer", marginBottom: 16, display: "flex", alignItems: "center", gap: 6, fontFamily: "'Outfit', 'Noto Sans SC'", color: "#57534E" }}>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                {t.copyBody}
              </button>
            )}

            <div style={{ background: "#FAFAF8", borderRadius: 12, border: "1px solid #ECEAE3", padding: "20px 24px", marginBottom: 24, fontSize: 14, lineHeight: 1.9, color: "#44403C", whiteSpace: "pre-wrap", fontFamily: "'Noto Sans SC', 'Outfit', sans-serif" }}>
              {selected.body}
            </div>

            {selected.review_status === "pending" && (
              <div style={{ borderTop: "1px solid #F5F4F0", paddingTop: 20 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#A8A29E", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 8 }}>{t.reviewNote}</label>
                <textarea value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} placeholder={t.phNote} rows={3}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #E7E5E4", fontSize: 13, marginBottom: 16, resize: "vertical", fontFamily: "'Outfit', 'Noto Sans SC'", color: "#44403C", lineHeight: 1.6 }} />
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => handleApprove(selected)} disabled={publishing} className="btn" style={{
                    padding: "10px 20px", borderRadius: 10, border: "none", background: "#059669", color: "#fff",
                    fontSize: 13, fontWeight: 500, cursor: publishing ? "wait" : "pointer", opacity: publishing ? 0.7 : 1,
                    fontFamily: "'Outfit', 'Noto Sans SC'",
                  }}>{publishing ? t.publishing : selected.content_type === "blog" ? t.approveWP : t.approve}</button>
                  <button onClick={() => handleReject(selected)} className="btn" style={{
                    padding: "10px 20px", borderRadius: 10, border: "1.5px solid #FECACA", background: "#FEF2F2",
                    color: "#B91C1C", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "'Outfit', 'Noto Sans SC'",
                  }}>{t.reject}</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
