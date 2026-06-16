// ==========================================
// 01 — APPLICATION STATE & CONFIGURATION
// ==========================================

let EVENTS_DATA = [];
let USER_REGISTRATIONS = [];
let USER_PROFILE = {
  name: "",
  email: "",
  id: "",
  collegeName: "",
  avatar: "",
  phone: ""
};

let selectedEvent = null;
let currentFilter = "all";
let searchQuery = "";
let countdownInterval = null;
let detailCountdownInterval = null;
let teamMemberCount = 0;
let pendingRegistration = null;
let currentVerificationUnsubscribe = null;
let simulatorPollingInterval = null;
let pendingRegistrationId = null;

const PHONEPE_CONFIG = {
  MERCHANT_ID: "M222YFJEV26ZI_2606161742",
  SALT_KEY: "YTFkMDU1NzktMjBlNC00YzFmLTkxMTQtNWFlODY1Yjc3Mzlk",
  SALT_INDEX: "1",
  API_URL: "https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay"
};

// Firebase initialization configuration block
const firebaseConfig = {
  apiKey: "AIzaSyD4_h3WU2tkzE5G6jXimQUjYj2bUVliYUk",
  authDomain: "iedc-ux.firebaseapp.com",
  projectId: "iedc-ux",
  storageBucket: "iedc-ux.firebasestorage.app",
  messagingSenderId: "362260352304",
  appId: "1:362260352304:web:27374dbb9b51182807ccf5",
  measurementId: "G-2KH08MNGSX"
};

let useRealFirebase = false;
if (firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith("YOUR_")) {
  try {
    firebase.initializeApp(firebaseConfig);
    useRealFirebase = true;
    console.log("Firebase initialized successfully inside client engine.");
  } catch (error) {
    console.error("Firebase initialization fallback error:", error);
  }
}
sessionStorage.setItem("useRealFirebase", useRealFirebase);

// ==========================================
// 02 — DOM ELEMENTS REGISTRY
// ==========================================

const screens = {
  auth: document.getElementById("screen-auth"),
  pending: document.getElementById("screen-pending"),
  home: document.getElementById("screen-home"),
  detail: document.getElementById("screen-detail"),
  ticket: document.getElementById("screen-ticket"),
  dashboard: document.getElementById("screen-dashboard")
};

const navItems = {
  home: document.getElementById("nav-home"),
  dashboard: document.getElementById("nav-dashboard")
};

// ==========================================
// 03 — ROUTING & SCREEN TRANSITIONS
// ==========================================

async function navigateTo(screenId) {
  Object.values(screens).forEach(screen => {
    if (screen) screen.classList.remove("active");
  });

  if (screens[screenId]) {
    screens[screenId].classList.add("active");
  }

  const presentationContainer = document.querySelector(".presentation-container");
  if (presentationContainer) presentationContainer.style.display = "flex";

  const bottomNav = document.querySelector(".bottom-nav");
  if (screenId === "auth" || screenId === "pending") {
    if (bottomNav) bottomNav.style.display = "none";
  } else {
    if (bottomNav) bottomNav.style.display = "flex";
  }

  if (screenId === "home") {
    navItems.home.classList.add("active");
    navItems.dashboard.classList.remove("active");
    await syncEvents();
    renderHomeEvents();
  } else if (screenId === "dashboard") {
    navItems.home.classList.remove("active");
    navItems.dashboard.classList.add("active");
    await syncEvents();
    await syncRegistrations();
    renderDashboard();
  } else {
    navItems.home.classList.remove("active");
    navItems.dashboard.classList.remove("active");
  }
}

navItems.home.addEventListener("click", () => navigateTo("home"));
navItems.dashboard.addEventListener("click", () => navigateTo("dashboard"));

document.getElementById("detail-back-btn").addEventListener("click", () => {
  if (detailCountdownInterval) clearInterval(detailCountdownInterval);
  navigateTo("home");
});
document.getElementById("ticket-back-btn").addEventListener("click", () => navigateTo("dashboard"));
document.getElementById("setup-back-btn").addEventListener("click", () => navigateTo("home"));

// ==========================================
// 04 — DATABASE SYNCHRONIZATION (Firestore / Simulator)
// ==========================================

async function syncEvents() {
  let mergedEvents = [];

  if (useRealFirebase) {
    try {
      const db = firebase.firestore();
      
      const eventsSnap = await db.collection("events").get();
      eventsSnap.forEach(doc => {
        const evt = doc.data();
        mergedEvents.push(evt);
      });

      const tournamentsSnap = await db.collection("tournaments").get();
      tournamentsSnap.forEach(doc => {
        const tour = doc.data();
        mergedEvents.push(tour);
      });
    } catch (err) {
      console.error("Firestore events fetch error:", err);
    }
  } else {
    // Simulator Mode fallback
    try {
      const mockEvents = JSON.parse(localStorage.getItem("firebase_mock_events") || "[]");
      const mockTournaments = JSON.parse(localStorage.getItem("firebase_mock_tournaments") || "[]");

      mockEvents.forEach(evt => mergedEvents.push(evt));
      mockTournaments.forEach(tour => mergedEvents.push(tour));
    } catch (err) {
      console.error("Local mock storage load failed:", err);
    }
  }

  EVENTS_DATA = mergedEvents;
}

let registrationsUnsubscribe = null;

async function syncRegistrations() {
  const cachedUid = sessionStorage.getItem("loggedInUserUid");
  if (!cachedUid) return;

  if (useRealFirebase) {
    return new Promise((resolve) => {
      if (registrationsUnsubscribe) {
        registrationsUnsubscribe();
      }
      
      const db = firebase.firestore();
      registrationsUnsubscribe = db.collection("registrations")
        .where("studentUid", "==", cachedUid)
        .onSnapshot((snap) => {
          let firebaseRegs = [];
          snap.forEach(doc => {
            const reg = doc.data();
            const match = EVENTS_DATA.find(e => e.id === reg.eventId);
            firebaseRegs.push({
              id: reg.eventId,
              registrationId: reg.registrationId,
              ticketId: reg.registrationId,
              title: reg.eventTitle || (match ? match.title : "Event"),
              type: match ? match.type : "talk",
              typeLabel: match ? match.typeLabel : "Talk",
              date: match ? match.date : "TBD",
              isoDate: match ? match.isoDate : new Date().toISOString(),
              time: match ? match.time : "TBD",
              location: match ? match.location : "TBD",
              host: match ? match.host : "IEDC RIT",
              color: match ? match.color : "#C8E84A",
              status: reg.status || "Confirmed",
              checkedIn: reg.checkedIn === true,
              razorpayPaymentId: reg.razorpayPaymentId || reg.utrNumber || "FREE",
              phone: reg.phone || ""
            });
          });

          // Sync local mock registrations
          let mockRegs = [];
          try {
            const local = JSON.parse(localStorage.getItem("firebase_mock_registrations") || "[]");
            local.forEach(reg => {
              if (reg.studentUid === cachedUid) {
                const match = EVENTS_DATA.find(e => e.id === reg.eventId);
                mockRegs.push({
                  id: reg.eventId,
                  registrationId: reg.registrationId,
                  ticketId: reg.registrationId,
                  title: reg.eventTitle || (match ? match.title : "Event"),
                  type: match ? match.type : "talk",
                  typeLabel: match ? match.typeLabel : "Talk",
                  date: match ? match.date : "TBD",
                  isoDate: match ? match.isoDate : new Date().toISOString(),
                  time: match ? match.time : "TBD",
                  location: match ? match.location : "TBD",
                  host: match ? match.host : "IEDC RIT",
                  color: match ? match.color : "#C8E84A",
                  status: reg.status || "Confirmed",
                  checkedIn: reg.checkedIn === true,
                  razorpayPaymentId: reg.razorpayPaymentId || reg.utrNumber || "FREE",
                  phone: reg.phone || ""
                });
              }
            });
          } catch (e) {}

          USER_REGISTRATIONS = [...firebaseRegs];
          mockRegs.forEach(mr => {
            if (!USER_REGISTRATIONS.some(r => r.registrationId === mr.registrationId)) {
              USER_REGISTRATIONS.push(mr);
            }
          });

          // Re-render dashboard in real-time
          const activeScreen = document.querySelector(".screen.active");
          if (activeScreen && activeScreen.id === "screen-dashboard") {
            renderDashboard();
          }
          
          resolve();
        }, (err) => {
          console.error("Registrations snapshot stream error:", err);
          resolve();
        });
    });
  } else {
    // Simulator Mode fallback
    let mergedRegs = [];
    try {
      const mockRegs = JSON.parse(localStorage.getItem("firebase_mock_registrations") || "[]");
      mockRegs.forEach(reg => {
        if (reg.studentUid === cachedUid) {
          const match = EVENTS_DATA.find(e => e.id === reg.eventId);
          mergedRegs.push({
            id: reg.eventId,
            registrationId: reg.registrationId,
            ticketId: reg.registrationId,
            title: reg.eventTitle || (match ? match.title : "Event"),
            type: match ? match.type : "talk",
            typeLabel: match ? match.typeLabel : "Talk",
            date: match ? match.date : "TBD",
            isoDate: match ? match.isoDate : new Date().toISOString(),
            time: match ? match.time : "TBD",
            location: match ? match.location : "TBD",
            host: match ? match.host : "IEDC RIT",
            color: match ? match.color : "#C8E84A",
            status: reg.status || "Confirmed",
            checkedIn: reg.checkedIn === true,
            razorpayPaymentId: reg.razorpayPaymentId || reg.utrNumber || "FREE",
            phone: reg.phone || ""
          });
        }
      });
    } catch (err) {
      console.error("Mock registrations sync error:", err);
    }
    USER_REGISTRATIONS = mergedRegs;
    return Promise.resolve();
  }
}

// ==========================================
// 05 — HOME SCREEN RENDERING & FILTERING
// ==========================================

function renderHomeEvents() {
  const listContainer = document.getElementById("events-list-container");
  const featuredContainer = document.getElementById("featured-card-container");
  
  listContainer.innerHTML = "";
  featuredContainer.innerHTML = "";

  // Filter query logic
  let filtered = EVENTS_DATA.filter(evt => {
    const matchesCategory = currentFilter === "all" || evt.type === currentFilter;
    const matchesSearch = evt.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          evt.host.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          evt.typeLabel.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (filtered.length === 0) {
    listContainer.innerHTML = `
      <div style="padding: var(--space-xl) 0; text-align: left; color: var(--muted-white);">
        <p class="body-desc">No events found matching your queries.</p>
      </div>
    `;
    return;
  }

  // First spotlight card
  let featuredEvent = null;
  if (currentFilter === "all" && searchQuery === "") {
    featuredEvent = filtered[0];
    filtered = filtered.slice(1);
  }

  if (featuredEvent) {
    const featCard = document.createElement("div");
    featCard.className = "card-featured";
    featCard.style.setProperty("--event-color", featuredEvent.color);
    if (featuredEvent.poster || featuredEvent.poster_url) {
      const pUrl = featuredEvent.poster || featuredEvent.poster_url;
      featCard.style.backgroundImage = `linear-gradient(to bottom, rgba(8, 8, 16, 0.25), rgba(8, 8, 16, 0.9)), url(${pUrl})`;
      featCard.style.backgroundSize = "cover";
      featCard.style.backgroundPosition = "center";
    }
    featCard.innerHTML = `
      <div class="card-featured-circle"></div>
      <div class="card-featured-content" style="width: 100%;">
        <span class="chip chip-${featuredEvent.type}" style="margin-bottom: var(--space-sm);">${featuredEvent.typeLabel}</span>
        <h2 class="h3-title" style="margin-bottom: var(--space-xs); line-height: 1.2;">${featuredEvent.title}</h2>
        <div style="display: flex; gap: var(--space-sm); font-size: 11px; color: var(--muted-white); margin-bottom: 12px;">
          <span>${featuredEvent.date}</span>
          <span>•</span>
          <span>${featuredEvent.time}</span>
        </div>
        <button class="card-btn-register" id="btn-register-${featuredEvent.id}">Register Now</button>
      </div>
    `;
    featCard.addEventListener("click", (e) => {
      if (e.target.classList.contains("card-btn-register")) return;
      openEventDetail(featuredEvent);
    });
    featuredContainer.appendChild(featCard);

    // Bind glassmorphic button click explicitly
    featCard.querySelector(`#btn-register-${featuredEvent.id}`).addEventListener("click", (e) => {
      e.stopPropagation();
      openEventDetail(featuredEvent);
    });
  }

  // Grid lists
  filtered.forEach(evt => {
    const card = document.createElement("div");
    card.className = "card-event";
    card.style.setProperty("--event-color", evt.color);
    if (evt.poster || evt.poster_url) {
      const pUrl = evt.poster || evt.poster_url;
      card.style.backgroundImage = `linear-gradient(to bottom, rgba(8, 8, 16, 0.65), rgba(8, 8, 16, 0.96)), url(${pUrl})`;
      card.style.backgroundSize = "cover";
      card.style.backgroundPosition = "center";
    }
    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <span class="chip chip-${evt.type}">${evt.typeLabel}</span>
        <span class="caption-meta" style="color: var(--nova-yellow);">${evt.price}</span>
      </div>
      <h3 class="h3-title" style="margin-top: var(--space-xs); line-height:1.2;">${evt.title}</h3>
      <div style="display: flex; gap: var(--space-sm); font-size: 11px; color: var(--muted-white); margin-top: auto; margin-bottom: 8px;">
        <span style="display:flex; align-items:center; gap:4px;">
          📅 ${evt.date}
        </span>
      </div>
      <button class="card-btn-register" id="btn-register-${evt.id}">Register Now</button>
    `;
    card.addEventListener("click", (e) => {
      if (e.target.classList.contains("card-btn-register")) return;
      openEventDetail(evt);
    });
    listContainer.appendChild(card);

    // Bind glassmorphic button click explicitly
    card.querySelector(`#btn-register-${evt.id}`).addEventListener("click", (e) => {
      e.stopPropagation();
      openEventDetail(evt);
    });
  });
}

// Search queries binding
document.getElementById("search-input").addEventListener("input", (e) => {
  searchQuery = e.target.value;
  renderHomeEvents();
});

// Category pills clicks
document.querySelectorAll(".chip-category").forEach(pill => {
  pill.addEventListener("click", () => {
    document.querySelectorAll(".chip-category").forEach(p => p.classList.remove("active"));
    pill.classList.add("active");
    currentFilter = pill.getAttribute("data-category");
    renderHomeEvents();
  });
});

// ==========================================
// 06 — SINGLE-PAGE CHECKOUT DETAILS OVERLAY
// ==========================================

function openEventDetail(event) {
  selectedEvent = event;

  // Background and titles
  const hero = document.getElementById("detail-hero");
  hero.style.setProperty("--event-color", event.color);
  if (event.poster || event.poster_url) {
    const pUrl = event.poster || event.poster_url;
    hero.style.backgroundImage = `linear-gradient(to bottom, rgba(8, 8, 16, 0.3), var(--void-black)), url(${pUrl})`;
    hero.style.backgroundSize = "cover";
    hero.style.backgroundPosition = "center";
  } else {
    hero.style.backgroundImage = "";
  }
  
  document.getElementById("detail-title").textContent = event.title;
  document.getElementById("detail-description").textContent = event.description || "No description available.";
  
  // Feature grid values
  document.getElementById("detail-feat-date").textContent = event.date || "TBD";
  document.getElementById("detail-feat-time").textContent = event.time || "TBD";
  document.getElementById("detail-feat-seats").textContent = event.seats !== undefined ? `${event.seats} Seats` : "Unlimited";
  document.getElementById("detail-feat-price").textContent = event.price || "Free";

  // Category tags
  const chipContainer = document.getElementById("detail-type-chip-container");
  chipContainer.innerHTML = `<span class="chip chip-${event.type}">${event.typeLabel}</span>`;

  // Venue location details
  const metaRow = document.getElementById("detail-meta-row");
  metaRow.innerHTML = `<span class="chip" style="background: rgba(255,255,255,0.15); border:none; text-transform:none; font-weight:500;">📍 ${event.location || 'Online'}</span>`;

  // Speaker Profile values
  const hostParts = (event.host || "Organized by IEDC RIT").split(", ");
  document.getElementById("detail-host").textContent = hostParts[0] || "IEDC Speaker";
  document.getElementById("detail-host-qual").textContent = hostParts.slice(1).join(", ") || "IEDC Guest Host";
  
  const linkedin = document.getElementById("detail-host-linkedin");
  if (event.speakerLinkedin) {
    linkedin.href = event.speakerLinkedin;
    linkedin.style.display = "flex";
  } else {
    linkedin.style.display = "none";
  }

  // Online vs Offline Dynamic Adapters
  const isOnline = event.mode === "online" || event.location.toLowerCase().includes("http");
  const mapLink = document.getElementById("detail-location-map-link");
  const meetDiv = document.getElementById("detail-location-meeting");
  const meetLink = document.getElementById("detail-meeting-link");
  const locationText = document.getElementById("detail-location-text");

  locationText.textContent = isOnline ? "Virtual / Digital Room" : event.location;

  if (isOnline) {
    mapLink.style.display = "none";
    meetDiv.style.display = "flex";
    meetLink.href = event.location.startsWith("http") ? event.location : "https://meet.google.com";
  } else {
    mapLink.style.display = "inline-block";
    mapLink.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`;
    meetDiv.style.display = "none";
  }

  // Pre-fill user registration details
  document.getElementById("detail-reg-name").value = USER_PROFILE.name || "";
  document.getElementById("detail-reg-ktuid").value = USER_PROFILE.id || "";
  document.getElementById("detail-reg-phone").value = USER_PROFILE.phone || "";

  // Team slots dynamically
  const teamSection = document.getElementById("detail-team-section");
  const slotsContainer = document.getElementById("detail-team-slots-container");
  slotsContainer.innerHTML = "";
  teamMemberCount = 0;

  if (event.hasTeam) {
    teamSection.style.display = "flex";
    addDetailTeamSlot();
  } else {
    teamSection.style.display = "none";
  }

  // Start Detail Countdown ticking clock
  startDetailCountdown(event.isoDate);

  // Reset payment checkout screen states
  document.getElementById("detail-reg-form").style.display = "block";
  document.getElementById("detail-upi-checkout-container").style.display = "none";
  document.getElementById("ticket-container").style.display = "none";
  
  const stickyCta = document.querySelector(".sticky-cta-container");
  if (stickyCta) stickyCta.style.display = "block";

  // Gating registration buttons
  const regBtn = document.getElementById("detail-register-btn");
  const modalPayBtn = document.getElementById("modal-pay-btn");
  const isAlreadyRegistered = USER_REGISTRATIONS.some(r => r.id === event.id);

  if (isAlreadyRegistered) {
    regBtn.textContent = "View Ticket Pass";
    regBtn.style.backgroundColor = "var(--galactic-purple)";
    regBtn.style.color = "var(--white-pure)";
    if (modalPayBtn) {
      modalPayBtn.textContent = "View Ticket Pass";
      modalPayBtn.style.backgroundColor = "var(--galactic-purple)";
      modalPayBtn.style.color = "var(--white-pure)";
    }
  } else if (event.seats <= 0) {
    regBtn.textContent = "Sold Out";
    regBtn.disabled = true;
    regBtn.style.backgroundColor = "rgba(255,255,255,0.1)";
    if (modalPayBtn) {
      modalPayBtn.textContent = "Sold Out";
      modalPayBtn.disabled = true;
      modalPayBtn.style.backgroundColor = "rgba(255,255,255,0.1)";
    }
  } else {
    const btnText = event.price && event.price !== "Free" ? "Register & Pay via UPI" : "Confirm Free Register";
    regBtn.textContent = btnText;
    regBtn.disabled = false;
    regBtn.style.backgroundColor = "var(--nova-yellow)";
    regBtn.style.color = "var(--void-black)";
    if (modalPayBtn) {
      modalPayBtn.textContent = btnText;
      modalPayBtn.disabled = false;
      modalPayBtn.style.backgroundColor = "var(--nova-yellow)";
      modalPayBtn.style.color = "var(--void-black)";
    }
  }

  navigateTo("detail");
}

function startDetailCountdown(isoDate) {
  if (detailCountdownInterval) clearInterval(detailCountdownInterval);
  const timerSpan = document.getElementById("detail-countdown-timer");

  const target = isoDate ? new Date(isoDate).getTime() : new Date("2026-06-25T09:00:00").getTime();

  function update() {
    const diff = target - new Date().getTime();
    if (diff <= 0) {
      timerSpan.textContent = "Live Now / Ended";
      clearInterval(detailCountdownInterval);
    } else {
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      timerSpan.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s left`;
    }
  }

  update();
  detailCountdownInterval = setInterval(update, 1000);
}

function addDetailTeamSlot() {
  if (!selectedEvent || teamMemberCount >= selectedEvent.maxTeamSize - 1) return;

  teamMemberCount++;
  const container = document.getElementById("detail-team-slots-container");
  const div = document.createElement("div");
  div.className = "team-member-input-row";
  div.id = `detail-member-row-${teamMemberCount}`;
  div.innerHTML = `
    <input type="text" class="input-field detail-team-member-name" placeholder="Member #${teamMemberCount} Name" required style="flex:1;">
    <button type="button" class="btn-remove-member" onclick="removeDetailTeamSlot(${teamMemberCount})">&times;</button>
  `;
  container.appendChild(div);
}

window.removeDetailTeamSlot = function(id) {
  const row = document.getElementById(`detail-member-row-${id}`);
  if (row) {
    row.remove();
    teamMemberCount--;
  }
};

document.getElementById("detail-btn-add-member").addEventListener("click", addDetailTeamSlot);

// Hooking Register & Pay Click Event
document.getElementById("detail-register-btn").addEventListener("click", () => {
  if (!selectedEvent) return;

  const isAlreadyRegistered = USER_REGISTRATIONS.some(r => r.id === selectedEvent.id);
  if (isAlreadyRegistered) {
    const reg = USER_REGISTRATIONS.find(r => r.id === selectedEvent.id);
    showTicket(reg);
    return;
  }

  // Trigger HTML5 validation and submit form
  document.getElementById("detail-reg-form").requestSubmit();
});

// Bind form submit event
document.getElementById("detail-reg-form").addEventListener("submit", (e) => {
  e.preventDefault();
  handleRegistrationCheckout();
});

async function handleRegistrationCheckout() {
  if (!selectedEvent) return;

  const phone = document.getElementById("detail-reg-phone").value.trim();
  if (!phone) {
    showToast("Please enter contact phone number.", "var(--error)", "var(--error)");
    return;
  }
  
  const ktuid = USER_PROFILE.id || "";
  const eventId = selectedEvent.id || selectedEvent.eventId;

  // Set checkout processing status
  const modalPayBtn = document.getElementById("modal-pay-btn");
  const originalBtnText = modalPayBtn.textContent;
  modalPayBtn.disabled = true;
  modalPayBtn.textContent = "Checking details...";

  // 1. Strict Duplicate Registration Check (Before Payment)
  let hasDuplicate = false;
  if (useRealFirebase) {
    try {
      const db = firebase.firestore();
      const snap = await db.collection("registrations").where("eventId", "==", eventId).get();
      snap.forEach(doc => {
        const d = doc.data();
        if (d.phone === phone || d.registerNo === ktuid) {
          hasDuplicate = true;
        }
      });
    } catch (err) {
      console.error("Duplicate checking query error:", err);
    }
  } else {
    // Simulator check
    try {
      const mockRegs = JSON.parse(localStorage.getItem("firebase_mock_registrations") || "[]");
      hasDuplicate = mockRegs.some(r => r.eventId === eventId && (r.phone === phone || r.registerNo === ktuid));
    } catch (e) {
      console.error("Local mock duplicate search error:", e);
    }
  }

  if (hasDuplicate) {
    // Restore button
    modalPayBtn.disabled = false;
    modalPayBtn.textContent = originalBtnText;

    // Close the detail modal
    if (detailCountdownInterval) clearInterval(detailCountdownInterval);
    navigateTo("home");

    // Trigger glassmorphic conflict alert
    showCustomAlert("Conflict", "Conflict: You are already registered for this event!");
    return;
  }

  // Restore button text for future opens
  modalPayBtn.disabled = false;
  modalPayBtn.textContent = originalBtnText;

  // Parse team members names if present
  const teamInputs = document.querySelectorAll(".detail-team-member-name");
  const teamMembers = [];
  teamInputs.forEach(input => {
    if (input.value.trim()) teamMembers.push(input.value.trim());
  });

  // Parse amount fee
  let amount = 0;
  if (selectedEvent.fee !== undefined) {
    amount = parseInt(selectedEvent.fee);
  } else if (selectedEvent.reg_fee !== undefined) {
    amount = parseInt(selectedEvent.reg_fee);
  } else {
    const priceVal = selectedEvent.price || "Free";
    const amountMatch = String(priceVal).match(/\d+/);
    amount = amountMatch ? parseInt(amountMatch[0]) : 0;
  }

  // Compile registration data
  const registrationId = "reg-" + Math.floor(Math.random() * 900000 + 100000);
  const merchantTransactionId = "TXN_" + registrationId;
  const registrationData = {
    registrationId,
    eventId,
    eventTitle: selectedEvent.title,
    studentName: USER_PROFILE.name,
    studentEmail: USER_PROFILE.email,
    registerNo: USER_PROFILE.id,
    phone,
    teamMembers,
    razorpayPaymentId: merchantTransactionId, // PhonePe Transaction ID mapped here
    checkedIn: false,
    status: amount > 0 ? "Pending" : "Confirmed",
    createdAt: new Date().toISOString(),
    studentUid: sessionStorage.getItem("loggedInUserUid"),
    timestamp: new Date().toISOString()
  };

  if (amount > 0) {
    // Save pending registration to database/localStorage first
    try {
      let mockRegs = JSON.parse(localStorage.getItem("firebase_mock_registrations") || "[]");
      mockRegs.push(registrationData);
      localStorage.setItem("firebase_mock_registrations", JSON.stringify(mockRegs));
    } catch (e) {
      console.error("Local mock pending registration failed:", e);
    }
    
    // Save pending registration to localStorage for redirect handler retrieval
    localStorage.setItem("pending_phonepe_registration", JSON.stringify(registrationData));

    if (useRealFirebase) {
      try {
        const db = firebase.firestore();
        await db.collection("registrations").doc(registrationId).set(registrationData);
      } catch (err) {
        console.error("Firestore pending registration failed:", err);
      }
    }

    if (detailCountdownInterval) clearInterval(detailCountdownInterval);
    
    // Check if simulator or real checkout is triggered
    if (!useRealFirebase) {
      showToast("Redirecting to Mock PhonePe Portal...", "var(--nova-yellow)", "var(--nova-yellow)");
      setTimeout(() => {
        window.location.href = window.location.origin + window.location.pathname + "?phonepe_success=true&txnId=" + merchantTransactionId;
      }, 1000);
      return;
    }

    // Standard PhonePe PayPage redirection flow payload
    const payload = {
      merchantId: PHONEPE_CONFIG.MERCHANT_ID,
      merchantTransactionId: merchantTransactionId,
      merchantUserId: USER_PROFILE.id || "USER_" + registrationId,
      amount: amount * 100, // Amount calculated in Paise (fee * 100)
      redirectUrl: window.location.origin + window.location.pathname + "?phonepe_success=true&txnId=" + merchantTransactionId,
      redirectMode: "REDIRECT",
      callbackUrl: "https://iedc-projecttt.pages.dev/callback",
      paymentInstrument: {
        type: "PAY_PAGE"
      }
    };

    modalPayBtn.disabled = true;
    modalPayBtn.textContent = "Redirecting to PhonePe...";

    try {
      const base64Payload = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(JSON.stringify(payload)));
      const stringToSign = base64Payload + "/pg/v1/pay" + PHONEPE_CONFIG.SALT_KEY;
      const sha256Hash = CryptoJS.SHA256(stringToSign).toString(CryptoJS.enc.Hex);
      const xVerify = sha256Hash + "###" + PHONEPE_CONFIG.SALT_INDEX;

      // Sandbox API URL routed via corsproxy.io to resolve browser client-side CORS blocks
      const requestURL = "https://corsproxy.io/?" + encodeURIComponent(PHONEPE_CONFIG.API_URL);

      const response = await fetch(requestURL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-VERIFY": xVerify
        },
        body: JSON.stringify({
          request: base64Payload
        })
      });

      const result = await response.json();
      if (result.success && result.data && result.data.instrumentResponse && result.data.instrumentResponse.redirectInfo) {
        window.location.href = result.data.instrumentResponse.redirectInfo.url;
      } else {
        console.error("PhonePe PayPage redirection init failed:", result);
        showToast("Gateway error: " + (result.message || "Unknown response"), "var(--error)", "var(--error)");
        modalPayBtn.disabled = false;
        modalPayBtn.textContent = originalBtnText;
      }
    } catch (err) {
      console.error("PhonePe network redirect exception:", err);
      showToast("Redirect failed. Falling back to Sandbox Simulation...", "var(--error)", "var(--error)");
      
      // Fallback redirection to mock portal in case of sandbox connectivity disruptions
      setTimeout(() => {
        window.location.href = window.location.origin + window.location.pathname + "?phonepe_success=true&txnId=" + merchantTransactionId;
      }, 1500);
    }
    
  } else {
    // Free registration bypass is immediate
    await completeUpiRegistration(registrationData);
  }
}

async function completeUpiRegistration(registrationData) {
  if (detailCountdownInterval) clearInterval(detailCountdownInterval);

  // Confetti celebrations
  triggerConfetti();

  // Save registration ledger to Firestore / Simulator
  // Mock registrations write
  try {
    let mockRegs = JSON.parse(localStorage.getItem("firebase_mock_registrations") || "[]");
    if (!mockRegs.some(r => r.registrationId === registrationData.registrationId)) {
      mockRegs.push(registrationData);
    } else {
      const idx = mockRegs.findIndex(r => r.registrationId === registrationData.registrationId);
      mockRegs[idx] = registrationData;
    }
    localStorage.setItem("firebase_mock_registrations", JSON.stringify(mockRegs));

    // Decrement seats locally
    let mockEvents = JSON.parse(localStorage.getItem("firebase_mock_events") || "[]");
    let evIdx = mockEvents.findIndex(e => e.id === registrationData.eventId);
    if (evIdx !== -1) {
      mockEvents[evIdx].seats = Math.max(0, (mockEvents[evIdx].seats || 50) - 1);
      localStorage.setItem("firebase_mock_events", JSON.stringify(mockEvents));
    }
    
    let mockTours = JSON.parse(localStorage.getItem("firebase_mock_tournaments") || "[]");
    let tourIdx = mockTours.findIndex(t => t.id === registrationData.eventId);
    if (tourIdx !== -1) {
      mockTours[tourIdx].seats = Math.max(0, (mockTours[tourIdx].seats || 50) - 1);
      localStorage.setItem("firebase_mock_tournaments", JSON.stringify(mockTours));
    }
  } catch (e) {
    console.error("Local mock registration write failed:", e);
  }

  // Firestore write
  if (useRealFirebase) {
    try {
      const db = firebase.firestore();
      await db.collection("registrations").doc(registrationData.registrationId).set(registrationData);
      
      const targetCol = selectedEvent.type === "tournament" ? "tournaments" : "events";
      await db.collection(targetCol).doc(registrationData.eventId).update({
        seats: firebase.firestore.FieldValue.increment(-1)
      });
    } catch (err) {
      console.error("Firestore registration ledger write failed:", err);
    }
  }

  showToast("Registration Confirmed! Enjoy your event.", "var(--success)", "var(--success)");

  // Hide checkout views and show success ticket block inside details modal
  document.getElementById("detail-upi-checkout-container").style.display = "none";
  document.getElementById("detail-reg-form").style.display = "none";
  const stickyCta = document.querySelector(".sticky-cta-container");
  if (stickyCta) stickyCta.style.display = "none";

  document.getElementById("ticket-container").style.display = "flex";
  
  // Render canvas QR code on the spot
  drawQRToCanvas(document.getElementById("ticket-qr-canvas"), registrationData.registrationId, selectedEvent.color || "#8B6FD4", 180);

  // Sync state in background
  await syncRegistrations();
}

function showTicket(registration) {
  document.getElementById("ticket-event-name").textContent = registration.title;
  document.getElementById("ticket-date").textContent = registration.date;
  document.getElementById("ticket-loc").textContent = registration.location;
  document.getElementById("ticket-id-text").textContent = `TICKET ID: ${registration.ticketId}`;
  
  const typeTag = document.getElementById("ticket-type-tag");
  typeTag.textContent = registration.typeLabel;
  typeTag.className = `ticket-event-type chip chip-${registration.type}`;

  generateQRCode(registration.ticketId, registration.color);

  document.getElementById("btn-ticket-download").onclick = () => {
    showToast("Ticket downloaded successfully!", "var(--success)", "var(--success)");
  };
  document.getElementById("btn-ticket-share").onclick = () => {
    showToast("Ticket share links compiled!", "var(--galactic-purple)", "var(--galactic-purple)");
  };

  navigateTo("ticket");
}

function drawQRToCanvas(canvas, text, brandColor, size = 240) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  
  canvas.width = size;
  canvas.height = size;
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = "#080810";

  const moduleSize = size / 30;

  function drawFinderPattern(x, y) {
    ctx.fillRect(x, y, 60 * (size / 240), 60 * (size / 240));
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(x + 10 * (size / 240), y + 10 * (size / 240), 40 * (size / 240), 40 * (size / 240));
    ctx.fillStyle = "#080810";
    ctx.fillRect(x + 20 * (size / 240), y + 20 * (size / 240), 20 * (size / 240), 20 * (size / 240));
  }

  drawFinderPattern(10 * (size / 240), 10 * (size / 240));
  drawFinderPattern(170 * (size / 240), 10 * (size / 240));
  drawFinderPattern(10 * (size / 240), 170 * (size / 240));

  let seed = 0;
  for (let i = 0; i < text.length; i++) {
    seed += text.charCodeAt(i);
  }
  function seededRandom() {
    let x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  }

  for (let r = 0; r < 30; r++) {
    for (let c = 0; c < 30; c++) {
      if ((r < 8 && c < 8) || (r < 8 && c >= 22) || (r >= 22 && c < 8)) continue;
      if (seededRandom() > 0.45) {
        ctx.fillStyle = seededRandom() > 0.90 ? brandColor : "#080810";
        ctx.fillRect(c * moduleSize, r * moduleSize, moduleSize, moduleSize);
      }
    }
  }
}

function generateQRCode(text, brandColor) {
  const canvas = document.getElementById("qr-canvas");
  drawQRToCanvas(canvas, text, brandColor, 240);
}

// Draw QR inside stubs card inside wallet
function drawTicketQRCode(canvasId, text, brandColor) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  
  canvas.width = 72;
  canvas.height = 72;
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, 72, 72);
  ctx.fillStyle = "#080810";

  function drawFinderPattern(x, y) {
    ctx.fillRect(x, y, 18, 18);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(x + 3, y + 3, 12, 12);
    ctx.fillStyle = "#080810";
    ctx.fillRect(x + 6, y + 6, 6, 6);
  }

  drawFinderPattern(2, 2);
  drawFinderPattern(52, 2);
  drawFinderPattern(2, 52);

  let seed = 0;
  for (let i = 0; i < text.length; i++) {
    seed += text.charCodeAt(i);
  }
  function seededRandom() {
    let x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  }

  const moduleSize = 3;
  for (let r = 0; r < 24; r++) {
    for (let c = 0; c < 24; c++) {
      if ((r < 8 && c < 8) || (r < 8 && c >= 16) || (r >= 16 && c < 8)) continue;
      if (seededRandom() > 0.45) {
        ctx.fillStyle = seededRandom() > 0.90 ? brandColor : "#080810";
        ctx.fillRect(c * moduleSize, r * moduleSize, moduleSize, moduleSize);
      }
    }
  }
}

// ==========================================
// 08 — STUDENT DASHBOARD & TICKET WALLET
// ==========================================

function renderDashboard() {
  const options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
  document.getElementById("dashboard-current-date").textContent = new Date().toLocaleDateString('en-US', options);

  // Profile details
  document.getElementById("db-profile-avatar").src = USER_PROFILE.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80";
  document.getElementById("db-profile-name").textContent = USER_PROFILE.name || "Student";
  document.getElementById("db-profile-id").textContent = USER_PROFILE.id || "N/A";
  document.getElementById("db-profile-email").textContent = USER_PROFILE.email || "N/A";
  document.getElementById("db-profile-dept").textContent = USER_PROFILE.department || "N/A";
  document.getElementById("db-profile-year").textContent = USER_PROFILE.yearOfStudy || "N/A";
  document.getElementById("db-profile-phone").textContent = USER_PROFILE.phone || "N/A";
  document.getElementById("db-profile-college").textContent = USER_PROFILE.collegeName || "N/A";

  // Wallet stubs card shelf (Flipkart / BookMyShow styles)
  const listContainer = document.getElementById("dashboard-list-container");
  listContainer.innerHTML = "";

  const completedCount = USER_REGISTRATIONS.filter(r => r.checkedIn === true).length;
  const upcomingCount = USER_REGISTRATIONS.filter(r => r.checkedIn !== true).length;
  
  document.getElementById("stat-attended").textContent = completedCount;
  document.getElementById("stat-upcoming").textContent = upcomingCount;
  document.getElementById("stat-certs").textContent = completedCount;

  if (USER_REGISTRATIONS.length === 0) {
    listContainer.innerHTML = `
      <div style="padding: var(--space-xl) 0; text-align: left; color: var(--muted-white);">
        <p class="body-desc">Wallet is empty. You haven't booked any active event passes.</p>
      </div>
    `;
  } else {
    USER_REGISTRATIONS.forEach(reg => {
      const card = document.createElement("div");
      card.className = "ticket-wallet-card";
      card.style.setProperty("--ticket-color", reg.color);
      
      const isChecked = reg.checkedIn === true;
      const statusBadgeClass = isChecked ? "badge-approved" : "badge-pending";
      const statusText = isChecked ? "Checked In" : "Active Pass";

      card.innerHTML = `
        <div class="ticket-wallet-header">
          <span class="chip chip-${reg.type}" style="font-size:10px !important;">${reg.typeLabel}</span>
          <span class="badge-status ${statusBadgeClass}">${statusText}</span>
        </div>
        <div class="ticket-wallet-body">
          <div class="ticket-wallet-info">
            <h3 style="font-size: 15px !important; font-weight: 800; line-height:1.2; margin-bottom: 2px;">${reg.title}</h3>
            <span style="font-size:12px; color:var(--muted-white);">${reg.date} • ${reg.time}</span>
            <span style="font-size:11px; color:var(--soft-purple); font-weight:700;">📍 ${reg.location}</span>
          </div>
          <div class="ticket-wallet-qr">
            <canvas id="qr-canvas-${reg.ticketId}"></canvas>
          </div>
        </div>
        <div class="ticket-wallet-perf"></div>
        <div class="ticket-wallet-footer">
          <span style="font-family:monospace; color:var(--muted-white); font-size: 11px;">ID: ${reg.ticketId}</span>
          <span style="color:var(--nova-yellow); cursor:pointer; font-weight:800; text-transform:uppercase; letter-spacing:0.5px;" onclick="viewPassDetails('${reg.ticketId}')">Present Pass</span>
        </div>
      `;
      listContainer.appendChild(card);
      
      // Draw live canvas QR code inside card
      drawTicketQRCode(`qr-canvas-${reg.ticketId}`, reg.ticketId, reg.color);
    });
  }

  renderNotifications();
}

window.viewPassDetails = function(ticketId) {
  const reg = USER_REGISTRATIONS.find(r => r.ticketId === ticketId);
  if (reg) {
    showTicket(reg);
  }
};

// ==========================================
// 09 — MOTION SYSTEMS & CONFETTI CELEBRATION
// ==========================================

function triggerConfetti() {
  const canvas = document.getElementById("confetti-canvas");
  const ctx = canvas.getContext("2d");
  
  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = canvas.parentElement.clientHeight;

  const colors = ["#E8614A", "#8B6FD4", "#C8E84A", "#F28070", "#B89EF0"];
  const particles = [];

  for (let i = 0; i < 80; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * -50,
      r: Math.random() * 4 + 3,
      d: Math.random() * canvas.height,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.random() * 10 - 5,
      tiltAngleIncremental: Math.random() * 0.07 + 0.02,
      tiltAngle: 0,
      velocity: {
        x: Math.random() * 2 - 1,
        y: Math.random() * 3 + 2
      }
    });
  }

  let animationFrame;
  const start = Date.now();

  function drawConfetti() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    let active = false;

    particles.forEach(p => {
      ctx.beginPath();
      ctx.lineWidth = p.r;
      ctx.strokeStyle = p.color;
      ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
      ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
      ctx.stroke();

      p.y += p.velocity.y;
      p.x += p.velocity.x;
      p.tiltAngle += p.tiltAngleIncremental;
      p.tilt = Math.sin(p.tiltAngle) * 12;

      if (p.y < canvas.height) active = true;
    });

    if (active && Date.now() - start < 3000) {
      animationFrame = requestAnimationFrame(drawConfetti);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      cancelAnimationFrame(animationFrame);
    }
  }

  drawConfetti();
}

function showToast(message, borderColor = "var(--galactic-purple)", iconColor = "var(--galactic-purple)") {
  const toast = document.getElementById("app-toast");
  const textSpan = document.getElementById("toast-text");
  
  textSpan.textContent = message;
  toast.style.setProperty("--border-color", borderColor);
  toast.style.setProperty("--icon-color", iconColor);

  toast.classList.add("show");
  
  setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

// Update status bar time
function updateStatusBarTime() {
  const timeText = document.getElementById("status-time");
  const now = new Date();
  let hr = now.getHours();
  let min = now.getMinutes();
  
  hr = hr < 10 ? '0' + hr : hr;
  min = min < 10 ? '0' + min : min;
  
  timeText.textContent = `${hr}:${min}`;
}
setInterval(updateStatusBarTime, 60000);
updateStatusBarTime();

// ==========================================
// 10 — FIREBASE SIMULATOR & SEEDING MODULES
// ==========================================

const FirebaseService = {
  auth: {
    createUserWithEmailAndPassword: async (email, password, profileData) => {
      if (useRealFirebase) {
        const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
        const uid = userCredential.user.uid;
        
        await firebase.firestore().collection("students").doc(uid).set({
          uid,
          ...profileData,
          email: email.toLowerCase()
        });
        
        return { user: { uid, email } };
      } else {
        await new Promise(resolve => setTimeout(resolve, 500));
        let users = JSON.parse(localStorage.getItem("firebase_mock_users") || "{}");
        if (users[email.toLowerCase()]) {
          throw new Error("auth/email-already-in-use");
        }
        
        const uid = "uid_" + Math.random().toString(36).substr(2, 9);
        users[email.toLowerCase()] = {
          uid,
          email: email.toLowerCase(),
          password,
          profileData: {
            ...profileData,
            uid,
            email: email.toLowerCase()
          }
        };
        localStorage.setItem("firebase_mock_users", JSON.stringify(users));
        return { user: { uid, email } };
      }
    },
    
    signInWithEmailAndPassword: async (email, password) => {
      if (useRealFirebase) {
        const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
        return { user: { uid: userCredential.user.uid, email: userCredential.user.email } };
      } else {
        await new Promise(resolve => setTimeout(resolve, 400));
        let users = JSON.parse(localStorage.getItem("firebase_mock_users") || "{}");
        const user = users[email.toLowerCase()];
        if (!user || user.password !== password) {
          throw new Error("auth/invalid-credential");
        }
        return { user: { uid: user.uid, email: user.email } };
      }
    },

    signOut: async () => {
      if (useRealFirebase) {
        await firebase.auth().signOut();
      }
    },

    sendPasswordResetEmail: async (email) => {
      if (useRealFirebase) {
        await firebase.auth().sendPasswordResetEmail(email);
      } else {
        await new Promise(resolve => setTimeout(resolve, 300));
        let users = JSON.parse(localStorage.getItem("firebase_mock_users") || "{}");
        if (!users[email.toLowerCase()]) {
          throw new Error("auth/user-not-found");
        }
        console.log(`Password reset link sent to ${email} (Simulated).`);
      }
    },

    signInWithGoogle: async () => {
      if (useRealFirebase) {
        const provider = new firebase.auth.GoogleAuthProvider();
        const result = await firebase.auth().signInWithPopup(provider);
        return {
          user: {
            uid: result.user.uid,
            email: result.user.email,
            displayName: result.user.displayName
          }
        };
      } else {
        await new Promise(resolve => setTimeout(resolve, 500));
        return {
          user: {
            uid: "uid_google123",
            email: "google.student@rit.ac.in",
            displayName: "GOOGLE TEST STUDENT"
          }
        };
      }
    }
  },
  
  db: {
    getStudentDoc: async (uid) => {
      if (useRealFirebase) {
        const doc = await firebase.firestore().collection("students").doc(uid).get();
        return {
          exists: () => doc.exists,
          data: () => doc.data()
        };
      } else {
        await new Promise(resolve => setTimeout(resolve, 200));
        let users = JSON.parse(localStorage.getItem("firebase_mock_users") || "{}");
        for (const email in users) {
          if (users[email].uid === uid) {
            return { exists: () => true, data: () => users[email].profileData };
          }
        }
        return { exists: () => false };
      }
    },
    
    saveStudentDoc: async (uid, data) => {
      if (useRealFirebase) {
        await firebase.firestore().collection("students").doc(uid).set(data, { merge: true });
      } else {
        await new Promise(resolve => setTimeout(resolve, 200));
        let users = JSON.parse(localStorage.getItem("firebase_mock_users") || "{}");
        for (const email in users) {
          if (users[email].uid === uid) {
            users[email].profileData = { ...users[email].profileData, ...data };
            localStorage.setItem("firebase_mock_users", JSON.stringify(users));
            return;
          }
        }
        throw new Error("firestore/document-not-found");
      }
    }
  }
};

function seedMockDatabase() {
  let users = JSON.parse(localStorage.getItem("firebase_mock_users") || "{}");
  
  if (!users["sirin@rit.ac.in"]) {
    users["sirin@rit.ac.in"] = {
      uid: "uid_sirin123",
      email: "sirin@rit.ac.in",
      password: "password123",
      profileData: {
        uid: "uid_sirin123",
        name: "SIRIN MATHEWS",
        email: "sirin@rit.ac.in",
        id: "RIT22CS089",
        registerNo: "RIT22CS089",
        department: "Computer Science & Engineering",
        year: "3rd Year",
        yearOfStudy: "3rd Year",
        phone: "+919876543210",
        collegeName: "Rajiv Gandhi Institute of Technology",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80",
        approved: true
      }
    };
  }

  if (!users["admin@rit.ac.in"]) {
    users["admin@rit.ac.in"] = {
      uid: "uid_admin123",
      email: "admin@rit.ac.in",
      password: "admin123",
      profileData: {
        uid: "uid_admin123",
        name: "ADMINISTRATOR",
        email: "admin@rit.ac.in",
        id: "ADMIN-01",
        registerNo: "ADMIN-01",
        department: "Administration",
        year: "N/A",
        yearOfStudy: "N/A",
        phone: "+91 00000 00000",
        collegeName: "IEDC RIT Admin",
        avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=100&q=80",
        approved: true,
        role: "admin"
      }
    };
  }

  localStorage.setItem("firebase_mock_users", JSON.stringify(users));

  // Seed initial events and tournaments in localStorage
  let mockEvents = JSON.parse(localStorage.getItem("firebase_mock_events") || "[]");
  if (mockEvents.length === 0) {
    mockEvents = [
      {
        id: "gen-ai-bootcamp-01",
        eventId: "gen-ai-bootcamp-01",
        title: "Generative AI Bootcamp",
        type: "workshop",
        typeLabel: "Workshop",
        date: "24 June, 2026",
        isoDate: "2026-06-24T10:00:00",
        time: "10:00 AM",
        seats: 25,
        price: "₹150",
        host: "Dr. Elizabeth George, AI Research lead at TechCorp",
        speakerLinkedin: "https://linkedin.com",
        location: "RIT CSE Seminar Hall",
        mode: "offline",
        description: "Hands-on engineering bootcamp on training, fine-tuning, and evaluating LLMs. Build complete systems.",
        color: "#C8E84A",
        hasTeam: false,
        maxTeamSize: 1,
        poster: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=600&q=80",
        upi: "iedcrit@okaxis"
      },
      {
        id: "founder-stories-talk-02",
        eventId: "founder-stories-talk-02",
        title: "Scaling Fintech: Founder Stories",
        type: "talk",
        typeLabel: "Talk",
        date: "25 June, 2026",
        isoDate: "2026-06-25T14:30:00",
        time: "02:30 PM",
        seats: 120,
        price: "Free",
        host: "Arun Joy, CEO at FinNovate",
        speakerLinkedin: "https://linkedin.com",
        location: "https://meet.google.com/abc-def-ghi",
        mode: "online",
        description: "Learn what it takes to build, validate, scale and raise capital for a fintech venture in India.",
        color: "#E8614A",
        hasTeam: false,
        maxTeamSize: 1,
        poster: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=600&q=80",
        upi: "iedcrit@okaxis"
      }
    ];
    localStorage.setItem("firebase_mock_events", JSON.stringify(mockEvents));
  }

  let mockTournaments = JSON.parse(localStorage.getItem("firebase_mock_tournaments") || "[]");
  if (mockTournaments.length === 0) {
    mockTournaments = [
      {
        id: "fifa-tournament-03",
        eventId: "fifa-tournament-03",
        title: "FIFA 2026 Arena",
        type: "tournament",
        typeLabel: "Tournament",
        date: "26 June, 2026",
        isoDate: "2026-06-26T09:00:00",
        time: "09:00 AM",
        seats: 64,
        price: "₹50",
        host: "RIT Sports Club, Organizing Committee",
        speakerLinkedin: "https://linkedin.com",
        location: "RIT Indoor Stadium",
        mode: "offline",
        description: "Standard single elimination FIFA 26 gaming bracket. Cash awards for top 3 champions.",
        color: "#8B6FD4",
        hasTeam: false,
        maxTeamSize: 1,
        poster: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=600&q=80",
        upi: "iedcrit@okaxis"
      }
    ];
    localStorage.setItem("firebase_mock_tournaments", JSON.stringify(mockTournaments));
  }
}
seedMockDatabase();

// ==========================================
// 11 — INTERACTION LOGIC & EVENT BINDINGS
// ==========================================

document.getElementById("profile-avatar-trigger").addEventListener("click", () => {
  openProfileSetup(true);
});

document.getElementById("btn-upload-avatar").addEventListener("click", () => {
  document.getElementById("setup-avatar-upload").click();
});

document.getElementById("setup-avatar-upload").addEventListener("change", function(e) {
  const file = e.target.files[0];
  if (!file) return;

  const type = file.type;
  if (type !== "image/jpeg" && type !== "image/jpg") {
    showToast("Avatar image must be in JPG/JPEG format.", "var(--error)", "var(--error)");
    this.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = function(event) {
    const url = event.target.result;
    document.getElementById("custom-avatar-preview").src = url;
    const radio = document.getElementById("radio-custom-avatar");
    radio.value = url;
    radio.checked = true;
    document.getElementById("custom-avatar-label").style.display = "block";
    showToast("Custom avatar picture loaded!", "var(--success)", "var(--success)");
  };
  reader.readAsDataURL(file);
});

document.getElementById("setup-email").addEventListener("input", function() {
  this.value = this.value.toLowerCase();
});
document.getElementById("login-email").addEventListener("input", function() {
  this.value = this.value.toLowerCase();
});
document.getElementById("setup-name").addEventListener("input", function() {
  this.value = this.value.toUpperCase();
});

function switchAuthTab(mode) {
  const loginTab = document.getElementById("auth-tab-login");
  const registerTab = document.getElementById("auth-tab-register");
  const loginForm = document.getElementById("auth-login-form");
  const registerForm = document.getElementById("profile-setup-form");
  const forgotForm = document.getElementById("auth-forgot-password-form");
  const title = document.getElementById("setup-title");
  const subtitle = document.getElementById("setup-subtitle");

  if (forgotForm) forgotForm.style.display = "none";
  document.getElementById("auth-tabs-container").style.display = "flex";

  if (mode === "login") {
    loginTab.classList.add("active");
    registerTab.classList.remove("active");
    loginForm.style.display = "block";
    registerForm.style.display = "none";
    title.textContent = "Welcome Back";
    subtitle.textContent = "Sign in to discover and register for events.";
  } else {
    loginTab.classList.remove("active");
    registerTab.classList.add("active");
    loginForm.style.display = "none";
    registerForm.style.display = "block";
    title.textContent = "Create Profile";
    subtitle.textContent = "Set up your credentials to access the IEDC event gateway.";
  }
}

document.getElementById("auth-tab-login").addEventListener("click", () => switchAuthTab("login"));
document.getElementById("auth-tab-register").addEventListener("click", () => switchAuthTab("register"));

document.getElementById("btn-forgot-password").addEventListener("click", () => {
  document.getElementById("auth-tabs-container").style.display = "none";
  document.getElementById("auth-login-form").style.display = "none";
  document.getElementById("auth-forgot-password-form").style.display = "block";
  document.getElementById("setup-title").textContent = "Reset Password";
  document.getElementById("setup-subtitle").textContent = "Enter your email to receive a password reset link.";
});

document.getElementById("btn-forgot-back").addEventListener("click", () => {
  document.getElementById("auth-forgot-password-form").style.display = "none";
  document.getElementById("auth-tabs-container").style.display = "flex";
  document.getElementById("auth-login-form").style.display = "block";
  document.getElementById("setup-title").textContent = "Welcome Back";
  document.getElementById("setup-subtitle").textContent = "Sign in to discover and register for events.";
});

document.getElementById("auth-forgot-password-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("forgot-email").value.trim().toLowerCase();
  
  const submitBtn = e.target.querySelector("button[type='submit']");
  submitBtn.disabled = true;
  submitBtn.textContent = "Sending...";
  
  try {
    await FirebaseService.auth.sendPasswordResetEmail(email);
    showToast("Password reset email sent!", "var(--success)", "var(--success)");
    document.getElementById("forgot-email").value = "";
    document.getElementById("btn-forgot-back").click();
  } catch (error) {
    showToast("Error sending reset email.", "var(--error)", "var(--error)");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Send Reset Link";
  }
});

function checkApprovalAndRoute(profileData) {
  if (profileData.role === "admin" || profileData.email === "admin@rit.ac.in") {
    window.location.href = "admin.html";
  } else if (profileData.approved === true) {
    navigateTo("home");
    // Show promotional banner popup widget on homepage load!
    if (typeof showAdOverlay !== "undefined") {
      setTimeout(showAdOverlay, 1500);
    }
  } else {
    document.getElementById("pending-student-name").textContent = profileData.name || "Student";
    navigateTo("pending");
  }
}

document.getElementById("auth-login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("login-email").value.trim().toLowerCase();
  const password = document.getElementById("login-password").value;
  
  const submitBtn = e.target.querySelector("button[type='submit']");
  submitBtn.disabled = true;
  submitBtn.textContent = "Verifying...";
  
  try {
    let credentials;
    let isMockAdmin = false;

    if (email === "admin@rit.ac.in" && password === "admin123") {
      isMockAdmin = true;
      credentials = { user: { uid: "uid_admin123", email: "admin@rit.ac.in" } };
    }

    if (!isMockAdmin) {
      credentials = await FirebaseService.auth.signInWithEmailAndPassword(email, password);
    }

    const docSnap = await FirebaseService.db.getStudentDoc(credentials.user.uid);
    if (docSnap.exists()) {
      USER_PROFILE = docSnap.data();
      sessionStorage.setItem("loggedInUserUid", credentials.user.uid);
      updateUserProfileUI();
      checkApprovalAndRoute(USER_PROFILE);
    } else {
      if (email === "admin@rit.ac.in") {
        USER_PROFILE = {
          uid: credentials.user.uid,
          name: "ADMINISTRATOR",
          email: "admin@rit.ac.in",
          id: "ADMIN-01",
          registerNo: "ADMIN-01",
          department: "Administration",
          year: "N/A",
          yearOfStudy: "N/A",
          phone: "+91 00000 00000",
          collegeName: "IEDC RIT Admin",
          avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=100&q=80",
          approved: true,
          role: "admin"
        };
        await FirebaseService.db.saveStudentDoc(credentials.user.uid, USER_PROFILE);
        sessionStorage.setItem("loggedInUserUid", credentials.user.uid);
        updateUserProfileUI();
        checkApprovalAndRoute(USER_PROFILE);
      } else {
        throw new Error("auth/user-not-found");
      }
    }
  } catch (error) {
    showToast("Invalid credentials. Try again.", "var(--error)", "var(--error)");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Login & Enter";
  }
});

document.getElementById("btn-google-auth").addEventListener("click", async () => {
  try {
    const credentials = await FirebaseService.auth.signInWithGoogle();
    const uid = credentials.user.uid;
    const docSnap = await FirebaseService.db.getStudentDoc(uid);

    if (docSnap.exists()) {
      USER_PROFILE = docSnap.data();
      sessionStorage.setItem("loggedInUserUid", uid);
      updateUserProfileUI();
      checkApprovalAndRoute(USER_PROFILE);
    } else {
      sessionStorage.setItem("loggedInUserUid", uid);
      switchAuthTab("register");

      document.getElementById("setup-name").value = (credentials.user.displayName || "").toUpperCase();
      document.getElementById("setup-email").value = (credentials.user.email || "").toLowerCase();
      document.getElementById("setup-password").value = "GOOGLE_AUTH_USER";
      document.getElementById("setup-confirm-password").value = "GOOGLE_AUTH_USER";

      showToast("Authenticated! Setup profile details.", "var(--galactic-purple)", "var(--galactic-purple)");
    }
  } catch (e) {
    showToast("Google Authentication failed.", "var(--error)", "var(--error)");
  }
});

document.getElementById("profile-setup-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("setup-name").value.trim();
  const email = document.getElementById("setup-email").value.trim().toLowerCase();
  const password = document.getElementById("setup-password").value;
  const confirmPassword = document.getElementById("setup-confirm-password").value;
  const id = document.getElementById("setup-id").value.trim();
  const department = document.getElementById("setup-department").value;
  const yearOfStudy = document.getElementById("setup-year").value;
  const phone = document.getElementById("setup-phone").value.trim();
  const college = document.getElementById("setup-college").value.trim();

  let avatar = "";
  document.getElementsByName("setup-avatar").forEach(radio => {
    if (radio.checked) avatar = radio.value;
  });

  const isUpdating = sessionStorage.getItem("loggedInUserUid") !== null;

  if (!isUpdating && password !== confirmPassword) {
    showToast("Passwords do not match.", "var(--error)", "var(--error)");
    return;
  }

  const submitBtn = document.getElementById("btn-setup-submit");
  submitBtn.disabled = true;
  submitBtn.textContent = "Processing...";

  try {
    const profileData = {
      name,
      email,
      password,
      registerNo: id,
      id,
      department,
      year: yearOfStudy,
      yearOfStudy,
      phone,
      collegeName: college,
      avatar,
      approved: isUpdating ? (USER_PROFILE.approved === true) : false,
      createdAt: new Date().toISOString()
    };

    if (isUpdating) {
      const uid = sessionStorage.getItem("loggedInUserUid");
      await FirebaseService.db.saveStudentDoc(uid, profileData);
      USER_PROFILE = { ...profileData, uid };
      updateUserProfileUI();
      
      if (USER_PROFILE.approved === true) {
        showToast("Profile settings saved!", "var(--success)", "var(--success)");
        navigateTo("home");
      } else {
        showToast("Profile registered. Pending review.", "var(--warning)", "var(--warning)");
        checkApprovalAndRoute(USER_PROFILE);
      }
    } else {
      const credentials = await FirebaseService.auth.createUserWithEmailAndPassword(email, password, profileData);
      USER_PROFILE = { ...profileData, uid: credentials.user.uid };
      sessionStorage.setItem("loggedInUserUid", credentials.user.uid);
      updateUserProfileUI();
      showToast("Profile submitted for approval.", "var(--warning)", "var(--warning)");
      checkApprovalAndRoute(USER_PROFILE);
    }
  } catch (err) {
    showToast("Error processing registration.", "var(--error)", "var(--error)");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Register & Enter";
  }
});

function updateUserProfileUI() {
  const name = USER_PROFILE.name;
  const email = USER_PROFILE.email;
  const id = USER_PROFILE.id;
  const college = USER_PROFILE.collegeName;
  const avatar = USER_PROFILE.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80";

  document.querySelectorAll(".avatar-img").forEach(img => {
    if (!img.closest(".avatar-option")) {
      img.src = avatar;
    }
  });

  const greetings = document.querySelector(".dashboard-greeting");
  if (greetings) {
    greetings.textContent = `Hey ${name.split(" ")[0]} 👋`;
  }
}

function openProfileSetup(isEditing = false) {
  const title = document.getElementById("setup-title");
  const subtitle = document.getElementById("setup-subtitle");
  const submitBtn = document.getElementById("btn-setup-submit");
  const backBtn = document.getElementById("setup-back-btn");
  const tabsContainer = document.getElementById("auth-tabs-container");
  const loginForm = document.getElementById("auth-login-form");
  const registerForm = document.getElementById("profile-setup-form");

  if (isEditing) {
    tabsContainer.style.display = "none";
    loginForm.style.display = "none";
    registerForm.style.display = "block";

    title.textContent = "Edit Profile";
    subtitle.textContent = "Update your credentials for the IEDC event gateway.";
    submitBtn.textContent = "Save Changes";
    backBtn.style.display = "flex";

    document.getElementById("setup-name").value = USER_PROFILE.name || "";
    document.getElementById("setup-email").value = USER_PROFILE.email || "";
    document.getElementById("setup-password").value = USER_PROFILE.password || "";
    document.getElementById("setup-confirm-password").value = USER_PROFILE.password || "";
    document.getElementById("setup-id").value = USER_PROFILE.id || "";
    document.getElementById("setup-department").value = USER_PROFILE.department || "";
    document.getElementById("setup-year").value = USER_PROFILE.yearOfStudy || "";
    document.getElementById("setup-phone").value = USER_PROFILE.phone || "";
    document.getElementById("setup-college").value = USER_PROFILE.collegeName || "";
  } else {
    tabsContainer.style.display = "flex";
    backBtn.style.display = "none";
    switchAuthTab("login");
  }

  navigateTo("auth");
}

async function handleSignOut() {
  await FirebaseService.auth.signOut();
  sessionStorage.removeItem("loggedInUserUid");
  USER_PROFILE = { name: "", email: "", id: "", password: "", department: "", yearOfStudy: "", phone: "", collegeName: "", avatar: "", approved: false };
  navigateTo("auth");
}

document.getElementById("btn-logout").addEventListener("click", handleSignOut);
document.getElementById("btn-pending-logout").addEventListener("click", handleSignOut);

// Dashboard tabs navigation
function switchDashboardTab(tabId) {
  const tabs = ["profile", "events", "notifications"];
  tabs.forEach(t => {
    const tabEl = document.getElementById(`db-tab-${t}`);
    const contentEl = document.getElementById(`db-content-${t}`);
    if (t === tabId) {
      if (tabEl) tabEl.classList.add("active");
      if (contentEl) contentEl.style.display = "block";
    } else {
      if (tabEl) tabEl.classList.remove("active");
      if (contentEl) contentEl.style.display = "none";
    }
  });
}
document.getElementById("db-tab-profile").addEventListener("click", () => switchDashboardTab("profile"));
document.getElementById("db-tab-events").addEventListener("click", () => switchDashboardTab("events"));
document.getElementById("db-tab-notifications").addEventListener("click", () => switchDashboardTab("notifications"));

const NOTIFICATIONS_DATA = [
  { id: "1", title: "Welcome to IEDC RIT Gateway!", body: "Your profile is active. Discover upcoming workshops, hackathons, and talks, and manage your tickets instantly.", time: "Just Now" },
  { id: "2", title: "InnovateRIT Hackathon Registration Open", body: "Build a prototype in 24 hours. The flagship hackathon has registration slots open for team registrations.", time: "2 Hours Ago" },
  { id: "3", title: "AI/ML Bootcamp Registration Fee", body: "Please make sure to complete payment for AI/ML Hands-on Bootcamp (₹150) to secure your seat.", time: "1 Day Ago" }
];

function renderNotifications() {
  const container = document.getElementById("notifications-list-container");
  if (!container) return;
  container.innerHTML = "";
  NOTIFICATIONS_DATA.forEach(n => {
    const card = document.createElement("div");
    card.className = "notification-card";
    card.innerHTML = `
      <span class="notification-title">${n.title}</span>
      <p class="notification-body">${n.body}</p>
      <span class="notification-time">${n.time}</span>
    `;
    container.appendChild(card);
  });
}

// Gating PhonePe callback parameters
async function checkPhonePeCallback() {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has("phonepe_success") && urlParams.has("txnId")) {
    const txnId = urlParams.get("txnId");
    
    // Retrieve pending registration details
    let pendingReg = null;
    try {
      pendingReg = JSON.parse(localStorage.getItem("pending_phonepe_registration"));
    } catch (e) {
      console.error("Failed to parse pending registration:", e);
    }
    
    // Fallback: If pendingReg is empty, mock it from Firestore if useRealFirebase is active
    if (!pendingReg && useRealFirebase) {
      try {
        const db = firebase.firestore();
        const snap = await db.collection("registrations").where("razorpayPaymentId", "==", txnId).get();
        if (!snap.empty) {
          snap.forEach(doc => {
            pendingReg = doc.data();
          });
        }
      } catch (err) {
        console.error("Firestore pending registration lookup failed:", err);
      }
    }

    if (pendingReg && (pendingReg.razorpayPaymentId === txnId || pendingReg.registrationId === txnId || txnId.includes(pendingReg.registrationId))) {
      // Clear pending transaction from localStorage
      localStorage.removeItem("pending_phonepe_registration");
      
      // Clear URL query parameters to avoid duplicate confirmations on page refresh
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Update status to Confirmed
      pendingReg.status = "Confirmed";
      
      // Save confirmed registration in mock local storage
      try {
        let mockRegs = JSON.parse(localStorage.getItem("firebase_mock_registrations") || "[]");
        // Remove duplicate pending/confirmed instances
        mockRegs = mockRegs.filter(r => r.registrationId !== pendingReg.registrationId);
        mockRegs.push(pendingReg);
        localStorage.setItem("firebase_mock_registrations", JSON.stringify(mockRegs));
        
        // Decrement seats in mock events
        let mockEvents = JSON.parse(localStorage.getItem("firebase_mock_events") || "[]");
        let evIdx = mockEvents.findIndex(e => e.id === pendingReg.eventId);
        if (evIdx !== -1) {
          mockEvents[evIdx].seats = Math.max(0, (mockEvents[evIdx].seats || 50) - 1);
          localStorage.setItem("firebase_mock_events", JSON.stringify(mockEvents));
        }
        let mockTours = JSON.parse(localStorage.getItem("firebase_mock_tournaments") || "[]");
        let tourIdx = mockTours.findIndex(t => t.id === pendingReg.eventId);
        if (tourIdx !== -1) {
          mockTours[tourIdx].seats = Math.max(0, (mockTours[tourIdx].seats || 50) - 1);
          localStorage.setItem("firebase_mock_tournaments", JSON.stringify(mockTours));
        }
      } catch (e) {}
      
      // Save confirmed registration to real Firestore
      if (useRealFirebase) {
        try {
          const db = firebase.firestore();
          await db.collection("registrations").doc(pendingReg.registrationId).set(pendingReg);
          
          const targetCol = selectedEvent && selectedEvent.type === "tournament" ? "tournaments" : "events";
          await db.collection(targetCol).doc(pendingReg.eventId).update({
            seats: firebase.firestore.FieldValue.increment(-1)
          });
        } catch (err) {
          console.error("Firestore status commit failed:", err);
        }
      }
      
      // Sync and present success pass
      await syncRegistrations();
      triggerConfetti();
      showToast("Payment Verified & Ticket Issued!", "var(--success)", "var(--success)");
      
      showTicket(pendingReg);
    } else {
      // Clear URL query parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }
}

// Session Initializer Gating check
async function initSession() {
  const cachedUid = sessionStorage.getItem("loggedInUserUid");
  if (cachedUid) {
    try {
      const docSnap = await FirebaseService.db.getStudentDoc(cachedUid);
      if (docSnap.exists()) {
        USER_PROFILE = docSnap.data();
        updateUserProfileUI();
        
        // Check PhonePe callback redirection query parameters
        await checkPhonePeCallback();
        
        checkApprovalAndRoute(USER_PROFILE);
      } else {
        sessionStorage.removeItem("loggedInUserUid");
        openProfileSetup(false);
      }
    } catch (e) {
      openProfileSetup(false);
    }
  } else {
    openProfileSetup(false);
  }
}

initSession();
