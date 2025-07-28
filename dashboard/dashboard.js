// Base API URL - IMPORTANT: Replace with your actual deployed backend API URL
const BASE_API_URL = "https://dansog-backend.onrender.com/api" // Replace with your actual API URL

// Utility function to show toast messages
function showToast(message, type = "info") {
  const toastContainer = document.getElementById("toast-container")
  if (!toastContainer) return

  const toast = document.createElement("div")
  toast.className = `toast ${type} flex items-center gap-3 p-4 rounded-md shadow-lg border`
  toast.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-info toast-icon">
            ${
              type === "success"
                ? '<path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10Z"/><path d="m9 12 2 2 4-4"/>'
                : type === "error"
                  ? '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>'
                  : '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>'
            }
        </svg>
        <span class="toast-message flex-1">${message}</span>
        <button class="toast-close-button p-1 rounded-full hover:bg-gray-100 text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
    `

  toastContainer.prepend(toast) // Add to top

  const closeButton = toast.querySelector(".toast-close-button")
  closeButton.addEventListener("click", () => toast.remove())

  setTimeout(() => {
    toast.remove()
  }, 5000) // Auto-remove after 5 seconds
}

// Generic API call function
async function apiCall(endpoint, method = "GET", data = null, requiresAuth = true) {
  const url = `${BASE_API_URL}${endpoint}`
  const headers = {
    "Content-Type": "application/json",
  }

  if (requiresAuth) {
    const accessToken = sessionStorage.getItem("accessToken")
    if (!accessToken) {
      showToast("Authentication required. Please log in.", "error")
      window.location.href = "/index.html" // Redirect to login page
      return null
    }
    headers["Authorization"] = `Bearer ${accessToken}`
  }

  const options = {
    method,
    headers,
  }

  if (data) {
    options.body = JSON.stringify(data)
  }

  try {
    const response = await fetch(url, options)
    const responseData = await response.json()

    if (!response.ok) {
      const errorMessage = responseData.detail || responseData.message || "An error occurred."
      showToast(`Error: ${errorMessage}`, "error")
      return null
    }
    return responseData
  } catch (error) {
    console.error("API call failed:", error)
    showToast("Network error or server is unreachable.", "error")
    return null
  }
}

// --- Authentication and User Data ---
async function loadUserData() {
  const currentUser = JSON.parse(sessionStorage.getItem("currentUser"))
  const accessToken = sessionStorage.getItem("accessToken")

  if (!currentUser || !accessToken) {
    showToast("You are not logged in. Redirecting to login...", "info")
    setTimeout(() => {
      window.location.href = "/index.html" // Redirect to your login page
    }, 1500)
    return
  }

  document.getElementById("userName").textContent = currentUser.username || "User"
  document.getElementById("profileName").textContent = currentUser.username || "N/A"
  document.getElementById("profileEmail").textContent = currentUser.email || "N/A"
  document.getElementById("profileReferralCode").textContent = currentUser.referral_code || "N/A"

  // Fetch user points and dashboard stats
  const dashboardStats = await apiCall("/users/me/dashboard")
  if (dashboardStats) {
    document.getElementById("pointsBalance").textContent = `${dashboardStats.current_points.toFixed(2)} Points`
    document.getElementById("completedSurveys").textContent = `${dashboardStats.completed_surveys} Surveys`
    document.getElementById("totalEarned").textContent = `${dashboardStats.total_earned_points.toFixed(2)} Points`
    document.getElementById("pendingRedemptions").textContent = `${dashboardStats.pending_redemptions} Requests`
  }
}

function handleLogout() {
  sessionStorage.removeItem("accessToken")
  sessionStorage.removeItem("currentUser")
  showToast("Logged out successfully!", "success")
  setTimeout(() => {
    window.location.href = "/index.html" // Redirect to your login page
  }, 1000)
}

// --- Navigation and Section Management ---
function showSection(sectionId) {
  document.querySelectorAll("main section").forEach((section) => {
    section.style.display = "none"
  })
  document.getElementById(sectionId).style.display = "block"

  document.querySelectorAll(".nav-link").forEach((link) => {
    link.classList.remove("active")
  })
  document.querySelector(`.nav-link[href="#${sectionId}"]`).classList.add("active")

  // Close sidebar on mobile after navigation
  if (window.innerWidth < 768) {
    document.getElementById("sidebar").classList.remove("open")
  }
}

// --- Dashboard Overview Section ---
// Placeholder for dynamic content in "More Ways to Earn"
function loadMoreWaysToEarn() {
  const tasks = [
    { title: "Complete a Survey", points: 50, icon: "check-circle-2", color: "blue" },
    { title: "Discover an Offer", points: 100, icon: "check-circle-2", color: "blue" },
    { title: "Watch a Video", points: 10, icon: "check-circle-2", color: "blue" },
    { title: "Play a Game", points: 20, icon: "check-circle-2", color: "blue" },
  ]
  const container = document.getElementById("moreWaysToEarnTasksList")
  if (!container) return
  container.innerHTML = tasks
    .map(
      (task) => `
        <div class="card p-4 flex items-center gap-3 bg-${task.color}-50 border-${task.color}-200">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-${task.icon} size-6 text-${task.color}-600">
                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10Z" />
                <path d="m9 12 2 2 4-4" />
            </svg>
            <div>
                <h3 class="font-medium text-gray-800">${task.title}</h3>
                <p class="text-sm text-${task.color}-700">${task.points} Points</p>
            </div>
        </div>
    `,
    )
    .join("")
}

// Placeholder for "Discover Special Offers and Earn"
async function loadSpecialOffers() {
  // TODO: Replace with actual API call to fetch offers
  // const offers = await apiCall('/offers');
  const offers = [
    {
      id: 1,
      title: "Binance Signup Bonus",
      description: "Earn 500 Points for signing up and trading on Binance.",
      image: "/public/images/offer-binance.png",
    },
    {
      id: 2,
      title: "Coinbase Earn",
      description: "Complete crypto lessons and earn 300 Points.",
      image: "/placeholder.svg?height=64&width=64",
    },
    {
      id: 3,
      title: "Survey Junkie",
      description: "Take surveys and earn up to 100 Points per survey.",
      image: "/placeholder.svg?height=64&width=64",
    },
  ]
  const container = document.getElementById("specialOffersList")
  if (!container) return
  container.innerHTML = offers
    .map(
      (offer) => `
        <div class="card p-4 flex items-center gap-4">
            <img src="${offer.image}" alt="${offer.title}" class="size-16 rounded-md object-cover border border-gray-200" />
            <div>
                <h4 class="font-semibold text-gray-800">${offer.title}</h4>
                <p class="text-sm text-gray-600">${offer.description}</p>
            </div>
        </div>
    `,
    )
    .join("")
}

// Placeholder for "Shop and Earn"
async function loadShopPartners() {
  // TODO: Replace with actual API call to fetch shop partners
  // const partners = await apiCall('/shop-partners');
  const partners = [
    { id: 1, name: "Amazon", logo: "/placeholder.svg?height=48&width=48" },
    { id: 2, name: "Walmart", logo: "/placeholder.svg?height=48&width=48" },
    { id: 3, name: "Target", logo: "/placeholder.svg?height=48&width=48" },
    { id: 4, name: "eBay", logo: "/placeholder.svg?height=48&width=48" },
    { id: 5, name: "Best Buy", logo: "/placeholder.svg?height=48&width=48" },
    { id: 6, name: "Nike", logo: "/placeholder.svg?height=48&width=48" },
  ]
  const container = document.getElementById("shopPartnersList")
  if (!container) return
  container.innerHTML = partners
    .map(
      (partner) => `
        <div class="flex flex-col items-center justify-center p-3 border border-gray-200 rounded-md shadow-sm bg-white hover:bg-gray-50 transition-colors duration-200">
            <img src="${partner.logo}" alt="${partner.name} Logo" class="size-12 object-contain mb-2" />
            <span class="text-sm font-medium text-gray-700">${partner.name}</span>
        </div>
    `,
    )
    .join("")
}

// Placeholder for "Play Games and Earn"
async function loadGames() {
  // TODO: Replace with actual API call to fetch games
  // const games = await apiCall('/games');
  const games = [
    {
      id: 1,
      title: "Puzzle Quest",
      description: "Solve puzzles and earn points.",
      points: "Up to 500 Points",
      image: "/placeholder.svg?height=64&width=64",
    },
    {
      id: 2,
      title: "Word Scramble",
      description: "Unscramble words for rewards.",
      points: "Up to 300 Points",
      image: "/placeholder.svg?height=64&width=64",
    },
    {
      id: 3,
      title: "Memory Match",
      description: "Test your memory, earn points.",
      points: "Up to 200 Points",
      image: "/placeholder.svg?height=64&width=64",
    },
  ]
  const container = document.getElementById("gamesList")
  if (!container) return
  container.innerHTML = games
    .map(
      (game) => `
        <div class="card p-4 flex items-center gap-4">
            <img src="${game.image}" alt="${game.title}" class="size-16 rounded-md object-cover border border-gray-200" />
            <div>
                <h4 class="font-semibold text-gray-800">${game.title}</h4>
                <p class="text-sm text-gray-600">${game.description}</p>
                <p class="text-sm text-emerald-600 font-medium">${game.points}</p>
            </div>
        </div>
    `,
    )
    .join("")
}

// --- Surveys Section ---
async function loadSurveys() {
  const surveysList = document.getElementById("surveysList")
  const messageElement = document.getElementById("surveys-section-message")
  surveysList.innerHTML = "" // Clear previous content
  messageElement.style.display = "none"

  const surveys = await apiCall("/surveys") // Assuming /surveys endpoint returns available surveys
  if (surveys && surveys.length > 0) {
    surveys.forEach((survey) => {
      const surveyCard = document.createElement("div")
      surveyCard.className = "card p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      surveyCard.innerHTML = `
                <div>
                    <h3 class="font-semibold text-gray-800">${survey.title}</h3>
                    <p class="text-sm text-gray-600">${survey.description}</p>
                    <p class="text-sm text-emerald-600 font-medium">${survey.points} Points</p>
                </div>
                <button class="btn-primary btn-sm" data-survey-id="${survey.id}">Start Survey</button>
            `
      surveysList.appendChild(surveyCard)
    })

    // Add event listeners to survey buttons
    surveysList.querySelectorAll("button[data-survey-id]").forEach((button) => {
      button.addEventListener("click", async (event) => {
        const surveyId = event.target.dataset.surveyId
        showToast(`Starting survey ${surveyId}...`, "info")
        // TODO: Implement actual survey start logic, e.g., redirect to survey URL
        // const startSurveyResponse = await apiCall(`/surveys/${surveyId}/start`, 'POST');
        // if (startSurveyResponse) {
        //     showToast('Survey started!', 'success');
        //     window.open(startSurveyResponse.survey_url, '_blank'); // Open survey in new tab
        // }
      })
    })
  } else {
    surveysList.innerHTML = '<p class="empty-state">No more surveys available at the moment. Check back soon!</p>'
  }
}

// --- Transfer Points Section ---
async function loadTransferHistory() {
  const transferHistoryTableBody = document.getElementById("transferHistoryTableBody")
  const transferHistoryEmptyState = document.getElementById("transferHistoryEmptyState")
  transferHistoryTableBody.innerHTML = "" // Clear previous content
  transferHistoryEmptyState.style.display = "none"

  const history = await apiCall("/transactions/transfers") // Assuming /transactions/transfers endpoint
  if (history && history.length > 0) {
    history.forEach((record) => {
      const row = transferHistoryTableBody.insertRow()
      row.innerHTML = `
                <td>${new Date(record.timestamp).toLocaleString()}</td>
                <td>${record.type === "sent" ? "Sent" : "Received"}</td>
                <td>${record.type === "sent" ? record.recipient_email : record.sender_email}</td>
                <td>${record.type === "sent" ? "-" : "+"}${record.amount.toFixed(2)} Points</td>
            `
    })
  } else {
    transferHistoryEmptyState.style.display = "block"
  }
}

async function handleTransferPoints(event) {
  event.preventDefault()
  const form = event.target
  const recipientEmail = form.recipientEmail.value
  const transferAmount = Number.parseFloat(form.transferAmount.value)
  const messageElement = document.getElementById("transfer-points-section-message")
  messageElement.style.display = "none"

  if (isNaN(transferAmount) || transferAmount <= 0) {
    messageElement.className = "message error mt-4"
    messageElement.textContent = "Please enter a valid amount to transfer."
    messageElement.style.display = "block"
    return
  }

  const response = await apiCall("/transactions/transfer", "POST", {
    recipient_email: recipientEmail,
    amount: transferAmount,
  })

  if (response) {
    showToast("Points transferred successfully!", "success")
    form.reset()
    loadUserData() // Refresh points balance
    loadTransferHistory() // Refresh history
  } else {
    messageElement.className = "message error mt-4"
    messageElement.textContent = response?.detail || "Failed to transfer points."
    messageElement.style.display = "block"
  }
}

// --- Redeem Points Section ---
async function loadRedemptionRates() {
  // TODO: Fetch actual rates from API if available, otherwise use defaults
  // const rates = await apiCall('/redemption/rates');
  const bitcoinRate = 0.00001 // Example rate
  const giftCardRate = 0.01 // Example rate

  document.getElementById("bitcoinRate").textContent = `1 Point = ${bitcoinRate} BTC`
  document.getElementById("giftCardRate").textContent =
    `1 Point = $${giftCardRate.toFixed(2)} USD (Gift Card Equivalent)`
}

async function loadRedemptionHistory() {
  const redemptionHistoryTableBody = document.getElementById("redemptionHistoryTableBody")
  const redemptionHistoryEmptyState = document.getElementById("redemptionHistoryEmptyState")
  redemptionHistoryTableBody.innerHTML = "" // Clear previous content
  redemptionHistoryEmptyState.style.display = "none"

  const history = await apiCall("/redemption/history") // Assuming /redemption/history endpoint
  if (history && history.length > 0) {
    history.forEach((record) => {
      const row = redemptionHistoryTableBody.insertRow()
      row.innerHTML = `
                <td>${new Date(record.timestamp).toLocaleString()}</td>
                <td>${record.type === "bitcoin" ? "Bitcoin" : "Gift Card"}</td>
                <td>${record.points.toFixed(2)}</td>
                <td>${record.equivalent_value.toFixed(2)} ${record.type === "bitcoin" ? "BTC" : "USD"}</td>
                <td><span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${record.status === "completed" ? "bg-green-100 text-green-800" : record.status === "pending" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}">${record.status}</span></td>
            `
    })
  } else {
    redemptionHistoryEmptyState.style.display = "block"
  }
}

async function handleRedemptionRequest(event) {
  event.preventDefault()
  const form = event.target
  const redemptionType = form.redemptionType.value
  const pointsAmount = Number.parseFloat(form.pointsAmount.value)
  const walletAddress = form.walletAddress.value
  const emailAddress = form.emailAddress.value
  const messageElement = document.getElementById("redeem-points-section-message")
  messageElement.style.display = "none"

  if (isNaN(pointsAmount) || pointsAmount <= 0) {
    messageElement.className = "message error mt-4"
    messageElement.textContent = "Please enter a valid amount of points to redeem."
    messageElement.style.display = "block"
    return
  }

  const payload = {
    type: redemptionType,
    points: pointsAmount,
  }

  if (redemptionType === "bitcoin") {
    if (!walletAddress) {
      messageElement.className = "message error mt-4"
      messageElement.textContent = "Bitcoin wallet address is required."
      messageElement.style.display = "block"
      return
    }
    payload.wallet_address = walletAddress
  } else if (redemptionType === "gift_card") {
    if (!emailAddress) {
      messageElement.className = "message error mt-4"
      messageElement.textContent = "Recipient email for gift card is required."
      messageElement.style.display = "block"
      return
    }
    payload.recipient_email = emailAddress
  }

  const response = await apiCall("/redemption/request", "POST", payload) // Assuming /redemption/request endpoint

  if (response) {
    showToast("Redemption request submitted successfully!", "success")
    form.reset()
    loadUserData() // Refresh points balance
    loadRedemptionHistory() // Refresh history
  } else {
    messageElement.className = "message error mt-4"
    messageElement.textContent = response?.detail || "Failed to submit redemption request."
    messageElement.style.display = "block"
  }
}

// Toggle visibility of wallet address/email address fields based on redemption type
function toggleRedemptionFields() {
  const redemptionType = document.getElementById("redemptionType").value
  document.getElementById("walletAddressField").style.display = redemptionType === "bitcoin" ? "block" : "none"
  document.getElementById("emailAddressField").style.display = redemptionType === "gift_card" ? "block" : "none"
}

// --- Profile & Settings Section ---
async function loadActivityLog() {
  const activityLogTableBody = document.getElementById("activityLogTableBody")
  const activityLogEmptyState = document.getElementById("activityLogEmptyState")
  activityLogTableBody.innerHTML = "" // Clear previous content
  activityLogEmptyState.style.display = "none"

  const log = await apiCall("/users/me/activity-log") // Assuming /users/me/activity-log endpoint
  if (log && log.length > 0) {
    log.forEach((record) => {
      const row = activityLogTableBody.insertRow()
      row.innerHTML = `
                <td>${new Date(record.timestamp).toLocaleString()}</td>
                <td>${record.action}</td>
                <td>${record.details}</td>
            `
    })
  } else {
    activityLogEmptyState.style.display = "block"
  }
}

// --- Event Listeners and Initialization ---
document.addEventListener("DOMContentLoaded", () => {
  // Initialize Lucide icons
  const lucide = window.lucide // Declare the variable before using it
  if (lucide) {
    lucide.createIcons()
  }

  loadUserData()
  loadMoreWaysToEarn()
  loadSpecialOffers()
  loadShopPartners()
  loadGames()
  loadSurveys()
  loadTransferHistory()
  loadRedemptionRates()
  loadRedemptionHistory()
  loadActivityLog()

  // Mobile menu toggle
  const mobileMenuButton = document.getElementById("mobileMenuButton")
  const sidebar = document.getElementById("sidebar")
  if (mobileMenuButton && sidebar) {
    mobileMenuButton.addEventListener("click", () => {
      sidebar.classList.toggle("open")
    })
  }

  // Navigation links
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault()
      const sectionId = link.getAttribute("href").substring(1)
      showSection(sectionId)
    })
  })

  // Set initial section to dashboard overview
  showSection("dashboard-overview")

  // Transfer Points Form submission
  const transferPointsForm = document.getElementById("transferPointsForm")
  if (transferPointsForm) {
    transferPointsForm.addEventListener("submit", handleTransferPoints)
  }

  // Redemption Request Form submission
  const redemptionRequestForm = document.getElementById("redemptionRequestForm")
  if (redemptionRequestForm) {
    redemptionRequestForm.addEventListener("submit", handleRedemptionRequest)
    document.getElementById("redemptionType").addEventListener("change", toggleRedemptionFields)
    toggleRedemptionFields() // Set initial state
  }

  // Logout button
  const logoutButton = document.getElementById("logoutButton")
  if (logoutButton) {
    logoutButton.addEventListener("click", handleLogout)
  }

  // Reset PIN and Change Password buttons (redirects to external pages)
  const resetPinButton = document.getElementById("resetPinButton")
  if (resetPinButton) {
    resetPinButton.addEventListener("click", () => {
      window.location.href = "../pin-reset.html" // Adjust path as needed
    })
  }

  const changePasswordButton = document.getElementById("changePasswordButton")
  if (changePasswordButton) {
    changePasswordButton.addEventListener("click", () => {
      window.location.href = "../forgot-password.html" // Adjust path as needed
    })
  }
})
