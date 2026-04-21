import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { env } from "~/env";
import { getUserFromRequest } from "~/lib/server/getCurrentUser";
import { applyCorsHeaders, corsPreflight } from "~/lib/server/cors";

// Module-level singleton — avoids creating a new GoTrueClient per request,
// which triggers the "multiple GoTrueClient instances" browser warning.
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

export function OPTIONS(req: NextRequest) {
  return corsPreflight(req.headers.get("origin"));
}

function respond(body: unknown, init: ResponseInit | undefined, origin: string | null) {
  const res = NextResponse.json(body, init);
  applyCorsHeaders(res.headers, origin);
  return res;
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  const user = await getUserFromRequest(req);
  if (!user) return respond({ error: "Unauthorized" }, { status: 401 }, origin);

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const bucket = formData.get("bucket") as string | null;
  const path = formData.get("path") as string | null;

  if (!file || !bucket || !path) {
    return respond({ error: "Missing required fields" }, { status: 400 }, origin);
  }

  const bytes = await file.arrayBuffer();
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, bytes, {
      contentType: file.type || "image/jpeg",
      upsert: true,
    });

  if (error) {
    console.error("[upload]", error);
    return respond({ error: error.message }, { status: 500 }, origin);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(data.path);

  return respond({ url: publicUrl }, undefined, origin);
}
