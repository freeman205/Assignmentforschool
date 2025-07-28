// dashboard.js

const API_BASE_URL = "https://dansog-backend.onrender.com/api";

// Get session values
const accessToken = sessionStorage.getItem("accessToken");
const currentUser = JSON.parse(sessionStorage.getItem("currentUser"));

if (!accessToken || !currentUser) {
  window.location.href = "/login";
}

const menuToggle = document.getElementById("menuToggle");
const sideMenu = document.getElementById("sideMenu");
const actionSection = document.getElementById("actionSection");

menuToggle.addEventListener("click", () => {
  sideMenu.classList.toggle("hidden");
});

document.addEventListener("click", (e) => {
  if (!sideMenu.contains(e.target) && !menuToggle.contains(e.target)) {
    sideMenu.classList.add("hidden");
  }
});

async function loadWalletBalance() {
  try {
    const response = await fetch(`${API_BASE_URL}/users/wallet`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await response.json();
    document.getElementById("walletBalance").textContent = `${data.balance} points`;
  } catch {
    document.getElementById("walletBalance").textContent = "Error loading balance";
  }
}

const sectionHandlers = {
  profile: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/users/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const user = await res.json();
      actionSection.innerHTML = `
        <div class="bg-white p-4 shadow rounded">
          <h3 class="font-semibold mb-2">Your Profile</h3>
          <p><strong>Email:</strong> ${user.email}</p>
          <p><strong>Full Name:</strong> ${user.full_name || 'N/A'}</p>
          <p><strong>Status:</strong> ${user.status || 'N/A'}</p>
          <p><strong>Joined:</strong> ${new Date(user.created_at).toLocaleString()}</p>
        </div>
      `;
    } catch {
      actionSection.innerHTML = `<p class="text-red-500">Failed to load profile</p>`;
    }
  },

  history: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/users/transfer-history`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const history = await res.json();
      const rows = history.map(
        (h) => `<tr><td>${h.receiver_email}</td><td>${h.amount}</td><td>${new Date(h.created_at).toLocaleString()}</td></tr>`
      ).join("");
      actionSection.innerHTML = `
        <div class="bg-white p-4 shadow rounded">
          <h3 class="font-semibold mb-2">Transfer History</h3>
          <table class="table-auto w-full text-sm">
            <thead><tr><th>Receiver</th><th>Amount</th><th>Date</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      `;
    } catch {
      actionSection.innerHTML = `<p class="text-red-500">Failed to load history</p>`;
    }
  },

  redeem: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/users/redeemable`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      actionSection.innerHTML = `
        <div class="bg-white p-4 shadow rounded">
          <h3 class="font-semibold mb-2">Redeemable Points</h3>
          <p>You can redeem: <strong>${data.redeemable} points</strong></p>
          <button id="redeemBtn" class="bg-blue-500 text-white px-4 py-2 rounded mt-2">Redeem Now</button>
          <div id="redeemMsg" class="mt-2 text-sm"></div>
        </div>
      `;

      document.getElementById("redeemBtn").addEventListener("click", async () => {
        try {
          const r = await fetch(`${API_BASE_URL}/users/redeem`, {
            method: "POST",
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          const d = await r.json();
          const msg = document.getElementById("redeemMsg");
          if (r.ok) {
            msg.textContent = "Redeemed successfully!";
            msg.className = "text-green-600";
            loadWalletBalance();
          } else {
            msg.textContent = d.detail || "Redemption failed.";
            msg.className = "text-red-600";
          }
        } catch {
          document.getElementById("redeemMsg").textContent = "Network error.";
        }
      });
    } catch {
      actionSection.innerHTML = `<p class="text-red-500">Failed to load redeemable info</p>`;
    }
  },

  transfer: () => {
    actionSection.innerHTML = `
      <div class="bg-white p-4 shadow rounded">
        <h3 class="font-semibold mb-2">Transfer Points</h3>
        <form id="transferForm" class="space-y-3">
          <input type="email" id="receiver" placeholder="Receiver Email" class="w-full p-2 border rounded" required />
          <input type="number" id="amount" placeholder="Amount" class="w-full p-2 border rounded" required />
          <button type="submit" class="bg-blue-500 text-white px-4 py-2 rounded">Transfer</button>
        </form>
        <div id="transferMessage" class="mt-2 text-sm"></div>
      </div>
    `;

    document.getElementById("transferForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const receiver = document.getElementById("receiver").value;
      const amount = document.getElementById("amount").value;
      const msg = document.getElementById("transferMessage");

      try {
        const res = await fetch(`${API_BASE_URL}/users/transfer`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ receiver_email: receiver, amount: Number(amount) }),
        });
        const data = await res.json();
        if (res.ok) {
          msg.textContent = "Transfer successful.";
          msg.className = "text-green-600 mt-2";
          loadWalletBalance();
        } else {
          msg.textContent = data.detail || "Transfer failed.";
          msg.className = "text-red-600 mt-2";
        }
      } catch {
        msg.textContent = "Network error.";
        msg.className = "text-red-600 mt-2";
      }
    });
  },

  password: () => {
    actionSection.innerHTML = `
      <div class="bg-white p-4 shadow rounded">
        <h3 class="font-semibold mb-2">Change Password</h3>
        <form id="passwordForm" class="space-y-3">
          <input type="password" id="oldPassword" placeholder="Current Password" class="w-full p-2 border rounded" required />
          <input type="password" id="newPassword" placeholder="New Password" class="w-full p-2 border rounded" required />
          <button type="submit" class="bg-green-500 text-white px-4 py-2 rounded">Change Password</button>
        </form>
        <div id="passwordMessage" class="mt-2 text-sm"></div>
      </div>
    `;

    document.getElementById("passwordForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const oldPassword = document.getElementById("oldPassword").value;
      const newPassword = document.getElementById("newPassword").value;
      const msg = document.getElementById("passwordMessage");

      try {
        const res = await fetch(`${API_BASE_URL}/auth/change-password`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
        });
        const data = await res.json();
        if (res.ok) {
          msg.textContent = "Password changed successfully.";
          msg.className = "text-green-600";
        } else {
          msg.textContent = data.detail || "Password change failed.";
          msg.className = "text-red-600";
        }
      } catch {
        msg.textContent = "Network error.";
        msg.className = "text-red-600";
      }
    });
  },

  pin: () => {
    actionSection.innerHTML = `
      <div class="bg-white p-4 shadow rounded">
        <h3 class="font-semibold mb-2">Change PIN</h3>
        <form id="pinForm" class="space-y-3">
          <input type="password" id="oldPin" placeholder="Current PIN" class="w-full p-2 border rounded" required />
          <input type="password" id="newPin" placeholder="New PIN" class="w-full p-2 border rounded" required />
          <button type="submit" class="bg-yellow-500 text-white px-4 py-2 rounded">Change PIN</button>
        </form>
        <div id="pinMessage" class="mt-2 text-sm"></div>
      </div>
    `;

    document.getElementById("pinForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const oldPin = document.getElementById("oldPin").value;
      const newPin = document.getElementById("newPin").value;
      const msg = document.getElementById("pinMessage");

      try {
        const res = await fetch(`${API_BASE_URL}/auth/change-pin`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ old_pin: oldPin, new_pin: newPin }),
        });
        const data = await res.json();
        if (res.ok) {
          msg.textContent = "PIN changed successfully.";
          msg.className = "text-green-600";
        } else {
          msg.textContent = data.detail || "PIN change failed.";
          msg.className = "text-red-600";
        }
      } catch {
        msg.textContent = "Network error.";
        msg.className = "text-red-600";
      }
    });
  },

  logout: () => {
    sessionStorage.clear();
    window.location.href = "/login";
  }
};

document.querySelectorAll(".menu-item").forEach((item) => {
  item.addEventListener("click", () => {
    const section = item.dataset.section;
    if (sectionHandlers[section]) {
      sectionHandlers[section]();
      sideMenu.classList.add("hidden");
    }
  });
});

loadWalletBalance();
