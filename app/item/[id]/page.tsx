"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Item = {
  id: string;
  title: string;
  price: number;
  description: string | null;
  image_url: string | null;
  wechat: string | null;
  phone: string | null;
  location: string | null;
  created_at: string;
};

export default function ItemPage() {
  const params = useParams();
  const router = useRouter();

  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadItem() {
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq("id", params.id)
        .single();

      if (!error && data) {
        setItem(data);
      }

      setLoading(false);
    }

    loadItem();
  }, [params.id]);

  if (loading) {
    return <div style={{ padding: 40 }}>加载中...</div>;
  }

  if (!item) {
    return <div style={{ padding: 40 }}>商品不存在</div>;
  }

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", padding: 20 }}>
      <button
        onClick={() => router.push("/")}
        style={{
          marginBottom: 20,
          padding: "10px 14px",
          borderRadius: 10,
          border: "1px solid #ddd",
          background: "white",
          cursor: "pointer",
        }}
      >
        返回首页
      </button>

      <h1 style={{ fontSize: 32 }}>{item.title}</h1>

      <div style={{ fontSize: 26, fontWeight: 800, marginTop: 10 }}>
        A${item.price}
      </div>

      {item.image_url && (
        <img
          src={item.image_url}
          style={{
            width: "100%",
            maxHeight: 500,
            objectFit: "cover",
            marginTop: 20,
            borderRadius: 12,
          }}
        />
      )}

      <div style={{ marginTop: 30 }}>
        <h3>商品描述</h3>
        <p>{item.description || "暂无描述"}</p>
      </div>

      <div style={{ marginTop: 30 }}>
        <h3>联系卖家</h3>
        <p>微信：{item.wechat || "未填写"}</p>
        <p>电话：{item.phone || "未填写"}</p>
        <p>取货地点：{item.location || "未填写"}</p>
      </div>
    </div>
  );
}