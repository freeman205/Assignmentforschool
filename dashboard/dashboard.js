// Base API URL
const API_BASE = "https://dansog-backend.onrender.com/api";
const token = sessionStorage.getItem("accessToken");
const currentUser = JSON.parse(sessionStorage.getItem("currentUser"));
const headers = {
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json"
};

const walletContainer = document.getElementById("wallet-balance");
const actionSection = document.getElementById("action-section");

// Fetch dashboard stats
async function loadDashboardStats() {
  try {
    const res = await fetch(`${API_BASE}/dashboard/stats`, { headers });
    const data = await res.json();
    walletContainer.innerHTML = `
      <div class="bg-white rounded shadow p-4 mb-4">
        <h2 class="text-xl font-bold">Wallet Balance</h2>
        <p><strong>Points:</strong> ${data.points_balance}</p>
        <p><strong>Completed Surveys:</strong> ${data.completed_surveys}</p>
        <p><strong>Total Earned:</strong> ${data.total_earned}</p>
        <p><strong>Pending Redemptions:</strong> ${data.pending_redemptions}</p>
      </div>
    `;
  } catch (err) {
    console.error("Failed to fetch dashboard stats", err);
  }
}

// Section handlers
const sectionHandlers = {
  profile: async () => {
    actionSection.innerHTML = `<div class="bg-white p-4 shadow rounded">Loading...</div>`;
    const email = currentUser.email;
    try {
      const res = await fetch(`${API_BASE}/dashboard/stats`, { headers });
      const stats = await res.json();
      actionSection.innerHTML = `
        <div class="bg-white p-4 shadow rounded">
          <h3 class="font-semibold mb-2">Your Profile</h3>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Full Name:</strong> ${currentUser.full_name || "N/A"}</p>
          <p><strong>Points:</strong> ${stats.points_balance}</p>
          <p><strong>Completed Surveys:</strong> ${stats.completed_surveys}</p>
        </div>
      `;
    } catch (e) {
      console.error("Profile load failed", e);
    }
  },

  history: async () => {
    actionSection.innerHTML = `<div class="bg-white p-4 shadow rounded">Loading history...</div>`;
    try {
      const res = await fetch(`${API_BASE}/points/history`, { headers });
      const data = await res.json();
      const rows = data.transfers.map(t => `
        <tr>
          <td class="border px-2 py-1">${t.from_user_email}</td>
          <td class="border px-2 py-1">${t.to_user_email}</td>
          <td class="border px-2 py-1">${t.amount}</td>
        </tr>
      `).join("");
      actionSection.innerHTML = `
        <div class="bg-white p-4 rounded shadow">
          <h3 class="text-lg font-bold mb-2">Transfer History</h3>
          <table class="w-full text-left border">
            <thead>
              <tr><th>From</th><th>To</th><th>Amount</th></tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      `;
    } catch (e) {
      console.error("Transfer history failed", e);
    }
  },

  transfer: () => {
    actionSection.innerHTML = `
      <div class="bg-white p-4 shadow rounded">
        <h3 class="font-semibold mb-2">Transfer Points</h3>
        <input id="toEmail" class="border p-2 w-full mb-2" placeholder="Recipient Email">
        <input id="amount" type="number" class="border p-2 w-full mb-2" placeholder="Amount">
        <button id="submitTransfer" class="bg-blue-600 text-white p-2 rounded">Send</button>
      </div>
    `;

    document.getElementById("submitTransfer").onclick = async () => {
      const to_email = document.getElementById("toEmail").value;
      const amount = Number(document.getElementById("amount").value);
      try {
        const res = await fetch(`${API_BASE}/points/transfer`, {
          method: "POST",
          headers,
          body: JSON.stringify({ to_email, amount })
        });
        const data = await res.json();
        alert(data.message || "Transfer complete");
        loadDashboardStats();
      } catch (err) {
        alert("Transfer failed");
      }
    };
  },

  redeem: async () => {
    actionSection.innerHTML = `<div class="bg-white p-4">Loading redemption form...</div>`;
    try {
      const res = await fetch(`${API_BASE}/redemption/rates`, { headers });
      const rates = await res.json();
      actionSection.innerHTML = `
        <div class="bg-white p-4 shadow rounded">
          <h3 class="mb-2 font-bold">Redeem Points</h3>
          <select id="redeemType" class="border p-2 mb-2 w-full">
            <option value="bitcoin">Bitcoin</option>
            <option value="giftcard">Gift Card</option>
          </select>
          <input id="redeemAmount" type="number" class="border p-2 w-full mb-2" placeholder="Amount">
          <input id="walletAddress" class="border p-2 w-full mb-2" placeholder="Wallet Address">
          <input id="emailAddress" class="border p-2 w-full mb-2" placeholder="Email Address">
          <button id="submitRedeem" class="bg-green-600 text-white p-2 rounded">Redeem</button>
        </div>
      `;

      document.getElementById("submitRedeem").onclick = async () => {
        const body = {
          type: document.getElementById("redeemType").value,
          points_amount: Number(document.getElementById("redeemAmount").value),
          wallet_address: document.getElementById("walletAddress").value,
          email_address: document.getElementById("emailAddress").value
        };

        try {
          const res = await fetch(`${API_BASE}/redemption/request`, {
            method: "POST",
            headers,
            body: JSON.stringify(body)
          });
          const data = await res.json();
          alert(data.message || "Redeem request submitted");
          loadDashboardStats();
        } catch (e) {
          alert("Redeem failed");
        }
      };
    } catch (e) {
      alert("Failed to load redemption rates");
    }
  },

  changePassword: () => {
    actionSection.innerHTML = `
      <div class="bg-white p-4 shadow rounded">
        <h3 class="font-bold mb-2">Change Password</h3>
        <input type="password" id="oldPassword" class="border p-2 w-full mb-2" placeholder="Old Password">
        <input type="password" id="newPassword" class="border p-2 w-full mb-2" placeholder="New Password">
        <button class="bg-purple-600 text-white p-2 rounded" id="changePassBtn">Change</button>
      </div>
    `;

    document.getElementById("changePassBtn").onclick = async () => {
      const oldPassword = document.getElementById("oldPassword").value;
      const newPassword = document.getElementById("newPassword").value;
      try {
        const res = await fetch(`${API_BASE}/auth/change-password`, {
          method: "POST",
          headers,
          body: JSON.stringify({ old_password: oldPassword, new_password: newPassword })
        });
        const data = await res.json();
        alert(data.message || "Password changed");
      } catch (e) {
        alert("Password change failed");
      }
    };
  },

  changePin: () => {
    actionSection.innerHTML = `
      <div class="bg-white p-4 shadow rounded">
        <h3 class="font-bold mb-2">Change PIN</h3>
        <input type="password" id="oldPin" class="border p-2 w-full mb-2" placeholder="Old PIN">
        <input type="password" id="newPin" class="border p-2 w-full mb-2" placeholder="New PIN">
        <button class="bg-yellow-600 text-white p-2 rounded" id="changePinBtn">Update PIN</button>
      </div>
    `;

    document.getElementById("changePinBtn").onclick = async () => {
      const old_pin = document.getElementById("oldPin").value;
      const new_pin = document.getElementById("newPin").value;
      try {
        const res = await fetch(`${API_BASE}/auth/change-pin`, {
          method: "POST",
          headers,
          body: JSON.stringify({ old_pin, new_pin })
        });
        const data = await res.json();
        alert(data.message || "PIN updated");
      } catch (e) {
        alert("PIN update failed");
      }
    };
  }
};

// Event delegation for toggle buttons
document.querySelectorAll(".menu-item").forEach(item => {
  item.addEventListener("click", () => {
    const section = item.dataset.section;
    if (sectionHandlers[section]) sectionHandlers[section]();
  });
});

// Auto-load dashboard info
loadDashboardStats();
