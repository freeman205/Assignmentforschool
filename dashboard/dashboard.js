document.addEventListener("DOMContentLoaded", () => {
  const menuButton = document.getElementById("menuButton");
  const menuDropdown = document.getElementById("menuDropdown");
  const actionSection = document.getElementById("actionSection");

  const accessToken = sessionStorage.getItem("accessToken");
  const currentUser = JSON.parse(sessionStorage.getItem("currentUser"));
  const apiBase = "https://dansog-backend.onrender.com/api";

  if (!accessToken || !currentUser) {
    window.location.href = "/login.html";
    return;
  }

  // Toggle menu
  menuButton.addEventListener("click", (e) => {
    e.stopPropagation();
    menuDropdown.classList.toggle("hidden");
  });

  // Close menu on click outside
  document.addEventListener("click", (e) => {
    if (!menuButton.contains(e.target)) {
      menuDropdown.classList.add("hidden");
    }
  });

  // Fetch Dashboard Stats
  const loadDashboardStats = async () => {
    try {
      const res = await fetch(`${apiBase}/dashboard/stats`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const stats = await res.json();

      document.getElementById("walletBalance").innerText = stats.points_balance;
      document.getElementById("surveyPlaceholder").innerHTML = `
        <div class="text-sm text-gray-600">
          Completed Surveys: ${stats.completed_surveys} |
          Total Earned: ${stats.total_earned} |
          Pending Redemptions: ${stats.pending_redemptions}
        </div>`;
    } catch (err) {
      console.error("Failed to load stats", err);
    }
  };

  // Load profile
  const loadProfile = async () => {
    const res = await fetch(`${apiBase}/dashboard/stats`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const stats = await res.json();

    actionSection.innerHTML = `
      <div class="bg-white p-4 rounded shadow">
        <h3 class="text-lg font-semibold mb-2">Profile Info</h3>
        <p><strong>Email:</strong> ${currentUser.email}</p>
        <p><strong>Full Name:</strong> ${currentUser.full_name || "N/A"}</p>
        <p><strong>Points Balance:</strong> ${stats.points_balance}</p>
      </div>`;
  };

  const loadTransferForm = () => {
    actionSection.innerHTML = `
      <div class="bg-white p-4 rounded shadow">
        <h3 class="font-semibold mb-2">Transfer Points</h3>
        <input id="toEmail" type="email" placeholder="Recipient Email" class="input" />
        <input id="transferAmount" type="number" placeholder="Amount" class="input mt-2" />
        <button id="submitTransfer" class="btn mt-2">Send</button>
      </div>`;
    
    document.getElementById("submitTransfer").addEventListener("click", async () => {
      const toEmail = document.getElementById("toEmail").value;
      const amount = parseInt(document.getElementById("transferAmount").value);

      try {
        const res = await fetch(`${apiBase}/points/transfer`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ to_email: toEmail, amount }),
        });

        const data = await res.json();
        alert(data.message || "Transfer successful");
        loadDashboardStats();
      } catch (err) {
        alert("Transfer failed.");
      }
    });
  };

  const loadChangePasswordForm = () => {
    actionSection.innerHTML = `
      <div class="bg-white p-4 rounded shadow">
        <h3 class="font-semibold mb-2">Change Password</h3>
        <input id="oldPassword" type="password" placeholder="Old Password" class="input" />
        <input id="newPassword" type="password" placeholder="New Password" class="input mt-2" />
        <button id="submitPassword" class="btn mt-2">Update</button>
      </div>`;

    document.getElementById("submitPassword").addEventListener("click", async () => {
      const oldPassword = document.getElementById("oldPassword").value;
      const newPassword = document.getElementById("newPassword").value;

      try {
        const res = await fetch(`${apiBase}/auth/change-password`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
        });

        const data = await res.json();
        alert(data.message || "Password changed");
      } catch (err) {
        alert("Failed to change password.");
      }
    });
  };

  const loadChangePinForm = () => {
    actionSection.innerHTML = `
      <div class="bg-white p-4 rounded shadow">
        <h3 class="font-semibold mb-2">Change PIN</h3>
        <input id="oldPin" type="password" placeholder="Old PIN" class="input" />
        <input id="newPin" type="password" placeholder="New PIN" class="input mt-2" />
        <button id="submitPin" class="btn mt-2">Change PIN</button>
      </div>`;

    document.getElementById("submitPin").addEventListener("click", async () => {
      const old_pin = document.getElementById("oldPin").value;
      const new_pin = document.getElementById("newPin").value;

      try {
        const res = await fetch(`${apiBase}/auth/change-pin`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ old_pin, new_pin }),
        });

        const data = await res.json();
        alert(data.message || "PIN updated");
      } catch (err) {
        alert("Failed to change PIN.");
      }
    });
  };

  const loadRedemptionForm = async () => {
    const res = await fetch(`${apiBase}/redemption/rates`);
    const rates = await res.json();

    actionSection.innerHTML = `
      <div class="bg-white p-4 rounded shadow">
        <h3 class="font-semibold mb-2">Redeem Points</h3>
        <select id="redeemType" class="input mb-2">
          <option value="bitcoin">Bitcoin (${rates.bitcoin_rate} BTC/point)</option>
          <option value="giftcard">Gift Card (${rates.gift_card_rate} USD/point)</option>
        </select>
        <input id="redeemAmount" type="number" placeholder="Points" class="input mb-2" />
        <input id="walletAddress" type="text" placeholder="Wallet/Email Address" class="input mb-2" />
        <button id="submitRedemption" class="btn">Redeem</button>
      </div>`;

    document.getElementById("submitRedemption").addEventListener("click", async () => {
      const type = document.getElementById("redeemType").value;
      const points_amount = parseInt(document.getElementById("redeemAmount").value);
      const wallet_address = document.getElementById("walletAddress").value;

      try {
        const res = await fetch(`${apiBase}/redemption/request`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            type,
            points_amount,
            wallet_address,
            email_address: currentUser.email,
          }),
        });

        const data = await res.json();
        alert(data.message || "Redemption requested");
        loadDashboardStats();
      } catch (err) {
        alert("Redemption failed");
      }
    });
  };

  const logout = () => {
    sessionStorage.clear();
    window.location.href = "/login.html";
  };

  // Menu Handlers
  const sectionHandlers = {
    profile: loadProfile,
    "transfer-history": () => alert("Transfer history not implemented yet."),
    "redeem-points": loadRedemptionForm,
    "transfer-points": loadTransferForm,
    "change-password": loadChangePasswordForm,
    "change-pin": loadChangePinForm,
    logout: logout,
  };

  // Menu Clicks
  document.querySelectorAll("[data-section]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const section = btn.getAttribute("data-section");
      if (sectionHandlers[section]) sectionHandlers[section]();
      menuDropdown.classList.add("hidden");
    });
  });

  loadDashboardStats();
});
