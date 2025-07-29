document.addEventListener('DOMContentLoaded', () => {
  const apiUrl = 'https://dansog-backend.onrender.com/api';
  const accessToken = sessionStorage.getItem('accessToken');
  const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));

  const menuToggle = document.getElementById('menuToggle');
  const sideMenu = document.getElementById('sideMenu');
  const walletBalanceEl = document.getElementById('walletBalance');
  const actionSection = document.getElementById('actionSection');

  // Toggle side menu
menuToggle.addEventListener('click', (e) => {
  e.stopPropagation();
  sideMenu.classList.toggle('hidden');
});

// Close side menu on outside click
document.addEventListener('click', (e) => {
  if (!sideMenu.contains(e.target) && e.target !== menuToggle) {
    sideMenu.classList.add('hidden');
  }
});

  // Handle menu item clicks
  document.querySelectorAll('[data-section]').forEach(item => {
    item.addEventListener('click', (e) => {
      const section = e.currentTarget.dataset.section;
      sideMenu.classList.add('-translate-x-full');
      handleMenuAction(section);
    });
  });

  // Load wallet balance
  async function loadDashboardStats() {
    try {
      const res = await fetch(`${apiUrl}/dashboard/stats`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (!res.ok) throw new Error("Stats error");
      const data = await res.json();
      walletBalanceEl.textContent = `${data.points_balance} pts`;
    } catch (err) {
      walletBalanceEl.textContent = "Error loading";
      console.error("Wallet error:", err);
    }
  }

  // Section handler
  async function handleMenuAction(section) {
  actionSection.innerHTML = '';

  const accessToken = sessionStorage.getItem('accessToken'); // Re-fetch here!

  if (!accessToken) {
    actionSection.innerHTML = `<p class="text-red-500">You must be logged in.</p>`;
    return;
  }

  switch (section) {
    case 'profile':
      await loadProfile(accessToken);
      break;
    case 'history':
      await loadHistory(accessToken);
      break;
    case 'redeem':
      await loadRedemptionForm(accessToken);
      break;
    case 'transfer':
      loadTransferForm(accessToken);
      break;
    case 'password':
      loadPasswordForm(accessToken);
      break;
    case 'pin':
      loadPinForm(accessToken);
      break;
    case 'logout':
      sessionStorage.clear();
      window.location.href = '/login';
      break;
    default:
      actionSection.innerHTML = `<p class="text-red-500">Unknown section selected.</p>`;
  }
  }

  async function loadProfile() {
  try {
    const res = await fetch(`${apiUrl}/users/me`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const user = await res.json();
actionSection.innerHTML = `
  <div class="bg-white p-6 rounded-lg shadow">
    <h3 class="text-lg font-bold mb-2">Your Profile</h3>
    <p><strong>Email:</strong> ${user.email}</p>
    <p><strong>Full Name:</strong> ${user.name || 'N/A'}</p>
    <p><strong>Status:</strong> ${user.status}</p>
    <p><strong>Points Balance:</strong> ${user.points_balance}</p>
    <p><strong>Referral Code:</strong> ${user.referral_code || 'N/A'}</p>
    <p><strong>Email Verified:</strong> ${user.email_verified ? 'Yes' : 'No'}</p>
    <p><strong>Admin:</strong> ${user.is_admin ? 'Yes' : 'No'}</p>
    <p><strong>Agent:</strong> ${user.is_agent ? 'Yes' : 'No'}</p>
    <p><strong>Created At:</strong> ${new Date(user.created_at).toLocaleString()}</p>
  </div>
`;
  } catch {
    actionSection.innerHTML = 'Failed to load profile.';
  }
  }

  async function loadHistory() {
  try {
    const res = await fetch(`${apiUrl}/points/history`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const data = await res.json();

    actionSection.innerHTML = `
  <div class="bg-white p-6 rounded-lg shadow">
    <h3 class="text-lg font-bold mb-2">Transfer History</h3>
    <ul class="space-y-2">
      ${data.transfers.map(item => {
        const isSender = item.from_user.email === currentUser.email;
        const direction = isSender ? 'to' : 'from';
        const otherParty = isSender ? item.to_user : item.from_user;

        return `
          <li class="text-sm text-gray-700">
            <strong>${item.amount} pts</strong> ${direction} <strong>${otherParty.name} (${otherParty.email})</strong>
            on <em>${new Date(item.created_at).toLocaleString()}</em>
          </li>
        `;
      }).join('')}
    </ul>

    <div class="mt-4 text-sm text-gray-600">
      <p><strong>Total Sent:</strong> ${data.total_sent} pts</p>
      <p><strong>Total Received:</strong> ${data.total_received} pts</p>
    </div>
  </div>
`;
  } catch {
    actionSection.innerHTML = 'Failed to load transfer history.';
  }
  }

  async function loadRedemptionForm() {
  try {
    const res = await fetch(`${apiUrl}/redemption/rates`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const rates = await res.json();
    const btcPtsPerDollar = (1 / parseFloat(rates.bitcoin_rate)).toFixed(0);
    const giftPtsPerDollar = (1 / parseFloat(rates.gift_card_rate)).toFixed(0);

    actionSection.innerHTML = `
      <div class="bg-white p-6 rounded-lg shadow">
        <h3 class="text-lg font-bold mb-4">Redeem Points</h3>
        <form id="redeemForm" class="space-y-4">
          <select name="type" class="w-full border p-2 rounded">
            <option value="btc">Bitcoin (${btcPtsPerDollar} pts/$)</option>
            <option value="giftcard">Gift Card (${giftPtsPerDollar} pts/$)</option>
          </select>
          <input name="amount" type="number" placeholder="Points to redeem" class="w-full border p-2 rounded" required />
          <input name="destination" placeholder="Wallet (BTC) or Email (Gift Card)" class="w-full border p-2 rounded" required />
          <button class="bg-blue-600 text-white px-4 py-2 rounded">Redeem</button>
        </form>
      </div>
    `;

    // ✅ Corrected payload keys
    document.getElementById('redeemForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      const type = form.type.value;
      const amount = parseFloat(form.amount.value);
      const destination = form.destination.value;

      const payload = {
        type,
        points_amount: amount,
        ...(type === "btc" && { wallet_address: destination }),
        ...(type === "giftcard" && { email_address: destination })
      };

      try {
        const r = await fetch(`${apiUrl}/redemption/request`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const result = await r.json();
        if (r.ok) {
          alert("Redemption request submitted");
        } else {
          alert(`Failed to redeem: ${result.detail || 'Unknown error'}`);
        }
      } catch (err) {
        alert("Error redeeming");
        console.error(err);
      }
    });

  } catch {
    actionSection.innerHTML = 'Failed to load rates.';
  }
  }

  function loadTransferForm() {
    actionSection.innerHTML = `
      <div class="bg-white p-6 rounded-lg shadow">
        <h3 class="text-lg font-bold mb-4">Transfer Points</h3>
        <form id="transferForm" class="space-y-4">
          <input name="receiver_email" placeholder="Receiver Email" class="w-full border p-2 rounded" required />
          <input name="amount" type="number" placeholder="Amount" class="w-full border p-2 rounded" required />
          <button class="bg-green-600 text-white px-4 py-2 rounded">Send</button>
        </form>
      </div>
    `;
    document.getElementById('transferForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      const payload = {
        receiver_email: form.receiver_email.value,
        amount: parseInt(form.amount.value)
      };
      try {
        const res = await fetch(`${apiUrl}/points/transfer`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
        alert(res.ok ? 'Transfer successful' : 'Transfer failed');
      } catch {
        alert('Transfer error');
      }
    });
  }

  function loadPasswordForm() {
    actionSection.innerHTML = `
      <div class="bg-white p-6 rounded-lg shadow">
        <h3 class="text-lg font-bold mb-4">Change Password</h3>
        <form id="passwordForm" class="space-y-4">
          <input type="password" name="old_password" placeholder="Old Password" class="w-full border p-2 rounded" required />
          <input type="password" name="new_password" placeholder="New Password" class="w-full border p-2 rounded" required />
          <button class="bg-yellow-500 text-white px-4 py-2 rounded">Change</button>
        </form>
      </div>
    `;
    document.getElementById('passwordForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      const payload = {
        old_password: form.old_password.value,
        new_password: form.new_password.value
      };
      try {
        const res = await fetch(`${apiUrl}/auth/change-password`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
        alert(res.ok ? "Password changed" : "Password change failed");
      } catch {
        alert("Password error");
      }
    });
  }

  function loadPinForm() {
    actionSection.innerHTML = `
      <div class="bg-white p-6 rounded-lg shadow">
        <h3 class="text-lg font-bold mb-4">Change PIN</h3>
        <form id="pinForm" class="space-y-4">
          <input type="password" name="old_pin" placeholder="Old PIN" class="w-full border p-2 rounded" required />
          <input type="password" name="new_pin" placeholder="New PIN" class="w-full border p-2 rounded" required />
          <button class="bg-purple-600 text-white px-4 py-2 rounded">Change</button>
        </form>
      </div>
    `;
    document.getElementById('pinForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      const payload = {
        old_pin: form.old_pin.value,
        new_pin: form.new_pin.value
      };
      try {
        const res = await fetch(`${apiUrl}/auth/change-pin`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
        alert(res.ok ? "PIN changed" : "PIN change failed");
      } catch {
        alert("PIN error");
      }
    });
  }

  loadDashboardStats();
});
