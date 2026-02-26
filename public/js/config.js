// ─── SUPABASE CONFIGURATION ──────────────────────────────────────────────────
// Fill in your Supabase project URL and anon key.
// These are safe to include in client-side code (anon key has RLS protection).
// Get them from: Supabase Dashboard → Project Settings → API

const SUPABASE_URL = "https://rgoifdareiianrswibik.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnb2lmZGFyZWlpYW5yc3dpYmlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMzEzNzAsImV4cCI6MjA4NzcwNzM3MH0.K3lYLzOfP87HSojajDeMaSah8l3CQ0D0DmBuN3f6MXk";

// API base URL for the Express backend
// Detects if running locally (port 3001) or in production (Vercel root)
const API_BASE = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:3001"
    : "";
