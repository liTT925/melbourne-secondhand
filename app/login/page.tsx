"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function sendMagicLink() {
    setMsg(null);
    const e = email.trim();
    if (!e) return setMsg("请输入邮箱");
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: e,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
      },
    });
    setLoading(false);
    if (error) return setMsg("发送失败：" + error.message);
    setMsg("已发送登录链接到邮箱，请打开邮件点击链接完成登录。");
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <div style={{ maxWidth: 520, margin: "40px auto", padding: 20 }}>
      <h2>登录</h2>
      <p style={{ color: "#666" }}>先用邮箱登录（最省事），后面再升级 Google 登录。</p>

      <div style={{ display: "grid", gap: 12 }}>
        <input
          placeholder="你的邮箱"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: 12, borderRadius: 10, border: "1px solid #ddd" }}
        />

        <button
          onClick={sendMagicLink}
          disabled={loading}
          style={{
            padding: "12px 14px",
            borderRadius: 12,
            border: "none",
            cursor: "pointer",
            background: "#0071e3",
            color: "white",
            fontWeight: 800,
          }}
        >
          {loading ? "发送中..." : "发送登录链接"}
        </button>

        <button
          onClick={() => router.push("/")}
          style={{
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid #ddd",
            cursor: "pointer",
            background: "white",
            fontWeight: 700,
          }}
        >
          返回首页
        </button>

        <button
          onClick={logout}
          style={{
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid #ddd",
            cursor: "pointer",
            background: "white",
            color: "#d63031",
            fontWeight: 800,
          }}
        >
          退出当前账号
        </button>

        {msg && <div style={{ color: "#2d3436" }}>{msg}</div>}
      </div>
    </div>
  );
}