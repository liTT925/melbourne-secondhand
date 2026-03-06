"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient, User } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const DRAFT_KEY = "publish_draft_v1";

function safeExt(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  if (!ext) return "jpg";
  const ok = ["jpg", "jpeg", "png", "webp", "gif"];
  return ok.includes(ext) ? ext : "jpg";
}

type DraftData = {
  title: string;
  price: string;
  description: string;
  wechat: string;
  phone: string;
  location: string;
};

export default function PublishPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [wechat, setWechat] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [image, setImage] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const preview = useMemo(() => {
    if (!image) return null;
    return URL.createObjectURL(image);
  }, [image]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  useEffect(() => {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (raw) {
      try {
        const draft: DraftData = JSON.parse(raw);
        setTitle(draft.title || "");
        setPrice(draft.price || "");
        setDescription(draft.description || "");
        setWechat(draft.wechat || "");
        setPhone(draft.phone || "");
        setLocation(draft.location || "");
      } catch {}
    }
  }, []);

  useEffect(() => {
    const draft: DraftData = {
      title,
      price,
      description,
      wechat,
      phone,
      location,
    };
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [title, price, description, wechat, phone, location]);

  useEffect(() => {
    let mounted = true;

    async function checkAuth() {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      setUser(data.user ?? null);
      setCheckingAuth(false);
    }

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async () => {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      setUser(data.user ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  function goLogin() {
    router.push("/login?redirect=/publish");
  }

  function clearDraft() {
    setTitle("");
    setPrice("");
    setDescription("");
    setWechat("");
    setPhone("");
    setLocation("");
    setImage(null);
    setMsg(null);
    sessionStorage.removeItem(DRAFT_KEY);
  }

  async function submit() {
    setMsg(null);

    if (!user) {
      sessionStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          title,
          price,
          description,
          wechat,
          phone,
          location,
        })
      );
      router.push("/login?redirect=/publish");
      return;
    }

    const t = title.trim();
    const d = description.trim();
    const w = wechat.trim();
    const p = phone.trim();
    const l = location.trim();

    if (!t) {
      setMsg("请输入商品标题");
      return;
    }

    const priceNum = Number(price);
    if (!price || Number.isNaN(priceNum) || priceNum < 0) {
      setMsg("价格请输入正确数字（≥0）");
      return;
    }

    setLoading(true);

    try {
      let imageUrl: string | null = null;

      if (image) {
        const maxMB = 8;
        if (image.size > maxMB * 1024 * 1024) {
          throw new Error(`图片太大（>${maxMB}MB），请换小一点的`);
        }

        const ext = safeExt(image.name);
        const filePath = `${user.id}/${crypto.randomUUID()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("items")
          .upload(filePath, image, {
            cacheControl: "3600",
            upsert: false,
            contentType: image.type || `image/${ext}`,
          });

        if (uploadError) {
          throw new Error("图片上传失败：" + uploadError.message);
        }

        const { data: publicData } = supabase.storage
          .from("items")
          .getPublicUrl(filePath);

        if (!publicData?.publicUrl) {
          throw new Error("获取图片公开链接失败");
        }

        imageUrl = publicData.publicUrl;
      }

      const { error: insertError } = await supabase.from("items").insert({
        title: t,
        price: priceNum,
        description: d,
        image_url: imageUrl,
        wechat: w || null,
        phone: p || null,
        location: l || null,
        user_id: user.id,
      });

      if (insertError) {
        throw new Error("发布失败：" + insertError.message);
      }

      sessionStorage.removeItem(DRAFT_KEY);
      router.push("/");
      setTimeout(() => window.location.reload(), 150);
    } catch (e: any) {
      setMsg(e?.message ?? "发生未知错误");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(1200px 600px at 0% 0%, rgba(0,113,227,0.16), transparent 55%), radial-gradient(1000px 580px at 100% 0%, rgba(46,204,113,0.15), transparent 50%), linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)",
        padding: "28px 14px 48px",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", Arial, sans-serif',
      }}
    >
      <div
        style={{
          width: "min(860px, 100%)",
          margin: "0 auto",
          display: "grid",
          gap: 16,
        }}
      >
        <div
          style={{
            background: "rgba(255,255,255,0.9)",
            border: "1px solid rgba(15,23,42,0.08)",
            borderRadius: 24,
            padding: 22,
            boxShadow: "0 18px 50px rgba(15,23,42,0.10)",
            backdropFilter: "blur(10px)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 14,
              alignItems: "flex-start",
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "6px 10px",
                  borderRadius: 999,
                  background: "rgba(0,113,227,0.08)",
                  color: "#0b63c8",
                  fontSize: 12,
                  fontWeight: 800,
                  marginBottom: 10,
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
                发布商品
              </h1>

              <div
                style={{
                  marginTop: 8,
                  color: "rgba(15,23,42,0.62)",
                  fontSize: 14,
                  lineHeight: 1.6,
                }}
              >
                把商品信息写清楚、图片拍明白，成交速度会快很多。
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                onClick={() => router.push("/")}
                style={{
                  height: 42,
                  padding: "0 16px",
                  borderRadius: 14,
                  border: "1px solid rgba(15,23,42,0.12)",
                  background: "#fff",
                  cursor: "pointer",
                  fontWeight: 800,
                }}
              >
                返回首页
              </button>

              <button
                onClick={clearDraft}
                style={{
                  height: 42,
                  padding: "0 16px",
                  borderRadius: 14,
                  border: "1px solid rgba(15,23,42,0.08)",
                  background: "rgba(15,23,42,0.04)",
                  cursor: "pointer",
                  fontWeight: 800,
                }}
              >
                清空草稿
              </button>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.25fr 0.75fr",
            gap: 16,
          }}
        >
          <div
            style={{
              background: "rgba(255,255,255,0.92)",
              border: "1px solid rgba(15,23,42,0.08)",
              borderRadius: 24,
              padding: 22,
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
              商品信息
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              <input
                placeholder="标题，例如：iPhone 14 / 单车 / 小书桌"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={inputStyle}
              />

              <input
                placeholder="价格（AUD），例如：350"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                style={inputStyle}
              />

              <textarea
                placeholder="描述（成色 / 使用时长 / 是否可小刀 / 交易方式）"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                style={{ ...inputStyle, resize: "vertical", minHeight: 140 }}
              />

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                <input
                  placeholder="微信（可选）"
                  value={wechat}
                  onChange={(e) => setWechat(e.target.value)}
                  style={inputStyle}
                />
                <input
                  placeholder="手机号（可选）"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <input
                placeholder="取货地点，例如：Monash Clayton"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                style={inputStyle}
              />

              <div
                style={{
                  border: "1px dashed rgba(15,23,42,0.18)",
                  borderRadius: 18,
                  padding: 16,
                  background: "rgba(15,23,42,0.025)",
                }}
              >
                <div
                  style={{
                    fontWeight: 900,
                    fontSize: 15,
                    color: "#0f172a",
                    marginBottom: 8,
                  }}
                >
                  商品图片
                </div>

                <div
                  style={{
                    color: "rgba(15,23,42,0.62)",
                    fontSize: 13,
                    marginBottom: 10,
                  }}
                >
                  支持 jpg / jpeg / png / webp / gif，建议图片清晰、干净、光线足。
                </div>

                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImage(e.target.files?.[0] ?? null)}
                />

                {preview && (
                  <div style={{ marginTop: 14 }}>
                    <div
                      style={{
                        color: "rgba(15,23,42,0.58)",
                        fontSize: 12,
                        marginBottom: 8,
                      }}
                    >
                      预览
                    </div>
                    <img
                      src={preview}
                      alt="preview"
                      style={{
                        width: "100%",
                        maxHeight: 360,
                        objectFit: "cover",
                        borderRadius: 18,
                        border: "1px solid rgba(15,23,42,0.08)",
                        display: "block",
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gap: 16, alignContent: "start" }}>
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
                账号状态
              </div>

              {checkingAuth ? (
                <div style={mutedText}>正在检查登录状态...</div>
              ) : user ? (
                <div
                  style={{
                    padding: 14,
                    borderRadius: 16,
                    background: "rgba(46,204,113,0.10)",
                    border: "1px solid rgba(46,204,113,0.22)",
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
                  }}
                >
                  <div
                    style={{
                      fontWeight: 900,
                      color: "#8a4b00",
                      marginBottom: 6,
                    }}
                  >
                    还没有登录
                  </div>
                  <div style={{ ...mutedText, marginBottom: 12 }}>
                    发布商品前需要先登录，草稿会自动保留。
                  </div>
                  <button onClick={goLogin} style={secondaryButtonStyle}>
                    去登录
                  </button>
                </div>
              )}
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
                小提示
              </div>

              <div style={{ display: "grid", gap: 10 }}>
                <Tip text="标题越具体越好，比如品牌、型号、成色。" />
                <Tip text="价格建议直接写整数，买家更容易快速判断。" />
                <Tip text="图片清晰会明显提高点击率和成交率。" />
                <Tip text="描述里写清楚取货地点和交易方式。" />
              </div>
            </div>

            <button
              onClick={submit}
              disabled={loading || checkingAuth}
              style={{
                padding: "16px 18px",
                borderRadius: 18,
                border: "none",
                cursor: loading || checkingAuth ? "not-allowed" : "pointer",
                background: "linear-gradient(135deg, #2ecc71 0%, #1abc9c 100%)",
                color: "#fff",
                fontWeight: 900,
                fontSize: 16,
                boxShadow: "0 16px 34px rgba(46,204,113,0.24)",
              }}
            >
              {loading ? "发布中..." : user ? "确认发布" : "登录后发布"}
            </button>

            {msg && (
              <div
                style={{
                  padding: 14,
                  borderRadius: 16,
                  background: "rgba(214,48,49,0.08)",
                  border: "1px solid rgba(214,48,49,0.25)",
                  color: "#b02323",
                  fontWeight: 800,
                  lineHeight: 1.6,
                }}
              >
                {msg}
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 860px) {
          div[style*="grid-template-columns: 1.25fr 0.75fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
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
  height: 40,
  padding: "0 14px",
  borderRadius: 12,
  border: "1px solid rgba(15,23,42,0.12)",
  background: "#fff",
  cursor: "pointer",
  fontWeight: 800,
};