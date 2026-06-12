import { useState, useEffect, useCallback, useRef } from "react";

const SB = "https://dfamerkhelwopkqvgmle.supabase.co";
const SK = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmYW1lcmtoZWx3b3BrcXZnbWxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwNjcyODksImV4cCI6MjA5NDY0MzI4OX0.vkbDzKbIdBBzcnRJVn639032MckArlIFCWG4Oju7T3M";
const BUCKET = "content-images";
const WP_SITE = "YOUR_WORDPRESS_SITE";
const WP_USER = "YOUR_WP_USERNAME";
const WP_PASS = "YOUR_WP_APP_PASSWORD";
const LOGO = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAATGUlEQVR4nO1ae3SVxbXfM/N933kkJwmBPEmIJECBBKKAVwgvhVahPKSiRCpQbBFrq6il2t7LsvWu2lZvKyBLQVkUbi1IoGDLqwQREKgYnoGA4U0IkPeDJIdzzveYmX3/+ELMSU5OArpWV9e6e7FYSb7vm9m/PXvv2fObTRAR/p2F/qsV+Lry/wD+1aJ8I6MgIqL9PwIAIQQIEAAgxH4MCAiAiPafCCWEALGffj0hdx/ECBJRSqSUUHo3qqBEIZEQQrendY7kbAIgoBCoKAWieduGm74rJ/aVLdSUldWVlTXW1/iavaRhcc4FIVFU6nIokR+3ePaJncnR679g+fbv3bt3bGxsRMuQnN+lIe4MAEJIIZEQQcpJKQkpVV1c/+vRvY/evlpa5OAAOIGF1x9a/sYwSJCKlACQBEYUxOlsE78dxFb+UgjNL8+tI5Z5/8/LjhIiN7YL7/DxIwBu3daOHPnx+oJ8fAHQABYBRVMaa50ZsVrv1yEERIYQkpN0CDYO7o8ePB9ubNj+5YcKRUUfR2RXOl+P5n5aFl9t4/Bkl+8eeKBxcUuVXEJmcIKEpJSUspIIx0s2aN48s5M4SwFJKztnbZ8oFEQAMAEO1PCJq5fIf4Gvqf/Hp1OEP3C2k0LVdU2bvJp75co2iyI6mSkNWU9JlEKkFIkZJIyBRhGaR4RRe5GCNc1/2EaK0oKY3pERUhBKEUJDUkISR2EkVZXXmN17TIIVf1w1N3hg3tHqJ2U8RKcOlquIIJxwVvRWi1vICW8RAAoAn82vDcz8JfZdVnbZb9ck5CUTYDkGhFCHE7VAJyUgRIHWVtT/97hN//6sMUIdCaIZMOaE2ELVhiYICuQORADJJaKqqEqCBgAEAAkBxARWLKmrqwGQuPQk3XLSxfuLjt64BkDuGbJKcXHtR5u+dLmc0hCWJcIEECUk4NNzR/dtE6B9a1cSc1JKhOCGYUlZWlZXUXmzqrq+sclXV+P3+QPo8IkmM9Lj9XSLjolSVy9y+qoKr5GqqhKkOb/hdhpMCI9EQzex8sK6krKGpkZfY4NJCRFwO5wQEBCA7CYN0ZaAsyE8/cSB5cuPoIdGquoVDYNnJjj3Pc0cTvdhYaU/mJIuAjQiSHy2b0v4i2w7NUgpCWWKIjnnUgoABwBuIZEURCGIACACUEAiETkXhBBECUB1ndv0T2SUST0mEJEQdD7CdpCcm2bzvn3P50jK3vUAfwHwAxoAbPzLqR07ivfuLQkEBCWKEJJSKSUAgm1hJDKsTQcKdOZsAKqUJJJ4VYUsOnv5bMm50ooGn5cryoXL5KbLrXGJJmkqLJ7R0Gj6/YyQEiPojO1/SuonYZ3kLAZZfGDB6dYKKCGUYjQFvQPgBlAAjJB14W9vK/wlBk3vBfcA8EMaijb99TiAQ+9bCb05I7JcEa6V763f/37BdQOSkiJGjejzp5dyBvdNB4CVq4pPnbpBKXjcGr0tsmNV4Ei8cvnX31a/NpjdiNFWQpjlGh4+MvxmBvAFDAKgKY1q8EGC0oIYJKxmMoJISIoUWE6E2IkZ3r83f8+ug5W1PdpBd1+/KyX9ywv2Y86Nq06E6c9B0t2x0dESsP3EEInJjX09nslRqpJcQ5dN1ITE1+Ye09vUhTZIe6qTiCkQCnS0pS3fnmAEBdAoSQzk2v6woLy7auBKRU8Tl6t+oI4jZMoECAcIpbRp7iBnacLJn87ealxUWIeE0O8+nJy30xPdHy+Bqo8h7pNbPHPQCY+FCiUBJ/q/RVXSd1N3CdUAYAxVtGa/4kbWIjxZEqrJAEQiGZMCK4sVlt7aue1aY77lbCqeROHf1lXjcjCnRYDdK0KIhxMPGfrn8y6OMahqW2UWbNyCUqGLYjm5FhY3b16+2FYYqV0AEYaakYC0tVcg3D0BIae3YfhIYuYOidZh/AYBe0bD46JvdR48sLStbVBm9P2Xv5Y5lQW3wbWNnAaVpzHi28VQkI7vdMjxmxRBk/v7zKekxYS4q2guBNkxaIUXEUuLPKc/fgijrWqB4V8aslP9eUmGLGTX1Xr/fy/ysqOy2ZZqKAk9NHfGP/5U7HM5bbhXyv7cPQAhLSBSiLIy6xdz1yf38F8quQ4QAcCZUxghKSSBlAAhApH8+a8dPny2rJR6YVlBxcNH3EsI7twJkJC+ByOj01Mnt3SnU7UfvZC8VPPlV5A4V0cUB/l+dGTKCwt+mJmZKqVkjIZhPzslVQDgJrjXr9i/bFqd0pnICGMhw0Sk5qf8GNmKEAApxadEU6xUVjEWaUjPg6e/e+/FbVfrIyKcuv+uwclpRYe/Xp82hZB7eYUuAFNVGWPOQMCzYN6w+8Z9K8QVbSBAK/z1db7F7+6ZMW0rpWrv3u7lyGO+PHqO7NDXB/RLj4uKbKhoSIyLPn+hYO6c1R+tPysE7r9Q4/GAgZJZRkHWpDH/82K/4cN6EeI/euTaw0/MKThyMSIiIuBHwnkgYD3+xNiNG+bExUVIiYxRex+0wyiUfhFCHnnk3T2fyri4CEKAEh1AbUdFtNX3hBI78E0pPZ5YEuOnxV8AUFXTWiKBUiLlpOBUpUe3mAM0Kt3/hMWBkkaSKDY/PjMPGXrw3TjCOE6ecOBb/RJM0+z8uggAMioi0uEgtu+24gUQoK9VtxCVlBCfNxAbm5CYYB+hD+moiJhW1S1Eor+YPn/DhYndbQk8crE6NibySnkDVcJ5LQGA2nZdXV0tJfZqBHIJ+D8l0EBKoZQoihYRH1NR7dWUbsLk7avIWgjjhCBVFZWxJt8sLjJN08EYq29oSmjJhfauoqoMABobG1oGbYMZQEpkTLlaUn3uxBUhYMv2K598cu7l4SkhDxkty9o3TENcjLfJjE8bTWj7JQzuogCAqEtJLl6s3LB+D6C5KjGVYhgAaQK7Y8lUB40+OD1rZX2DT1MVCWAQ+JoAAKRZ7KQ8dcB89sw1yqjb4Xhg3BN5SxePGJneZuCuAUjBoiisvNT7/aeDz18l0g2wRKc5BKYU5+L2H2EJv3MJBpfPLH7/9t/Mf9Kbfdujvi0uT14qrauVQGD8fqBPBKHSAgldwEkPz7H5VhbQbsGIEIRiRcC9sH8v8+WT0tJje8eG+J+uqMxRlhBlmFYiMJuYjVNaZqmqmiE0rTkEAAoYaIm/5cdX12u4FJyXFU8eI4aqjJr8CCC+sCkxIaYdZe1uIbXkfMFxbOv1r96aZxfBVRfN0xB43LU1OkDV2cN+7rj3R2o7DOCMljp76YuLf9kpYz1OIYx6VNNklLuS+7+/5QJnCMiSgmKIoGYUlrXXu+P1iq22gBkJRe2KcH2o3YuQ8lKqfmSdxZuRmxs2JFdRUTCsMuRpBR+C3nByXJQEaJFCg5h8tS0Myt6T8btGLcJ9fIxTzQEsM3THfR0e7+aYMD3CNFMD2RmGjFxbtb7KgtKOhbVjXANL6w6cFmAQgYyxuMCfbVwQ1qmFBYWFlSbCtTe1RxP2PL0N5bLyJQW5a9dMeemlu/99b5K3F7dYeYnJ4vQZIm1pY/d2P0RRuKkLH59z73e3pCdmHj9S9q+N17OxcGJPRFR/35L5wsPjV3/s4NkKw+F2ECRgmCblr9rFoKt38IW2MUMIUVRiWRwIAeAApBerK7OV0u3AASAmJDq+N3FbTecuVLtbYhVVU0IYZi80YREhq5JJn8dYM4ZlAJqixaLz1b5BKUjY0AXVK+Xy0+X3l/GJfPfp5oobACGlIYSCIKSEkB2Y0b2Ojo+P7tM3YfMnZ4tP+jStsdFQLqzBdz7buXdrfk5g8rKg/3y8+zylMT0S/B3g+RBKnAxZPyNhwKL0P/9EWpSz4NLZn72+5/Pnr/w/Oxnly97eMKEDKdDbe6LawvADirOZXmp+clPNuxYX8LQFUrwcGo7BUpFAAxT5j4x7PU3p0RG6oKH+uoKyj4qFB4/lj9g4VcOhxa2YSQhLZRt2x+O+Cyl1Tm9g5GRa0aBAjXAk+9l9ct8+x6u0MK09U2JfJZFsLsWN8GEpZSXZcHlhRVPmJBrL/4PLIV8T3P3nP2TKWi0KIzvy87Y2qLlq8u+MNvl/n8oqNsIwb1Z2G/2Y2qm2L5f/X+r8N0fTgqHLFJCkVlvnzEqMj3r/HfnT29U+Pfa4hD3jxk9Y/b8nBce0sQgAPHi5Wt+n5I3f31RYQ3nbkWJkYKH8xpCmKZJCevdp/dnexfExXYjhNoH5HBd7B0DoAScLi0rM/HTT4rKKg1bW2kuYHJuUUJ8Xr+xaOKE+3OyYxLiO1OoSx1FxKDYp5Zl6bo/JsaMMSYMswNmzpkdJmWaKcIQ6pZRfb7CJ0ekNkl/ypb7LZ44UBT76TnfnrkFgGJcz0Rl0tr6vZEO0u1VY11tb6T50q/+JI+eHCqoqKWxLR4dQiNKt40mKjJ2g+j7dw0d8XdElOw6KnUmJhIVV46/7vk5X/OfHDM99J1NI2biDz3/ppJ44eSvJE+c1dI8numjJPcnJLr8RCFhXS5piY5TGJh4f505Jc0dFqpRRuxJtb3Bh2x5dAQjKIPRFKfVAUkwk5Lzp0mJCXHR9RdK8/KOnz7+pXj82PWqK5d+/tM7L5ZzQBIVpQPwpUvXbAbQvp5TRhGgpqbBPkNGRDCnS7PpNUoJpeTMmUrEEBQVIl4rK7UjqcNzFqJyO33rnKfKCcNyhh6rH0v5YaYXFVcHYx/lkJI4FRVaGBg7N17Q1bOz78/cRo/c2r/uH/cuz36nUzrVGJSgGVMK4q2BXJAbbH17LQUJbIkmxdAxADIyYkGgg+laoJLjlQ3+00TE0I8/3Z3ys4b0yqpNxWFKNRR3xCIjdIQSRvB25uB5fLLafNGKoT2cHNKW9FPCSnR5bAXHB54L36Bk5frUlKd1bXWug9O5u++4NWTN6w/JyV89jnJf/jB2QvqEovz87fPhwIOC7ey+qwkQalqiqMuvb3+zHaocYbhtnqSkAIKfLrRDC/9F+9c0Z9vR9Y72/46czVkTEeIpPe0E0aUrkr34x5oUFOTExcN/YPx09UqKqSpjuAiCSfP27mbNnD0FE1o55DwGAMYWx/A9P/uiFzZSoHclDhQRdIKN0TOb4FxcOy85OlxIN05wwcdWundedbpeiEMPwDRuatnnz0wmJkYh476FLz7+49ebNgMMZIUU4FjUhxNCN5OToN9+cOD5vSEj+sUMAiIiEoJTkHy6fPG1VIKAqigqoIOKdKE5JCKUg2JKZB9/59tIpk7IYo7oufzB37e5d5xyOaEpBSqGq1B8wBw1O+s1rE8eN7xvxla1RXNr2dq0+8ItfbV29/jBjkSEHEglBxhycN+blfTlubhgwOjAr88ykrKUrHPJR6taOj/vOFELApwcvnThxPW+X34uKLjOOTJGKIOICA0R09JiF77yYEZGChch6sswLJRNInIuc3LS3l82A0Fv23LqFxPnEBIBEE2I2OUupYQQy+TZ2cmbNz+Z1CMKEBjDa9f9lNICsH9b5j+xLOrFhUL/e+PN8KUiJTJGEDXO5X89e4Bbpr5tBynROEHaEXSfzXRz04+I1LbVPvPcqBdfmsi5IJS2f0dIq/j8xm//a+/id3YxVkpIx2bfbhmGEWJ6xhiAFfAGZj15f07OvaHxizDI6g5KBQBkjJacKX/7d/lbtp5u8psqbfCqWn79p3Gef/77EydmjR+X8cT0wQDwzqLdy5YedjgdUsqQFBsAUEIcDvXgoXI7HEMCgNaFI5GSwu+WvWZ3BINYIpIiAhCuak5pO5PXx/4z+JnmMa6D/35lxGBN07ILVqOF7JHI8cXFdXOeXB8IGLYfQAACUMoBAJf3PwUAisoaAbBLvQKlpKGh4YF/C1Kg9mthIiqI1DE5Z/8Pc3YdOYIOITrsZ8V2wd6dCNlXCKKUqIpDKaUAUF3d5HG7GKeKov70pyNnzp2ZsjUjf/eMiIjINhFwN/3bAECCZ5n+BYu2v/X2XodTRxROl6NT9Q0hYJm+jIykF14YmZGR2MV50N3uB21f4OTcAjTsDGaYfGNe4Z/+fPTCuTpFiXA4lI5IakWh/oAxdmzmuvVPJiVF38UH/v8AEJEQKiU2NJqvv7bj/Q+O+HwBAIdds1NKDMMCoIgiISH6008XxMe5O/yYFvoKW6C2SkRCSKu/2/6FpsbA/v1XDhwtLy2tr6nx+Xy6bhjB4w8AAEiJiHT5fLzJJ1vJN0SIS+ielNQtI6PHyJHpmZkpYY5wdwNACASyO5OW1dWAHij44kpRcdX5C7UXLlSfL6kvK22ornYYJicA3OJRXM3jcnu6JUbFx8T2SI9L7+Pr2c8TrjfPsrhAxPudF2a3RvGKKH0bnpbWv2aTqiEpCfW3iqpqKxqa/P6A7jeT2kQHYxKRaEqk0+GJdEe6o+Kiu8V7IuPiOvMt4X/Q/w/8Dz/9+fQP9R8UAAAAASUVORK5CYII=";

const i18n = {
  zh: {
    siteTitle: "内容中心", siteDesc: "秒秒测 · 内容管理",
    addContent: "新建内容", navToB: "ToB 内容库", navToC: "ToC 内容库", navLeads: "招标线索",
    filterAll: "全部", filterPending: "待审核", filterApproved: "已通过", filterRejected: "已拒绝",
    statusPending: "待审核", statusApproved: "已通过", statusRejected: "已拒绝",
    typeBlog: "Blog", typeWechat: "公众号",
    langAll: "全部", langZh: "中文", langEn: "EN", langBi: "双语",
    loading: "加载中...", noContent: "暂无内容", noContentHint: "点击上方「新建内容」开始", noLeads: "暂无线索",
    addTitle: "新建内容", editTitle: "编辑内容", phTitle: "输入文章标题", phBody: "输入正文内容，支持 Markdown",
    phTags: "标签，逗号分隔", submit: "发布到审核", cancel: "取消", save: "保存修改",
    contentLang: "语言", contentType: "类型", contentCat: "内容库",
    detailTitle: "内容预览", copyBody: "复制正文", reviewNote: "审核备注", phNote: "可选备注...",
    approveWP: "通过并发布WP", approve: "审核通过", reject: "驳回", publishing: "发布中...",
    buyer: "采购方", region: "地区", budget: "预算", deadline: "截止", wan: "万",
    toastAdded: "已提交审核", toastApproved: "已通过", toastApprovedWP: "已通过并发布WordPress",
    toastRejected: "已驳回", toastCopied: "已复制", toastTitleBodyReq: "标题和正文不能为空",
    toastLoadFail: "加载失败", toastLeadFail: "加载失败", toastAddFail: "提交失败", toastOpFail: "操作失败", toastSaved: "已保存",
    statusLabel: "状态", langLabel: "语言",
    uploadImg: "图片", uploading: "上传中...", uploadSuccess: "图片已插入",
    preview: "预览", edit: "编辑", editBtn: "编辑",
    ratingTitle: "评价", ratingSub: "打分并留下评价", phAuthor: "你的名字", phComment: "写一句评价...",
    submitComment: "提交", noComments: "暂无评价", reviews: "条评价",
    commentSuccess: "已提交", commentFail: "提交失败", authorRequired: "请填写名字",
    h1: "大标题", h2: "中标题", h3: "小标题",
  },
  en: {
    siteTitle: "Content Hub", siteDesc: "Zenmeasure · Content Management",
    addContent: "New Content", navToB: "ToB Library", navToC: "ToC Library", navLeads: "Leads",
    filterAll: "All", filterPending: "Pending", filterApproved: "Approved", filterRejected: "Rejected",
    statusPending: "Pending", statusApproved: "Approved", statusRejected: "Rejected",
    typeBlog: "Blog", typeWechat: "WeChat",
    langAll: "All", langZh: "中文", langEn: "EN", langBi: "Bilingual",
    loading: "Loading...", noContent: "No content yet", noContentHint: "Click \"New Content\" to start", noLeads: "No leads",
    addTitle: "New Content", editTitle: "Edit Content", phTitle: "Article title", phBody: "Body content, Markdown supported",
    phTags: "Tags, comma separated", submit: "Submit for Review", cancel: "Cancel", save: "Save",
    contentLang: "Language", contentType: "Type", contentCat: "Library",
    detailTitle: "Preview", copyBody: "Copy Body", reviewNote: "Review Note", phNote: "Optional note...",
    approveWP: "Approve & Publish WP", approve: "Approve", reject: "Reject", publishing: "Publishing...",
    buyer: "Buyer", region: "Region", budget: "Budget", deadline: "Deadline", wan: "0k",
    toastAdded: "Submitted", toastApproved: "Approved", toastApprovedWP: "Published to WordPress",
    toastRejected: "Rejected", toastCopied: "Copied", toastTitleBodyReq: "Title and body required",
    toastLoadFail: "Load failed", toastLeadFail: "Load failed", toastAddFail: "Failed", toastOpFail: "Failed", toastSaved: "Saved",
    statusLabel: "Status", langLabel: "Language",
    uploadImg: "Image", uploading: "Uploading...", uploadSuccess: "Image inserted",
    preview: "Preview", edit: "Edit", editBtn: "Edit",
    ratingTitle: "Reviews", ratingSub: "Rate this content", phAuthor: "Name", phComment: "Short review...",
    submitComment: "Submit", noComments: "No reviews", reviews: "reviews",
    commentSuccess: "Submitted", commentFail: "Failed", authorRequired: "Name required",
    h1: "H1", h2: "H2", h3: "H3",
  },
};

const sf = async (p, o = {}) => { const r = await fetch(`${SB}/rest/v1/${p}`, { ...o, headers: { apikey: SK, Authorization: `Bearer ${SK}`, "Content-Type": "application/json", Prefer: o.method === "PATCH" ? "return=representation" : o.method === "POST" ? "return=representation" : "return=minimal", ...o.headers } }); if (!r.ok) throw new Error(`${r.status}`); const t = await r.text(); return t ? JSON.parse(t) : null; };
const upImg = async (f) => { const n = `${Date.now()}-${Math.random().toString(36).slice(2,8)}.${f.name.split(".").pop()}`; const r = await fetch(`${SB}/storage/v1/object/${BUCKET}/${n}`, { method: "POST", headers: { apikey: SK, Authorization: `Bearer ${SK}`, "Content-Type": f.type }, body: f }); if (!r.ok) throw new Error("Upload failed"); return `${SB}/storage/v1/object/public/${BUCKET}/${n}`; };
const wpPub = async (ti, bo) => { if (WP_SITE === "YOUR_WORDPRESS_SITE") return null; const r = await fetch(`${WP_SITE}/wp-json/wp/v2/posts`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Basic " + btoa(`${WP_USER}:${WP_PASS}`) }, body: JSON.stringify({ title: ti, content: bo, status: "publish" }) }); if (!r.ok) throw new Error("WP failed"); return await r.json(); };

const renderMd = (s) => s ? s.replace(/^### (.+)$/gm,'<h3 style="font-size:15px;font-weight:600;margin:18px 0 8px;color:#1C1917">$1</h3>').replace(/^## (.+)$/gm,'<h2 style="font-size:17px;font-weight:600;margin:22px 0 10px;color:#1C1917">$1</h2>').replace(/^# (.+)$/gm,'<h1 style="font-size:20px;font-weight:700;margin:26px 0 12px;color:#1C1917">$1</h1>').replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>").replace(/\*(.+?)\*/g,"<em>$1</em>").replace(/!\[([^\]]*)\]\(([^)]+)\)/g,'<img src="$2" alt="$1" style="max-width:100%;border-radius:8px;margin:12px 0"/>').replace(/\n\n/g,'<div style="height:12px"></div>').replace(/\n/g,"<br/>") : "";

function Stars({ value, onChange, size = 20, ro = false }) {
  const [h, setH] = useState(0);
  return <div style={{ display: "inline-flex", gap: 1 }}>{[1,2,3,4,5].map(s => <svg key={s} width={size} height={size} viewBox="0 0 24 24" style={{ cursor: ro ? "default" : "pointer", transition: "transform .1s", transform: !ro && h === s ? "scale(1.2)" : "scale(1)" }} onClick={() => !ro && onChange?.(s)} onMouseEnter={() => !ro && setH(s)} onMouseLeave={() => !ro && setH(0)} fill={(h||value) >= s ? "#FACC15" : "none"} stroke={(h||value) >= s ? "#EAB308" : "#D6D3D1"} strokeWidth="1.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>)}</div>;
}

function insMd(ref, body, set, pre, suf = "") { const ta = ref.current; if (!ta) return; const s = ta.selectionStart, e = ta.selectionEnd, sel = body.slice(s,e), bef = body.slice(0,s), aft = body.slice(e), nl = bef.length > 0 && !bef.endsWith("\n") && pre.startsWith("#"); set(bef + (nl?"\n":"") + pre + sel + suf + aft); setTimeout(() => { ta.focus(); ta.setSelectionRange(s+(nl?1:0)+pre.length+(sel?sel.length:0), s+(nl?1:0)+pre.length+(sel?sel.length:0)); }, 0); }

function Toolbar({ taRef, body, setBody, uploading: upl, onUpload, previewMode: pm, setPreview: sp, t }) {
  return <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
    <div style={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
      {[["H1",t.h1,"# "],["H2",t.h2,"## "],["H3",t.h3,"### "]].map(([l,tip,p]) => <button key={l} onClick={() => insMd(taRef,body,setBody,p)} title={tip} className="btn" style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #E7E5E4", background: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", color: "#57534E" }}>{l}</button>)}
      <div style={{ width: 1, background: "#E7E5E4", margin: "0 3px" }} />
      <button onClick={() => insMd(taRef,body,setBody,"**","**")} className="btn" style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #E7E5E4", background: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", color: "#57534E" }}>B</button>
      <button onClick={() => insMd(taRef,body,setBody,"*","*")} className="btn" style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #E7E5E4", background: "#fff", fontSize: 13, fontStyle: "italic", cursor: "pointer", color: "#57534E" }}>I</button>
      <div style={{ width: 1, background: "#E7E5E4", margin: "0 3px" }} />
      <button onClick={onUpload} disabled={upl} className="btn" style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #E7E5E4", background: "#fff", fontSize: 12, fontWeight: 500, cursor: upl ? "wait" : "pointer", display: "flex", alignItems: "center", gap: 4, color: "#57534E" }}>
        <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
        {upl ? t.uploading : t.uploadImg}
      </button>
    </div>
    <div style={{ display: "flex", background: "#ECEAE3", borderRadius: 6, padding: 2 }}>
      <button onClick={() => sp(false)} style={{ padding: "4px 12px", border: "none", borderRadius: 4, fontSize: 11, fontWeight: 500, cursor: "pointer", background: !pm ? "#fff" : "transparent", color: !pm ? "#1C1917" : "#78716C" }}>{t.edit}</button>
      <button onClick={() => sp(true)} style={{ padding: "4px 12px", border: "none", borderRadius: 4, fontSize: 11, fontWeight: 500, cursor: "pointer", background: pm ? "#fff" : "transparent", color: pm ? "#1C1917" : "#78716C" }}>{t.preview}</button>
    </div>
  </div>;
}

export default function App() {
  const [lang, setLang] = useState("zh"); const t = i18n[lang];
  const [contents, setContents] = useState([]); const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); const [langFilter, setLangFilter] = useState("all");
  const [nav, setNav] = useState("tob"); // tob | toc | leads
  const [selected, setSelected] = useState(null); const [reviewNote, setReviewNote] = useState("");
  const [publishing, setPublishing] = useState(false); const [toast, setToast] = useState(null);
  const [leads, setLeads] = useState([]);
  const [addMode, setAddMode] = useState(false);
  const [nc, setNc] = useState({ content_type: "blog", title: "", body: "", tags: "", lang: "zh", category: "tob" });
  const [uploading, setUploading] = useState(false); const [pm, setPm] = useState(false); const [dragOver, setDO] = useState(false);
  const [comments, setComments] = useState([]); const [cStats, setCStats] = useState({});
  const [nr, setNr] = useState(0); const [na, setNa] = useState(""); const [ncom, setNcom] = useState(""); const [subC, setSubC] = useState(false);
  const [editing, setEditing] = useState(false);
  const [ed, setEd] = useState({ title: "", body: "", tags: "", content_type: "", lang: "", category: "" });
  const [ep, setEp] = useState(false); const [saving, setSaving] = useState(false);
  const fRef = useRef(null); const tRef = useRef(null); const efRef = useRef(null); const etRef = useRef(null);
  const show = (m, ty = "success") => { setToast({ m, ty }); setTimeout(() => setToast(null), 2500); };
  const cat = nav === "tob" || nav === "toc" ? nav : "tob";

  const fetchC = useCallback(async () => { setLoading(true); try { let p = `contents?select=*,bid_leads(title,buyer,region)&order=created_at.desc&category=eq.${cat}`; if (filter !== "all") p += `&review_status=eq.${filter}`; if (langFilter !== "all") p += `&lang=eq.${langFilter}`; setContents((await sf(p)) || []); } catch { show(t.toastLoadFail, "error"); } setLoading(false); }, [filter, langFilter, cat]);
  const fetchL = useCallback(async () => { try { setLeads((await sf("bid_leads?order=created_at.desc&limit=50")) || []); } catch { show(t.toastLeadFail, "error"); } }, []);
  const fetchCS = useCallback(async () => { try { const d = await sf("comments?select=content_id,rating"); if (!d) return; const s = {}; d.forEach(c => { if (!s[c.content_id]) s[c.content_id] = { n: 0, s: 0 }; s[c.content_id].n++; s[c.content_id].s += c.rating; }); setCStats(s); } catch {} }, []);
  const fetchCom = useCallback(async (id) => { try { setComments((await sf(`comments?content_id=eq.${id}&order=created_at.desc`)) || []); } catch { setComments([]); } }, []);

  useEffect(() => { if (nav !== "leads") { fetchC(); fetchCS(); } }, [fetchC, fetchCS, nav]);
  useEffect(() => { if (nav === "leads") fetchL(); }, [nav, fetchL]);
  useEffect(() => { if (selected) { fetchCom(selected.id); setNr(0); setNcom(""); setEditing(false); } }, [selected]);

  const doApprove = async (it) => { setPublishing(true); try { let w = null; if (it.content_type === "blog") { const r = await wpPub(it.title, it.body); if (r) w = String(r.id); } await sf(`contents?id=eq.${it.id}`, { method: "PATCH", body: JSON.stringify({ review_status: "approved", reviewer_note: reviewNote || null, wp_post_id: w, published_at: new Date().toISOString(), updated_at: new Date().toISOString() }) }); show(w ? t.toastApprovedWP : t.toastApproved); setSelected(null); setReviewNote(""); fetchC(); } catch { show(t.toastOpFail, "error"); } setPublishing(false); };
  const doReject = async (it) => { try { await sf(`contents?id=eq.${it.id}`, { method: "PATCH", body: JSON.stringify({ review_status: "rejected", reviewer_note: reviewNote || null, updated_at: new Date().toISOString() }) }); show(t.toastRejected); setSelected(null); setReviewNote(""); fetchC(); } catch { show(t.toastOpFail, "error"); } };
  const doAdd = async () => { if (!nc.title || !nc.body) { show(t.toastTitleBodyReq, "error"); return; } try { await sf("contents", { method: "POST", body: JSON.stringify({ ...nc, review_status: "pending" }) }); show(t.toastAdded); setAddMode(false); setPm(false); setNc({ content_type: "blog", title: "", body: "", tags: "", lang: "zh", category: cat }); fetchC(); } catch { show(t.toastAddFail, "error"); } };
  const doSave = async () => { if (!ed.title || !ed.body) { show(t.toastTitleBodyReq, "error"); return; } setSaving(true); try { await sf(`contents?id=eq.${selected.id}`, { method: "PATCH", body: JSON.stringify({ ...ed, updated_at: new Date().toISOString() }) }); show(t.toastSaved); setSelected({ ...selected, ...ed }); setEditing(false); fetchC(); } catch { show(t.toastOpFail, "error"); } setSaving(false); };
  const doComment = async () => { if (!na.trim()) { show(t.authorRequired, "error"); return; } if (nr === 0) { show(lang === "zh" ? "请选择评分" : "Please rate", "error"); return; } setSubC(true); try { await sf("comments", { method: "POST", body: JSON.stringify({ content_id: selected.id, author: na.trim(), rating: nr, comment: ncom.trim() || null }) }); show(t.commentSuccess); setNr(0); setNcom(""); fetchCom(selected.id); fetchCS(); } catch { show(t.commentFail, "error"); } setSubC(false); };

  const doImgUp = async (file, isE = false) => { if (!file?.type.startsWith("image/")) return; setUploading(true); try { const url = await upImg(file); const md = `![${file.name}](${url})`; const ref = isE ? etRef : tRef; const bv = isE ? ed.body : nc.body; const fn = isE ? v => setEd({ ...ed, body: v }) : v => setNc({ ...nc, body: v }); const ta = ref.current; if (ta) { const s = ta.selectionStart; const b = bv.slice(0,s); const a = bv.slice(ta.selectionEnd); fn(b + (b && !b.endsWith("\n") ? "\n" : "") + md + "\n" + a); } else fn(bv + "\n" + md + "\n"); show(t.uploadSuccess); } catch (e) { show(e.message, "error"); } setUploading(false); };
  const onDrop = (e, isE) => { e.preventDefault(); setDO(false); if (e.dataTransfer.files[0]) doImgUp(e.dataTransfer.files[0], isE); };
  const onPaste = (e, isE) => { const it = e.clipboardData?.items; if (!it) return; for (const i of it) if (i.type.startsWith("image/")) { e.preventDefault(); doImgUp(i.getAsFile(), isE); break; } };
  const copy = txt => navigator.clipboard.writeText(txt).then(() => show(t.toastCopied));
  const fd = d => { const x = new Date(d); return `${x.getMonth()+1}/${x.getDate()}`; };
  const fdt = d => { const x = new Date(d); return `${x.getMonth()+1}/${x.getDate()} ${x.getHours()}:${String(x.getMinutes()).padStart(2,"0")}`; };

  const SS = { pending: { bg: "#FFF8EB", c: "#A16207", d: "#FACC15" }, approved: { bg: "#ECFDF5", c: "#047857", d: "#34D399" }, rejected: { bg: "#FEF2F2", c: "#B91C1C", d: "#F87171" } };
  const LS = { zh: { l: "中", bg: "#FEF3C7", c: "#92400E" }, en: { l: "EN", bg: "#DBEAFE", c: "#1E40AF" }, bi: { l: "BI", bg: "#EDE9FE", c: "#5B21B6" } };
  const pn = contents.filter(c => c.review_status === "pending").length;
  const an = contents.filter(c => c.review_status === "approved").length;
  const isLib = nav === "tob" || nav === "toc";

  const CatPill = ({ k, l, cur, set }) => <button onClick={() => set(k)} className="btn" style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", border: cur === k ? "1.5px solid #1C1917" : "1.5px solid #E7E5E4", background: cur === k ? "#1C1917" : "#fff", color: cur === k ? "#fff" : "#57534E", letterSpacing: 0.5 }}>{l}</button>;

  // Body display style with text-align justify
  const bodyStyle = { background: "#FAFAF8", borderRadius: 12, border: "1px solid #ECEAE3", padding: "20px 24px", marginBottom: 24, fontSize: 14, lineHeight: 1.9, color: "#44403C", textAlign: "justify" };

  return (
    <div style={{ minHeight: "100vh", background: "#F8F7F4" }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Noto+Sans+SC:wght@300;400;500;600&display=swap" rel="stylesheet" />
      <style>{`*{box-sizing:border-box}body{margin:0}@keyframes ti{from{transform:translateY(-12px) scale(.95);opacity:0}to{transform:translateY(0) scale(1);opacity:1}}@keyframes fu{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}@keyframes si{from{transform:translateX(100%)}to{transform:translateX(0)}}@keyframes pl{0%,100%{opacity:1}50%{opacity:.6}}.item{transition:all .15s;border:1.5px solid transparent}.item:hover{border-color:#D6D3C8;transform:translateY(-1px);box-shadow:0 4px 20px rgba(0,0,0,.04)}.btn{transition:all .15s}.btn:hover{transform:translateY(-1px);box-shadow:0 2px 8px rgba(0,0,0,.08)}.btn:active{transform:translateY(0)}textarea:focus,input:focus{outline:none;border-color:#A3A096!important}.chip{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:100px;font-size:11px;font-weight:500;white-space:nowrap}`}</style>

      {toast && <div style={{ position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)", zIndex: 999, animation: "ti .25s ease" }}><div style={{ padding: "10px 20px", borderRadius: 100, fontSize: 13, fontWeight: 500, fontFamily: "'Outfit','Noto Sans SC'", background: "#1C1917", color: "#fff", boxShadow: "0 8px 32px rgba(0,0,0,.16)", display: "flex", alignItems: "center", gap: 8 }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: toast.ty === "error" ? "#F87171" : "#34D399" }} />{toast.m}</div></div>}

      <div style={{ display: "flex", minHeight: "100vh" }}>
        {/* Sidebar */}
        <nav style={{ width: 220, background: "#191654", color: "#fff", padding: "28px 0", display: "flex", flexDirection: "column", flexShrink: 0 }}>
          <div style={{ padding: "0 24px", marginBottom: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <img src={LOGO} alt="Logo" style={{ width: 32, height: 32, borderRadius: 8 }} />
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, fontFamily: "'Outfit'", letterSpacing: -0.3 }}>{t.siteTitle}</div>
                <div style={{ fontSize: 10, color: "#9B99C3" }}>{t.siteDesc}</div>
              </div>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            {[{ k: "tob", l: t.navToB, ic: "M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" },
              { k: "toc", l: t.navToC, ic: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 3a4 4 0 110 8 4 4 0 010-8z" },
              { k: "leads", l: t.navLeads, ic: "M13 10V3L4 14h7v7l9-11h-7z" }].map(n => (
              <button key={n.k} onClick={() => { setNav(n.k); setFilter("all"); setLangFilter("all"); }} style={{
                width: "100%", padding: "10px 24px", border: "none", background: nav === n.k ? "rgba(255,255,255,.1)" : "transparent",
                color: nav === n.k ? "#fff" : "#9B99C3", fontSize: 13, fontWeight: 500, fontFamily: "'Outfit','Noto Sans SC'",
                cursor: "pointer", display: "flex", alignItems: "center", gap: 10, textAlign: "left",
                borderLeft: nav === n.k ? "2px solid #7C6FF7" : "2px solid transparent",
              }}>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d={n.ic}/></svg>{n.l}
              </button>
            ))}
          </div>
          <div style={{ padding: "0 24px" }}>
            <div style={{ display: "flex", background: "rgba(255,255,255,.06)", borderRadius: 8, padding: 3 }}>
              {["zh","en"].map(l => <button key={l} onClick={() => setLang(l)} style={{ flex: 1, padding: "6px 0", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "'Outfit'", background: lang === l ? "rgba(255,255,255,.12)" : "transparent", color: lang === l ? "#fff" : "#6B6999" }}>{l === "zh" ? "中文" : "EN"}</button>)}
            </div>
          </div>
        </nav>

        {/* Main */}
        <main style={{ flex: 1, padding: "28px 36px", fontFamily: "'Outfit','Noto Sans SC',sans-serif", overflow: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: "#1C1917", letterSpacing: -0.5 }}>{nav === "leads" ? t.navLeads : nav === "toc" ? t.navToC : t.navToB}</h1>
              {isLib && <p style={{ margin: "4px 0 0", fontSize: 13, color: "#A8A29E" }}>{pn > 0 ? `${pn} ${t.filterPending}` : ""}{pn > 0 && an > 0 ? " · " : ""}{an > 0 ? `${an} ${t.filterApproved}` : ""}</p>}
            </div>
            {isLib && <button className="btn" onClick={() => { setAddMode(true); setPm(false); setNc({ ...nc, category: cat }); }} style={{ padding: "9px 20px", borderRadius: 10, border: "none", cursor: "pointer", background: "#191654", color: "#fff", fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>{t.addContent}</button>}
          </div>

          {/* Filters */}
          {isLib && <div style={{ display: "flex", gap: 20, marginBottom: 24, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 11, color: "#A8A29E", fontWeight: 500, textTransform: "uppercase", letterSpacing: .5 }}>{t.statusLabel}</span>
              <div style={{ display: "flex", background: "#ECEAE3", borderRadius: 8, padding: 2 }}>
                {[["all",t.filterAll],["pending",t.filterPending],["approved",t.filterApproved],["rejected",t.filterRejected]].map(([k,l]) => <button key={k} onClick={() => setFilter(k)} style={{ padding: "5px 12px", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: "pointer", background: filter === k ? "#fff" : "transparent", color: filter === k ? "#1C1917" : "#78716C", boxShadow: filter === k ? "0 1px 3px rgba(0,0,0,.06)" : "none" }}>{l}</button>)}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 11, color: "#A8A29E", fontWeight: 500, textTransform: "uppercase", letterSpacing: .5 }}>{t.langLabel}</span>
              <div style={{ display: "flex", background: "#ECEAE3", borderRadius: 8, padding: 2 }}>
                {[["all",t.langAll],["zh",t.langZh],["en",t.langEn],["bi",t.langBi]].map(([k,l]) => <button key={k} onClick={() => setLangFilter(k)} style={{ padding: "5px 12px", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: "pointer", background: langFilter === k ? "#fff" : "transparent", color: langFilter === k ? "#1C1917" : "#78716C", boxShadow: langFilter === k ? "0 1px 3px rgba(0,0,0,.06)" : "none" }}>{l}</button>)}
              </div>
            </div>
          </div>}

          {/* Add modal */}
          {addMode && <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,.4)", backdropFilter: "blur(4px)" }} onClick={e => { if (e.target === e.currentTarget) { setAddMode(false); setPm(false); } }}>
            <div style={{ width: 660, maxWidth: "92vw", maxHeight: "90vh", overflow: "auto", background: "#fff", borderRadius: 16, padding: 32, animation: "fu .25s ease", boxShadow: "0 24px 64px rgba(0,0,0,.12)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{t.addTitle}</h2>
                <button onClick={() => { setAddMode(false); setPm(false); }} style={{ border: "none", background: "#F5F4F0", width: 32, height: 32, borderRadius: 8, cursor: "pointer", fontSize: 16, color: "#78716C", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
              </div>
              <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
                <div><label style={{ fontSize: 11, fontWeight: 600, color: "#A8A29E", textTransform: "uppercase", letterSpacing: .5, display: "block", marginBottom: 6 }}>{t.contentCat}</label><div style={{ display: "flex", gap: 6 }}><CatPill k="tob" l="ToB" cur={nc.category} set={v => setNc({...nc, category: v})} /><CatPill k="toc" l="ToC" cur={nc.category} set={v => setNc({...nc, category: v})} /></div></div>
                <div><label style={{ fontSize: 11, fontWeight: 600, color: "#A8A29E", textTransform: "uppercase", letterSpacing: .5, display: "block", marginBottom: 6 }}>{t.contentType}</label><div style={{ display: "flex", gap: 6 }}>{[["blog",t.typeBlog],["wechat",t.typeWechat]].map(([k,l]) => <button key={k} onClick={() => setNc({...nc, content_type: k})} className="btn" style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: "pointer", border: nc.content_type === k ? "1.5px solid #1C1917" : "1.5px solid #E7E5E4", background: nc.content_type === k ? "#1C1917" : "#fff", color: nc.content_type === k ? "#fff" : "#57534E" }}>{l}</button>)}</div></div>
                <div><label style={{ fontSize: 11, fontWeight: 600, color: "#A8A29E", textTransform: "uppercase", letterSpacing: .5, display: "block", marginBottom: 6 }}>{t.contentLang}</label><div style={{ display: "flex", gap: 6 }}>{[["zh","中文","#FEF3C7","#92400E","#F59E0B"],["en","EN","#DBEAFE","#1E40AF","#3B82F6"],["bi",lang==="zh"?"双语":"BI","#EDE9FE","#5B21B6","#8B5CF6"]].map(([k,l,bg,c,bc]) => <button key={k} onClick={() => setNc({...nc, lang: k})} className="btn" style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: "pointer", border: nc.lang === k ? `1.5px solid ${bc}` : "1.5px solid #E7E5E4", background: nc.lang === k ? bg : "#fff", color: nc.lang === k ? c : "#57534E" }}>{l}</button>)}</div></div>
              </div>
              <input placeholder={t.phTitle} value={nc.title} onChange={e => setNc({...nc, title: e.target.value})} style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "1.5px solid #E7E5E4", fontSize: 15, fontWeight: 500, marginBottom: 12, fontFamily: "'Outfit','Noto Sans SC'", color: "#1C1917" }} />
              <input type="file" ref={fRef} accept="image/*" style={{ display: "none" }} onChange={e => { if (e.target.files[0]) doImgUp(e.target.files[0]); e.target.value = ""; }} />
              <Toolbar taRef={tRef} body={nc.body} setBody={v => setNc({...nc, body: v})} uploading={uploading} onUpload={() => fRef.current?.click()} previewMode={pm} setPreview={setPm} t={t} />
              {!pm ? <div onDragOver={e => { e.preventDefault(); setDO(true); }} onDragLeave={() => setDO(false)} onDrop={e => onDrop(e,false)} style={{ border: `1.5px ${dragOver?"dashed":"solid"} ${dragOver?"#7C6FF7":"#E7E5E4"}`, borderRadius: 10, marginBottom: 12, background: dragOver ? "#EEEDFE" : "transparent" }}>
                <textarea ref={tRef} placeholder={t.phBody} value={nc.body} onChange={e => setNc({...nc, body: e.target.value})} onPaste={e => onPaste(e,false)} rows={12} style={{ width: "100%", padding: "12px 16px", border: "none", borderRadius: 10, fontSize: 14, resize: "vertical", fontFamily: "'Outfit','Noto Sans SC'", lineHeight: 1.7, color: "#1C1917", background: "transparent", outline: "none", minHeight: 200 }} />
              </div> : <div style={{ border: "1.5px solid #E7E5E4", borderRadius: 10, padding: "16px 20px", marginBottom: 12, minHeight: 200, fontSize: 14, lineHeight: 1.8, color: "#44403C", textAlign: "justify" }} dangerouslySetInnerHTML={{ __html: renderMd(nc.body) || `<span style="color:#A8A29E">${t.phBody}</span>` }} />}
              <input placeholder={t.phTags} value={nc.tags} onChange={e => setNc({...nc, tags: e.target.value})} style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "1.5px solid #E7E5E4", fontSize: 13, marginBottom: 20, fontFamily: "'Outfit','Noto Sans SC'", color: "#57534E" }} />
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button onClick={() => { setAddMode(false); setPm(false); }} className="btn" style={{ padding: "9px 20px", borderRadius: 10, border: "1.5px solid #E7E5E4", background: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer", color: "#57534E" }}>{t.cancel}</button>
                <button onClick={doAdd} className="btn" style={{ padding: "9px 24px", borderRadius: 10, border: "none", background: "#191654", color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>{t.submit}</button>
              </div>
            </div>
          </div>}

          {/* Content list */}
          {isLib && (loading ? <div style={{ textAlign: "center", padding: 60, color: "#A8A29E" }}><div style={{ animation: "pl 1.5s ease infinite" }}>{t.loading}</div></div>
          : contents.length === 0 ? <div style={{ textAlign: "center", padding: "80px 20px" }}><div style={{ fontSize: 40, marginBottom: 12 }}>📭</div><p style={{ fontSize: 15, color: "#78716C", margin: "0 0 4px", fontWeight: 500 }}>{t.noContent}</p><p style={{ fontSize: 13, color: "#A8A29E" }}>{t.noContentHint}</p></div>
          : <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{contents.map((it, i) => { const st = SS[it.review_status]||SS.pending; const cl = LS[it.lang]||LS.zh; const cs = cStats[it.id]; const avg = cs ? (cs.s/cs.n).toFixed(1) : null; return <div key={it.id} className="item" onClick={() => { setSelected(it); setReviewNote(it.reviewer_note||""); }} style={{ background: "#fff", borderRadius: 12, padding: "14px 20px", cursor: "pointer", animation: `fu .3s ease ${i*.04}s both` }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><div style={{ flex: 1, minWidth: 0 }}><div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, flexWrap: "wrap" }}><span className="chip" style={{ background: st.bg, color: st.c }}><span style={{ width: 5, height: 5, borderRadius: "50%", background: st.d }}/>{SS.pending===st?t.statusPending:SS.approved===st?t.statusApproved:t.statusRejected}</span><span className="chip" style={{ background: "#F5F4F0", color: "#57534E" }}>{it.content_type==="blog"?t.typeBlog:t.typeWechat}</span><span className="chip" style={{ background: cl.bg, color: cl.c }}>{cl.l}</span>{it.wp_post_id&&<span className="chip" style={{ background: "#DBEAFE", color: "#1E40AF" }}>WP</span>}</div><h3 style={{ margin: 0, fontSize: 14, fontWeight: 500, color: "#1C1917", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.title}</h3>{it.bid_leads&&<p style={{ margin: "4px 0 0", fontSize: 12, color: "#A8A29E" }}>{it.bid_leads.buyer} · {it.bid_leads.region}</p>}</div><div style={{ textAlign: "right", flexShrink: 0, marginLeft: 16, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}><span style={{ fontSize: 12, color: "#D6D3D1", fontWeight: 500, fontFamily: "'Outfit'" }}>{fd(it.created_at)}</span>{cs&&<div style={{ display: "flex", alignItems: "center", gap: 4 }}><Stars value={Math.round(parseFloat(avg))} ro size={11}/><span style={{ fontSize: 11, fontWeight: 600, color: "#A16207" }}>{avg}</span><span style={{ fontSize: 10, color: "#A8A29E" }}>({cs.n})</span></div>}</div></div>{it.tags&&<div style={{ display: "flex", gap: 4, marginTop: 8, flexWrap: "wrap" }}>{it.tags.split(",").map(tg => <span key={tg} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 100, background: "#F5F4F0", color: "#78716C", fontWeight: 500 }}>{tg.trim()}</span>)}</div>}</div>; })}</div>)}

          {/* Leads */}
          {nav === "leads" && <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{leads.length===0?<div style={{ textAlign: "center", padding: "80px 20px" }}><div style={{ fontSize: 40, marginBottom: 12 }}>📋</div><p style={{ fontSize: 15, color: "#78716C", fontWeight: 500 }}>{t.noLeads}</p></div>:leads.map((ld,i) => <div key={ld.id} className="item" style={{ background: "#fff", borderRadius: 12, padding: "14px 20px", animation: `fu .3s ease ${i*.04}s both` }}><h3 style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 500, color: "#1C1917" }}>{ld.title}</h3><div style={{ display: "flex", gap: 12, fontSize: 12, color: "#A8A29E", flexWrap: "wrap" }}>{ld.buyer&&<span>● {t.buyer}: {ld.buyer}</span>}{ld.region&&<span>● {t.region}: {ld.region}</span>}{ld.budget&&<span>● {t.budget}: {ld.budget}{t.wan}</span>}{ld.deadline&&<span>● {t.deadline}: {ld.deadline}</span>}</div></div>)}</div>}
        </main>
      </div>

      {/* Detail panel */}
      {selected && <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", justifyContent: "flex-end" }}>
        <div style={{ flex: 1, background: "rgba(0,0,0,.3)", backdropFilter: "blur(2px)" }} onClick={() => { setSelected(null); setEditing(false); setComments([]); }} />
        <div style={{ width: 580, maxWidth: "92vw", background: "#fff", overflowY: "auto", padding: 32, animation: "si .25s ease", boxShadow: "-8px 0 32px rgba(0,0,0,.08)", fontFamily: "'Outfit','Noto Sans SC',sans-serif" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: "#1C1917" }}>{editing ? t.editTitle : t.detailTitle}</h2>
            <div style={{ display: "flex", gap: 8 }}>
              {!editing && <button onClick={() => { setEd({ title: selected.title, body: selected.body, tags: selected.tags||"", content_type: selected.content_type, lang: selected.lang||"zh", category: selected.category||"tob" }); setEditing(true); setEp(false); }} className="btn" style={{ padding: "6px 14px", borderRadius: 8, border: "1.5px solid #E7E5E4", background: "#fff", fontSize: 12, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, color: "#57534E" }}><svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>{t.editBtn}</button>}
              <button onClick={() => { setSelected(null); setEditing(false); setComments([]); }} style={{ border: "none", background: "#F5F4F0", width: 32, height: 32, borderRadius: 8, cursor: "pointer", fontSize: 16, color: "#78716C", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>
          </div>

          {editing ? <div>
            <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
              <div><label style={{ fontSize: 11, fontWeight: 600, color: "#A8A29E", textTransform: "uppercase", letterSpacing: .5, display: "block", marginBottom: 6 }}>{t.contentCat}</label><div style={{ display: "flex", gap: 6 }}><CatPill k="tob" l="ToB" cur={ed.category} set={v => setEd({...ed, category: v})} /><CatPill k="toc" l="ToC" cur={ed.category} set={v => setEd({...ed, category: v})} /></div></div>
              <div><label style={{ fontSize: 11, fontWeight: 600, color: "#A8A29E", textTransform: "uppercase", letterSpacing: .5, display: "block", marginBottom: 6 }}>{t.contentType}</label><div style={{ display: "flex", gap: 6 }}>{[["blog",t.typeBlog],["wechat",t.typeWechat]].map(([k,l]) => <button key={k} onClick={() => setEd({...ed, content_type: k})} className="btn" style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: "pointer", border: ed.content_type===k?"1.5px solid #1C1917":"1.5px solid #E7E5E4", background: ed.content_type===k?"#1C1917":"#fff", color: ed.content_type===k?"#fff":"#57534E" }}>{l}</button>)}</div></div>
              <div><label style={{ fontSize: 11, fontWeight: 600, color: "#A8A29E", textTransform: "uppercase", letterSpacing: .5, display: "block", marginBottom: 6 }}>{t.contentLang}</label><div style={{ display: "flex", gap: 6 }}>{[["zh","中文","#FEF3C7","#92400E","#F59E0B"],["en","EN","#DBEAFE","#1E40AF","#3B82F6"],["bi","BI","#EDE9FE","#5B21B6","#8B5CF6"]].map(([k,l,bg,c,bc]) => <button key={k} onClick={() => setEd({...ed, lang: k})} className="btn" style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: "pointer", border: ed.lang===k?`1.5px solid ${bc}`:"1.5px solid #E7E5E4", background: ed.lang===k?bg:"#fff", color: ed.lang===k?c:"#57534E" }}>{l}</button>)}</div></div>
            </div>
            <input value={ed.title} onChange={e => setEd({...ed, title: e.target.value})} placeholder={t.phTitle} style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "1.5px solid #E7E5E4", fontSize: 15, fontWeight: 500, marginBottom: 12, fontFamily: "'Outfit','Noto Sans SC'", color: "#1C1917" }} />
            <input type="file" ref={efRef} accept="image/*" style={{ display: "none" }} onChange={e => { if (e.target.files[0]) doImgUp(e.target.files[0], true); e.target.value = ""; }} />
            <Toolbar taRef={etRef} body={ed.body} setBody={v => setEd({...ed, body: v})} uploading={uploading} onUpload={() => efRef.current?.click()} previewMode={ep} setPreview={setEp} t={t} />
            {!ep ? <div onDragOver={e => { e.preventDefault(); setDO(true); }} onDragLeave={() => setDO(false)} onDrop={e => onDrop(e,true)} style={{ border: `1.5px ${dragOver?"dashed":"solid"} ${dragOver?"#7C6FF7":"#E7E5E4"}`, borderRadius: 10, marginBottom: 12 }}>
              <textarea ref={etRef} value={ed.body} onChange={e => setEd({...ed, body: e.target.value})} onPaste={e => onPaste(e,true)} rows={14} placeholder={t.phBody} style={{ width: "100%", padding: "12px 16px", border: "none", borderRadius: 10, fontSize: 14, resize: "vertical", fontFamily: "'Outfit','Noto Sans SC'", lineHeight: 1.7, color: "#1C1917", background: "transparent", outline: "none", minHeight: 240 }} />
            </div> : <div style={{ ...bodyStyle, marginBottom: 12, minHeight: 240 }} dangerouslySetInnerHTML={{ __html: renderMd(ed.body) }} />}
            <input value={ed.tags} onChange={e => setEd({...ed, tags: e.target.value})} placeholder={t.phTags} style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "1.5px solid #E7E5E4", fontSize: 13, marginBottom: 20, fontFamily: "'Outfit','Noto Sans SC'", color: "#57534E" }} />
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={doSave} disabled={saving} className="btn" style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: "#191654", color: "#fff", fontSize: 13, fontWeight: 500, cursor: saving?"wait":"pointer", opacity: saving?.7:1 }}>{saving?"...":t.save}</button>
              <button onClick={() => setEditing(false)} className="btn" style={{ padding: "10px 20px", borderRadius: 10, border: "1.5px solid #E7E5E4", background: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer", color: "#57534E" }}>{t.cancel}</button>
            </div>
          </div> : <>
            <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
              {(()=>{const st=SS[selected.review_status]||SS.pending;return<span className="chip" style={{background:st.bg,color:st.c}}><span style={{width:5,height:5,borderRadius:"50%",background:st.d}}/>{SS.pending===st?t.statusPending:SS.approved===st?t.statusApproved:t.statusRejected}</span>})()}
              <span className="chip" style={{background:"#F5F4F0",color:"#57534E"}}>{selected.content_type==="blog"?t.typeBlog:t.typeWechat}</span>
              {(()=>{const cl=LS[selected.lang]||LS.zh;return<span className="chip" style={{background:cl.bg,color:cl.c}}>{cl.l}</span>})()}
              <span className="chip" style={{background:"#F3F0FF",color:"#5B21B6"}}>{selected.category==="toc"?"ToC":"ToB"}</span>
            </div>
            <h3 style={{margin:"0 0 20px",fontSize:18,fontWeight:600,lineHeight:1.5,color:"#1C1917"}}>{selected.title}</h3>
            {selected.content_type==="wechat"&&<button onClick={()=>copy(selected.body)} className="btn" style={{padding:"7px 14px",borderRadius:8,border:"1.5px solid #E7E5E4",background:"#fff",fontSize:12,fontWeight:500,cursor:"pointer",marginBottom:16,display:"flex",alignItems:"center",gap:6,color:"#57534E"}}><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>{t.copyBody}</button>}
            <div style={bodyStyle} dangerouslySetInnerHTML={{__html:renderMd(selected.body)}}/>

            {selected.review_status==="pending"&&<div style={{borderTop:"1px solid #F5F4F0",paddingTop:20,marginBottom:24}}>
              <label style={{fontSize:11,fontWeight:600,color:"#A8A29E",textTransform:"uppercase",letterSpacing:.5,display:"block",marginBottom:8}}>{t.reviewNote}</label>
              <textarea value={reviewNote} onChange={e=>setReviewNote(e.target.value)} placeholder={t.phNote} rows={3} style={{width:"100%",padding:"10px 14px",borderRadius:10,border:"1.5px solid #E7E5E4",fontSize:13,marginBottom:16,resize:"vertical",fontFamily:"'Outfit','Noto Sans SC'",color:"#44403C",lineHeight:1.6}}/>
              <div style={{display:"flex",gap:10}}>
                <button onClick={()=>doApprove(selected)} disabled={publishing} className="btn" style={{padding:"10px 20px",borderRadius:10,border:"none",background:"#059669",color:"#fff",fontSize:13,fontWeight:500,cursor:publishing?"wait":"pointer",opacity:publishing?.7:1}}>{publishing?t.publishing:selected.content_type==="blog"?t.approveWP:t.approve}</button>
                <button onClick={()=>doReject(selected)} className="btn" style={{padding:"10px 20px",borderRadius:10,border:"1.5px solid #FECACA",background:"#FEF2F2",color:"#B91C1C",fontSize:13,fontWeight:500,cursor:"pointer"}}>{t.reject}</button>
              </div>
            </div>}

            {/* Comments */}
            <div style={{borderTop:"1px solid #F5F4F0",paddingTop:24}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
                <h3 style={{margin:0,fontSize:15,fontWeight:600,color:"#1C1917"}}>{t.ratingTitle}</h3>
                {comments.length>0&&(()=>{const a=(comments.reduce((s,c)=>s+c.rating,0)/comments.length).toFixed(1);return<div style={{display:"flex",alignItems:"center",gap:8}}><Stars value={Math.round(parseFloat(a))} ro size={14}/><span style={{fontSize:13,fontWeight:600,color:"#1C1917"}}>{a}</span><span style={{fontSize:12,color:"#A8A29E"}}>({comments.length} {t.reviews})</span></div>})()}
              </div>
              <div style={{background:"#FAFAF8",borderRadius:12,border:"1px solid #ECEAE3",padding:20,marginBottom:20}}>
                <p style={{margin:"0 0 12px",fontSize:12,color:"#78716C"}}>{t.ratingSub}</p>
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}><Stars value={nr} onChange={setNr} size={24}/>{nr>0&&<span style={{fontSize:13,fontWeight:600,color:"#EAB308"}}>{nr}/5</span>}</div>
                <div style={{display:"flex",gap:8,marginBottom:12}}>
                  <input placeholder={t.phAuthor} value={na} onChange={e=>setNa(e.target.value)} style={{width:120,padding:"8px 12px",borderRadius:8,border:"1.5px solid #E7E5E4",fontSize:13,fontFamily:"'Outfit','Noto Sans SC'",color:"#1C1917"}}/>
                  <input placeholder={t.phComment} value={ncom} onChange={e=>setNcom(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")doComment()}} style={{flex:1,padding:"8px 12px",borderRadius:8,border:"1.5px solid #E7E5E4",fontSize:13,fontFamily:"'Outfit','Noto Sans SC'",color:"#1C1917"}}/>
                </div>
                <button onClick={doComment} disabled={subC} className="btn" style={{padding:"8px 18px",borderRadius:8,border:"none",background:"#191654",color:"#fff",fontSize:12,fontWeight:500,cursor:subC?"wait":"pointer",opacity:subC?.7:1}}>{t.submitComment}</button>
              </div>
              {comments.length===0?<p style={{textAlign:"center",color:"#A8A29E",fontSize:13,padding:"12px 0"}}>{t.noComments}</p>:<div style={{display:"flex",flexDirection:"column",gap:12}}>{comments.map((c,i)=><div key={c.id} style={{display:"flex",gap:12,animation:`fu .2s ease ${i*.05}s both`}}><div style={{width:32,height:32,borderRadius:"50%",background:`hsl(${(c.author||"").charCodeAt(0)*37%360},45%,65%)`,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:13,fontWeight:600,flexShrink:0}}>{(c.author||"?")[0].toUpperCase()}</div><div style={{flex:1}}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}><span style={{fontSize:13,fontWeight:600,color:"#1C1917"}}>{c.author}</span><Stars value={c.rating} ro size={12}/><span style={{fontSize:11,color:"#D6D3D1"}}>{fdt(c.created_at)}</span></div>{c.comment&&<p style={{margin:0,fontSize:13,color:"#57534E",lineHeight:1.5}}>{c.comment}</p>}</div></div>)}</div>}
            </div>
          </>}
        </div>
      </div>}
    </div>
  );
}
