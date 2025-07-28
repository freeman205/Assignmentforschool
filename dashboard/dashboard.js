document.addEventListener('DOMContentLoaded', () => {
  const menuBtn = document.getElementById('menu-btn');
  const menu = document.getElementById('menu');
  const actionSection = document.getElementById('action-section');
  const balanceElement = document.getElementById('wallet-balance');
  const baseUrl = 'https://dansog-backend.onrender.com/api';
  const token = sessionStorage.getItem('accessToken');
  const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));

  // ===== TOGGLE MENU FUNCTION =====
  menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.classList.toggle('hidden');
  });

  document.addEventListener('click', (e) => {
    if (!menu.contains(e.target) && !menuBtn.contains(e.target)) {
      menu.classList.add('hidden');
    }
  });

  // ===== FETCH WALLET DATA =====
  async function fetchStats() {
    try {
      const res = await fetch(`${baseUrl}/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      balanceElement.textContent = data.points_balance;
    } catch (err) {
      balanceElement.textContent = 'Error';
      console.error('Wallet Fetch Error:', err);
    }
  }

  // ===== MENU ITEM ACTIONS =====
  const sectionHandlers = {
    profile: async () => {
      try {
        const res = await fetch(`${baseUrl}/dashboard/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();

        actionSection.innerHTML = `
          <div class="bg-white p-4 rounded shadow">
            <h2 class="text-lg font-semibold mb-2">Profile</h2>
            <p><strong>Email:</strong> ${currentUser.email}</p>
            <p><strong>Full Name:</strong> ${currentUser.full_name || 'N/A'}</p>
            <p><strong>Completed Surveys:</strong> ${data.completed_surveys}</p>
            <p><strong>Total Earned:</strong> ${data.total_earned}</p>
            <p><strong>Pending Redemptions:</strong> ${data.pending_redemptions}</p>
          </div>
        `;
      } catch (err) {
        actionSection.innerHTML = `<p>Error loading profile.</p>`;
      }
    },

    transferHistory: async () => {
      try {
        const res = await fetch(`${baseUrl}/points/history`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();

        const rows = data.transfers.map(t => `
          <tr>
            <td>${t.from_user_id === currentUser.id ? 'Sent' : 'Received'}</td>
            <td>${t.amount}</td>
          </tr>
        `).join('');

        actionSection.innerHTML = `
          <div class="bg-white p-4 rounded shadow">
            <h2 class="text-lg font-semibold mb-2">Transfer History</h2>
            <table class="w-full">
              <thead><tr><th>Type</th><th>Amount</th></tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        `;
      } catch {
        actionSection.innerHTML = `<p>Error loading transfer history</p>`;
      }
    },

    redeemPoints: async () => {
      try {
        const res = await fetch(`${baseUrl}/redemption/rates`);
        const rates = await res.json();

        actionSection.innerHTML = `
          <div class="bg-white p-4 rounded shadow">
            <h2 class="text-lg font-semibold mb-2">Redeem Points</h2>
            <form id="redeemForm" class="space-y-3">
              <select id="redeemType" class="w-full border p-2 rounded">
                <option value="bitcoin">Bitcoin</option>
                <option value="gift_card">Gift Card</option>
              </select>
              <input id="pointsAmount" type="number" placeholder="Points" class="w-full border p-2 rounded" required>
              <input id="walletAddress" type="text" placeholder="Wallet or Email" class="w-full border p-2 rounded" required>
              <button type="submit" class="bg-blue-500 text-white px-4 py-2 rounded">Redeem</button>
            </form>
          </div>
        `;

        document.getElementById('redeemForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          const type = document.getElementById('redeemType').value;
          const points_amount = parseInt(document.getElementById('pointsAmount').value);
          const wallet = document.getElementById('walletAddress').value;

          const payload = {
            type,
            points_amount,
            wallet_address: type === 'bitcoin' ? wallet : null,
            email_address: type === 'gift_card' ? wallet : null
          };

          const redeemRes = await fetch(`${baseUrl}/redemption/request`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(payload)
          });

          const msg = await redeemRes.json();
          alert(msg.message || 'Redemption Submitted');
          fetchStats(); // update balance
        });

      } catch (err) {
        actionSection.innerHTML = `<p>Error loading redemption form</p>`;
      }
    },

    transferPoints: () => {
      actionSection.innerHTML = `
        <div class="bg-white p-4 rounded shadow">
          <h2 class="text-lg font-semibold mb-2">Transfer Points</h2>
          <form id="transferForm" class="space-y-3">
            <input id="toEmail" type="email" placeholder="Recipient Email" class="w-full border p-2 rounded" required>
            <input id="amount" type="number" placeholder="Amount" class="w-full border p-2 rounded" required>
            <button type="submit" class="bg-blue-500 text-white px-4 py-2 rounded">Send</button>
          </form>
        </div>
      `;

      document.getElementById('transferForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const to_email = document.getElementById('toEmail').value;
        const amount = parseInt(document.getElementById('amount').value);

        try {
          const res = await fetch(`${baseUrl}/points/transfer`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ to_email, amount })
          });

          const data = await res.json();
          alert(data.message || 'Transfer successful');
          fetchStats();
        } catch (err) {
          alert('Transfer failed');
        }
      });
    },

    changePassword: () => {
      actionSection.innerHTML = `
        <div class="bg-white p-4 rounded shadow">
          <h2 class="text-lg font-semibold mb-2">Change Password</h2>
          <form id="changePasswordForm" class="space-y-3">
            <input type="password" id="oldPassword" placeholder="Old Password" class="w-full border p-2 rounded" required>
            <input type="password" id="newPassword" placeholder="New Password" class="w-full border p-2 rounded" required>
            <button type="submit" class="bg-blue-500 text-white px-4 py-2 rounded">Change</button>
          </form>
        </div>
      `;

      document.getElementById('changePasswordForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        // Implement API call if route exists
        alert('Change Password: Backend route integration pending');
      });
    },

    changePin: () => {
      actionSection.innerHTML = `
        <div class="bg-white p-4 rounded shadow">
          <h2 class="text-lg font-semibold mb-2">Change PIN</h2>
          <form id="changePinForm" class="space-y-3">
            <input type="password" id="oldPin" placeholder="Old PIN" class="w-full border p-2 rounded" required>
            <input type="password" id="newPin" placeholder="New PIN" class="w-full border p-2 rounded" required>
            <button type="submit" class="bg-blue-500 text-white px-4 py-2 rounded">Change</button>
          </form>
        </div>
      `;

      document.getElementById('changePinForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        alert('Change PIN: Backend route integration pending');
      });
    },

    logout: () => {
      sessionStorage.clear();
      window.location.href = '/login.html';
    }
  };

  // ===== BIND MENU ITEM CLICKS =====
  document.querySelectorAll('.menu-item').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      menu.classList.add('hidden');
      const action = btn.dataset.action;
      if (sectionHandlers[action]) sectionHandlers[action]();
    });
  });

  // Initial Wallet Fetch
  fetchStats();
});
