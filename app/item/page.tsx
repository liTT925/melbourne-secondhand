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
  user_id: string;
  created_at: string;
};

export default function ItemDetailPage() {
  const params = useParams();
  const router = useRouter();

  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchItem() {
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

    fetchItem();
  }, [params.id]);

  if (loading) {
    return (
      <div style={{ padding: 40, fontSize: 18 }}>
        加载中...
      </div>
    );
  }

  if (!item) {
    return (
      <div style={{ padding: 40, fontSize: 18 }}>
        商品不存在
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(1000px 500px at 15% 0%, rgba(0,113,227,0.10) 0%, transparent 60%), radial-gradient(900px 480px at 90% 10%, rgba(46,204,113,0.10) 0%, transparent 55%), linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)",
        padding: "32px 16px",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", Arial, sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
        }}
      >
        <button
          onClick={() => router.push("/")}
          style={{
            marginBottom: 20,
            height: 42,
            padding: "0 16px",
            borderRadius: 12,
            border: "1px solid rgba(15,23,42,0.12)",
            background: "white",
            cursor: "pointer",
            fontWeight: 800,
          }}
        >
          返回首页
        </button>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.1fr 0.9fr",
            gap: 24,
          }}
        >
          <div
            style={{
              background: "rgba(255,255,255,0.92)",
              border: "1px solid rgba(15,23,42,0.08)",
              borderRadius: 24,
              overflow: "hidden",
              boxShadow: "0 20px 60px rgba(15,23,42,0.10)",
            }}
          >
            {item.image_url ? (
              <img
                src={item.image_url}
                alt={item.title}
                style={{
                  width: "100%",
                  height: 560,
                  objectFit: "cover",
                  display: "block",
                }}
              />
            ) : (
              <div
                style={{
                  height: 560,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "rgba(15,23,42,0.45)",
                  fontSize: 18,
                  background: "rgba(15,23,42,0.03)",
                }}
              >
                暂无图片
              </div>
            )}
          </div>

          <div
            style={{
              background: "rgba(255,255,255,0.92)",
              border: "1px solid rgba(15,23,42,0.08)",
              borderRadius: 24,
              padding: 24,
              boxShadow: "0 20px 60px rgba(15,23,42,0.10)",
            }}
          >
            <div
              style={{
                fontSize: 30,
                fontWeight: 900,
                lineHeight: 1.25,
                color: "#0f172a",
              }}
            >
              {item.title}
            </div>

            <div
              style={{
                marginTop: 12,
                fontSize: 28,
                fontWeight: 900,
                color: "#16a34a",
              }}
            >
              A${item.price}
            </div>

            <div
              style={{
                marginTop: 16,
                color: "rgba(15,23,42,0.55)",
                fontSize: 14,
              }}
            >
              发布时间：{new Date(item.created_at).toLocaleString()}
            </div>

            <div style={{ marginTop: 28 }}>
              <div
                style={{
                  fontWeight: 900,
                  fontSize: 18,
                  marginBottom: 10,
                }}
              >
                商品描述
              </div>
              <div
                style={{
                  lineHeight: 1.8,
                  color: "#334155",
                  whiteSpace: "pre-wrap",
                }}
              >
                {item.description || "卖家还没有填写描述"}
              </div>
            </div>

            <div style={{ marginTop: 28 }}>
              <div
                style={{
                  fontWeight: 900,
                  fontSize: 18,
                  marginBottom: 10,
                }}
              >
                联系卖家
              </div>

              <div
                style={{
                  display: "grid",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    padding: 12,
                    borderRadius: 14,
                    background: "rgba(15,23,42,0.04)",
                  }}
                >
                  微信：{item.wechat || "未填写"}
                </div>

                <div
                  style={{
                    padding: 12,
                    borderRadius: 14,
                    background: "rgba(15,23,42,0.04)",
                  }}
                >
                  手机号：{item.phone || "未填写"}
                </div>

                <div
                  style={{
                    padding: 12,
                    borderRadius: 14,
                    background: "rgba(15,23,42,0.04)",
                  }}
                >
                  取货地点：{item.location || "未填写"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}