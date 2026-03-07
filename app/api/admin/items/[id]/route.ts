import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const adminKey = req.headers.get("x-admin-key");

  if (!process.env.ADMIN_KEY || adminKey !== process.env.ADMIN_KEY) {
    return NextResponse.json(
      {
        error: "Unauthorized",
        hasHeader: !!adminKey,
        hasEnv: !!process.env.ADMIN_KEY,
        headerPreview: adminKey ? adminKey.slice(0, 4) : null,
        envPreview: process.env.ADMIN_KEY
          ? process.env.ADMIN_KEY.slice(0, 4)
          : null,
      },
      { status: 401 }
    );
  }

  const { error } = await supabase.from("items").delete().eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}