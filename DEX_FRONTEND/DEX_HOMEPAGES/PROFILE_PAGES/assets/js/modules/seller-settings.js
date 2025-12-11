// Account Settings Module
const initSettings = () => {
  const container = document.getElementById('settingsContent');
  if (!container) return;

  container.innerHTML = `
    <div class="settings-sections">
      <div class="settings-card">
        <h3><i class="fas fa-user"></i> Profile Information</h3>
        <form id="profileForm">
          <div class="form-group">
            <label>Full Name</label>
            <input type="text" id="settingsName" required>
          </div>
          <div class="form-group">
            <label>Store Name</label>
            <input type="text" id="settingsStoreName">
          </div>
          <div class="form-group">
            <label>Email</label>
            <input type="email" id="settingsEmail" required>
          </div>
          <div class="form-group">
            <label>Phone</label>
            <input type="tel" id="settingsPhone">
          </div>
          <button type="submit" class="btn-primary">Save Profile</button>
        </form>
      </div>

      <div class="settings-card">
        <h3><i class="fas fa-lock"></i> Change Password</h3>
        <form id="passwordForm">
          <div class="form-group">
            <label>Current Password</label>
            <div style="position: relative">
              <input type="password" id="currentPassword" required style="padding-right: 3rem">
              <button type="button" onclick="togglePasswordPeek('currentPassword')" style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #aaa; cursor: pointer; font-size: 1.1rem">
                <i class="fas fa-eye"></i>
              </button>
            </div>
          </div>
          <div class="form-group">
            <label>New Password</label>
            <div style="position: relative">
              <input type="password" id="newPassword" required minlength="6" style="padding-right: 3rem">
              <button type="button" onclick="togglePasswordPeek('newPassword')" style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #aaa; cursor: pointer; font-size: 1.1rem">
                <i class="fas fa-eye"></i>
              </button>
            </div>
          </div>
          <div class="form-group">
            <label>Confirm New Password</label>
            <div style="position: relative">
              <input type="password" id="confirmPassword" required style="padding-right: 3rem">
              <button type="button" onclick="togglePasswordPeek('confirmPassword')" style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #aaa; cursor: pointer; font-size: 1.1rem">
                <i class="fas fa-eye"></i>
              </button>
            </div>
          </div>
          <button type="submit" class="btn-primary">Update Password</button>
        </form>
      </div>

      <div class="settings-card">
        <h3><i class="fas fa-bell"></i> Notification Preferences</h3>
        <div class="settings-toggle">
          <label>
            <input type="checkbox" id="emailNotifs" checked>
            <span>Email notifications for new orders</span>
          </label>
        </div>
        <div class="settings-toggle">
          <label>
            <input type="checkbox" id="reviewNotifs" checked>
            <span>Notify me of new reviews</span>
          </label>
        </div>
        <div class="settings-toggle">
          <label>
            <input type="checkbox" id="wishlistNotifs" checked>
            <span>Notify when products are wishlisted</span>
          </label>
        </div>
        <button class="btn-primary" onclick="saveNotificationPrefs()">Save Preferences</button>
      </div>

      <div class="settings-card danger-zone">
        <h3><i class="fas fa-exclamation-triangle"></i> Danger Zone</h3>
        <p>Permanently delete your account and all data. This cannot be undone.</p>
        <button class="btn-danger" onclick="deleteAccount()">Delete Account</button>
      </div>
    </div>
  `;

  loadSettings();
  setupSettingsHandlers();
};

const loadSettings = async () => {
  const token = window.authToken || localStorage.getItem('authToken');
  try {
    const res = await fetch('http://localhost:5000/api/seller/profile', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const user = await res.json();
    
    document.getElementById('settingsName').value = user.name || '';
    document.getElementById('settingsStoreName').value = user.storeName || '';
    document.getElementById('settingsEmail').value = user.email || '';
    document.getElementById('settingsPhone').value = user.phone || '';
  } catch (err) {
    if (window.showToast) window.showToast('Failed to load settings', 'error');
  }
};

const setupSettingsHandlers = () => {
  document.getElementById('profileForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = window.authToken || localStorage.getItem('authToken');
    const data = {
      name: document.getElementById('settingsName').value,
      storeName: document.getElementById('settingsStoreName').value,
      email: document.getElementById('settingsEmail').value,
      phone: document.getElementById('settingsPhone').value
    };

    try {
      const res = await fetch('http://localhost:5000/api/sellers/update-profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        if (window.showToast) window.showToast('Profile updated', 'success');
        if (window.updateProfile) {
          const updated = await res.json();
          window.updateProfile(updated);
        }
      } else {
        throw new Error('Update failed');
      }
    } catch (err) {
      if (window.showToast) window.showToast('Update failed', 'error');
    }
  });

  document.getElementById('passwordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const newPass = document.getElementById('newPassword').value;
    const confirmPass = document.getElementById('confirmPassword').value;

    if (newPass !== confirmPass) {
      if (window.showToast) window.showToast('Passwords do not match', 'error');
      return;
    }

    const token = window.authToken || localStorage.getItem('authToken');
    try {
      const res = await fetch('http://localhost:5000/api/sellers/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: document.getElementById('currentPassword').value,
          newPassword: newPass
        })
      });

      if (res.ok) {
        if (window.showToast) window.showToast('Password updated', 'success');
        document.getElementById('passwordForm').reset();
      } else {
        throw new Error('Password change failed');
      }
    } catch (err) {
      if (window.showToast) window.showToast('Password change failed', 'error');
    }
  });
};

window.saveNotificationPrefs = () => {
  const prefs = {
    email: document.getElementById('emailNotifs').checked,
    reviews: document.getElementById('reviewNotifs').checked,
    wishlists: document.getElementById('wishlistNotifs').checked
  };
  localStorage.setItem('notificationPrefs', JSON.stringify(prefs));
  if (window.showToast) window.showToast('Preferences saved', 'success');
};

window.deleteAccount = async () => {
  if (!confirm('Are you absolutely sure? This will permanently delete your account and all products.')) return;
  if (!confirm('Last chance! Type DELETE to confirm')) return;

  const token = window.authToken || localStorage.getItem('authToken');
  try {
    const res = await fetch('http://localhost:5000/api/sellers/delete-account', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });

    if (res.ok) {
      localStorage.clear();
      window.location.replace('../REGISTRY_PAGES/seller_sign_in.html');
    } else {
      throw new Error('Delete failed');
    }
  } catch (err) {
    if (window.showToast) window.showToast('Delete failed', 'error');
  }
};

window.togglePasswordPeek = (inputId) => {
  const input = document.getElementById(inputId);
  const btn = input.parentElement.querySelector('button');
  const icon = btn.querySelector('i');
  if (input.type === 'password') {
    input.type = 'text';
    icon.className = 'fas fa-eye-slash';
  } else {
    input.type = 'password';
    icon.className = 'fas fa-eye';
  }
};

window.initSettingsContent = initSettings;
export { initSettings };
