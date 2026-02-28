// Simple client-side logic for the demo login page.
// Replace sendToServer(...) with a real API call in production.

const form = document.getElementById("loginForm");
const errorEl = document.getElementById("error");
const submitBtn = document.getElementById("submitBtn");

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function fakeAuth({ email, password }) {
  // Simulate network delay
  await new Promise((r) => setTimeout(r, 700));

  // Very small fake check - replace with real API
  if (email === "user@example.com" && password === "password123") {
    return { ok: true, token: "fake-jwt-token" };
  }
  return { ok: false, message: "Invalid email or password" };
}

// ...existing code...

// role toggle behavior
const roleButtons = document.querySelectorAll(".role-btn");
const roleInput = document.getElementById("roleInput");

roleButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    roleButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const role = btn.dataset.role || "student";
    if (roleInput) roleInput.value = role;

    // optional: change submit text to reflect role
    if (submitBtn) {
      submitBtn.textContent = role === "teacher" ? "Sign in as Teacher" : "Sign in as Student";
    }
  });
});

// ...existing code (form submit logic) ...

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorEl.textContent = "";

  const formData = new FormData(form);
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const remember = formData.get("remember") === "on";

  if (!validateEmail(email)) {
    errorEl.textContent = "Please enter a valid email.";
    return;
  }
  if (password.length < 6) {
    errorEl.textContent = "Password must be at least 6 characters.";
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Signing in…";

  try {
    // Replace fakeAuth with fetch('/api/login', { method: 'POST', body: JSON.stringify({email,password}) })
    const res = await fakeAuth({ email, password });

    if (!res.ok) {
      errorEl.textContent = res.message || "Sign in failed.";
      submitBtn.disabled = false;
      submitBtn.textContent = "Sign in";
      return;
    }

    // Store token (example)
    if (remember) {
      localStorage.setItem("auth_token", res.token);
    } else {
      sessionStorage.setItem("auth_token", res.token);
    }

    // Redirect to protected area (update path as needed)
    window.location.href = "/dashboard.html";
  } catch (err) {
    console.error(err);
    errorEl.textContent = "An unexpected error occurred.";
    submitBtn.disabled = false;
    submitBtn.textContent = "Sign in";
  }
  
});