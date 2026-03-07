import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function checkAdminKey(request: Request) {
  const key = request.headers.get("x-admin-key");
  return key && key === process.env.ADMIN_KEY;
}

function extractStoragePathFromPublicUrl(url: string | null) {
  if (!url) return null;

  const marker = "/storage/v1/object/public/items/";
  const index = url.indexOf(marker);

  if (index === -1) return null;

  return decodeURIComponent(url.slice(index + marker.length));
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!checkAdminKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ error: "Missing item id" }, { status: 400 });
  }

  // 先拿商品本体
  const { data: item, error: itemError } = await supabaseAdmin
    .from("items")
    .select("id,image_url")
    .eq("id", id)
    .single();

  if (itemError || !item) {
    return NextResponse.json(
      { error: itemError?.message || "Item not found" },
      { status: 404 }
    );
  }

  // 再拿多图
  const { data: imageRows, error: imageRowsError } = await supabaseAdmin
    .from("item_images")
    .select("image_url")
    .eq("item_id", id);

  if (imageRowsError) {
    return NextResponse.json(
      { error: "Failed to read item images: " + imageRowsError.message },
      { status: 500 }
    );
  }

  const storagePaths = new Set<string>();

  for (const row of imageRows || []) {
    const path = extractStoragePathFromPublicUrl(row.image_url);
    if (path) storagePaths.add(path);
  }

  const coverPath = extractStoragePathFromPublicUrl(item.image_url);
  if (coverPath) storagePaths.add(coverPath);

  // 删除商品，item_images 如果有 on delete cascade 会一起删
  const { error: deleteError } = await supabaseAdmin
    .from("items")
    .delete()
    .eq("id", id);

  if (deleteError) {
    return NextResponse.json(
      { error: "Delete item failed: " + deleteError.message },
      { status: 500 }
    );
  }

  // 删除 storage 文件
  if (storagePaths.size > 0) {
    const { error: storageError } = await supabaseAdmin.storage
      .from("items")
      .remove(Array.from(storagePaths));

    if (storageError) {
      return NextResponse.json({
        ok: true,
        warning: "Item deleted, but some storage files failed to delete: " + storageError.message,
      });
    }
  }

  return NextResponse.json({ ok: true });
}