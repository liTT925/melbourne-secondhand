"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function safeExt(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  if (!ext) return "jpg";
  const ok = ["jpg", "jpeg", "png", "webp", "gif"];
  return ok.includes(ext) ? ext : "jpg";
}

export default function PublishPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");

  const [wechat, setWechat] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");

  const [image, setImage] = useState<File | null>(null);

  const preview = useMemo(() => {
    if (!image) return null;
    return URL.createObjectURL(image);
  }, [image]);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit() {
    setMsg(null);

    // 1) 必须登录
    const { data: auth, error: authErr } = await supabase.auth.getUser();
    if (authErr) {
      setMsg("获取登录状态失败：" + authErr.message);
      return;
    }
    if (!auth.user) {
      setMsg("请先登录再发布");
      router.push("/login");
      return;
    }

    // 2) 基础校验
    const t = title.trim();
    const d = description.trim();
    const w = wechat.trim();
    const p = phone.trim();
    const l = location.trim();

    if (!t) return setMsg("请输入商品标题");

    const priceNum = Number(price);
    if (!price || Number.isNaN(priceNum) || priceNum < 0) {
      return setMsg("价格请输入正确数字（≥0）");
    }

    setLoading(true);

    try {
      let imageUrl: string | null = null;

      // 3) 上传图片（可选）
      if (image) {
        // 文件大小限制
        const maxMB = 8;
        if (image.size > maxMB * 1024 * 1024) {
          throw new Error(`图片太大（>${maxMB}MB），请换小一点的`);
        }

        // 路径建议带 userId，避免撞名 + 更好管理
        const ext = safeExt(image.name);
        const filePath = `${auth.user.id}/${crypto.randomUUID()}.${ext}`;

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

      // 4) 写入数据库
      const { error: insertError } = await supabase.from("items").insert({
        title: t,
        price: priceNum,
        description: d,
        image_url: imageUrl,
        wechat: w || null,
        phone: p || null,
        location: l || null,
        user_id: auth.user.id,
      });

      if (insertError) {
        throw new Error("发布失败：" + insertError.message);
      }

      // 5) 成功返回首页
      router.push("/");
      setTimeout(() => window.location.reload(), 200);
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
          "radial-gradient(1000px 500px at 15% 0%, rgba(0,113,227,0.16) 0%, transparent 60%), radial-gradient(900px 480px at 90% 10%, rgba(46,204,113,0.16) 0%, transparent 55%), linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)",
        display: "flex",
        justifyContent: "center",
        padding: "32px 16px",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", Arial, sans-serif',
      }}
    >
      <div
        style={{
          width: "min(720px, 100%)",
          background: "rgba(255,255,255,0.92)",
          border: "1px solid rgba(15,23,42,0.08)",
          borderRadius: 22,
          padding: 26,
          boxShadow: "0 20px 60px rgba(15,23,42,0.10)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 26 }}>发布商品</h2>
            <div style={{ marginTop: 6, color: "rgba(15,23,42,0.6)", fontSize: 13 }}>
              先把“能发、能看、带图”做到稳定，颜值再继续加满。
            </div>
          </div>

          <button
            onClick={() => router.push("/")}
            style={{
              height: 40,
              padding: "0 14px",
              borderRadius: 12,
              border: "1px solid rgba(15,23,42,0.12)",
              background: "white",
              cursor: "pointer",
              fontWeight: 800,
            }}
          >
            返回
          </button>
        </div>

        <div style={{ display: "grid", gap: 12, marginTop: 18 }}>
          <input
            placeholder="标题，例如：iPhone 14 / 单车 / 桌子"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              padding: 14,
              borderRadius: 14,
              border: "1px solid rgba(15,23,42,0.12)",
              outline: "none",
              fontSize: 14,
              background: "white",
            }}
          />

          <input
            placeholder="价格（AUD），例如：350"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            style={{
              padding: 14,
              borderRadius: 14,
              border: "1px solid rgba(15,23,42,0.12)",
              outline: "none",
              fontSize: 14,
              background: "white",
            }}
          />

          <textarea
            placeholder="描述（成色 / 使用情况 / 是否可小刀）"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            style={{
              padding: 14,
              borderRadius: 14,
              border: "1px solid rgba(15,23,42,0.12)",
              outline: "none",
              fontSize: 14,
              background: "white",
              resize: "vertical",
            }}
          />

          <input
            placeholder="微信（可选）"
            value={wechat}
            onChange={(e) => setWechat(e.target.value)}
            style={{
              padding: 14,
              borderRadius: 14,
              border: "1px solid rgba(15,23,42,0.12)",
              outline: "none",
              fontSize: 14,
              background: "white",
            }}
          />

          <input
            placeholder="手机号（可选）"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={{
              padding: 14,
              borderRadius: 14,
              border: "1px solid rgba(15,23,42,0.12)",
              outline: "none",
              fontSize: 14,
              background: "white",
            }}
          />

          <input
            placeholder="取货地点（例如：Monash Clayton）"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            style={{
              padding: 14,
              borderRadius: 14,
              border: "1px solid rgba(15,23,42,0.12)",
              outline: "none",
              fontSize: 14,
              background: "white",
            }}
          />

          <div
            style={{
              border: "1px dashed rgba(15,23,42,0.18)",
              borderRadius: 16,
              padding: 14,
              background: "rgba(15,23,42,0.02)",
            }}
          >
            <div style={{ fontWeight: 900, marginBottom: 8 }}>商品图片</div>

            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files?.[0] ?? null)}
            />

            {preview && (
              <div style={{ marginTop: 12 }}>
                <div style={{ color: "rgba(15,23,42,0.6)", fontSize: 12, marginBottom: 8 }}>
                  预览
                </div>
                <img
                  src={preview}
                  alt="preview"
                  style={{
                    width: "100%",
                    maxHeight: 360,
                    objectFit: "cover",
                    borderRadius: 16,
                    border: "1px solid rgba(15,23,42,0.08)",
                  }}
                />
              </div>
            )}
          </div>

          <button
            onClick={submit}
            disabled={loading}
            style={{
              padding: "14px 16px",
              borderRadius: 16,
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              background: "linear-gradient(135deg, #2ecc71 0%, #1abc9c 100%)",
              color: "white",
              fontWeight: 900,
              fontSize: 15,
              boxShadow: "0 14px 30px rgba(46,204,113,0.22)",
            }}
          >
            {loading ? "发布中..." : "发布商品"}
          </button>

          {msg && (
            <div
              style={{
                padding: 12,
                borderRadius: 14,
                background: "rgba(214,48,49,0.08)",
                border: "1px solid rgba(214,48,49,0.25)",
                color: "#b02323",
                fontWeight: 800,
              }}
            >
              {msg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}