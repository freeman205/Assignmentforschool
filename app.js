// 🚨 PROBLEM IDENTIFIED: API URL mismatch
const BASE_API_URL = "https://dansog-backend.onrender.com/api" // Your FastAPI backend URL - IMPORTANT: Update this for deployment!

console.log("🚀 app.js loading...")

// --- Utility Functions ---
function saveAuthData(token, user) {
  sessionStorage.setItem("accessToken", token)
  sessionStorage.setItem("currentUser", JSON.stringify(user))
}

function getAuthToken() {
  return sessionStorage.getItem("accessToken")
}

function getCurrentUser() {
  const user = sessionStorage.getItem("currentUser")
  return user ? JSON.parse(user) : null
}

function clearAuthData() {
  sessionStorage.removeItem("accessToken")
  sessionStorage.removeItem("currentUser")
}

function showToast(message, type = "success") {
  const toastContainer = document.getElementById("toast-container")
  if (!toastContainer) {
    console.warn("Toast container not found")
    return
  }

  const toast = document.createElement("div")
  toast.className = `toast ${type}`
  toast.textContent = message
  toastContainer.appendChild(toast)

  setTimeout(() => {
    toast.classList.add("hide")
    setTimeout(() => toast.remove(), 500)
  }, 3000)
}

function displayMessage(elementId, message, isSuccess = true) {
  const messageElement = document.getElementById(elementId)
  if (messageElement) {
    messageElement.textContent = message
    messageElement.className = `mt-4 text-center text-sm ${isSuccess ? "text-green-500" : "text-red-500"}`
  } else {
    console.warn(`Message element '${elementId}' not found`)
  }
}

function clearMessage(elementId) {
  const messageElement = document.getElementById(elementId)
  if (messageElement) {
    messageElement.textContent = ""
    messageElement.className = "mt-4 text-center text-sm"
  }
}

function getDeviceFingerprint() {
  return btoa(navigator.userAgent + screen.width + screen.height)
}

function getIpAddress() {
  return "127.0.0.1"
}

// --- API Call Function with Enhanced Debugging ---
async function apiCall(endpoint, method = "GET", data = null, requiresAuth = false) {
  const fullUrl = `${BASE_API_URL}${endpoint}`
  console.log(`🌐 API Call: ${method} ${fullUrl}`)
  console.log(`📦 Data:`, data)

  const options = {
    method: method,
    headers: {
      "Content-Type": "application/json",
    },
  }

  if (data) {
    options.body = JSON.stringify(data)
  }

  if (requiresAuth) {
    const token = getAuthToken()
    if (!token) {
      console.error("❌ No auth token found")
      showToast("Please log in first", "error")
      window.location.href = "/" // Changed from index.html
      throw new Error("No auth token")
    }
    options.headers["Authorization"] = `Bearer ${token}`
    console.log(`🔐 Using auth token: ${token.substring(0, 20)}...`)
  }

  try {
    console.log(`📡 Making request to: ${fullUrl}`)
    const response = await fetch(fullUrl, options)
    console.log(`📨 Response status: ${response.status}`)

    const responseData = await response.json()
    console.log(`📋 Response data:`, responseData)

    if (!response.ok) {
      console.error(`❌ API Error: ${response.status}`, responseData)
      throw new Error(responseData.detail || `Error: ${response.status}`)
    }

    console.log(`✅ API Success:`, responseData)
    return responseData
  } catch (error) {
    console.error("🚨 API Call Failed:", error)

    // Check if it's a network error
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      console.error("🌐 Network Error - Is your server running on port 10000?")
      showToast("Cannot connect to server. Is it running?", "error")
    }

    throw error
  }
}

// Expose functions globally
window.apiCall = apiCall
window.showToast = showToast
window.displayMessage = displayMessage
window.clearMessage = clearMessage
window.getAuthToken = getAuthToken
window.getCurrentUser = getCurrentUser
window.clearAuthData = clearAuthData

// --- Form Handlers with Enhanced Debugging ---
async function handleLoginForm(event) {
  event.preventDefault()
  console.log("🔐 Login form submitted") // Add console log
  clearMessage("message")

  const emailInput = document.getElementById("email")
  const passwordInput = document.getElementById("password")

  if (!emailInput || !passwordInput) {
    console.error("❌ Email or password input not found")
    showToast("Internal error: Login form elements missing.", "error")
    return
  }

  const email = emailInput.value
  const password = passwordInput.value

  console.log(`📧 Email: ${email}`) // Add console log
  console.log(`🔑 Password length: ${password.length}`) // Add console log

  if (!email || !password) {
    showToast("Please enter both email and password", "error")
    displayMessage("message", "Please enter both email and password", false)
    return
  }

  try {
    console.log("🚀 Attempting login...") // Add console log
    const response = await apiCall("/auth/login", "POST", { email, password })
    console.log("✅ Login successful:", response) // Add console log

    saveAuthData(response.access_token, response.user)
    showToast("Login successful!", "success")
    displayMessage("message", "Login successful! Redirecting...", true)

    setTimeout(() => {
      console.log("🔄 Redirecting to PIN verification...") // Add console log
      window.location.href = "/pin-verify-login" // Changed from pin-verify-login.html
    }, 1000)
  } catch (error) {
    console.error("❌ Login failed:", error) // Add console log
    showToast("Login failed: " + error.message, "error")
    displayMessage("message", "Login failed: " + error.message, false)
  }
}

async function handleSignupForm(event) {
  event.preventDefault()
  console.log("📝 Signup form submitted") // Add console log
  clearMessage("message")

  const nameInput = document.getElementById("name")
  const emailInput = document.getElementById("email")
  const passwordInput = document.getElementById("password")
  const referralCodeInput = document.getElementById("referral-code") // Corrected ID

  if (!nameInput || !emailInput || !passwordInput) {
    console.error("❌ Signup form elements missing.")
    showToast("Internal error: Signup form elements missing.", "error")
    return
  }

  const name = nameInput.value
  const email = emailInput.value
  const password = passwordInput.value
  const referralCode = referralCodeInput ? referralCodeInput.value : null // Handle optional referral code

  console.log(`👤 Name: ${name}, 📧 Email: ${email}`) // Add console log

  if (!name || !email || !password) {
    showToast("Please fill in all required fields", "error")
    displayMessage("message", "Please fill in all required fields", false)
    return
  }

  // Store signup data temporarily for OTP verification and later PIN creation
  sessionStorage.setItem(
    "tempSignupData",
    JSON.stringify({
      name,
      email,
      password,
      referral_code: referralCode,
      device_fingerprint: getDeviceFingerprint(), // Capture device info here
      ip_address: getIpAddress(), // Capture IP here
      user_agent: navigator.userAgent, // Capture user agent here
    }),
  )
  console.log("💾 Stored signup data:", JSON.parse(sessionStorage.getItem("tempSignupData"))) // Add console log

  try {
    const response = await apiCall("/auth/request-otp", "POST", { email, purpose: "signup" })
    showToast("OTP sent to your email!", "success")
    displayMessage("message", "OTP sent! Redirecting to OTP verification...", true)
    setTimeout(() => {
      window.location.href = "/signup-otp" // Changed from signup-otp.html
    }, 1500)
  } catch (error) {
    console.error("❌ Signup failed:", error) // Add console log
    showToast("Signup failed: " + error.message, "error")
    displayMessage("message", "Signup failed: " + error.message, false)
  }
}

async function handleOtpVerifyForm(event) {
  event.preventDefault()
  console.log("🔢 OTP form submitted") // Add console log
  clearMessage("message")

  const otpInput = document.getElementById("otp") // Corrected ID
  if (!otpInput) {
    console.error("❌ OTP input not found.")
    showToast("Internal error: OTP input missing.", "error")
    return
  }
  const otpCode = otpInput.value
  const tempSignupData = JSON.parse(sessionStorage.getItem("tempSignupData") || "{}")

  console.log(`🔢 OTP Code: ${otpCode}`) // Add console log
  console.log(`💾 Temp data:`, tempSignupData) // Add console log

  if (!tempSignupData.email) {
    showToast("Session expired. Please start over.", "error")
    window.location.href = "/signup" // Changed from signup.html
    return
  }

  if (!otpCode || otpCode.length !== 6) {
    showToast("Please enter a valid 6-digit OTP", "error")
    displayMessage("message", "Please enter a valid 6-digit OTP", false)
    return
  }

  try {
    await apiCall("/auth/verify-otp", "POST", { email: tempSignupData.email, otp_code: otpCode, purpose: "signup" })
    showToast("OTP verified!", "success")
    displayMessage("message", "OTP verified. Redirecting to create your PIN...", true)
    // OTP is verified, now redirect to PIN creation page
    setTimeout(() => {
      window.location.href = "/create-pin" // Changed from create-pin.html
    }, 1500)
  } catch (error) {
    console.error("❌ OTP verification failed:", error) // Add console log
    showToast("OTP verification failed: " + error.message, "error")
    displayMessage("message", "OTP verification failed.", false)
  }
}

async function handleResendOtpButton(purpose) {
  clearMessage("message")
  let email = null

  if (purpose === "signup") {
    const tempSignupData = JSON.parse(sessionStorage.getItem("tempSignupData") || "{}")
    if (tempSignupData) {
      email = tempSignupData.email
    }
  } else if (purpose === "password_reset") {
    email = sessionStorage.getItem("forgotPasswordEmail")
  } else if (purpose === "pin_reset") {
    email = sessionStorage.getItem("pinResetEmail")
  }

  if (!email) {
    displayMessage("message", "Email not found for OTP resend. Please go back and re-enter your email.", false)
    return
  }

  try {
    await apiCall("/auth/request-otp", "POST", { email, purpose: purpose })
    showToast("New OTP sent to your email.", true)
  } catch (error) {
    showToast("Failed to resend OTP", "error")
  }
}

async function handleCreatePinForm(event) {
  event.preventDefault()
  console.log("📌 Create PIN form submitted") // Add console log
  clearMessage("message")

  const newPinInput = document.getElementById("pin") // Corrected ID
  const confirmNewPinInput = document.getElementById("confirm-pin") // Corrected ID

  if (!newPinInput || !confirmNewPinInput) {
    console.error("❌ PIN input elements not found.")
    showToast("Internal error: PIN input elements missing.", "error")
    return
  }

  const newPin = newPinInput.value
  const confirmNewPin = confirmNewPinInput.value

  console.log(`📌 PIN: ${newPin}, Confirm: ${confirmNewPin}`) // Add console log

  if (newPin !== confirmNewPin) {
    showToast("PINs do not match", "error")
    displayMessage("message", "PINs do not match", false)
    return
  }
  if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
    showToast("PIN must be a 4-digit number.", "error")
    displayMessage("message", "PIN must be a 4-digit number.", false)
    return
  }

  const tempSignupData = JSON.parse(sessionStorage.getItem("tempSignupData") || "{}")

  if (!tempSignupData || !tempSignupData.email) {
    displayMessage("message", "Signup session expired. Please start again.", false)
    setTimeout(() => (window.location.href = "/signup"), 2000) // Changed from signup.html
    return
  }

  // Combine temporary signup data with the new PIN
  const fullSignupData = {
    ...tempSignupData,
    pin: newPin, // Add the PIN to the signup data
  }
  console.log("📦 Full signup data:", fullSignupData) // Add console log

  try {
    // Now, call the actual signup endpoint with all data including the PIN
    const response = await apiCall("/auth/signup", "POST", fullSignupData)
    console.log("✅ Account created:", response) // Add console log
    showToast("Account created and PIN set successfully! Redirecting to login...", "success")
    sessionStorage.removeItem("tempSignupData") // Clean up temporary data
    setTimeout(() => (window.location.href = "/"), 2000) // Changed from index.html
  } catch (error) {
    console.error("❌ Account creation failed:", error) // Add console log
    showToast("Account creation failed: " + error.message, "error")
    displayMessage("message", error.message || "Failed to create account or set PIN.", false)
  }
}

async function handlePinVerifyLoginForm(event) {
  event.preventDefault()
  console.log("📌 PIN verify form submitted") // Add console log
  clearMessage("message")

  const pinInput = document.getElementById("pin")
  if (!pinInput) {
    console.error("❌ PIN input not found.")
    showToast("Internal error: PIN input missing.", "error")
    return
  }
  const pin = pinInput.value

  try {
    await apiCall("/auth/verify-pin", "POST", { pin }, true) // Requires auth token
    displayMessage("message", "PIN verified. Accessing dashboard...", true)
    window.location.href = "/dashboard" // Changed from dashboard.html
  } catch (error) {
    displayMessage("message", error.message || "Invalid PIN. Please try again.", false)
  }
}

async function handleForgotPasswordForm(event) {
  event.preventDefault()
  console.log("🔑 Forgot password form submitted") // Add console log
  clearMessage("message")

  const emailInput = document.getElementById("email")
  if (!emailInput) {
    console.error("❌ Email input not found.")
    showToast("Internal error: Email input missing.", "error")
    return
  }
  const email = emailInput.value
  sessionStorage.setItem("forgotPasswordEmail", email) // Store email for OTP verification

  if (!email) {
    showToast("Please enter your email address", "error")
    displayMessage("message", "Please enter your email address", false)
    return
  }

  try {
    await apiCall("/auth/request-otp", "POST", { email, purpose: "password_reset" })
    showToast("Password reset OTP sent. Redirecting...", "success")
    displayMessage("message", "OTP sent! Redirecting...", true)
    setTimeout(() => {
      window.location.href = "/forgot-password-otp" // Changed from forgot-password-otp.html
    }, 1500)
  } catch (error) {
    console.error("❌ Failed to send OTP:", error) // Add console log
    showToast("Failed to send OTP: " + error.message, "error")
    displayMessage("message", "Failed to send OTP: " + error.message, false)
  }
}

async function handleForgotPasswordOtpVerifyForm(event) {
  event.preventDefault()
  console.log("🔢 Forgot password OTP form submitted") // Add console log
  clearMessage("message")

  const otpInput = document.getElementById("otp") // Corrected ID
  if (!otpInput) {
    console.error("❌ OTP input not found.")
    showToast("Internal error: OTP input missing.", "error")
    return
  }
  const otpCode = otpInput.value
  const email = sessionStorage.getItem("forgotPasswordEmail")

  if (!email) {
    displayMessage("message", "Session expired or invalid. Please go back to forgot password.", false)
    setTimeout(() => (window.location.href = "/forgot-password"), 2000) // Changed from forgot-password.html
    return
  }

  if (!otpCode || otpCode.length !== 6) {
    showToast("Please enter a valid 6-digit OTP", "error")
    displayMessage("message", "Please enter a valid 6-digit OTP", false)
    return
  }

  try {
    await apiCall("/auth/verify-otp", "POST", { email, otp_code: otpCode, purpose: "password_reset" })
    showToast("OTP verified!", "success")
    displayMessage("message", "OTP verified. Redirecting to set new password...", true)
    setTimeout(() => {
      window.location.href = "/new-password" // Changed from new-password.html
    }, 1500)
  } catch (error) {
    console.error("❌ OTP verification failed:", error) // Add console log
    showToast("OTP verification failed: " + error.message, "error")
    displayMessage("message", "OTP verification failed.", false)
  }
}

async function handleNewPasswordForm(event) {
  event.preventDefault()
  console.log("🆕 New password form submitted") // Add console log
  clearMessage("message")

  const newPasswordInput = document.getElementById("new-password") // Corrected ID
  const confirmNewPasswordInput = document.getElementById("confirm-password") // Corrected ID

  if (!newPasswordInput || !confirmNewPasswordInput) {
    console.error("❌ Password input elements not found.")
    showToast("Internal error: Password input elements missing.", "error")
    return
  }

  const newPassword = newPasswordInput.value
  const confirmNewPassword = confirmNewPasswordInput.value
  const email = sessionStorage.getItem("forgotPasswordEmail")

  if (newPassword !== confirmNewPassword) {
    displayMessage("message", "Passwords do not match.", false)
    return
  }
  if (!email) {
    displayMessage("message", "Session expired or invalid. Please restart password reset.", false)
    setTimeout(() => (window.location.href = "/forgot-password"), 2000) // Changed from forgot-password.html
    return
  }

  // TODO: Backend needs an endpoint like: POST /api/auth/reset-password { email, otp_code, new_password }
  // For now, this will simulate success.
  displayMessage("message", "Password reset successfully! (Backend endpoint needed for full functionality)", true)
  sessionStorage.removeItem("forgotPasswordEmail") // Clean up
  setTimeout(() => (window.location.href = "/"), 1500) // Changed from index.html
}

async function handlePinResetForm(event) {
  event.preventDefault()
  console.log("🔑 PIN reset form submitted") // Add console log
  clearMessage("message")

  const emailInput = document.getElementById("email")
  if (!emailInput) {
    console.error("❌ Email input not found.")
    showToast("Internal error: Email input missing.", "error")
    return
  }
  const email = emailInput.value
  sessionStorage.setItem("pinResetEmail", email) // Store email for OTP verification

  if (!email) {
    showToast("Please enter your email address", "error")
    displayMessage("message", "Please enter your email address", false)
    return
  }

  try {
    await apiCall("/auth/request-otp", "POST", { email, purpose: "pin_reset" })
    displayMessage("message", "PIN reset OTP sent. Redirecting...", true)
    setTimeout(() => {
      window.location.href = "/pin-reset-otp" // Changed from pin-reset-otp.html
    }, 1500)
  } catch (error) {
    displayMessage("message", error.message || "Failed to request PIN reset OTP.", false)
  }
}

async function handlePinResetOtpVerifyForm(event) {
  event.preventDefault()
  console.log("🔢 PIN reset OTP form submitted") // Add console log
  clearMessage("message")

  const otpInput = document.getElementById("otp") // Corrected ID
  if (!otpInput) {
    console.error("❌ OTP input not found.")
    showToast("Internal error: OTP input missing.", "error")
    return
  }
  const otpCode = otpInput.value
  const email = sessionStorage.getItem("pinResetEmail")

  if (!email) {
    displayMessage("message", "Session expired or invalid. Please go back to PIN reset.", false)
    setTimeout(() => (window.location.href = "/pin-reset"), 2000) // Changed from pin-reset.html
    return
  }

  if (!otpCode || otpCode.length !== 6) {
    showToast("Please enter a valid 6-digit OTP", "error")
    displayMessage("message", "Please enter a valid 6-digit OTP", false)
    return
  }

  try {
    await apiCall("/auth/verify-otp", "POST", { email, otp_code: otpCode, purpose: "pin_reset" })
    showToast("OTP verified!", "success")
    displayMessage("message", "OTP verified. Redirecting to set new PIN...", true)
    setTimeout(() => {
      window.location.href = "/set-new-pin" // Changed from set-new-pin.html
    }, 1500)
  } catch (error) {
    console.error("❌ OTP verification failed:", error) // Add console log
    showToast("OTP verification failed: " + error.message, "error")
    displayMessage("message", "OTP verification failed.", false)
  }
}

async function handleSetNewPinForm(event) {
  event.preventDefault()
  console.log("📌 Set New PIN form submitted") // Add console log
  clearMessage("message")

  const newPinInput = document.getElementById("new-pin") // Corrected ID
  const confirmNewPinInput = document.getElementById("confirm-new-pin") // Corrected ID

  if (!newPinInput || !confirmNewPinInput) {
    console.error("❌ PIN input elements not found.")
    showToast("Internal error: PIN input elements missing.", "error")
    return
  }

  const newPin = newPinInput.value
  const confirmNewPin = confirmNewPinInput.value
  const email = sessionStorage.getItem("pinResetEmail") // Email from the reset flow

  if (newPin !== confirmNewPin) {
    displayMessage("message", "PINs do not match.", false)
    return
  }
  if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
    showToast("PIN must be a 4-digit number.", "error")
    displayMessage("message", "PIN must be a 4-digit number.", false)
    return
  }
  if (!email) {
    displayMessage("message", "Session expired or invalid. Please restart PIN reset.", false)
    setTimeout(() => (window.location.href = "/pin-reset"), 2000) // Changed from pin-reset.html
    return
  }

  // TODO: Backend needs an endpoint like: POST /api/auth/reset-pin { email, otp_code, new_pin }
  // For now, this will simulate success.
  displayMessage("message", "New PIN set successfully! (Backend endpoint needed for full functionality)", true)
  sessionStorage.removeItem("pinResetEmail") // Clean up
  setTimeout(() => (window.location.href = "/"), 1500) // Changed from index.html
}

function handleLogoutButton() {
  console.log("🚪 Logout button clicked")
  clearAuthData()
  showToast("Logged out successfully!", "success")
  window.location.href = "/" // Changed from index.html
}

// Expose logout function globally
window.handleLogoutButton = handleLogoutButton

// --- Event Listeners with Enhanced Debugging ---
document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 DOM loaded, setting up event listeners...") // Add console log

  // Get current page
  const currentPage = window.location.pathname.split("/").pop() || "" // Adjusted for root path
  console.log(`📄 Current page: ${currentPage}`) // Add console log

  // Debug: List all forms on the page
  const allForms = document.querySelectorAll("form")
  console.log(
    `📋 Found ${allForms.length} forms:`,
    Array.from(allForms).map((f) => f.id || "no-id"),
  ) // Add console log

  // Debug: List all buttons on the page
  const allButtons = document.querySelectorAll("button")
  console.log(
    `🔘 Found ${allButtons.length} buttons:`,
    Array.from(allButtons).map((b) => b.id || b.textContent?.trim()),
  ) // Add console log

  // Login Page (index.html or root path)
  if (currentPage === "" || currentPage === "index") {
    // Check for both "" (root) and "index"
    const loginForm = document.getElementById("login-form") // Corrected ID
    if (loginForm) {
      loginForm.addEventListener("submit", handleLoginForm)
      console.log("✅ Login form listener attached") // Add console log
    } else {
      console.error("❌ Login form not found! Looking for id='login-form'") // Add console log
    }
  }

  // Signup Page
  if (currentPage === "signup") {
    const signupForm = document.getElementById("signup-form") // Corrected ID
    if (signupForm) {
      signupForm.addEventListener("submit", handleSignupForm)
      console.log("✅ Signup form listener attached") // Add console log
    } else {
      console.error("❌ Signup form not found! Looking for id='signup-form'") // Add console log
    }
  }

  // Signup OTP Page
  if (currentPage === "signup-otp") {
    const otpForm = document.getElementById("otp-form") // Corrected ID
    if (otpForm) {
      otpForm.addEventListener("submit", handleOtpVerifyForm)
      console.log("✅ OTP form listener attached") // Add console log
    } else {
      console.error("❌ OTP form not found! Looking for id='otp-form'") // Add console log
    }

    const resendButton = document.getElementById("resend-otp-button") // Corrected ID
    if (resendButton) {
      resendButton.addEventListener("click", async () => {
        const tempData = JSON.parse(sessionStorage.getItem("tempSignupData") || "{}")
        if (tempData.email) {
          try {
            await apiCall("/auth/request-otp", "POST", { email: tempData.email, purpose: "signup" })
            showToast("New OTP sent!", "success")
          } catch (error) {
            showToast("Failed to resend OTP", "error")
          }
        }
      })
      console.log("✅ Resend OTP button listener attached") // Add console log
    }
  }

  // Create PIN Page
  if (currentPage === "create-pin") {
    const createPinForm = document.getElementById("create-pin-form") // Corrected ID
    if (createPinForm) {
      createPinForm.addEventListener("submit", handleCreatePinForm)
      console.log("✅ Create PIN form listener attached") // Add console log
    } else {
      console.error("❌ Create PIN form not found! Looking for id='create-pin-form'") // Add console log
    }
  }

  // PIN verify login page
  if (currentPage === "pin-verify-login") {
    const pinVerifyForm = document.getElementById("pin-verify-form") // Corrected ID
    if (pinVerifyForm) {
      pinVerifyForm.addEventListener("submit", handlePinVerifyLoginForm)
      console.log("✅ PIN verify form listener attached") // Add console log
    } else {
      console.error("❌ PIN verify form not found! Looking for id='pin-verify-form'") // Add console log
    }

    const logoutButton = document.getElementById("logout-button") // Corrected ID
    if (logoutButton) {
      logoutButton.addEventListener("click", handleLogoutButton)
      console.log("✅ Logout button listener attached") // Add console log
    }
  }

  // Forgot password page
  if (currentPage === "forgot-password") {
    const forgotPasswordForm = document.getElementById("forgot-password-form") // Corrected ID
    if (forgotPasswordForm) {
      forgotPasswordForm.addEventListener("submit", handleForgotPasswordForm)
      console.log("✅ Forgot password form listener attached") // Add console log
    } else {
      console.error("❌ Forgot password form not found! Looking for id='forgot-password-form'") // Add console log
    }
  }

  // Forgot password OTP page
  if (currentPage === "forgot-password-otp") {
    const forgotPasswordOtpForm = document.getElementById("forgot-password-otp-form") // Corrected ID
    if (forgotPasswordOtpForm) {
      forgotPasswordOtpForm.addEventListener("submit", handleForgotPasswordOtpVerifyForm)
      console.log("✅ Forgot password OTP form listener attached") // Add console log
    } else {
      console.error("❌ Forgot password OTP form not found! Looking for id='forgot-password-otp-form'") // Add console log
    }

    const resendButton = document.getElementById("resend-otp-button") // Corrected ID
    if (resendButton) {
      resendButton.addEventListener("click", async () => {
        const email = sessionStorage.getItem("forgotPasswordEmail")
        if (email) {
          try {
            await apiCall("/auth/request-otp", "POST", { email, purpose: "password_reset" })
            showToast("New OTP sent!", "success")
          } catch (error) {
            showToast("Failed to resend OTP", "error")
          }
        }
      })
      console.log("✅ Resend OTP button listener attached") // Add console log
    }
  }

  // New Password Page
  if (currentPage === "new-password") {
    const newPasswordForm = document.getElementById("new-password-form") // Corrected ID
    if (newPasswordForm) {
      newPasswordForm.addEventListener("submit", handleNewPasswordForm)
      console.log("✅ New password form listener attached") // Add console log
    } else {
      console.error("❌ New password form not found! Looking for id='new-password-form'") // Add console log
    }
  }

  // PIN Reset Page
  if (currentPage === "pin-reset") {
    const pinResetForm = document.getElementById("pin-reset-form") // Corrected ID
    if (pinResetForm) {
      pinResetForm.addEventListener("submit", handlePinResetForm)
      console.log("✅ PIN reset form listener attached") // Add console log
    } else {
      console.error("❌ PIN reset form not found! Looking for id='pin-reset-form'") // Add console log
    }
  }

  // PIN Reset OTP Page
  if (currentPage === "pin-reset-otp") {
    const pinResetOtpForm = document.getElementById("pin-reset-otp-form") // Corrected ID
    if (pinResetOtpForm) {
      pinResetOtpForm.addEventListener("submit", handlePinResetOtpVerifyForm)
      console.log("✅ PIN reset OTP form listener attached") // Add console log
    } else {
      console.error("❌ PIN reset OTP form not found! Looking for id='pin-reset-otp-form'") // Add console log
    }

    const resendButton = document.getElementById("resend-otp-button") // Corrected ID
    if (resendButton) {
      resendButton.addEventListener("click", async () => {
        const email = sessionStorage.getItem("pinResetEmail")
        if (email) {
          try {
            await apiCall("/auth/request-otp", "POST", { email, purpose: "pin_reset" })
            showToast("New OTP sent!", "success")
          } catch (error) {
            showToast("Failed to resend OTP", "error")
          }
        }
      })
      console.log("✅ Resend OTP button listener attached") // Add console log
    }
  }

  // Set New PIN Page
  if (currentPage === "set-new-pin") {
    const setNewPinForm = document.getElementById("set-new-pin-form") // Corrected ID
    if (setNewPinForm) {
      setNewPinForm.addEventListener("submit", handleSetNewPinForm)
      console.log("✅ Set New PIN form listener attached") // Add console log
    } else {
      console.error("❌ Set New PIN form not found! Looking for id='set-new-pin-form'") // Add console log
    }
  }
})

console.log("✅ app.js loaded successfully") // Add console log
