import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin") || "";
  const cors = {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin"
  };
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
    status, headers: { ...cors, "Content-Type": "application/json" }
  });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
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
    const householdId = String(body.household_id || "");
    const email = String(body.email || "").trim().toLowerCase();
    const displayName = String(body.display_name || email.split("@")[0]).trim().slice(0, 80);
    const redirectTo = String(body.redirect_to || "");
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(householdId)) {
      return json({ error: "Invalid household" }, 400);
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "Invalid email address" }, 400);
    if (!displayName) return json({ error: "Display name is required" }, 400);
    let redirect: URL;
    try { redirect = new URL(redirectTo); } catch { return json({ error: "Invalid redirect URL" }, 400); }
    if (!origin || redirect.origin !== origin || !["https:", "http:"].includes(redirect.protocol)) {
      return json({ error: "Redirect origin mismatch" }, 400);
    }

    const { data: membership, error: membershipError } = await caller
      .from("household_members")
      .select("id, role, is_active")
      .eq("household_id", householdId)
      .eq("user_id", authData.user.id)
      .eq("is_active", true)
      .maybeSingle();
    if (membershipError || !membership || membership.role !== "admin") {
      return json({ error: "Only an active household administrator can invite members" }, 403);
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    const { data: usersData, error: usersError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (usersError) return json({ error: "Could not check the invited account" }, 500);
    const existing = usersData.users.find((user) => (user.email || "").toLowerCase() === email);
    if (existing?.id === authData.user.id) return json({ error: "You cannot invite your own email address" }, 400);

    const inviteRedirect = new URL(redirect.toString());
    if (!existing) inviteRedirect.searchParams.set("flow", "invite-setup");

    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: existing ? "magiclink" : "invite",
      email,
      options: { redirectTo: inviteRedirect.toString() }
    });
    if (linkError || !linkData?.properties?.action_link || !linkData.user?.id) {
      return json({ error: linkError?.message || "Could not generate invitation link" }, 400);
    }

    const { error: addError } = await caller.rpc("add_household_member", {
      p_household_id: householdId,
      p_user_id: linkData.user.id,
      p_display_name: displayName
    });
    if (addError) return json({ error: "Invitation link created, but membership could not be added: " + addError.message }, 400);

    return json({
      action_link: linkData.properties.action_link,
      email,
      display_name: displayName,
      existing_account: !!existing
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unexpected error" }, 500);
  }
});