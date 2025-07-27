console.log("🚀 app.js loading...")

// --- Configuration ---
const BASE_API_URL = "http://localhost:10000/api"

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
  if (!toastContainer) return

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

// --- API Call Function ---
async function apiCall(endpoint, method = "GET", data = null, requiresAuth = false) {
  console.log(`API Call: ${method} ${endpoint}`)

  const url = `${BASE_API_URL}${endpoint}`
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
      showToast("Please log in first", "error")
      window.location.href = "index.html"
      throw new Error("No auth token")
    }
    options.headers["Authorization"] = `Bearer ${token}`
  }

  try {
    const response = await fetch(url, options)
    const responseData = await response.json()

    if (!response.ok) {
      throw new Error(responseData.detail || `Error: ${response.status}`)
    }
    return responseData
  } catch (error) {
    console.error("API Error:", error)
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

// --- Form Handlers ---
async function handleLoginForm(event) {
  event.preventDefault()
  console.log("Login form submitted")

  clearMessage("message")

  const email = document.getElementById("email").value
  const password = document.getElementById("password").value

  try {
    const response = await apiCall("/auth/login", "POST", { email, password })
    saveAuthData(response.access_token, response.user)
    showToast("Login successful!", "success")
    displayMessage("message", "Login successful! Redirecting...", true)
    setTimeout(() => {
      window.location.href = "pin-verify-login.html"
    }, 1000)
  } catch (error) {
    showToast("Login failed: " + error.message, "error")
    displayMessage("message", "Login failed: " + error.message, false)
  }
}

async function handleSignupForm(event) {
  event.preventDefault()
  console.log("Signup form submitted")

  clearMessage("message")

  const name = document.getElementById("name").value
  const email = document.getElementById("email").value
  const password = document.getElementById("password").value
  const referralCode = document.getElementById("referral-code")?.value || null

  // Store signup data for later use
  sessionStorage.setItem(
    "tempSignupData",
    JSON.stringify({
      name,
      email,
      password,
      referral_code: referralCode,
      device_fingerprint: getDeviceFingerprint(),
      ip_address: getIpAddress(),
      user_agent: navigator.userAgent,
    }),
  )

  try {
    const response = await apiCall("/auth/request-otp", "POST", { email, purpose: "signup" })
    showToast("OTP sent to your email!", "success")
    displayMessage("message", "OTP sent! Redirecting...", true)
    setTimeout(() => {
      window.location.href = "signup-otp.html"
    }, 1000)
  } catch (error) {
    showToast("Signup failed: " + error.message, "error")
    displayMessage("message", "Signup failed: " + error.message, false)
  }
}

async function handleOtpVerifyForm(event) {
  event.preventDefault()
  console.log("OTP form submitted")

  clearMessage("message")

  const otpCode = document.getElementById("otp").value
  const tempSignupData = JSON.parse(sessionStorage.getItem("tempSignupData") || "{}")

  if (!tempSignupData.email) {
    showToast("Session expired. Please start over.", "error")
    window.location.href = "signup.html"
    return
  }

  try {
    await apiCall("/auth/verify-otp", "POST", {
      email: tempSignupData.email,
      otp_code: otpCode,
      purpose: "signup",
    })
    showToast("OTP verified!", "success")
    displayMessage("message", "OTP verified! Redirecting...", true)
    setTimeout(() => {
      window.location.href = "create-pin.html"
    }, 1000)
  } catch (error) {
    showToast("OTP verification failed: " + error.message, "error")
    displayMessage("message", "OTP verification failed: " + error.message, false)
  }
}

async function handleCreatePinForm(event) {
  event.preventDefault()
  console.log("Create PIN form submitted")

  clearMessage("message")

  const newPin = document.getElementById("pin").value
  const confirmNewPin = document.getElementById("confirm-pin").value

  if (newPin !== confirmNewPin) {
    showToast("PINs do not match", "error")
    displayMessage("message", "PINs do not match", false)
    return
  }

  if (!/^\d{4}$/.test(newPin)) {
    showToast("PIN must be 4 digits", "error")
    displayMessage("message", "PIN must be 4 digits", false)
    return
  }

  const tempSignupData = JSON.parse(sessionStorage.getItem("tempSignupData") || "{}")

  if (!tempSignupData.email) {
    showToast("Session expired. Please start over.", "error")
    window.location.href = "signup.html"
    return
  }

  const fullSignupData = { ...tempSignupData, pin: newPin }

  try {
    const response = await apiCall("/auth/signup", "POST", fullSignupData)
    showToast("Account created successfully!", "success")
    displayMessage("message", "Account created! Redirecting to login...", true)
    sessionStorage.removeItem("tempSignupData")
    setTimeout(() => {
      window.location.href = "index.html"
    }, 1500)
  } catch (error) {
    showToast("Account creation failed: " + error.message, "error")
    displayMessage("message", "Account creation failed: " + error.message, false)
  }
}

async function handlePinVerifyLoginForm(event) {
  event.preventDefault()
  console.log("PIN verify form submitted")

  clearMessage("message")

  const pin = document.getElementById("pin").value

  try {
    await apiCall("/auth/verify-pin", "POST", { pin }, true)
    showToast("PIN verified!", "success")
    displayMessage("message", "PIN verified! Accessing dashboard...", true)
    setTimeout(() => {
      window.location.href = "dashboard.html"
    }, 1000)
  } catch (error) {
    showToast("Invalid PIN: " + error.message, "error")
    displayMessage("message", "Invalid PIN: " + error.message, false)
  }
}

async function handleForgotPasswordForm(event) {
  event.preventDefault()
  console.log("Forgot password form submitted")

  clearMessage("message")

  const email = document.getElementById("email").value
  sessionStorage.setItem("forgotPasswordEmail", email)

  try {
    await apiCall("/auth/request-otp", "POST", { email, purpose: "password_reset" })
    showToast("Password reset OTP sent!", "success")
    displayMessage("message", "OTP sent! Redirecting...", true)
    setTimeout(() => {
      window.location.href = "forgot-password-otp.html"
    }, 1000)
  } catch (error) {
    showToast("Failed to send OTP: " + error.message, "error")
    displayMessage("message", "Failed to send OTP: " + error.message, false)
  }
}

async function handleForgotPasswordOtpVerifyForm(event) {
  event.preventDefault()
  console.log("Forgot password OTP form submitted")

  clearMessage("message")

  const otpCode = document.getElementById("otp").value
  const email = sessionStorage.getItem("forgotPasswordEmail")

  if (!email) {
    showToast("Session expired", "error")
    window.location.href = "forgot-password.html"
    return
  }

  try {
    await apiCall("/auth/verify-otp", "POST", {
      email,
      otp_code: otpCode,
      purpose: "password_reset",
    })
    showToast("OTP verified!", "success")
    displayMessage("message", "OTP verified! Redirecting...", true)
    setTimeout(() => {
      window.location.href = "new-password.html"
    }, 1000)
  } catch (error) {
    showToast("OTP verification failed: " + error.message, "error")
    displayMessage("message", "OTP verification failed: " + error.message, false)
  }
}

function handleLogoutButton() {
  clearAuthData()
  showToast("Logged out successfully!", "success")
  window.location.href = "index.html"
}

// Expose logout function globally
window.handleLogoutButton = handleLogoutButton

// --- Event Listeners ---
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded, setting up event listeners...")

  // Get current page
  const currentPage = window.location.pathname.split("/").pop() || "index.html"
  console.log("Current page:", currentPage)

  // Login page
  if (currentPage === "index.html" || currentPage === "") {
    const loginForm = document.getElementById("login-form")
    if (loginForm) {
      loginForm.addEventListener("submit", handleLoginForm)
      console.log("✅ Login form listener attached")
    } else {
      console.error("❌ Login form not found")
    }
  }

  // Signup page
  if (currentPage === "signup.html") {
    const signupForm = document.getElementById("signup-form")
    if (signupForm) {
      signupForm.addEventListener("submit", handleSignupForm)
      console.log("✅ Signup form listener attached")
    }
  }

  // OTP verification page
  if (currentPage === "signup-otp.html") {
    const otpForm = document.getElementById("otp-form")
    if (otpForm) {
      otpForm.addEventListener("submit", handleOtpVerifyForm)
      console.log("✅ OTP form listener attached")
    }

    const resendButton = document.getElementById("resend-otp-button")
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
      console.log("✅ Resend OTP button listener attached")
    }
  }

  // Create PIN page
  if (currentPage === "create-pin.html") {
    const createPinForm = document.getElementById("create-pin-form")
    if (createPinForm) {
      createPinForm.addEventListener("submit", handleCreatePinForm)
      console.log("✅ Create PIN form listener attached")
    }
  }

  // PIN verify login page
  if (currentPage === "pin-verify-login.html") {
    const pinVerifyForm = document.getElementById("pin-verify-form")
    if (pinVerifyForm) {
      pinVerifyForm.addEventListener("submit", handlePinVerifyLoginForm)
      console.log("✅ PIN verify form listener attached")
    }

    const logoutButton = document.getElementById("logout-button")
    if (logoutButton) {
      logoutButton.addEventListener("click", handleLogoutButton)
      console.log("✅ Logout button listener attached")
    }
  }

  // Forgot password page
  if (currentPage === "forgot-password.html") {
    const forgotPasswordForm = document.getElementById("forgot-password-form")
    if (forgotPasswordForm) {
      forgotPasswordForm.addEventListener("submit", handleForgotPasswordForm)
      console.log("✅ Forgot password form listener attached")
    }
  }

  // Forgot password OTP page
  if (currentPage === "forgot-password-otp.html") {
    const forgotPasswordOtpForm = document.getElementById("forgot-password-otp-form")
    if (forgotPasswordOtpForm) {
      forgotPasswordOtpForm.addEventListener("submit", handleForgotPasswordOtpVerifyForm)
      console.log("✅ Forgot password OTP form listener attached")
    }

    const resendButton = document.getElementById("resend-otp-button")
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
      console.log("✅ Resend OTP button listener attached")
    }
  }

  console.log("✅ All event listeners set up!")
})

console.log("✅ app.js loaded successfully")
