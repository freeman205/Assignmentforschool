const baseURL = "https://dansog-backend.onrender.com/api";
const accessToken = sessionStorage.getItem("accessToken");
const currentUser = JSON.parse(sessionStorage.getItem("currentUser"));

const actionSection = document.getElementById("action-section");
const walletBalance = document.getElementById("wallet-balance");
const toggleButton = document.getElementById("menu-toggle");
const menuList = document.getElementById("menu-list");

if (!accessToken || !currentUser) {
  window.location.href = "/login";
}

// === TOGGLE MENU ===
toggleButton.addEventListener("click", () => {
  menuList.classList.toggle("hidden");
});
document.addEventListener("click", (e) => {
  if (!menuList.contains(e.target) && !toggleButton.contains(e.target)) {
    menuList.classList.add("hidden");
  }
});

// === FETCH DASHBOARD STATS ===
async function loadStats() {
  try {
    const res = await fetch(`${baseURL}/dashboard/stats`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error("Failed to load dashboard stats");
    const data = await res.json();

    walletBalance.innerText = `${data.points_balance} Points`;

    // Store for future use
    sessionStorage.setItem("wallet", JSON.stringify(data));
  } catch (err) {
    walletBalance.innerText = "Failed to load";
    console.error(err);
  }
}

// === MENU SECTION HANDLERS ===
const sectionHandlers = {
  profile: async () => {
    try {
      actionSection.innerHTML = `<p class="text-gray-500">Loading profile...</p>`;
      const res = await fetch(`${baseURL}/dashboard/stats`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const stats = await res.json();

      actionSection.innerHTML = `
        <div class="bg-white p-4 rounded shadow">
          <h3 class="font-semibold text-lg mb-2">Your Profile</h3>
          <p><strong>Email:</strong> ${currentUser.email}</p>
          <p><strong>Full Name:</strong> ${currentUser.full_name || "N/A"}</p>
          <p><strong>Points:</strong> ${stats.points_balance}</p>
        </div>
      `;
    } catch (err) {
      actionSection.innerHTML = `<p class="text-red-500">Failed to load profile.</p>`;
    }
  },

  transfer: () => {
    actionSection.innerHTML = `
      <form id="transferForm" class="bg-white p-4 rounded shadow space-y-4">
        <h3 class="text-lg font-semibold">Transfer Points</h3>
        <input type="email" name="to_email" placeholder="Recipient Email" required class="w-full border p-2 rounded" />
        <input type="number" name="amount" placeholder="Amount" required class="w-full border p-2 rounded" />
        <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded">Transfer</button>
      </form>
    `;

    const form = document.getElementById("transferForm");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const to_email = form.to_email.value;
      const amount = parseInt(form.amount.value);

      try {
        const res = await fetch(`${baseURL}/points/transfer`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ to_email, amount }),
        });

        const result = await res.json();
        if (!res.ok) throw new Error(result.detail || "Transfer failed");

        alert("Transfer successful");
        loadStats();
      } catch (err) {
        alert("Transfer failed: " + err.message);
      }
    });
  },

  redeem: async () => {
    try {
      const rateRes = await fetch(`${baseURL}/redemption/rates`);
      const rates = await rateRes.json();

      actionSection.innerHTML = `
        <form id="redeemForm" class="bg-white p-4 rounded shadow space-y-4">
          <h3 class="text-lg font-semibold">Redeem Points</h3>
          <select name="type" required class="w-full border p-2 rounded">
            <option value="">Select Redemption Type</option>
            <option value="bitcoin">Bitcoin</option>
            <option value="gift_card">Gift Card</option>
          </select>
          <input type="number" name="points_amount" placeholder="Points Amount" required class="w-full border p-2 rounded" />
          <input type="text" name="wallet_address" placeholder="Wallet or Email (Gift card)" required class="w-full border p-2 rounded" />
          <button type="submit" class="bg-green-600 text-white px-4 py-2 rounded">Redeem</button>
          <p class="text-sm text-gray-600 mt-2">BTC Rate: ${rates.bitcoin_rate}, Gift Card Rate: ${rates.gift_card_rate}</p>
        </form>
      `;

      const form = document.getElementById("redeemForm");
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const formData = {
          type: form.type.value,
          points_amount: parseInt(form.points_amount.value),
          wallet_address: form.wallet_address.value,
          email_address: currentUser.email
        };

        const res = await fetch(`${baseURL}/redemption/request`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(formData),
        });

        const result = await res.json();
        if (!res.ok) throw new Error(result.detail || "Redemption failed");

        alert("Redemption request submitted");
        loadStats();
      });
    } catch (err) {
      actionSection.innerHTML = `<p class="text-red-500">Failed to load redemption form.</p>`;
    }
  },

  history: async () => {
    try {
      actionSection.innerHTML = `<p class="text-gray-500">Loading history...</p>`;
      const res = await fetch(`${baseURL}/points/history`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();

      actionSection.innerHTML = `
        <div class="bg-white p-4 rounded shadow">
          <h3 class="text-lg font-semibold mb-3">Transfer History</h3>
          <p>Total Sent: ${data.total_sent} | Total Received: ${data.total_received}</p>
          <ul class="mt-3 space-y-2">
            ${data.transfers.map(
              (t) => `<li class="border p-2 rounded">
                From: ${t.from_user_id} → To: ${t.to_user_id} — ${t.amount} points
              </li>`
            ).join("")}
          </ul>
        </div>
      `;
    } catch (err) {
      actionSection.innerHTML = `<p class="text-red-500">Failed to load history</p>`;
    }
  },

  password: () => {
    actionSection.innerHTML = `
      <form id="changePasswordForm" class="bg-white p-4 rounded shadow space-y-4">
        <h3 class="text-lg font-semibold">Change Password</h3>
        <input type="password" name="old_password" placeholder="Old Password" required class="w-full border p-2 rounded" />
        <input type="password" name="new_password" placeholder="New Password" required class="w-full border p-2 rounded" />
        <button type="submit" class="bg-purple-600 text-white px-4 py-2 rounded">Change</button>
      </form>
    `;

    const form = document.getElementById("changePasswordForm");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      alert("Password change logic not implemented yet.");
    });
  },

  pin: () => {
    actionSection.innerHTML = `
      <form id="changePinForm" class="bg-white p-4 rounded shadow space-y-4">
        <h3 class="text-lg font-semibold">Change PIN</h3>
        <input type="password" name="old_pin" placeholder="Old PIN" required class="w-full border p-2 rounded" />
        <input type="password" name="new_pin" placeholder="New PIN" required class="w-full border p-2 rounded" />
        <button type="submit" class="bg-pink-600 text-white px-4 py-2 rounded">Change PIN</button>
      </form>
    `;

    const form = document.getElementById("changePinForm");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      alert("PIN change logic not implemented yet.");
    });
  },

  logout: () => {
    sessionStorage.clear();
    window.location.href = "/login";
  }
};

// === Bind menu item click events ===
document.querySelectorAll("[data-section]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const section = btn.getAttribute("data-section");
    if (sectionHandlers[section]) {
      menuList.classList.add("hidden");
      sectionHandlers[section]();
    }
  });
});

// Initial load
loadStats();
