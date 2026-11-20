import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ALLOWED_ORIGINS = new Set([
  "https://khjm950.github.io",
  "http://localhost:3000",
  "http://127.0.0.1:3000"
]);

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin") || "";
  const allowed = ALLOWED_ORIGINS.has(origin);
  const cors = {
    "Access-Control-Allow-Origin": allowed ? origin : "https://khjm950.github.io",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin"
  };
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
    status, headers: { ...cors, "Content-Type": "application/json" }
  });

  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!allowed) return json({ error: "Origin not allowed" }, 403);

  try {
    const authorization = req.headers.get("Authorization") || "";
    if (!authorization.startsWith("Bearer ")) return json({ error: "Authentication required" }, 401);

    const caller = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false }
    });
    const { data: authData, error: authError } = await caller.auth.getUser();
    if (authError || !authData.user) return json({ error: "Invalid session" }, 401);

    const body = await req.json();
    const operation = String(body.operation || "");
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    if (operation === "delete_self") {
      const { data, error } = await caller.rpc("self_delete_velovi_account");
      if (error) return json({ error: error.message }, 400);
      const { error: deleteError } = await admin.auth.admin.deleteUser(authData.user.id);
      if (deleteError) {
        return json({
          error: "تم تعطيل عضويات الحساب وحفظ السجل المالي، لكن تعذر حذف حساب الدخول نهائياً. أعد المحاولة أو تواصل مع الدعم.",
          details: deleteError.message,
          history_retained: true
        }, 502);
      }
      return json({ success: true, history_retained: true, result: data });
    }

    if (operation === "delete_member") {
      const householdId = String(body.household_id || "");
      const memberId = String(body.member_id || "");
      if (!/^[0-9a-f-]{36}$/i.test(householdId) || !/^[0-9a-f-]{36}$/i.test(memberId)) {
        return json({ error: "Invalid household or member" }, 400);
      }
      const { data, error } = await caller.rpc("admin_delete_velovi_member", {
        p_household_id: householdId,
        p_member_id: memberId
      });
      if (error) return json({ error: error.message }, 400);

      const targetUserId = data?.target_user_id;
      let authAccountDeleted = false;
      if (targetUserId) {
        const { count, error: countError } = await admin
          .from("household_members")
          .select("id", { count: "exact", head: true })
          .eq("user_id", targetUserId);
        if (countError) {
          return json({ success: true, result: data, warning: "تم حذف بيانات العضو المالية، لكن تعذر التحقق من عضوياته الأخرى؛ لم نحذف حساب الدخول." });
        }
        if ((count || 0) === 0) {
          const { error: deleteError } = await admin.auth.admin.deleteUser(targetUserId);
          if (!deleteError) authAccountDeleted = true;
          else return json({ success: true, result: data, warning: "حُذفت بيانات العضو من هذه الأسرة، لكن بقي حساب الدخول بسبب خطأ في Auth." });
        }
      }
      return json({ success: true, result: data, auth_account_deleted: authAccountDeleted });
    }

    return json({ error: "Unsupported operation" }, 400);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unexpected error" }, 500);
  }
});