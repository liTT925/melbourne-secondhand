"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function PublishPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit() {
    setMsg(null);

    if (!title.trim()) return setMsg("请输入标题");
    if (!price.trim()) return setMsg("请输入价格");
    const priceNum = Number(price);
    if (Number.isNaN(priceNum) || priceNum < 0) return setMsg("价格请输入数字");

    setLoading(true);
    const { error } = await supabase.from("items").insert({
      title: title.trim(),
      price: priceNum,
      description: description.trim(),
    });
    setLoading(false);

    if (error) return setMsg("发布失败：" + error.message);

    // 发布成功：回到首页并让首页重新拉取数据（最简单可靠做法：回首页后刷新一次）
    router.push("/");
    setTimeout(() => {
      window.location.reload();
    }, 100);
  }

  return (
    <div style={{ maxWidth: 720, margin: "30px auto", padding: 20 }}>
      <h2 style={{ marginBottom: 10 }}>发布商品</h2>
      <p style={{ color: "#666", marginTop: 0 }}>
        填完点击发布，商品会出现在首页列表。
      </p>

      <div style={{ display: "grid", gap: 12 }}>
        <input
          placeholder="标题，例如：iPhone 14 Pro"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ padding: 12, borderRadius: 10, border: "1px solid #ddd" }}
        />

        <input
          placeholder="价格（AUD），例如：350"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          style={{ padding: 12, borderRadius: 10, border: "1px solid #ddd" }}
        />

        <textarea
          placeholder="描述（成色/取货地点/是否可小刀）"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          style={{ padding: 12, borderRadius: 10, border: "1px solid #ddd" }}
        />

        <button
          onClick={submit}
          disabled={loading}
          style={{
            padding: "12px 14px",
            borderRadius: 12,
            border: "none",
            cursor: "pointer",
            background: "#2ecc71",
            color: "white",
            fontWeight: 700,
          }}
        >
          {loading ? "发布中..." : "发布"}
        </button>

        <button
          onClick={() => router.push("/")}
          style={{
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid #ddd",
            cursor: "pointer",
            background: "white",
          }}
        >
          返回首页
        </button>

        {msg && <div style={{ color: "#d63031" }}>{msg}</div>}
      </div>
    </div>
  );
}