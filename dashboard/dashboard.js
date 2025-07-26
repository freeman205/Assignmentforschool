// dashboard.js

// Ensure app.js is loaded first for apiCall, getAuthToken, etc.
// This script assumes app.js is loaded before it.

// Declare variables before using them
const getCurrentUser = window.getCurrentUser
const apiCall = window.apiCall
const displayMessage = window.displayMessage
const clearAuthData = window.clearAuthData

document.addEventListener("DOMContentLoaded", async () => {
  const currentUser = getCurrentUser()
  if (!currentUser) {
    // If no user is logged in, redirect to login page
    window.location.href = "index.html"
    return
  }

  // --- DOM Elements ---
  const userNameElement = document.getElementById("userName")
  const logoutButton = document.getElementById("logoutButton")
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
  const bitcoinRedemptionForm = document.getElementById("bitcoinRedemptionForm")
  const giftCardRedemptionForm = document.getElementById("giftCardRedemptionForm")
  const redemptionHistoryTableBody = document.getElementById("redemptionHistoryTableBody")
  const redemptionHistoryEmptyState = document.getElementById("redemptionHistoryEmptyState")

  const profileNameElement = document.getElementById("profileName")
  const profileEmailElement = document.getElementById("profileEmail")
  const profileReferralCodeElement = document.getElementById("profileReferralCode")
  const resetPinButton = document.getElementById("resetPinButton")
  const changePasswordButton = document.getElementById("changePasswordButton")
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
  if (transferPointsForm) {
    transferPointsForm.addEventListener("submit", handleTransferPoints)
  }
  if (bitcoinRedemptionForm) {
    bitcoinRedemptionForm.addEventListener("submit", handleBitcoinRedemption)
  }
  if (giftCardRedemptionForm) {
    giftCardRedemptionForm.addEventListener("submit", handleGiftCardRedemption)
  }
  if (resetPinButton) {
    resetPinButton.addEventListener("click", () => {
      window.location.href = "pin-reset.html"
    })
  }
  if (changePasswordButton) {
    changePasswordButton.addEventListener("click", () => {
      window.location.href = "forgot-password.html"
    })
  }

  // --- Navigation Scroll ---
  document.querySelectorAll("aside nav a").forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault()
      document.querySelector(this.getAttribute("href")).scrollIntoView({
        behavior: "smooth",
      })
      // Update active class
      document.querySelectorAll("aside nav a").forEach((link) => link.classList.remove("active"))
      this.classList.add("active")
    })
  })

  // Set initial active link
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
          surveysList.innerHTML = '<p class="empty-state">No more surveys available at the moment. Check back soon!</p>'
        } else {
          surveys.forEach((survey) => {
            const surveyDiv = document.createElement("div")
            surveyDiv.className = "bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4"
            surveyDiv.innerHTML = `
              <h3>${survey.title}</h3>
              <p>${survey.description || "No description provided."}</p>
              <p>Reward: <strong>${survey.points_reward.toFixed(2)} Points</strong></p>
              <button class="primary mt-2 complete-survey-btn" data-survey-id="${survey.id}">Complete Survey</button>
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
          transferHistoryTableBody.innerHTML = "" // Ensure no rows are rendered
        } else {
          transferHistoryEmptyState.style.display = "none"
          history.transfers
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .forEach((transfer) => {
              const row = transferHistoryTableBody.insertRow()
              const type = transfer.from_user_id === currentUser.id ? "Sent" : "Received"
              const counterparty = type === "Sent" ? transfer.to_user_id : transfer.from_user_id // Backend needs to return counterparty email/name
              row.innerHTML = `
              <td>${new Date(transfer.created_at).toLocaleDateString()}</td>
              <td>${type}</td>
              <td>${counterparty}</td> <!-- Placeholder, needs backend to return counterparty info -->
              <td>${transfer.amount.toFixed(2)} Points</td>
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
      const rates = await apiCall("/redemption/rates", "GET", null, false) // Rates don't require auth
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
          redemptionHistoryTableBody.innerHTML = ""
        } else {
          redemptionHistoryEmptyState.style.display = "none"
          redemptions
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .forEach((redemption) => {
              const row = redemptionHistoryTableBody.insertRow()
              row.innerHTML = `
              <td>${new Date(redemption.created_at).toLocaleDateString()}</td>
              <td>${redemption.type.replace("_", " ").replace(/\b\w/g, (char) => char.toUpperCase())}</td>
              <td>${redemption.points_amount.toFixed(2)}</td>
              <td>${redemption.equivalent_value.toFixed(8)} ${redemption.type === "bitcoin" ? "BTC" : "USD"}</td>
              <td>${redemption.status.replace(/\b\w/g, (char) => char.toUpperCase())}</td>
            `
            })
        }
      }
    } catch (error) {
      console.error("Failed to fetch redemption history:", error)
      displayMessage("redeem-points-section-message", "Failed to load redemption history.", false)
    }
  }

  // Note: The backend currently does not expose a user-specific activity log endpoint.
  // This function is a placeholder. You would need to implement a /api/users/me/activity-log endpoint.
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
      displayMessage("surveys-section-message", response.message, true)
      // Refresh dashboard stats and surveys
      await fetchDashboardStats()
      await fetchSurveys()
    } catch (error) {
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
      displayMessage("transfer-points-section-message", response.message, true)
      transferPointsForm.reset() // Clear form
      await fetchDashboardStats() // Update balance
      await fetchTransferHistory() // Update history
    } catch (error) {
      displayMessage("transfer-points-section-message", error.message || "Point transfer failed.", false)
    }
  }

  async function handleBitcoinRedemption(event) {
    event.preventDefault()
    displayMessage("redeem-points-section-message", "Requesting Bitcoin redemption...", true)

    const pointsAmount = Number.parseFloat(document.getElementById("btcPointsAmount").value)
    const walletAddress = document.getElementById("bitcoinWalletAddress").value

    if (isNaN(pointsAmount) || pointsAmount <= 0) {
      displayMessage("redeem-points-section-message", "Please enter a valid positive amount of points.", false)
      return
    }

    try {
      const response = await apiCall(
        "/redemption/request",
        "POST",
        {
          type: "bitcoin",
          points_amount: pointsAmount,
          wallet_address: walletAddress,
        },
        true,
      )
      displayMessage("redeem-points-section-message", response.message, true)
      bitcoinRedemptionForm.reset()
      await fetchDashboardStats()
      await fetchRedemptionHistory()
    } catch (error) {
      displayMessage("redeem-points-section-message", error.message || "Bitcoin redemption failed.", false)
    }
  }

  async function handleGiftCardRedemption(event) {
    event.preventDefault()
    displayMessage("redeem-points-section-message", "Requesting Gift Card redemption...", true)

    const pointsAmount = Number.parseFloat(document.getElementById("gcPointsAmount").value)
    const emailAddress = document.getElementById("giftCardEmail").value

    if (isNaN(pointsAmount) || pointsAmount <= 0) {
      displayMessage("redeem-points-section-message", "Please enter a valid positive amount of points.", false)
      return
    }

    try {
      const response = await apiCall(
        "/redemption/request",
        "POST",
        {
          type: "gift_card",
          points_amount: pointsAmount,
          email_address: emailAddress,
        },
        true,
      )
      displayMessage("redeem-points-section-message", response.message, true)
      giftCardRedemptionForm.reset()
      await fetchDashboardStats()
      await fetchRedemptionHistory()
    } catch (error) {
      displayMessage("redeem-points-section-message", error.message || "Gift Card redemption failed.", false)
    }
  }

  function handleLogoutButton() {
    clearAuthData()
    window.location.href = "index.html" // Redirect to login page
  }

  // --- Initial Data Load ---
  await fetchDashboardStats()
  await fetchSurveys()
  await fetchTransferHistory()
  await fetchRedemptionRates()
  await fetchRedemptionHistory()
  await fetchActivityLog() // Placeholder for now
})
