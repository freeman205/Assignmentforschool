document.addEventListener("DOMContentLoaded", () => {
  const apiUrl = "https://dansog-backend.onrender.com/api"
  const currentUser = JSON.parse(sessionStorage.getItem("currentUser"))

  const menuToggle = document.getElementById("menuToggle")
  const sideMenu = document.getElementById("sideMenu")
  const actionSection = document.getElementById("actionSection")

  // Toggle side menu
  menuToggle.addEventListener("click", (e) => {
    e.stopPropagation()
    sideMenu.classList.toggle("hidden")
    // Add data-state for transition
    if (!sideMenu.classList.contains("hidden")) {
      sideMenu.setAttribute("data-state", "open")
    } else {
      sideMenu.removeAttribute("data-state")
    }
  })

  // Close side menu on outside click
  document.addEventListener("click", (e) => {
    if (!sideMenu.contains(e.target) && e.target !== menuToggle) {
      sideMenu.classList.add("hidden")
      sideMenu.removeAttribute("data-state") // Remove data-state on close
    }
  })

  // Handle menu item clicks
  document.querySelectorAll("[data-section]").forEach((item) => {
    item.addEventListener("click", (e) => {
      const section = e.currentTarget.dataset.section
      sideMenu.classList.add("hidden") // Hide menu on click
      sideMenu.removeAttribute("data-state") // Remove data-state on close
      handleMenuAction(section)
    })
  })

  // Load wallet balance and other dashboard stats
  async function loadDashboardStats(accessToken) {
    try {
      const res = await fetch(`${apiUrl}/dashboard/stats`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: res.statusText }))
        console.error("Dashboard stats API error:", res.status, errorData)
        throw new Error(`Stats error: ${errorData.detail || errorData.message}`)
      }

      const data = await res.json()

      // Update the DOM elements with the received data
      document.getElementById("walletBalance").textContent = `${data.points_balance} pts`
      document.getElementById("completedSurveys").textContent = data.completed_surveys
      document.getElementById("pendingRedemptions").textContent = data.pending_redemptions
      document.getElementById("totalEarned").textContent = `${data.total_earned} pts`
    } catch (err) {
      console.error("Dashboard stats error:", err)
      document.getElementById("walletBalance").textContent = "Error"
      document.getElementById("completedSurveys").textContent = "Error"
      document.getElementById("pendingRedemptions").textContent = "Error"
      document.getElementById("totalEarned").textContent = "Error"
    }
  }

  // Load activity feed
  async function loadActivity(accessToken) {
    try {
      const res = await fetch(`${apiUrl}/dashboard/activity`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: res.statusText }))
        console.error("Activity feed API error:", res.status, errorData)
        throw new Error(`Activity feed error: ${errorData.detail || errorData.message}`)
      }

      const data = await res.json()

      const activitySection = document.getElementById("activityFeed")

      if (!activitySection) {
        console.error("HTML element with ID 'activityFeed' not found. Cannot load activity.")
        return
      }

      // Clear previous content and add new header
      activitySection.innerHTML = `<h3 class="text-2xl font-bold mb-6 text-primary">🕒 Recent Activity</h3>`

      if (!Array.isArray(data) || data.length === 0) {
        activitySection.innerHTML += `<p class="text-text-secondary text-lg text-center py-8">No recent activity to display.</p>`
        return
      }

      activitySection.innerHTML += `
        <ul class="space-y-4">
          ${data
            .map((item) => {
              let emoji = "🔔"
              if (item.type === "SURVEY_COMPLETED") emoji = "✅"
              else if (item.type === "REDEMPTION_REQUEST") emoji = "💳"
              else if (item.type === "POINTS_TRANSFER") emoji = "📤"
              else if (item.type === "USER_SIGNUP") emoji = "📥"
              else if (item.type === "PASSWORD_CHANGE" || item.type === "PIN_CHANGE") emoji = "⚙️"
              else if (item.type === "USER_LOGIN") emoji = "🔑"

              return `
              <li class="bg-background p-4 rounded-lg shadow-sm flex items-start space-x-3">
                <span class="text-xl">${emoji}</span>
                <div>
                  <p class="text-base font-medium text-text-primary">${item.message}</p>
                  <span class="text-sm text-text-secondary">${new Date(item.timestamp).toLocaleString()}</span>
                </div>
              </li>
            `
            })
            .join("")}
        </ul>
      `
    } catch (err) {
      console.error("Failed to load activity feed:", err)
      const activitySection = document.getElementById("activityFeed")
      if (activitySection) {
        activitySection.innerHTML = `
        <h3 class="text-2xl font-bold mb-6 text-primary">🕒 Recent Activity</h3>
        <p class="text-text-secondary text-lg text-center py-8 text-red-500">Unable to load activity feed. Please try again later.</p>
      `
      }
    }
  }

  // Initial data loading: This block runs once the DOM is fully loaded.
  const accessToken = sessionStorage.getItem("accessToken")

  if (accessToken) {
    loadDashboardStats(accessToken)
    loadActivity(accessToken)
    loadSurveys(accessToken) // Ensure surveys are loaded on initial page load
  } else {
    console.warn("No access token found. User might not be logged in. Dashboard stats and activity will not load.")
    // Optionally redirect to login if no token
    // window.location.href = "/login";
  }

  // Section handler for menu clicks
  async function handleMenuAction(section) {
    actionSection.innerHTML = `<p class="text-text-secondary text-lg text-center py-8">Loading ${section}...</p>` // Show loading state

    const accessToken = sessionStorage.getItem("accessToken")

    if (!accessToken) {
      actionSection.innerHTML = `<p class="text-red-500 text-lg text-center py-8">You must be logged in to access this section.</p>`
      return
    }

    switch (section) {
      case "profile":
        await loadProfile(accessToken)
        break
      case "history":
        await loadHistory(accessToken)
        break
      case "redeem":
        await loadRedemptionForm(accessToken)
        break
      case "redemptionHistory":
        await loadRedemptionHistory(accessToken)
        break
      case "transfer":
        loadTransferForm(accessToken)
        break
      case "password":
        loadPasswordForm(accessToken)
        break
      case "pin":
        loadPinForm(accessToken)
        break
      case "surveys":
        await loadSurveys(accessToken)
        break
      case "logout":
        sessionStorage.clear()
        window.location.href = "/login"
        break
      default:
        actionSection.innerHTML = `<p class="text-red-500 text-lg text-center py-8">Unknown section selected.</p>`
    }
  }

  async function loadProfile(accessToken) {
    try {
      const res = await fetch(`${apiUrl}/users/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: res.statusText }))
        throw new Error(`Profile error: ${errorData.detail || errorData.message}`)
      }
      const user = await res.json()
      actionSection.innerHTML = `
        <div class="bg-card-background p-8 rounded-2xl shadow-lg max-w-2xl mx-auto">
          <h3 class="text-2xl font-bold mb-6 text-primary">👤 Your Profile</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-lg">
            <p><strong class="text-text-primary">Email:</strong> <span class="text-text-secondary">${user.email}</span></p>
            <p><strong class="text-text-primary">Full Name:</strong> <span class="text-text-secondary">${user.name || "N/A"}</span></p>
            <p><strong class="text-text-primary">Status:</strong> <span class="text-text-secondary capitalize">${user.status}</span></p>
            <p><strong class="text-text-primary">Points Balance:</strong> <span class="text-text-secondary">${user.points_balance} pts</span></p>
            <p><strong class="text-text-primary">Referral Code:</strong> <span class="text-text-secondary">${user.referral_code || "N/A"}</span></p>
            <p><strong class="text-text-primary">Email Verified:</strong> <span class="text-text-secondary">${user.email_verified ? "Yes ✅" : "No ❌"}</span></p>
            <p><strong class="text-text-primary">Admin:</strong> <span class="text-text-secondary">${user.is_admin ? "Yes" : "No"}</span></p>
            <p><strong class="text-text-primary">Agent:</strong> <span class="text-text-secondary">${user.is_agent ? "Yes" : "No"}</span></p>
            <p class="col-span-full"><strong class="text-text-primary">Created At:</strong> <span class="text-text-secondary">${new Date(user.created_at).toLocaleString()}</span></p>
          </div>
        </div>
      `
    } catch (err) {
      console.error("Failed to load profile:", err)
      actionSection.innerHTML = `<p class="text-red-500 text-lg text-center py-8">Failed to load profile. Please try again.</p>`
    }
  }

  async function loadHistory(accessToken) {
    try {
      const res = await fetch(`${apiUrl}/points/history`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: res.statusText }))
        throw new Error(`History error: ${errorData.detail || errorData.message}`)
      }
      const data = await res.json()

      actionSection.innerHTML = `
        <div class="bg-card-background p-8 rounded-2xl shadow-lg max-w-3xl mx-auto">
          <h3 class="text-2xl font-bold mb-6 text-primary">📜 Transfer History</h3>
          ${
            data.transfers.length === 0
              ? `<p class="text-text-secondary text-lg text-center py-8">No transfer history found.</p>`
              : `
          <ul class="space-y-4">
            ${data.transfers
              .map((item) => {
                const isSender = currentUser && item.from_user.email === currentUser.email
                const direction = isSender ? "to" : "from"
                const otherParty = isSender ? item.to_user : item.from_user
                const amountClass = isSender ? "text-red-600" : "text-green-600"

                return `
                <li class="bg-background p-4 rounded-lg shadow-sm flex items-center justify-between">
                  <div>
                    <p class="text-base font-medium text-text-primary">
                      <strong class="${amountClass}">${item.amount} pts</strong> ${direction} <strong>${otherParty.name}</strong>
                    </p>
                    <span class="text-sm text-text-secondary">${new Date(item.created_at).toLocaleString()}</span>
                  </div>
                  <span class="text-sm text-text-secondary">(${otherParty.email})</span>
                </li>
              `
              })
              .join("")}
          </ul>

          <div class="mt-8 text-lg font-semibold text-text-primary border-t border-border-light pt-4">
            <p><strong>Total Sent:</strong> <span class="text-red-600">${data.total_sent} pts</span></p>
            <p><strong>Total Received:</strong> <span class="text-green-600">${data.total_received} pts</span></p>
          </div>
          `
          }
        </div>
      `
    } catch (err) {
      console.error("Failed to load transfer history:", err)
      actionSection.innerHTML = `<p class="text-red-500 text-lg text-center py-8">Failed to load transfer history. Please try again.</p>`
    }
  }

  async function loadRedemptionForm(accessToken) {
    try {
      const res = await fetch(`${apiUrl}/redemption/rates`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      const rates = await res.json()
      const btcRate = Number.parseFloat(rates.bitcoin_rate)
      const giftRate = Number.parseFloat(rates.gift_card_rate)

      if (!btcRate || !giftRate) {
        actionSection.innerHTML = `<p class="text-red-500 text-lg text-center py-8">Redemption rates not available. Please contact support.</p>`
        return
      }

      const btcPtsPerDollar = (1 / btcRate).toFixed(0)
      const giftPtsPerDollar = (1 / giftRate).toFixed(0)

      actionSection.innerHTML = `
        <div class="bg-card-background p-8 rounded-2xl shadow-lg max-w-md mx-auto">
          <h3 class="text-2xl font-bold mb-6 text-primary">💰 Redeem Points</h3>
          <form id="redeemForm" class="space-y-5">
            <div>
              <label for="redeemType" class="block text-text-primary text-sm font-medium mb-2">Redemption Type</label>
              <select id="redeemType" name="type" class="w-full p-3 border border-border-light rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-150 bg-background text-text-primary">
                <option value="bitcoin">Bitcoin (${btcPtsPerDollar} pts/$)</option>
                <option value="gift_card">Gift Card (${giftPtsPerDollar} pts/$)</option>
              </select>
            </div>
            <div>
              <label for="redeemAmount" class="block text-text-primary text-sm font-medium mb-2">Points to Redeem</label>
              <input id="redeemAmount" name="amount" type="number" placeholder="e.g., 1000" class="w-full p-3 border border-border-light rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-150 bg-background text-text-primary" required min="1" />
            </div>
            <div>
              <label for="redeemDestination" class="block text-text-primary text-sm font-medium mb-2">Destination</label>
              <input id="redeemDestination" name="destination" placeholder="Wallet Address or Email" class="w-full p-3 border border-border-light rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-150 bg-background text-text-primary" required />
            </div>
            <button type="submit" class="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 px-4 rounded-lg shadow-md transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-75">
              Submit Redemption
            </button>
          </form>
          <div id="redeemMessage" class="mt-4 text-sm text-center"></div>
        </div>
      `

      const redeemForm = document.getElementById("redeemForm")
      const redeemMessageEl = document.getElementById("redeemMessage")

      redeemForm.addEventListener("submit", async (e) => {
        e.preventDefault()
        const form = e.target
        const type = form.type.value
        const amount = Number.parseFloat(form.amount.value)
        const destination = form.destination.value

        const payload = {
          type,
          points_amount: amount,
          ...(type === "bitcoin" && { wallet_address: destination }),
          ...(type === "gift_card" && { email_address: destination }),
        }

        redeemMessageEl.textContent = "⏳ Submitting redemption request..."
        redeemMessageEl.className = "mt-4 text-sm text-blue-600 text-center"

        try {
          const r = await fetch(`${apiUrl}/redemption/request`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          })

          const result = await r.json()
          if (r.ok) {
            redeemMessageEl.textContent = "✅ Redemption request submitted successfully!"
            redeemMessageEl.className = "mt-4 text-sm text-green-600 text-center"
            form.reset()
            loadDashboardStats(accessToken) // Refresh dashboard stats after successful redemption
          } else {
            const errorText =
              typeof result.detail === "string" ? result.detail : JSON.stringify(result.detail || result)
            redeemMessageEl.textContent = `❌ Failed to redeem: ${errorText}`
            redeemMessageEl.className = "mt-4 text-sm text-red-600 text-center"
          }
        } catch (err) {
          redeemMessageEl.textContent = "❌ Error redeeming. Check console for details."
          redeemMessageEl.className = "mt-4 text-sm text-red-600 text-center"
          console.error("Redemption Error:", err)
        }
      })
    } catch (err) {
      console.error("Failed to load rates:", err)
      actionSection.innerHTML = `<p class="text-red-500 text-lg text-center py-8">Failed to load redemption form. Please try again later.</p>`
    }
  }

  async function loadSurveys(accessToken) {
    const surveyList = document.getElementById("surveyList")
    if (!surveyList) {
      console.error("HTML element with ID 'surveyList' not found. Cannot load surveys.")
      return
    }
    surveyList.innerHTML = `<p class="text-text-secondary text-lg col-span-full text-center py-8">Loading exciting surveys for you...</p>`

    try {
      const res = await fetch(`${apiUrl}/surveys/available`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: res.statusText }))
        console.error("Survey fetch error:", res.status, errorData)
        throw new Error(`Survey fetch error: ${errorData.detail || errorData.message}`)
      }

      const data = await res.json()

      if (!Array.isArray(data) || data.length === 0) {
        surveyList.innerHTML = `<p class="text-text-secondary text-lg col-span-full text-center py-8">No new surveys available at the moment. Check back soon!</p>`
        return
      }

      surveyList.innerHTML = data
        .map((survey) => {
          return `
          <div class="bg-background p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200 flex flex-col justify-between">
            <div>
              <h4 class="font-bold text-xl text-primary mb-2">${survey.title}</h4>
              <p class="text-text-secondary text-sm mb-3">${survey.description || "No description provided."}</p>
            </div>
            <div class="flex items-center justify-between mt-4">
              <p class="text-lg font-semibold text-accent">Reward: <strong>${survey.points_reward} pts</strong></p>
              <a href="${survey.redirect_url}" target="_blank" class="inline-flex items-center justify-center px-5 py-2 bg-accent hover:bg-accent-dark text-white font-bold rounded-full shadow-md transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent focus:ring-opacity-75">
                Take Survey
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-external-link ml-2"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>
              </a>
            </div>
          </div>
        `
        })
        .join("")
    } catch (err) {
      console.error("Failed to load surveys:", err)
      surveyList.innerHTML = `<p class="text-red-500 text-lg col-span-full text-center py-8">Failed to load surveys. Please try again later.</p>`
    }
  }

  async function loadRedemptionHistory(accessToken) {
    try {
      const res = await fetch(`${apiUrl}/redemption/history`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: res.statusText }))
        throw new Error(`Redemption history error: ${errorData.detail || errorData.message}`)
      }
      const data = await res.json()

      actionSection.innerHTML = `
        <div class="bg-card-background p-8 rounded-2xl shadow-lg max-w-3xl mx-auto">
          <h3 class="text-2xl font-bold mb-6 text-primary">🧾 Redemption History</h3>
          ${
            data.length === 0
              ? `<p class="text-text-secondary text-lg text-center py-8">No redemption history found.</p>`
              : `
          <ul class="space-y-4">
            ${data
              .map((item) => {
                let statusClass = ""
                let statusEmoji = ""
                if (item.status === "approved") {
                  statusClass = "bg-green-100 text-green-800"
                  statusEmoji = "✅"
                } else if (item.status === "pending") {
                  statusClass = "bg-yellow-100 text-yellow-800"
                  statusEmoji = "⏳"
                } else {
                  statusClass = "bg-red-100 text-red-800"
                  statusEmoji = "❌"
                }

                return `
                  <li class="bg-background p-5 rounded-xl shadow-sm border border-border-light">
                    <div class="flex justify-between items-center mb-2">
                      <h4 class="font-semibold capitalize text-xl text-text-primary flex items-center gap-2">
                        ${statusEmoji} ${item.type.replace("_", " ")}
                      </h4>
                      <span class="px-3 py-1 text-sm font-medium rounded-full ${statusClass}">${item.status}</span>
                    </div>
                    <p class="text-text-secondary text-base"><strong>Points:</strong> ${item.points_amount} pts</p>
                    <p class="text-text-secondary text-base"><strong>Value:</strong> $${item.equivalent_value.toFixed(2)}</p>
                    <p class="text-text-secondary text-sm mt-2"><strong>Submitted:</strong> ${new Date(item.created_at).toLocaleString()}</p>
                  </li>
                `
              })
              .join("")}
          </ul>
          `
          }
        </div>
      `
    } catch (err) {
      console.error("Failed to load redemption history:", err)
      actionSection.innerHTML = `
        <p class="text-red-500 text-lg text-center py-8">Failed to load redemption history. Please try again.</p>
      `
    }
  }

  async function loadTransferForm(accessToken) {
    actionSection.innerHTML = `
      <div class="bg-card-background p-8 rounded-2xl shadow-lg max-w-md mx-auto">
        <h3 class="text-2xl font-bold mb-6 text-primary">💸 Transfer Points</h3>
        <form id="transferForm" class="space-y-5">
          <div>
            <label for="receiverEmail" class="block text-text-primary text-sm font-medium mb-2">Receiver Email</label>
            <input id="receiverEmail" name="receiver_email" type="email" placeholder="e.g. user@example.com" class="w-full p-3 border border-border-light rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-150 bg-background text-text-primary" required />
          </div>
          <div>
            <label for="transferAmount" class="block text-text-primary text-sm font-medium mb-2">Amount</label>
            <input id="transferAmount" name="amount" type="number" placeholder="Enter amount" class="w-full p-3 border border-border-light rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-150 bg-background text-text-primary" required min="1" />
          </div>
          <button type="submit" class="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 px-4 rounded-lg shadow-md transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-75">
            Send Points
          </button>
        </form>
        <div id="transferMessage" class="mt-4 text-sm text-center"></div>
      </div>
    `

    const form = document.getElementById("transferForm")
    const messageEl = document.getElementById("transferMessage")

    form.addEventListener("submit", async (e) => {
      e.preventDefault()

      const receiver_email = form.receiver_email.value.trim()
      const amount = Number.parseInt(form.amount.value.trim())

      if (!receiver_email || isNaN(amount) || amount <= 0) {
        messageEl.textContent = "❌ Please enter a valid email and amount greater than zero."
        messageEl.className = "mt-4 text-sm text-red-600 text-center"
        return
      }

      messageEl.textContent = "⏳ Sending..."
      messageEl.className = "mt-4 text-sm text-blue-600 text-center"

      try {
        const res = await fetch(`${apiUrl}/points/transfer`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ to_email: receiver_email, amount }),
        })

        const result = await res.json()

        if (!res.ok) {
          throw new Error(result.detail || "Transfer failed")
        }

        messageEl.textContent = "✅ Transfer successful!"
        messageEl.className = "mt-4 text-sm text-green-600 text-center"
        form.reset()

        if (typeof loadDashboardStats === "function") loadDashboardStats(accessToken)
      } catch (err) {
        messageEl.textContent = `❌ ${err.message}`
        messageEl.className = "mt-4 text-sm text-red-600 text-center"
      }
    })
  }

  function loadPasswordForm(accessToken) {
    actionSection.innerHTML = `
      <div class="bg-card-background p-8 rounded-2xl shadow-lg max-w-md mx-auto">
        <h3 class="text-2xl font-bold mb-6 text-primary">🔐 Change Password</h3>
        <form id="passwordForm" class="space-y-5">
          <div>
            <label for="currentPassword" class="block text-text-primary text-sm font-medium mb-2">Current Password</label>
            <input id="currentPassword" type="password" name="current_password" placeholder="Current Password" class="w-full p-3 border border-border-light rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-150 bg-background text-text-primary" required />
          </div>
          <div>
            <label for="newPassword" class="block text-text-primary text-sm font-medium mb-2">New Password</label>
            <input id="newPassword" type="password" name="new_password" placeholder="New Password" class="w-full p-3 border border-border-light rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-150 bg-background text-text-primary" required />
          </div>
          <div>
            <label for="confirmPassword" class="block text-text-primary text-sm font-medium mb-2">Confirm New Password</label>
            <input id="confirmPassword" type="password" name="confirm_password" placeholder="Confirm New Password" class="w-full p-3 border border-border-light rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-150 bg-background text-text-primary" required />
          </div>
          <button type="submit" class="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 px-4 rounded-lg shadow-md transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-75">
            Change Password
          </button>
        </form>
        <div id="passwordChangeMessage" class="mt-4 text-sm text-center"></div>
      </div>
    `

    const form = document.getElementById("passwordForm")
    const messageEl = document.getElementById("passwordChangeMessage")

    form.addEventListener("submit", async (e) => {
      e.preventDefault()

      const current_password = form.current_password.value.trim()
      const new_password = form.new_password.value.trim()
      const confirm_password = form.confirm_password.value.trim()

      if (new_password !== confirm_password) {
        messageEl.textContent = "❌ New passwords do not match"
        messageEl.className = "mt-4 text-sm text-red-600 text-center"
        return
      }

      messageEl.textContent = "⏳ Updating password..."
      messageEl.className = "mt-4 text-sm text-blue-600 text-center"

      try {
        const res = await fetch(`${apiUrl}/users/change-password`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            current_password,
            new_password,
          }),
        })

        const data = await res.json()

        if (!res.ok) throw new Error(data.detail || "Failed to change password")

        messageEl.textContent = "✅ Password changed successfully!"
        messageEl.className = "mt-4 text-sm text-green-600 text-center"
        form.reset()
      } catch (err) {
        messageEl.textContent = `❌ ${err.message}`
        messageEl.className = "mt-4 text-sm text-red-600 text-center"
      }
    })
  }

  function loadPinForm(accessToken) {
    actionSection.innerHTML = `
      <div class="bg-card-background p-8 rounded-2xl shadow-lg max-w-md mx-auto">
        <h3 class="text-2xl font-bold mb-6 text-primary">🔒 Change PIN</h3>
        <form id="pinForm" class="space-y-5">
          <div>
            <label for="oldPin" class="block text-text-primary text-sm font-medium mb-2">Old PIN</label>
            <input id="oldPin" type="password" name="old_pin" placeholder="Old PIN" class="w-full p-3 border border-border-light rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-150 bg-background text-text-primary" required />
          </div>
          <div>
            <label for="newPin" class="block text-text-primary text-sm font-medium mb-2">New PIN</label>
            <input id="newPin" type="password" name="new_pin" placeholder="New PIN" class="w-full p-3 border border-border-light rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-150 bg-background text-text-primary" required />
          </div>
          <button type="submit" class="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 px-4 rounded-lg shadow-md transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-75">
            Change PIN
          </button>
        </form>
        <div id="pinChangeMessage" class="mt-4 text-sm text-center"></div>
      </div>
    `

    const form = document.getElementById("pinForm")
    const messageEl = document.getElementById("pinChangeMessage")

    form.addEventListener("submit", async (e) => {
      e.preventDefault()
      const form = e.target
      const payload = {
        current_pin: form.old_pin.value,
        new_pin: form.new_pin.value,
      }

      messageEl.textContent = "⏳ Updating PIN..."
      messageEl.className = "mt-4 text-sm text-blue-600 text-center"

      try {
        const res = await fetch(`${apiUrl}/users/change-pin`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (res.ok) {
          messageEl.textContent = "✅ PIN changed successfully!"
          messageEl.className = "mt-4 text-sm text-green-600 text-center"
          form.reset()
        } else {
          messageEl.textContent = `❌ ${data.detail || "PIN change failed"}`
          messageEl.className = "mt-4 text-sm text-red-600 text-center"
        }
      } catch (err) {
        messageEl.textContent = "❌ PIN error. Check console for details."
        messageEl.className = "mt-4 text-sm text-red-600 text-center"
        console.error("PIN change error:", err)
      }
    })
  }
})
