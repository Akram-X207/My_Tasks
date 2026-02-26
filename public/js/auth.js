// ─── Auth Page Logic ──────────────────────────────────────────────────────────
const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── DOM Refs ─────────────────────────────────────────────────────────────────
const tabLogin = document.getElementById("tab-login");
const tabSignup = document.getElementById("tab-signup");
const authSubtitle = document.getElementById("auth-subtitle");
const usernameField = document.getElementById("username-field");
const usernameInput = document.getElementById("auth-username");
const emailInput = document.getElementById("auth-email");
const passwordInput = document.getElementById("auth-password");
const submitBtn = document.getElementById("auth-submit-btn");
const btnText = document.getElementById("auth-btn-text");
const spinner = document.getElementById("auth-spinner");
const alertBox = document.getElementById("auth-alert");

let currentMode = "login";

// ─── On mount: redirect if already signed in ─────────────────────────────────
(async () => {
    const { data: { session } } = await sb.auth.getSession();
    if (session) window.location.replace("index.html");
})();

// ─── Tab switching ────────────────────────────────────────────────────────────
tabLogin.addEventListener("click", () => setMode("login"));
tabSignup.addEventListener("click", () => setMode("signup"));

function setMode(mode) {
    currentMode = mode;
    tabLogin.classList.toggle("active", mode === "login");
    tabSignup.classList.toggle("active", mode === "signup");
    btnText.textContent = mode === "login" ? "Sign In" : "Create Account";
    authSubtitle.textContent = mode === "login" ? "Sign in to continue" : "Create your account";
    // Show username field only during sign-up
    usernameField.style.display = mode === "signup" ? "flex" : "none";
    clearAlert();
}

// ─── Alert helpers ────────────────────────────────────────────────────────────
function showAlert(msg, type = "error") {
    alertBox.textContent = msg;
    alertBox.className = `auth-alert ${type}`;
    alertBox.classList.remove("hidden");
}
function clearAlert() {
    alertBox.textContent = "";
    alertBox.className = "auth-alert hidden";
}

// ─── Loading state ────────────────────────────────────────────────────────────
function setLoading(loading) {
    submitBtn.disabled = loading;
    spinner.classList.toggle("hidden", !loading);
    btnText.style.opacity = loading ? "0.6" : "1";
}

// ─── Submit ───────────────────────────────────────────────────────────────────
submitBtn.addEventListener("click", handleSubmit);
passwordInput.addEventListener("keydown", (e) => { if (e.key === "Enter") handleSubmit(); });

async function handleSubmit() {
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const username = usernameInput.value.trim().toLowerCase();

    if (!email || !password) { showAlert("Please enter email and password."); return; }
    if (password.length < 6) { showAlert("Password must be at least 6 characters."); return; }

    if (currentMode === "signup") {
        if (!username) { showAlert("Please choose a username."); return; }
        if (!/^[a-z0-9_]{3,20}$/.test(username)) {
            showAlert("Username must be 3–20 chars: letters, numbers, underscores only.");
            return;
        }
    }

    clearAlert();
    setLoading(true);

    try {
        if (currentMode === "signup") {
            // 1. Create the Supabase auth user
            const { data, error: signupErr } = await sb.auth.signUp({ email, password });
            if (signupErr) throw signupErr;

            const userId = data.user?.id;
            if (!userId) throw new Error("Signup failed — no user ID returned.");

            // 2. Save username to the profiles table via backend
            const profileRes = await fetch(`${API_BASE}/api/profile`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, username }),
            });
            const profileData = await profileRes.json();
            if (!profileRes.ok) throw new Error(profileData.error || "Failed to save username.");

            showAlert(
                "✅ Account created! Check your email to confirm, then sign in.",
                "success"
            );
        } else {
            const { error } = await sb.auth.signInWithPassword({ email, password });
            if (error) throw error;
            window.location.replace("index.html");
        }
    } catch (err) {
        showAlert(err.message || "Something went wrong. Please try again.");
    } finally {
        setLoading(false);
    }
}
