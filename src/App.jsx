import { useState, useEffect, useCallback } from "react";

const SUPABASE_URL = "https://dfamerkhelwopkqvgmle.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmYW1lcmtoZWx3b3BrcXZnbWxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwNjcyODksImV4cCI6MjA5NDY0MzI4OX0.vkbDzKbIdBBzcnRJVn639032MckArlIFCWG4Oju7T3M";

const WP_SITE = "YOUR_WORDPRESS_SITE";
const WP_USER = "YOUR_WP_USERNAME";
const WP_APP_PASSWORD = "YOUR_WP_APP_PASSWORD";

async function supaFetch(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: options.method === "PATCH" ? "return=representation" : "return=minimal",
      ...options.headers,
    },
  });
  if (!res.ok) throw new Error(`Supabase error: ${res.status}`);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function publishToWordPress(title, body, tags) {
  if (WP_SITE === "YOUR_WORDPRESS_SITE") return null;
  const res = await fetch(`${WP_SITE}/wp-json/wp/v2/posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Basic " + btoa(`${WP_USER}:${WP_APP_PASSWORD}`),
    },
    body: JSON.stringify({
      title,
      content: body,
      status: "publish",
      tags: [],
    }),
  });
  if (!res.ok) throw new Error("WordPress publish failed");
  return await res.json();
}

function markdownToHtml(md) {
  if (!md) return "";
  return md
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br/>")
    .replace(/^/, "<p>")
    .replace(/$/, "</p>");
}

const STATUS_MAP = {
  pending: { label: "待审核", color: "#BA7517", bg: "#FAEEDA" },
  approved: { label: "已通过", color: "#0F6E56", bg: "#E1F5EE" },
  rejected: { label: "已拒绝", color: "#A32D2D", bg: "#FCEBEB" },
};

const TYPE_MAP = {
  wechat: { label: "公众号", icon: "✉" },
  blog: { label: "博客", icon: "✍" },
};

export default function App() {
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [reviewNote, setReviewNote] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [toast, setToast] = useState(null);
  const [tab, setTab] = useState("contents");
  const [leads, setLeads] = useState([]);
  const [addMode, setAddMode] = useState(false);
  const [newContent, setNewContent] = useState({
    content_type: "blog",
    title: "",
    body: "",
    summary: "",
    tags: "",
  });

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchContents = useCallback(async () => {
    setLoading(true);
    try {
      let path = "contents?select=*,bid_leads(title,buyer,region)&order=created_at.desc";
      if (filter !== "all") path += `&review_status=eq.${filter}`;
      const data = await supaFetch(path);
      setContents(data || []);
    } catch (e) {
      showToast("加载失败: " + e.message, "error");
    }
    setLoading(false);
  }, [filter]);

  const fetchLeads = useCallback(async () => {
    try {
      const data = await supaFetch("bid_leads?order=created_at.desc&limit=50");
      setLeads(data || []);
    } catch (e) {
      showToast("加载招标信息失败", "error");
    }
  }, []);

  useEffect(() => {
    fetchContents();
  }, [fetchContents]);

  useEffect(() => {
    if (tab === "leads") fetchLeads();
  }, [tab, fetchLeads]);

  const handleApprove = async (item) => {
    setPublishing(true);
    try {
      let wpId = null;
      if (item.content_type === "blog") {
        const wpRes = await publishToWordPress(item.title, markdownToHtml(item.body), item.tags);
        if (wpRes) wpId = String(wpRes.id);
      }
      await supaFetch(`contents?id=eq.${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          review_status: "approved",
          reviewer_note: reviewNote || null,
          wp_post_id: wpId,
          published_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }),
      });
      showToast(
        item.content_type === "blog" && wpId
          ? "已通过并发布到 WordPress!"
          : "已通过!"
      );
      setSelected(null);
      setReviewNote("");
      fetchContents();
    } catch (e) {
      showToast("操作失败: " + e.message, "error");
    }
    setPublishing(false);
  };

  const handleReject = async (item) => {
    try {
      await supaFetch(`contents?id=eq.${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          review_status: "rejected",
          reviewer_note: reviewNote || null,
          updated_at: new Date().toISOString(),
        }),
      });
      showToast("已拒绝");
      setSelected(null);
      setReviewNote("");
      fetchContents();
    } catch (e) {
      showToast("操作失败: " + e.message, "error");
    }
  };

  const handleAddContent = async () => {
    if (!newContent.title || !newContent.body) {
      showToast("标题和正文不能为空", "error");
      return;
    }
    try {
      await supaFetch("contents", {
        method: "POST",
        body: JSON.stringify({
          ...newContent,
          review_status: "pending",
        }),
      });
      showToast("内容已添加，等待审核");
      setAddMode(false);
      setNewContent({ content_type: "blog", title: "", body: "", summary: "", tags: "" });
      fetchContents();
    } catch (e) {
      showToast("添加失败: " + e.message, "error");
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => showToast("已复制到剪贴板"));
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#FAFAF8",
        fontFamily: "'DM Sans', 'Noto Sans SC', sans-serif",
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Noto+Sans+SC:wght@400;500;600&display=swap"
        rel="stylesheet"
      />

      {toast && (
        <div
          style={{
            position: "fixed",
            top: 20,
            right: 20,
            zIndex: 999,
            padding: "12px 20px",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 500,
            color: toast.type === "error" ? "#791F1F" : "#085041",
            background: toast.type === "error" ? "#FCEBEB" : "#E1F5EE",
            border: `1px solid ${toast.type === "error" ? "#F09595" : "#5DCAA5"}`,
            animation: "slideIn 0.3s ease",
          }}
        >
          {toast.msg}
        </div>
      )}

      <style>{`
        @keyframes slideIn { from { transform: translateX(100px); opacity: 0 } to { transform: translateX(0); opacity: 1 } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
        .card-hover { transition: all 0.2s ease; }
        .card-hover:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.06); }
      `}</style>

      {/* Header */}
      <header
        style={{
          padding: "20px 32px",
          borderBottom: "1px solid #ECEAE3",
          background: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: "linear-gradient(135deg, #1D9E75, #0F6E56)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 18,
              fontWeight: 600,
            }}
          >
            T
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "#2C2C2A", letterSpacing: -0.3 }}>
              内容管理中心
            </h1>
            <p style={{ margin: 0, fontSize: 12, color: "#888780" }}>温度记录仪 · 招投标内容生产</p>
          </div>
        </div>
        <button
          onClick={() => setAddMode(true)}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: "none",
            background: "#1D9E75",
            color: "#fff",
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          + 添加内容
        </button>
      </header>

      {/* Tabs */}
      <div style={{ padding: "0 32px", background: "#fff", borderBottom: "1px solid #ECEAE3" }}>
        <div style={{ display: "flex", gap: 0 }}>
          {[
            { key: "contents", label: "内容库" },
            { key: "leads", label: "招标线索" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: "12px 20px",
                border: "none",
                borderBottom: tab === t.key ? "2px solid #1D9E75" : "2px solid transparent",
                background: "none",
                fontSize: 14,
                fontWeight: tab === t.key ? 500 : 400,
                color: tab === t.key ? "#1D9E75" : "#888780",
                cursor: "pointer",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <main style={{ maxWidth: 960, margin: "0 auto", padding: "24px 32px" }}>
        {/* Add content modal */}
        {addMode && (
          <div
            style={{
              marginBottom: 24,
              background: "#fff",
              borderRadius: 12,
              border: "1px solid #ECEAE3",
              padding: 24,
              animation: "fadeIn 0.3s ease",
            }}
          >
            <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 500 }}>添加新内容</h3>
            <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
              {["blog", "wechat"].map((t) => (
                <button
                  key={t}
                  onClick={() => setNewContent({ ...newContent, content_type: t })}
                  style={{
                    padding: "6px 16px",
                    borderRadius: 20,
                    border: `1px solid ${newContent.content_type === t ? "#1D9E75" : "#D3D1C7"}`,
                    background: newContent.content_type === t ? "#E1F5EE" : "#fff",
                    color: newContent.content_type === t ? "#085041" : "#5F5E5A",
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  {TYPE_MAP[t].icon} {TYPE_MAP[t].label}
                </button>
              ))}
            </div>
            <input
              placeholder="文章标题"
              value={newContent.title}
              onChange={(e) => setNewContent({ ...newContent, title: e.target.value })}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 8,
                border: "1px solid #D3D1C7",
                fontSize: 14,
                marginBottom: 12,
                boxSizing: "border-box",
              }}
            />
            <textarea
              placeholder="文章正文（支持 Markdown）"
              value={newContent.body}
              onChange={(e) => setNewContent({ ...newContent, body: e.target.value })}
              rows={8}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 8,
                border: "1px solid #D3D1C7",
                fontSize: 14,
                marginBottom: 12,
                resize: "vertical",
                boxSizing: "border-box",
                fontFamily: "inherit",
              }}
            />
            <input
              placeholder="标签（逗号分隔，如：冷链,医药,招标）"
              value={newContent.tags}
              onChange={(e) => setNewContent({ ...newContent, tags: e.target.value })}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 8,
                border: "1px solid #D3D1C7",
                fontSize: 14,
                marginBottom: 16,
                boxSizing: "border-box",
              }}
            />
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={handleAddContent}
                style={{
                  padding: "8px 20px",
                  borderRadius: 8,
                  border: "none",
                  background: "#1D9E75",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                提交
              </button>
              <button
                onClick={() => setAddMode(false)}
                style={{
                  padding: "8px 20px",
                  borderRadius: 8,
                  border: "1px solid #D3D1C7",
                  background: "#fff",
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                取消
              </button>
            </div>
          </div>
        )}

        {tab === "contents" && (
          <>
            {/* Filters */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {[
                { key: "all", label: "全部" },
                { key: "pending", label: "待审核" },
                { key: "approved", label: "已通过" },
                { key: "rejected", label: "已拒绝" },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  style={{
                    padding: "6px 16px",
                    borderRadius: 20,
                    border: `1px solid ${filter === f.key ? "#1D9E75" : "#D3D1C7"}`,
                    background: filter === f.key ? "#E1F5EE" : "#fff",
                    color: filter === f.key ? "#085041" : "#5F5E5A",
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Content list */}
            {loading ? (
              <p style={{ textAlign: "center", color: "#888780", padding: 40 }}>加载中...</p>
            ) : contents.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "60px 20px",
                  color: "#888780",
                  background: "#fff",
                  borderRadius: 12,
                  border: "1px solid #ECEAE3",
                }}
              >
                <p style={{ fontSize: 16, marginBottom: 8 }}>还没有内容</p>
                <p style={{ fontSize: 13 }}>点击右上角"添加内容"开始创建</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {contents.map((item, i) => {
                  const st = STATUS_MAP[item.review_status] || STATUS_MAP.pending;
                  const tp = TYPE_MAP[item.content_type] || TYPE_MAP.blog;
                  return (
                    <div
                      key={item.id}
                      className="card-hover"
                      onClick={() => {
                        setSelected(item);
                        setReviewNote(item.reviewer_note || "");
                      }}
                      style={{
                        background: "#fff",
                        borderRadius: 12,
                        border: "1px solid #ECEAE3",
                        padding: "16px 20px",
                        cursor: "pointer",
                        animation: `fadeIn 0.3s ease ${i * 0.05}s both`,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                            <span
                              style={{
                                fontSize: 11,
                                padding: "2px 8px",
                                borderRadius: 10,
                                background: st.bg,
                                color: st.color,
                                fontWeight: 500,
                              }}
                            >
                              {st.label}
                            </span>
                            <span
                              style={{
                                fontSize: 11,
                                padding: "2px 8px",
                                borderRadius: 10,
                                background: "#F1EFE8",
                                color: "#5F5E5A",
                              }}
                            >
                              {tp.icon} {tp.label}
                            </span>
                            {item.wp_post_id && (
                              <span
                                style={{
                                  fontSize: 11,
                                  padding: "2px 8px",
                                  borderRadius: 10,
                                  background: "#E6F1FB",
                                  color: "#0C447C",
                                }}
                              >
                                WP #{item.wp_post_id}
                              </span>
                            )}
                          </div>
                          <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 500, color: "#2C2C2A" }}>
                            {item.title}
                          </h3>
                          {item.bid_leads && (
                            <p style={{ margin: 0, fontSize: 12, color: "#888780" }}>
                              {item.bid_leads.buyer} · {item.bid_leads.region}
                            </p>
                          )}
                        </div>
                        <span style={{ fontSize: 12, color: "#B4B2A9", whiteSpace: "nowrap" }}>
                          {new Date(item.created_at).toLocaleDateString("zh-CN")}
                        </span>
                      </div>
                      {item.tags && (
                        <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                          {item.tags.split(",").map((tag) => (
                            <span
                              key={tag}
                              style={{
                                fontSize: 11,
                                padding: "1px 8px",
                                borderRadius: 8,
                                background: "#FAEEDA",
                                color: "#854F0B",
                              }}
                            >
                              {tag.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {tab === "leads" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {leads.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "60px 20px",
                  color: "#888780",
                  background: "#fff",
                  borderRadius: 12,
                  border: "1px solid #ECEAE3",
                }}
              >
                <p style={{ fontSize: 16 }}>暂无招标线索</p>
              </div>
            ) : (
              leads.map((lead, i) => (
                <div
                  key={lead.id}
                  style={{
                    background: "#fff",
                    borderRadius: 12,
                    border: "1px solid #ECEAE3",
                    padding: "16px 20px",
                    animation: `fadeIn 0.3s ease ${i * 0.05}s both`,
                  }}
                >
                  <h3 style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 500, color: "#2C2C2A" }}>
                    {lead.title}
                  </h3>
                  <div style={{ display: "flex", gap: 16, fontSize: 13, color: "#888780", flexWrap: "wrap" }}>
                    {lead.buyer && <span>采购方: {lead.buyer}</span>}
                    {lead.region && <span>地区: {lead.region}</span>}
                    {lead.budget && <span>预算: {lead.budget}万</span>}
                    {lead.deadline && <span>截止: {lead.deadline}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* Detail panel */}
      {selected && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <div
            style={{ flex: 1, background: "rgba(0,0,0,0.3)" }}
            onClick={() => {
              setSelected(null);
              setReviewNote("");
            }}
          />
          <div
            style={{
              width: 540,
              maxWidth: "90vw",
              background: "#fff",
              overflowY: "auto",
              padding: "28px 32px",
              animation: "slideIn 0.3s ease",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 500 }}>内容详情</h2>
              <button
                onClick={() => {
                  setSelected(null);
                  setReviewNote("");
                }}
                style={{
                  border: "none",
                  background: "none",
                  fontSize: 20,
                  cursor: "pointer",
                  color: "#888780",
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <span
                style={{
                  fontSize: 12,
                  padding: "3px 10px",
                  borderRadius: 10,
                  background: STATUS_MAP[selected.review_status]?.bg,
                  color: STATUS_MAP[selected.review_status]?.color,
                  fontWeight: 500,
                }}
              >
                {STATUS_MAP[selected.review_status]?.label}
              </span>
              <span
                style={{
                  fontSize: 12,
                  padding: "3px 10px",
                  borderRadius: 10,
                  background: "#F1EFE8",
                  color: "#5F5E5A",
                  marginLeft: 8,
                }}
              >
                {TYPE_MAP[selected.content_type]?.label}
              </span>
            </div>

            <h3 style={{ margin: "0 0 16px", fontSize: 17, fontWeight: 500, lineHeight: 1.4 }}>{selected.title}</h3>

            {/* Copy button for WeChat */}
            {selected.content_type === "wechat" && (
              <button
                onClick={() => copyToClipboard(selected.body)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 8,
                  border: "1px solid #D3D1C7",
                  background: "#fff",
                  fontSize: 13,
                  cursor: "pointer",
                  marginBottom: 16,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                📋 复制正文到剪贴板
              </button>
            )}

            {/* Content preview */}
            <div
              style={{
                background: "#FAFAF8",
                borderRadius: 10,
                border: "1px solid #ECEAE3",
                padding: "20px 24px",
                marginBottom: 20,
                fontSize: 14,
                lineHeight: 1.8,
                color: "#2C2C2A",
                whiteSpace: "pre-wrap",
              }}
            >
              {selected.body}
            </div>

            {/* Review section */}
            {selected.review_status === "pending" && (
              <div
                style={{
                  borderTop: "1px solid #ECEAE3",
                  paddingTop: 20,
                }}
              >
                <label style={{ fontSize: 13, color: "#888780", display: "block", marginBottom: 8 }}>
                  审核备注（可选）
                </label>
                <textarea
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder="输入备注..."
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: "1px solid #D3D1C7",
                    fontSize: 14,
                    marginBottom: 16,
                    resize: "vertical",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                  }}
                />
                <div style={{ display: "flex", gap: 12 }}>
                  <button
                    onClick={() => handleApprove(selected)}
                    disabled={publishing}
                    style={{
                      padding: "10px 24px",
                      borderRadius: 8,
                      border: "none",
                      background: "#1D9E75",
                      color: "#fff",
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: publishing ? "wait" : "pointer",
                      opacity: publishing ? 0.7 : 1,
                    }}
                  >
                    {publishing ? "发布中..." : selected.content_type === "blog" ? "✓ 通过并发布到WP" : "✓ 通过"}
                  </button>
                  <button
                    onClick={() => handleReject(selected)}
                    style={{
                      padding: "10px 24px",
                      borderRadius: 8,
                      border: "1px solid #F09595",
                      background: "#fff",
                      color: "#A32D2D",
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: "pointer",
                    }}
                  >
                    ✗ 拒绝
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
