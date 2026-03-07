import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
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

  const normalizedId = String(id).trim();

  const { data: existing, error: findError } = await supabase
    .from("items")
    .select("id,title")
    .eq("id", normalizedId)
    .maybeSingle();

  if (findError) {
    return NextResponse.json(
      { error: findError.message, step: "find", id: normalizedId },
      { status: 500 }
    );
  }

  if (!existing) {
    return NextResponse.json(
      {
        error: "Item not found before delete",
        id: normalizedId,
      },
      { status: 404 }
    );
  }

  const { error: deleteError } = await supabase
    .from("items")
    .delete()
    .eq("id", normalizedId);

  if (deleteError) {
    return NextResponse.json(
      {
        error: deleteError.message,
        step: "delete",
        id: normalizedId,
        found: existing,
      },
      { status: 500 }
    );
  }

  const { data: afterDelete, error: verifyError } = await supabase
    .from("items")
    .select("id,title")
    .eq("id", normalizedId)
    .maybeSingle();

  if (verifyError) {
    return NextResponse.json(
      {
        error: verifyError.message,
        step: "verify",
        id: normalizedId,
      },
      { status: 500 }
    );
  }

  if (afterDelete) {
    return NextResponse.json(
      {
        error: "Delete command ran, but item still exists",
        id: normalizedId,
        found: existing,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    deleted: existing,
  });
}