// dashboard.js

// Base API URL - IMPORTANT: Update this to your deployed backend API URL
// For local development, it might be http://localhost:8000/api
// For Render deployment, it will be your Render service URL + /api
const BASE_API_URL = "https://dansog-backend.onrender.com/api" // Placeholder, update this!

// --- Utility Functions (Self-contained for this dashboard) ---

/**
 * Displays a toast notification.
 * @param {string} message - The message to display.
 * @param {'success' | 'error' | 'info' | 'warning'} type - The type of toast.
 */
function showToast(message, type = "info") {
  const toastContainer = document.getElementById("toast-container")
  if (!toastContainer) return

  const toast = document.createElement("div")
  toast.className = `p-3 rounded-md shadow-md text-white ${type === "success" ? "bg-green-500" : type === "error" ? "bg-red-500" : "bg-gray-800"}`
  toast.textContent = message
  toast.style.opacity = "0"
  toast.style.transform = "translateY(20px)"
  toast.style.transition = "opacity 0.3s ease-out, transform 0.3s ease-out"

  toastContainer.appendChild(toast)

  setTimeout(() => {
    toast.style.opacity = "1"
    toast.style.transform = "translateY(0)"
  }, 10) // Small delay to trigger transition

  setTimeout(() => {
    toast.style.opacity = "0"
    toast.style.transform = "translateY(20px)"
    toast.addEventListener("transitionend", () => toast.remove())
  }, 5000) // Toast disappears after 5 seconds
}

/**
 * Displays a message within a specific DOM element.
 * @param {HTMLElement} element - The DOM element to display the message in.
 * @param {string} message - The message text.
 * @param {'success' | 'error' | 'info'} type - The type of message for styling.
 */
function displayMessage(element, message, type = "info") {
  if (!element) return
  element.textContent = message
  element.className = `message ${type}`
  element.style.display = "block"
}

/**
 * Clears authentication data from localStorage.
 */
function clearAuthData() {
  localStorage.removeItem("accessToken")
  localStorage.removeItem("currentUser")
}

/**
 * Gets the current user data from localStorage.
 * @returns {object | null} The current user object or null if not found.
 */
function getCurrentUser() {
  try {
    const user = localStorage.getItem("currentUser")
    return user ? JSON.parse(user) : null
  } catch (e) {
    console.error("Error parsing current user from localStorage:", e)
    return null
  }
}

/**
 * Gets the authentication token from localStorage.
 * @returns {string | null} The auth token or null if not found.
 */
function getAuthToken() {
  return localStorage.getItem("accessToken")
}

/**
 * Makes an authenticated API call.
 * @param {string} endpoint - The API endpoint (e.g., "/users/me").
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE).
 * @param {object | null} body - Request body for POST/PUT.
 * @param {boolean} authRequired - Whether the request needs an auth token.
 * @returns {Promise<object>} The JSON response from the API.
 */
async function apiCall(endpoint, method = "GET", data = null, authRequired = true) {
  const token = getAuthToken()
  const headers = {
    "Content-Type": "application/json",
  }

  if (authRequired && token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  const config = {
    method: method,
    headers: headers,
  }

  if (data) {
    config.body = JSON.stringify(data)
  }

  try {
    const response = await fetch(`${BASE_API_URL}${endpoint}`, config)
    const responseData = await response.json()

    if (!response.ok) {
      if (response.status === 401) {
        showToast("Session expired. Please log in again.", "error")
        // Redirect to login page after a short delay
        setTimeout(() => {
          window.location.href = "/index.html" // Assuming index.html is your login page
        }, 1500)
      }
      throw new Error(responseData.detail || "Something went wrong")
    }
    return responseData
  } catch (error) {
    console.error("API Call Error:", error)
    showToast(error.message, "error")
    throw error
  }
}

// --- Dashboard Specific Functions ---

// Function to update user points in the header
function updateHeaderPoints() {
  const currentUser = getCurrentUser()
  const userPointsSpan = document.getElementById("userPoints")
  if (userPointsSpan && currentUser) {
    userPointsSpan.textContent = `${currentUser.points_balance.toFixed(2)} SB`
  } else if (userPointsSpan) {
    userPointsSpan.textContent = "0.00 SB"
  }
}

// Handle Logout Button
function handleLogoutButton() {
  clearAuthData()
  showToast("Logged out successfully!", "success")
  setTimeout(() => {
    window.location.href = "/index.html" // Redirect to login page
  }, 1000)
}

// Function to fetch and display "More Ways to Earn" tasks
async function loadMoreWaysToEarnTasks() {
  // This section is currently static in dashboard.html.
  // If you want to fetch dynamic tasks, you would make an API call here.
  // Example:
  /*
    try {
        const tasks = await apiCall('/tasks'); // Assuming an endpoint for tasks
        const tasksContainer = document.getElementById('moreWaysToEarnTasksList');
        if (tasksContainer) {
            tasksContainer.innerHTML = tasks.map(task => `
                <div class="card p-4 flex items-center gap-3 bg-blue-50 border-blue-200">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check-circle-2 size-6 text-blue-600"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10Z"/><path d="m9 12 2 2 4-4"/></svg>
                    <div>
                        <h3 class="font-medium text-gray-800">${task.title}</h3>
                        <p class="text-sm text-blue-700">${task.points} SB</p>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error("Failed to load more ways to earn tasks:", error);
        showToast('Failed to load tasks.', 'error');
    }
    */
}

// Function to fetch and display special offers
async function loadSpecialOffers() {
  // Placeholder for API call to fetch special offers
  // Replace with actual API endpoint and data mapping
  const mockOffers = [
    {
      id: 1,
      title: "Earn 700 SB",
      description: "Binance",
      image: "/public/images/offer-binance.png", // This path assumes images are in a public/images folder relative to the root
      disclaimer: "Terms apply.",
    },
    {
      id: 2,
      title: "Earn 500 SB",
      description: "Coinbase",
      image: "/placeholder.svg?height=64&width=64&text=Coinbase", // Placeholder for demonstration
      disclaimer: "New users only.",
    },
  ]

  const offersContainer = document.getElementById("specialOffersList")
  if (offersContainer) {
    offersContainer.innerHTML = mockOffers
      .map(
        (offer) => `
            <div class="card p-4 flex items-center gap-4">
                <img src="${offer.image}" alt="${offer.description}" class="rounded-md object-cover size-16">
                <div class="flex-1">
                    <h3 class="font-semibold text-gray-800">${offer.title}</h3>
                    <p class="text-sm text-gray-600">${offer.description}</p>
                </div>
                <button class="text-gray-500 hover:text-gray-700 text-sm flex items-center">
                    Disclaimer <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down ml-1"><path d="m6 9 6 6 6-6"/></svg>
                </button>
            </div>
        `,
      )
      .join("")
  }

  const featuredOffersContainer = document.getElementById("featuredWaysToEarnList")
  if (featuredOffersContainer) {
    featuredOffersContainer.innerHTML = mockOffers
      .slice(0, 1)
      .map(
        (offer) => `
            <div class="card p-4 flex items-center gap-4">
                <img src="${offer.image}" alt="${offer.description}" class="rounded-md object-cover size-16">
                <div class="flex-1">
                    <h3 class="font-semibold text-gray-800">${offer.title}</h3>
                    <p class="text-sm text-gray-600">${offer.description}</p>
                </div>
                <button class="text-gray-500 hover:text-gray-700 text-sm flex items-center">
                    Disclaimer <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down ml-1"><path d="m6 9 6 6 6-6"/></svg>
                </button>
            </div>
        `,
      )
      .join("")
  }
}

// Function to fetch and display shop partners
async function loadShopPartners() {
  // Placeholder for API call to fetch shop partners
  // Replace with actual API endpoint and data mapping
  const mockPartners = [
    { id: 1, name: "Walmart", cashback: "1%", logo: "/public/images/logo-walmart.png" },
    { id: 2, name: "Best Buy", cashback: "Up to 4%", logo: "/public/images/logo-bestbuy.png" },
    { id: 3, name: "Expedia", cashback: "Up to 3%", logo: "/public/images/logo-expedia.png" },
    { id: 4, name: "eBay", cashback: "1%", logo: "/public/images/logo-ebay.png" },
    { id: 5, name: "Lowe's", cashback: "10%", logo: "/public/images/logo-lowes.png" },
    { id: 6, name: "Home Depot", cashback: "Up to 8%", logo: "/public/images/logo-homedepot.png" },
  ]

  const partnersContainer = document.getElementById("shopPartnersList")
  if (partnersContainer) {
    partnersContainer.innerHTML = mockPartners
      .map(
        (partner) => `
            <div class="card p-4 flex flex-col items-center text-center">
                <img src="${partner.logo}" alt="${partner.name} logo" class="rounded-full mb-2 object-contain size-16">
                <h3 class="font-medium text-gray-800">${partner.name}</h3>
                <p class="text-sm text-emerald-600 font-semibold">${partner.cashback} Cash Back</p>
            </div>
        `,
      )
      .join("")
  }
}

// Function to fetch and display games
async function loadGames() {
  // Placeholder for API call to fetch games
  // Replace with actual API endpoint and data mapping
  const mockGames = [
    {
      id: 1,
      title: "Rock N' Cash",
      points: "13,224",
      image: "/public/images/game-rock-n-cash.png",
      disclaimer: "Requires in-app purchases.",
    },
    {
      id: 2,
      title: "Tile Tap Master",
      points: "443",
      image: "/public/images/game-tile-tap-master.png",
      disclaimer: "Points awarded upon reaching levels.",
    },
    {
      id: 3,
      title: "Trump's Empire",
      points: "37",
      image: "/public/images/game-trumps-empire.png",
      disclaimer: "Limited time offer.",
    },
    {
      id: 4,
      title: "Double Number Merge",
      points: "460",
      image: "/public/images/game-double-number-merge.png",
      disclaimer: "Bonus points for challenges.",
    },
  ]

  const gamesContainer = document.getElementById("gamesList")
  if (gamesContainer) {
    gamesContainer.innerHTML = mockGames
      .map(
        (game) => `
            <div class="card p-4 flex items-center gap-4">
                <img src="${game.image}" alt="${game.title}" class="rounded-md object-cover size-20">
                <div class="flex-1">
                    <h3 class="font-semibold text-gray-800">${game.title}</h3>
                    <p class="text-sm text-emerald-600 font-semibold">Earn up to ${game.points} SB</p>
                </div>
                <button class="text-gray-500 hover:text-gray-700 text-sm flex items-center">
                    Disclaimer <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down ml-1"><path d="m6 9 6 6 6-6"/></svg>
                </button>
            </div>
        `,
      )
      .join("")
  }
}

// Function to fetch and display surveys
async function loadSurveys() {
  // This section is currently static with an empty state.
  // If you want to fetch dynamic surveys, you would make an API call here.
  // Example:
  /*
    try {
        const surveys = await apiCall('/surveys'); // Assuming an endpoint for surveys
        const surveysList = document.getElementById('surveysList');
        const surveysMessage = document.getElementById('surveys-section-message');
        if (surveys.length > 0) {
            surveysList.innerHTML = surveys.map(survey => `
                <div class="card p-4">
                    <h3 class="font-semibold text-gray-800">${survey.title}</h3>
                    <p class="text-sm text-gray-600">${survey.description}</p>
                    <p class="text-sm text-emerald-600 font-semibold">Earn ${survey.points} SB</p>
                    <button class="btn-primary mt-2">Start Survey</button>
                </div>
            `).join('');
            displayMessage(surveysMessage, 'New surveys available!', 'success');
        } else {
            surveysList.innerHTML = '<p class="empty-state">No more surveys available at the moment. Check back soon!</p>';
            displayMessage(surveysMessage, 'No surveys found.', 'info');
        }
    } catch (error) {
        console.error("Failed to load surveys:", error);
        showToast('Failed to load surveys.', 'error');
        const surveysList = document.getElementById('surveysList');
        const surveysMessage = document.getElementById('surveys-section-message');
        surveysList.innerHTML = '<p class="empty-state">Failed to load surveys. Please try again later.</p>';
        displayMessage(surveysMessage, 'Error loading surveys.', 'error');
    }
    */
}

// Function to handle point transfer
async function handleTransferPoints(event) {
  event.preventDefault()
  const form = event.target
  const recipientEmail = form.recipientEmail.value
  const transferAmount = Number.parseFloat(form.transferAmount.value)
  const messageDiv = document.getElementById("transfer-points-section-message")

  if (isNaN(transferAmount) || transferAmount <= 0) {
    showToast("Please enter a valid amount to transfer.", "error")
    return
  }

  try {
    const response = await apiCall("/transfer-points", "POST", {
      recipient_email: recipientEmail,
      amount: transferAmount,
    })
    showToast(response.message, "success")
    displayMessage(messageDiv, response.message, "success")
    form.reset()
    loadTransferHistory() // Reload history after successful transfer
    updateHeaderPoints() // Update points in header
  } catch (error) {
    displayMessage(messageDiv, error.message, "error")
  }
}

// Function to load transfer history
async function loadTransferHistory() {
  const historyTableBody = document.getElementById("transferHistoryTableBody")
  const emptyState = document.getElementById("transferHistoryEmptyState")
  if (!historyTableBody || !emptyState) return

  try {
    const history = await apiCall("/transfer-history") // Assuming this endpoint exists
    if (history && history.length > 0) {
      historyTableBody.innerHTML = history
        .map(
          (item) => `
                <tr>
                    <td>${new Date(item.timestamp).toLocaleString()}</td>
                    <td>${item.type}</td>
                    <td>${item.recipient_email || item.sender_email || "N/A"}</td>
                    <td>${item.amount} SB</td>
                </tr>
            `,
        )
        .join("")
      emptyState.style.display = "none"
    } else {
      historyTableBody.innerHTML = ""
      emptyState.style.display = "block"
    }
  } catch (error) {
    console.error("Failed to load transfer history:", error)
    showToast("Failed to load transfer history.", "error")
    historyTableBody.innerHTML = ""
    emptyState.style.display = "block"
    emptyState.textContent = "Error loading transfer history."
  }
}

// Function to handle redemption request
async function handleRedemptionRequest(event) {
  event.preventDefault()
  const form = event.target
  const redemptionType = form.redemptionType.value
  const pointsAmount = Number.parseFloat(form.pointsAmount.value)
  const walletAddress = form.walletAddress ? form.walletAddress.value : null
  const emailAddress = form.emailAddress ? form.emailAddress.value : null
  const messageDiv = document.getElementById("redeem-points-section-message")

  if (isNaN(pointsAmount) || pointsAmount <= 0) {
    showToast("Please enter a valid amount of points to redeem.", "error")
    return
  }

  const payload = {
    redemption_type: redemptionType,
    points: pointsAmount,
  }

  if (redemptionType === "bitcoin") {
    if (!walletAddress) {
      showToast("Please enter your Bitcoin wallet address.", "error")
      return
    }
    payload.wallet_address = walletAddress
  } else if (redemptionType === "gift_card") {
    if (!emailAddress) {
      showToast("Please enter the recipient email for the gift card.", "error")
      return
    }
    payload.recipient_email = emailAddress
  }

  try {
    const response = await apiCall("/redeem", "POST", payload)
    showToast(response.message, "success")
    displayMessage(messageDiv, response.message, "success")
    form.reset()
    loadRedemptionHistory() // Reload history
    updateHeaderPoints() // Update points in header
  } catch (error) {
    displayMessage(messageDiv, error.message, "error")
  }
}

// Function to load redemption history
async function loadRedemptionHistory() {
  const historyTableBody = document.getElementById("redemptionHistoryTableBody")
  const emptyState = document.getElementById("redemptionHistoryEmptyState")
  if (!historyTableBody || !emptyState) return

  try {
    const history = await apiCall("/redemption-history") // Assuming this endpoint exists
    if (history && history.length > 0) {
      historyTableBody.innerHTML = history
        .map(
          (item) => `
                <tr>
                    <td>${new Date(item.timestamp).toLocaleString()}</td>
                    <td>${item.redemption_type}</td>
                    <td>${item.points}</td>
                    <td>${item.equivalent_value}</td>
                    <td>${item.status}</td>
                </tr>
            `,
        )
        .join("")
      emptyState.style.display = "none"
    } else {
      historyTableBody.innerHTML = ""
      emptyState.style.display = "block"
    }
  } catch (error) {
    console.error("Failed to load redemption history:", error)
    showToast("Failed to load redemption history.", "error")
    historyTableBody.innerHTML = ""
    emptyState.style.display = "block"
    emptyState.textContent = "Error loading redemption history."
  }
}

// Function to load user profile
async function loadUserProfile() {
  const profileName = document.getElementById("profileName")
  const profileEmail = document.getElementById("profileEmail")
  const profileReferralCode = document.getElementById("profileReferralCode")

  const currentUser = getCurrentUser()

  if (currentUser) {
    profileName.textContent = currentUser.name || "N/A"
    profileEmail.textContent = currentUser.email || "N/A"
    profileReferralCode.textContent = currentUser.referral_code || "N/A"
  } else {
    // Fallback if currentUser is not in localStorage
    try {
      const userProfile = await apiCall("/profile") // Assuming a /profile endpoint
      localStorage.setItem("currentUser", JSON.stringify(userProfile)) // Update localStorage
      profileName.textContent = userProfile.name || "N/A"
      profileEmail.textContent = userProfile.email || "N/A"
      profileReferralCode.textContent = userProfile.referral_code || "N/A"
      updateHeaderPoints() // Update points in header
    } catch (error) {
      console.error("Failed to load user profile:", error)
      showToast("Failed to load profile data.", "error")
      profileName.textContent = "Error"
      profileEmail.textContent = "Error"
      profileReferralCode.textContent = "Error"
    }
  }
}

// Function to load activity log
async function loadActivityLog() {
  const activityLogTableBody = document.getElementById("activityLogTableBody")
  const emptyState = document.getElementById("activityLogEmptyState")
  if (!activityLogTableBody || !emptyState) return

  try {
    const activity = await apiCall("/activity-log") // Assuming this endpoint exists
    if (activity && activity.length > 0) {
      activityLogTableBody.innerHTML = activity
        .map(
          (item) => `
                <tr>
                    <td>${new Date(item.timestamp).toLocaleString()}</td>
                    <td>${item.action}</td>
                    <td>${item.details}</td>
                </tr>
            `,
        )
        .join("")
      emptyState.style.display = "none"
    } else {
      activityLogTableBody.innerHTML = ""
      emptyState.style.display = "block"
    }
  } catch (error) {
    console.error("Failed to load activity log:", error)
    showToast("Failed to load activity log.", "error")
    activityLogTableBody.innerHTML = ""
    emptyState.style.display = "block"
    emptyState.textContent = "Error loading activity log."
  }
}

// Function to populate footer sections (for static HTML)
function populateFooter() {
  const footerSectionsData = [
    {
      title: "Swagbucks",
      links: [
        { name: "About Us", href: "#" },
        { name: "How it Works", href: "#" },
        { name: "Blog", href: "#" },
        { name: "Press", href: "#" },
      ],
    },
    {
      title: "Rewards",
      links: [
        { name: "Gift Cards", href: "#" },
        { name: "PayPal Cash", href: "#" },
        { name: "Bitcoin", href: "#" },
      ],
    },
    {
      title: "Ways to Earn",
      links: [
        { name: "Surveys", href: "#" },
        { name: "Shopping", href: "#" },
        { name: "Games", href: "#" },
        { name: "Offers", href: "#" },
      ],
    },
    {
      title: "Information",
      links: [
        { name: "FAQ", href: "#" },
        { name: "Help Center", href: "#" },
        { name: "Privacy Policy", href: "#" },
        { name: "Terms of Use", href: "#" },
      ],
    },
    {
      title: "Legal",
      links: [
        { name: "Terms of Service", href: "#" },
        { name: "Privacy Policy", href: "#" },
        { name: "Cookie Policy", href: "#" },
      ],
    },
    {
      title: "Accessibility",
      links: [
        { name: "Accessibility Statement", href: "#" },
        { name: "Contact Accessibility", href: "#" },
      ],
    },
    {
      title: "Connect With Us",
      links: [
        {
          name: "Facebook",
          href: "#",
          icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-facebook"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>`,
        },
        {
          name: "Twitter",
          href: "#",
          icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-twitter"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17-19 11.6 1.1.8 3 1.2 5 1.2C18 20 22 15.9 22 10.5 22 9.4 22 4 22 4Z"/></svg>`,
        },
        {
          name: "Instagram",
          href: "#",
          icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-instagram"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>`,
        },
      ],
    },
  ]

  const footerAccordion = document.getElementById("footerAccordion")
  const footerGrid = document.getElementById("footerGrid")

  // Mobile/Tablet Accordion
  if (footerAccordion) {
    footerAccordion.innerHTML = footerSectionsData
      .map(
        (section, index) => `
            <div class="accordion-item">
                <button class="accordion-trigger" aria-expanded="false" aria-controls="accordion-content-${index}">
                    ${section.title}
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down"><path d="m6 9 6 6 6-6"/></svg>
                </button>
                <div id="accordion-content-${index}" class="accordion-content" hidden>
                    <ul class="space-y-2 text-gray-600">
                        ${section.links
                          .map(
                            (link) => `
                            <li>
                                <a href="${link.href}" class="flex items-center gap-2 hover:text-emerald-600">
                                    ${link.icon || ""}
                                    ${link.name}
                                </a>
                            </li>
                        `,
                          )
                          .join("")}
                    </ul>
                </div>
            </div>
        `,
      )
      .join("")

    // Add event listeners for accordion
    footerAccordion.querySelectorAll(".accordion-trigger").forEach((trigger) => {
      trigger.addEventListener("click", () => {
        const content = document.getElementById(trigger.getAttribute("aria-controls"))
        const isExpanded = trigger.getAttribute("aria-expanded") === "true"
        trigger.setAttribute("aria-expanded", !isExpanded)
        if (isExpanded) {
          content.setAttribute("hidden", "")
        } else {
          content.removeAttribute("hidden")
        }
      })
    })
  }

  // Desktop Grid
  if (footerGrid) {
    footerGrid.innerHTML = footerSectionsData
      .map(
        (section) => `
            <div>
                <h3 class="text-lg font-semibold text-gray-800 mb-4">${section.title}</h3>
                <ul class="space-y-2 text-gray-600">
                    ${section.links
                      .map(
                        (link) => `
                        <li>
                            <a href="${link.href}" class="flex items-center gap-2 hover:text-emerald-600">
                                ${link.icon || ""}
                                ${link.name}
                            </a>
                        </li>
                    `,
                      )
                      .join("")}
                </ul>
            </div>
        `,
      )
      .join("")
  }
}

// Event Listeners
document.addEventListener("DOMContentLoaded", () => {
  // Check if user is logged in, otherwise redirect to login
  const accessToken = localStorage.getItem("accessToken")
  if (!accessToken) {
    // Only redirect if not already on a login/signup page
    if (!window.location.pathname.includes("index.html") && !window.location.pathname.includes("signup.html")) {
      window.location.href = "/index.html"
      return // Stop further execution if redirecting
    }
  }

  // Initialize dashboard components if on dashboard.html
  if (window.location.pathname.includes("dashboard.html")) {
    updateHeaderPoints()
    loadMoreWaysToEarnTasks()
    loadSpecialOffers()
    loadShopPartners()
    loadGames()
    loadSurveys()
    loadTransferHistory()
    loadRedemptionHistory()
    loadUserProfile()
    populateFooter() // Populate footer for static HTML

    // Event listener for mobile menu button
    const mobileMenuButton = document.getElementById("mobileMenuButton")
    const sidebar = document.getElementById("sidebar")
    const sidebarOverlay = document.getElementById("sidebarOverlay")
    const closeSidebarButton = document.getElementById("closeSidebarButton")

    if (mobileMenuButton && sidebar && sidebarOverlay && closeSidebarButton) {
      mobileMenuButton.addEventListener("click", () => {
        document.body.classList.add("sidebar-open")
      })

      closeSidebarButton.addEventListener("click", () => {
        document.body.classList.remove("sidebar-open")
      })

      sidebarOverlay.addEventListener("click", () => {
        document.body.classList.remove("sidebar-open")
      })
    }

    // Event listener for transfer points form
    const transferPointsForm = document.getElementById("transferPointsForm")
    if (transferPointsForm) {
      transferPointsForm.addEventListener("submit", handleTransferPoints)
    }

    // Event listener for redemption request form
    const redemptionRequestForm = document.getElementById("redemptionRequestForm")
    if (redemptionRequestForm) {
      redemptionRequestForm.addEventListener("submit", handleRedemptionRequest)

      // Handle dynamic fields for redemption type
      const redemptionTypeSelect = document.getElementById("redemptionType")
      const walletAddressField = document.getElementById("walletAddressField")
      const emailAddressField = document.getElementById("emailAddressField")

      if (redemptionTypeSelect && walletAddressField && emailAddressField) {
        redemptionTypeSelect.addEventListener("change", (e) => {
          if (e.target.value === "bitcoin") {
            walletAddressField.style.display = "block"
            emailAddressField.style.display = "none"
          } else if (e.target.value === "gift_card") {
            walletAddressField.style.display = "none"
            emailAddressField.style.display = "block"
          }
        })
        // Set initial state
        redemptionTypeSelect.dispatchEvent(new Event("change"))
      }
    }

    // Sidebar navigation click handler to show/hide sections
    document.querySelectorAll("aside nav a.nav-link").forEach((link) => {
      link.addEventListener("click", function (e) {
        e.preventDefault() // Prevent default anchor behavior
        const targetId = this.getAttribute("href").substring(1) // Get section ID

        // Hide all sections
        document.querySelectorAll("main section").forEach((section) => {
          section.classList.add("hidden")
        })

        // Show the target section
        const targetSection = document.getElementById(targetId)
        if (targetSection) {
          targetSection.classList.remove("hidden")
        }

        // Update active class for sidebar links
        document.querySelectorAll("aside nav a.nav-link").forEach((navLink) => {
          navLink.classList.remove("active")
        })
        this.classList.add("active")

        // Close sidebar on mobile after clicking a link
        if (window.innerWidth < 768) {
          document.body.classList.remove("sidebar-open")
        }
      })
    })

    // Set initial active link based on URL hash or default to dashboard-overview
    const initialSectionId = window.location.hash ? window.location.hash.substring(1) : "dashboard-overview"
    const initialLink = document.querySelector(`aside nav a[href="#${initialSectionId}"]`)
    if (initialLink) {
      initialLink.click() // Simulate click to activate link and show section
    } else {
      // Fallback to dashboard-overview if hash is invalid or not present
      document.querySelector('aside nav a[href="#dashboard-overview"]').click()
    }
  }
})
