const API_BASE_URL = "https://dansog-backend.onrender.com/API";

const menuToggle = document.getElementById("menuToggle");
const sideMenu = document.getElementById("sideMenu");
const mainContent = document.getElementById("mainContent");
const walletBalance = document.getElementById("walletBalance");
const actionSection = document.getElementById("actionSection");

// Toggle menu logic
menuToggle.addEventListener("click", () => {
  sideMenu.classList.toggle("hidden");
});

document.addEventListener("click", (e) => {
  if (!sideMenu.contains(e.target) && !menuToggle.contains(e.target)) {
    sideMenu.classList.add("hidden");
  }
});

// Load wallet balance
async function fetchWalletBalance() {
  const token = sessionStorage.getItem("accessToken");
  const email = sessionStorage.getItem("email");

  if (!token || !email) {
    walletBalance.textContent = "Not logged in";
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/wallet/${email}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    walletBalance.textContent = `${data.balance} points`;
  } catch (error) {
    walletBalance.textContent = "Error fetching balance";
  }
}

fetchWalletBalance();

// Menu actions
const menuItems = document.querySelectorAll(".menu-item");
menuItems.forEach((item) => {
  item.addEventListener("click", () => {
    sideMenu.classList.add("hidden");
    const section = item.getAttribute("data-section");
    handleSection(section);
  });
});

function handleSection(section) {
  switch (section) {
    case "transfer":
      renderTransferForm();
      break;
    case "password":
      renderChangePasswordForm();
      break;
    default:
      actionSection.innerHTML = `<p class='text-gray-600'>${section} section coming soon...</p>`;
  }
}

function renderTransferForm() {
  actionSection.innerHTML = `
    <div class="bg-white p-4 rounded shadow">
      <h3 class="text-lg font-semibold mb-2">Transfer Points</h3>
      <form id="transferForm" class="space-y-4">
        <input type="email" id="recipientEmail" placeholder="Recipient Email" class="w-full p-2 border rounded" required>
        <input type="number" id="pointsAmount" placeholder="Points to Transfer" class="w-full p-2 border rounded" required>
        <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded">Transfer</button>
      </form>
      <div id="transferMsg" class="mt-2 text-sm"></div>
    </div>
  `;

  document.getElementById("transferForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const token = sessionStorage.getItem("accessToken");
    const email = sessionStorage.getItem("email");
    const to = document.getElementById("recipientEmail").value;
    const points = document.getElementById("pointsAmount").value;
    const msg = document.getElementById("transferMsg");

    try {
      const res = await fetch(`${API_BASE_URL}/transfer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ from: email, to, points }),
      });

      const result = await res.json();
      if (res.ok) {
        msg.textContent = "Transfer successful!";
        fetchWalletBalance();
      } else {
        msg.textContent = result.detail || "Transfer failed.";
      }
    } catch (err) {
      msg.textContent = "Error occurred.";
    }
  });
}

function renderChangePasswordForm() {
  actionSection.innerHTML = `
    <div class="bg-white p-4 rounded shadow">
      <h3 class="text-lg font-semibold mb-2">Change Password</h3>
      <form id="passwordForm" class="space-y-4">
        <input type="password" id="oldPassword" placeholder="Old Password" class="w-full p-2 border rounded" required>
        <input type="password" id="newPassword" placeholder="New Password" class="w-full p-2 border rounded" required>
        <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded">Change</button>
      </form>
      <div id="passwordMsg" class="mt-2 text-sm"></div>
    </div>
  `;

  document.getElementById("passwordForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const token = sessionStorage.getItem("accessToken");
    const email = sessionStorage.getItem("email");
    const oldPassword = document.getElementById("oldPassword").value;
    const newPassword = document.getElementById("newPassword").value;
    const msg = document.getElementById("passwordMsg");

    try {
      const res = await fetch(`${API_BASE_URL}/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email, old_password: oldPassword, new_password: newPassword }),
      });

      const result = await res.json();
      msg.textContent = res.ok ? "Password updated." : (result.detail || "Failed to update.");
    } catch (err) {
      msg.textContent = "Error occurred.";
    }
  });
}
