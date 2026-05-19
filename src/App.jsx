import { useState, useEffect, useCallback } from "react";

const SUPABASE_URL = "https://dfamerkhelwopkqvgmle.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmYW1lcmtoZWx3b3BrcXZnbWxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwNjcyODksImV4cCI6MjA5NDY0MzI4OX0.vkbDzKbIdBBzcnRJVn639032MckArlIFCWG4Oju7T3M";

const WP_SITE = "YOUR_WORDPRESS_SITE";
const WP_USER = "YOUR_WP_USERNAME";
const WP_APP_PASSWORD = "YOUR_WP_APP_PASSWORD";

const i18n = {
  zh: {
    siteTitle: "内容管理中心", siteDesc: "温度记录仪 · 招投标内容生产",
    addContent: "+ 添加内容", tabContents: "内容库", tabLeads: "招标线索",
    filterAll: "全部", filterPending: "待审核", filterApproved: "已通过", filterRejected: "已拒绝",
    statusPending: "待审核", statusApproved: "已通过", statusRejected: "已拒绝",
    typeBlog: "博客", typeWechat: "公众号",
    langAll: "全部语言", langZh: "中文", langEn: "English", langBi: "双语",
    loading: "加载中...", noContent: "还没有内容", noContentHint: "点击右上角\"添加内容\"开始创建", noLeads: "暂无招标线索",
    addTitle: "添加新内容", phTitle: "文章标题", phBody: "文章正文（支持 Markdown）",
    phTags: "标签（逗号分隔，如：冷链,医药,招标）", submit: "提交", cancel: "取消",
    contentLang: "内容语言",
    detailTitle: "内容详情", copyBody: "复制正文到剪贴板", reviewNote: "审核备注（可选）", phNote: "输入备注...",
    approveWP: "通过并发布到WP", approve: "通过", reject: "拒绝", publishing: "发布中...",
    buyer: "采购方", region: "地区", budget: "预算", deadline: "截止", wan: "万",
    toastAdded: "内容已添加，等待审核", toastApproved: "已通过!", toastApprovedWP: "已通过并发布到 WordPress!",
    toastRejected: "已拒绝", toastCopied: "已复制到剪贴板", toastTitleBodyReq: "标题和正文不能为空",
    toastLoadFail: "加载失败", toastLeadFail: "加载招标信息失败", toastAddFail: "添加失败", toastOpFail: "操作失败",
  },
  en: {
    siteTitle: "Content Hub", siteDesc: "Temperature Logger · Bid Content Production",
    addContent: "+ Add Content", tabContents: "Content Library", tabLeads: "Bid Leads",
    filterAll: "All", filterPending: "Pending", filterApproved: "Approved", filterRejected: "Rejected",
    statusPending: "Pending", statusApproved: "Approved", statusRejected: "Rejected",
    typeBlog: "Blog", typeWechat: "WeChat",
    langAll: "All Languages", langZh: "中文", langEn: "English", langBi: "Bilingual",
    loading: "Loading...", noContent: "No content yet", noContentHint: "Click \"+ Add Content\" to get started", noLeads: "No bid leads yet",
    addTitle: "Add new content", phTitle: "Article title", phBody: "Article body (Markdown supported)",
    phTags: "Tags (comma separated)", submit: "Submit", cancel: "Cancel",
    contentLang: "Content language",
    detailTitle: "Content details", copyBody: "Copy body to clipboard", reviewNote: "Review note (optional)", phNote: "Enter note...",
    approveWP: "Approve & publish to WP", approve: "Approve", reject: "Reject", publishing: "Publishing...",
    buyer: "Buyer", region: "Region", budget: "Budget", deadline: "Deadline", wan: "0k CNY",
    toastAdded: "Content added, pending review", toastApproved: "Approved!", toastApprovedWP: "Approved & published to WordPress!",
    toastRejected: "Rejected", toastCopied: "Copied to clipboard", toastTitleBodyReq: "Title and body are required",
    toastLoadFail: "Failed to load", toastLeadFail: "Failed to load leads", toastAddFail: "Failed to add", toastOpFail: "Operation failed",
  },
};

const LANG_MAP = {
  zh: { label: "中文", color: "#BA7517", bg: "#FAEEDA" },
  en: { label: "EN", color: "#0C447C", bg: "#E6F1FB" },
  bi: { label: "双语/BI", color: "#534AB7", bg: "#EEEDFE" },
};

async function supaFetch(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options, headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json",
      Prefer: options.method === "PATCH" ? "return=representation" : "return=minimal", ...options.headers },
  });
  if (!res.ok) throw new Error(`Supabase error: ${res.status}`);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function publishToWordPress(title, body) {
  if (WP_SITE === "YOUR_WORDPRESS_SITE") return null;
  const res = await fetch(`${WP_SITE}/wp-json/wp/v2/posts`, {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: "Basic " + btoa(`${WP_USER}:${WP_APP_PASSWORD}`) },
    body: JSON.stringify({ title, content: body, status: "publish" }),
  });
  if (!res.ok) throw new Error("WordPress publish failed");
  return await res.json();
}

export default function App() {
  const [lang, setLang] = useState("zh");
  const t = i18n[lang];
  const STATUS_MAP = {
    pending: { label: t.statusPending, color: "#BA7517", bg: "#FAEEDA" },
    approved: { label: t.statusApproved, color: "#0F6E56", bg: "#E1F5EE" },
    rejected: { label: t.statusRejected, color: "#A32D2D", bg: "#FCEBEB" },
  };
  const TYPE_MAP = { wechat: { label: t.typeWechat, icon: "\u2709" }, blog: { label: t.typeBlog, icon: "\u270d" } };

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

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const fetchContents = useCallback(async () => {
    setLoading(true);
    try {
      let path = "contents?select=*,bid_leads(title,buyer,region)&order=created_at.desc";
      if (filter !== "all") path += `&review_status=eq.${filter}`;
      if (langFilter !== "all") path += `&lang=eq.${langFilter}`;
      setContents((await supaFetch(path)) || []);
    } catch (e) { showToast(t.toastLoadFail + ": " + e.message, "error"); }
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
      showToast(item.content_type === "blog" && wpId ? t.toastApprovedWP : t.toastApproved);
      setSelected(null); setReviewNote(""); fetchContents();
    } catch (e) { showToast(t.toastOpFail + ": " + e.message, "error"); }
    setPublishing(false);
  };

  const handleReject = async (item) => {
    try {
      await supaFetch(`contents?id=eq.${item.id}`, { method: "PATCH", body: JSON.stringify({ review_status: "rejected", reviewer_note: reviewNote || null, updated_at: new Date().toISOString() }) });
      showToast(t.toastRejected); setSelected(null); setReviewNote(""); fetchContents();
    } catch (e) { showToast(t.toastOpFail + ": " + e.message, "error"); }
  };

  const handleAddContent = async () => {
    if (!newContent.title || !newContent.body) { showToast(t.toastTitleBodyReq, "error"); return; }
    try {
      await supaFetch("contents", { method: "POST", body: JSON.stringify({ ...newContent, review_status: "pending" }) });
      showToast(t.toastAdded); setAddMode(false); setNewContent({ content_type: "blog", title: "", body: "", summary: "", tags: "", lang: "zh" }); fetchContents();
    } catch (e) { showToast(t.toastAddFail + ": " + e.message, "error"); }
  };

  const copyToClipboard = (text) => { navigator.clipboard.writeText(text).then(() => showToast(t.toastCopied)); };
  const dateStr = (d) => new Date(d).toLocaleDateString(lang === "zh" ? "zh-CN" : "en-US");

  return (
    <div style={{ minHeight: "100vh", background: "#FAFAF8", fontFamily: "'DM Sans', 'Noto Sans SC', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Noto+Sans+SC:wght@400;500;600&display=swap" rel="stylesheet" />
      {toast && <div style={{ position: "fixed", top: 20, right: 20, zIndex: 999, padding: "12px 20px", borderRadius: 10, fontSize: 14, fontWeight: 500, animation: "slideIn 0.3s ease", color: toast.type === "error" ? "#791F1F" : "#085041", background: toast.type === "error" ? "#FCEBEB" : "#E1F5EE", border: `1px solid ${toast.type === "error" ? "#F09595" : "#5DCAA5"}` }}>{toast.msg}</div>}
      <style>{`@keyframes slideIn{from{transform:translateX(100px);opacity:0}to{transform:translateX(0);opacity:1}}@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}.card-hover{transition:all .2s ease}.card-hover:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.06)}`}</style>

      {/* Header */}
      <header style={{ padding: "20px 32px", borderBottom: "1px solid #ECEAE3", background: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg, #1D9E75, #0F6E56)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 18, fontWeight: 600 }}>T</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "#2C2C2A", letterSpacing: -0.3 }}>{t.siteTitle}</h1>
            <p style={{ margin: 0, fontSize: 12, color: "#888780" }}>{t.siteDesc}</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", border: "1px solid #D3D1C7", borderRadius: 20, overflow: "hidden" }}>
            <button onClick={() => setLang("zh")} style={{ padding: "5px 12px", border: "none", fontSize: 12, fontWeight: 500, cursor: "pointer", background: lang === "zh" ? "#2C2C2A" : "#fff", color: lang === "zh" ? "#fff" : "#888780" }}>中文</button>
            <button onClick={() => setLang("en")} style={{ padding: "5px 12px", border: "none", fontSize: 12, fontWeight: 500, cursor: "pointer", background: lang === "en" ? "#2C2C2A" : "#fff", color: lang === "en" ? "#fff" : "#888780" }}>EN</button>
          </div>
          <button onClick={() => setAddMode(true)} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#1D9E75", color: "#fff", fontSize: 14, fontWeight: 500, cursor: "pointer" }}>{t.addContent}</button>
        </div>
      </header>

      {/* Tabs */}
      <div style={{ padding: "0 32px", background: "#fff", borderBottom: "1px solid #ECEAE3" }}>
        <div style={{ display: "flex" }}>
          {[{ key: "contents", label: t.tabContents }, { key: "leads", label: t.tabLeads }].map((tb) => (
            <button key={tb.key} onClick={() => setTab(tb.key)} style={{ padding: "12px 20px", border: "none", background: "none", fontSize: 14, cursor: "pointer", fontWeight: tab === tb.key ? 500 : 400, color: tab === tb.key ? "#1D9E75" : "#888780", borderBottom: tab === tb.key ? "2px solid #1D9E75" : "2px solid transparent" }}>{tb.label}</button>
          ))}
        </div>
      </div>

      <main style={{ maxWidth: 960, margin: "0 auto", padding: "24px 32px" }}>
        {/* Add content form */}
        {addMode && (
          <div style={{ marginBottom: 24, background: "#fff", borderRadius: 12, border: "1px solid #ECEAE3", padding: 24, animation: "fadeIn 0.3s ease" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 500 }}>{t.addTitle}</h3>

            {/* Content type selector */}
            <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
              {["blog", "wechat"].map((tp) => (
                <button key={tp} onClick={() => setNewContent({ ...newContent, content_type: tp })} style={{ padding: "6px 16px", borderRadius: 20, fontSize: 13, cursor: "pointer", border: `1px solid ${newContent.content_type === tp ? "#1D9E75" : "#D3D1C7"}`, background: newContent.content_type === tp ? "#E1F5EE" : "#fff", color: newContent.content_type === tp ? "#085041" : "#5F5E5A" }}>{TYPE_MAP[tp].icon} {TYPE_MAP[tp].label}</button>
              ))}
            </div>

            {/* Language selector */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: "#888780", display: "block", marginBottom: 6 }}>{t.contentLang}</label>
              <div style={{ display: "flex", gap: 8 }}>
                {[{ key: "zh", label: "中文", icon: "🇨🇳" }, { key: "en", label: "English", icon: "🇺🇸" }, { key: "bi", label: lang === "zh" ? "双语" : "Bilingual", icon: "🌐" }].map((l) => (
                  <button key={l.key} onClick={() => setNewContent({ ...newContent, lang: l.key })} style={{
                    padding: "6px 14px", borderRadius: 20, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
                    border: `1px solid ${newContent.lang === l.key ? LANG_MAP[l.key].color : "#D3D1C7"}`,
                    background: newContent.lang === l.key ? LANG_MAP[l.key].bg : "#fff",
                    color: newContent.lang === l.key ? LANG_MAP[l.key].color : "#5F5E5A",
                  }}>{l.icon} {l.label}</button>
                ))}
              </div>
            </div>

            <input placeholder={t.phTitle} value={newContent.title} onChange={(e) => setNewContent({ ...newContent, title: e.target.value })} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #D3D1C7", fontSize: 14, marginBottom: 12, boxSizing: "border-box" }} />
            <textarea placeholder={t.phBody} value={newContent.body} onChange={(e) => setNewContent({ ...newContent, body: e.target.value })} rows={8} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #D3D1C7", fontSize: 14, marginBottom: 12, resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" }} />
            <input placeholder={t.phTags} value={newContent.tags} onChange={(e) => setNewContent({ ...newContent, tags: e.target.value })} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #D3D1C7", fontSize: 14, marginBottom: 16, boxSizing: "border-box" }} />
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={handleAddContent} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "#1D9E75", color: "#fff", fontSize: 14, fontWeight: 500, cursor: "pointer" }}>{t.submit}</button>
              <button onClick={() => setAddMode(false)} style={{ padding: "8px 20px", borderRadius: 8, border: "1px solid #D3D1C7", background: "#fff", fontSize: 14, cursor: "pointer" }}>{t.cancel}</button>
            </div>
          </div>
        )}

        {tab === "contents" && (<>
          {/* Filters row */}
          <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
            {[{ key: "all", label: t.filterAll }, { key: "pending", label: t.filterPending }, { key: "approved", label: t.filterApproved }, { key: "rejected", label: t.filterRejected }].map((f) => (
              <button key={f.key} onClick={() => setFilter(f.key)} style={{ padding: "6px 16px", borderRadius: 20, fontSize: 13, fontWeight: 500, cursor: "pointer", border: `1px solid ${filter === f.key ? "#1D9E75" : "#D3D1C7"}`, background: filter === f.key ? "#E1F5EE" : "#fff", color: filter === f.key ? "#085041" : "#5F5E5A" }}>{f.label}</button>
            ))}
          </div>

          {/* Language filter row */}
          <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
            {[{ key: "all", label: t.langAll, icon: "📄" }, { key: "zh", label: t.langZh, icon: "🇨🇳" }, { key: "en", label: t.langEn, icon: "🇺🇸" }, { key: "bi", label: t.langBi, icon: "🌐" }].map((f) => (
              <button key={f.key} onClick={() => setLangFilter(f.key)} style={{
                padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
                border: `1px solid ${langFilter === f.key ? "#534AB7" : "#D3D1C7"}`,
                background: langFilter === f.key ? "#EEEDFE" : "#fff",
                color: langFilter === f.key ? "#3C3489" : "#888780",
              }}>{f.icon} {f.label}</button>
            ))}
          </div>

          {loading ? <p style={{ textAlign: "center", color: "#888780", padding: 40 }}>{t.loading}</p>
          : contents.length === 0 ? <div style={{ textAlign: "center", padding: "60px 20px", color: "#888780", background: "#fff", borderRadius: 12, border: "1px solid #ECEAE3" }}><p style={{ fontSize: 16, marginBottom: 8 }}>{t.noContent}</p><p style={{ fontSize: 13 }}>{t.noContentHint}</p></div>
          : <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {contents.map((item, i) => {
                const st = STATUS_MAP[item.review_status] || STATUS_MAP.pending;
                const tp = TYPE_MAP[item.content_type] || TYPE_MAP.blog;
                const cl = LANG_MAP[item.lang] || LANG_MAP.zh;
                return (
                  <div key={item.id} className="card-hover" onClick={() => { setSelected(item); setReviewNote(item.reviewer_note || ""); }} style={{ background: "#fff", borderRadius: 12, border: "1px solid #ECEAE3", padding: "16px 20px", cursor: "pointer", animation: `fadeIn 0.3s ease ${i * 0.05}s both` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: st.bg, color: st.color, fontWeight: 500 }}>{st.label}</span>
                          <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: "#F1EFE8", color: "#5F5E5A" }}>{tp.icon} {tp.label}</span>
                          <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: cl.bg, color: cl.color, fontWeight: 500 }}>{cl.label}</span>
                          {item.wp_post_id && <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: "#E6F1FB", color: "#0C447C" }}>WP #{item.wp_post_id}</span>}
                        </div>
                        <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 500, color: "#2C2C2A" }}>{item.title}</h3>
                        {item.bid_leads && <p style={{ margin: 0, fontSize: 12, color: "#888780" }}>{item.bid_leads.buyer} · {item.bid_leads.region}</p>}
                      </div>
                      <span style={{ fontSize: 12, color: "#B4B2A9", whiteSpace: "nowrap" }}>{dateStr(item.created_at)}</span>
                    </div>
                    {item.tags && <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>{item.tags.split(",").map((tag) => <span key={tag} style={{ fontSize: 11, padding: "1px 8px", borderRadius: 8, background: "#FAEEDA", color: "#854F0B" }}>{tag.trim()}</span>)}</div>}
                  </div>
                );
              })}
            </div>}
        </>)}

        {tab === "leads" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {leads.length === 0 ? <div style={{ textAlign: "center", padding: "60px 20px", color: "#888780", background: "#fff", borderRadius: 12, border: "1px solid #ECEAE3" }}><p style={{ fontSize: 16 }}>{t.noLeads}</p></div>
            : leads.map((lead, i) => (
              <div key={lead.id} style={{ background: "#fff", borderRadius: 12, border: "1px solid #ECEAE3", padding: "16px 20px", animation: `fadeIn 0.3s ease ${i * 0.05}s both` }}>
                <h3 style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 500, color: "#2C2C2A" }}>{lead.title}</h3>
                <div style={{ display: "flex", gap: 16, fontSize: 13, color: "#888780", flexWrap: "wrap" }}>
                  {lead.buyer && <span>{t.buyer}: {lead.buyer}</span>}
                  {lead.region && <span>{t.region}: {lead.region}</span>}
                  {lead.budget && <span>{t.budget}: {lead.budget}{t.wan}</span>}
                  {lead.deadline && <span>{t.deadline}: {lead.deadline}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Detail panel */}
      {selected && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", justifyContent: "flex-end" }}>
          <div style={{ flex: 1, background: "rgba(0,0,0,0.3)" }} onClick={() => { setSelected(null); setReviewNote(""); }} />
          <div style={{ width: 540, maxWidth: "90vw", background: "#fff", overflowY: "auto", padding: "28px 32px", animation: "slideIn 0.3s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 500 }}>{t.detailTitle}</h2>
              <button onClick={() => { setSelected(null); setReviewNote(""); }} style={{ border: "none", background: "none", fontSize: 20, cursor: "pointer", color: "#888780" }}>✕</button>
            </div>
            <div style={{ marginBottom: 16, display: "flex", gap: 6, flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, padding: "3px 10px", borderRadius: 10, background: STATUS_MAP[selected.review_status]?.bg, color: STATUS_MAP[selected.review_status]?.color, fontWeight: 500 }}>{STATUS_MAP[selected.review_status]?.label}</span>
              <span style={{ fontSize: 12, padding: "3px 10px", borderRadius: 10, background: "#F1EFE8", color: "#5F5E5A" }}>{TYPE_MAP[selected.content_type]?.label}</span>
              {(() => { const cl = LANG_MAP[selected.lang] || LANG_MAP.zh; return <span style={{ fontSize: 12, padding: "3px 10px", borderRadius: 10, background: cl.bg, color: cl.color, fontWeight: 500 }}>{cl.label}</span>; })()}
            </div>
            <h3 style={{ margin: "0 0 16px", fontSize: 17, fontWeight: 500, lineHeight: 1.4 }}>{selected.title}</h3>
            {selected.content_type === "wechat" && <button onClick={() => copyToClipboard(selected.body)} style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid #D3D1C7", background: "#fff", fontSize: 13, cursor: "pointer", marginBottom: 16 }}>{t.copyBody}</button>}
            <div style={{ background: "#FAFAF8", borderRadius: 10, border: "1px solid #ECEAE3", padding: "20px 24px", marginBottom: 20, fontSize: 14, lineHeight: 1.8, color: "#2C2C2A", whiteSpace: "pre-wrap" }}>{selected.body}</div>
            {selected.review_status === "pending" && (
              <div style={{ borderTop: "1px solid #ECEAE3", paddingTop: 20 }}>
                <label style={{ fontSize: 13, color: "#888780", display: "block", marginBottom: 8 }}>{t.reviewNote}</label>
                <textarea value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} placeholder={t.phNote} rows={3} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #D3D1C7", fontSize: 14, marginBottom: 16, resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" }} />
                <div style={{ display: "flex", gap: 12 }}>
                  <button onClick={() => handleApprove(selected)} disabled={publishing} style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: "#1D9E75", color: "#fff", fontSize: 14, fontWeight: 500, cursor: publishing ? "wait" : "pointer", opacity: publishing ? 0.7 : 1 }}>{publishing ? t.publishing : selected.content_type === "blog" ? t.approveWP : t.approve}</button>
                  <button onClick={() => handleReject(selected)} style={{ padding: "10px 24px", borderRadius: 8, border: "1px solid #F09595", background: "#fff", color: "#A32D2D", fontSize: 14, fontWeight: 500, cursor: "pointer" }}>{t.reject}</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
