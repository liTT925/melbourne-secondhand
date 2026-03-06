"use client";

import { useEffect, useState } from "react";

type Item = {
  id: string;
  title?: string;
  price?: number;
  created_at?: string;
};

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function loadItems() {
    if (!adminKey) {
      setMsg("Please enter admin key");
      return;
    }

    setLoading(true);
    setMsg("");

    try {
      const res = await fetch("/api/admin/items", {
        headers: {
          "x-admin-key": adminKey,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        setMsg(data.error || "Failed to load items");
        return;
      }

      setItems(data.items || []);
    } catch (err) {
      setMsg("Failed to load items");
    } finally {
      setLoading(false);
    }
  }

  async function deleteItem(id: string) {
    if (!adminKey) {
      setMsg("Please enter admin key");
      return;
    }

    const ok = window.confirm("Delete this item?");
    if (!ok) return;

    try {
      const res = await fetch(`/api/admin/items/${id}`, {
        method: "DELETE",
        headers: {
          "x-admin-key": adminKey,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        setMsg(data.error || "Delete failed");
        return;
      }

      setItems((prev) => prev.filter((item) => item.id !== id));
      setMsg("Deleted successfully");
    } catch (err) {
      setMsg("Delete failed");
    }
  }

  useEffect(() => {
    const saved = localStorage.getItem("adminKey");
    if (saved) {
      setAdminKey(saved);
    }
  }, []);

  function saveKeyAndLoad() {
    localStorage.setItem("adminKey", adminKey);
    loadItems();
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Admin Panel</h1>

      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <input
          type="password"
          placeholder="Enter admin key"
          value={adminKey}
          onChange={(e) => setAdminKey(e.target.value)}
          style={{
            padding: 10,
            borderRadius: 8,
            border: "1px solid #ccc",
            minWidth: 260,
          }}
        />
        <button
          onClick={saveKeyAndLoad}
          style={{
            padding: "10px 16px",
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
          }}
        >
          Load Items
        </button>
      </div>

      {msg && <p>{msg}</p>}
      {loading && <p>Loading...</p>}

      <div style={{ display: "grid", gap: 12 }}>
        {items.map((item) => (
          <div
            key={item.id}
            style={{
              border: "1px solid #ddd",
              borderRadius: 12,
              padding: 16,
            }}
          >
            <div><strong>{item.title || "Untitled"}</strong></div>
            <div>Price: {item.price ?? "-"}</div>
            <div>ID: {item.id}</div>

            <button
              onClick={() => deleteItem(item.id)}
              style={{
                marginTop: 10,
                padding: "8px 12px",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
              }}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}