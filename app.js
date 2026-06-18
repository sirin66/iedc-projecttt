// ==========================================================================
// 01 — APPLICATION STATE & CONFIGURATION
// ==========================================================================

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
let activeRegistrationData = null;
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

// Initialize auth and mock/real onAuthStateChanged listener wrapper
let authStateCallback = null;
const auth = useRealFirebase ? firebase.auth() : {
  onAuthStateChanged: (callback) => {
    authStateCallback = callback;
    const cachedUid = sessionStorage.getItem("loggedInUserUid");
    if (cachedUid) {
      callback({ uid: cachedUid });
    } else {
      callback(null);
    }
    return () => { authStateCallback = null; };
  }
};

function onAuthStateChanged(authInstance, callback) {
  if (useRealFirebase && authInstance && typeof authInstance.onAuthStateChanged === "function") {
    return authInstance.onAuthStateChanged(callback);
  } else if (authInstance && typeof authInstance.onAuthStateChanged === "function") {
    return authInstance.onAuthStateChanged(callback);
  }
}

// ==========================================
// 02 — DOM ELEMENTS REGISTRY
// ==========================================

const screens = {
  auth: document.getElementById("screen-auth"),
  pending: document.getElementById("screen-pending"),
  home: document.getElementById("home-section"),
  detail: document.getElementById("screen-detail"),
  ticket: document.getElementById("screen-ticket"),
  profile: document.getElementById("profile-section"),
  wallet: document.getElementById("wallet-section"),
  news: document.getElementById("news-section")
};

const QR_SECRET_KEY = "RITU_GATEWAY_SECURE_2026_KEY";

// ==========================================
// 03 — ROUTING & SCREEN TRANSITIONS
// ==========================================

async function switchTab(tabName) {
  if (detailCountdownInterval) clearInterval(detailCountdownInterval);

  // STRICT SECURITY CHECK: Do not allow navigation to inner tabs if not logged in
  const cachedUid = sessionStorage.getItem("loggedInUserUid");
  if (!cachedUid) {
    console.warn("Access denied: User not authenticated.");
    navigateTo("auth");
    return;
  }

  // 1. Hide all navigation sections completely
  document.querySelectorAll('.nav-section').forEach(section => {
    section.style.display = 'none';
    section.classList.remove('active');
  });

  // 2. Unhide the targeted section smoothly
  const activeSection = document.getElementById(`${tabName}-section`);
  if (activeSection) {
    activeSection.style.display = 'block';
    activeSection.classList.add('active');
  }

  // Hide any overlay screens if open (e.g. auth, pending, detail, ticket)
  const overlayIds = ["auth", "pending", "detail", "ticket"];
  overlayIds.forEach(id => {
    if (screens[id]) {
      screens[id].style.display = "none";
      screens[id].classList.remove("active");
    }
  });

  // Ensure bottom navigation bar is visible when tab sections are active if logged in
  const bottomNav = document.getElementById("bottom-nav") || document.querySelector(".bottom-nav");
  if (bottomNav) {
    const cachedUid = sessionStorage.getItem("loggedInUserUid");
    if (cachedUid) {
      bottomNav.classList.remove("nav-hidden");
      bottomNav.style.setProperty("display", "grid", "important");
    } else {
      bottomNav.classList.add("nav-hidden");
      bottomNav.style.setProperty("display", "none", "important");
    }
  }

  // 3. Update active neon state on bottom icons
  document.querySelectorAll('.bottom-nav-btn').forEach(btn => {
    btn.classList.remove('active-neon');
  });
  const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
  if (activeBtn) {
    activeBtn.classList.add('active-neon');
  }

  // 4. Trigger data syncing and layout rendering
  if (tabName === "home") {
    await syncEvents();
    renderHomeEvents();
  } else {
    await syncEvents();
    await syncRegistrations();
    renderDashboard();
  }
}
window.switchTab = switchTab;

async function navigateTo(screenId) {
  // If the target is one of the bottom tab pages, run switchTab instead
  if (["home", "wallet", "news", "profile"].includes(screenId)) {
    await switchTab(screenId);
    return;
  }

  // Hide all screens (both overlay screens and nav-sections)
  Object.entries(screens).forEach(([id, screen]) => {
    if (screen) {
      // Keep home section visible if details overlay (detail) is nested inside it
      if (screenId === "detail" && id === "home") {
        screen.style.display = "block";
        screen.classList.add("active");
        return;
      }
      screen.style.display = "none";
      screen.classList.remove("active");
    }
  });

  // Show targeted overlay screen
  const targetScreen = screens[screenId];
  if (targetScreen) {
    targetScreen.style.display = "block";
    targetScreen.classList.add("active");
  }

  const presentationContainer = document.querySelector(".presentation-container");
  if (presentationContainer) presentationContainer.style.display = "flex";

  const bottomNav = document.getElementById("bottom-nav") || document.querySelector(".bottom-nav");
  if (screenId === "auth" || screenId === "pending") {
    if (bottomNav) {
      bottomNav.classList.add("nav-hidden");
      bottomNav.style.setProperty("display", "none", "important");
    }
  } else {
    const cachedUid = sessionStorage.getItem("loggedInUserUid");
    if (cachedUid && bottomNav) {
      bottomNav.classList.remove("nav-hidden");
      bottomNav.style.setProperty("display", "grid", "important");
    } else {
      if (bottomNav) {
        bottomNav.classList.add("nav-hidden");
        bottomNav.style.setProperty("display", "none", "important");
      }
    }
  }
}

// Bind click event listeners dynamically to all bottom nav buttons
document.querySelectorAll(".bottom-nav-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const tabName = btn.getAttribute("data-tab");
    if (tabName) {
      switchTab(tabName);
    }
  });
});

document.getElementById("detail-back-btn").addEventListener("click", () => {
  if (detailCountdownInterval) clearInterval(detailCountdownInterval);
  switchTab("home");
});
document.getElementById("ticket-back-btn").addEventListener("click", () => switchTab("wallet"));
document.getElementById("setup-back-btn").addEventListener("click", () => switchTab("home"));

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
              phone: reg.phone || "",
              bankAccountName: reg.bankAccountName || ""
            });
          });

          USER_REGISTRATIONS = [...firebaseRegs];

          // Re-render dashboard in real-time
          const activeScreen = document.querySelector(".screen.active");
          if (activeScreen && ["profile-section", "wallet-section", "news-section"].includes(activeScreen.id)) {
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
            phone: reg.phone || "",
            bankAccountName: reg.bankAccountName || ""
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

  const regForm = document.getElementById("registration-form");
  const proceedBtn = document.getElementById("proceed-to-pay-btn") || document.getElementById("modal-pay-btn");
  const viewPassBtn = document.getElementById("view-ticket-pass-btn");
  const statusBanner = document.getElementById("registration-status-banner");
  const stickyCta = document.querySelector(".sticky-cta-container");
  const regBtn = document.getElementById("detail-register-btn");

  // Force-hide all dynamic checkout views immediately to prevent flashing PROCEED TO PAY button
  if (regForm) regForm.style.display = "none";
  if (proceedBtn) proceedBtn.style.display = "none";
  if (viewPassBtn) viewPassBtn.style.display = "none";
  if (statusBanner) statusBanner.style.display = "none";
  if (stickyCta) stickyCta.style.display = "none";
  if (regBtn) regBtn.style.display = "none";

  // Check user registration state synchronously
  if (activeRegistrationData && activeRegistrationData.eventId === event.id) {
    if (regForm) regForm.style.display = "none";

    // ടിക്കറ്റ് ഓൾറെഡി ഉള്ളവർക്ക് രണ്ട് മെയിൻ ബട്ടണുകളിലും 'VIEW TICKET' എന്ന് നിർബന്ധപൂർവ്വം മാറ്റുക
    if (proceedBtn) {
      proceedBtn.style.display = "block";
      proceedBtn.textContent = "VIEW TICKET";
    }
    if (regBtn) {
      regBtn.style.display = "flex";
      regBtn.textContent = "VIEW TICKET";
      regBtn.disabled = false;
      regBtn.style.backgroundColor = "var(--neon-yellow)";
      regBtn.style.color = "rgba(6, 6, 12, 1)";
    }
    if (activeRegistrationData.payment_status === "Success" || activeRegistrationData.status === "Confirmed") {
      if (statusBanner) statusBanner.style.display = "none";
    } else {
      if (statusBanner) {
        statusBanner.style.display = "block";
        statusBanner.textContent = "Awaiting Admin Payment Verification...";
      }
    }
    if (stickyCta) stickyCta.style.display = "block";
  } else {
    if (regForm) regForm.style.display = "flex";
    if (stickyCta) stickyCta.style.display = "block";
    if (regBtn) regBtn.style.display = "flex";

    if (event.seats <= 0) {
      if (regBtn) {
        regBtn.textContent = "Sold Out";
        regBtn.disabled = true;
        regBtn.style.backgroundColor = "rgba(255,255,255,0.1)";
      }
      if (proceedBtn) {
        proceedBtn.textContent = "Sold Out";
        proceedBtn.disabled = true;
        proceedBtn.style.backgroundColor = "rgba(255,255,255,0.1)";
      }
    } else {
      const btnText = "PROCEED TO PAY";
      if (regBtn) {
        regBtn.textContent = btnText;
        regBtn.disabled = false;
        regBtn.style.backgroundColor = "var(--neon-yellow)";
        regBtn.style.color = "rgba(6, 6, 12, 1)";
      }
      if (proceedBtn) {
        proceedBtn.textContent = btnText;
        proceedBtn.disabled = false;
        proceedBtn.style.backgroundColor = "var(--neon-yellow)";
        proceedBtn.style.color = "rgba(6, 6, 12, 1)";
        proceedBtn.style.display = "block";
      }
    }
  }

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
  const isOnline = event.mode === "online" || (event.location && event.location.toLowerCase().includes("http"));
  const mapLink = document.getElementById("detail-location-map-link");
  const meetDiv = document.getElementById("detail-location-meeting");
  const meetLink = document.getElementById("detail-meeting-link");
  const locationText = document.getElementById("detail-location-text");

  locationText.textContent = isOnline ? "Virtual / Digital Room" : (event.location || "TBD");

  if (isOnline) {
    mapLink.style.display = "none";
    meetDiv.style.display = "flex";
    meetLink.href = (event.location && event.location.startsWith("http")) ? event.location : "https://meet.google.com";
  } else {
    mapLink.style.display = "inline-block";
    mapLink.href = event.location ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}` : "#";
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
  document.getElementById("detail-upi-checkout-container").style.display = "none";
  document.getElementById("ticket-container").style.display = "none";

  // Apply real-time registration visibility state
  handleRealtimeRegistrationUpdate(activeRegistrationData);

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
    <button type="button" class="btn-remove-member" onclick="removeDetailTeamSlot(${teamMemberCount})">×</button>
  `;
  container.appendChild(div);
}

window.removeDetailTeamSlot = function (id) {
  const row = document.getElementById(`detail-member-row-${id}`);
  if (row) {
    row.remove();
    teamMemberCount--;
  }
};

document.getElementById("detail-btn-add-member").addEventListener("click", addDetailTeamSlot);

// EmailJS Credentials safely mapping in the background for admin approval use later
const EMAILJS_CONFIG = {
  SERVICE_ID: "service_u4ve6g2",
  TEMPLATE_ID: "template_jla3p4e"
};

// Hooking Register & Pay Click Event
document.getElementById("detail-register-btn").addEventListener("click", async () => {
  if (!selectedEvent) return;

  // ROUTING THE CLICK EVENT: Check if success or if text is currently "VIEW TICKET"
  const isSuccess = activeRegistrationData &&
    activeRegistrationData.eventId === selectedEvent.id &&
    (activeRegistrationData.payment_status === "Success" || activeRegistrationData.status === "Confirmed");
  const btnText = document.getElementById("detail-register-btn").textContent;

  if (btnText === "VIEW TICKET") {
    if (isSuccess) {
      showToast("Authenticating ticket status...", "var(--galactic-purple)", "var(--galactic-purple)");
      let verifiedReg = null;

      if (useRealFirebase) {
        try {
          const db = firebase.firestore();
          const activeUid = sessionStorage.getItem("loggedInUserUid") || (activeRegistrationData && activeRegistrationData.studentUid);
          if (activeUid) {
            const docSnap1 = await db.collection("registrations").doc("reg-" + activeUid).get();
            if (docSnap1.exists && (docSnap1.data().payment_status === "Success" || docSnap1.data().status === "Confirmed")) {
              verifiedReg = docSnap1.data();
            } else {
              const docSnap2 = await db.collection("registrations").doc(activeUid).get();
              if (docSnap2.exists && (docSnap2.data().payment_status === "Success" || docSnap2.data().status === "Confirmed")) {
                verifiedReg = docSnap2.data();
              }
            }
          }
        } catch (err) {
          console.error("Firestore verification error:", err);
        }
      } else {
        // Simulator Mode check
        try {
          const mockRegs = JSON.parse(localStorage.getItem("firebase_mock_registrations") || "[]");
          const activeUid = sessionStorage.getItem("loggedInUserUid");
          const mockReg = mockRegs.find(r => (r.registrationId === "reg-" + activeUid || r.registrationId === activeUid || r.studentUid === activeUid) && (r.payment_status === "Success" || r.status === "Confirmed"));
          if (mockReg) {
            verifiedReg = mockReg;
          }
        } catch (err) {
          console.error("Simulator verification error:", err);
        }
      }

      if (verifiedReg) {
        const match = EVENTS_DATA.find(e => e.id === verifiedReg.eventId);
        const regToPass = {
          id: verifiedReg.eventId,
          registrationId: verifiedReg.registrationId,
          ticketId: verifiedReg.registrationId,
          title: verifiedReg.eventTitle || (match ? match.title : "Event"),
          type: match ? match.type : "talk",
          typeLabel: match ? match.typeLabel : "Talk",
          date: match ? match.date : "TBD",
          isoDate: match ? match.isoDate : new Date().toISOString(),
          time: match ? match.time : "TBD",
          location: match ? match.location : "TBD",
          host: match ? match.host : "IEDC RIT",
          color: match ? match.color : "#C8E84A",
          status: verifiedReg.status || "Confirmed",
          checkedIn: verifiedReg.checkedIn === true,
          razorpayPaymentId: verifiedReg.razorpayPaymentId || verifiedReg.utrNumber || "FREE",
          phone: verifiedReg.phone || "",
          bankAccountName: verifiedReg.bankAccountName || ""
        };
        showTicket(regToPass);
      } else {
        showCustomAlert(
          "Access Denied",
          "Security Check Failed: Your payment verification is not complete."
        );
      }
    } else {
      // Throw secure custom alert and intercept/block the modal display. Show glass notice.
      const statusBanner = document.getElementById("registration-status-banner");
      if (statusBanner) {
        statusBanner.style.display = "block";
        statusBanner.textContent = "Awaiting Admin Payment Verification...";
      }
      alert("⚠️ Your payment is pending! Your ticket will be active once the Admin approves your registration.");
      showCustomAlert(
        "Verification Pending",
        "⚠️ Your payment is pending! Your ticket will be active once the Admin approves your registration."
      );
    }
    return;
  }

  // Fallback checking logic
  const isAlreadyRegistered = USER_REGISTRATIONS.some(r => r.id === selectedEvent.id);
  if (isAlreadyRegistered) {
    const reg = USER_REGISTRATIONS.find(r => r.id === selectedEvent.id);
    if (!reg) return;

    showToast("Authenticating ticket status...", "var(--galactic-purple)", "var(--galactic-purple)");

    let isSuccessVerify = false;

    if (useRealFirebase) {
      try {
        const db = firebase.firestore();
        const docSnap = await db.collection("registrations").doc(reg.registrationId).get();
        if (docSnap.exists) {
          const docData = docSnap.data();
          if (docData.payment_status === "Success" || docData.status === "Confirmed") {
            isSuccessVerify = true;
          }
        }
      } catch (err) {
        console.error("Firestore verification error:", err);
      }
    } else {
      // Simulator Mode check
      try {
        const mockRegs = JSON.parse(localStorage.getItem("firebase_mock_registrations") || "[]");
        const mockReg = mockRegs.find(r => r.registrationId === reg.registrationId);
        if (mockReg && (mockReg.payment_status === "Success" || mockReg.status === "Confirmed")) {
          isSuccessVerify = true;
        }
      } catch (err) {
        console.error("Simulator verification error:", err);
      }
    }

    if (isSuccessVerify) {
      showTicket(reg);
    } else {
      const statusBanner = document.getElementById("registration-status-banner");
      if (statusBanner) {
        statusBanner.style.display = "block";
        statusBanner.textContent = "Awaiting Admin Payment Verification...";
      }
      alert("⚠️ Your payment is pending! Your ticket will be active once the Admin approves your registration.");
      showCustomAlert(
        "Verification Pending",
        "⚠️ Your payment is pending! Your ticket will be active once the Admin approves your registration."
      );
    }
    return;
  }

  // Trigger HTML5 validation and submit form
  document.getElementById("registration-form").requestSubmit();
});

// Bind form submit event
document.getElementById("registration-form").addEventListener("submit", (e) => {
  e.preventDefault();
  handleRegistrationCheckout();
});

async function handleRegistrationCheckout() {
  if (!selectedEvent) return;

  // ===== STRICT VALIDATION: Bank Account Owner Name =====
  const bankAccountName = document.getElementById("detail-reg-bank-name").value.trim();
  if (!bankAccountName) {
    alert("Please enter the Bank Account Owner's Full Name to proceed with the payment");
    return;
  }

  const phone = document.getElementById("detail-reg-phone").value.trim();
  if (!phone) {
    showToast("Please enter contact phone number.", "var(--error)", "var(--error)");
    return;
  }

  const ktuid = USER_PROFILE.id || "";
  const eventId = selectedEvent.id || selectedEvent.eventId;

  // Set checkout processing status
  const proceedBtn = document.getElementById("proceed-to-pay-btn") || document.getElementById("modal-pay-btn");
  const originalBtnText = proceedBtn ? proceedBtn.textContent : "Proceed to Pay";
  if (proceedBtn) {
    proceedBtn.disabled = true;
    proceedBtn.textContent = "Checking details...";
  }

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
    if (proceedBtn) {
      proceedBtn.disabled = false;
      proceedBtn.textContent = originalBtnText;
    }

    // Close the detail modal
    if (detailCountdownInterval) clearInterval(detailCountdownInterval);
    navigateTo("home");

    // Trigger glassmorphic conflict alert
    showCustomAlert("Conflict", "Conflict: You are already registered for this event!");
    return;
  }

  // Restore button text for future opens
  if (proceedBtn) {
    proceedBtn.disabled = false;
    proceedBtn.textContent = originalBtnText;
  }

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

  // Compile registration data using user.uid for direct real-time snapshot sync
  const studentUid = sessionStorage.getItem("loggedInUserUid") || (USER_PROFILE && USER_PROFILE.uid) || (firebase.auth().currentUser && firebase.auth().currentUser.uid);
  const registrationId = "reg-" + studentUid;
  const merchantTransactionId = "TXN_" + registrationId;
  const registrationData = {
    registrationId,
    eventId,
    eventTitle: selectedEvent.title,
    studentName: USER_PROFILE.name,
    studentEmail: USER_PROFILE.email,
    registerNo: USER_PROFILE.id,
    bankAccountName, // Save the bank account owner's name here!
    phone,
    teamMembers,
    amount,
    razorpayPaymentId: merchantTransactionId, // PhonePe Transaction ID mapped here
    checkedIn: false,
    status: amount > 0 ? "Pending" : "Confirmed",
    payment_status: amount > 0 ? "Pending" : "Success",
    createdAt: new Date().toISOString(),
    studentUid: sessionStorage.getItem("loggedInUserUid"),
    timestamp: new Date().toISOString()
  };

  if (amount > 0) {
    // Save pending registration to database/localStorage first
    try {
      let mockRegs = JSON.parse(localStorage.getItem("firebase_mock_registrations") || "[]");
      if (!mockRegs.some(r => r.registrationId === registrationId)) {
        mockRegs.push(registrationData);
      } else {
        const idx = mockRegs.findIndex(r => r.registrationId === registrationId);
        mockRegs[idx] = registrationData;
      }
      localStorage.setItem("firebase_mock_registrations", JSON.stringify(mockRegs));
    } catch (e) {
      console.error("Local mock pending registration failed:", e);
    }

    localStorage.setItem("pending_phonepe_registration", JSON.stringify(registrationData));

    if (useRealFirebase) {
      try {
        const db = firebase.firestore();
        await db.collection("registrations").doc(registrationId).set(registrationData);
      } catch (err) {
        console.error("Firestore pending registration failed:", err);
      }
    }

    // Force action button to change text, lock click, and hide form fields layout instantly
    activeRegistrationData = registrationData;
    handleRealtimeRegistrationUpdate(registrationData);

    const regFormInstant = document.getElementById("registration-form");
    if (regFormInstant) regFormInstant.style.display = "none";

    // ഈ രണ്ട് സ്ഥലത്തെ ബട്ടണുകളും ഒന്നിച്ച് ഉടനെ തന്നെ ടെക്സ്റ്റ് മാറ്റി ലോക്ക് ചെയ്യുക
    const proceedBtnInstant = document.getElementById("proceed-to-pay-btn");
    if (proceedBtnInstant) {
      proceedBtnInstant.textContent = "VIEW TICKET";
    }
    const regBtnInstant = document.getElementById("detail-register-btn");
    if (regBtnInstant) {
      regBtnInstant.textContent = "VIEW TICKET";
      regBtnInstant.style.display = "flex";
      regBtnInstant.disabled = false;
      regBtnInstant.style.backgroundColor = "var(--neon-yellow)";
      regBtnInstant.style.color = "rgba(6, 6, 12, 1)";
    }

    if (detailCountdownInterval) clearInterval(detailCountdownInterval);

    // Set waiting verification overlay details
    const amountLabel = document.getElementById("waiting-amount-label");
    if (amountLabel) {
      amountLabel.textContent = `Amount Due: ₹${amount}`;
    }

    // Construct dynamic UPI deep-link intent using eventData
    const eventData = { ...selectedEvent };
    eventData.upiId = eventData.upiId || eventData.upi || "iedcrit@okaxis";
    eventData.price = amount;
    const upiLink = `upi://pay?pa=${eventData.upiId}&pn=${encodeURIComponent(eventData.title)}&am=${eventData.price}&cu=INR`;

    // Bind Direct UPI App Button links
    const gpayBtn = document.getElementById("upi-gpay-btn");
    const phonepeBtn = document.getElementById("upi-phonepe-btn");
    const paytmBtn = document.getElementById("upi-paytm-btn");
    if (gpayBtn) gpayBtn.href = upiLink;
    if (phonepeBtn) phonepeBtn.href = upiLink;
    if (paytmBtn) paytmBtn.href = upiLink;

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const mobileView = document.getElementById("waiting-mobile-view");
    const desktopView = document.getElementById("waiting-desktop-view");
    const upiMobileLink = document.getElementById("waiting-upi-mobile-link");
    const upiQrLink = document.getElementById("waiting-upi-qr-link");

    // Always set interactive QR wrapper link href to the UPI intent link
    if (upiQrLink) {
      upiQrLink.href = upiLink;
    }

    // Always draw dynamic QR code to the canvas inside the modal
    const upiCanvas = document.getElementById("waiting-upi-qr-canvas");
    if (upiCanvas) {
      new QRious({
        element: upiCanvas,
        value: upiLink,
        size: 130,
        background: "#FFFFFF",
        foreground: "#080810",
        level: "H"
      });
    }

    if (isMobile) {
      if (mobileView) mobileView.style.display = "flex";
      if (desktopView) desktopView.style.display = "flex"; // Show QR code container on mobile so it is clickable!
      if (upiMobileLink) {
        upiMobileLink.href = upiLink;
      }
      window.location.href = upiLink;
    } else {
      if (mobileView) mobileView.style.display = "none";
      if (desktopView) desktopView.style.display = "flex";
    }

    // Show waiting verification overlay
    const waitOverlay = document.getElementById("waiting-verification-overlay");
    if (waitOverlay) {
      waitOverlay.style.display = "flex";
    }

    // Watch pending verification status
    watchPendingVerification(registrationId, registrationData);

  } else {
    // Free registration is immediate
    await completeUpiRegistration(registrationData);
  }
}

function watchPendingVerification(registrationId, registrationData) {
  if (currentVerificationUnsubscribe) {
    currentVerificationUnsubscribe();
    currentVerificationUnsubscribe = null;
  }
  if (simulatorPollingInterval) {
    clearInterval(simulatorPollingInterval);
    simulatorPollingInterval = null;
  }

  if (useRealFirebase) {
    try {
      const db = firebase.firestore();
      currentVerificationUnsubscribe = db.collection("registrations").doc(registrationId)
        .onSnapshot((doc) => {
          if (doc.exists) {
            const data = doc.data();
            if (data.status === "Confirmed" || data.payment_status === "Success") {
              if (currentVerificationUnsubscribe) {
                currentVerificationUnsubscribe();
                currentVerificationUnsubscribe = null;
              }
              handleVerificationSuccess(data);
            }
          }
        }, (err) => {
          console.error("Error watching registration status:", err);
        });
    } catch (e) {
      console.error("Firebase watch failed:", e);
    }
  }

  simulatorPollingInterval = setInterval(() => {
    try {
      let mockRegs = JSON.parse(localStorage.getItem("firebase_mock_registrations") || "[]");
      const reg = mockRegs.find(r => r.registrationId === registrationId);
      if (reg && (reg.status === "Confirmed" || reg.payment_status === "Success")) {
        clearInterval(simulatorPollingInterval);
        simulatorPollingInterval = null;
        handleVerificationSuccess(reg);
      }
    } catch (err) {
      console.error("Local polling check error:", err);
    }
  }, 1000);
}

async function handleVerificationSuccess(registrationData) {
  if (currentVerificationUnsubscribe) {
    currentVerificationUnsubscribe();
    currentVerificationUnsubscribe = null;
  }
  if (simulatorPollingInterval) {
    clearInterval(simulatorPollingInterval);
    simulatorPollingInterval = null;
  }

  const waitOverlay = document.getElementById("waiting-verification-overlay");
  if (waitOverlay) {
    waitOverlay.style.display = "none";
  }

  triggerConfetti();
  showToast("Payment Verified & Ticket Issued!", "var(--success)", "var(--success)");

  const regForm = document.getElementById("registration-form");
  const upiCheckoutContainer = document.getElementById("detail-upi-checkout-container");
  const stickyCta = document.querySelector(".sticky-cta-container");

  if (regForm) regForm.style.display = "none";
  if (upiCheckoutContainer) upiCheckoutContainer.style.display = "none";
  if (stickyCta) stickyCta.style.display = "none";

  const ticketContainer = document.getElementById("ticket-container");
  if (ticketContainer) {
    ticketContainer.style.display = "flex";
  }

  const canvas = document.getElementById("ticket-qr-canvas");
  if (canvas) {
    drawQRToCanvas(canvas, registrationData.registrationId, selectedEvent.color || "#8B6FD4", 180);
  }

  await syncRegistrations();
}

async function completeUpiRegistration(registrationData) {
  if (detailCountdownInterval) clearInterval(detailCountdownInterval);

  // Confetti celebrations
  triggerConfetti();

  // Save registration ledger to Firestore / Simulator
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
  activeRegistrationData = registrationData;
  document.getElementById("detail-upi-checkout-container").style.display = "none";
  document.getElementById("registration-form").style.display = "none";
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

function encryptRegistrationId(id) {
  try {
    return CryptoJS.AES.encrypt(id, QR_SECRET_KEY).toString();
  } catch (e) {
    console.error("Encryption failed:", e);
    return id;
  }
}

// Canvas rendering with direct brand colour parameters maps correctly
function drawQRToCanvas(canvas, text, brandColor, size = 240) {
  if (!canvas) return;
  const encryptedText = encryptRegistrationId(text);

  new QRious({
    element: canvas,
    value: encryptedText,
    size: size,
    background: "#FFFFFF",
    foreground: "#080810",
    level: "H"
  });
}

// Draw QR inside stubs card inside wallet
function drawTicketQRCode(canvasId, text, brandColor) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const encryptedText = encryptRegistrationId(text);

  new QRious({
    element: canvas,
    value: encryptedText,
    size: 72,
    background: "#FFFFFF",
    foreground: "#080810",
    level: "H"
  });
}

function generateQRCode(text, brandColor) {
  const canvas = document.getElementById("qr-canvas");
  drawQRToCanvas(canvas, text, brandColor, 240);
}

// ==========================================
// 08 — STUDENT DASHBOARD & TICKET WALLET
// ==========================================

function renderDashboard() {
  const options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
  document.querySelectorAll(".dashboard-current-date").forEach(el => {
    el.textContent = new Date().toLocaleDateString('en-US', options);
  });

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

      const isPending = reg.status === "Pending";
      const isChecked = reg.checkedIn === true;

      let badgeStyle = "background: rgba(34, 197, 94, 0.12); border: 1px solid rgba(34, 197, 94, 0.25); color: #22c55e; padding: 4px 8px; border-radius: 6px; font-size: 10px; font-weight: 700;";
      let statusText = "✅ Confirmed";
      if (isPending) {
        badgeStyle = "background: rgba(234, 179, 8, 0.12); border: 1px solid rgba(234, 179, 8, 0.25); color: #eab308; padding: 4px 8px; border-radius: 6px; font-size: 10px; font-weight: 700;";
        statusText = "⏳ Processing Payment...";
      } else if (isChecked) {
        badgeStyle = "background: rgba(59, 130, 246, 0.12); border: 1px solid rgba(59, 130, 246, 0.25); color: #3b82f6; padding: 4px 8px; border-radius: 6px; font-size: 10px; font-weight: 700;";
        statusText = "Checked In";
      }

      const qrSection = isPending
        ? `<div style="font-size:9px; color:#eab308; font-weight:700; max-width:80px; text-align:center; line-height:1.3;">Pending Verification</div>`
        : `<canvas id="qr-canvas-${reg.ticketId}"></canvas>`;

      const footerAction = isPending
        ? `<span style="color:var(--muted-white); font-weight:600; text-transform:uppercase; font-size:10px; letter-spacing:0.5px;">Pending Verification</span>`
        : `<span style="color:var(--nova-yellow); cursor:pointer; font-weight:800; text-transform:uppercase; letter-spacing:0.5px;" onclick="viewPassDetails('${reg.ticketId}')">Present Pass</span>`;

      card.innerHTML = `
        <div class="ticket-wallet-header">
          <span class="chip chip-${reg.type}" style="font-size:10px !important;">${reg.typeLabel}</span>
          <span style="${badgeStyle}">${statusText}</span>
        </div>
        <div class="ticket-wallet-body">
          <div class="ticket-wallet-info">
            <h3 style="font-size: 15px !important; font-weight: 800; line-height:1.2; margin-bottom: 2px;">${reg.title}</h3>
            <span style="font-size:12px; color:var(--muted-white);">${reg.date} • ${reg.time}</span>
            <span style="font-size:11px; color:var(--soft-purple); font-weight:700;">📍 ${reg.location}</span>
          </div>
          <div class="ticket-wallet-qr" style="${isPending ? 'background:transparent; border:1.5px dashed rgba(234,179,8,0.3); padding:4px; display:flex; align-items:center; justify-content:center; border-radius:8px;' : ''}">
            ${qrSection}
          </div>
        </div>
        <div class="ticket-wallet-perf"></div>
        <div class="ticket-wallet-footer">
          <span style="font-family:monospace; color:var(--muted-white); font-size: 11px;">ID: ${reg.ticketId}</span>
          ${footerAction}
        </div>
      `;
      listContainer.appendChild(card);

      // Draw live canvas QR code inside card ONLY if confirmed
      if (!isPending) {
        drawTicketQRCode(`qr-canvas-${reg.ticketId}`, reg.ticketId, reg.color);
      }
    });
  }

  renderNotifications();
}

window.viewPassDetails = async function (ticketId) {
  const reg = USER_REGISTRATIONS.find(r => r.ticketId === ticketId);
  if (reg) {
    showToast("Authenticating ticket status...", "var(--galactic-purple)", "var(--galactic-purple)");

    let isSuccess = false;

    if (useRealFirebase) {
      try {
        const db = firebase.firestore();
        const docSnap = await db.collection("registrations").doc(reg.registrationId || ticketId).get();
        if (docSnap.exists) {
          const docData = docSnap.data();
          if (docData.payment_status === "Success" || docData.status === "Confirmed") {
            isSuccess = true;
          }
        }
      } catch (err) {
        console.error("Firestore verification error:", err);
      }
    } else {
      // Simulator Mode check
      try {
        const mockRegs = JSON.parse(localStorage.getItem("firebase_mock_registrations") || "[]");
        const mockReg = mockRegs.find(r => r.registrationId === (reg.registrationId || ticketId));
        if (mockReg && (mockReg.payment_status === "Success" || mockReg.status === "Confirmed")) {
          isSuccess = true;
        }
      } catch (err) {
        console.error("Simulator verification error:", err);
      }
    }

    if (isSuccess) {
      showTicket(reg);
    } else {
      showCustomAlert(
        "Payment Pending",
        "Payment Pending! Please complete your Boot Camp registration payment to unlock your VIP Pass."
      );
    }
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

window.showCustomAlert = function (title, message) {
  const overlay = document.getElementById("custom-alert-overlay");
  const titleEl = document.getElementById("custom-alert-title");
  const msgEl = document.getElementById("custom-alert-message");
  if (titleEl) titleEl.textContent = title;
  if (msgEl) msgEl.textContent = message;
  if (overlay) overlay.style.display = "flex";
};

window.closeCustomAlert = function () {
  const overlay = document.getElementById("custom-alert-overlay");
  if (overlay) overlay.style.display = "none";
};

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
        name: "SIRIN J DEVASSIA",
        email: "sirin@rit.ac.in",
        id: "KTE25RAI029",
        registerNo: "KTE25RAI029",
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

document.getElementById("setup-avatar-upload").addEventListener("change", function (e) {
  const file = e.target.files[0];
  if (!file) return;

  const type = file.type;
  if (type !== "image/jpeg" && type !== "image/jpg") {
    showToast("Avatar image must be in JPG/JPEG format.", "var(--error)", "var(--error)");
    this.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = function (event) {
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

document.getElementById("setup-email").addEventListener("input", function () {
  this.value = this.value.toLowerCase();
});
document.getElementById("login-email").addEventListener("input", function () {
  this.value = this.value.toLowerCase();
});
document.getElementById("setup-name").addEventListener("input", function () {
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
      if (authStateCallback) authStateCallback({ uid: credentials.user.uid });
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
        if (authStateCallback) authStateCallback({ uid: credentials.user.uid });
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

    if (docSnap.exists) {
      USER_PROFILE = docSnap.data();
      sessionStorage.setItem("loggedInUserUid", uid);
      if (authStateCallback) authStateCallback({ uid: uid });
      updateUserProfileUI();
      checkApprovalAndRoute(USER_PROFILE);
    } else {
      sessionStorage.setItem("loggedInUserUid", uid);
      if (authStateCallback) authStateCallback({ uid: uid });
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
      if (authStateCallback) authStateCallback({ uid: credentials.user.uid });
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
  const name = USER_PROFILE.name || "Student";
  const email = USER_PROFILE.email || "N/A";
  const id = USER_PROFILE.id || "N/A";
  const college = USER_PROFILE.collegeName || "N/A";
  const avatar = USER_PROFILE.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80";

  document.querySelectorAll(".avatar-img").forEach(img => {
    if (!img.closest(".avatar-option")) {
      img.src = avatar;
    }
  });

  const displayName = name.trim() ? name : "Student";
  document.querySelectorAll(".dashboard-greeting").forEach(greeting => {
    greeting.textContent = `Hey ${displayName.split(" ")[0]} 👋`;
  });
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
  if (authStateCallback) authStateCallback(null);
  USER_PROFILE = { name: "", email: "", id: "", password: "", department: "", yearOfStudy: "", phone: "", collegeName: "", avatar: "", approved: false };
  navigateTo("auth");
}

document.querySelectorAll(".btn-logout-action").forEach(btn => {
  btn.addEventListener("click", handleSignOut);
});
document.getElementById("btn-pending-logout").addEventListener("click", handleSignOut);

// Webhook wait screen Back/Dashboard action binder
window.closeWaitingOverlayAndGoToWallet = function () {
  const waitOverlay = document.getElementById("waiting-verification-overlay");
  if (waitOverlay) waitOverlay.style.display = "none";
  if (detailCountdownInterval) clearInterval(detailCountdownInterval);
  switchTab("wallet");
};

document.getElementById("btn-waiting-back").addEventListener("click", () => {
  const waitOverlay = document.getElementById("waiting-verification-overlay");
  if (waitOverlay) waitOverlay.style.display = "none";
  if (detailCountdownInterval) clearInterval(detailCountdownInterval);
  switchTab("wallet");
});

/**
 * Standalone batch cleanup utility to remove duplicate or orphaned registrations.
 * Can be executed directly from the browser developer console (F12) by an administrator.
 */
window.cleanupOrphanedTickets = async function () {
  if (!useRealFirebase) {
    console.warn("Cleanup is only available in live Firestore mode.");
    return "Failed: Not in Firestore mode.";
  }

  try {
    const db = firebase.firestore();
    console.log("Starting batch cleanup of duplicate/orphaned registrations...");

    // 1. Fetch all registrations
    const regsSnap = await db.collection("registrations").get();
    const allRegs = [];
    regsSnap.forEach(doc => {
      allRegs.push({ id: doc.id, ref: doc.ref, ...doc.data() });
    });

    console.log(`Retrieved ${allRegs.length} total registration records.`);

    // 2. Identify duplicates (same studentUid and eventId)
    const grouped = {};
    allRegs.forEach(reg => {
      const key = `${reg.studentUid}_${reg.eventId}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(reg);
    });

    const toDelete = [];
    let keptConfirmed = 0;
    let deletedDuplicates = 0;

    Object.keys(grouped).forEach(key => {
      const group = grouped[key];
      if (group.length > 1) {
        console.log(`Duplicate registrations found for student_event ${key} (${group.length} docs)`);

        // Sort group: Confirmed first, then oldest first
        group.sort((a, b) => {
          if (a.status === "Confirmed" && b.status !== "Confirmed") return -1;
          if (a.status !== "Confirmed" && b.status === "Confirmed") return 1;
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });

        // Keep the first one (confirmed, or oldest)
        const primary = group[0];
        console.log(`Keeping primary registration: ${primary.id} (status: ${primary.status})`);
        if (primary.status === "Confirmed") keptConfirmed++;

        // Delete the rest
        for (let i = 1; i < group.length; i++) {
          const duplicate = group[i];
          toDelete.push(duplicate.ref.delete());
          deletedDuplicates++;
          console.log(`Marking duplicate for deletion: ${duplicate.id} (status: ${duplicate.status})`);
        }
      }
    });

    // 3. Delete orphaned registrations (where student doc does not exist)
    let deletedOrphans = 0;
    for (const reg of allRegs) {
      if (reg.studentUid) {
        const studentDoc = await db.collection("students").doc(reg.studentUid).get();
        if (!studentDoc.exists) {
          console.log(`Orphaned registration found (student account ${reg.studentUid} does not exist): ${reg.id}`);
          toDelete.push(reg.ref.delete());
          deletedOrphans++;
        }
      }
    }

    // Resolve delete operations
    await Promise.all(toDelete);

    const summary = `Cleanup Completed Successfully!
----------------------------------
Duplicates Deleted: ${deletedDuplicates}
Orphans Deleted: ${deletedOrphans}
Total Cleaned: ${deletedDuplicates + deletedOrphans} records.`;

    console.log(summary);
    return summary;

  } catch (err) {
    console.error("Batch cleanup failed:", err);
    return `Error running cleanup: ${err.message}`;
  }
};

// Dashboard tabs navigation
function switchDashboardTab(tabId) {
  const tabs = ["profile", "events", "notifications"];
  tabs.forEach(t => {
    const contentEl = document.getElementById(`db-content-${t}`);
    if (contentEl) {
      if (t === tabId) {
        contentEl.style.display = "block";
      } else {
        contentEl.style.display = "none";
      }
    }
  });

  // Keep bottom navigation states synchronized
  const bottomNavIds = {
    profile: "nav-profile",
    events: "nav-wallet",
    notifications: "nav-news"
  };

  Object.entries(bottomNavIds).forEach(([subId, navId]) => {
    const navEl = document.getElementById(navId);
    const homeNavEl = document.getElementById("nav-home");
    if (navEl) {
      if (subId === tabId) {
        navEl.classList.add("active");
        if (homeNavEl) homeNavEl.classList.remove("active");
      } else {
        navEl.classList.remove("active");
      }
    }
  });
}

let newsTickerUnsubscribe = null;
let announcementsUnsubscribe = null;

function initDynamicContentListeners() {
  if (useRealFirebase) {
    try {
      const db = firebase.firestore();

      // Announcements real-time listener
      announcementsUnsubscribe = db.collection("announcements")
        .orderBy("timestamp", "desc")
        .onSnapshot((snapshot) => {
          const liveAnnouncements = [];
          snapshot.forEach((doc) => {
            liveAnnouncements.push({ id: doc.id, ...doc.data() });
          });
          renderLiveAnnouncements(liveAnnouncements);
        }, (err) => {
          console.error("Announcements snapshot error:", err);
        });
    } catch (e) {
      console.error("Error setting up dynamic content listeners:", e);
      initMockDynamicContentListeners();
    }
  } else {
    initMockDynamicContentListeners();
  }
}

function initMockDynamicContentListeners() {
  console.log("Setting up simulator fallback for announcements...");

  function checkMockAnnouncements() {
    let mockAnnouncements = JSON.parse(localStorage.getItem("mock_announcements") || "[]");
    if (mockAnnouncements.length === 0) {
      mockAnnouncements = [
        { id: "1", title: "Welcome to IEDC RIT Gateway!", body: "Your profile is active. Discover upcoming workshops, hackathons, and talks, and manage your tickets instantly.", time: "Just Now", timestamp: new Date().toISOString() },
        { id: "2", title: "InnovateRIT Hackathon Registration Open", body: "Build a prototype in 24 hours. The flagship hackathon has registration slots open for team registrations.", time: "2 Hours Ago", timestamp: new Date().toISOString() },
        { id: "3", title: "AI/ML Bootcamp Registration Fee", body: "Please make sure to complete payment for AI/ML Hands-on Bootcamp (₹150) to secure your seat.", time: "1 Day Ago", timestamp: new Date().toISOString() }
      ];
      localStorage.setItem("mock_announcements", JSON.stringify(mockAnnouncements));
    }
    renderLiveAnnouncements(mockAnnouncements);
  }

  checkMockAnnouncements();

  setInterval(() => {
    checkMockAnnouncements();
  }, 1500);
}

function renderLiveAnnouncements(announcementsList) {
  const container = document.getElementById("notifications-list-container");
  if (!container) return;
  container.innerHTML = "";

  announcementsList.forEach(n => {
    const card = document.createElement("div");
    card.className = "notification-card";

    let timeLabel = n.time || "Just Now";
    if (n.timestamp && !n.time) {
      timeLabel = new Date(n.timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }

    card.innerHTML = `
      <span class="notification-title">${n.title}</span>
      <p class="notification-body">${n.body || n.content || ''}</p>
      <span class="notification-time">${timeLabel}</span>
    `;
    container.appendChild(card);
  });
}

function renderNotifications() {
  // Maintaining compatibility if external triggers invoke renderNotifications directly
  const mockAnnouncements = JSON.parse(localStorage.getItem("mock_announcements") || "[]");
  if (useRealFirebase) {
    const db = firebase.firestore();
    db.collection("announcements").orderBy("timestamp", "desc").get().then(snap => {
      const live = [];
      snap.forEach(doc => live.push({ id: doc.id, ...doc.data() }));
      renderLiveAnnouncements(live);
    }).catch(() => {
      renderLiveAnnouncements(mockAnnouncements);
    });
  } else {
    renderLiveAnnouncements(mockAnnouncements);
  }
}

// Session Initializer Gating check
async function initSession() {
  initDynamicContentListeners();
  const cachedUid = sessionStorage.getItem("loggedInUserUid");
  if (cachedUid) {
    try {
      const docSnap = await FirebaseService.db.getStudentDoc(cachedUid);
      if (docSnap.exists) {
        USER_PROFILE = docSnap.data();
        updateUserProfileUI();
        checkApprovalAndRoute(USER_PROFILE);
      } else {
        sessionStorage.removeItem("loggedInUserUid");
        if (authStateCallback) authStateCallback(null);
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

// Helper to conditionally render the detail screen registration state in real-time
function handleRealtimeRegistrationUpdate(data) {
  const regForm = document.getElementById("registration-form");
  const proceedBtn = document.getElementById("proceed-to-pay-btn") || document.getElementById("modal-pay-btn");
  const viewPassBtn = document.getElementById("view-ticket-pass-btn");
  const statusBanner = document.getElementById("registration-status-banner");
  const stickyCta = document.querySelector(".sticky-cta-container");
  const regBtn = document.getElementById("detail-register-btn");

  // Step A: Force explicit UI reset first to prevent logic overlapping
  if (regForm) regForm.style.display = "none";
  if (proceedBtn) proceedBtn.style.display = "none";
  if (viewPassBtn) viewPassBtn.style.display = "none";
  if (statusBanner) statusBanner.style.display = "none";
  if (stickyCta) stickyCta.style.display = "none";
  if (regBtn) regBtn.style.display = "none";

  if (!selectedEvent) {
    return; // Keep hidden if no event is currently active or selected
  }

  // Step B: Check conditions strictly
  const documentExists = data !== null && data !== undefined;
  const isForCurrentEvent = documentExists && data.eventId === selectedEvent.id;

  if (documentExists && isForCurrentEvent) {
    // IF the user document EXISTS in Firestore (meaning they are registered)
    if (regForm) regForm.style.display = "none";

    const formContainer = document.getElementById('registration-form-container');
    if (formContainer) formContainer.style.display = "none";

    // ആക്ഷൻ ബട്ടൺ 'VIEW TICKET' ആക്കി രണ്ട് സ്ഥലത്തും മാറ്റുക
    if (proceedBtn) {
      proceedBtn.innerText = "VIEW TICKET";
      proceedBtn.style.display = "block";
      proceedBtn.disabled = false;
      proceedBtn.style.backgroundColor = "var(--neon-yellow)";
      proceedBtn.style.color = "rgba(6, 6, 12, 1)";
      proceedBtn.onclick = (e) => {
        e.preventDefault();
        if (data.payment_status === "Success" || data.status === "Confirmed") {
          const match = EVENTS_DATA.find(e => e.id === data.eventId);
          const regToPass = {
            id: data.eventId,
            registrationId: data.registrationId,
            ticketId: data.registrationId,
            title: data.eventTitle || (match ? match.title : "Event"),
            type: match ? match.type : "talk",
            typeLabel: match ? match.typeLabel : "Talk",
            date: match ? match.date : "TBD",
            isoDate: match ? match.isoDate : new Date().toISOString(),
            time: match ? match.time : "TBD",
            location: match ? match.location : "TBD",
            host: match ? match.host : "IEDC RIT",
            color: match ? match.color : "#C8E84A",
            status: data.status || "Confirmed",
            checkedIn: data.checkedIn === true,
            razorpayPaymentId: data.razorpayPaymentId || data.utrNumber || "FREE",
            phone: data.phone || "",
            bankAccountName: data.bankAccountName || ""
          };
          showTicket(regToPass);
        } else {
          alert("⚠️ Your registration is received! Your ticket will be active once the Admin approves your payment.");
        }
      };
    }
    if (viewPassBtn) viewPassBtn.style.display = "none";

    // സ്റ്റിക്കി സിടിഎ ബട്ടണിലും 'VIEW TICKET' ലോക്ക് ചെയ്യുക
    if (regBtn) {
      regBtn.style.display = "flex";
      regBtn.textContent = "VIEW TICKET";
      regBtn.disabled = false;
      regBtn.style.backgroundColor = "var(--neon-yellow)";
      regBtn.style.color = "rgba(6, 6, 12, 1)";
      regBtn.onclick = (e) => {
        e.preventDefault();
        if (data.payment_status === "Success" || data.status === "Confirmed") {
          const match = EVENTS_DATA.find(e => e.id === data.eventId);
          const regToPass = {
            id: data.eventId,
            registrationId: data.registrationId,
            ticketId: data.registrationId,
            title: data.eventTitle || (match ? match.title : "Event"),
            type: match ? match.type : "talk",
            typeLabel: match ? match.typeLabel : "Talk",
            date: match ? match.date : "TBD",
            isoDate: match ? match.isoDate : new Date().toISOString(),
            time: match ? match.time : "TBD",
            location: match ? match.location : "TBD",
            host: match ? match.host : "IEDC RIT",
            color: match ? match.color : "#C8E84A",
            status: data.status || "Confirmed",
            checkedIn: data.checkedIn === true,
            razorpayPaymentId: data.razorpayPaymentId || data.utrNumber || "FREE",
            phone: data.phone || "",
            bankAccountName: data.bankAccountName || ""
          };
          showTicket(regToPass);
        } else {
          alert("⚠️ Your registration is received! Your ticket will be active once the Admin approves your payment.");
        }
      };
    }
    if (data.payment_status === "Success" || data.status === "Confirmed") {
      if (statusBanner) statusBanner.style.display = "none";
    } else {
      if (statusBanner) {
        statusBanner.style.display = "block";
        statusBanner.textContent = "Awaiting Admin Payment Verification...";
      }
    }
    if (stickyCta) stickyCta.style.display = "block";
  } else {
    // ONLY show "PROCEED TO PAY" and the input fields if NO document exists at all in the database (Fresh User)
    if (regForm) regForm.style.display = "flex";

    const formContainer = document.getElementById('registration-form-container');
    if (formContainer) formContainer.style.display = "flex";

    if (proceedBtn) {
      proceedBtn.style.display = "block";
      proceedBtn.innerText = "PROCEED TO PAY";
      proceedBtn.onclick = null;
    }
    if (statusBanner) statusBanner.style.display = "none";
    if (viewPassBtn) viewPassBtn.style.display = "none";

    if (regBtn) {
      regBtn.style.display = "flex";
      regBtn.onclick = null;
      if (selectedEvent.seats <= 0) {
        regBtn.textContent = "Sold Out";
        regBtn.disabled = true;
        regBtn.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
      } else {
        regBtn.textContent = "PROCEED TO PAY";
        regBtn.disabled = false;
        regBtn.style.backgroundColor = "var(--neon-yellow)";
        regBtn.style.color = "rgba(6, 6, 12, 1)";
      }
    }
    if (stickyCta) stickyCta.style.display = "block";
  }
}

// Register the requested authentication observer to conditionally manage bottom navigation bar visibility and auth sync
let regUnsubscribe1 = null;
let regUnsubscribe2 = null;

onAuthStateChanged(auth, (user) => {
  const bottomNav = document.getElementById("bottom-nav") || document.querySelector(".bottom-nav");
  if (bottomNav) {
    if (user) {
      // User is logged in. Verify approval status before showing
      const cachedUid = sessionStorage.getItem("loggedInUserUid") || (user && user.uid);
      if (cachedUid) {
        FirebaseService.db.getStudentDoc(cachedUid).then(docSnap => {
          if (docSnap.exists) {
            const profileData = docSnap.data();
            if (profileData.approved === true) {
              bottomNav.classList.remove("nav-hidden");
              bottomNav.style.setProperty("display", "grid", "important");
            } else {
              bottomNav.classList.add("nav-hidden");
              bottomNav.style.setProperty("display", "none", "important");
            }
          }
        });
      }
    } else {
      // Strictly ensure it remains completely hidden
      bottomNav.classList.add("nav-hidden");
      bottomNav.style.setProperty("display", "none", "important");
    }
  }

  // REAL-TIME AUTH & STATE SYNC
  if (user) {
    if (regUnsubscribe1) { regUnsubscribe1(); regUnsubscribe1 = null; }
    if (regUnsubscribe2) { regUnsubscribe2(); regUnsubscribe2 = null; }

    if (useRealFirebase) {
      const firestoreDb = firebase.firestore();

      let doc1Data = null;
      let doc2Data = null;

      const updateCombinedState = () => {
        if (doc1Data) {
          activeRegistrationData = doc1Data;
        } else if (doc2Data) {
          activeRegistrationData = doc2Data;
        } else {
          activeRegistrationData = null;
        }
        handleRealtimeRegistrationUpdate(activeRegistrationData);
      };

      // Listener 1: doc(db, "registrations", user.uid)
      regUnsubscribe1 = firestoreDb.collection("registrations").doc(user.uid)
        .onSnapshot((doc) => {
          const docExists = doc && (typeof doc.exists === 'function' ? doc.exists() : doc.exists);
          if (docExists) {
            doc1Data = doc.data();
          } else {
            doc1Data = null;
          }
          updateCombinedState();
        }, (err) => {
          console.error("Error in real-time registration snapshot 1:", err);
        });

      // Listener 2: doc(db, "registrations", "reg-" + user.uid)
      regUnsubscribe2 = firestoreDb.collection("registrations").doc("reg-" + user.uid)
        .onSnapshot((doc) => {
          const docExists = doc && (typeof doc.exists === 'function' ? doc.exists() : doc.exists);
          if (docExists) {
            doc2Data = doc.data();
          } else {
            doc2Data = null;
          }
          updateCombinedState();
        }, (err) => {
          console.error("Error in real-time registration snapshot 2:", err);
        });
    } else {
      // Simulated LocalStorage real-time sync for mock mode
      if (window.mockRegInterval) clearInterval(window.mockRegInterval);
      const checkMockReg = () => {
        const mockRegs = JSON.parse(localStorage.getItem("firebase_mock_registrations") || "[]");
        const reg = mockRegs.find(r => r.registrationId === "reg-" + user.uid || r.registrationId === user.uid || r.studentUid === user.uid);
        activeRegistrationData = reg || null;
        handleRealtimeRegistrationUpdate(activeRegistrationData);
      };
      checkMockReg();
      window.mockRegInterval = setInterval(checkMockReg, 1000);
    }
  } else {
    if (regUnsubscribe1) { regUnsubscribe1(); regUnsubscribe1 = null; }
    if (regUnsubscribe2) { regUnsubscribe2(); regUnsubscribe2 = null; }
    if (window.mockRegInterval) clearInterval(window.mockRegInterval);
    activeRegistrationData = null;
    handleRealtimeRegistrationUpdate(null);
  }
});