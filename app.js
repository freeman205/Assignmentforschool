// --- Global Utility Functions (Exposed for other scripts like dashboard.js) ---

/**
 * Saves authentication token and user data to sessionStorage.
 * @param {string} token - The access token.
 * @param {object} user - The current user object.
 */
function saveAuthData(token, user) {
  sessionStorage.setItem("accessToken", token)
  sessionStorage.setItem("currentUser", JSON.stringify(user))
}

/**
 * Retrieves the authentication token from sessionStorage.
 * @returns {string|null} The access token or null if not found.
 */
function getAuthToken() {
  return sessionStorage.getItem("accessToken")
}

/**
 * Retrieves the current user object from sessionStorage.
 * @returns {object|null} The current user object or null if not found.
 */
function getCurrentUser() {
  const user = sessionStorage.getItem("currentUser")
  return user ? JSON.parse(user) : null
}

/**
 * Clears all authentication data from sessionStorage.
 */
function clearAuthData() {
  sessionStorage.removeItem("accessToken")
  sessionStorage.removeItem("currentUser")
}

/**
 * Displays a toast notification.
 * @param {string} message - The message to display.
 * @param {'success'|'error'} type - The type of toast (success or error).
 */
function showToast(message, type = "success") {
  const toastContainer = document.getElementById("toast-container")
  if (!toastContainer) {
    console.error("Toast container not found!")
    return
  }

  const toast = document.createElement("div")
  toast.className = `toast ${type}`
  toast.textContent = message

  toastContainer.appendChild(toast)

  setTimeout(() => {
    toast.classList.add("hide")
    toast.addEventListener("transitionend", () => {
      toast.remove()
    })
  }, 3000)
}

/**
 * Displays a message in a specific DOM element.
 * @param {string} elementId - The ID of the element to display the message in.
 * @param {string} message - The message content.
 * @param {boolean} isSuccess - True for success message (green), false for error (red).
 */
function displayMessage(elementId, message, isSuccess = true) {
  const messageElement = document.getElementById(elementId)
  if (messageElement) {
    messageElement.textContent = message
    messageElement.className = `mt-4 text-center text-sm ${isSuccess ? "text-green-500" : "text-red-500"}`
  }
}

/**
 * Clears a message from a specific DOM element.
 * @param {string} elementId - The ID of the element to clear.
 */
function clearMessage(elementId) {
  const messageElement = document.getElementById(elementId)
  if (messageElement) {
    messageElement.textContent = ""
    messageElement.className = "mt-4 text-center text-sm" // Reset classes
  }
}

/**
 * Generates a simple device fingerprint.
 * NOTE: For production, consider a more robust library or server-side generation.
 * @returns {string} A base64 encoded string representing a basic device fingerprint.
 */
function getDeviceFingerprint() {
  return btoa(navigator.userAgent + screen.width + screen.height)
}

/**
 * Placeholder for getting client IP address.
 * NOTE: In a real application, the IP address should be captured on the server-side
 * from the incoming request, as client-side IP can be unreliable or proxied.
 * @returns {string} A placeholder IP address.
 */
function getIpAddress() {
  return "127.0.0.1" // Placeholder
}

// --- API Call Wrapper ---
const BASE_API_URL = "http://localhost:10000/api" // Your FastAPI backend URL - IMPORTANT: Update this for deployment!

/**
 * Makes an API call to the backend.
 * @param {string} endpoint - The API endpoint (e.g., "/auth/login").
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE).
 * @param {object|null} data - Request body data (for POST/PUT).
 * @param {boolean} requiresAuth - True if the request needs an Authorization header.
 * @returns {Promise<object>} The JSON response from the API.
 * @throws {Error} If the API call fails or returns an error.
 */
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
      showToast("Authentication required. Please log in.", "error")
      window.location.href = "index.html" // Redirect to login if no token
      throw new Error("No authentication token found. Please log in.")
    }
    options.headers["Authorization"] = `Bearer ${token}`
  }

  try {
    const response = await fetch(url, options)
    const responseData = await response.json()

    if (!response.ok) {
      throw new Error(responseData.detail || `API Error: ${response.status} ${response.statusText || "Unknown Error"}`)
    }
    return responseData
  } catch (error) {
    console.error("API Call Error:", error)
    throw new Error(error.message || "An unexpected network error occurred. Please check your connection.")
  }
}

// Expose utility functions globally for dashboard.js and other scripts
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
  clearMessage("message") // Assuming a message element with id="message"

  const email = document.getElementById("email").value
  const password = document.getElementById("password").value

  try {
    const response = await apiCall("/auth/login", "POST", { email, password })
    saveAuthData(response.access_token, response.user)
    showToast("Login successful!", "success")
    displayMessage("message", "Login successful! Redirecting to PIN verification...", true)
    setTimeout(() => {
      window.location.href = "pin-verify-login.html"
    }, 1500)
  } catch (error) {
    showToast(error.message || "Login failed. Please check your credentials.", "error")
    displayMessage("message", error.message || "Login failed. Please check your credentials.", false)
  }
}

async function handleSignupForm(event) {
  event.preventDefault()
  clearMessage("message")

  const name = document.getElementById("name").value
  const email = document.getElementById("email").value
  const password = document.getElementById("password").value
  const referralCode = document.getElementById("referral-code") ? document.getElementById("referral-code").value : null

  // Store signup data temporarily for OTP verification and later PIN creation
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
    showToast(response.message || "OTP sent to your email.", "success")
    displayMessage("message", response.message || "OTP sent to your email. Redirecting to OTP verification...", true)
    setTimeout(() => {
      window.location.href = "signup-otp.html"
    }, 1500)
  } catch (error) {
    showToast(error.message || "Failed to request OTP. Please try again.", "error")
    displayMessage("message", error.message || "Failed to request OTP. Please try again.", false)
  }
}

async function handleOtpVerifyForm(event) {
  event.preventDefault()
  clearMessage("message")

  const otpCode = document.getElementById("otp").value
  const tempSignupData = JSON.parse(sessionStorage.getItem("tempSignupData"))

  if (!tempSignupData || !tempSignupData.email) {
    showToast("Signup data not found. Please start over.", "error")
    displayMessage("message", "Signup data not found. Please start over.", false)
    setTimeout(() => (window.location.href = "signup.html"), 2000)
    return
  }

  try {
    const response = await apiCall("/auth/verify-otp", "POST", {
      email: tempSignupData.email,
      otp_code: otpCode,
      purpose: "signup",
    })
    showToast(response.message || "OTP verified.", "success")
    displayMessage("message", response.message || "OTP verified. Redirecting to create your PIN...", true)
    // OTP is verified, now redirect to PIN creation page
    setTimeout(() => {
      window.location.href = "create-pin.html"
    }, 1500)
  } catch (error) {
    showToast(error.message || "OTP verification failed.", "error")
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
    showToast("Email not found for OTP resend. Please go back and re-enter your email.", "error")
    displayMessage("message", "Email not found for OTP resend. Please go back and re-enter your email.", false)
    return
  }

  try {
    const response = await apiCall("/auth/request-otp", "POST", { email, purpose: purpose })
    showToast(response.message || "New OTP sent to your email.", "success")
    displayMessage("message", response.message || "New OTP sent to your email.", true)
  } catch (error) {
    showToast(error.message || "Failed to resend OTP.", "error")
    displayMessage("message", error.message || "Failed to resend OTP.", false)
  }
}

async function handleCreatePinForm(event) {
  event.preventDefault()
  clearMessage("message")

  const newPin = document.getElementById("pin").value
  const confirmNewPin = document.getElementById("confirm-pin").value

  if (newPin !== confirmNewPin) {
    showToast("PINs do not match.", "error")
    displayMessage("message", "PINs do not match.", false)
    return
  }
  if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
    showToast("PIN must be a 4-digit number.", "error")
    displayMessage("message", "PIN must be a 4-digit number.", false)
    return
  }

  const tempSignupData = JSON.parse(sessionStorage.getItem("tempSignupData"))

  if (!tempSignupData || !tempSignupData.email) {
    showToast("Signup session expired. Please start again.", "error")
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
    const response = await apiCall("/auth/signup", "POST", fullSignupData)

    showToast(response.message || "Account created and PIN set successfully!", "success")
    displayMessage(
      "message",
      response.message || "Account created and PIN set successfully! Redirecting to login...",
      true,
    )
    sessionStorage.removeItem("tempSignupData") // Clean up temporary data
    setTimeout(() => (window.location.href = "index.html"), 2000) // Redirect to login
  } catch (error) {
    console.error("Error during signup:", error) // More specific error logging
    showToast(error.message || "Failed to create account or set PIN.", "error")
    displayMessage("message", error.message || "Failed to create account or set PIN.", false)
  }
}

async function handleForgotPasswordForm(event) {
  event.preventDefault()
  clearMessage("message")

  const email = document.getElementById("email").value
  sessionStorage.setItem("forgotPasswordEmail", email) // Store email for OTP verification

  try {
    const response = await apiCall("/auth/request-otp", "POST", { email, purpose: "password_reset" })
    showToast(response.message || "Password reset OTP sent.", "success")
    displayMessage("message", response.message || "Password reset OTP sent. Redirecting...", true)
    setTimeout(() => {
      window.location.href = "forgot-password-otp.html"
    }, 1500)
  } catch (error) {
    showToast(error.message || "Failed to request password reset OTP.", "error")
    displayMessage("message", error.message || "Failed to request password reset OTP.", false)
  }
}

async function handleForgotPasswordOtpVerifyForm(event) {
  event.preventDefault()
  clearMessage("message")

  const otpCode = document.getElementById("otp").value
  const email = sessionStorage.getItem("forgotPasswordEmail")

  if (!email) {
    showToast("Session expired or invalid. Please go back to forgot password.", "error")
    displayMessage("message", "Session expired or invalid. Please go back to forgot password.", false)
    setTimeout(() => (window.location.href = "forgot-password.html"), 2000)
    return
  }

  try {
    const response = await apiCall("/auth/verify-otp", "POST", {
      email,
      otp_code: otpCode,
      purpose: "password_reset",
    })
    showToast(response.message || "OTP verified.", "success")
    displayMessage("message", response.message || "OTP verified. Redirecting to set new password...", true)
    setTimeout(() => {
      window.location.href = "new-password.html"
    }, 1500)
  } catch (error) {
    showToast(error.message || "OTP verification failed.", "error")
    displayMessage("message", error.message || "OTP verification failed.", false)
  }
}

async function handleNewPasswordForm(event) {
  event.preventDefault()
  clearMessage("message")

  const newPassword = document.getElementById("new-password").value
  const confirmNewPassword = document.getElementById("confirm-password").value
  const email = sessionStorage.getItem("forgotPasswordEmail")

  if (newPassword !== confirmNewPassword) {
    showToast("Passwords do not match.", "error")
    displayMessage("message", "Passwords do not match.", false)
    return
  }
  if (!email) {
    showToast("Session expired or invalid. Please restart password reset.", "error")
    displayMessage("message", "Session expired or invalid. Please restart password reset.", false)
    setTimeout(() => (window.location.href = "forgot-password.html"), 2000)
    return
  }

  // NOTE: The backend currently does not have a dedicated endpoint for setting a new password
  // after OTP verification. This part of the frontend will simulate success.
  // You would typically send a request like:
  // await apiCall("/auth/reset-password", "POST", { email, new_password: newPassword, otp_code: /* get from session */ });
  showToast("Password reset successfully! (Backend endpoint needed for full functionality)", "success")
  displayMessage("message", "Password reset successfully! (Backend endpoint needed for full functionality)", true)
  sessionStorage.removeItem("forgotPasswordEmail") // Clean up
  setTimeout(() => (window.location.href = "index.html"), 1500)
}

async function handlePinVerifyLoginForm(event) {
  event.preventDefault()
  clearMessage("message")

  const pin = document.getElementById("pin").value

  try {
    const response = await apiCall("/auth/verify-pin", "POST", { pin }, true) // Requires auth token
    showToast(response.message || "PIN verified.", "success")
    displayMessage("message", response.message || "PIN verified. Accessing dashboard...", true)
    setTimeout(() => {
      window.location.href = "dashboard.html" // Redirect to dashboard
    }, 1500)
  } catch (error) {
    showToast(error.message || "Invalid PIN. Please try again.", "error")
    displayMessage("message", error.message || "Invalid PIN. Please try again.", false)
  }
}

// This function is exposed globally because it's used in pin-verify-login.html directly.
function handleLogoutButton() {
  clearAuthData()
  showToast("Logged out successfully!", "success")
  window.location.href = "index.html" // Redirect to login page
}
window.handleLogoutButton = handleLogoutButton // Expose globally

async function handlePinResetForm(event) {
  event.preventDefault()
  clearMessage("message")

  const email = document.getElementById("email").value
  sessionStorage.setItem("pinResetEmail", email) // Store email for OTP verification

  try {
    const response = await apiCall("/auth/request-otp", "POST", { email, purpose: "pin_reset" })
    showToast(response.message || "PIN reset OTP sent.", "success")
    displayMessage("message", response.message || "PIN reset OTP sent. Redirecting...", true)
    setTimeout(() => {
      window.location.href = "pin-reset-otp.html"
    }, 1500)
  } catch (error) {
    showToast(error.message || "Failed to request PIN reset OTP.", "error")
    displayMessage("message", error.message || "Failed to request PIN reset OTP.", false)
  }
}

async function handlePinResetOtpVerifyForm(event) {
  event.preventDefault()
  clearMessage("message")

  const otpCode = document.getElementById("otp").value
  const email = sessionStorage.getItem("pinResetEmail")

  if (!email) {
    showToast("Session expired or invalid. Please go back to PIN reset.", "error")
    displayMessage("message", "Session expired or invalid. Please go back to PIN reset.", false)
    setTimeout(() => (window.location.href = "pin-reset.html"), 2000)
    return
  }

  try {
    const response = await apiCall("/auth/verify-otp", "POST", { email, otp_code: otpCode, purpose: "pin_reset" })
    showToast(response.message || "OTP verified.", "success")
    displayMessage("message", response.message || "OTP verified. Redirecting to set new PIN...", true)
    setTimeout(() => {
      window.location.href = "set-new-pin.html"
    }, 1500)
  } catch (error) {
    showToast(error.message || "OTP verification failed.", "error")
    displayMessage("message", error.message || "OTP verification failed.", false)
  }
}

async function handleSetNewPinForm(event) {
  event.preventDefault()
  clearMessage("message")

  const newPin = document.getElementById("new-pin").value
  const confirmNewPin = document.getElementById("confirm-new-pin").value
  const email = sessionStorage.getItem("pinResetEmail") // Email from the reset flow

  if (newPin !== confirmNewPin) {
    showToast("PINs do not match.", "error")
    displayMessage("message", "PINs do not match.", false)
    return
  }
  if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
    showToast("PIN must be a 4-digit number.", "error")
    displayMessage("message", "PIN must be a 4-digit number.", false)
    return
  }
  if (!email) {
    showToast("Session expired or invalid. Please restart PIN reset.", "error")
    displayMessage("message", "Session expired or invalid. Please restart PIN reset.", false)
    setTimeout(() => (window.location.href = "pin-reset.html"), 2000)
    return
  }

  // NOTE: The backend currently does not have a dedicated endpoint for setting a new PIN
  // after OTP verification. This part of the frontend will simulate success.
  // You would typically send a request like:
  // await apiCall("/auth/reset-pin", "POST", { email, new_pin: newPin, otp_code: /* get from session */ });
  showToast("New PIN set successfully! (Backend endpoint needed for full functionality)", "success")
  displayMessage("message", "New PIN set successfully! (Backend endpoint needed for full functionality)", true)
  sessionStorage.removeItem("pinResetEmail") // Clean up
  setTimeout(() => (window.location.href = "index.html"), 1500)
}

// --- Event Listeners Attachment on DOMContentLoaded ---
document.addEventListener("DOMContentLoaded", () => {
  const currentPath = window.location.pathname.split("/").pop() // Get just the filename

  // Login Page
  if (currentPath === "index.html" || currentPath === "") {
    const loginForm = document.getElementById("login-form")
    if (loginForm) {
      loginForm.addEventListener("submit", handleLoginForm)
    }
  }

  // Signup Page
  if (currentPath === "signup.html") {
    const signupForm = document.getElementById("signup-form")
    if (signupForm) {
      signupForm.addEventListener("submit", handleSignupForm)
    }
  }

  // Signup OTP Page
  if (currentPath === "signup-otp.html") {
    const signupOtpVerifyForm = document.getElementById("otp-form")
    if (signupOtpVerifyForm) {
      signupOtpVerifyForm.addEventListener("submit", handleOtpVerifyForm)
    }
    const resendOtpButton = document.getElementById("resend-otp-button")
    if (resendOtpButton) {
      resendOtpButton.addEventListener("click", () => handleResendOtpButton("signup"))
    }
  }

  // Create PIN Page (now the final step of signup)
  if (currentPath === "create-pin.html") {
    const createPinForm = document.getElementById("create-pin-form")
    if (createPinForm) {
      createPinForm.addEventListener("submit", handleCreatePinForm)
    }
  }

  // Forgot Password Page
  if (currentPath === "forgot-password.html") {
    const forgotPasswordForm = document.getElementById("forgot-password-form")
    if (forgotPasswordForm) {
      forgotPasswordForm.addEventListener("submit", handleForgotPasswordForm)
    }
  }

  // Forgot Password OTP Page
  if (currentPath === "forgot-password-otp.html") {
    const forgotPasswordOtpVerifyForm = document.getElementById("forgot-password-otp-form")
    if (forgotPasswordOtpVerifyForm) {
      forgotPasswordOtpVerifyForm.addEventListener("submit", handleForgotPasswordOtpVerifyForm)
    }
    const resendOtpButton = document.getElementById("resend-otp-button")
    if (resendOtpButton) {
      resendOtpButton.addEventListener("click", () => handleResendOtpButton("password_reset"))
    }
  }

  // New Password Page
  if (currentPath === "new-password.html") {
    const newPasswordForm = document.getElementById("new-password-form")
    if (newPasswordForm) {
      newPasswordForm.addEventListener("submit", handleNewPasswordForm)
    }
  }

  // PIN Verify Login Page
  if (currentPath === "pin-verify-login.html") {
    const pinVerifyLoginForm = document.getElementById("pin-verify-form")
    if (pinVerifyLoginForm) {
      pinVerifyLoginForm.addEventListener("submit", handlePinVerifyLoginForm)
    }
    // Logout button is handled globally via window.handleLogoutButton
    const logoutButton = document.getElementById("logout-button")
    if (logoutButton) {
      logoutButton.addEventListener("click", handleLogoutButton)
    }
  }

  // PIN Reset Page
  if (currentPath === "pin-reset.html") {
    const pinResetForm = document.getElementById("pin-reset-form")
    if (pinResetForm) {
      pinResetForm.addEventListener("submit", handlePinResetForm)
    }
  }

  // PIN Reset OTP Page
  if (currentPath === "pin-reset-otp.html") {
    const pinResetOtpVerifyForm = document.getElementById("pin-reset-otp-form")
    if (pinResetOtpVerifyForm) {
      pinResetOtpVerifyForm.addEventListener("submit", handlePinResetOtpVerifyForm)
    }
    const resendOtpButton = document.getElementById("resend-otp-button")
    if (resendOtpButton) {
      resendOtpButton.addEventListener("click", () => handleResendOtpButton("pin_reset"))
    }
  }

  // Set New PIN Page
  if (currentPath === "set-new-pin.html") {
    const setNewPinForm = document.getElementById("set-new-pin-form")
    if (setNewPinForm) {
      setNewPinForm.addEventListener("submit", handleSetNewPinForm)
    }
  }
})
