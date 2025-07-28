// dashboard.js

// Ensure app.js is loaded first for apiCall, getAuthToken, etc.
// This script assumes app.js is loaded before it.

// --- Configuration ---
const BASE_API_URL = "https://dansog-backend.onrender.com/api" // Your backend API URL

// Declare variables before using them
const getCurrentUser = window.getCurrentUser
const apiCall = window.apiCall
const showToast = window.showToast
const displayMessage = window.displayMessage
const clearAuthData = window.clearAuthData

// --- Utility Functions (Self-contained for this dashboard) ---

/**
 * Displays a toast notification.
 * @param {string} message - The message to display.
 * @param {'success' | 'error' | 'info' | 'warning'} type - The type of toast.
 */
// function showToast(message, type = 'info') {
//     const toastContainer = document.getElementById('toast-container');
//     if (!toastContainer) return;

//     const toast = document.createElement('div');
//     toast.className = `p-3 rounded-md shadow-lg text-sm font-medium flex items-center gap-2`;

//     let bgColor, textColor, iconSvg;
//     switch (type) {
//         case 'success':
//             bgColor = 'bg-green-500';
//             textColor = 'text-white';
//             iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check-circle"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
//             break;
//         case 'error':
//             bgColor = 'bg-red-500';
//             textColor = 'text-white';
//             iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x-circle"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>`;
//             break;
//         case 'warning':
//             bgColor = 'bg-yellow-500';
//             textColor = 'text-white';
//             iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-alert-triangle"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`;
//             break;
//         default: // info
//             bgColor = 'bg-blue-500';
//             textColor = 'text-white';
//             iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-info"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`;
//             break;
//     }

//     toast.classList.add(bgColor, textColor);
//     toast.innerHTML = `${iconSvg}<span>${message}</span>`;
//     toastContainer.appendChild(toast);

//     setTimeout(() => {
//         toast.remove();
//     }, 5000); // Toast disappears after 5 seconds
// }

/**
 * Displays a message within a specific DOM element.
 * @param {HTMLElement} element - The DOM element to display the message in.
 * @param {string} message - The message text.
 * @param {'success' | 'error' | 'info'} type - The type of message for styling.
 */
// function displayMessage(element, message, type = 'info') {
//     if (!element) return;
//     element.textContent = message;
//     element.className = `message ${type}`;
//     element.style.display = 'block';
// }

/**
 * Clears authentication data from localStorage.
 */
// function clearAuthData() {
//     localStorage.removeItem('authToken');
//     localStorage.removeItem('currentUser');
// }

/**
 * Gets the current user data from localStorage.
 * @returns {object | null} The current user object or null if not found.
 */
// function getCurrentUser() {
//     try {
//         const user = localStorage.getItem('currentUser');
//         return user ? JSON.parse(user) : null;
//     } catch (e) {
//         console.error("Error parsing current user from localStorage:", e);
//         return null;
//     }
// }

/**
 * Gets the authentication token from localStorage.
 * @returns {string | null} The auth token or null if not found.
 */
const getAuthToken = window.getAuthToken

/**
 * Makes an authenticated API call.
 * @param {string} endpoint - The API endpoint (e.g., "/users/me").
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE).
 * @param {object | null} body - Request body for POST/PUT.
 * @param {boolean} requiresAuth - Whether the request needs an auth token.
 * @returns {Promise<object>} The JSON response from the API.
 */
const apiCall = window.apiCall

document.addEventListener("DOMContentLoaded", async () => {
  const currentUser = getCurrentUser()
  if (!currentUser) {
    // If no user is logged in, redirect to login page
    window.location.href = "../index.html" // Adjusted path
    return
  }

  // --- DOM Elements ---
  const userPointsElement = document.getElementById("userPoints")
  const mobileMenuButton = document.getElementById("mobileMenuButton")
  const sidebar = document.getElementById("sidebar")
  const sidebarOverlay = document.getElementById("sidebarOverlay")
  const closeSidebarButton = document.getElementById("closeSidebarButton")

  // Main content sections (placeholders for now)
  const specialOffersList = document.getElementById("specialOffersList")
  const featuredWaysToEarnList = document.getElementById("featuredWaysToEarnList")
  const shopPartnersList = document.getElementById("shopPartnersList")
  const gamesList = document.getElementById("gamesList")
  const surveysList = document.getElementById("surveysList")
  const surveysSectionMessage = document.getElementById("surveys-section-message")

  // Transfer Points elements
  const transferPointsForm = document.getElementById("transferPointsForm")
  const transferPointsSectionMessage = document.getElementById("transfer-points-section-message")
  const transferHistoryTableBody = document.getElementById("transferHistoryTableBody")
  const transferHistoryEmptyState = document.getElementById("transferHistoryEmptyState")

  // Redeem Points elements
  const redemptionRequestForm = document.getElementById("redemptionRequestForm")
  const redemptionTypeSelect = document.getElementById("redemptionType")
  const walletAddressField = document.getElementById("walletAddressField")
  const emailAddressField = document.getElementById("emailAddressField")
  const redeemPointsSectionMessage = document.getElementById("redeem-points-section-message")
  const redemptionHistoryTableBody = document.getElementById("redemptionHistoryTableBody")
  const redemptionHistoryEmptyState = document.getElementById("redemptionHistoryEmptyState")
  const bitcoinRateSpan = document.getElementById("bitcoinRate")
  const giftCardRateSpan = document.getElementById("giftCardRate")

  // Profile & Settings elements
  const profileNameSpan = document.getElementById("profileName")
  const profileEmailSpan = document.getElementById("profileEmail")
  const profileReferralCodeSpan = document.getElementById("profileReferralCode")
  const activityLogTableBody = document.getElementById("activityLogTableBody")
  const activityLogEmptyState = document.getElementById("activityLogEmptyState")

  // Sidebar navigation buttons
  const logoutButton = document.getElementById("logoutButton")
  const resetPinButton = document.getElementById("resetPinButton")
  const changePasswordButton = document.getElementById("changePasswordButton")

  // Footer elements
  const footerAccordion = document.getElementById("footerAccordion")
  const footerGrid = document.getElementById("footerGrid")

  // --- Initial UI Setup ---
  if (userPointsElement) userPointsElement.textContent = `${currentUser.points_balance.toFixed(2)} SB`

  // --- Event Listeners ---
  if (logoutButton) {
    logoutButton.addEventListener("click", handleLogoutButton)
  }
  if (mobileMenuButton) {
    mobileMenuButton.addEventListener("click", toggleSidebar)
  }
  if (closeSidebarButton) {
    closeSidebarButton.addEventListener("click", toggleSidebar)
  }
  if (sidebarOverlay) {
    sidebarOverlay.addEventListener("click", toggleSidebar) // Close sidebar when clicking overlay
  }
  if (resetPinButton) {
    resetPinButton.addEventListener("click", () => {
      window.location.href = "../pin-reset.html" // Adjusted path
    })
  }
  if (changePasswordButton) {
    changePasswordButton.addEventListener("click", () => {
      window.location.href = "../forgot-password.html" // Adjusted path
    })
  }

  // Transfer Points Form Submission
  if (transferPointsForm) {
    transferPointsForm.addEventListener("submit", handleTransferPoints)
  }

  // Redemption Form Type Change
  if (redemptionTypeSelect) {
    redemptionTypeSelect.addEventListener("change", (event) => {
      if (event.target.value === "bitcoin") {
        walletAddressField.style.display = "block"
        emailAddressField.style.display = "none"
      } else {
        walletAddressField.style.display = "none"
        emailAddressField.style.display = "block"
      }
    })
  }

  // Redemption Form Submission
  if (redemptionRequestForm) {
    redemptionRequestForm.addEventListener("submit", handleRedemptionRequest)
  }

  // --- Sidebar Toggle Functionality ---
  function toggleSidebar() {
    document.body.classList.toggle("sidebar-open")
    sidebarOverlay.classList.toggle("hidden")
  }

  // Close sidebar on navigation link click (mobile)
  document.querySelectorAll("aside nav a.nav-link, aside nav button.nav-link").forEach((element) => {
    element.addEventListener("click", function (e) {
      // Only prevent default for anchor tags that scroll to a section
      if (this.tagName === "A" && this.getAttribute("href").startsWith("#")) {
        e.preventDefault()
        const targetId = this.getAttribute("href").substring(1) // Remove '#'
        document.getElementById(targetId).scrollIntoView({
          behavior: "smooth",
        })
      }

      // Update active class for all nav links
      document
        .querySelectorAll("aside nav a.nav-link, aside nav button.nav-link")
        .forEach((link) => link.classList.remove("active"))
      this.classList.add("active") // Apply active class to the clicked link/button

      // Close sidebar on mobile after clicking a link/button
      if (window.innerWidth < 768) {
        toggleSidebar()
      }
    })
  })

  // Set initial active link based on URL hash or default
  const initialSection = window.location.hash || "#dashboard-overview"
  const initialLink = document.querySelector(`aside nav a[href="${initialSection}"]`)
  if (initialLink) {
    initialLink.classList.add("active")
  }

  // --- Data for dynamic content (replace with API calls) ---
  const mockSpecialOffers = [
    {
      id: "offer1",
      title: "Earn 700 SB",
      description: "Offer Partner A",
      image: "/placeholder.svg?height=64&width=64",
      disclaimer: "Terms apply. Limited time.",
    },
    {
      id: "offer2",
      title: "Earn 500 SB",
      description: "Offer Partner B",
      image: "/placeholder.svg?height=64&width=64",
      disclaimer: "New user bonus.",
    },
  ]

  const mockShopPartners = [
    { id: "shop1", name: "Retailer One", cashback: "1%", logo: "/placeholder.svg?height=64&width=64" },
    { id: "shop2", name: "Retailer Two", cashback: "Up to 4%", logo: "/placeholder.svg?height=64&width=64" },
    { id: "shop3", name: "Retailer Three", cashback: "Up to 3%", logo: "/placeholder.svg?height=64&width=64" },
    { id: "shop4", name: "Retailer Four", cashback: "1%", logo: "/placeholder.svg?height=64&width=64" },
  ]

  const mockGames = [
    {
      id: "game1",
      title: "Fun Game Title",
      points: "13,224",
      image: "/placeholder.svg?height=80&width=80",
      disclaimer: "Requires in-app purchases to reach maximum earnings.",
    },
    {
      id: "game2",
      title: "Puzzle Master",
      points: "443",
      image: "/placeholder.svg?height=80&width=80",
      disclaimer: "Points awarded upon reaching specific game levels.",
    },
    {
      id: "game3",
      title: "Adventure Quest",
      points: "37",
      image: "/placeholder.svg?height=80&width=80",
      disclaimer: "Limited time offer. See game details for more info.",
    },
  ]

  // Mock data for initial display. Replace with actual API calls.
  const mockSurveys = [
    { id: "survey1", title: "Daily Opinion Survey", points: "50 SB", duration: "5 min", provider: "Survey Provider X" },
    { id: "survey2", title: "Product Feedback", points: "150 SB", duration: "15 min", provider: "Survey Provider Y" },
    { id: "survey3", title: "Lifestyle Habits", points: "100 SB", duration: "10 min", provider: "Survey Provider Z" },
  ]

  const mockTransferHistory = [
    { date: "2025-07-20", type: "Sent", recipientSender: "user@example.com", amount: "100 SB" },
    { date: "2025-07-15", type: "Received", recipientSender: "friend@example.com", amount: "50 SB" },
  ]

  const mockRedemptionHistory = [
    { date: "2025-07-22", type: "Bitcoin", points: "1000 SB", equivalentValue: "0.00001 BTC", status: "Pending" },
    { date: "2025-07-18", type: "Gift Card", points: "500 SB", equivalentValue: "$5.00 USD", status: "Completed" },
  ]

  const mockActivityLog = [
    { dateTime: "2025-07-25 10:30 AM", action: "Completed Survey", details: "Daily Opinion Survey (+50 SB)" },
    { dateTime: "2025-07-24 03:15 PM", action: "Redemption Request", details: "Bitcoin (1000 SB)" },
    { dateTime: "2025-07-23 09:00 AM", action: "Logged In", details: "Via Web Browser" },
  ]

  const footerSectionsData = [
    {
      title: "Reward System",
      links: [
        { name: "About Us", href: "#" },
        { name: "How it Works", href: "#" },
        { name: "Blog", href: "#" },
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
        { name: "Facebook", href: "#", icon: "facebook" },
        { name: "Twitter", href: "#", icon: "twitter" },
        { name: "Instagram", href: "#", icon: "instagram" },
      ],
    },
  ]

  // --- Dynamic Content Loading Functions (API Integration Points) ---

  async function loadDashboardStats() {
    try {
      // TODO: Replace with actual API call to /users/me or /dashboard/stats
      // const stats = await apiCall("/dashboard/stats", "GET", null, true);
      // userPointsElement.textContent = `${stats.points_balance.toFixed(2)} SB`;
      // profileNameSpan.textContent = currentUser.name || "N/A";
      // profileEmailSpan.textContent = currentUser.email || "N/A";
      // profileReferralCodeSpan.textContent = currentUser.referral_code || "N/A";

      // Using mock data for now
      userPointsElement.textContent = `${currentUser.points_balance.toFixed(2)} SB`
      profileNameSpan.textContent = currentUser.name || "John Doe"
      profileEmailSpan.textContent = currentUser.email || "john.doe@example.com"
      profileReferralCodeSpan.textContent = currentUser.referral_code || "ABC123XYZ"
    } catch (error) {
      console.error("Failed to load dashboard stats:", error)
      window.showToast("Failed to load dashboard data.", "error")
    }
  }

  async function loadSpecialOffers() {
    // This is where you would make an API call to fetch special offers
    // Example: const offers = await apiCall("/offers/special", "GET", null, true);
    // For now, using mock data:
    const offers = mockSpecialOffers

    if (specialOffersList) {
      specialOffersList.innerHTML = ""
      offers.forEach((offer) => {
        const offerHtml = `
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
        `
        specialOffersList.insertAdjacentHTML("beforeend", offerHtml)
      })
    }
  }

  async function loadFeaturedWaysToEarn() {
    // This is where you would make an API call to fetch featured offers
    // Example: const featuredOffers = await apiCall("/offers/featured", "GET", null, true);
    // For now, using mock data (reusing special offers for simplicity):
    const featuredOffers = mockSpecialOffers.slice(0, 1) // Just one for featured

    if (featuredWaysToEarnList) {
      featuredWaysToEarnList.innerHTML = ""
      featuredOffers.forEach((offer) => {
        const offerHtml = `
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
        `
        featuredWaysToEarnList.insertAdjacentHTML("beforeend", offerHtml)
      })
    }
  }

  async function loadShopPartners() {
    // This is where you would make an API call to fetch shop partners
    // Example: const partners = await apiCall("/shop/partners", "GET", null, true);
    // For now, using mock data:
    const partners = mockShopPartners

    if (shopPartnersList) {
      shopPartnersList.innerHTML = ""
      partners.forEach((partner) => {
        const partnerHtml = `
          <div class="card p-4 flex flex-col items-center text-center">
              <img src="${partner.logo}" alt="${partner.name} logo" class="rounded-full mb-2 object-contain size-16">
              <h3 class="font-medium text-gray-800">${partner.name}</h3>
              <p class="text-sm text-emerald-600 font-semibold">${partner.cashback} Cash Back</p>
          </div>
        `
        shopPartnersList.insertAdjacentHTML("beforeend", partnerHtml)
      })
    }
  }

  async function loadGames() {
    // This is where you would make an API call to fetch games
    // Example: const gamesData = await apiCall("/games", "GET", null, true);
    // For now, using mock data:
    const gamesData = mockGames

    if (gamesList) {
      gamesList.innerHTML = ""
      gamesData.forEach((game) => {
        const gameHtml = `
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
        `
        gamesList.insertAdjacentHTML("beforeend", gameHtml)
      })
    }
  }

  async function loadSurveys() {
    try {
      // TODO: Replace with actual API call to /surveys/active
      // const surveys = await apiCall("/surveys/active", "GET", null, true);
      const surveys = mockSurveys // Using mock data for now

      if (surveysList) {
        surveysList.innerHTML = ""
        if (surveys.length === 0) {
          surveysList.innerHTML = `<p class="empty-state">No more surveys available at the moment. Check back soon!</p>`
        } else {
          surveys.forEach((survey) => {
            const surveyHtml = `
                            <div class="card p-4 flex items-center gap-4">
                                <div class="flex-1">
                                    <h3 class="font-semibold text-gray-800">${survey.title}</h3>
                                    <p class="text-sm text-gray-600">Provider: ${survey.provider}</p>
                                    <p class="text-sm text-emerald-600 font-semibold">Earn ${survey.points} - ${survey.duration}</p>
                                </div>
                                <button class="btn-primary">Start Survey</button>
                            </div>
                        `
            surveysList.insertAdjacentHTML("beforeend", surveyHtml)
          })
        }
      }
    } catch (error) {
      console.error("Failed to load surveys:", error)
      window.displayMessage(surveysSectionMessage, "Failed to load surveys. Please try again later.", "error")
    }
  }

  async function loadTransferHistory() {
    try {
      // TODO: Replace with actual API call to /users/transfer-history
      // const history = await apiCall("/users/transfer-history", "GET", null, true);
      const history = mockTransferHistory // Using mock data for now

      if (transferHistoryTableBody) {
        transferHistoryTableBody.innerHTML = ""
        if (history.length === 0) {
          transferHistoryEmptyState.style.display = "block"
        } else {
          transferHistoryEmptyState.style.display = "none"
          history.forEach((item) => {
            const rowHtml = `
                            <tr>
                                <td>${item.date}</td>
                                <td>${item.type}</td>
                                <td>${item.recipientSender}</td>
                                <td>${item.amount}</td>
                            </tr>
                        `
            transferHistoryTableBody.insertAdjacentHTML("beforeend", rowHtml)
          })
        }
      }
    } catch (error) {
      console.error("Failed to load transfer history:", error)
      window.displayMessage(transferPointsSectionMessage, "Failed to load transfer history.", "error")
    }
  }

  async function handleTransferPoints(event) {
    event.preventDefault()
    const recipientEmail = document.getElementById("recipientEmail").value
    const transferAmount = Number.parseFloat(document.getElementById("transferAmount").value)

    if (!recipientEmail || isNaN(transferAmount) || transferAmount <= 0) {
      window.displayMessage(transferPointsSectionMessage, "Please enter a valid email and amount.", "error")
      return
    }

    try {
      // TODO: Replace with actual API call to /users/transfer-points
      // const response = await apiCall("/users/transfer-points", "POST", {
      //     recipient_email: recipientEmail,
      //     amount: transferAmount
      // }, true);

      // Mock success for now
      const response = { message: `Successfully transferred ${transferAmount} SB to ${recipientEmail}.` }

      window.displayMessage(transferPointsSectionMessage, response.message, "success")
      transferPointsForm.reset()
      await loadDashboardStats() // Update points balance
      await loadTransferHistory() // Refresh history
    } catch (error) {
      console.error("Transfer failed:", error)
      window.displayMessage(transferPointsSectionMessage, error.message || "Point transfer failed.", "error")
    }
  }

  async function loadRedemptionRates() {
    try {
      // TODO: Replace with actual API call to /redemption/rates
      // const rates = await apiCall("/redemption/rates", "GET", null, true);
      // bitcoinRateSpan.textContent = rates.bitcoin_rate;
      // giftCardRateSpan.textContent = rates.gift_card_rate;

      // Using mock data for now
      bitcoinRateSpan.textContent = "0.00001"
      giftCardRateSpan.textContent = "0.01"
    } catch (error) {
      console.error("Failed to load redemption rates:", error)
      window.showToast("Failed to load redemption rates.", "error")
    }
  }

  async function loadRedemptionHistory() {
    try {
      // TODO: Replace with actual API call to /redemption/history
      // const history = await apiCall("/redemption/history", "GET", null, true);
      const history = mockRedemptionHistory // Using mock data for now

      if (redemptionHistoryTableBody) {
        redemptionHistoryTableBody.innerHTML = ""
        if (history.length === 0) {
          redemptionHistoryEmptyState.style.display = "block"
        } else {
          redemptionHistoryEmptyState.style.display = "none"
          history.forEach((item) => {
            const rowHtml = `
                            <tr>
                                <td>${item.date}</td>
                                <td>${item.type}</td>
                                <td>${item.points}</td>
                                <td>${item.equivalentValue}</td>
                                <td>${item.status}</td>
                            </tr>
                        `
            redemptionHistoryTableBody.insertAdjacentHTML("beforeend", rowHtml)
          })
        }
      }
    } catch (error) {
      console.error("Failed to load redemption history:", error)
      window.displayMessage(redeemPointsSectionMessage, "Failed to load redemption history.", "error")
    }
  }

  async function handleRedemptionRequest(event) {
    event.preventDefault()
    const redemptionType = redemptionTypeSelect.value
    const pointsAmount = Number.parseFloat(document.getElementById("pointsAmount").value)
    const walletAddress = document.getElementById("walletAddress").value
    const emailAddress = document.getElementById("emailAddress").value

    if (isNaN(pointsAmount) || pointsAmount <= 0) {
      window.displayMessage(redeemPointsSectionMessage, "Please enter a valid amount of points.", "error")
      return
    }

    const payload = {
      redemption_type: redemptionType,
      points: pointsAmount,
    }

    if (redemptionType === "bitcoin") {
      if (!walletAddress) {
        window.displayMessage(redeemPointsSectionMessage, "Please enter your Bitcoin wallet address.", "error")
        return
      }
      payload.wallet_address = walletAddress
    } else if (redemptionType === "gift_card") {
      if (!emailAddress) {
        window.displayMessage(
          redeemPointsSectionMessage,
          "Please enter the recipient email for the gift card.",
          "error",
        )
        return
      }
      payload.recipient_email = emailAddress
    }

    try {
      // TODO: Replace with actual API call to /redemption/request
      // const response = await apiCall("/redemption/request", "POST", payload, true);

      // Mock success for now
      const response = {
        message: `Redemption request for ${pointsAmount} SB (${redemptionType}) submitted successfully.`,
      }

      window.displayMessage(redeemPointsSectionMessage, response.message, "success")
      redemptionRequestForm.reset()
      await loadDashboardStats() // Update points balance
      await loadRedemptionHistory() // Refresh history
    } catch (error) {
      console.error("Redemption failed:", error)
      window.displayMessage(redeemPointsSectionMessage, error.message || "Redemption request failed.", "error")
    }
  }

  async function loadActivityLog() {
    try {
      // TODO: Replace with actual API call to /users/activity-log
      // const log = await apiCall("/users/activity-log", "GET", null, true);
      const log = mockActivityLog // Using mock data for now

      if (activityLogTableBody) {
        activityLogTableBody.innerHTML = ""
        if (log.length === 0) {
          activityLogEmptyState.style.display = "block"
        } else {
          activityLogEmptyState.style.display = "none"
          log.forEach((item) => {
            const rowHtml = `
                            <tr>
                                <td>${item.dateTime}</td>
                                <td>${item.action}</td>
                                <td>${item.details}</td>
                            </tr>
                        `
            activityLogTableBody.insertAdjacentHTML("beforeend", rowHtml)
          })
        }
      }
    } catch (error) {
      console.error("Failed to load activity log:", error)
      window.displayMessage(
        document.getElementById("profile-settings-section").querySelector(".message"),
        "Failed to load activity log.",
        "error",
      )
    }
  }

  // --- Footer Accordion/Grid Logic ---
  function renderFooter() {
    // Render for mobile (accordion)
    if (footerAccordion) {
      footerAccordion.innerHTML = "" // Clear existing content
      footerSectionsData.forEach((section, index) => {
        const accordionItem = document.createElement("div")
        accordionItem.className = "accordion-item"
        accordionItem.innerHTML = `
                    <button class="accordion-trigger" aria-expanded="false" aria-controls="accordion-content-${index}">
                        ${section.title}
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down"><path d="m6 9 6 6 6-6"/></svg>
                    </button>
                    <div id="accordion-content-${index}" class="accordion-content hidden">
                        <ul>
                            ${section.links
                              .map(
                                (link) => `
                                <li>
                                    <a href="${link.href}" class="flex items-center gap-2 hover:text-emerald-600">
                                        ${getSocialIconSvg(link.icon)}
                                        ${link.name}
                                    </a>
                                </li>
                            `,
                              )
                              .join("")}
                        </ul>
                    </div>
                `
        footerAccordion.appendChild(accordionItem)

        const triggerButton = accordionItem.querySelector(".accordion-trigger")
        const contentDiv = accordionItem.querySelector(".accordion-content")

        triggerButton.addEventListener("click", () => {
          const isExpanded = triggerButton.getAttribute("aria-expanded") === "true"
          triggerButton.setAttribute("aria-expanded", String(!isExpanded))
          contentDiv.classList.toggle("hidden")
        })
      })
    }

    // Render for desktop (grid)
    if (footerGrid) {
      footerGrid.innerHTML = "" // Clear existing content
      footerSectionsData.forEach((section) => {
        const sectionDiv = document.createElement("div")
        sectionDiv.innerHTML = `
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">${section.title}</h3>
                    <ul class="space-y-2 text-gray-600">
                        ${section.links
                          .map(
                            (link) => `
                            <li>
                                <a href="${link.href}" class="flex items-center gap-2 hover:text-emerald-600">
                                    ${getSocialIconSvg(link.icon)}
                                    ${link.name}
                                </a>
                            </li>
                        `,
                          )
                          .join("")}
                    </ul>
                `
        footerGrid.appendChild(sectionDiv)
      })
    }
  }

  function getSocialIconSvg(iconName) {
    switch (iconName) {
      case "facebook":
        return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-facebook"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>`
      case "twitter":
        return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-twitter"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.7 5 4.9 9 5.1 0-.4.1-.8.1-1.2C12.1 5.8 17 3 22 4Z"/></svg>`
      case "instagram":
        return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-instagram"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>`
      default:
        return ""
    }
  }

  // --- Initial Data Load and Setup ---
  await loadDashboardStats()
  await loadSpecialOffers()
  await loadFeaturedWaysToEarn()
  await loadShopPartners()
  await loadGames()
  await loadSurveys()
  await loadTransferHistory()
  await loadRedemptionRates()
  await loadRedemptionHistory()
  await loadActivityLog()
  renderFooter()

  // Declare handleLogoutButton function
  function handleLogoutButton() {
    window.clearAuthData()
    window.location.href = "../index.html" // Redirect to login page after logout
  }
})
