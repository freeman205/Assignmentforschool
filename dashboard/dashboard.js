document.addEventListener('DOMContentLoaded', () => {
  const apiUrl = 'https://dansog-backend.onrender.com/api';
  const accessToken = sessionStorage.getItem('accessToken');
  const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));

  const menuToggle = document.getElementById('menuToggle');
  const sideMenu = document.getElementById('sideMenu');
  const walletBalanceEl = document.getElementById('walletBalance');
  const actionSection = document.getElementById('actionSection');

  // Toggle menu
  menuToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    sideMenu.classList.toggle('hidden');
  });

  // Hide menu if clicked outside
  document.addEventListener('click', (e) => {
    if (!sideMenu.contains(e.target) && e.target !== menuToggle) {
      sideMenu.classList.add('hidden');
    }
  });

  // Menu click handler
  document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', (e) => {
      const section = e.target.dataset.section;
      sideMenu.classList.add('hidden');
      handleMenuAction(section);
    });
  });

  // Load dashboard stats (wallet balance)
  async function loadDashboardStats() {
    try {
      const res = await fetch(`${apiUrl}/dashboard/stats`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (!res.ok) throw new Error("Stats error");
      const data = await res.json();
      walletBalanceEl.textContent = `${data.points_balance} points`;
    } catch (err) {
      walletBalanceEl.textContent = "Error loading";
      console.error("Wallet error:", err);
    }
  }

  // Section logic
  async function handleMenuAction(section) {
    actionSection.innerHTML = '';

    switch (section) {
      case 'profile':
        try {
          const res = await fetch(`${apiUrl}/users/me`, {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          const user = await res.json();
          actionSection.innerHTML = `
            <div class="bg-white p-4 rounded shadow">
              <h3 class="font-bold mb-2">Your Profile</h3>
              <p><strong>Email:</strong> ${user.email}</p>
              <p><strong>Full Name:</strong> ${user.full_name || 'N/A'}</p>
              <p><strong>Username:</strong> ${user.username || 'N/A'}</p>
            </div>
          `;
        } catch {
          actionSection.innerHTML = 'Failed to load profile.';
        }
        break;

      case 'history':
        try {
          const res = await fetch(`${apiUrl}/points/history`, {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          const data = await res.json();
          actionSection.innerHTML = `
            <div class="bg-white p-4 rounded shadow">
              <h3 class="font-bold mb-2">Transfer History</h3>
              <ul class="text-sm space-y-1">
                ${data.history.map(tx => `
                  <li>${tx.amount} points to ${tx.receiver_email} on ${new Date(tx.timestamp).toLocaleString()}</li>
                `).join('')}
              </ul>
            </div>
          `;
        } catch {
          actionSection.innerHTML = 'Failed to load history.';
        }
        break;

      case 'redeem':
        try {
          const res = await fetch(`${apiUrl}/redemption/rates`, {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          const rates = await res.json();
          actionSection.innerHTML = `
            <div class="bg-white p-4 rounded shadow">
              <h3 class="font-bold mb-2">Redeem Points</h3>
              <form id="redeemForm" class="space-y-2">
                <label>Type:
                  <select name="type" class="block w-full p-2 border rounded">
                    <option value="btc">Bitcoin (${rates.btc_rate} pts/$)</option>
                    <option value="giftcard">Gift Card (${rates.giftcard_rate} pts/$)</option>
                  </select>
                </label>
                <input name="amount" placeholder="Amount to redeem" type="number" required class="w-full p-2 border rounded" />
                <input name="destination" placeholder="Wallet Address or Email" class="w-full p-2 border rounded" />
                <button class="bg-blue-500 text-white px-4 py-2 rounded">Redeem</button>
              </form>
            </div>
          `;
          document.getElementById('redeemForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const form = e.target;
            const payload = {
              type: form.type.value,
              amount: form.amount.value,
              destination: form.destination.value
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
              if (r.ok) alert("Redemption request submitted");
              else alert("Failed to redeem");
            } catch {
              alert("Error redeeming");
            }
          });
        } catch {
          actionSection.innerHTML = 'Failed to load rates.';
        }
        break;

      case 'transfer':
        actionSection.innerHTML = `
          <div class="bg-white p-4 rounded shadow">
            <h3 class="font-bold mb-2">Transfer Points</h3>
            <form id="transferForm" class="space-y-2">
              <input name="receiver_email" placeholder="Receiver Email" class="w-full p-2 border rounded" required />
              <input name="amount" type="number" placeholder="Amount" class="w-full p-2 border rounded" required />
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
            if (res.ok) alert('Transfer successful');
            else alert('Transfer failed');
          } catch {
            alert('Transfer error');
          }
        });
        break;

      case 'password':
        actionSection.innerHTML = `
          <div class="bg-white p-4 rounded shadow">
            <h3 class="font-bold mb-2">Change Password</h3>
            <form id="passwordForm" class="space-y-2">
              <input type="password" name="old_password" placeholder="Old Password" required class="w-full p-2 border rounded" />
              <input type="password" name="new_password" placeholder="New Password" required class="w-full p-2 border rounded" />
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
            if (res.ok) alert("Password changed");
            else alert("Password change failed");
          } catch {
            alert("Password error");
          }
        });
        break;

      case 'pin':
        actionSection.innerHTML = `
          <div class="bg-white p-4 rounded shadow">
            <h3 class="font-bold mb-2">Change PIN</h3>
            <form id="pinForm" class="space-y-2">
              <input type="password" name="old_pin" placeholder="Old PIN" required class="w-full p-2 border rounded" />
              <input type="password" name="new_pin" placeholder="New PIN" required class="w-full p-2 border rounded" />
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
            if (res.ok) alert("PIN changed");
            else alert("PIN change failed");
          } catch {
            alert("PIN error");
          }
        });
        break;

      case 'logout':
        sessionStorage.clear();
        window.location.href = '/login';
        break;

      default:
        actionSection.innerHTML = `<p class="text-red-500">Unknown section selected.</p>`;
    }
  }

  loadDashboardStats();
});
