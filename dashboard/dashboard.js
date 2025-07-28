// dashboard.js
const API_BASE = "https://dansog-backend.onrender.com/API";

// Session storage access
const accessToken = sessionStorage.getItem("accessToken");
const userEmail = sessionStorage.getItem("email");

// Global auth header
const authHeaders = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${accessToken}`,
};

// DOM references
const menuToggle = document.getElementById("menuToggle");
const sideMenu = document.getElementById("sideMenu");
const menuItems = document.querySelectorAll(".menu-item");
const actionSection = document.getElementById("actionSection");
const dashboardHome = document.getElementById("dashboardHome");
const walletBalance = document.getElementById("walletBalance");

// Redirect if session expired
if (!accessToken || !userEmail) {
  alert("Session expired. Please login again.");
  window.location.href = "/login";
}

// Toggle side menu
menuToggle.addEventListener("click", () => {
  sideMenu.classList.toggle("hidden");
});

// Close menu when clicking outside
document.addEventListener("click", (e) => {
  if (!sideMenu.contains(e.target) && e.target !== menuToggle) {
    sideMenu.classList.add("hidden");
  }
});

// Menu item click handler
menuItems.forEach((item) => {
  item.addEventListener("click", async () => {
    const section = item.dataset.section;
    sideMenu.classList.add("hidden");
    dashboardHome.style.display = "none";
    actionSection.innerHTML = `<p class="text-blue-600">Loading ${section}...</p>`;

    switch (section) {
      case "profile": loadProfile(); break;
      case "history": loadTransferHistory(); break;
      case "redeem": showRedeemForm(); break;
      case "transfer": showTransferForm(); break;
      case "password": showChangePasswordForm(); break;
      case "pin": showChangePinForm(); break;
      case "logout": logoutUser(); break;
    }
  });
});

// Load wallet on page load
window.addEventListener("DOMContentLoaded", () => {
  fetch(`${API_BASE}/user/wallet?email=${userEmail}`, { headers: authHeaders })
    .then(res => res.json())
    .then(data => {
      walletBalance.textContent = `${data.points || 0} Points`;
    })
    .catch(() => {
      walletBalance.textContent = "Unable to fetch balance.";
    });
});

// ---- Actions ----
function loadProfile() {
  fetch(`${API_BASE}/user/profile?email=${userEmail}`, { headers: authHeaders })
    .then(res => res.json())
    .then(data => {
      actionSection.innerHTML = `
        <h3 class="font-bold text-lg">Your Profile</h3>
        <pre class="mt-2 bg-gray-50 p-2 rounded">${JSON.stringify(data, null, 2)}</pre>
      `;
    }).catch(() => {
      actionSection.innerHTML = `<p class="text-red-500">Failed to load profile.</p>`;
    });
}

function loadTransferHistory() {
  fetch(`${API_BASE}/transfer/history?email=${userEmail}`, { headers: authHeaders })
    .then(res => res.json())
    .then(data => {
      let html = `<h3 class="font-bold text-lg">Transfer History</h3><ul class="mt-2">`;
      data.forEach(tx => {
        html += `<li>${tx.amount} to ${tx.receiver} on ${tx.date}</li>`;
      });
      html += "</ul>";
      actionSection.innerHTML = html;
    }).catch(() => {
      actionSection.innerHTML = `<p class="text-red-500">Could not fetch history.</p>`;
    });
}

function showRedeemForm() {
  actionSection.innerHTML = `
    <h3 class="font-bold text-lg mb-2">Redeem Points</h3>
    <form onsubmit="redeemPoints(event)">
      <input type="number" id="points" class="border p-2 w-full mb-2" placeholder="Enter points to redeem" required />
      <button type="submit" class="bg-green-500 text-white px-4 py-2 rounded">Redeem</button>
    </form>
  `;
}

function redeemPoints(e) {
  e.preventDefault();
  const points = document.getElementById("points").value;
  fetch(`${API_BASE}/redeem`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ email: userEmail, points }),
  })
    .then(res => res.json())
    .then(() => {
      alert("Redeemed successfully");
      actionSection.innerHTML = "";
      location.reload();
    });
}

function showTransferForm() {
  actionSection.innerHTML = `
    <h3 class="font-bold text-lg mb-2">Transfer Points</h3>
    <form onsubmit="transferPoints(event)">
      <input type="text" id="receiver" class="border p-2 w-full mb-2" placeholder="Receiver username" required />
      <input type="number" id="amount" class="border p-2 w-full mb-2" placeholder="Amount" required />
      <button type="submit" class="bg-blue-500 text-white px-4 py-2 rounded">Transfer</button>
    </form>
  `;
}

function transferPoints(e) {
  e.preventDefault();
  const receiver = document.getElementById("receiver").value;
  const amount = document.getElementById("amount").value;
  fetch(`${API_BASE}/transfer`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ email: userEmail, receiver, amount }),
  })
    .then(res => res.json())
    .then(() => {
      alert("Transfer successful");
      actionSection.innerHTML = "";
      location.reload();
    });
}

function showChangePasswordForm() {
  actionSection.innerHTML = `
    <h3 class="font-bold text-lg mb-2">Change Password</h3>
    <form onsubmit="changePassword(event)">
      <input type="password" id="oldPassword" class="border p-2 w-full mb-2" placeholder="Old Password" required />
      <input type="password" id="newPassword" class="border p-2 w-full mb-2" placeholder="New Password" required />
      <button type="submit" class="bg-yellow-500 text-white px-4 py-2 rounded">Change Password</button>
    </form>
  `;
}

function changePassword(e) {
  e.preventDefault();
  const oldPassword = document.getElementById("oldPassword").value;
  const newPassword = document.getElementById("newPassword").value;
  fetch(`${API_BASE}/user/change-password`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ email: userEmail, oldPassword, newPassword }),
  }).then(() => {
    alert("Password changed successfully");
    actionSection.innerHTML = "";
  });
}

function showChangePinForm() {
  actionSection.innerHTML = `
    <h3 class="font-bold text-lg mb-2">Change PIN</h3>
    <form onsubmit="changePin(event)">
      <input type="password" id="oldPin" class="border p-2 w-full mb-2" placeholder="Old PIN" required />
      <input type="password" id="newPin" class="border p-2 w-full mb-2" placeholder="New PIN" required />
      <button type="submit" class="bg-yellow-600 text-white px-4 py-2 rounded">Change PIN</button>
    </form>
  `;
}

function changePin(e) {
  e.preventDefault();
  const oldPin = document.getElementById("oldPin").value;
  const newPin = document.getElementById("newPin").value;
  fetch(`${API_BASE}/user/change-pin`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ email: userEmail, oldPin, newPin }),
  }).then(() => {
    alert("PIN changed successfully");
    actionSection.innerHTML = "";
  });
}

function logoutUser() {
  sessionStorage.clear();
  alert("Logged out");
  window.location.href = "/login";
}
