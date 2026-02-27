import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const app = express();
const PORT = process.env.PORT || 3001;

// Resolve the public folder for local development
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicPath = path.join(__dirname, "../public");

// ─── Supabase Admin Client (service role – never expose to browser) ───────────
let supabase = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// If Supabase failed to initialize due to missing env vars, block all /api/ requests gracefully
app.use((req, res, next) => {
  if (!supabase && req.path.startsWith("/api/")) {
    return res.status(500).json({
      error: "Server misconfiguration: Missing Supabase environment variables on Vercel. Please add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to your Vercel project settings."
    });
  }
  next();
});

// ─── Serve frontend static files (Locally only) ─────────────────────────────────
if (process.env.NODE_ENV !== "production") {
  app.use(express.static(publicPath));
}

// ─── Auth Middleware ───────────────────────────────────────────────────────────
async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }

  const token = authHeader.split(" ")[1];

  // Verify the JWT with Supabase
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  req.user = data.user;
  next();
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// GET all todos for the authenticated user
app.get("/api/todos", requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from("todos")
    .select("*")
    .eq("user_id", req.user.id)
    .order("created_at", { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST create a new todo
app.post("/api/todos", requireAuth, async (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ error: "Text is required" });
  }

  const { data, error } = await supabase
    .from("todos")
    .insert({ user_id: req.user.id, text: text.trim(), completed: false })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// PATCH toggle completed status
app.patch("/api/todos/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { completed } = req.body;

  const { data, error } = await supabase
    .from("todos")
    .update({ completed })
    .eq("id", id)
    .eq("user_id", req.user.id) // ownership check
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: "Todo not found" });
  res.json(data);
});

// DELETE a todo
app.delete("/api/todos/:id", requireAuth, async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from("todos")
    .delete()
    .eq("id", id)
    .eq("user_id", req.user.id); // ownership check

  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});

// DELETE all completed todos for the user
app.delete("/api/todos", requireAuth, async (req, res) => {
  const { error } = await supabase
    .from("todos")
    .delete()
    .eq("user_id", req.user.id)
    .eq("completed", true);

  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});

// ─── Profile Routes ───────────────────────────────────────────────────────────

// POST /api/profile – create profile right after signup (uses service role)
// Called immediately after sb.auth.signUp on the frontend
app.post("/api/profile", async (req, res) => {
  const { userId, username } = req.body;
  if (!userId || !username || !username.trim()) {
    return res.status(400).json({ error: "userId and username are required" });
  }

  const clean = username.trim().toLowerCase();

  // Validate: letters, numbers, underscores only, 3-20 chars
  if (!/^[a-z0-9_]{3,20}$/.test(clean)) {
    return res.status(400).json({
      error: "Username must be 3–20 characters: letters, numbers, underscores only",
    });
  }

  const { data, error } = await supabase
    .from("profiles")
    .insert({ id: userId, username: clean })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return res.status(409).json({ error: "Username is already taken" });
    }
    if (error.code === "23503") {
      // Foreign key violation: userId is not in auth.users.
      // This happens if Supabase returned a fake user object because the email is already registered.
      return res.status(400).json({ error: "Email is already registered. Please sign in instead." });
    }
    return res.status(500).json({ error: error.message });
  }

  res.status(201).json(data);
});

// GET /api/profile – get current user's profile
app.get("/api/profile", requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("username, created_at")
    .eq("id", req.user.id)
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data || null);
});

// PATCH /api/profile – update username
app.patch("/api/profile", requireAuth, async (req, res) => {
  const { username } = req.body;
  if (!username || !username.trim()) {
    return res.status(400).json({ error: "username is required" });
  }

  const clean = username.trim().toLowerCase();

  if (!/^[a-z0-9_]{3,20}$/.test(clean)) {
    return res.status(400).json({
      error: "Username must be 3–20 characters: letters, numbers, underscores only",
    });
  }

  const { data, error } = await supabase
    .from("profiles")
    .upsert({ id: req.user.id, username: clean })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return res.status(409).json({ error: "Username is already taken" });
    }
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

// PATCH /api/profile/password – change password
app.patch("/api/profile/password", requireAuth, async (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  const { error } = await supabase.auth.admin.updateUserById(req.user.id, {
    password: newPassword,
  });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// ─── Health check ─────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => res.json({ status: "ok" }));

// ─── Start (Skip listen on Vercel) ────────────────────────────────────────────
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`✅  Server running on http://localhost:${PORT}`);
  });
}

// Export for Vercel
export default app;
