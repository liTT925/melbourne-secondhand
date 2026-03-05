"use client";

import { supabase } from "../lib/supabase";

export default function PostPage() {

  async function handleSubmit() {
    const { error } = await supabase.from("item").insert([
      {
        title: "测试商品",
        price: 20,
        description: "测试描述",
      },
    ]);

    if (error) {
      alert("发布失败：" + error.message);
    } else {
      alert("发布成功！");
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>发布闲置</h1>

      <button
        onClick={handleSubmit}
        style={{
          padding: "12px 20px",
          background: "black",
          color: "white",
          borderRadius: 10,
          border: "none",
          cursor: "pointer",
        }}
      >
        发布测试商品
      </button>
    </div>
  );
}
