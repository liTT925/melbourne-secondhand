"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient, User } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const DRAFT_KEY = "publish_draft_v1";
const MAX_IMAGES = 6;
const MAX_MB_PER_IMAGE = 8;

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
  const [images, setImages] = useState<File[]>([]);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const previews = useMemo(() => {
    return images.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
  }, [images]);

  useEffect(() => {
    return () => {
      previews.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, [previews]);

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
    setImages([]);
    setMsg(null);
    sessionStorage.removeItem(DRAFT_KEY);
  }

  function handleImagesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    if (selected.length === 0) return;

    const remain = MAX_IMAGES - images.length;
    if (remain <= 0) {
      setMsg(`最多只能上传 ${MAX_IMAGES} 张图片`);
      e.target.value = "";
      return;
    }

    const accepted = selected.slice(0, remain);
    const tooLarge = accepted.find(
      (file) => file.size > MAX_MB_PER_IMAGE * 1024 * 1024
    );

    if (tooLarge) {
      setMsg(`单张图片不能超过 ${MAX_MB_PER_IMAGE}MB：${tooLarge.name}`);
      e.target.value = "";
      return;
    }

    setImages((prev) => [...prev, ...accepted]);
    setMsg(null);
    e.target.value = "";
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
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

    if (images.length > MAX_IMAGES) {
      setMsg(`最多只能上传 ${MAX_IMAGES} 张图片`);
      return;
    }

    const oversized = images.find(
      (file) => file.size > MAX_MB_PER_IMAGE * 1024 * 1024
    );
    if (oversized) {
      setMsg(`单张图片不能超过 ${MAX_MB_PER_IMAGE}MB：${oversized.name}`);
      return;
    }

    setLoading(true);

    try {
      // 先创建商品，先不写 image_url，后面多图上传完再更新封面图
      const { data: insertedItem, error: insertError } = await supabase
        .from("items")
        .insert({
          title: t,
          price: priceNum,
          description: d,
          image_url: null,
          wechat: w || null,
          phone: p || null,
          location: l || null,
          user_id: user.id,
        })
        .select("id")
        .single();

      if (insertError || !insertedItem?.id) {
        throw new Error("发布失败：" + (insertError?.message || "商品创建失败"));
      }

      const itemId = insertedItem.id as string;
      const uploadedUrls: string[] = [];

      // 逐张上传图片
      for (let i = 0; i < images.length; i++) {
        const file = images[i];
        const ext = safeExt(file.name);
        const filePath = `${user.id}/${itemId}/${i + 1}-${crypto.randomUUID()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("items")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type || `image/${ext}`,
          });

        if (uploadError) {
          throw new Error(`第 ${i + 1} 张图片上传失败：${uploadError.message}`);
        }

        const { data: publicData } = supabase.storage
          .from("items")
          .getPublicUrl(filePath);

        if (!publicData?.publicUrl) {
          throw new Error(`第 ${i + 1} 张图片获取公开链接失败`);
        }

        uploadedUrls.push(publicData.publicUrl);
      }

      // 写入 item_images 表
      if (uploadedUrls.length > 0) {
        const imageRows = uploadedUrls.map((url, index) => ({
          item_id: itemId,
          image_url: url,
          sort_order: index,
        }));

        const { error: imageInsertError } = await supabase
          .from("item_images")
          .insert(imageRows);

        if (imageInsertError) {
          throw new Error("图片记录保存失败：" + imageInsertError.message);
        }

        // 把第一张图写回 items.image_url，兼容你现有首页和详情页
        const { error: coverUpdateError } = await supabase
          .from("items")
          .update({ image_url: uploadedUrls[0] })
          .eq("id", itemId);

        if (coverUpdateError) {
          throw new Error("封面图更新失败：" + coverUpdateError.message);
        }
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
          width: "min(960px, 100%)",
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
                  fontSize: 32,
                  lineHeight: 1.08,
                  color: "#0f172a",
                  letterSpacing: -0.4,
                }}
              >
                发布商品
              </h1>

              <div
                style={{
                  marginTop: 8,
                  color: "rgba(15,23,42,0.62)",
                  fontSize: 14,
                  lineHeight: 1.7,
                  maxWidth: 620,
                }}
              >
                把商品信息写清楚、图片拍明白，成交速度会快很多。现在已经支持多图发布，第一张会自动作为封面图。
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
            gridTemplateColumns: "1.28fr 0.72fr",
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
                  borderRadius: 20,
                  padding: 16,
                  background:
                    "linear-gradient(180deg, rgba(15,23,42,0.022) 0%, rgba(15,23,42,0.035) 100%)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    alignItems: "center",
                    flexWrap: "wrap",
                    marginBottom: 8,
                  }}
                >
                  <div
                    style={{
                      fontWeight: 900,
                      fontSize: 15,
                      color: "#0f172a",
                    }}
                  >
                    商品图片
                  </div>

                  <div
                    style={{
                      padding: "6px 10px",
                      borderRadius: 999,
                      background: "rgba(0,113,227,0.08)",
                      color: "#0b63c8",
                      fontSize: 12,
                      fontWeight: 800,
                    }}
                  >
                    {images.length}/{MAX_IMAGES} 张
                  </div>
                </div>

                <div
                  style={{
                    color: "rgba(15,23,42,0.62)",
                    fontSize: 13,
                    marginBottom: 12,
                    lineHeight: 1.7,
                  }}
                >
                  支持 jpg / jpeg / png / webp / gif。现在最多可上传 {MAX_IMAGES} 张，建议第一张放封面图，清晰、干净、光线足。
                </div>

                <label
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: 46,
                    padding: "0 16px",
                    borderRadius: 14,
                    background: "linear-gradient(135deg, #0071e3 0%, #16a34a 100%)",
                    color: "white",
                    fontWeight: 900,
                    cursor: "pointer",
                    boxShadow: "0 14px 30px rgba(0,113,227,0.18)",
                  }}
                >
                  选择图片
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImagesChange}
                    style={{ display: "none" }}
                  />
                </label>

                <div
                  style={{
                    marginTop: 12,
                    color: "rgba(15,23,42,0.52)",
                    fontSize: 12,
                    lineHeight: 1.7,
                  }}
                >
                  单张图片不超过 {MAX_MB_PER_IMAGE}MB。第一张会作为封面图显示在首页和详情页。
                </div>

                {previews.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <div
                      style={{
                        color: "rgba(15,23,42,0.58)",
                        fontSize: 12,
                        marginBottom: 10,
                        fontWeight: 800,
                      }}
                    >
                      图片预览
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                        gap: 12,
                      }}
                    >
                      {previews.map((item, index) => (
                        <div
                          key={`${item.file.name}-${index}`}
                          style={{
                            position: "relative",
                            borderRadius: 18,
                            overflow: "hidden",
                            background: "#fff",
                            border: "1px solid rgba(15,23,42,0.08)",
                            boxShadow: "0 10px 28px rgba(15,23,42,0.06)",
                          }}
                        >
                          <div
                            style={{
                              position: "absolute",
                              top: 10,
                              left: 10,
                              zIndex: 2,
                              padding: "6px 9px",
                              borderRadius: 999,
                              background:
                                index === 0
                                  ? "rgba(22,163,74,0.92)"
                                  : "rgba(15,23,42,0.72)",
                              color: "white",
                              fontSize: 11,
                              fontWeight: 900,
                              boxShadow: "0 8px 20px rgba(15,23,42,0.18)",
                            }}
                          >
                            {index === 0 ? "封面图" : `图 ${index + 1}`}
                          </div>

                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            style={{
                              position: "absolute",
                              top: 10,
                              right: 10,
                              zIndex: 2,
                              width: 32,
                              height: 32,
                              borderRadius: 999,
                              border: "none",
                              background: "rgba(255,255,255,0.92)",
                              color: "#b02323",
                              cursor: "pointer",
                              fontWeight: 900,
                              boxShadow: "0 8px 20px rgba(15,23,42,0.12)",
                            }}
                          >
                            ×
                          </button>

                          <img
                            src={item.url}
                            alt={`preview-${index + 1}`}
                            style={{
                              width: "100%",
                              height: 180,
                              objectFit: "cover",
                              display: "block",
                            }}
                          />

                          <div
                            style={{
                              padding: 10,
                              fontSize: 12,
                              color: "rgba(15,23,42,0.62)",
                              lineHeight: 1.5,
                              background: "rgba(255,255,255,0.95)",
                            }}
                          >
                            <div
                              style={{
                                fontWeight: 800,
                                color: "#0f172a",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {item.file.name}
                            </div>
                            <div style={{ marginTop: 4 }}>
                              {(item.file.size / 1024 / 1024).toFixed(2)} MB
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
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
                发布概览
              </div>

              <div style={{ display: "grid", gap: 10 }}>
                <MiniStat label="标题状态" value={title.trim() ? "已填写" : "待填写"} />
                <MiniStat label="价格状态" value={price.trim() ? "已填写" : "待填写"} />
                <MiniStat label="图片数量" value={`${images.length} / ${MAX_IMAGES}`} />
                <MiniStat label="封面图" value={images.length > 0 ? images[0].name : "未选择"} />
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
                小提示
              </div>

              <div style={{ display: "grid", gap: 10 }}>
                <Tip text="标题越具体越好，比如品牌、型号、成色。" />
                <Tip text="价格建议直接写整数，买家更容易快速判断。" />
                <Tip text="第一张图片尽量作为封面图，干净清晰最重要。" />
                <Tip text="多拍细节图会明显提高点击率和成交率。" />
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
        @media (max-width: 920px) {
          div[style*="grid-template-columns: 1.28fr 0.72fr"] {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 720px) {
          div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 680px) {
          div[style*="grid-template-columns: repeat(3, minmax(0, 1fr))"] {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }

        @media (max-width: 460px) {
          div[style*="grid-template-columns: repeat(2, minmax(0, 1fr))"] {
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

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        padding: "12px 14px",
        borderRadius: 14,
        background: "rgba(15,23,42,0.035)",
        border: "1px solid rgba(15,23,42,0.05)",
      }}
    >
      <div
        style={{
          fontSize: 12,
          color: "rgba(15,23,42,0.52)",
          fontWeight: 800,
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 14,
          color: "#0f172a",
          fontWeight: 900,
          wordBreak: "break-all",
        }}
      >
        {value}
      </div>
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