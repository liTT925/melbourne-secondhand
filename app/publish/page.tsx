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
  const [image, setImage] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit() {
    setMsg(null);

    const { data: auth } = await supabase.auth.getUser();

    if (!auth.user) {
      router.push("/login");
      return;
    }

    if (!title.trim()) return setMsg("请输入标题");

    const priceNum = Number(price);

    if (Number.isNaN(priceNum)) return setMsg("价格必须是数字");

    setLoading(true);

    let imageUrl = null;

    // 上传图片
    if (image) {
      const fileName = Date.now() + "-" + image.name;

      const { error: uploadError } = await supabase.storage
        .from("items")
        .upload(fileName, image);

      if (uploadError) {
        setLoading(false);
        return setMsg("图片上传失败");
      }

      const { data } = supabase.storage.from("items").getPublicUrl(fileName);

      imageUrl = data.publicUrl;
    }

    const { error } = await supabase.from("items").insert({
      title,
      price: priceNum,
      description,
      image_url: imageUrl,
      user_id: auth.user.id
    });

    setLoading(false);

    if (error) {
      setMsg("发布失败：" + error.message);
      return;
    }

    router.push("/");
    setTimeout(() => {
      window.location.reload();
    }, 200);
  }

  return (
    <div style={{ maxWidth: 720, margin: "30px auto", padding: 20 }}>
      <h2>发布商品</h2>

      <div style={{ display: "grid", gap: 12 }}>

        <input
          placeholder="商品标题"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <input
          placeholder="价格 AUD"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />

        <textarea
          placeholder="商品描述"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            if (e.target.files) setImage(e.target.files[0]);
          }}
        />

        <button onClick={submit} disabled={loading}>
          {loading ? "发布中..." : "发布商品"}
        </button>

        {msg && <div>{msg}</div>}
      </div>
    </div>
  );
}