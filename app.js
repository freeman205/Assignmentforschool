document.addEventListener("DOMContentLoaded", () => {
  const currentPath = window.location.pathname
  const BASE_API_URL = "http://localhost:10000/api" // Your FastAPI backend URL - IMPORTANT: Update this for deployment!

  // Helper to get URL parameters
  const getUrlParameter = (name) => {
    name = name.replace(/[[]/, "\\[").replace(/[\]/]", "\\]")
 {4}const regex = new RegExp("[\\?&]" + name + "=([^&#]*)")
 {4}const results = regex.exec(location.search)
 {4}return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "))
 {2}}

  // Utility function to show toast messages\
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

  // Utility to get device fingerprint (simple example)\
  function getDeviceFingerprint() {
    const userAgent = navigator.userAgent
    const screenResolution = `${window.screen.width}x${window.screen.height}`
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    return btoa(userAgent + screenResolution + timezone) // Base64 encode for simplicity
  }

  // Utility to get IP address (requires a backend endpoint or external service)\
  async function getIpAddress() {
    try {
      // This is a placeholder. In a real app, you'd have a backend endpoint
      // that returns the client's IP address, or use a service like ipify.org
      const response = await fetch("https://api.ipify.org?format=json")
      const data = await response.json()
      return data.ip
    } catch (error) {
      console.error("Error getting IP address:", error)
      return "unknown"
    }
  }
\
  function saveAuthData(token, user) {
    localStorage.setItem("accessToken", token)
    localStorage.setItem("user", JSON.stringify(user))
  }
\
  function getAuthToken() {
    return localStorage.getItem("accessToken")
  }
\
  function getCurrentUser() {
    const user = localStorage.getItem("user")
    return user ? JSON.parse(user) : null
  }
\
  function clearAuthData() {
    localStorage.removeItem("accessToken")
    localStorage.removeItem("user")
  }

  // --- Signup Flow Functions ---

  // Step 1: Handle signup form submission (signup.html)\
  async function handleSignupFormSubmit(event) {
    event.preventDefault()
    const form = event.target
    const name = form.name.value
    const email = form.email.value
    const password = form.password.value
    const referralCode = form["referral-code"] ? form["referral-code"].value : ""

    // Store data temporarily in sessionStorage
    sessionStorage.setItem("signupData", JSON.stringify({ name, email, password, referralCode }))

    try {
      const response = await fetch(`${BASE_API_URL}/auth/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose: "signup" }),
      })
      const data = await response.json()

      if (response.ok) {
        showToast(data.message)
        window.location.href = "/signup-otp.html" // Redirect to OTP verification
      } else {
        // Display the error message from the backend
        showToast(data.detail || "Failed to request OTP. Please try again.", "error")
        // IMPORTANT: Do NOT redirect to OTP page if there was an error
        // Remove any line here that redirects to /signup-otp.html if response is not ok
      }
    } catch (error) {
      console.error("Error:", error)
      showToast("An unexpected error occurred. Please try again.", "error")
    }
  }

  // Step 2: Handle OTP verification (signup-otp.html)\
  async function handleOtpVerification(event) {
    event.preventDefault()
    const form = event.target
    const otpCode = form.otp.value
    const signupData = JSON.parse(sessionStorage.getItem("signupData"))

    if (!signupData || !signupData.email) {
      showToast("Signup data not found. Please start over.", "error")
      window.location.href = "/signup.html"
      return
    }

    try {
      const response = await fetch(`${BASE_API_URL}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: signupData.email, otp_code: otpCode, purpose: "signup" }),
      })
      const data = await response.json()

      if (response.ok) {
        showToast(data.message)
        window.location.href = "/create-pin.html" // Redirect to PIN creation
      } else {
        showToast(data.detail || "OTP verification failed", "error")
      }
    } catch (error) {
      console.error("Error:", error)
      showToast("An error occurred. Please try again.", "error")
    }
  }

  // Step 3: Handle PIN creation and final signup (create-pin.html)\
  async function handleCreatePinFormSubmit(event) {
    event.preventDefault()
    const form = event.target
    const pin = form.pin.value
    const confirmPin = form["confirm-pin"].value

    if (pin !== confirmPin) {
      showToast("PINs do not match.", "error")
      return
    }

    const signupData = JSON.parse(sessionStorage.getItem("signupData"))

    if (!signupData || !signupData.email || !signupData.password || !signupData.name) {
      showToast("Signup data missing. Please start over.", "error")
      window.location.href = "/signup.html"
      return
    }

    const deviceFingerprint = getDeviceFingerprint()
    const ipAddress = await getIpAddress()
    const userAgent = navigator.userAgent

    const finalSignupData = {
      ...signupData,
      pin: pin,
      device_fingerprint: deviceFingerprint,
      ip_address: ipAddress,
      user_agent: userAgent,
    }

    try {
      const response = await fetch(`${BASE_API_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalSignupData),
      })
      const data = await response.json()

      if (response.ok) {
        showToast(data.message)
        sessionStorage.removeItem("signupData") // Clear stored data
        window.location.href = "/index.html" // Redirect to login page
      } else {
        showToast(data.detail || "Signup failed", "error")
      }
    } catch (error) {
      console.error("Error:", error)
      showToast("An error occurred. Please try again.", "error")
    }
  }

  // --- Login Function ---\
  async function handleLoginFormSubmit(event) {
    event.preventDefault()
    const form = event.target
    const email = form.email.value
    const password = form.password.value

    try {
      const response = await fetch(`${BASE_API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const data = await response.json()

      if (response.ok) {
        showToast("Login successful!")
        saveAuthData(data.access_token, data.user)
        window.location.href = "/pin-verify-login.html" // Redirect to PIN verification after login
      } else {
        showToast(data.detail || "Login failed", "error")
      }
    } catch (error) {
      console.error("Error:", error)
      showToast("An error occurred. Please try again.", "error")
    }
  }

  // --- Forgot Password Flow Functions ---

  // Step 1: Request OTP for password reset (forgot-password.html)\
  async function handleForgotPasswordRequest(event) {
    event.preventDefault()
    const form = event.target
    const email = form.email.value
    sessionStorage.setItem("resetEmail", email) // Store email for next step

    try {
      const response = await fetch(`${BASE_API_URL}/auth/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose: "password_reset" }),
      })
      const data = await response.json()

      if (response.ok) {
        showToast(data.message)
        window.location.href = "/forgot-password-otp.html"
      } else {
        showToast(data.detail || "Failed to request password reset OTP", "error")
      }
    } catch (error) {
      console.error("Error:", error)
      showToast("An error occurred. Please try again.", "error")
    }
  }

  // Step 2: Verify OTP for password reset (forgot-password-otp.html)\
  async function handleForgotPasswordOtpVerification(event) {
    event.preventDefault()
    const form = event.target
    const otpCode = form.otp.value
    const email = sessionStorage.getItem("resetEmail")

    if (!email) {
      showToast("Email not found for reset. Please start over.", "error")
      window.location.href = "/forgot-password.html"
      return
    }

    try {
      const response = await fetch(`${BASE_API_URL}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp_code: otpCode, purpose: "password_reset" }),
      })
      const data = await response.json()

      if (response.ok) {
        showToast(data.message)
        window.location.href = "/new-password.html" // Redirect to set new password
      } else {
        showToast(data.detail || "OTP verification failed", "error")
      }
    } catch (error) {
      console.error("Error:", error)
      showToast("An error occurred. Please try again.", "error")
    }
  }

  // Step 3: Set new password (new-password.html)\
  async function handleNewPasswordSet(event) {
    event.preventDefault()
    const form = event.target
    const newPassword = form["new-password"].value
    const confirmPassword = form["confirm-password"].value
    const email = sessionStorage.getItem("resetEmail")

    if (newPassword !== confirmPassword) {
      showToast("Passwords do not match.", "error")
      return
    }
    if (!email) {
      showToast("Email not found for reset. Please start over.", "error")
      window.location.href = "/forgot-password.html"
      return
    }

    try {
      // Assuming a backend endpoint for setting new password after OTP verification
      const response = await fetch(`${BASE_API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, new_password: newPassword }),
      })
      const data = await response.json()

      if (response.ok) {
        showToast(data.message)
        sessionStorage.removeItem("resetEmail") // Clear stored email
        window.location.href = "/index.html" // Redirect to login
      } else {
        showToast(data.detail || "Failed to set new password", "error")
      }
    } catch (error) {
      console.error("Error:", error)
      showToast("An error occurred. Please try again.", "error")
    }
  }

  // --- PIN Verification/Reset Flow Functions ---

  // Verify PIN after login (pin-verify-login.html)\
  async function handlePinVerifyLogin(event) {
    event.preventDefault()
    const form = event.target
    const pin = form.pin.value
    const accessToken = localStorage.getItem("accessToken")

    if (!accessToken) {
      showToast("Not logged in. Please log in again.", "error")
      window.location.href = "/index.html"
      return
    }

    try {
      const response = await fetch(`${BASE_API_URL}/auth/verify-pin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ pin }),
      })
      const data = await response.json()

      if (response.ok) {
        showToast(data.message)
        window.location.href = "/dashboard.html" // Redirect to dashboard
      } else {
        showToast(data.detail || "PIN verification failed", "error")
      }
    } catch (error) {
      console.error("Error:", error)
      showToast("An error occurred. Please try again.", "error")
    }
  }

  // Step 1: Request OTP for PIN reset (pin-reset.html)\
  async function handlePinResetRequest(event) {
    event.preventDefault()
    const form = event.target
    const email = form.email.value
    sessionStorage.setItem("pinResetEmail", email) // Store email for next step

    try {
      const response = await fetch(`${BASE_API_URL}/auth/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose: "pin_reset" }),
      })
      const data = await response.json()

      if (response.ok) {
        showToast(data.message)
        window.location.href = "/pin-reset-otp.html"
      } else {
        showToast(data.detail || "Failed to request PIN reset OTP", "error")
      }
    } catch (error) {
      console.error("Error:", error)
      showToast("An error occurred. Please try again.", "error")
    }
  }

  // Step 2: Verify OTP for PIN reset (pin-reset-otp.html)\
  async function handlePinResetOtpVerification(event) {
    event.preventDefault()
    const form = event.target
    const otpCode = form.otp.value
    const email = sessionStorage.getItem("pinResetEmail")

    if (!email) {
      showToast("Email not found for PIN reset. Please start over.", "error")
      window.location.href = "/pin-reset.html"
      return
    }

    try {
      const response = await fetch(`${BASE_API_URL}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp_code: otpCode, purpose: "pin_reset" }),
      })
      const data = await response.json()

      if (response.ok) {
        showToast(data.message)
        window.location.href = "/set-new-pin.html" // Redirect to set new PIN
      } else {
        showToast(data.detail || "OTP verification failed", "error")
      }
    } catch (error) {
      console.error("Error:", error)
      showToast("An error occurred. Please try again.", "error")
    }
  }

  // Step 3: Set new PIN (set-new-pin.html)\
  async function handleSetNewPin(event) {
    event.preventDefault()
    const form = event.target
    const newPin = form["new-pin"].value
    const confirmNewPin = form["confirm-new-pin"].value
    const email = sessionStorage.getItem("pinResetEmail")
    const accessToken = localStorage.getItem("accessToken") // Assuming user might be logged in

    if (newPin !== confirmNewPin) {
      showToast("PINs do not match.", "error")
      return
    }
    if (!email) {
      showToast("Email not found for PIN reset. Please start over.", "error")
      window.location.href = "/pin-reset.html"
      return
    }

    try {
      const headers = { "Content-Type": "application/json" }
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`
      }

      const response = await fetch(`${BASE_API_URL}/auth/set-pin`, {
        // Assuming a new endpoint for setting PIN
        method: "POST",
        headers: headers,
        body: JSON.stringify({ email: email, new_pin: newPin }),
      })
      const data = await response.json()

      if (response.ok) {
        showToast(data.message)
        sessionStorage.removeItem("pinResetEmail") // Clear session data
        window.location.href = "/dashboard.html" // Redirect to dashboard or login
      } else {
        showToast(data.detail || "Failed to set new PIN", "error")
      }
    } catch (error) {
      console.error("Error:", error)
      showToast("An error occurred. Please try again.", "error")
    }
  }

  // --- Dashboard Functions ---
\
  async function fetchDashboardStats() {
    const accessToken = localStorage.getItem("accessToken")
    if (!accessToken) {
      showToast("Not authenticated. Please log in.", "error")
      window.location.href = "/index.html"
      return
    }

    try {
      const response = await fetch(`${BASE_API_URL}/dashboard/stats`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      const data = await response.json()

      if (response.ok) {
        document.getElementById("points-balance").textContent = data.points_balance
        document.getElementById("completed-surveys").textContent = data.completed_surveys
        document.getElementById("total-earned").textContent = data.total_earned
        document.getElementById("pending-redemptions").textContent = data.pending_redemptions
      } else {
        showToast(data.detail || "Failed to fetch dashboard stats", "error")
      }
    } catch (error) {
      console.error("Error:", error)
      showToast("An error occurred. Please try again.", "error")
    }
  }
\
  async function handleTransferPoints(event) {
    event.preventDefault()
    const form = event.target
    const toEmail = form.to_email.value
    const amount = Number.parseFloat(form.amount.value)
    const accessToken = localStorage.getItem("accessToken")

    if (!accessToken) {
      showToast("Not authenticated. Please log in.", "error")
      window.location.href = "/index.html"
      return
    }

    try {
      const response = await fetch(`${BASE_API_URL}/points/transfer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ to_email: toEmail, amount: amount }),
      })
      const data = await response.json()

      if (response.ok) {
        showToast(data.message)
        form.reset()
        fetchDashboardStats() // Refresh stats
      } else {
        showToast(data.detail || "Point transfer failed", "error")
      }
    } catch (error) {
      console.error("Error:", error)
      showToast("An error occurred. Please try again.", "error")
    }
  }
\
  async function fetchTransferHistory() {
    const accessToken = localStorage.getItem("accessToken")
    if (!accessToken) {
      showToast("Not authenticated. Please log in.", "error")
      window.location.href = "/index.html"
      return
    }

    try {
      const response = await fetch(`${BASE_API_URL}/points/history`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      const data = await response.json()

      if (response.ok) {
        const historyTableBody = document.getElementById("transfer-history-body")
        historyTableBody.innerHTML = "" // Clear previous entries

        data.transfers.forEach((transfer) => {
          const row = historyTableBody.insertRow()
          row.insertCell(0).textContent = transfer.id
          row.insertCell(1).textContent = transfer.from_user_id // You might want to show email/name here
          row.insertCell(2).textContent = transfer.to_user_id // You might want to show email/name here
          row.insertCell(3).textContent = transfer.amount
          row.insertCell(4).textContent = new Date(transfer.timestamp).toLocaleString()
        })
      } else {
        showToast(data.detail || "Failed to fetch transfer history", "error")
      }
    } catch (error) {
      console.error("Error:", error)
      showToast("An error occurred. Please try again.", "error")
    }
  }
\
  async function fetchRedemptionRates() {
    try {
      const response = await fetch(`${BASE_API_URL}/redemption/rates`)
      const data = await response.json()

      if (response.ok) {
        document.getElementById("bitcoin-rate").textContent = data.bitcoin_rate
        document.getElementById("gift-card-rate").textContent = data.gift_card_rate
      } else {
        showToast(data.detail || "Failed to fetch redemption rates", "error")
      }
    } catch (error) {
      console.error("Error:", error)
      showToast("An error occurred. Please try again.", "error")
    }
  }
\
  async function handleRedemptionRequest(event) {
    event.preventDefault()
    const form = event.target
    const type = form.redemption_type.value
    const pointsAmount = Number.parseFloat(form.points_amount.value)
    const walletAddress = form.wallet_address.value
    const emailAddress = form.email_address.value
    const accessToken = localStorage.getItem("accessToken")

    if (!accessToken) {
      showToast("Not authenticated. Please log in.", "error")
      window.location.href = "/index.html"
      return
    }

    try {
      const response = await fetch(`${BASE_API_URL}/redemption/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          type: type,
          points_amount: pointsAmount,
          wallet_address: walletAddress,
          email_address: emailAddress,
        }),
      })
      const data = await response.json()

      if (response.ok) {
        showToast(data.message)
        form.reset()
        fetchDashboardStats() // Refresh stats
        fetchRedemptionHistory() // Refresh history
      } else {
        showToast(data.detail || "Redemption request failed", "error")
      }
    } catch (error) {
      console.error("Error:", error)
      showToast("An error occurred. Please try again.", "error")
    }
  }
\
  async function fetchRedemptionHistory() {
    const accessToken = localStorage.getItem("accessToken")
    if (!accessToken) {
      showToast("Not authenticated. Please log in.", "error")
      window.location.href = "/index.html"
      return
    }

    try {
      const response = await fetch(`${BASE_API_URL}/redemption/history`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      const data = await response.json()

      if (response.ok) {
        const historyTableBody = document.getElementById("redemption-history-body")
        historyTableBody.innerHTML = "" // Clear previous entries

        data.forEach((redemption) => {
          const row = historyTableBody.insertRow()
          row.insertCell(0).textContent = redemption.id
          row.insertCell(1).textContent = redemption.type
          row.insertCell(2).textContent = redemption.points_amount
          row.insertCell(3).textContent = redemption.equivalent_value.toFixed(5) // Format for BTC/USD
          row.insertCell(4).textContent = redemption.status
          row.insertCell(5).textContent = new Date(redemption.requested_at).toLocaleString()
        })
      } else {
        showToast(data.detail || "Failed to fetch redemption history", "error")
      }
    } catch (error) {
      console.error("Error:", error)
      showToast("An error occurred. Please try again.", "error")
    }
  }
\
  async function fetchActiveSurveys() {
    const accessToken = localStorage.getItem("accessToken")
    if (!accessToken) {
      showToast("Not authenticated. Please log in.", "error")
      window.location.href = "/index.html"
      return
    }

    try {
      const response = await fetch(`${BASE_API_URL}/surveys`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      const data = await response.json()

      if (response.ok) {
        const surveysContainer = document.getElementById("active-surveys-container")
        surveysContainer.innerHTML = "" // Clear previous entries

        if (data.length === 0) {
          surveysContainer.innerHTML = "<p>No active surveys available at the moment.</p>"
          return
        }

        data.forEach((survey) => {
          const surveyCard = document.createElement("div")
          surveyCard.className = "survey-card"
          surveyCard.innerHTML = `
            <h3>${survey.title}</h3>
            <p>${survey.description}</p>
            <p>Points Reward: <strong>${survey.points_reward}</strong></p>
            <button class="complete-survey-btn" data-survey-id="${survey.id}">Complete Survey</button>
          `
          surveysContainer.appendChild(surveyCard)
        })

        // Add event listeners to new buttons
        document.querySelectorAll(".complete-survey-btn").forEach((button) => {
          button.addEventListener("click", handleCompleteSurvey)
        })
      } else {
        showToast(data.detail || "Failed to fetch active surveys", "error")
      }
    } catch (error) {
      console.error("Error:", error)
      showToast("An error occurred. Please try again.", "error")
    }
  }
\
  async function handleCompleteSurvey(event) {
    const surveyId = event.target.dataset.surveyId
    const accessToken = localStorage.getItem("accessToken")

    if (!accessToken) {
      showToast("Not logged in. Please log in again.", "error")
      window.location.href = "/index.html"
      return
    }

    try {
      const response = await fetch(`${BASE_API_URL}/surveys/${surveyId}/complete`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      const data = await response.json()

      if (response.ok) {
        showToast(data.message)
        fetchDashboardStats() // Refresh points balance
        fetchActiveSurveys() // Refresh survey list
      } else {
        showToast(data.detail || "Failed to complete survey", "error")
      }
    } catch (error) {
      console.error("Error:", error)
      showToast("An error occurred. Please try again.", "error")
    }
  }

  // --- Logout Function ---
  function handleLogout() {
    clearAuthData()
    showToast("Logged out successfully!")
    window.location.href = "/index.html"
  }

  // --- Event Listeners based on current page ---
  if (currentPath.endsWith("signup.html")) {
    const signupForm = document.getElementById("signup-form")
    if (signupForm) {
      signupForm.addEventListener("submit", handleSignupFormSubmit)
    }
  } else if (currentPath.endsWith("signup-otp.html")) {
    const otpForm = document.getElementById("otp-form")
    if (otpForm) {
      otpForm.addEventListener("submit", handleOtpVerification)
    }
  } else if (currentPath.endsWith("create-pin.html")) {
    const createPinForm = document.getElementById("create-pin-form")
    if (createPinForm) {
      createPinForm.addEventListener("submit", handleCreatePinFormSubmit)
    }
  } else if (currentPath.endsWith("index.html") || currentPath === "/") {
    const loginForm = document.getElementById("login-form")
    if (loginForm) {
      loginForm.addEventListener("submit", handleLoginFormSubmit)
    }
  } else if (currentPath.endsWith("pin-verify-login.html")) {
    const pinVerifyForm = document.getElementById("pin-verify-form")
    if (pinVerifyForm) {
      pinVerifyForm.addEventListener("submit", handlePinVerifyLogin)
    }
  } else if (currentPath.endsWith("forgot-password.html")) {
    const forgotPasswordForm = document.getElementById("forgot-password-form")
    if (forgotPasswordForm) {
      forgotPasswordForm.addEventListener("submit", handleForgotPasswordRequest)
    }
  } else if (currentPath.endsWith("forgot-password-otp.html")) {
    const forgotPasswordOtpForm = document.getElementById("forgot-password-otp-form")
    if (forgotPasswordOtpForm) {
      forgotPasswordOtpForm.addEventListener("submit", handleForgotPasswordOtpVerification)
    }
  } else if (currentPath.endsWith("new-password.html")) {
    const newPasswordForm = document.getElementById("new-password-form")
    if (newPasswordForm) {
      newPasswordForm.addEventListener("submit", handleNewPasswordSet)
    }
  } else if (currentPath.endsWith("pin-reset.html")) {
    const pinResetForm = document.getElementById("pin-reset-form")
    if (pinResetForm) {
      pinResetForm.addEventListener("submit", handlePinResetRequest)
    }
  } else if (currentPath.endsWith("pin-reset-otp.html")) {
    const pinResetOtpForm = document.getElementById("pin-reset-otp-form")
    if (pinResetOtpForm) {
      pinResetOtpForm.addEventListener("submit", handlePinResetOtpVerification)
    }
  } else if (currentPath.endsWith("set-new-pin.html")) {
    const setNewPinForm = document.getElementById("set-new-pin-form")
    if (setNewPinForm) {
      setNewPinForm.addEventListener("submit", handleSetNewPin)
    }
  } else if (currentPath.endsWith("dashboard.html")) {
    fetchDashboardStats()
    fetchRedemptionRates()
    fetchRedemptionHistory()
    fetchActiveSurveys()
    fetchTransferHistory() // Call this to populate transfer history

    const transferPointsForm = document.getElementById("transfer-points-form")
    if (transferPointsForm) {
      transferPointsForm.addEventListener("submit", handleTransferPoints)
    }

    const redemptionRequestForm = document.getElementById("redemption-request-form")
    if (redemptionRequestForm) {
      redemptionRequestForm.addEventListener("submit", handleRedemptionRequest)
    }

    const logoutButton = document.getElementById("logout-button")
    if (logoutButton) {
      logoutButton.addEventListener("click", handleLogout)
    }
  }

  // Universal logout button listener (if present on other pages)
  const universalLogoutButton = document.getElementById("logout-button")
  if (universalLogoutButton && !currentPath.endsWith("dashboard.html")) {
    universalLogoutButton.addEventListener("click", handleLogout)
  }
})
