// app.js

const BASE_API_URL = "https://dansog-backend.onrender.com/api" // Your FastAPI backend URL - IMPORTANT: Update this for deployment!

// --- Utility Functions ---

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

function getDeviceFingerprint() {
  // A simple, non-unique fingerprint for demonstration.
  // For production, consider a more robust library or server-side generation.
  return btoa(navigator.userAgent + screen.width + screen.height)
}

function getIpAddress() {
  // In a real application, the IP address should be captured on the server-side
  // from the incoming request, as client-side IP can be unreliable or proxied.
  // For this client-side example, we'll use a placeholder.
  return "127.0.0.1" // Placeholder
}

// --- API Call Wrapper ---

async function apiCall(endpoint, method = "GET", data = null, requiresAuth = false) {
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
      window.location.href = "index.html" // Redirect to login if no token
      throw new Error("No authentication token found. Please log in.")
    }
    options.headers["Authorization"] = `Bearer ${token}`
  }

  try {
    const response = await fetch(url, options)
    const responseData = await response.json()

    if (!response.ok) {
      throw new Error(responseData.detail || "An error occurred.")
    }
    return responseData
  } catch (error) {
    console.error("API Call Error:", error)
    throw error
  }
}

// --- Form Handlers ---

async function handleLoginForm(event) {
  event.preventDefault()
  clearMessage("message")

  const email = document.getElementById("email").value
  const password = document.getElementById("password").value

  try {
    const response = await apiCall("/auth/login", "POST", { email, password })
    saveAuthData(response.access_token, response.user)
    displayMessage("message", "Login successful!", true)
    window.location.href = "pin-verify-login.html" // Redirect to PIN verification
  } catch (error) {
    displayMessage("message", error.message || "Login failed. Please check your credentials.", false)
  }
}

async function handleSignupForm(event) {
  event.preventDefault()
  clearMessage("message")

  const name = document.getElementById("name").value
  const email = document.getElementById("email").value
  const password = document.getElementById("password").value
  const referralCode = document.getElementById("referralCode").value

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

  try {
    await apiCall("/auth/request-otp", "POST", { email, purpose: "signup" })
    displayMessage("message", "OTP sent to your email. Redirecting to OTP verification...", true)
    setTimeout(() => {
      window.location.href = "signup-otp.html"
    }, 1500)
  } catch (error) {
    displayMessage("message", error.message || "Failed to request OTP.", false)
  }
}

async function handleOtpVerifyForm(event) {
  event.preventDefault()
  clearMessage("message")

  const otpCode = document.getElementById("otpCode").value
  const tempSignupData = JSON.parse(sessionStorage.getItem("tempSignupData"))

  if (!tempSignupData || !tempSignupData.email) {
    displayMessage("message", "Session expired or invalid. Please start signup again.", false)
    setTimeout(() => (window.location.href = "signup.html"), 2000)
    return
  }

  try {
    await apiCall("/auth/verify-otp", "POST", { email: tempSignupData.email, otp_code: otpCode, purpose: "signup" })
    displayMessage("message", "OTP verified. Redirecting to create your PIN...", true)
    // OTP is verified, now redirect to PIN creation page
    setTimeout(() => {
      window.location.href = "create-pin.html" // Redirect to the PIN creation page
    }, 1500)
  } catch (error) {
    displayMessage("message", error.message || "OTP verification failed.", false)
  }
}

async function handleResendOtpButton(purpose) {
  clearMessage("message")
  let email = null

  if (purpose === "signup") {
    const tempSignupData = JSON.parse(sessionStorage.getItem("tempSignupData"))
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
    displayMessage("message", "New OTP sent to your email.", true)
  } catch (error) {
    displayMessage("message", error.message || "Failed to resend OTP.", false)
  }
}

async function handleCreatePinForm(event) {
  event.preventDefault()
  clearMessage("message")

  const newPin = document.getElementById("newPin").value
  const confirmNewPin = document.getElementById("confirmNewPin").value

  if (newPin !== confirmNewPin) {
    displayMessage("message", "PINs do not match.", false)
    return
  }
  if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
    displayMessage("message", "PIN must be a 4-digit number.", false)
    return
  }

  const tempSignupData = JSON.parse(sessionStorage.getItem("tempSignupData"))

  if (!tempSignupData || !tempSignupData.email) {
    displayMessage("message", "Signup session expired. Please start again.", false)
    setTimeout(() => (window.location.href = "signup.html"), 2000)
    return
  }

  // Combine temporary signup data with the new PIN
  const fullSignupData = {
    ...tempSignupData,
    pin: newPin, // Add the PIN to the signup data
  }

  try {
    // Now, call the actual signup endpoint with all data including the PIN
    await apiCall("/auth/signup", "POST", fullSignupData)
    displayMessage("message", "Account created and PIN set successfully! Redirecting to login...", true)
    sessionStorage.removeItem("tempSignupData") // Clean up temporary data
    setTimeout(() => (window.location.href = "index.html"), 2000)
  } catch (error) {
    displayMessage("message", error.message || "Failed to create account or set PIN.", false)
  }
}

async function handleForgotPasswordForm(event) {
  event.preventDefault()
  clearMessage("message")

  const email = document.getElementById("email").value
  sessionStorage.setItem("forgotPasswordEmail", email) // Store email for OTP verification

  try {
    await apiCall("/auth/request-otp", "POST", { email, purpose: "password_reset" })
    displayMessage("message", "Password reset OTP sent. Redirecting...", true)
    setTimeout(() => {
      window.location.href = "forgot-password-otp.html"
    }, 1500)
  } catch (error) {
    displayMessage("message", error.message || "Failed to request password reset OTP.", false)
  }
}

async function handleForgotPasswordOtpVerifyForm(event) {
  event.preventDefault()
  clearMessage("message")

  const otpCode = document.getElementById("otpCode").value
  const email = sessionStorage.getItem("forgotPasswordEmail")

  if (!email) {
    displayMessage("message", "Session expired or invalid. Please go back to forgot password.", false)
    setTimeout(() => (window.location.href = "forgot-password.html"), 2000)
    return
  }

  try {
    await apiCall("/auth/verify-otp", "POST", { email, otp_code: otpCode, purpose: "password_reset" })
    displayMessage("message", "OTP verified. Redirecting to set new password...", true)
    setTimeout(() => {
      window.location.href = "new-password.html"
    }, 1500)
  } catch (error) {
    displayMessage("message", error.message || "OTP verification failed.", false)
  }
}

async function handleNewPasswordForm(event) {
  event.preventDefault()
  clearMessage("message")

  const newPassword = document.getElementById("newPassword").value
  const confirmNewPassword = document.getElementById("confirmNewPassword").value
  const email = sessionStorage.getItem("forgotPasswordEmail")

  if (newPassword !== confirmNewPassword) {
    displayMessage("message", "Passwords do not match.", false)
    return
  }
  if (!email) {
    displayMessage("message", "Session expired or invalid. Please restart password reset.", false)
    setTimeout(() => (window.location.href = "forgot-password.html"), 2000)
    return
  }

  // Backend needs an endpoint like: POST /api/auth/reset-password { email, otp_code, new_password }
  // For now, this will simulate success.
  displayMessage("message", "Password reset successfully! (Backend endpoint needed for full functionality)", true)
  sessionStorage.removeItem("forgotPasswordEmail") // Clean up
  setTimeout(() => (window.location.href = "index.html"), 1500)
}

async function handlePinVerifyLoginForm(event) {
  event.preventDefault()
  clearMessage("message")

  const pin = document.getElementById("pin").value

  try {
    await apiCall("/auth/verify-pin", "POST", { pin }, true) // Requires auth token
    displayMessage("message", "PIN verified. Accessing dashboard...", true)
    window.location.href = "dashboard.html" // Redirect to dashboard
  } catch (error) {
    displayMessage("message", error.message || "Invalid PIN. Please try again.", false)
  }
}

function handleLogoutButton() {
  clearAuthData()
  window.location.href = "index.html" // Redirect to login page
}

async function handlePinResetForm(event) {
  event.preventDefault()
  clearMessage("message")

  const email = document.getElementById("email").value
  sessionStorage.setItem("pinResetEmail", email) // Store email for OTP verification

  try {
    await apiCall("/auth/request-otp", "POST", { email, purpose: "pin_reset" })
    displayMessage("message", "PIN reset OTP sent. Redirecting...", true)
    setTimeout(() => {
      window.location.href = "pin-reset-otp.html"
    }, 1500)
  } catch (error) {
    displayMessage("message", error.message || "Failed to request PIN reset OTP.", false)
  }
}

async function handlePinResetOtpVerifyForm(event) {
  event.preventDefault()
  clearMessage("message")

  const otpCode = document.getElementById("otpCode").value
  const email = sessionStorage.getItem("pinResetEmail")

  if (!email) {
    displayMessage("message", "Session expired or invalid. Please go back to PIN reset.", false)
    setTimeout(() => (window.location.href = "pin-reset.html"), 2000)
    return
  }

  try {
    await apiCall("/auth/verify-otp", "POST", { email, otp_code: otpCode, purpose: "pin_reset" })
    displayMessage("message", "OTP verified. Redirecting to set new PIN...", true)
    setTimeout(() => {
      window.location.href = "set-new-pin.html"
    }, 1500)
  } catch (error) {
    displayMessage("message", error.message || "OTP verification failed.", false)
  }
}

async function handleSetNewPinForm(event) {
  event.preventDefault()
  clearMessage("message")

  const newPin = document.getElementById("newPin").value
  const confirmNewPin = document.getElementById("confirmNewPin").value
  const email = sessionStorage.getItem("pinResetEmail") // Email from the reset flow

  if (newPin !== confirmNewPin) {
    displayMessage("message", "PINs do not match.", false)
    return
  }
  if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
    displayMessage("message", "PIN must be a 4-digit number.", false)
    return
  }
  if (!email) {
    displayMessage("message", "Session expired or invalid. Please restart PIN reset.", false)
    setTimeout(() => (window.location.href = "pin-reset.html"), 2000)
    return
  }

  // Backend needs an endpoint like: POST /api/auth/reset-pin { email, otp_code, new_pin }
  // For now, this will simulate success.
  displayMessage("message", "New PIN set successfully! (Backend endpoint needed for full functionality)", true)
  sessionStorage.removeItem("pinResetEmail") // Clean up
  setTimeout(() => (window.location.href = "index.html"), 1500)
}

// --- Event Listeners ---

document.addEventListener("DOMContentLoaded", () => {
  // Login Page
  const loginForm = document.getElementById("loginForm")
  if (loginForm) {
    loginForm.addEventListener("submit", handleLoginForm)
  }

  // Signup Page
  const signupForm = document.getElementById("signupForm")
  if (signupForm) {
    signupForm.addEventListener("submit", handleSignupForm)
  }

  // Signup OTP Page
  const signupOtpVerifyForm = document.getElementById("otpVerifyForm")
  if (signupOtpVerifyForm) {
    signupOtpVerifyForm.addEventListener("submit", handleOtpVerifyForm)
    const resendOtpButton = document.getElementById("resendOtpButton")
    if (resendOtpButton) {
      resendOtpButton.addEventListener("click", () => {
        const tempSignupData = JSON.parse(sessionStorage.getItem("tempSignupData"))
        if (tempSignupData && tempSignupData.email) {
          handleResendOtpButton("signup")
        } else {
          displayMessage("message", "Email not found for OTP resend. Please go back and re-enter your email.", false)
        }
      })
    }
  }

  // Create PIN Page (now the final step of signup)
  const createPinForm = document.getElementById("createPinForm")
  if (createPinForm) {
    createPinForm.addEventListener("submit", handleCreatePinForm)
  }

  // Forgot Password Page
  const forgotPasswordForm = document.getElementById("forgotPasswordForm")
  if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener("submit", handleForgotPasswordForm)
  }

  // Forgot Password OTP Page
  const forgotPasswordOtpVerifyForm = document.getElementById("forgotPasswordOtpVerifyForm")
  if (forgotPasswordOtpVerifyForm) {
    forgotPasswordOtpVerifyForm.addEventListener("submit", handleForgotPasswordOtpVerifyForm)
    const resendOtpButton = document.getElementById("resendOtpButton")
    if (resendOtpButton) {
      resendOtpButton.addEventListener("click", () => handleResendOtpButton("password_reset"))
    }
  }

  // New Password Page
  const newPasswordForm = document.getElementById("newPasswordForm")
  if (newPasswordForm) {
    newPasswordForm.addEventListener("submit", handleNewPasswordForm)
  }

  // PIN Verify Login Page
  const pinVerifyLoginForm = document.getElementById("pinVerifyLoginForm")
  if (pinVerifyLoginForm) {
    pinVerifyLoginForm.addEventListener("submit", handlePinVerifyLoginForm)
    const logoutButton = document.getElementById("logoutButton")
    if (logoutButton) {
      logoutButton.addEventListener("click", handleLogoutButton)
    }
  }

  // PIN Reset Page
  const pinResetForm = document.getElementById("pinResetForm")
  if (pinResetForm) {
    pinResetForm.addEventListener("submit", handlePinResetForm)
  }

  // PIN Reset OTP Page
  const pinResetOtpVerifyForm = document.getElementById("pinResetOtpVerifyForm")
  if (pinResetOtpVerifyForm) {
    pinResetOtpVerifyForm.addEventListener("submit", handlePinResetOtpVerifyForm)
    const resendOtpButton = document.getElementById("resendOtpButton")
    if (resendOtpButton) {
      resendOtpButton.addEventListener("click", () => handleResendOtpButton("pin_reset"))
    }
  }

  // Set New PIN Page
  const setNewPinForm = document.getElementById("setNewPinForm")
  if (setNewPinForm) {
    setNewPinForm.addEventListener("submit", handleSetNewPinForm)
  }
})
