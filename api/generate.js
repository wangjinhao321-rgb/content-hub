// 每天自动执行：读取招标 → 生成内容 → 写入内容库

export const config = {
  runtime: 'edge',
};

// ====== 配置区（后面拿到 key 后替换 ====== //
const BOSS_SUPABASE_URL = "https://padcujptiblrlnzpjxlc.supabase.co";
const BOSS_SUPABASE_KEY = "YOUR_BOSS_ANON_KEY";       // 老板给你后替换
const BOSS_TABLE_NAME   = "YOUR_TABLE_NAME";           // 老板告诉你表名后替换

const MY_SUPABASE_URL = "https://dfamerkhelwopkqvgmle.supabase.co";
const MY_SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmYW1lcmtoZWx3b3BrcXZnbWxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwNjcyODksImV4cCI6MjA5NDY0MzI4OX0.vkbDzKbIdBBzcnRJVn639032MckArlIFCWG4Oju7T3M";

const ANTHROPIC_API_KEY = "YOUR_ANTHROPIC_API_KEY";    // 注册后替换
// ============================================ //

// 从 Supabase 读取数据
async function supaFetch(url, key, path, options = {}) {
  const res = await fetch(`${url}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: options.method === "PATCH" ? "return=representation" : (options.method === "POST" ? "return=representation" : "return=minimal"),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase error ${res.status}: ${text}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// 调用 Claude API 生成内容
async function generateContent(bidInfo) {
  const prompt = `你是一位温度记录仪行业的资深市场专家。请根据以下招标信息，生成两篇文章。

## 招标信息
标题：${bidInfo.title || "未知"}
采购单位：${bidInfo.buyer || "未知"}
地区：${bidInfo.region || "未知"}
预算：${bidInfo.budget ? bidInfo.budget + "万元" : "未公布"}
截止日期：${bidInfo.deadline || "未知"}
关键词：${bidInfo.keywords || "温度记录仪"}
详情：${bidInfo.raw_content || bidInfo.content || bidInfo.description || "无详情"}

## 要求
请严格按照以下JSON格式返回，不要有任何其他内容：

{
  "wechat": {
    "title": "公众号推文标题（吸引眼球，15-25字）",
    "body": "公众号推文正文（800-1200字，含行业分析、产品优势、使用场景，分段落，语气专业但易读）",
    "summary": "一句话摘要",
    "tags": "标签1,标签2,标签3"
  },
  "blog": {
    "title": "SEO友好的博客标题（含关键词）",
    "body": "博客正文（1000-1500字，Markdown格式，含小标题，偏技术和解决方案角度，适合搜索引擎收录）",
    "summary": "SEO描述（150字以内）",
    "tags": "标签1,标签2,标签3"
  }
}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Claude API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  const text = data.content[0].text;

  // 提取 JSON（兼容有或没有 markdown 代码块的情况）
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Claude 返回格式异常");
  return JSON.parse(jsonMatch[0]);
}

// 主函数
export default async function handler(req) {
  // 安全检查：只允许 Vercel Cron 或带正确 token 的请求
  const authHeader = req.headers.get("authorization");
  const cronSecret = req.headers.get("x-vercel-cron");

  // Vercel Cron 会自动带 header，手动测试可以用 ?test=1
  const url = new URL(req.url);
  const isTest = url.searchParams.get("test") === "1";

  if (!cronSecret && !isTest) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // 检查配置是否已填写
    if (BOSS_SUPABASE_KEY === "YOUR_BOSS_ANON_KEY") {
      return new Response(JSON.stringify({
        error: "请先配置 BOSS_SUPABASE_KEY",
        status: "not_configured"
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (ANTHROPIC_API_KEY === "YOUR_ANTHROPIC_API_KEY") {
      return new Response(JSON.stringify({
        error: "请先配置 ANTHROPIC_API_KEY",
        status: "not_configured"
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 第1步：从老板 Supabase 读取最近的招标信息
    // 读取最近24小时内的新数据，最多20条
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const bids = await supaFetch(
      BOSS_SUPABASE_URL,
      BOSS_SUPABASE_KEY,
      `${BOSS_TABLE_NAME}?select=*&created_at=gte.${yesterday}&order=created_at.desc&limit=20`
    );

    if (!bids || bids.length === 0) {
      return new Response(JSON.stringify({
        message: "今天没有新的招标信息",
        count: 0,
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const results = [];

    // 第2步：逐条生成内容
    for (const bid of bids) {
      try {
        // 先检查是否已经为这条招标生成过内容（避免重复）
        const existing = await supaFetch(
          MY_SUPABASE_URL,
          MY_SUPABASE_KEY,
          `bid_leads?title=eq.${encodeURIComponent(bid.title || "")}&limit=1`
        );

        if (existing && existing.length > 0) {
          results.push({ title: bid.title, status: "skipped", reason: "已存在" });
          continue;
        }

        // 写入招标原始数据到我的 Supabase
        const savedBid = await supaFetch(MY_SUPABASE_URL, MY_SUPABASE_KEY, "bid_leads", {
          method: "POST",
          body: JSON.stringify({
            title: bid.title || "未知招标项目",
            source_url: bid.source_url || bid.url || null,
            region: bid.region || bid.province || null,
            buyer: bid.buyer || bid.purchaser || bid.company || null,
            budget: bid.budget || bid.amount || null,
            deadline: bid.deadline || bid.end_date || null,
            keywords: bid.keywords || null,
            raw_content: bid.raw_content || bid.content || bid.description || null,
            status: "processed",
          }),
        });

        const bidId = savedBid?.[0]?.id;

        // 调用 Claude 生成内容
        const content = await generateContent(bid);

        // 写入公众号推文
        await supaFetch(MY_SUPABASE_URL, MY_SUPABASE_KEY, "contents", {
          method: "POST",
          body: JSON.stringify({
            bid_lead_id: bidId || null,
            content_type: "wechat",
            title: content.wechat.title,
            body: content.wechat.body,
            summary: content.wechat.summary,
            tags: content.wechat.tags,
            review_status: "pending",
          }),
        });

        // 写入博客文章
        await supaFetch(MY_SUPABASE_URL, MY_SUPABASE_KEY, "contents", {
          method: "POST",
          body: JSON.stringify({
            bid_lead_id: bidId || null,
            content_type: "blog",
            title: content.blog.title,
            body: content.blog.body,
            summary: content.blog.summary,
            tags: content.blog.tags,
            review_status: "pending",
          }),
        });

        results.push({ title: bid.title, status: "success" });
      } catch (err) {
        results.push({ title: bid.title, status: "error", error: err.message });
      }
    }

    return new Response(JSON.stringify({
      message: `处理完成`,
      total: bids.length,
      results,
      time: new Date().toISOString(),
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({
      error: err.message,
      stack: err.stack,
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
