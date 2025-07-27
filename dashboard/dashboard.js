// dashboard.js

// Ensure app.js is loaded first for apiCall, getAuthToken, etc.
// This script assumes app.js is loaded before it.

// Declare variables before using them
const getCurrentUser = window.getCurrentUser
const apiCall = window.apiCall
const showToast = window.showToast
const displayMessage = window.displayMessage
const clearAuthData = window.clearAuthData

document.addEventListener("DOMContentLoaded", async () => {
  const currentUser = getCurrentUser()
  if (!currentUser) {
    // If no user is logged in, redirect to login page
    window.location.href = "/"
    return
  }

  // --- DOM Elements ---
  const userNameElement = document.getElementById("userName")
  const mobileMenuButton = document.getElementById("mobileMenuButton")
  const sidebar = document.getElementById("sidebar")

  const pointsBalanceElement = document.getElementById("pointsBalance")
  const completedSurveysElement = document.getElementById("completedSurveys")
  const totalEarnedElement = document.getElementById("totalEarned")
  const pendingRedemptionsElement = document.getElementById("pendingRedemptions")

  const surveysList = document.getElementById("surveysList")
  const transferPointsForm = document.getElementById("transferPointsForm")
  const transferHistoryTableBody = document.getElementById("transferHistoryTableBody")
  const transferHistoryEmptyState = document.getElementById("transferHistoryEmptyState")

  const bitcoinRateElement = document.getElementById("bitcoinRate")
  const giftCardRateElement = document.getElementById("giftCardRate")
  const redemptionRequestForm = document.getElementById("redemptionRequestForm") // Combined form
  const redemptionTypeSelect = document.getElementById("redemptionType") // New select for type
  const pointsAmountInput = document.getElementById("pointsAmount") // New combined points input
  const walletAddressField = document.getElementById("walletAddressField") // Field for Bitcoin
  const walletAddressInput = document.getElementById("walletAddress")
  const emailAddressField = document.getElementById("emailAddressField") // Field for Gift Card
  const emailAddressInput = document.getElementById("emailAddress")
  const redemptionHistoryTableBody = document.getElementById("redemptionHistoryTableBody")
  const redemptionHistoryEmptyState = document.getElementById("redemptionHistoryEmptyState")

  const profileNameElement = document.getElementById("profileName")
  const profileEmailElement = document.getElementById("profileEmail")
  const profileReferralCodeElement = document.getElementById("profileReferralCode")
  const resetPinButton = document.getElementById("resetPinButton")
  const changePasswordButton = document.getElementById("changePasswordButton")
  const logoutButton = document.getElementById("logoutButton") // Get the logout button from sidebar
  const activityLogTableBody = document.getElementById("activityLogTableBody")
  const activityLogEmptyState = document.getElementById("activityLogEmptyState")

  // --- Initial UI Setup ---
  if (userNameElement) userNameElement.textContent = currentUser.name
  if (profileNameElement) profileNameElement.textContent = currentUser.name
  if (profileEmailElement) profileEmailElement.textContent = currentUser.email
  if (profileReferralCodeElement) profileReferralCodeElement.textContent = currentUser.referral_code || "N/A"

  // --- Event Listeners ---
  if (logoutButton) {
    logoutButton.addEventListener("click", handleLogoutButton)
  }
  if (mobileMenuButton) {
    mobileMenuButton.addEventListener("click", toggleSidebar)
  }
  if (transferPointsForm) {
    transferPointsForm.addEventListener("submit", handleTransferPoints)
  }
  if (redemptionRequestForm) {
    redemptionRequestForm.addEventListener("submit", handleRedemptionRequest)
  }
  if (redemptionTypeSelect) {
    redemptionTypeSelect.addEventListener("change", toggleRedemptionFields)
  }
  if (resetPinButton) {
    resetPinButton.addEventListener("click", () => {
      window.location.href = "/pin-reset"
    })
  }
  if (changePasswordButton) {
    changePasswordButton.addEventListener("click", () => {
      window.location.href = "/forgot-password"
    })
  }

  // --- Sidebar Toggle Functionality ---
  function toggleSidebar() {
    document.body.classList.toggle("sidebar-open")
  }

  // Close sidebar when clicking outside on mobile
  document.body.addEventListener("click", (event) => {
    // Check if sidebar is open, and if the click is outside the sidebar and not on the menu button
    if (
      document.body.classList.contains("sidebar-open") &&
      !sidebar.contains(event.target) &&
      !mobileMenuButton.contains(event.target)
    ) {
      document.body.classList.remove("sidebar-open")
    }
  })

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
      document.querySelectorAll("aside nav a.nav-link").forEach((link) => link.classList.remove("active"))
      // For buttons, find the closest anchor or apply active to the button itself if it's a primary nav item
      if (this.tagName === "A") {
        this.classList.add("active")
      } else {
        // For buttons like Reset PIN, Change Password, Logout
        // If these buttons are considered primary navigation, they can get active class
        // For now, they don't directly correspond to a main content section, so no active class.
        // If they were to open a modal or a new page, the active state logic would differ.
      }

      // Close sidebar on mobile after clicking a link/button
      if (window.innerWidth < 768) {
        // Assuming 768px is your md breakpoint
        document.body.classList.remove("sidebar-open")
      }
    })
  })

  // Set initial active link based on URL hash or default
  const initialSection = window.location.hash || "#dashboard-overview"
  const initialLink = document.querySelector(`aside nav a[href="${initialSection}"]`)
  if (initialLink) {
    initialLink.classList.add("active")
  }

  // --- Data Fetching Functions ---

  async function fetchDashboardStats() {
    try {
      const stats = await apiCall("/dashboard/stats", "GET", null, true)
      if (pointsBalanceElement) pointsBalanceElement.textContent = `${stats.points_balance.toFixed(2)} Points`
      if (completedSurveysElement) completedSurveysElement.textContent = `${stats.completed_surveys} Surveys`
      if (totalEarnedElement) totalEarnedElement.textContent = `${stats.total_earned.toFixed(2)} Points`
      if (pendingRedemptionsElement) pendingRedemptionsElement.textContent = `${stats.pending_redemptions} Requests`
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error)
      displayMessage("dashboard-overview-message", "Failed to load dashboard statistics.", false)
    }
  }

  async function fetchSurveys() {
    try {
      const surveys = await apiCall("/surveys", "GET", null, true)
      if (surveysList) {
        surveysList.innerHTML = "" // Clear existing content
        if (surveys.length === 0) {
          surveysList.innerHTML =
            '<p class="empty-state text-gray-500 italic">No more surveys available at the moment. Check back soon!</p>'
        } else {
          surveys.forEach((survey) => {
            const surveyDiv = document.createElement("div")
            surveyDiv.className = "bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-sm"
            surveyDiv.innerHTML = `
              <h3 class="text-lg font-semibold text-gray-800 mb-2">${survey.title}</h3>
              <p class="text-gray-600 text-sm mb-3">${survey.description || "No description provided."}</p>
              <p class="text-md font-medium text-emerald-600">Reward: <strong>${survey.points_reward.toFixed(2)} Points</strong></p>
              <button class="btn-primary mt-4 complete-survey-btn" data-survey-id="${survey.id}">Complete Survey</button>
            `
            surveysList.appendChild(surveyDiv)
          })
          document.querySelectorAll(".complete-survey-btn").forEach((button) => {
            button.addEventListener("click", handleCompleteSurvey)
          })
        }
      }
    } catch (error) {
      console.error("Failed to fetch surveys:", error)
      displayMessage("surveys-section-message", "Failed to load surveys.", false)
    }
  }

  async function fetchTransferHistory() {
    try {
      const history = await apiCall("/points/history", "GET", null, true)
      if (transferHistoryTableBody) {
        transferHistoryTableBody.innerHTML = "" // Clear existing content
        if (history.transfers.length === 0) {
          transferHistoryEmptyState.style.display = "block"
        } else {
          transferHistoryEmptyState.style.display = "none"
          history.transfers
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .forEach((transfer) => {
              const row = transferHistoryTableBody.insertRow()
              const type = transfer.from_user_id === currentUser.id ? "Sent" : "Received"
              // NOTE: Backend currently returns user IDs. For a professional display,
              // you'd ideally want to fetch recipient/sender names/emails.
              // For now, displaying the ID.
              const counterpartyId = type === "Sent" ? transfer.to_user_id : transfer.from_user_id
              row.innerHTML = `
              <td class="py-2 px-4">${new Date(transfer.created_at).toLocaleDateString()}</td>
              <td class="py-2 px-4">${type}</td>
              <td class="py-2 px-4">User ID: ${counterpartyId}</td>
              <td class="py-2 px-4">${transfer.amount.toFixed(2)} Points</td>
            `
            })
        }
      }
    } catch (error) {
      console.error("Failed to fetch transfer history:", error)
      displayMessage("transfer-points-section-message", "Failed to load transfer history.", false)
    }
  }

  async function fetchRedemptionRates() {
    try {
      const rates = await apiCall("/redemption/rates", "GET", null, false)
      if (bitcoinRateElement) bitcoinRateElement.textContent = `1 Point = ${rates.bitcoin_rate} BTC`
      if (giftCardRateElement)
        giftCardRateElement.textContent = `1 Point = $${rates.gift_card_rate} USD (Gift Card Equivalent)`
    } catch (error) {
      console.error("Failed to fetch redemption rates:", error)
      displayMessage("redeem-points-section-message", "Failed to load redemption rates.", false)
    }
  }

  async function fetchRedemptionHistory() {
    try {
      const redemptions = await apiCall("/redemption/history", "GET", null, true)
      if (redemptionHistoryTableBody) {
        redemptionHistoryTableBody.innerHTML = "" // Clear existing content
        if (redemptions.length === 0) {
          redemptionHistoryEmptyState.style.display = "block"
        } else {
          redemptionHistoryEmptyState.style.display = "none"
          redemptions
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .forEach((redemption) => {
              const row = redemptionHistoryTableBody.insertRow()
              row.innerHTML = `
              <td class="py-2 px-4">${new Date(redemption.created_at).toLocaleDateString()}</td>
              <td class="py-2 px-4">${redemption.type.replace("_", " ").replace(/\b\w/g, (char) => char.toUpperCase())}</td>
              <td class="py-2 px-4">${redemption.points_amount.toFixed(2)}</td>
              <td class="py-2 px-4">${redemption.equivalent_value.toFixed(8)} ${redemption.type === "bitcoin" ? "BTC" : "USD"}</td>
              <td class="py-2 px-4">${redemption.status.replace(/\b\w/g, (char) => char.toUpperCase())}</td>
            `
            })
        }
      }
    } catch (error) {
      console.error("Failed to fetch redemption history:", error)
      displayMessage("redeem-points-section-message", "Failed to load redemption history.", false)
    }
  }

  // Placeholder for Activity Log - Backend endpoint needed
  async function fetchActivityLog() {
    if (activityLogTableBody) {
      activityLogTableBody.innerHTML = ""
      activityLogEmptyState.style.display = "block"
      // Example of simulated data if no backend endpoint exists
      // const simulatedActivities = [
      //   { date: "2025-07-26 10:30", action: "Login", details: "Successful login from IP 192.168.1.100" },
      //   { date: "2025-07-25 14:00", action: "Survey Completed", details: "Earned 100 points from 'Daily Habits Survey'" },
      // ];
      // if (simulatedActivities.length > 0) {
      //   activityLogEmptyState.style.display = "none";
      //   simulatedActivities.forEach(activity => {
      //     const row = activityLogTableBody.insertRow();
      //     row.innerHTML = `<td>${activity.date}</td><td>${activity.action}</td><td>${activity.details}</td>`;
      //   });
      // }
    }
  }

  // --- Form Submission Handlers ---

  async function handleCompleteSurvey(event) {
    const surveyId = event.target.dataset.surveyId
    if (!surveyId) return

    displayMessage("surveys-section-message", "Completing survey...", true)
    try {
      const response = await apiCall(`/surveys/${surveyId}/complete`, "POST", null, true)
      showToast(response.message, "success")
      displayMessage("surveys-section-message", response.message, true)
      // Refresh dashboard stats and surveys
      await fetchDashboardStats()
      await fetchSurveys()
    } catch (error) {
      showToast(error.message || "Failed to complete survey.", "error")
      displayMessage("surveys-section-message", error.message || "Failed to complete survey.", false)
    }
  }

  async function handleTransferPoints(event) {
    event.preventDefault()
    displayMessage("transfer-points-section-message", "Initiating transfer...", true)

    const recipientEmail = document.getElementById("recipientEmail").value
    const transferAmount = Number.parseFloat(document.getElementById("transferAmount").value)

    if (isNaN(transferAmount) || transferAmount <= 0) {
      displayMessage("transfer-points-section-message", "Please enter a valid positive amount.", false)
      return
    }

    try {
      const response = await apiCall(
        "/points/transfer",
        "POST",
        {
          to_email: recipientEmail,
          amount: transferAmount,
        },
        true,
      )
      showToast(response.message, "success")
      displayMessage("transfer-points-section-message", response.message, true)
      transferPointsForm.reset() // Clear form
      await fetchDashboardStats() // Update balance
      await fetchTransferHistory() // Update history
    } catch (error) {
      showToast(error.message || "Point transfer failed.", "error")
      displayMessage("transfer-points-section-message", error.message || "Point transfer failed.", false)
    }
  }

  // New combined redemption handler
  async function handleRedemptionRequest(event) {
    event.preventDefault()
    displayMessage("redeem-points-section-message", "Requesting redemption...", true)

    const redemptionType = redemptionTypeSelect.value
    const pointsAmount = Number.parseFloat(pointsAmountInput.value)
    let walletAddress = null
    let emailAddress = null

    if (isNaN(pointsAmount) || pointsAmount <= 0) {
      displayMessage("redeem-points-section-message", "Please enter a valid positive amount of points.", false)
      return
    }

    const payload = {
      type: redemptionType,
      points_amount: pointsAmount,
    }

    if (redemptionType === "bitcoin") {
      walletAddress = walletAddressInput.value
      if (!walletAddress) {
        displayMessage("redeem-points-section-message", "Please enter a Bitcoin wallet address.", false)
        return
      }
      payload.wallet_address = walletAddress
    } else if (redemptionType === "gift_card") {
      emailAddress = emailAddressInput.value
      if (!emailAddress) {
        displayMessage("redeem-points-section-message", "Please enter an email address for the gift card.", false)
        return
      }
      payload.email_address = emailAddress
    }

    try {
      const response = await apiCall("/redemption/request", "POST", payload, true)
      showToast(response.message, "success")
      displayMessage("redeem-points-section-message", response.message, true)
      redemptionRequestForm.reset() // Clear form
      toggleRedemptionFields() // Reset field visibility
      await fetchDashboardStats()
      await fetchRedemptionHistory()
    } catch (error) {
      showToast(error.message || "Redemption failed.", "error")
      displayMessage("redeem-points-section-message", error.message || "Redemption failed.", false)
    }
  }

  // Function to toggle visibility of wallet/email fields
  function toggleRedemptionFields() {
    const type = redemptionTypeSelect.value
    if (walletAddressField && emailAddressField) {
      walletAddressField.style.display = type === "bitcoin" ? "block" : "none"
      emailAddressField.style.display = type === "gift_card" ? "block" : "none"

      // Set required attribute based on type
      walletAddressInput.required = type === "bitcoin"
      emailAddressInput.required = type === "gift_card"
    }
  }

  function handleLogoutButton() {
    clearAuthData()
    window.location.href = "/" // Redirect to login page
  }

  // --- Initial Data Load and Setup ---
  await fetchDashboardStats()
  await fetchSurveys()
  await fetchTransferHistory()
  await fetchRedemptionRates()
  await fetchRedemptionHistory()
  await fetchActivityLog() // Placeholder for now

  // Initial call to set correct field visibility on page load for redemption form
  toggleRedemptionFields()
})
