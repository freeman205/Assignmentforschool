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
  })

  // Close side menu on outside click
  document.addEventListener("click", (e) => {
    if (!sideMenu.contains(e.target) && e.target !== menuToggle) {
      sideMenu.classList.add("hidden")
    }
  })

  // Handle menu item clicks
  document.querySelectorAll("[data-section]").forEach((item) => {
    item.addEventListener("click", (e) => {
      const section = e.currentTarget.dataset.section
      sideMenu.classList.add("-translate-x-full")
      handleMenuAction(section)
    })
  })

  // 👉 Call external surveys loader here
  if (accessToken) {
    loadSurveys(accessToken)
  }
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

      activitySection.innerHTML = `
        <h3 class="text-lg font-bold mb-2">🕒 Recent Activity</h3>
        <ul class="space-y-2">
          ${data
            .map((item) => {
              let emoji = "🔔"
              if (item.type === "survey") emoji = "✅"
              else if (item.type === "redeem") emoji = "💳"
              else if (item.type === "transfer") emoji = "📤"
              else if (item.type === "referral") emoji = "📥"

              return `
              <li class="text-sm text-gray-700">
                ${emoji} ${item.message} <br>
                <span class="text-xs text-gray-500">${new Date(item.timestamp).toLocaleString()}</span>
              </li>
            `
            })
            .join("")}
        </ul>
      `
    } catch (err) {
      console.error("Failed to load activity feed:", err)
      document.getElementById("activityFeed").innerHTML = `
        <p class="text-sm text-red-500">Unable to load activity feed.</p>
      `
    }
  }

  // Initial data loading: This block runs once the DOM is fully loaded.
  const accessToken = sessionStorage.getItem("accessToken")

  if (accessToken) {
    loadDashboardStats(accessToken) // Call to load dashboard stats
    loadActivity(accessToken) // Call to load activity feed
  } else {
    console.warn("No access token found. User might not be logged in. Dashboard stats and activity will not load.")
    // Optionally, redirect to login page if no token is found
    // window.location.href = '/login';
  }

  // Section handler for menu clicks
  async function handleMenuAction(section) {
    actionSection.innerHTML = ""

    const accessToken = sessionStorage.getItem("accessToken") // Re-fetch here to ensure it's current

    if (!accessToken) {
      actionSection.innerHTML = `<p class="text-red-500">You must be logged in to access this section.</p>`
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
      case "logout":
        sessionStorage.clear()
        window.location.href = "/login"
        break
      default:
        actionSection.innerHTML = `<p class="text-red-500">Unknown section selected.</p>`
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
        <div class="bg-white p-6 rounded-lg shadow">
          <h3 class="text-lg font-bold mb-2">Your Profile</h3>
          <p><strong>Email:</strong> ${user.email}</p>
          <p><strong>Full Name:</strong> ${user.name || "N/A"}</p>
          <p><strong>Status:</strong> ${user.status}</p>
          <p><strong>Points Balance:</strong> ${user.points_balance}</p>
          <p><strong>Referral Code:</strong> ${user.referral_code || "N/A"}</p>
          <p><strong>Email Verified:</strong> ${user.email_verified ? "Yes" : "No"}</p>
          <p><strong>Admin:</strong> ${user.is_admin ? "Yes" : "No"}</p>
          <p><strong>Agent:</strong> ${user.is_agent ? "Yes" : "No"}</p>
          <p><strong>Created At:</strong> ${new Date(user.created_at).toLocaleString()}</p>
        </div>
      `
    } catch (err) {
      console.error("Failed to load profile:", err)
      actionSection.innerHTML = "Failed to load profile."
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
        <div class="bg-white p-6 rounded-lg shadow">
          <h3 class="text-lg font-bold mb-2">Transfer History</h3>
          <ul class="space-y-2">
            ${data.transfers
              .map((item) => {
                const isSender = currentUser && item.from_user.email === currentUser.email
                const direction = isSender ? "to" : "from"
                const otherParty = isSender ? item.to_user : item.from_user

                return `
                <li class="text-sm text-gray-700">
                  <strong>${item.amount} pts</strong> ${direction} <strong>${otherParty.name} (${otherParty.email})</strong>
                  on <em>${new Date(item.created_at).toLocaleString()}</em>
                </li>
              `
              })
              .join("")}
          </ul>

          <div class="mt-4 text-sm text-gray-600">
            <p><strong>Total Sent:</strong> ${data.total_sent} pts</p>
            <p><strong>Total Received:</strong> ${data.total_received} pts</p>
          </div>
        </div>
      `
    } catch (err) {
      console.error("Failed to load transfer history:", err)
      actionSection.innerHTML = "Failed to load transfer history."
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
        actionSection.innerHTML = "Redemption rates not available."
        return
      }

      const btcPtsPerDollar = (1 / btcRate).toFixed(0)
      const giftPtsPerDollar = (1 / giftRate).toFixed(0)

      actionSection.innerHTML = `
        <div class="bg-white p-6 rounded-lg shadow">
          <h3 class="text-lg font-bold mb-4">Redeem Points</h3>
          <form id="redeemForm" class="space-y-4">
            <select name="type" class="w-full border p-2 rounded">
              <option value="bitcoin">Bitcoin (${btcPtsPerDollar} pts/$)</option>
              <option value="gift_card">Gift Card (${giftPtsPerDollar} pts/$)</option>
            </select>
            <input name="amount" type="number" placeholder="Points to redeem" class="w-full border p-2 rounded" required />
            <input name="destination" placeholder="Wallet (BTC) or Email (Gift Card)" class="w-full border p-2 rounded" required />
            <button class="bg-blue-600 text-white px-4 py-2 rounded">Redeem</button>
          </form>
        </div>
      `

      document.getElementById("redeemForm").addEventListener("submit", async (e) => {
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
            alert("Redemption request submitted")
            loadDashboardStats(accessToken) // Refresh dashboard stats after successful redemption
          } else {
            const errorText =
              typeof result.detail === "string" ? result.detail : JSON.stringify(result.detail || result)
            alert(`Failed to redeem: ${errorText}`)
          }
        } catch (err) {
          alert("Error redeeming. Check console for details.")
          console.error("Redemption Error:", err)
        }
      })
    } catch (err) {
      console.error("Failed to load rates:", err)
      actionSection.innerHTML = "Failed to load rates."
    }
  }

  async function loadSurveys(accessToken) {
  const surveyList = document.getElementById("surveyList");
  try {
    const res = await fetch(`${apiUrl}/surveys/available`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(`Survey fetch error: ${errorData.detail || errorData.message}`);
    }

    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      surveyList.innerHTML = `<p class="text-gray-500">No surveys available at the moment.</p>`;
      return;
    }

    surveyList.innerHTML = data
      .map((survey) => {
        return `
          <div class="border p-4 rounded hover:shadow-md">
            <h4 class="font-semibold">${survey.title}</h4>
            <p class="text-sm text-gray-500 mb-2">${survey.description || "No description"}</p>
            <p class="text-sm mb-2">Reward: <strong>${survey.points_reward} pts</strong></p>
            <a href="${survey.redirect_url}" target="_blank" class="inline-block mt-2 text-sm px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition">
              Take Survey
            </a>
          </div>
        `;
      })
      .join("");
  } catch (err) {
    console.error("Failed to load surveys:", err);
    surveyList.innerHTML = `<p class="text-red-500">Failed to load surveys. Please try again later.</p>`;
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

      if (!data.length) {
        actionSection.innerHTML = `
          <div class="bg-white p-6 rounded-lg shadow">
            <p class="text-gray-500">No redemption history found.</p>
          </div>
        `
        return
      }

      actionSection.innerHTML = `
        <div class="bg-white p-6 rounded-lg shadow">
          <h3 class="text-lg font-bold mb-4">🧾 Redemption History</h3>
          <ul class="space-y-4">
            ${data
              .map(
                (item) => `
              <li class="border p-4 rounded bg-gray-50 shadow-sm text-sm">
                <div class="flex justify-between items-center mb-2">
                  <h4 class="font-semibold capitalize text-gray-800">🔁 ${item.type}</h4>
                  <span class="px-2 py-1 text-xs font-medium rounded-full ${
                    item.status === "approved"
                      ? "bg-green-100 text-green-800"
                      : item.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                  }">${item.status}</span>
                </div>
                <p class="text-gray-700"><strong>Points:</strong> ${item.points_amount}</p>
                <p class="text-gray-700"><strong>Value:</strong> ${item.equivalent_value}</p>
                <p class="text-gray-500 mt-1"><strong>Submitted:</strong> ${new Date(item.created_at).toLocaleString()}</p>
              </li>
            `,
              )
              .join("")}
          </ul>
        </div>
      `
    } catch (err) {
      console.error("Failed to load redemption history:", err)
      actionSection.innerHTML = `
        <div class="bg-white p-4 rounded shadow text-red-600">
          Failed to load redemption history.
        </div>
      `
    }
  }

  async function loadTransferForm(accessToken) {
    actionSection.innerHTML = `
      <div class="bg-white p-6 rounded-lg shadow max-w-md mx-auto">
        <h3 class="text-lg font-bold mb-4">💸 Transfer Points</h3>
        <form id="transferForm" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Receiver Email</label>
            <input name="receiver_email" type="email" placeholder="e.g. user@example.com" class="w-full border p-2 rounded" required />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Amount</label>
            <input name="amount" type="number" placeholder="Enter amount" class="w-full border p-2 rounded" required min="1" />
          </div>
          <button type="submit" class="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition">Send Points</button>
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
      <div class="bg-white p-6 rounded-lg shadow max-w-md mx-auto">
        <h3 class="text-lg font-bold mb-4">🔐 Change Password</h3>
        <form id="passwordForm" class="space-y-4">
          <input type="password" name="current_password" placeholder="Current Password" class="w-full border p-2 rounded" required />
          <input type="password" name="new_password" placeholder="New Password" class="w-full border p-2 rounded" required />
          <input type="password" name="confirm_password" placeholder="Confirm New Password" class="w-full border p-2 rounded" required />
          <button type="submit" class="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">Change Password</button>
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
      <div class="bg-white p-6 rounded-lg shadow">
        <h3 class="text-lg font-bold mb-4">Change PIN</h3>
        <form id="pinForm" class="space-y-4">
          <input type="password" name="old_pin" placeholder="Old PIN" class="w-full border p-2 rounded" required />
          <input type="password" name="new_pin" placeholder="New PIN" class="w-full border p-2 rounded" required />
          <button class="bg-purple-600 text-white px-4 py-2 rounded">Change</button>
        </form>
      </div>
    `

    document.getElementById("pinForm").addEventListener("submit", async (e) => {
      e.preventDefault()
      const form = e.target
      const payload = {
        current_pin: form.old_pin.value,
        new_pin: form.new_pin.value,
      }

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
        alert(res.ok ? data.message : data.detail || "PIN change failed")
      } catch {
        alert("PIN error")
      }
    })
  }
})
