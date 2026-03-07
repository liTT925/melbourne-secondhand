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

export async function GET(request: Request) {
  if (!checkAdminKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("items")
    .select("id,title,price,created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: error.message || "Failed to load items" },
      { status: 500 }
    );
  }

  return NextResponse.json({ items: data || [] });
}