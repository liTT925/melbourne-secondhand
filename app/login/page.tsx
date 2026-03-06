"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient, User } from "@supabase/supabase-js";
import { useRouter, useSearchParams } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirect = useMemo(() => {
    const raw = searchParams.get("redirect");
    if (!raw || !raw.startsWith("/")) return "/";
    return raw;
  }, [searchParams]);

  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let mounted = true;

    async function init() {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;

      setUser(data.user ?? null);
      setChecking(false);

      if (data.user) {
        router.replace(redirect);
      }
    }

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event) => {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;

      setUser(data.user ?? null);

      if (event === "SIGNED_IN" && data.user) {
        router.replace(redirect);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [redirect, router]);

  async function sendMagicLink() {
    setMsg(null);
    const e = email.trim();

    if (!e) {
      setMsg("请输入邮箱");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email: e,
      options: {
        emailRedirectTo: `${window.location.origin}${redirect}`,
      },
    });

    setLoading(false);

    if (error) {
      setMsg("发送失败：" + error.message);
      return;
    }

    setMsg(
      "登录链接已经发到你的邮箱。请在同一台设备上打开邮件里的链接，登录成功后会自动回到刚才的页面。"
    );
  }

  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
    setMsg("已退出当前账号");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(1000px 520px at 10% 0%, rgba(0,113,227,0.16), transparent 55%), radial-gradient(900px 500px at 100% 10%, rgba(46,204,113,0.15), transparent 55%), linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)",
        padding: "28px 14px 48px",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", Arial, sans-serif',
      }}
    >
      <div
        style={{
          width: "min(620px, 100%)",
          margin: "0 auto",
          display: "grid",
          gap: 16,
        }}
      >
        <div
          style={{
            background: "rgba(255,255,255,0.92)",
            border: "1px solid rgba(15,23,42,0.08)",
            borderRadius: 24,
            padding: 24,
            boxShadow: "0 18px 50px rgba(15,23,42,0.10)",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              padding: "6px 10px",
              borderRadius: 999,
              background: "rgba(0,113,227,0.08)",
              color: "#0b63c8",
              fontSize: 12,
              fontWeight: 800,
              marginBottom: 12,
            }}
          >
            Melbourne Secondhand
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: 30,
              lineHeight: 1.1,
              color: "#0f172a",
            }}
          >
            邮箱登录
          </h1>

          <p
            style={{
              color: "rgba(15,23,42,0.62)",
              lineHeight: 1.7,
              fontSize: 14,
              marginTop: 10,
              marginBottom: 0,
            }}
          >
            先用邮箱魔法链接登录，最省事。登录成功后会自动跳回
            <span style={{ fontWeight: 800, color: "#0f172a" }}> {redirect} </span>
            。
          </p>
        </div>

        <div
          style={{
            background: "rgba(255,255,255,0.92)",
            border: "1px solid rgba(15,23,42,0.08)",
            borderRadius: 24,
            padding: 24,
            boxShadow: "0 18px 50px rgba(15,23,42,0.08)",
          }}
        >
          <div
            style={{
              fontSize: 18,
              fontWeight: 900,
              color: "#0f172a",
              marginBottom: 14,
            }}
          >
            登录状态
          </div>

          {checking ? (
            <div style={mutedText}>正在检查当前登录状态...</div>
          ) : user ? (
            <div
              style={{
                padding: 14,
                borderRadius: 16,
                background: "rgba(46,204,113,0.10)",
                border: "1px solid rgba(46,204,113,0.22)",
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  color: "rgba(15,23,42,0.62)",
                  marginBottom: 4,
                }}
              >
                当前已登录
              </div>
              <div
                style={{
                  fontWeight: 900,
                  color: "#0f172a",
                  wordBreak: "break-all",
                }}
              >
                {user.email || "已登录用户"}
              </div>
            </div>
          ) : (
            <div
              style={{
                padding: 14,
                borderRadius: 16,
                background: "rgba(255,159,67,0.10)",
                border: "1px solid rgba(255,159,67,0.24)",
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  fontWeight: 900,
                  color: "#8a4b00",
                  marginBottom: 6,
                }}
              >
                当前未登录
              </div>
              <div style={mutedText}>
                输入邮箱后，系统会发一封登录邮件给你。
              </div>
            </div>
          )}

          <div style={{ display: "grid", gap: 12 }}>
            <input
              placeholder="你的邮箱"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
            />

            <button
              onClick={sendMagicLink}
              disabled={loading}
              style={{
                padding: "14px 16px",
                borderRadius: 16,
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                background: "linear-gradient(135deg, #0071e3 0%, #2d8cff 100%)",
                color: "white",
                fontWeight: 900,
                fontSize: 15,
                boxShadow: "0 14px 30px rgba(0,113,227,0.22)",
              }}
            >
              {loading ? "发送中..." : "发送登录链接"}
            </button>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              <button onClick={() => router.push("/")} style={secondaryButtonStyle}>
                返回首页
              </button>

              <button
                onClick={logout}
                style={{
                  ...secondaryButtonStyle,
                  color: "#d63031",
                }}
              >
                退出当前账号
              </button>
            </div>

            {msg && (
              <div
                style={{
                  padding: 14,
                  borderRadius: 16,
                  background: "rgba(15,23,42,0.04)",
                  border: "1px solid rgba(15,23,42,0.08)",
                  color: "#334155",
                  lineHeight: 1.7,
                  fontWeight: 700,
                }}
              >
                {msg}
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            background: "rgba(255,255,255,0.92)",
            border: "1px solid rgba(15,23,42,0.08)",
            borderRadius: 24,
            padding: 20,
            boxShadow: "0 18px 50px rgba(15,23,42,0.08)",
          }}
        >
          <div
            style={{
              fontSize: 18,
              fontWeight: 900,
              color: "#0f172a",
              marginBottom: 12,
            }}
          >
            使用说明
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            <Tip text="输入邮箱后，去邮箱里打开登录邮件。" />
            <Tip text="尽量在同一台设备上点开邮件链接，登录会更顺。" />
            <Tip text={`登录成功后会自动跳回 ${redirect}。`} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Tip({ text }: { text: string }) {
  return (
    <div
      style={{
        padding: "12px 14px",
        borderRadius: 14,
        background: "rgba(15,23,42,0.035)",
        color: "#334155",
        fontSize: 14,
        lineHeight: 1.5,
      }}
    >
      {text}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: 14,
  borderRadius: 16,
  border: "1px solid rgba(15,23,42,0.12)",
  outline: "none",
  fontSize: 14,
  background: "#fff",
  width: "100%",
  boxSizing: "border-box",
};

const mutedText: React.CSSProperties = {
  color: "rgba(15,23,42,0.62)",
  fontSize: 14,
  lineHeight: 1.6,
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: "12px 14px",
  borderRadius: 14,
  border: "1px solid rgba(15,23,42,0.12)",
  cursor: "pointer",
  background: "white",
  fontWeight: 800,
};