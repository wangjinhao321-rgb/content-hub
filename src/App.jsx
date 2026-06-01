import { useState, useEffect, useCallback, useRef } from "react";

const SUPABASE_URL = "https://dfamerkhelwopkqvgmle.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmYW1lcmtoZWx3b3BrcXZnbWxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwNjcyODksImV4cCI6MjA5NDY0MzI4OX0.vkbDzKbIdBBzcnRJVn639032MckArlIFCWG4Oju7T3M";
const STORAGE_BUCKET = "content-images";
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
    addTitle: "新建内容", editTitle: "编辑内容", phTitle: "输入文章标题", phBody: "输入正文内容，支持 Markdown 格式",
    phTags: "标签，逗号分隔", submit: "发布到审核", cancel: "取消", save: "保存修改",
    contentLang: "语言", contentType: "类型",
    detailTitle: "内容预览", copyBody: "复制正文", reviewNote: "审核备注", phNote: "可选，输入备注...",
    approveWP: "通过并发布 WP", approve: "审核通过", reject: "驳回", publishing: "发布中...",
    buyer: "采购方", region: "地区", budget: "预算", deadline: "截止", wan: "万",
    toastAdded: "已提交审核", toastApproved: "已通过", toastApprovedWP: "已通过并发布到 WordPress",
    toastRejected: "已驳回", toastCopied: "已复制", toastTitleBodyReq: "标题和正文不能为空",
    toastLoadFail: "加载失败", toastLeadFail: "加载线索失败", toastAddFail: "提交失败", toastOpFail: "操作失败",
    toastSaved: "修改已保存",
    statusLabel: "状态", langLabel: "语言",
    uploadImg: "图片", uploading: "上传中...", uploadHint: "拖拽图片到此处", uploadSuccess: "图片已插入",
    preview: "预览", edit: "编辑", editBtn: "编辑",
    ratingTitle: "评价", ratingSub: "为这篇内容打分并留下评价", phAuthor: "你的名字", phComment: "写一句评价...",
    submitComment: "提交评价", noComments: "暂无评价", avgRating: "平均", reviews: "条评价", review1: "条评价",
    commentSuccess: "评价已提交", commentFail: "提交失败", authorRequired: "请填写名字",
    h1: "大标题", h2: "中标题", h3: "小标题", bold: "加粗", italic: "斜体",
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
    addTitle: "New Content", editTitle: "Edit Content", phTitle: "Enter article title", phBody: "Enter body, Markdown supported",
    phTags: "Tags, comma separated", submit: "Submit for Review", cancel: "Cancel", save: "Save Changes",
    contentLang: "Language", contentType: "Type",
    detailTitle: "Preview", copyBody: "Copy Body", reviewNote: "Review Note", phNote: "Optional note...",
    approveWP: "Approve & Publish WP", approve: "Approve", reject: "Reject", publishing: "Publishing...",
    buyer: "Buyer", region: "Region", budget: "Budget", deadline: "Deadline", wan: "0k",
    toastAdded: "Submitted for review", toastApproved: "Approved", toastApprovedWP: "Approved & published to WordPress",
    toastRejected: "Rejected", toastCopied: "Copied", toastTitleBodyReq: "Title and body required",
    toastLoadFail: "Load failed", toastLeadFail: "Failed to load leads", toastAddFail: "Submit failed", toastOpFail: "Failed",
    toastSaved: "Changes saved",
    statusLabel: "Status", langLabel: "Language",
    uploadImg: "Image", uploading: "Uploading...", uploadHint: "Drag image here", uploadSuccess: "Image inserted",
    preview: "Preview", edit: "Edit", editBtn: "Edit",
    ratingTitle: "Reviews", ratingSub: "Rate and review this content", phAuthor: "Your name", phComment: "Short review...",
    submitComment: "Submit", noComments: "No reviews yet", avgRating: "Avg", reviews: "reviews", review1: "review",
    commentSuccess: "Review submitted", commentFail: "Submit failed", authorRequired: "Name required",
    h1: "H1", h2: "H2", h3: "H3", bold: "Bold", italic: "Italic",
  },
};

async function supaFetch(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options, headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json",
      Prefer: options.method === "PATCH" ? "return=representation" : (options.method === "POST" ? "return=representation" : "return=minimal"), ...options.headers },
  });
  if (!res.ok) throw new Error(`${res.status}`);
  const txt = await res.text();
  return txt ? JSON.parse(txt) : null;
}

async function uploadImage(file) {
  const ext = file.name.split(".").pop();
  const fn = `${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${STORAGE_BUCKET}/${fn}`, {
    method: "POST", headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": file.type }, body: file,
  });
  if (!res.ok) throw new Error("Upload failed");
  return `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${fn}`;
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

function renderBody(text) {
  if (!text) return "";
  return text
    .replace(/^### (.+)$/gm, '<h3 style="font-size:15px;font-weight:600;margin:18px 0 8px;color:#1C1917">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="font-size:17px;font-weight:600;margin:22px 0 10px;color:#1C1917">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="font-size:20px;font-weight:700;margin:26px 0 12px;color:#1C1917">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;border-radius:8px;margin:12px 0" />')
    .replace(/\n\n/g, '<div style="height:12px"></div>')
    .replace(/\n/g, "<br/>");
}

function StarRating({ value, onChange, size = 20, readonly = false }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: "inline-flex", gap: 1 }}>
      {[1,2,3,4,5].map((s) => (
        <svg key={s} width={size} height={size} viewBox="0 0 24 24"
          style={{ cursor: readonly ? "default" : "pointer", transition: "transform 0.1s", transform: !readonly && hover === s ? "scale(1.2)" : "scale(1)" }}
          onClick={() => !readonly && onChange?.(s)}
          onMouseEnter={() => !readonly && setHover(s)}
          onMouseLeave={() => !readonly && setHover(0)}
          fill={(hover || value) >= s ? "#FACC15" : "none"}
          stroke={(hover || value) >= s ? "#EAB308" : "#D6D3D1"}
          strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
    </div>
  );
}

// Markdown toolbar helper
function insertMarkdown(textareaRef, body, setBody, prefix, suffix = "") {
  const ta = textareaRef.current;
  if (!ta) return;
  const start = ta.selectionStart;
  const end = ta.selectionEnd;
  const sel = body.slice(start, end);
  const before = body.slice(0, start);
  const after = body.slice(end);
  const needNewline = before.length > 0 && !before.endsWith("\n") && prefix.startsWith("#");
  const insert = (needNewline ? "\n" : "") + prefix + (sel || "") + suffix;
  const newBody = before + insert + after;
  setBody(newBody);
  setTimeout(() => {
    ta.focus();
    const cursorPos = start + (needNewline ? 1 : 0) + prefix.length + (sel ? sel.length : 0);
    ta.setSelectionRange(cursorPos, cursorPos);
  }, 0);
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
  const [uploading, setUploading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [comments, setComments] = useState([]);
  const [allCommentStats, setAllCommentStats] = useState({});
  const [newRating, setNewRating] = useState(0);
  const [newAuthor, setNewAuthor] = useState("");
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  // Edit mode
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({ title: "", body: "", tags: "", content_type: "", lang: "" });
  const [editPreview, setEditPreview] = useState(false);
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const editTextareaRef = useRef(null);
  const editFileInputRef = useRef(null);

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 2500); };

  // Fetch all comment stats for main page
  const fetchAllCommentStats = useCallback(async () => {
    try {
      const data = await supaFetch("comments?select=content_id,rating");
      if (!data) return;
      const stats = {};
      data.forEach((c) => {
        if (!stats[c.content_id]) stats[c.content_id] = { total: 0, sum: 0 };
        stats[c.content_id].total++;
        stats[c.content_id].sum += c.rating;
      });
      setAllCommentStats(stats);
    } catch { /* ignore */ }
  }, []);

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

  const fetchComments = useCallback(async (contentId) => {
    try { setComments((await supaFetch(`comments?content_id=eq.${contentId}&order=created_at.desc`)) || []); }
    catch { setComments([]); }
  }, []);

  useEffect(() => { fetchContents(); fetchAllCommentStats(); }, [fetchContents, fetchAllCommentStats]);
  useEffect(() => { if (tab === "leads") fetchLeads(); }, [tab, fetchLeads]);
  useEffect(() => { if (selected) { fetchComments(selected.id); setNewRating(0); setNewComment(""); setEditing(false); } }, [selected]);

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
      showToast(t.toastAdded); setAddMode(false); setPreviewMode(false);
      setNewContent({ content_type: "blog", title: "", body: "", summary: "", tags: "", lang: "zh" }); fetchContents();
    } catch (e) { showToast(t.toastAddFail, "error"); }
  };

  const handleSaveEdit = async () => {
    if (!editData.title || !editData.body) { showToast(t.toastTitleBodyReq, "error"); return; }
    setSaving(true);
    try {
      await supaFetch(`contents?id=eq.${selected.id}`, { method: "PATCH", body: JSON.stringify({
        title: editData.title, body: editData.body, tags: editData.tags, content_type: editData.content_type, lang: editData.lang, updated_at: new Date().toISOString(),
      })});
      showToast(t.toastSaved);
      const updated = { ...selected, ...editData, updated_at: new Date().toISOString() };
      setSelected(updated); setEditing(false); fetchContents();
    } catch (e) { showToast(t.toastOpFail, "error"); }
    setSaving(false);
  };

  const startEditing = () => {
    setEditData({ title: selected.title, body: selected.body, tags: selected.tags || "", content_type: selected.content_type, lang: selected.lang || "zh" });
    setEditing(true); setEditPreview(false);
  };

  const handleSubmitComment = async () => {
    if (!newAuthor.trim()) { showToast(t.authorRequired, "error"); return; }
    if (newRating === 0) { showToast(lang === "zh" ? "请选择评分" : "Please rate", "error"); return; }
    setSubmittingComment(true);
    try {
      await supaFetch("comments", { method: "POST", body: JSON.stringify({ content_id: selected.id, author: newAuthor.trim(), rating: newRating, comment: newComment.trim() || null }) });
      showToast(t.commentSuccess); setNewRating(0); setNewComment("");
      fetchComments(selected.id); fetchAllCommentStats();
    } catch (e) { showToast(t.commentFail, "error"); }
    setSubmittingComment(false);
  };

  const handleImageUpload = async (file, isEdit = false) => {
    if (!file || !file.type.startsWith("image/")) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      const md = `![${file.name}](${url})`;
      const ref = isEdit ? editTextareaRef : textareaRef;
      const bodyVal = isEdit ? editData.body : newContent.body;
      const setFn = isEdit
        ? (v) => setEditData({ ...editData, body: v })
        : (v) => setNewContent({ ...newContent, body: v });
      const ta = ref.current;
      if (ta) {
        const start = ta.selectionStart;
        const before = bodyVal.slice(0, start);
        const after = bodyVal.slice(ta.selectionEnd);
        setFn(before + (before && !before.endsWith("\n") ? "\n" : "") + md + "\n" + after);
      } else {
        setFn(bodyVal + "\n" + md + "\n");
      }
      showToast(t.uploadSuccess);
    } catch (e) { showToast(e.message, "error"); }
    setUploading(false);
  };

  const handleDrop = (e, isEdit = false) => { e.preventDefault(); setDragOver(false); const file = e.dataTransfer.files[0]; if (file) handleImageUpload(file, isEdit); };
  const handlePaste = (e, isEdit = false) => { const items = e.clipboardData?.items; if (!items) return; for (const item of items) { if (item.type.startsWith("image/")) { e.preventDefault(); handleImageUpload(item.getAsFile(), isEdit); break; } } };
  const copyToClipboard = (txt) => { navigator.clipboard.writeText(txt).then(() => showToast(t.toastCopied)); };
  const fmtDate = (d) => { const dt = new Date(d); return `${dt.getMonth()+1}/${dt.getDate()}`; };
  const fmtDateTime = (d) => { const dt = new Date(d); return `${dt.getMonth()+1}/${dt.getDate()} ${dt.getHours()}:${String(dt.getMinutes()).padStart(2,"0")}`; };

  const statusStyle = { pending: { bg: "#FFF8EB", color: "#A16207", dot: "#FACC15" }, approved: { bg: "#ECFDF5", color: "#047857", dot: "#34D399" }, rejected: { bg: "#FEF2F2", color: "#B91C1C", dot: "#F87171" } };
  const langStyle = { zh: { label: "中", bg: "#FEF3C7", color: "#92400E" }, en: { label: "EN", bg: "#DBEAFE", color: "#1E40AF" }, bi: { label: "BI", bg: "#EDE9FE", color: "#5B21B6" } };
  const pendingCount = contents.filter(c => c.review_status === "pending").length;
  const approvedCount = contents.filter(c => c.review_status === "approved").length;

  // Toolbar component
  const EditorToolbar = ({ taRef, body, setBody, isEdit = false }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
      <div style={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        {[
          { label: "H1", tip: t.h1, fn: () => insertMarkdown(taRef, body, setBody, "# ") },
          { label: "H2", tip: t.h2, fn: () => insertMarkdown(taRef, body, setBody, "## ") },
          { label: "H3", tip: t.h3, fn: () => insertMarkdown(taRef, body, setBody, "### ") },
        ].map((b) => (
          <button key={b.label} onClick={b.fn} title={b.tip} className="btn" style={{
            padding: "4px 10px", borderRadius: 6, border: "1px solid #E7E5E4", background: "#fff",
            fontSize: 12, fontWeight: 700, cursor: "pointer", color: "#57534E", fontFamily: "'Outfit'",
          }}>{b.label}</button>
        ))}
        <div style={{ width: 1, background: "#E7E5E4", margin: "0 4px" }} />
        <button onClick={() => insertMarkdown(taRef, body, setBody, "**", "**")} title={t.bold} className="btn" style={{
          padding: "4px 10px", borderRadius: 6, border: "1px solid #E7E5E4", background: "#fff",
          fontSize: 13, fontWeight: 700, cursor: "pointer", color: "#57534E",
        }}>B</button>
        <button onClick={() => insertMarkdown(taRef, body, setBody, "*", "*")} title={t.italic} className="btn" style={{
          padding: "4px 10px", borderRadius: 6, border: "1px solid #E7E5E4", background: "#fff",
          fontSize: 13, fontStyle: "italic", cursor: "pointer", color: "#57534E",
        }}>I</button>
        <div style={{ width: 1, background: "#E7E5E4", margin: "0 4px" }} />
        <input type="file" ref={isEdit ? editFileInputRef : fileInputRef} accept="image/*" style={{ display: "none" }}
          onChange={(e) => { if (e.target.files[0]) handleImageUpload(e.target.files[0], isEdit); e.target.value = ""; }} />
        <button onClick={() => (isEdit ? editFileInputRef : fileInputRef).current?.click()} disabled={uploading} className="btn" style={{
          padding: "4px 10px", borderRadius: 6, border: "1px solid #E7E5E4", background: "#fff",
          fontSize: 12, fontWeight: 500, cursor: uploading ? "wait" : "pointer", display: "flex", alignItems: "center", gap: 4, color: "#57534E",
        }}>
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
          {uploading ? t.uploading : t.uploadImg}
        </button>
      </div>
      <div style={{ display: "flex", background: "#ECEAE3", borderRadius: 6, padding: 2 }}>
        <button onClick={() => isEdit ? setEditPreview(false) : setPreviewMode(false)} style={{ padding: "4px 12px", border: "none", borderRadius: 4, fontSize: 11, fontWeight: 500, cursor: "pointer", background: (isEdit ? !editPreview : !previewMode) ? "#fff" : "transparent", color: (isEdit ? !editPreview : !previewMode) ? "#1C1917" : "#78716C", boxShadow: (isEdit ? !editPreview : !previewMode) ? "0 1px 2px rgba(0,0,0,.06)" : "none" }}>{t.edit}</button>
        <button onClick={() => isEdit ? setEditPreview(true) : setPreviewMode(true)} style={{ padding: "4px 12px", border: "none", borderRadius: 4, fontSize: 11, fontWeight: 500, cursor: "pointer", background: (isEdit ? editPreview : previewMode) ? "#fff" : "transparent", color: (isEdit ? editPreview : previewMode) ? "#1C1917" : "#78716C", boxShadow: (isEdit ? editPreview : previewMode) ? "0 1px 2px rgba(0,0,0,.06)" : "none" }}>{t.preview}</button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#F8F7F4" }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Noto+Sans+SC:wght@300;400;500;600&display=swap" rel="stylesheet" />
      <style>{`
        *{box-sizing:border-box}body{margin:0}
        @keyframes toast-in{from{transform:translateY(-12px) scale(.95);opacity:0}to{transform:translateY(0) scale(1);opacity:1}}
        @keyframes fade-up{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slide-in{from{transform:translateX(100%)}to{transform:translateX(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.6}}
        .item{transition:all .15s ease;border:1.5px solid transparent}.item:hover{border-color:#D6D3C8;transform:translateY(-1px);box-shadow:0 4px 20px rgba(0,0,0,.04)}
        .btn{transition:all .15s ease}.btn:hover{transform:translateY(-1px);box-shadow:0 2px 8px rgba(0,0,0,.08)}.btn:active{transform:translateY(0)}
        textarea:focus,input:focus{outline:none;border-color:#A3A096!important}
        .chip{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:100px;font-size:11px;font-weight:500;letter-spacing:.02em;white-space:nowrap}
      `}</style>

      {toast && <div style={{ position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)", zIndex: 999, animation: "toast-in 0.25s ease" }}>
        <div style={{ padding: "10px 20px", borderRadius: 100, fontSize: 13, fontWeight: 500, fontFamily: "'Outfit','Noto Sans SC',sans-serif", background: "#1C1917", color: "#fff", boxShadow: "0 8px 32px rgba(0,0,0,.16)", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: toast.type === "error" ? "#F87171" : "#34D399" }} />{toast.msg}
        </div>
      </div>}

      <div style={{ display: "flex", minHeight: "100vh" }}>
        {/* Sidebar */}
        <nav style={{ width: 220, background: "#1C1917", color: "#fff", padding: "28px 0", display: "flex", flexDirection: "column", flexShrink: 0 }}>
          <div style={{ padding: "0 24px", marginBottom: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#34D399,#059669)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, fontFamily: "'Outfit'" }}>T</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, fontFamily: "'Outfit',sans-serif", letterSpacing: -0.3 }}>{t.siteTitle}</div>
                <div style={{ fontSize: 10, color: "#A8A29E" }}>{t.siteDesc}</div>
              </div>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            {[{ key: "contents", label: t.tabContents, icon: "M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2" },
              { key: "leads", label: t.tabLeads, icon: "M13 10V3L4 14h7v7l9-11h-7z" }].map((n) => (
              <button key={n.key} onClick={() => setTab(n.key)} style={{ width: "100%", padding: "10px 24px", border: "none", background: tab === n.key ? "rgba(255,255,255,.08)" : "transparent", color: tab === n.key ? "#fff" : "#A8A29E", fontSize: 13, fontWeight: 500, fontFamily: "'Outfit','Noto Sans SC',sans-serif", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, textAlign: "left", borderLeft: tab === n.key ? "2px solid #34D399" : "2px solid transparent" }}>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d={n.icon}/></svg>{n.label}
              </button>
            ))}
          </div>
          <div style={{ padding: "0 24px" }}>
            <div style={{ display: "flex", background: "rgba(255,255,255,.06)", borderRadius: 8, padding: 3 }}>
              {["zh","en"].map((l) => (
                <button key={l} onClick={() => setLang(l)} style={{ flex: 1, padding: "6px 0", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "'Outfit'", background: lang === l ? "rgba(255,255,255,.12)" : "transparent", color: lang === l ? "#fff" : "#78716C" }}>{l === "zh" ? "中文" : "English"}</button>
              ))}
            </div>
          </div>
        </nav>

        {/* Main */}
        <main style={{ flex: 1, padding: "28px 36px", fontFamily: "'Outfit','Noto Sans SC',sans-serif", overflow: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: "#1C1917", letterSpacing: -0.5 }}>{tab === "contents" ? t.tabContents : t.tabLeads}</h1>
              {tab === "contents" && <p style={{ margin: "4px 0 0", fontSize: 13, color: "#A8A29E" }}>
                {pendingCount > 0 ? `${pendingCount} ${t.filterPending}` : ""}{pendingCount > 0 && approvedCount > 0 ? " · " : ""}{approvedCount > 0 ? `${approvedCount} ${t.filterApproved}` : ""}
              </p>}
            </div>
            {tab === "contents" && (
              <button className="btn" onClick={() => { setAddMode(true); setPreviewMode(false); }} style={{ padding: "9px 20px", borderRadius: 10, border: "none", cursor: "pointer", background: "#1C1917", color: "#fff", fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>{t.addContent}
              </button>
            )}
          </div>

          {/* Filters */}
          {tab === "contents" && (
            <div style={{ display: "flex", gap: 20, marginBottom: 24, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 11, color: "#A8A29E", fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5 }}>{t.statusLabel}</span>
                <div style={{ display: "flex", background: "#ECEAE3", borderRadius: 8, padding: 2 }}>
                  {[{ key: "all", label: t.filterAll },{ key: "pending", label: t.filterPending },{ key: "approved", label: t.filterApproved },{ key: "rejected", label: t.filterRejected }].map((f) => (
                    <button key={f.key} onClick={() => setFilter(f.key)} style={{ padding: "5px 12px", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: "pointer", background: filter === f.key ? "#fff" : "transparent", color: filter === f.key ? "#1C1917" : "#78716C", boxShadow: filter === f.key ? "0 1px 3px rgba(0,0,0,.06)" : "none" }}>{f.label}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 11, color: "#A8A29E", fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5 }}>{t.langLabel}</span>
                <div style={{ display: "flex", background: "#ECEAE3", borderRadius: 8, padding: 2 }}>
                  {[{ key: "all", label: t.langAll },{ key: "zh", label: t.langZh },{ key: "en", label: t.langEn },{ key: "bi", label: t.langBi }].map((f) => (
                    <button key={f.key} onClick={() => setLangFilter(f.key)} style={{ padding: "5px 12px", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: "pointer", background: langFilter === f.key ? "#fff" : "transparent", color: langFilter === f.key ? "#1C1917" : "#78716C", boxShadow: langFilter === f.key ? "0 1px 3px rgba(0,0,0,.06)" : "none" }}>{f.label}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Add content modal */}
          {addMode && (
            <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,.4)", backdropFilter: "blur(4px)" }}
              onClick={(e) => { if (e.target === e.currentTarget) { setAddMode(false); setPreviewMode(false); } }}>
              <div style={{ width: 660, maxWidth: "92vw", maxHeight: "90vh", overflow: "auto", background: "#fff", borderRadius: 16, padding: 32, animation: "fade-up 0.25s ease", boxShadow: "0 24px 64px rgba(0,0,0,.12)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{t.addTitle}</h2>
                  <button onClick={() => { setAddMode(false); setPreviewMode(false); }} style={{ border: "none", background: "#F5F4F0", width: 32, height: 32, borderRadius: 8, cursor: "pointer", fontSize: 16, color: "#78716C", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                </div>
                <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#A8A29E", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 6 }}>{t.contentType}</label>
                    <div style={{ display: "flex", gap: 6 }}>
                      {[{ k: "blog", l: t.typeBlog },{ k: "wechat", l: t.typeWechat }].map((tp) => (
                        <button key={tp.k} onClick={() => setNewContent({ ...newContent, content_type: tp.k })} className="btn" style={{ padding: "7px 16px", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer", border: newContent.content_type === tp.k ? "1.5px solid #1C1917" : "1.5px solid #E7E5E4", background: newContent.content_type === tp.k ? "#1C1917" : "#fff", color: newContent.content_type === tp.k ? "#fff" : "#57534E" }}>{tp.l}</button>
                      ))}
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#A8A29E", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 6 }}>{t.contentLang}</label>
                    <div style={{ display: "flex", gap: 6 }}>
                      {[{ k: "zh", l: "中文", bg: "#FEF3C7", c: "#92400E", bc: "#F59E0B" },{ k: "en", l: "EN", bg: "#DBEAFE", c: "#1E40AF", bc: "#3B82F6" },{ k: "bi", l: lang === "zh" ? "双语" : "BI", bg: "#EDE9FE", c: "#5B21B6", bc: "#8B5CF6" }].map((l) => (
                        <button key={l.k} onClick={() => setNewContent({ ...newContent, lang: l.k })} className="btn" style={{ padding: "7px 16px", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer", border: newContent.lang === l.k ? `1.5px solid ${l.bc}` : "1.5px solid #E7E5E4", background: newContent.lang === l.k ? l.bg : "#fff", color: newContent.lang === l.k ? l.c : "#57534E" }}>{l.l}</button>
                      ))}
                    </div>
                  </div>
                </div>
                <input placeholder={t.phTitle} value={newContent.title} onChange={(e) => setNewContent({ ...newContent, title: e.target.value })}
                  style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "1.5px solid #E7E5E4", fontSize: 15, fontWeight: 500, marginBottom: 12, fontFamily: "'Outfit','Noto Sans SC'", color: "#1C1917" }} />
                <EditorToolbar taRef={textareaRef} body={newContent.body} setBody={(v) => setNewContent({ ...newContent, body: v })} />
                {!previewMode ? (
                  <div onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={(e) => handleDrop(e, false)}
                    style={{ border: `1.5px ${dragOver ? "dashed" : "solid"} ${dragOver ? "#34D399" : "#E7E5E4"}`, borderRadius: 10, marginBottom: 12, background: dragOver ? "#ECFDF5" : "transparent" }}>
                    <textarea ref={textareaRef} placeholder={t.phBody} value={newContent.body}
                      onChange={(e) => setNewContent({ ...newContent, body: e.target.value })} onPaste={(e) => handlePaste(e, false)} rows={12}
                      style={{ width: "100%", padding: "12px 16px", border: "none", borderRadius: 10, fontSize: 14, resize: "vertical", fontFamily: "'Outfit','Noto Sans SC'", lineHeight: 1.7, color: "#1C1917", background: "transparent", outline: "none", minHeight: 200 }} />
                  </div>
                ) : (
                  <div style={{ border: "1.5px solid #E7E5E4", borderRadius: 10, padding: "16px 20px", marginBottom: 12, minHeight: 200, fontSize: 14, lineHeight: 1.8, color: "#44403C" }}
                    dangerouslySetInnerHTML={{ __html: renderBody(newContent.body) || `<span style="color:#A8A29E">${t.phBody}</span>` }} />
                )}
                <input placeholder={t.phTags} value={newContent.tags} onChange={(e) => setNewContent({ ...newContent, tags: e.target.value })}
                  style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "1.5px solid #E7E5E4", fontSize: 13, marginBottom: 20, fontFamily: "'Outfit','Noto Sans SC'", color: "#57534E" }} />
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                  <button onClick={() => { setAddMode(false); setPreviewMode(false); }} className="btn" style={{ padding: "9px 20px", borderRadius: 10, border: "1.5px solid #E7E5E4", background: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer", color: "#57534E" }}>{t.cancel}</button>
                  <button onClick={handleAddContent} className="btn" style={{ padding: "9px 24px", borderRadius: 10, border: "none", background: "#1C1917", color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>{t.submit}</button>
                </div>
              </div>
            </div>
          )}

          {/* Content list with ratings */}
          {tab === "contents" && (
            loading ? <div style={{ textAlign: "center", padding: 60, color: "#A8A29E" }}><div style={{ animation: "pulse 1.5s ease infinite" }}>{t.loading}</div></div>
            : contents.length === 0 ? <div style={{ textAlign: "center", padding: "80px 20px" }}><div style={{ fontSize: 40, marginBottom: 12 }}>📭</div><p style={{ fontSize: 15, color: "#78716C", margin: "0 0 4px", fontWeight: 500 }}>{t.noContent}</p><p style={{ fontSize: 13, color: "#A8A29E" }}>{t.noContentHint}</p></div>
            : <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {contents.map((item, i) => {
                  const st = statusStyle[item.review_status] || statusStyle.pending;
                  const cl = langStyle[item.lang] || langStyle.zh;
                  const cs = allCommentStats[item.id];
                  const avg = cs ? (cs.sum / cs.total).toFixed(1) : null;
                  return (
                    <div key={item.id} className="item" onClick={() => { setSelected(item); setReviewNote(item.reviewer_note || ""); }}
                      style={{ background: "#fff", borderRadius: 12, padding: "14px 20px", cursor: "pointer", animation: `fade-up 0.3s ease ${i * 0.04}s both` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
                            <span className="chip" style={{ background: st.bg, color: st.color }}><span style={{ width: 5, height: 5, borderRadius: "50%", background: st.dot }} />{statusStyle.pending === st ? t.statusPending : statusStyle.approved === st ? t.statusApproved : t.statusRejected}</span>
                            <span className="chip" style={{ background: "#F5F4F0", color: "#57534E" }}>{item.content_type === "blog" ? t.typeBlog : t.typeWechat}</span>
                            <span className="chip" style={{ background: cl.bg, color: cl.color }}>{cl.label}</span>
                            {item.wp_post_id && <span className="chip" style={{ background: "#DBEAFE", color: "#1E40AF" }}>WP</span>}
                          </div>
                          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 500, color: "#1C1917", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</h3>
                          {item.bid_leads && <p style={{ margin: "4px 0 0", fontSize: 12, color: "#A8A29E" }}>{item.bid_leads.buyer} · {item.bid_leads.region}</p>}
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 16, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                          <span style={{ fontSize: 12, color: "#D6D3D1", fontWeight: 500, fontFamily: "'Outfit'" }}>{fmtDate(item.created_at)}</span>
                          {cs && (
                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <StarRating value={Math.round(parseFloat(avg))} readonly size={12} />
                              <span style={{ fontSize: 11, fontWeight: 600, color: "#A16207" }}>{avg}</span>
                              <span style={{ fontSize: 10, color: "#A8A29E" }}>({cs.total})</span>
                            </div>
                          )}
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
                  <h3 style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 500, color: "#1C1917" }}>{lead.title}</h3>
                  <div style={{ display: "flex", gap: 12, fontSize: 12, color: "#A8A29E", flexWrap: "wrap" }}>
                    {lead.buyer && <span><span style={{ color: "#D6D3D1" }}>●</span> {t.buyer}: {lead.buyer}</span>}
                    {lead.region && <span><span style={{ color: "#D6D3D1" }}>●</span> {t.region}: {lead.region}</span>}
                    {lead.budget && <span><span style={{ color: "#D6D3D1" }}>●</span> {t.budget}: {lead.budget}{t.wan}</span>}
                    {lead.deadline && <span><span style={{ color: "#D6D3D1" }}>●</span> {t.deadline}: {lead.deadline}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Detail panel */}
      {selected && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", justifyContent: "flex-end" }}>
          <div style={{ flex: 1, background: "rgba(0,0,0,.3)", backdropFilter: "blur(2px)" }} onClick={() => { setSelected(null); setReviewNote(""); setComments([]); setEditing(false); }} />
          <div style={{ width: 580, maxWidth: "92vw", background: "#fff", overflowY: "auto", padding: 32, animation: "slide-in 0.25s ease", boxShadow: "-8px 0 32px rgba(0,0,0,.08)", fontFamily: "'Outfit','Noto Sans SC',sans-serif" }}>

            {/* Header with edit button */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: "#1C1917" }}>{editing ? t.editTitle : t.detailTitle}</h2>
              <div style={{ display: "flex", gap: 8 }}>
                {!editing && (
                  <button onClick={startEditing} className="btn" style={{ padding: "6px 14px", borderRadius: 8, border: "1.5px solid #E7E5E4", background: "#fff", fontSize: 12, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, color: "#57534E" }}>
                    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    {t.editBtn}
                  </button>
                )}
                <button onClick={() => { setSelected(null); setReviewNote(""); setComments([]); setEditing(false); }} style={{ border: "none", background: "#F5F4F0", width: 32, height: 32, borderRadius: 8, cursor: "pointer", fontSize: 16, color: "#78716C", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
              </div>
            </div>

            {editing ? (
              /* ========== EDIT MODE ========== */
              <div>
                <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#A8A29E", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 6 }}>{t.contentType}</label>
                    <div style={{ display: "flex", gap: 6 }}>
                      {[{ k: "blog", l: t.typeBlog },{ k: "wechat", l: t.typeWechat }].map((tp) => (
                        <button key={tp.k} onClick={() => setEditData({ ...editData, content_type: tp.k })} className="btn" style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: "pointer", border: editData.content_type === tp.k ? "1.5px solid #1C1917" : "1.5px solid #E7E5E4", background: editData.content_type === tp.k ? "#1C1917" : "#fff", color: editData.content_type === tp.k ? "#fff" : "#57534E" }}>{tp.l}</button>
                      ))}
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#A8A29E", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 6 }}>{t.contentLang}</label>
                    <div style={{ display: "flex", gap: 6 }}>
                      {[{ k: "zh", l: "中文", bg: "#FEF3C7", c: "#92400E", bc: "#F59E0B" },{ k: "en", l: "EN", bg: "#DBEAFE", c: "#1E40AF", bc: "#3B82F6" },{ k: "bi", l: "BI", bg: "#EDE9FE", c: "#5B21B6", bc: "#8B5CF6" }].map((l) => (
                        <button key={l.k} onClick={() => setEditData({ ...editData, lang: l.k })} className="btn" style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: "pointer", border: editData.lang === l.k ? `1.5px solid ${l.bc}` : "1.5px solid #E7E5E4", background: editData.lang === l.k ? l.bg : "#fff", color: editData.lang === l.k ? l.c : "#57534E" }}>{l.l}</button>
                      ))}
                    </div>
                  </div>
                </div>
                <input value={editData.title} onChange={(e) => setEditData({ ...editData, title: e.target.value })} placeholder={t.phTitle}
                  style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "1.5px solid #E7E5E4", fontSize: 15, fontWeight: 500, marginBottom: 12, fontFamily: "'Outfit','Noto Sans SC'", color: "#1C1917" }} />
                <EditorToolbar taRef={editTextareaRef} body={editData.body} setBody={(v) => setEditData({ ...editData, body: v })} isEdit={true} />
                {!editPreview ? (
                  <div onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={(e) => handleDrop(e, true)}
                    style={{ border: `1.5px ${dragOver ? "dashed" : "solid"} ${dragOver ? "#34D399" : "#E7E5E4"}`, borderRadius: 10, marginBottom: 12 }}>
                    <textarea ref={editTextareaRef} value={editData.body} onChange={(e) => setEditData({ ...editData, body: e.target.value })}
                      onPaste={(e) => handlePaste(e, true)} rows={14} placeholder={t.phBody}
                      style={{ width: "100%", padding: "12px 16px", border: "none", borderRadius: 10, fontSize: 14, resize: "vertical", fontFamily: "'Outfit','Noto Sans SC'", lineHeight: 1.7, color: "#1C1917", background: "transparent", outline: "none", minHeight: 240 }} />
                  </div>
                ) : (
                  <div style={{ border: "1.5px solid #E7E5E4", borderRadius: 10, padding: "16px 20px", marginBottom: 12, minHeight: 240, fontSize: 14, lineHeight: 1.8, color: "#44403C" }}
                    dangerouslySetInnerHTML={{ __html: renderBody(editData.body) }} />
                )}
                <input value={editData.tags} onChange={(e) => setEditData({ ...editData, tags: e.target.value })} placeholder={t.phTags}
                  style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "1.5px solid #E7E5E4", fontSize: 13, marginBottom: 20, fontFamily: "'Outfit','Noto Sans SC'", color: "#57534E" }} />
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={handleSaveEdit} disabled={saving} className="btn" style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: "#1C1917", color: "#fff", fontSize: 13, fontWeight: 500, cursor: saving ? "wait" : "pointer", opacity: saving ? 0.7 : 1 }}>{saving ? "..." : t.save}</button>
                  <button onClick={() => setEditing(false)} className="btn" style={{ padding: "10px 20px", borderRadius: 10, border: "1.5px solid #E7E5E4", background: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer", color: "#57534E" }}>{t.cancel}</button>
                </div>
              </div>
            ) : (
              /* ========== VIEW MODE ========== */
              <>
                <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
                  {(() => { const st = statusStyle[selected.review_status] || statusStyle.pending; return <span className="chip" style={{ background: st.bg, color: st.color }}><span style={{ width: 5, height: 5, borderRadius: "50%", background: st.dot }} />{statusStyle.pending === st ? t.statusPending : statusStyle.approved === st ? t.statusApproved : t.statusRejected}</span>; })()}
                  <span className="chip" style={{ background: "#F5F4F0", color: "#57534E" }}>{selected.content_type === "blog" ? t.typeBlog : t.typeWechat}</span>
                  {(() => { const cl = langStyle[selected.lang] || langStyle.zh; return <span className="chip" style={{ background: cl.bg, color: cl.color }}>{cl.label}</span>; })()}
                </div>
                <h3 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 600, lineHeight: 1.5, color: "#1C1917" }}>{selected.title}</h3>
                {selected.content_type === "wechat" && (
                  <button onClick={() => copyToClipboard(selected.body)} className="btn" style={{ padding: "7px 14px", borderRadius: 8, border: "1.5px solid #E7E5E4", background: "#fff", fontSize: 12, fontWeight: 500, cursor: "pointer", marginBottom: 16, display: "flex", alignItems: "center", gap: 6, color: "#57534E" }}>
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>{t.copyBody}
                  </button>
                )}
                <div style={{ background: "#FAFAF8", borderRadius: 12, border: "1px solid #ECEAE3", padding: "20px 24px", marginBottom: 24, fontSize: 14, lineHeight: 1.9, color: "#44403C" }}
                  dangerouslySetInnerHTML={{ __html: renderBody(selected.body) }} />

                {/* Review section */}
                {selected.review_status === "pending" && (
                  <div style={{ borderTop: "1px solid #F5F4F0", paddingTop: 20, marginBottom: 24 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#A8A29E", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 8 }}>{t.reviewNote}</label>
                    <textarea value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} placeholder={t.phNote} rows={3}
                      style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #E7E5E4", fontSize: 13, marginBottom: 16, resize: "vertical", fontFamily: "'Outfit','Noto Sans SC'", color: "#44403C", lineHeight: 1.6 }} />
                    <div style={{ display: "flex", gap: 10 }}>
                      <button onClick={() => handleApprove(selected)} disabled={publishing} className="btn" style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: "#059669", color: "#fff", fontSize: 13, fontWeight: 500, cursor: publishing ? "wait" : "pointer", opacity: publishing ? 0.7 : 1 }}>{publishing ? t.publishing : selected.content_type === "blog" ? t.approveWP : t.approve}</button>
                      <button onClick={() => handleReject(selected)} className="btn" style={{ padding: "10px 20px", borderRadius: 10, border: "1.5px solid #FECACA", background: "#FEF2F2", color: "#B91C1C", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>{t.reject}</button>
                    </div>
                  </div>
                )}

                {/* Rating & Comments */}
                <div style={{ borderTop: "1px solid #F5F4F0", paddingTop: 24 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#1C1917" }}>{t.ratingTitle}</h3>
                    {comments.length > 0 && (() => { const avg = (comments.reduce((s,c) => s+c.rating, 0) / comments.length).toFixed(1); return (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <StarRating value={Math.round(parseFloat(avg))} readonly size={14} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#1C1917" }}>{avg}</span>
                        <span style={{ fontSize: 12, color: "#A8A29E" }}>({comments.length} {comments.length === 1 ? t.review1 : t.reviews})</span>
                      </div>
                    ); })()}
                  </div>
                  <div style={{ background: "#FAFAF8", borderRadius: 12, border: "1px solid #ECEAE3", padding: 20, marginBottom: 20 }}>
                    <p style={{ margin: "0 0 12px", fontSize: 12, color: "#78716C" }}>{t.ratingSub}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                      <StarRating value={newRating} onChange={setNewRating} size={24} />
                      {newRating > 0 && <span style={{ fontSize: 13, fontWeight: 600, color: "#EAB308" }}>{newRating}/5</span>}
                    </div>
                    <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                      <input placeholder={t.phAuthor} value={newAuthor} onChange={(e) => setNewAuthor(e.target.value)}
                        style={{ width: 120, padding: "8px 12px", borderRadius: 8, border: "1.5px solid #E7E5E4", fontSize: 13, fontFamily: "'Outfit','Noto Sans SC'", color: "#1C1917" }} />
                      <input placeholder={t.phComment} value={newComment} onChange={(e) => setNewComment(e.target.value)}
                        style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1.5px solid #E7E5E4", fontSize: 13, fontFamily: "'Outfit','Noto Sans SC'", color: "#1C1917" }}
                        onKeyDown={(e) => { if (e.key === "Enter") handleSubmitComment(); }} />
                    </div>
                    <button onClick={handleSubmitComment} disabled={submittingComment} className="btn" style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: "#1C1917", color: "#fff", fontSize: 12, fontWeight: 500, cursor: submittingComment ? "wait" : "pointer", opacity: submittingComment ? 0.7 : 1 }}>{t.submitComment}</button>
                  </div>
                  {comments.length === 0 ? (
                    <p style={{ textAlign: "center", color: "#A8A29E", fontSize: 13, padding: "12px 0" }}>{t.noComments}</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {comments.map((c, i) => (
                        <div key={c.id} style={{ display: "flex", gap: 12, animation: `fade-up 0.2s ease ${i * 0.05}s both` }}>
                          <div style={{ width: 32, height: 32, borderRadius: "50%", background: `hsl(${(c.author||"").charCodeAt(0)*37%360},45%,65%)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 600, flexShrink: 0 }}>{(c.author||"?")[0].toUpperCase()}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                              <span style={{ fontSize: 13, fontWeight: 600, color: "#1C1917" }}>{c.author}</span>
                              <StarRating value={c.rating} readonly size={12} />
                              <span style={{ fontSize: 11, color: "#D6D3D1" }}>{fmtDateTime(c.created_at)}</span>
                            </div>
                            {c.comment && <p style={{ margin: 0, fontSize: 13, color: "#57534E", lineHeight: 1.5 }}>{c.comment}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
