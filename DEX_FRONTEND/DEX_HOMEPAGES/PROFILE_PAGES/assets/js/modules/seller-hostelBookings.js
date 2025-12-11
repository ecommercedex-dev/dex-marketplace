// assets/js/modules/seller-hostelBookings.js
// Hostel Bookings Module — Fully Exported

const $ = (id) => document.getElementById(id);
let ws = null;
let user, token, API_BASE, elements, notificationSystem, showToast;

// Show/Hide hostel bookings tab based on seller category
const showHostelBookingsTab = () => {
  user = window.currentSeller || window.getUser();
  if (!user) return;
  const isHostelSeller = user.productCategory?.toLowerCase().includes("hostel");
  const display = isHostelSeller ? "flex" : "none";

  if (elements.bookingsTab) elements.bookingsTab.style.display = display;
  if (elements.mobileBookingsTab)
    elements.mobileBookingsTab.style.display = display;
  if (elements.bookings)
    elements.bookings.style.display = isHostelSeller ? "block" : "none";

  if (isHostelSeller) {
    loadHostelBookings();
    setupWebSocket();
    startAutoRefresh();
  }
};

// Load incoming hostel booking requests
const loadHostelBookings = async () => {
  try {
    const res = await fetch(`${API_BASE}/products/hostel/incoming-bookings`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error("Failed to fetch bookings");

    const bookings = await res.json();
    const container = $("incomingBookingsList");
    container.innerHTML = "";

    if (!bookings.length) {
      container.innerHTML = `
        <p style="text-align:center; color:#aaa; padding:3rem">
          <i class="fas fa-bed" style="font-size:3rem; opacity:0.3; display:block; margin-bottom:1rem"></i>
          No booking requests yet.<br>
          When students book your hostel, they’ll appear here.
        </p>`;
      return;
    }

    bookings.forEach((b) => {
      const card = document.createElement("div");
      card.className = "booking-card";

      const studentPic = b.buyer?.profilePic
        ? `http://localhost:5000${b.buyer.profilePic}`
        : "../PROFILE_PAGES/default_account_picture/account.png";

      const statusClass = b.bookingStatus || "pending";
      const statusText = (b.bookingStatus || "pending").toUpperCase();

      card.innerHTML = `
        <div class="booking-header">
          <h4>${b.name || "Hostel Room"} - ${b.roomType || "N/A"}</h4>
          <span class="booking-status status-${statusClass}">${statusText}</span>
        </div>
        <div style="display:flex; align-items:center; gap:12px; margin:12px 0">
          <img src="${studentPic}" style="width:50px; height:50px; border-radius:50%; border:3px solid #fff; object-fit:cover">
          <div>
            <strong>${b.buyer?.name || "Student"}</strong><br>
            <small>${b.buyer?.number || "No phone"}</small>
          </div>
        </div>
        <div class="booking-details">
          <div><strong>Price:</strong> ₵${Number(b.price).toFixed(0)}</div>
          <div><strong>Location:</strong> ${b.location || "N/A"}</div>
          <div><strong>Booked:</strong> ${new Date(
            b.bookedAt
          ).toLocaleDateString("en-GH")}</div>
          <div><strong>Message:</strong> ${b.bookingNotes || "No message"}</div>
        </div>
        ${
          statusClass === "pending"
            ? `
          <div class="booking-actions">
            <button class="confirm-btn" data-id="${b.id}">Confirm Booking</button>
            <button class="reject-btn" data-id="${b.id}">Reject</button>
          </div>
          `
            : `<p style="text-align:center; color:#aaa; margin-top:12px">Action completed</p>`
        }
      `;

      // Handle Confirm / Reject
      card.querySelectorAll("button").forEach((btn) => {
        btn.onclick = async () => {
          const action = btn.classList.contains("confirm-btn")
            ? "confirm"
            : "reject";
          const productId = btn.dataset.id;

          try {
            const r = await fetch(
              `${API_BASE}/products/hostel/manage-booking`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ productId, action }),
              }
            );

            if (!r.ok) throw new Error("Action failed");

            notificationSystem.show(
              action === "confirm"
                ? "Booking confirmed! Student notified."
                : "Booking rejected. Room reopened.",
              "success"
            );

            loadHostelBookings(); // Refresh list
          } catch (err) {
            showToast("Action failed", "error");
          }
        };
      });

      container.appendChild(card);
    });
  } catch (err) {
    console.error("Failed to load hostel bookings:", err);
    $("incomingBookingsList").innerHTML = `
      <p style="color:#e74c3c; text-align:center; padding:2rem">
        Failed to load bookings<br>
        <button onclick="loadHostelBookings()" style="margin-top:10px; padding:8px 16px; background:#3498db; color:white; border:none; border-radius:8px; cursor:pointer">
          Try Again
        </button>
      </p>`;
  }
};

// Auto-refresh every 30 seconds when tab is active
const startAutoRefresh = () => {
  setInterval(() => {
    const bookingsSection = document.getElementById("bookings");
    if (bookingsSection && bookingsSection.classList.contains("active")) {
      loadHostelBookings();
    }
  }, 30000);
};

// WebSocket for real-time new booking alerts
const setupWebSocket = () => {
  if (ws && ws.readyState === WebSocket.OPEN) return;

  try {
    ws = new WebSocket(`ws://localhost:5000?userId=${user.id}&role=seller`);

    ws.onopen = () => {
      console.log("WebSocket connected for hostel bookings");
    };

    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data.type === "new_hostel_booking") {
          notificationSystem.show(
            "New Hostel Booking!",
            "order",
            `${data.booking.buyer.name} booked your hostel room!`
          );
          if (
            document.getElementById("bookings")?.classList.contains("active")
          ) {
            loadHostelBookings();
          }
        }
      } catch (e) {
        console.error("Invalid WebSocket message:", e);
      }
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
    };

    ws.onclose = () => {
      console.log("WebSocket closed. Reconnecting in 5s...");
      setTimeout(setupWebSocket, 5000);
    };
  } catch (err) {
    console.error("Failed to connect WebSocket:", err);
  }
};

// Main initialization function
const initHostelBookings = (deps = {}) => {
  ({ user, token, API_BASE, elements, notificationSystem, showToast } = {
    user: window.currentSeller,
    token: window.authToken,
    API_BASE: "http://localhost:5000/api",
    elements: window.elements,
    notificationSystem: window.notificationSystem,
    showToast: window.showToast || console.log,
    ...deps
  });
  showHostelBookingsTab();
  console.log("Hostel Bookings module initialized");
};

// ───────────────────────────────
// EXPORT EVERYTHING NEEDED
// ───────────────────────────────
export {
  initHostelBookings, // Required by main-seller.js
  loadHostelBookings,
  showHostelBookingsTab,
};
