// === Toggle Menu for Login Page ===
function toggleMenu() {
  const menu = document.getElementById("menu");
  const overlay = document.getElementById("menu-overlay");
  menu.classList.toggle("show");
  overlay.classList.toggle("show");
}

function closeMenu() {
  document.getElementById("menu").classList.remove("show");
  document.getElementById("menu-overlay").classList.remove("show");
}

let inactivityTimeout;

function resetInactivityTimer() {
  clearTimeout(inactivityTimeout);
  inactivityTimeout = setTimeout(() => {
    // 🔒 What happens when user is inactive for too long
    sessionStorage.clear(); // or remove specific keys
    showToast("⏳ You were logged out due to inactivity.", "#e67e22");
    showForm("login"); // redirect to login
  }, 2 * 60 * 1000); // 2 minutes (adjust as needed)
}

function showForm(formType) {
  // All possible form sections by ID
  const formMap = {
    login: "login-form",
    register: "register-form",
    forgot: "forgot-form",
    "otp-form": "otp-form",
    "pin-form": "pin-form",
    "pin-verify": "pin-verify-form",
    "forgot-password": "forgot-password-section",
    "verify-forgot-otp": "verify-forgot-otp-section",
    "reset-password": "reset-password-section",

    // ✅ Added these for PIN reset flow
    "verify-pin-otp": "verify-pin-otp-section",
    "reset-pin": "reset-pin-section",
    "withdraw-history": "withdraw-history-page"
  };

  // Loop and toggle visibility
  for (const key in formMap) {
    const el = document.getElementById(formMap[key]);
    if (el) el.style.display = formType === key ? "block" : "none";
  }

  // Handle dashboard and login-page toggle
  const dashboard = document.getElementById("dashboard-page");
  const loginPage = document.getElementById("login-page");

  if (formType === "dashboard") {
    if (dashboard) dashboard.style.display = "block";
    if (loginPage) loginPage.style.display = "none";
  } else {
    if (dashboard) dashboard.style.display = "none";
    if (loginPage) loginPage.style.display = "block";
  }

  // ✅ Clear pin-verify inputs when showing pin-verify form
  if (formType === "pin-verify") {
    ["pinverify1", "pinverify2", "pinverify3", "pinverify4"].forEach(id => {
      const input = document.getElementById(id);
      if (input) input.value = "";
    });
  }

  // ✅ Re-bind pin inputs after showing new form
  bindPinInputs();
}

function signupUser() {
  const firstName = document.getElementById("signup-firstname").value.trim();
  const lastName = document.getElementById("signup-lastname").value.trim();
  const country = document.getElementById("signup-country").value;
  const email = document.getElementById("signup-email").value.trim();
  const password = document.getElementById("signup-password").value.trim();

  if (!firstName || !lastName || !country || !email || !password) {
    showToast("⚠️ Please fill in all fields.", "#e74c3c");
    return;
  }

  const fullName = `${firstName} ${lastName}`;

  // Save signup details temporarily in sessionStorage
  sessionStorage.setItem("name", fullName);
  sessionStorage.setItem("country", country);
  sessionStorage.setItem("email", email);
  sessionStorage.setItem("password", password);

  // Send OTP to email
  fetch("https://danoski-backend-hc8i.onrender.com/user/send-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  })
    .then(res => res.json().then(data => ({ ok: res.ok, data })))
    .then(({ ok, data }) => {
      if (ok) {
        showToast("✅ OTP sent to your email. Please verify.", "#4caf50");
        document.getElementById("otp-email").value = email;
        showForm("otp-form");
      } else {
        showToast("❌ " + (data.error || "Failed to send OTP."), "#e74c3c");
      }
    })
    .catch(() => {
      showToast("⚠️ Could not connect to server.", "#f39c12");
    });
}

function showToast(message, background = "#4caf50") {
  const toast = document.getElementById("toast");
  toast.innerText = message;
  toast.style.backgroundColor = background;
  toast.style.display = "block";
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
    toast.style.display = "none";
  }, 4000);
}

function verifyOtp() {
  const email = document.getElementById("otp-email").value.trim();
  const otp = document.getElementById("otp-code").value.trim();

  if (!email || !otp) {
    showToast("⚠️ Please enter your email and OTP.", "#e74c3c");
    return;
  }

  fetch("https://danoski-backend-hc8i.onrender.com/user/verify-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp })
  })
    .then(res => res.json().then(data => ({ ok: res.ok, data })))
    .then(({ ok, data }) => {
      if (ok) {
        showToast("✅ OTP verified. Please set your 4-digit PIN.", "#4caf50");
        showForm("pin-form");
      } else {
        showToast("❌ " + (data.error || "OTP verification failed."), "#e74c3c");
      }
    })
    .catch(() => {
      showToast("⚠️ Unable to connect to server.", "#f39c12");
    });
}

function loginUser() {
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;

  if (!email || !password) {
    showToast("⚠️ Please fill in all login fields.", "#e74c3c");
    return;
  }

  fetch("https://danoski-backend-hc8i.onrender.com/user/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  })
    .then(async res => {
      let data;
      try {
        data = await res.json();
      } catch (err) {
        console.error("❌ Invalid JSON from server.");
        showToast("⚠️ Unexpected server response. Please try again.", "#e67e22");
        return;
      }

      if (res.ok) {
        sessionStorage.setItem("isLoggedIn", "true");
        sessionStorage.setItem("loginEmail", email);
        showToast("✅ Login successful! Please enter your PIN to continue.", "#4caf50");
        showForm("pin-verify");
        document.getElementById("pin-message").innerText = "Please enter your 4-digit PIN to continue.";
        focusFirstPinVerifyInput();
      } else {
        showToast("❌ Invalid email or password.", "#e74c3c");
      }
    })
    .catch(err => {
      console.error("Login error:", err);
      showToast("⚠️ Network error. Please check your connection and try again.", "#f39c12");
    });
}

function verifyLoginPin() {
  const pin = ["pinverify1", "pinverify2", "pinverify3", "pinverify4"]
    .map(id => document.getElementById(id).value)
    .join("");

  if (pin.length !== 4) {
    showToast("⚠️ Please enter a valid 4-digit PIN.", "#e74c3c");
    return;
  }

  const email = sessionStorage.getItem("loginEmail"); // ✅ Get login email

  fetch("https://danoski-backend-hc8i.onrender.com/user/verify-login-pin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, pin })
  })
    .then(async res => {
      let data;
      try {
        data = await res.json();
      } catch (err) {
        console.error("❌ Invalid JSON from server.");
        showToast("⚠️ Unexpected server response.", "#e67e22");
        return;
      }

      if (res.ok) {
        showToast("✅ PIN verified. Welcome back!", "#4caf50");

        // ✅ Save email correctly for dashboard use
        sessionStorage.setItem("email", email); // 🔥 This is the key fix
        sessionStorage.setItem("pinVerified", "true");

        showDashboard(); // Show the dashboard now that PIN is verified
      } else {
        showToast("❌ Incorrect PIN. Please try again.", "#e74c3c");
      }
    })
    .catch(err => {
      console.error("PIN verification error:", err);
      showToast("⚠️ Network/server issue during PIN verification.", "#f39c12");
    });
}

function setUserPin() {
  const pin = ["pin1", "pin2", "pin3", "pin4"]
    .map(id => document.getElementById(id).value.trim())
    .join("");

  if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
    showToast("⚠️ Please enter a valid 4-digit PIN.", "#e74c3c");
    return;
  }

  const full_name = sessionStorage.getItem("name");
  const country = sessionStorage.getItem("country");
  const email = sessionStorage.getItem("email");
  const password = sessionStorage.getItem("password");

  if (![full_name, country, email, password].every(v => v && v.trim())) {
    showToast("⚠️ Missing user details. Please start the registration again.", "#e74c3c");
    return;
  }

  // ✅ Console log the data being sent
  console.log("Creating account with:", {
    full_name,
    country,
    email,
    password,
    pin
  });

  fetch("https://danoski-backend-hc8i.onrender.com/user/create-account", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ full_name, country, email, password, pin })
  })
    .then(async res => {
      let data;
      try {
        data = await res.json();
      } catch (err) {
        console.error("Invalid JSON response:", err);
        showToast("⚠️ Unexpected server response.", "#e67e22");
        return;
      }

      if (res.ok) {
        showToast("✅ Account created successfully!", "#4caf50");
        sessionStorage.setItem("isLoggedIn", "true");
        showDashboard();
      } else {
        const errorMessage = data?.error || "❌ Account creation failed.";
        showToast(errorMessage, "#e74c3c");
      }
    })
    .catch(err => {
      console.error("Account creation error:", err);
      showToast("⚠️ Unable to connect to server.", "#f39c12");
    });
}

function sendForgotOtp() {
  const email = document.getElementById("forgot-pass-email").value.trim();

  if (!email) {
    showToast("⚠️ Please enter your email address.", "#e74c3c");
    return;
  }

  fetch("https://danoski-backend-hc8i.onrender.com/user/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  })
    .then(async res => {
      let data;
      try {
        data = await res.json();
      } catch (err) {
        console.error("Invalid JSON response:", err);
        showToast("⚠️ Unexpected server response.", "#e67e22");
        return;
      }

      if (res.ok) {
        sessionStorage.setItem("resetEmail", email);
        showToast("✅ OTP has been sent to your email.", "#4caf50");
        showForm("verify-forgot-otp");
      } else {
        showToast("❌ Unable to send OTP. Please check your email and try again.", "#e74c3c");
      }
    })
    .catch(err => {
      console.error("Error sending OTP:", err);
      showToast("⚠️ Network error. Please try again later.", "#f39c12");
    });
}

function verifyForgotOtp() {
  const otp = document.getElementById("forgot-pass-otp").value.trim();
  const email = sessionStorage.getItem("resetEmail");

  if (!otp) {
    showToast("⚠️ Please enter the OTP sent to your email.", "#e74c3c");
    return;
  }

  if (!email) {
    showToast("⚠️ Session expired. Please request a new OTP.", "#e74c3c");
    showForm("forgot-password");
    return;
  }

  fetch("https://danoski-backend-hc8i.onrender.com/user/verify-password-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp })
  })
    .then(async res => {
      let data;
      try {
        data = await res.json();
      } catch (err) {
        console.error("Invalid JSON response:", err);
        showToast("⚠️ Unexpected response from server.", "#e67e22");
        return;
      }

      if (res.ok) {
        showToast("✅ OTP verified. You can now set your new password.", "#4caf50");
        showForm("reset-password");
      } else {
        showToast("❌ Incorrect OTP. Please try again.", "#e74c3c");
      }
    })
    .catch(err => {
      console.error("OTP verification error:", err);
      showToast("⚠️ Could not connect to server. Try again later.", "#f39c12");
    });
}

function submitNewPassword() {
  const newPassword = document.getElementById("new-password").value.trim();
  const confirmPassword = document.getElementById("confirm-password").value.trim();
  const email = sessionStorage.getItem("resetEmail");

  if (!newPassword || !confirmPassword) {
    showToast("⚠️ Please fill in both password fields.", "#e74c3c");
    return;
  }

  if (newPassword !== confirmPassword) {
    showToast("❌ Passwords do not match.", "#e74c3c");
    return;
  }

  if (newPassword.length < 6) {
    showToast("⚠️ Password must be at least 6 characters long.", "#e74c3c");
    return;
  }

  if (!email) {
    showToast("⚠️ Session expired. Please request a new OTP.", "#e74c3c");
    showForm("forgot-password");
    return;
  }

  fetch("https://danoski-backend-hc8i.onrender.com/user/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: newPassword })
  })
    .then(async res => {
      let data;
      try {
        data = await res.json();
      } catch (err) {
        console.error("Invalid JSON from server:", err);
        showToast("⚠️ Unexpected response. Try again later.", "#e67e22");
        return;
      }

      if (res.ok) {
        showToast("✅ Password reset successful. You can now log in.", "#4caf50");
        sessionStorage.removeItem("resetEmail");
        showForm("login");
      } else {
        showToast("❌ Failed to reset password. Try again.", "#e74c3c");
      }
    })
    .catch(err => {
      console.error("Password reset error:", err);
      showToast("⚠️ Could not connect to server. Please check your internet connection.", "#f39c12");
    });
}

function sendResetPin() {
  const email = sessionStorage.getItem("loginEmail");

  if (!email) {
    showToast("⚠️ No email found in session. Please log in again.", "#e74c3c");
    showForm("login");
    return;
  }

  fetch("https://danoski-backend-hc8i.onrender.com/user/sendresetpin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  })
    .then(async res => {
      let data;
      try {
        data = await res.json();
      } catch (err) {
        console.error("Invalid JSON from server:", err);
        showToast("⚠️ Unexpected response. Please try again.", "#e67e22");
        return;
      }

      if (res.ok) {
        showToast("✅ An OTP has been sent to your email to reset your PIN.", "#4caf50");
        showForm("verify-pin-otp");
      } else {
        showToast("❌ Failed to send OTP. Please try again.", "#e74c3c");
      }
    })
    .catch(err => {
      console.error("Error sending PIN OTP:", err);
      showToast("⚠️ Could not connect to the server. Please check your connection.", "#f39c12");
    });
}

function verifyPinOtp() {
  const email = sessionStorage.getItem("loginEmail");
  const otp = document.getElementById("pin-otp").value.trim();

  if (!otp) {
    showToast("⚠️ Please enter the OTP sent to your email.", "#e74c3c");
    return;
  }

  fetch("https://danoski-backend-hc8i.onrender.com/user/verify-pin-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp })
  })
    .then(async res => {
      let data;
      try {
        data = await res.json();
      } catch (err) {
        console.error("Invalid JSON from server:", err);
        showToast("⚠️ Unexpected response from server.", "#e67e22");
        return;
      }

      if (res.ok) {
        showToast("✅ OTP verified successfully. You can now set a new PIN.", "#4caf50");
        showForm("reset-pin");
      } else {
        showToast("❌ The OTP you entered is invalid or expired.", "#e74c3c");
      }
    })
    .catch(err => {
      console.error("Error verifying OTP:", err);
      showToast("⚠️ Could not connect to the server. Please try again.", "#f39c12");
    });
}

function setNewPin() {
  const email = sessionStorage.getItem("email");
  const pin =
    document.getElementById("resetpin1").value +
    document.getElementById("resetpin2").value +
    document.getElementById("resetpin3").value +
    document.getElementById("resetpin4").value;

  if (!/^\d{4}$/.test(pin)) {
    showToast("⚠️ Please enter a valid 4-digit numeric PIN.", "#e74c3c");
    return;
  }

  fetch("https://danoski-backend-hc8i.onrender.com/user/reset-pin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, pin })
  })
    .then(async res => {
      let data;
      try {
        data = await res.json();
      } catch (err) {
        console.error("Invalid JSON response from server:", err);
        showToast("⚠️ Unexpected response from server.", "#e67e22");
        return;
      }

      if (res.ok) {
        showToast("✅ Your PIN has been reset successfully.", "#4caf50");
        showForm("pin-verify");
      } else {
        showToast("❌ Failed to reset your PIN. Please try again.", "#e74c3c");
      }
    })
    .catch(err => {
      console.error("Error resetting PIN:", err);
      showToast("⚠️ Network/server error. Please try again.", "#f39c12");
    });
}

function bindPinInputs() {
  const forms = {};

  // Group .pin-inputs by form (e.g. reset PIN, verify PIN, create PIN)
  document.querySelectorAll(".pin-input").forEach((input) => {
    const formId = input.closest("form")?.id || "default";
    if (!forms[formId]) forms[formId] = [];
    forms[formId].push(input);
  });

  // Apply input behavior per form group
  Object.values(forms).forEach(inputs => {
    inputs.forEach((input, i) => {
      input.addEventListener("input", () => {
        input.value = input.value.replace(/[^0-9]/g, ""); // allow only numbers
        if (input.value.length === 1 && i < inputs.length - 1) {
          inputs[i + 1].focus();
        }
      });

      input.addEventListener("keydown", (e) => {
        if (e.key === "Backspace" && !input.value && i > 0) {
          inputs[i - 1].focus();
        }
      });
    });

    // Optional: Autofocus first input in the group
    if (inputs[0]) inputs[0].focus();
  });
}

function checkPinLength() {
  const pin = ["pin1","pin2","pin3","pin4"].map(id => document.getElementById(id).value).join("");
  const btn = document.getElementById("create-account-btn");
  if (btn) {
    btn.disabled = pin.length !== 4;
    btn.style.opacity = pin.length === 4 ? "1" : "0.5";
    btn.style.cursor = pin.length === 4 ? "pointer" : "not-allowed";
  }
}

function logout() {
  sessionStorage.clear();
  localStorage.clear();
  window.location.href = "index.html";
}

function focusFirstPinVerifyInput() {
  const input = document.getElementById("pinverify1");
  if (input) input.focus();
}

function showDashboard() {
  showForm("dashboard");

  const name = sessionStorage.getItem("name");
  const countryCode = sessionStorage.getItem("country"); // ISO 2-letter code

  const welcomeEl = document.getElementById("welcome-name");
  const flagEl = document.getElementById("country-flag");

  if (name && welcomeEl) {
    welcomeEl.innerText = `Welcome, ${name}!`;
  }

  if (countryCode && flagEl) {
    flagEl.src = `https://flagcdn.com/48x36/${countryCode.toLowerCase()}.png`;
    flagEl.alt = countryCode.toUpperCase();
    flagEl.style.display = "inline-block";
  }
}

const userEmail = sessionStorage.getItem("email");
let miningFactor = 0.00000001;
let miningInterval;
let dashboardSyncInterval;

function startMining(email) {
  fetch(`https://danoski-backend-hc8i.onrender.com/user/dashboard?email=${encodeURIComponent(email)}`)
    .then(res => res.json())
    .then(data => {
      let hashrate = data.hashrate;
      let balance = data.btc_balance;
      let lastMined = new Date(data.last_mined).getTime();

      document.getElementById("total-earned").innerText = data.total_earned.toFixed(8);
      document.getElementById("hashrate").innerText = hashrate + " H/s";

      if (hashrate <= 0) {
        document.getElementById("btc-counter").innerText = balance.toFixed(8);
        return;
      }

      if (miningInterval) clearInterval(miningInterval);
      miningInterval = setInterval(() => {
        const now = Date.now();
        const secondsElapsed = (now - lastMined) / 1000;
        const mined = hashrate * secondsElapsed * miningFactor;
        const currentBTC = balance + mined;
        document.getElementById("btc-counter").innerText = currentBTC.toFixed(8);
      }, 1000);

      // 🟢 Background sync every 30s + refresh UI
      if (dashboardSyncInterval) clearInterval(dashboardSyncInterval);
      dashboardSyncInterval = setInterval(() => {
        syncMinedBTC(email).then(() => {
          // Refresh UI values after syncing
          fetch(`https://danoski-backend-hc8i.onrender.com/user/dashboard?email=${encodeURIComponent(email)}`)
            .then(res => res.json())
            .then(updated => {
              balance = updated.btc_balance;
              hashrate = updated.hashrate;
              lastMined = new Date(updated.last_mined).getTime();
              document.getElementById("total-earned").innerText = updated.total_earned.toFixed(8);
              document.getElementById("hashrate").innerText = hashrate + " H/s";
            });
        });
      }, 30000);
    });
}

function syncMinedBTC(email) {
  return fetch("https://danoski-backend-hc8i.onrender.com/user/mine-sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  })
  .then(res => res.json())
  .then(data => {
    console.log("MINE SYNC RESULT:", data);
    return data;
  })
  .catch(err => console.error("Mine sync failed:", err));
}

function submitWithdraw() {
  const amount = parseFloat(document.getElementById("withdraw-amount").value);
  const wallet = document.getElementById("withdraw-wallet").value.trim();
  const userEmail = sessionStorage.getItem("email");

  if (!amount || !wallet) {
    document.getElementById("withdraw-msg").innerText = "❌ Fill all fields";
    return;
  }

  fetch("https://danoski-backend-hc8i.onrender.com/user/withdraw", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: userEmail, amount, wallet })
  })
  .then(res => res.json())
  .then(data => {
    document.getElementById("withdraw-msg").innerText = data.message || data.error;
    loadWithdrawHistory(); // Updates the list

    // ✅ Update BTC balance on dashboard
    if (!data.error) {
      loadDashboard(); // <- This must fetch and update btc-counter
    }
  });
}

function loadWithdrawHistory() {
  const userEmail = sessionStorage.getItem("email");

  fetch(`https://danoski-backend-hc8i.onrender.com/user/withdrawals?email=${encodeURIComponent(userEmail)}`)
    .then(res => res.json())
    .then(data => {
      const list = document.getElementById("withdraw-history-list"); // UPDATED ID
      if (!list) return;

      list.innerHTML = "";

      if (data.length === 0) {
        const li = document.createElement("li");
        li.textContent = "No withdrawals yet.";
        list.appendChild(li);
        return;
      }

      data.forEach(item => {
        const li = document.createElement("li");
        li.textContent = `${item.amount} BTC to ${item.wallet} [${item.status}]`;
        list.appendChild(li);
      });
    });
}

function showWithdrawHistoryPage() {
  document.getElementById("dashboard-page").style.display = "none";
  document.getElementById("withdraw-history-page").style.display = "block";
  loadWithdrawHistory();
}

function loadMessages() {
  fetch("https://danoski-backend-hc8i.onrender.com/user/messages")
    .then(res => res.json())
    .then(data => {
      console.log("📢 Announcement fetched:", data);  // ✅ Log it

      const ul = document.getElementById("admin-messages");
      ul.innerHTML = "";

      if (data.title && data.content) {
        const li = document.createElement("li");
        li.innerHTML = `<b>${data.title}</b>: ${data.content}`;
        ul.appendChild(li);
      } else {
        const li = document.createElement("li");
        li.textContent = "No announcement available.";
        ul.appendChild(li);
      }
    })
    .catch(err => {
      console.error("❌ Failed to load message:", err);
    });
}

function watchAd() {
  const email = sessionStorage.getItem("email");
  if (!email) return;

  document.getElementById("ad-status").innerText = "📺 Watching ad...";

  // Simulate 10-second ad
  setTimeout(() => {
    fetch("https://danoski-backend-hc8i.onrender.com/user/claim-hashrate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    })
    .then(res => res.json())
    .then(data => {
      document.getElementById("ad-status").innerText = data.message || data.error;
      startMining(email); // Refresh hashrate and counter
    })
    .catch(() => {
      document.getElementById("ad-status").innerText = "❌ Failed to claim hashrate.";
    });
  }, 10000);
}

function loadActiveHashrates() {
  const email = sessionStorage.getItem("email");

  fetch(`https://danoski-backend-hc8i.onrender.com/user/hashrates?email=${encodeURIComponent(email)}`)
    .then(res => res.json())
    .then(data => {
      const list = document.getElementById("active-hashrates");
      list.innerHTML = "";

      data.forEach((item, index) => {
        const li = document.createElement("li");
        const expires = new Date(item.expires_at);
        const id = `hashrate-timer-${index}`;

        li.innerHTML = `<b>${item.hashrate} H/s</b> - <span id="${id}">Calculating...</span>`;
        list.appendChild(li);

        // Start live countdown
        const updateCountdown = () => {
          const now = new Date();
          const remaining = Math.max(0, expires - now);
          const hours = Math.floor(remaining / 3600000);
          const minutes = Math.floor((remaining % 3600000) / 60000);
          const seconds = Math.floor((remaining % 60000) / 1000);

          document.getElementById(id).innerText =
            `${hours}h ${minutes}m ${seconds}s`;

          if (remaining <= 0) {
            document.getElementById(id).innerText = "Expired";
          }
        };

        updateCountdown();
        setInterval(updateCountdown, 1000);
      });
    });
}

// INIT
startMining(userEmail);
loadWithdrawHistory();
loadMessages();
loadActiveHashrates();
syncMinedBTC(userEmail);

// ========== DOMContentLoaded Setup ==========
document.addEventListener("DOMContentLoaded", () => {
  const isLoggedIn = sessionStorage.getItem("isLoggedIn") === "true";
  const pinVerified = sessionStorage.getItem("pinVerified") === "true";

  if (isLoggedIn && pinVerified) {
    showDashboard();
  } else if (isLoggedIn && !pinVerified) {
    showForm("pin-verify");
  }

  bindPinInputs();

  const passwordInput = document.getElementById("signup-password");
  const passwordCount = document.getElementById("password-count");
  if (passwordInput && passwordCount) {
    passwordInput.addEventListener("input", function () {
      const len = this.value.length;
      passwordCount.innerText = `${len}/12 characters`;
    });
  }

  const logoutButtons = document.querySelectorAll(".logout-btn");
  logoutButtons.forEach(button => button.addEventListener("click", logout));

  // ✅ Inactivity timer logic here
  resetInactivityTimer();
  document.addEventListener("mousemove", resetInactivityTimer);
  document.addEventListener("keydown", resetInactivityTimer);
  document.addEventListener("click", resetInactivityTimer);
});
