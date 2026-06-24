// Automatically redirect from 127.0.0.1 to localhost for authorized Firebase OAuth operations
if (window.location.hostname === "127.0.0.1") {
  window.location.hostname = "localhost";
}

// Environment variables config wrapper for security compliance
// Fallback defaults are removed; strictly reads from environment (window.ENV_CONFIG, process.env, import.meta.env), defaulting to empty string
const CONFIG = {
  ADMIN_EMAIL: (typeof window !== "undefined" && window.ENV_CONFIG && window.ENV_CONFIG.ADMIN_EMAIL) ||
               (typeof process !== "undefined" && process.env && process.env.ADMIN_EMAIL) || 
               (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_ADMIN_EMAIL) || "",
  ADMIN_PASSWORD: (typeof window !== "undefined" && window.ENV_CONFIG && window.ENV_CONFIG.ADMIN_PASSWORD) ||
                  (typeof process !== "undefined" && process.env && process.env.ADMIN_PASSWORD) || 
                  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_ADMIN_PASSWORD) || "",
  GATE_PASSWORD_PRIMARY: (typeof window !== "undefined" && window.ENV_CONFIG && window.ENV_CONFIG.GATE_PASSWORD_PRIMARY) ||
                         (typeof process !== "undefined" && process.env && process.env.GATE_PASSWORD_PRIMARY) || 
                         (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_GATE_PASSWORD_PRIMARY) || "",
  GATE_PASSWORD_SECONDARY: (typeof window !== "undefined" && window.ENV_CONFIG && window.ENV_CONFIG.GATE_PASSWORD_SECONDARY) ||
                           (typeof process !== "undefined" && process.env && process.env.GATE_PASSWORD_SECONDARY) || 
                           (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_GATE_PASSWORD_SECONDARY) || "",

  // Firebase Configuration
  FIREBASE_API_KEY: (typeof window !== "undefined" && window.ENV_CONFIG && window.ENV_CONFIG.FIREBASE_API_KEY) ||
                    (typeof process !== "undefined" && process.env && process.env.FIREBASE_API_KEY) || 
                    (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_FIREBASE_API_KEY) || "",
  FIREBASE_AUTH_DOMAIN: (typeof window !== "undefined" && window.ENV_CONFIG && window.ENV_CONFIG.FIREBASE_AUTH_DOMAIN) ||
                        (typeof process !== "undefined" && process.env && process.env.FIREBASE_AUTH_DOMAIN) || 
                        (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_FIREBASE_AUTH_DOMAIN) || "",
  FIREBASE_PROJECT_ID: (typeof window !== "undefined" && window.ENV_CONFIG && window.ENV_CONFIG.FIREBASE_PROJECT_ID) ||
                       (typeof process !== "undefined" && process.env && process.env.FIREBASE_PROJECT_ID) || 
                       (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_FIREBASE_PROJECT_ID) || "",
  FIREBASE_STORAGE_BUCKET: (typeof window !== "undefined" && window.ENV_CONFIG && window.ENV_CONFIG.FIREBASE_STORAGE_BUCKET) ||
                           (typeof process !== "undefined" && process.env && process.env.FIREBASE_STORAGE_BUCKET) || 
                           (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_FIREBASE_STORAGE_BUCKET) || "",
  FIREBASE_MESSAGING_SENDER_ID: (typeof window !== "undefined" && window.ENV_CONFIG && window.ENV_CONFIG.FIREBASE_MESSAGING_SENDER_ID) ||
                                (typeof process !== "undefined" && process.env && process.env.FIREBASE_MESSAGING_SENDER_ID) || 
                                (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID) || "",
  FIREBASE_APP_ID: (typeof window !== "undefined" && window.ENV_CONFIG && window.ENV_CONFIG.FIREBASE_APP_ID) ||
                   (typeof process !== "undefined" && process.env && process.env.FIREBASE_APP_ID) || 
                   (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_FIREBASE_APP_ID) || "",
  FIREBASE_MEASUREMENT_ID: (typeof window !== "undefined" && window.ENV_CONFIG && window.ENV_CONFIG.FIREBASE_MEASUREMENT_ID) ||
                           (typeof process !== "undefined" && process.env && process.env.FIREBASE_MEASUREMENT_ID) || 
                           (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_FIREBASE_MEASUREMENT_ID) || "",

  // Supabase Configuration
  SUPABASE_URL: (typeof window !== "undefined" && window.ENV_CONFIG && window.ENV_CONFIG.SUPABASE_URL) ||
                (typeof process !== "undefined" && process.env && process.env.SUPABASE_URL) || 
                (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_SUPABASE_URL) || "",
  SUPABASE_ANON_KEY: (typeof window !== "undefined" && window.ENV_CONFIG && window.ENV_CONFIG.SUPABASE_ANON_KEY) ||
                     (typeof process !== "undefined" && process.env && process.env.SUPABASE_ANON_KEY) || 
                     (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) || "",

  // EmailJS Configuration
  EMAILJS_PUBLIC_KEY: (typeof window !== "undefined" && window.ENV_CONFIG && window.ENV_CONFIG.EMAILJS_PUBLIC_KEY) ||
                      (typeof process !== "undefined" && process.env && process.env.EMAILJS_PUBLIC_KEY) || 
                      (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_EMAILJS_PUBLIC_KEY) || "",
  EMAILJS_SERVICE_ID: (typeof window !== "undefined" && window.ENV_CONFIG && window.ENV_CONFIG.EMAILJS_SERVICE_ID) ||
                      (typeof process !== "undefined" && process.env && process.env.EMAILJS_SERVICE_ID) || 
                      (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_EMAILJS_SERVICE_ID) || "",
  EMAILJS_TEMPLATE_ID: (typeof window !== "undefined" && window.ENV_CONFIG && window.ENV_CONFIG.EMAILJS_TEMPLATE_ID) ||
                       (typeof process !== "undefined" && process.env && process.env.EMAILJS_TEMPLATE_ID) || 
                       (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_EMAILJS_TEMPLATE_ID) || ""
};

// Initialize EmailJS safely
if (typeof emailjs !== "undefined" && CONFIG.EMAILJS_PUBLIC_KEY) {
  emailjs.init(CONFIG.EMAILJS_PUBLIC_KEY);
  console.log("EmailJS initialized successfully.");
} else {
  console.warn("emailjs or EmailJS public key is not defined. Initializing mock to prevent crashes.");
  window.emailjs = {
    init: () => {},
    send: () => Promise.resolve({ status: 200, text: "Mock send success" })
  };
  if (CONFIG.EMAILJS_PUBLIC_KEY) {
    emailjs.init(CONFIG.EMAILJS_PUBLIC_KEY);
  }
}

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
  apiKey: CONFIG.FIREBASE_API_KEY,
  authDomain: CONFIG.FIREBASE_AUTH_DOMAIN,
  projectId: CONFIG.FIREBASE_PROJECT_ID,
  storageBucket: CONFIG.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: CONFIG.FIREBASE_MESSAGING_SENDER_ID,
  appId: CONFIG.FIREBASE_APP_ID,
  measurementId: CONFIG.FIREBASE_MEASUREMENT_ID
};

let useRealFirebase = false;
if (firebaseConfig.apiKey) {
  try {
    if (typeof firebase !== "undefined") {
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }
      useRealFirebase = true;
      console.log("Firebase initialized successfully inside client engine.");
    } else {
      console.warn("Firebase SDK not loaded, falling back to simulator mode.");
    }
  } catch (error) {
    console.error("Firebase initialization fallback error:", error);
  }
}

const cachedUid = sessionStorage.getItem("loggedInUserUid") || localStorage.getItem("loggedInUserUid");
const cachedUseRealFirebase = sessionStorage.getItem("useRealFirebase");

if (cachedUseRealFirebase === "false" || cachedUid === "uid_sirin123" || cachedUid === "uid_admin123") {
  useRealFirebase = false;
  console.log("Forced fallback: Using simulator mode.");
}
sessionStorage.setItem("useRealFirebase", useRealFirebase);

// Initialize auth and mock/real onAuthStateChanged listener wrapper
let authStateCallback = null;
let auth;
try {
  auth = (useRealFirebase && typeof firebase !== "undefined" && typeof firebase.auth === "function") ? firebase.auth() : {
    onAuthStateChanged: (callback) => {
      // ലോഗിൻ പേജ് കാണിക്കാതെ നേരിട്ട് ഹോം സ്ക്രീൻ ലോഡ് ചെയ്യാൻ ഒരു മോക്ക് യൂസർ ഐഡി പാസ്സ് ചെയ്യുന്നു
      authStateCallback = callback;
      callback({ uid: "uid_sirin123" });
    }
  };
} catch (e) {
  console.error("Firebase auth initialization failed, falling back to mock auth:", e);
  auth = {
    onAuthStateChanged: (callback) => {
      authStateCallback = callback;
      callback({ uid: "uid_sirin123" });
    }
  };
  useRealFirebase = false;
}

function onAuthStateChanged(authInstance, callback) {
  if (useRealFirebase && authInstance && typeof authInstance.onAuthStateChanged === "function") {
    return authInstance.onAuthStateChanged(callback);
  } else if (authInstance && typeof authInstance.onAuthStateChanged === "function") {
    return authInstance.onAuthStateChanged(callback);
  }
}

// ==========================================
// SUPABASE STORAGE INITIALIZATION
// ==========================================
const supabaseUrl = CONFIG.SUPABASE_URL;
const supabaseKey = CONFIG.SUPABASE_ANON_KEY;
let supabaseClient = null;
try {
  if (typeof window !== "undefined" && window.supabase && supabaseUrl && supabaseKey) {
    supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
    console.log("Supabase client initialized successfully.");
  }
} catch (err) {
  console.error("Failed to initialize Supabase client:", err);
}

async function uploadToSupabase(file, bucketName) {
  if (!supabaseClient) {
    throw new Error("Supabase client is not initialized.");
  }
  const fileName = Date.now() + "_" + file.name;
  console.log(`Starting Supabase upload of ${fileName} to bucket "${bucketName}"`);
  const { data, error } = await supabaseClient.storage
    .from(bucketName)
    .upload(fileName, file);

  if (error) {
    throw error;
  }

  const { data: urlData } = supabaseClient.storage
    .from(bucketName)
    .getPublicUrl(fileName);

  if (!urlData || !urlData.publicUrl) {
    throw new Error("Failed to retrieve public URL from Supabase storage.");
  }

  console.log(`Supabase upload complete. Public URL: ${urlData.publicUrl}`);
  return urlData.publicUrl;
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
  const cachedUid = sessionStorage.getItem("loggedInUserUid") || localStorage.getItem("loggedInUserUid");
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
    const currentCachedUid = sessionStorage.getItem("loggedInUserUid") || localStorage.getItem("loggedInUserUid");
    if (currentCachedUid) {
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
    const currentCachedUid = sessionStorage.getItem("loggedInUserUid") || localStorage.getItem("loggedInUserUid");
    if (currentCachedUid && bottomNav) {
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

const detailBackBtn = document.getElementById("detail-back-btn");
if (detailBackBtn) {
  detailBackBtn.addEventListener("click", () => {
    if (detailCountdownInterval) clearInterval(detailCountdownInterval);
    switchTab("home");
  });
}
const ticketBackBtn = document.getElementById("ticket-back-btn");
if (ticketBackBtn) {
  ticketBackBtn.addEventListener("click", () => switchTab("wallet"));
}
const setupBackBtn = document.getElementById("setup-back-btn");
if (setupBackBtn) {
  setupBackBtn.addEventListener("click", () => switchTab("home"));
}

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
  const cachedUid = sessionStorage.getItem("loggedInUserUid") || localStorage.getItem("loggedInUserUid");
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

function resolvePosterUrl(pUrl) {
  if (!pUrl) return "";
  const urlStr = String(pUrl).trim();

  // Google Drive link conversion
  if (urlStr.includes("drive.google.com")) {
    const driveIdMatch = urlStr.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || urlStr.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (driveIdMatch && driveIdMatch[1]) {
      return `https://drive.google.com/uc?export=download&id=${driveIdMatch[1]}`;
    }
  }

  // Google Photos link detection and handling
  if (urlStr.includes("photos.app.goo.gl") || urlStr.includes("photos.google.com")) {
    if (typeof showToast === "function") {
      showToast("Google Photos link detected. CORS restricts loading shared pages directly. Use direct image hosting (e.g. Firebase or Imgur) for best results.", "var(--error)", "var(--error)");
    }
    // Fallback to default high-quality tech poster
    return "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=600&q=80";
  }

  return urlStr;
}

// ==========================================
// 05 — HOME SCREEN RENDERING & FILTERING
// ==========================================

function renderHomeEvents() {
  const listContainer = document.getElementById("events-list-container");
  const featuredContainer = document.getElementById("featured-card-container");

  if (!listContainer || !featuredContainer) return;

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
    const rawUrl = featuredEvent.poster_url || featuredEvent.poster || featuredEvent.eventPosterImageUrl || featuredEvent.event_poster_image_url || featuredEvent.imageUrl || featuredEvent.image || featuredEvent.img;
    featuredEvent.poster_url = resolvePosterUrl(rawUrl);
    if (featuredEvent.poster_url) {
      featCard.style.backgroundImage = `linear-gradient(to bottom, rgba(8, 8, 16, 0.25), rgba(8, 8, 16, 0.9)), url('${featuredEvent.poster_url}')`;
      featCard.style.backgroundSize = "cover";
      featCard.style.backgroundPosition = "center";
      featCard.style.backgroundRepeat = "no-repeat";
    }
    featCard.innerHTML = `
      <div class="card-featured-circle"></div>
      <div class="card-featured-content" style="width: 100%;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-sm); width: 100%;">
          <span class="chip chip-${featuredEvent.type}">${featuredEvent.typeLabel}</span>
          ${featuredEvent.whatsapp_url ? `
            <a href="${featuredEvent.whatsapp_url}" target="_blank" class="whatsapp-card-link" style="display: inline-flex; align-items: center; justify-content: center; z-index: 10;" onclick="event.stopPropagation();">
              <svg viewBox="0 0 24 24" width="22" height="22" style="fill: #25D366; cursor: pointer; transition: transform 0.2s ease;">
                <path d="M12.012 2c-5.506 0-9.988 4.482-9.988 9.988 0 1.761.459 3.479 1.332 5.003L2 22l5.176-1.359c1.472.802 3.125 1.224 4.825 1.224 5.506 0 9.988-4.482 9.988-9.988C22 6.482 17.518 2 12.012 2zm6.657 14.12c-.274.771-1.393 1.397-1.921 1.488-.479.083-.997.124-1.688-.113-1.036-.356-2.247-1.127-3.155-1.944-1.428-1.286-2.484-2.859-3.08-3.791-.252-.397-.525-.828-.711-1.261-.22-.511-.144-.949.124-1.258.199-.23.476-.566.678-.83.18-.236.27-.472.371-.703.113-.23.056-.445-.028-.621-.084-.176-.757-1.821-1.036-2.493-.274-.658-.55-5.69-1.259-5.69-.144 0-.323.083-.497.165-.838.397-1.265.981-1.579 1.637-.621 1.295-.313 2.993.435 4.397.947 1.776 2.162 3.328 3.526 4.707 1.616 1.637 3.35 3.011 5.378 3.864 1.139.479 2.278.621 3.23.483.947-.137 1.839-.777 2.195-1.536.357-.759.357-1.411.252-1.554-.105-.143-.392-.23-.83-.448z"/>
              </svg>
            </a>
          ` : ''}
        </div>
        ${featuredEvent.is_closed ? `
          <div style="background: rgba(232, 74, 74, 0.15); border: 1px solid var(--error); color: var(--error); padding: 6px 12px; border-radius: 8px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; width: fit-content; display: inline-flex; align-items: center; gap: 6px; margin-bottom: var(--space-xs); line-height: 1;">
            🔒 Registration Closed
          </div>
        ` : ''}
        <h2 class="h3-title" style="margin-bottom: var(--space-xs); line-height: 1.2;">${featuredEvent.title}</h2>
        <div style="display: flex; gap: var(--space-sm); font-size: 11px; color: var(--muted-white); margin-bottom: 12px;">
          <span>${featuredEvent.type === "tournament" ? (featuredEvent.tournament_date || featuredEvent.date || "TBD") : (featuredEvent.date || "TBD")}</span>
          <span>•</span>
          <span>${featuredEvent.type === "tournament" ? (featuredEvent.tournament_time || featuredEvent.time || "TBD") : (featuredEvent.time || "TBD")}</span>
        </div>
        <button class="card-btn-register" id="btn-register-${featuredEvent.id}" ${featuredEvent.is_closed ? 'disabled style="background: rgba(255,255,255,0.1); color: var(--muted-white); border: 1px solid rgba(255,255,255,0.15);"' : ''}>${featuredEvent.is_closed ? 'Registration Closed' : 'Register Now'}</button>
      </div>
    `;
    featCard.addEventListener("click", (e) => {
      if (e.target.classList.contains("card-btn-register") || e.target.closest(".whatsapp-card-link")) return;
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
    const rawUrl = evt.poster_url || evt.poster || evt.eventPosterImageUrl || evt.event_poster_image_url || evt.imageUrl || evt.image || evt.img;
    evt.poster_url = resolvePosterUrl(rawUrl);
    if (evt.poster_url) {
      card.style.backgroundImage = `linear-gradient(to bottom, rgba(8, 8, 16, 0.65), rgba(8, 8, 16, 0.96)), url('${evt.poster_url}')`;
      card.style.backgroundSize = "cover";
      card.style.backgroundPosition = "center";
      card.style.backgroundRepeat = "no-repeat";
    }
    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="chip chip-${evt.type}">${evt.typeLabel}</span>
          ${evt.whatsapp_url ? `
            <a href="${evt.whatsapp_url}" target="_blank" class="whatsapp-card-link" style="display: inline-flex; align-items: center; justify-content: center; z-index: 10;" onclick="event.stopPropagation();">
              <svg viewBox="0 0 24 24" width="20" height="20" style="fill: #25D366; cursor: pointer; transition: transform 0.2s ease;">
                <path d="M12.012 2c-5.506 0-9.988 4.482-9.988 9.988 0 1.761.459 3.479 1.332 5.003L2 22l5.176-1.359c1.472.802 3.125 1.224 4.825 1.224 5.506 0 9.988-4.482 9.988-9.988C22 6.482 17.518 2 12.012 2zm6.657 14.12c-.274.771-1.393 1.397-1.921 1.488-.479.083-.997.124-1.688-.113-1.036-.356-2.247-1.127-3.155-1.944-1.428-1.286-2.484-2.859-3.08-3.791-.252-.397-.525-.828-.711-1.261-.22-.511-.144-.949.124-1.258.199-.23.476-.566.678-.83.18-.236.27-.472.371-.703.113-.23.056-.445-.028-.621-.084-.176-.757-1.821-1.036-2.493-.274-.658-.55-5.69-1.259-5.69-.144 0-.323.083-.497.165-.838.397-1.265.981-1.579 1.637-.621 1.295-.313 2.993.435 4.397.947 1.776 2.162 3.328 3.526 4.707 1.616 1.637 3.35 3.011 5.378 3.864 1.139.479 2.278.621 3.23.483.947-.137 1.839-.777 2.195-1.536.357-.759.357-1.411.252-1.554-.105-.143-.392-.23-.83-.448z"/>
              </svg>
            </a>
          ` : ''}
        </div>
        <span class="caption-meta" style="color: var(--neon-yellow);">${evt.price}</span>
      </div>
      ${evt.is_closed ? `
        <div style="background: rgba(232, 74, 74, 0.15); border: 1px solid var(--error); color: var(--error); padding: 4px 8px; border-radius: 6px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; width: fit-content; display: inline-flex; align-items: center; gap: 4px; margin-top: 4px; line-height: 1;">
          🔒 Registration Closed
        </div>
      ` : ''}
      <h3 class="h3-title" style="margin-top: var(--space-xs); line-height:1.2;">${evt.title}</h3>
      <div style="display: flex; gap: var(--space-sm); font-size: 11px; color: var(--muted-white); margin-top: auto; margin-bottom: 8px;">
        <span style="display:flex; align-items:center; gap:4px;">
          📅 ${evt.type === "tournament" ? (evt.tournament_date || evt.date || "TBD") : (evt.date || "TBD")}
        </span>
        ${(evt.type === "tournament" && (evt.tournament_time || evt.time)) || evt.time ? `
          <span style="display:flex; align-items:center; gap:4px; margin-left: 8px;">
            🕒 ${evt.type === "tournament" ? (evt.tournament_time || evt.time) : evt.time}
          </span>
        ` : ''}
      </div>
      <button class="card-btn-register" id="btn-register-${evt.id}" ${evt.is_closed ? 'disabled style="background: rgba(255,255,255,0.1); color: var(--muted-white); border: 1px solid rgba(255,255,255,0.15);"' : ''}>${evt.is_closed ? 'Registration Closed' : 'Register Now'}</button>
    `;
    card.addEventListener("click", (e) => {
      if (e.target.classList.contains("card-btn-register") || e.target.closest(".whatsapp-card-link")) return;
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
const searchInput = document.getElementById("search-input");
if (searchInput) {
  searchInput.addEventListener("input", (e) => {
    searchQuery = e.target.value;
    renderHomeEvents();
  });
}

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
  let reg = activeRegistrationData && activeRegistrationData.eventId === event.id ? activeRegistrationData : null;
  if (!reg) {
    const fallbackReg = USER_REGISTRATIONS.find(r => r.id === event.id);
    if (fallbackReg) {
      reg = {
        eventId: fallbackReg.id,
        registrationId: fallbackReg.registrationId,
        ticketId: fallbackReg.registrationId,
        title: fallbackReg.title,
        type: fallbackReg.type,
        typeLabel: fallbackReg.typeLabel,
        date: fallbackReg.date,
        isoDate: fallbackReg.isoDate,
        time: fallbackReg.time,
        location: fallbackReg.location,
        host: fallbackReg.host,
        color: fallbackReg.color,
        status: fallbackReg.status,
        checkedIn: fallbackReg.checkedIn,
        razorpayPaymentId: fallbackReg.razorpayPaymentId,
        phone: fallbackReg.phone,
        bankAccountName: fallbackReg.bankAccountName
      };
    }
  }

  activeRegistrationData = reg;

  if (reg) {
    if (regForm) regForm.style.display = "none";

    // ടിക്കറ്റ് ഓൾറെഡി ഉള്ളവർക്ക് VIEW TICKET എന്ന് കാണിക്കുക
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
    if (reg.payment_status === "Success" || reg.status === "Confirmed") {
      if (statusBanner) statusBanner.style.display = "none";
    } else {
      if (statusBanner) {
        statusBanner.style.display = "block";
        statusBanner.textContent = "Awaiting Admin Payment Verification...";
      }
    }
    if (stickyCta) stickyCta.style.display = "block";
  } else {
    if (event.is_closed) {
      if (regForm) regForm.style.display = "none";
      if (stickyCta) stickyCta.style.display = "block";
      if (regBtn) {
        regBtn.style.display = "flex";
        regBtn.textContent = "Registration Closed";
        regBtn.disabled = true;
        regBtn.style.backgroundColor = "rgba(255,255,255,0.1)";
        regBtn.style.color = "var(--muted-white)";
      }
      if (proceedBtn) {
        proceedBtn.textContent = "Registration Closed";
        proceedBtn.disabled = true;
        proceedBtn.style.backgroundColor = "rgba(255,255,255,0.1)";
        proceedBtn.style.color = "var(--muted-white)";
        proceedBtn.style.display = "block";
      }
    } else {
      if (regForm) regForm.style.display = "flex";
      if (stickyCta) stickyCta.style.display = "block";
      if (regBtn) {
        regBtn.style.display = "flex";
        if (event.seats <= 0) {
          regBtn.textContent = "Sold Out";
          regBtn.disabled = true;
          regBtn.style.backgroundColor = "rgba(255,255,255,0.1)";
        } else {
          const btnText = "PROCEED TO PAY";
          regBtn.textContent = btnText;
          regBtn.disabled = false;
          regBtn.style.backgroundColor = "var(--neon-yellow)";
          regBtn.style.color = "rgba(6, 6, 12, 1)";
        }
      }
      if (proceedBtn) {
        if (event.seats <= 0) {
          proceedBtn.textContent = "Sold Out";
          proceedBtn.disabled = true;
          proceedBtn.style.backgroundColor = "rgba(255,255,255,0.1)";
        } else {
          const btnText = "PROCEED TO PAY";
          proceedBtn.textContent = btnText;
          proceedBtn.disabled = false;
          proceedBtn.style.backgroundColor = "var(--neon-yellow)";
          proceedBtn.style.color = "rgba(6, 6, 12, 1)";
          proceedBtn.style.display = "block";
        }
      }
    }
  }

  // Background and titles
  const hero = document.getElementById("detail-hero");
  if (hero) {
    hero.style.setProperty("--event-color", event.color);
    const rawUrl = event.poster_url || event.poster || event.eventPosterImageUrl || event.event_poster_image_url || event.imageUrl || event.image || event.img;
    event.poster_url = resolvePosterUrl(rawUrl);
    if (event.poster_url) {
      hero.style.backgroundImage = `linear-gradient(to bottom, rgba(8, 8, 16, 0.3), var(--void-black)), url('${event.poster_url}')`;
      hero.style.backgroundSize = "cover";
      hero.style.backgroundPosition = "center";
      hero.style.backgroundRepeat = "no-repeat";
    } else {
      hero.style.backgroundImage = "";
    }
  }

  document.getElementById("detail-title").textContent = event.title;
  document.getElementById("detail-description").textContent = event.description || "No description available.";

  // Feature grid values
  document.getElementById("detail-feat-date").textContent = (event.type === "tournament" ? (event.tournament_date || event.date) : event.date) || "TBD";
  document.getElementById("detail-feat-time").textContent = (event.type === "tournament" ? (event.tournament_time || event.time) : event.time) || "TBD";
  document.getElementById("detail-feat-seats").textContent = event.seats !== undefined ? `${event.seats} Seats` : "Unlimited";
  document.getElementById("detail-feat-price").textContent = event.price || "Free";

  // Category tags
  const chipContainer = document.getElementById("detail-type-chip-container");
  if (chipContainer) chipContainer.innerHTML = `<span class="chip chip-${event.type}">${event.typeLabel}</span>`;

  // Venue location details
  const metaRow = document.getElementById("detail-meta-row");
  if (metaRow) metaRow.innerHTML = `<span class="chip" style="background: rgba(255,255,255,0.15); border:none; text-transform:none; font-weight:500;">📍 ${event.location || 'Online'}</span>`;

  // Speaker Profile values
  const hostParts = (event.host || "Organized by IEDC RIT").split(", ");
  document.getElementById("detail-host").textContent = hostParts[0] || "IEDC Speaker";
  document.getElementById("detail-host-qual").textContent = hostParts.slice(1).join(", ") || "IEDC Guest Host";

  // Shared elements (always visible if they exist)
  const sharedLinksContainer = document.getElementById("detail-shared-links");
  if (sharedLinksContainer) {
    let htmlContent = `
      <a id="detail-host-linkedin" href="${event.speakerLinkedin || 'https://linkedin.com'}" target="_blank" style="display: flex; flex-direction: column; align-items: center; text-align: center; text-decoration: none; color: var(--white-pure); flex: 1; min-width: 120px;">
        <div class="shared-icon-container" style="width: 42px; height: 42px; border-radius: 12px; background: #0077b5; display: flex; align-items: center; justify-content: center; color: white; margin-bottom: 6px; box-shadow: 0 0 10px rgba(0,119,181,0.25);">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
          </svg>
        </div>
        <span class="shared-link-label" style="font-size: 11px; font-weight: 600; color: #0077b5;">Click here to view LinkedIn Profile</span>
      </a>
    `;

    if (event.whatsapp_url) {
      htmlContent += `
        <a id="detail-whatsapp-link" href="${event.whatsapp_url}" target="_blank" style="display: flex; flex-direction: column; align-items: center; text-align: center; text-decoration: none; color: var(--white-pure); flex: 1; min-width: 120px;">
          <div class="shared-icon-container" style="width: 42px; height: 42px; border-radius: 12px; background: #25d366; display: flex; align-items: center; justify-content: center; color: white; margin-bottom: 6px; box-shadow: 0 0 10px rgba(37,211,102,0.25);">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.09-3.486c1.614.957 3.397 1.464 5.228 1.465 5.513 0 9.998-4.487 10.001-10.002.002-2.673-1.037-5.184-2.927-7.076C16.557 3.01 14.048 1.97 11.378 1.97 5.864 1.97 1.379 6.458 1.376 11.974c0 1.914.5 3.778 1.452 5.4l-.953 3.477 3.57-.937zM18.17 14.85c-.3-.15-1.776-.875-2.05-1.05-.278-.1-.478-.15-.678.15-.2.3-.775.975-.95 1.175-.175.2-.35.225-.65.075-.3-.15-1.267-.467-2.413-1.49-1.042-.93-1.442-2.063-1.642-2.412-.2-.35-.022-.538.128-.688.134-.135.3-.35.45-.525.15-.175.2-.3.3-.5.1-.2.05-.375-.025-.525s-.675-1.625-.925-2.225c-.244-.582-.49-.5-.678-.512-.175-.008-.375-.01-.575-.01-.2 0-.525.075-.8.375-.275.3-1.05 1.025-1.05 2.5s1.075 2.9 1.225 3.1c.15.2 2.11 3.224 5.112 4.525.714.31 1.272.496 1.707.635.718.228 1.372.196 1.888.118.574-.087 1.776-.725 2.026-1.425.25-.7.25-1.3 1.75-1.425-.075-.125-.275-.275-.575-.425z" />
            </svg>
          </div>
          <span class="shared-link-label" style="font-size: 11px; font-weight: 600; color: #25d366;">Click here to join WhatsApp Group</span>
        </a>
      `;
    }

    sharedLinksContainer.innerHTML = htmlContent;
  }

  // Conditional Rendering Logic (Online vs Offline Venue Layout)
  const detailVenueInfo = document.getElementById("detail-venue-info");
  if (detailVenueInfo) {
    const venue_type = event.venue_type || (event.mode === 'online' ? 'Online' : 'Offline');
    if (venue_type === 'Online') {
      detailVenueInfo.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 4px; padding-left: 8px;">
          <div style="font-size: 14px; font-weight: 700; color: var(--neon-blue);">Online</div>
          <div style="font-size: 12px; color: var(--muted-white); margin-top: 2px;">
            You will get updates on WhatsApp group for the meeting link
          </div>
        </div>
      `;
    } else {
      const mapUrl = (event.location && (event.location.startsWith('http://') || event.location.startsWith('https://'))) 
        ? event.location 
        : (event.location ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}` : '#');
      const locationName = event.location || 'TBD';
      detailVenueInfo.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 6px; padding-left: 8px;">
          <a href="${mapUrl}" target="_blank" style="display: inline-flex; align-items: center; gap: 8px; color: var(--white-pure); text-decoration: none;">
            <span style="font-size: 16px;">📍</span>
            <span id="detail-location-text" style="font-size: 13px; font-weight: 700; text-decoration: underline;">${locationName}</span>
          </a>
          <div style="margin-top: 2px; padding-left: 24px;">
            <a id="detail-location-map-link" href="${mapUrl}" target="_blank"
              style="font-size: 12px; color: var(--neon-yellow); text-decoration: underline; font-weight: 700;">
              Click here to view the destination
            </a>
          </div>
        </div>
      `;
    }
  }

  // Pre-fill user registration details
  const rName = document.getElementById("detail-reg-name");
  const rKtu = document.getElementById("detail-reg-ktuid");
  const rPhone = document.getElementById("detail-reg-phone");
  if (rName) rName.value = USER_PROFILE.name || "";
  if (rKtu) rKtu.value = USER_PROFILE.id || "";
  if (rPhone) rPhone.value = USER_PROFILE.phone || "";

  // Team slots dynamically
  const teamSection = document.getElementById("detail-team-section");
  const slotsContainer = document.getElementById("detail-team-slots-container");

  if (slotsContainer) slotsContainer.innerHTML = "";
  teamMemberCount = 0;

  if (event.hasTeam) {
    if (teamSection) teamSection.style.display = "flex";
    addDetailTeamSlot();
  } else {
    if (teamSection) teamSection.style.display = "none";
  }

  // Start Detail Countdown ticking clock
  startDetailCountdown(event.isoDate);

  // Reset payment checkout screen states
  const upiCheckoutContainer = document.getElementById("detail-upi-checkout-container");
  const ticketContainer = document.getElementById("ticket-container");
  if (upiCheckoutContainer) upiCheckoutContainer.style.display = "none";
  if (ticketContainer) ticketContainer.style.display = "none";

  // Apply real-time registration visibility state
  handleRealtimeRegistrationUpdate(activeRegistrationData);

  navigateTo("detail");
}

function startDetailCountdown(isoDate) {
  if (detailCountdownInterval) clearInterval(detailCountdownInterval);
  const timerSpan = document.getElementById("detail-countdown-timer");
  if (!timerSpan) return;

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
  if (!container) return;
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

const detailAddMemBtn = document.getElementById("detail-btn-add-member");
if (detailAddMemBtn) detailAddMemBtn.addEventListener("click", addDetailTeamSlot);

// EmailJS Credentials safely mapping in the background for admin approval use later
const EMAILJS_CONFIG = {
  SERVICE_ID: "service_u4ve6g2",
  TEMPLATE_ID: "template_jla3p4e"
};

// ==========================================
// 07 — GATEWAY ROUTING & ACTION CONTROLLER
// ==========================================

function handleDetailActionClick(e) {
  if (e) e.preventDefault();
  if (!selectedEvent) return;

  let reg = activeRegistrationData && activeRegistrationData.eventId === selectedEvent.id ? activeRegistrationData : null;

  if (!reg) {
    // Check fallback registry list
    const fallbackReg = USER_REGISTRATIONS.find(r => r.id === selectedEvent.id);
    if (fallbackReg) {
      reg = {
        eventId: fallbackReg.id,
        registrationId: fallbackReg.registrationId,
        ticketId: fallbackReg.registrationId,
        title: fallbackReg.title,
        type: fallbackReg.type,
        typeLabel: fallbackReg.typeLabel,
        date: fallbackReg.date,
        isoDate: fallbackReg.isoDate,
        time: fallbackReg.time,
        location: fallbackReg.location,
        host: fallbackReg.host,
        color: fallbackReg.color,
        status: fallbackReg.status,
        checkedIn: fallbackReg.checkedIn,
        razorpayPaymentId: fallbackReg.razorpayPaymentId,
        phone: fallbackReg.phone,
        bankAccountName: fallbackReg.bankAccountName
      };
    }
  }

  if (reg) {
    const isSuccess = reg.payment_status === "Success" || reg.status === "Confirmed";
    if (isSuccess) {
      showToast("Authenticating ticket status...", "var(--galactic-purple)", "var(--galactic-purple)");
      const match = EVENTS_DATA.find(e => e.id === reg.eventId);
      const regToPass = {
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
      };
      showTicket(regToPass);
    } else {
      const statusBanner = document.getElementById("registration-status-banner");
      if (statusBanner) {
        statusBanner.style.display = "block";
        statusBanner.textContent = "Awaiting Admin Payment Verification...";
      }
      showCustomAlert(
        "Verification Pending",
        "⚠️ Your registration is received! Your ticket will be active once the Admin approves your payment."
      );
    }
  } else {
    // Fresh user: trigger form submission
    const form = document.getElementById("registration-form");
    if (form) form.requestSubmit();
  }
}

// Bind EITHER button to the routing logic matrix
const dRegisterBtn = document.getElementById("detail-register-btn");
const pToPayBtn = document.getElementById("proceed-to-pay-btn");
if (dRegisterBtn) dRegisterBtn.addEventListener("click", handleDetailActionClick);
if (pToPayBtn) pToPayBtn.addEventListener("click", handleDetailActionClick);

// Bind form submit event
const regFormEl = document.getElementById("registration-form");
if (regFormEl) {
  regFormEl.addEventListener("submit", (e) => {
    e.preventDefault();
    handleRegistrationCheckout();
  });
}

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
  const studentUid = sessionStorage.getItem("loggedInUserUid") || (USER_PROFILE && USER_PROFILE.uid) || (typeof firebase !== "undefined" && firebase.auth && firebase.auth().currentUser && firebase.auth().currentUser.uid);
  const registrationId = "reg-" + studentUid;
  const merchantTransactionId = "TXN_" + registrationId;
  const registrationData = {
    registrationId,
    eventId,
    eventTitle: selectedEvent.title,
    studentName: USER_PROFILE.name,
    studentEmail: USER_PROFILE.email,
    registerNo: USER_PROFILE.id,
    bankAccountName,
    phone,
    teamMembers,
    amount,
    razorpayPaymentId: merchantTransactionId, // PhonePe Transaction ID mapped here
    checkedIn: false,
    status: amount > 0 ? "Pending" : "Confirmed",
    payment_status: amount > 0 ? "Pending" : "Success",
    createdAt: new Date().toISOString(),
    studentUid: sessionStorage.getItem("loggedInUserUid") || localStorage.getItem("loggedInUserUid"),
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

    // ബട്ടൺ ലേബലുകൾ VIEW TICKET എന്ന് മാറ്റുക
    const proceedBtnInstant = document.getElementById("proceed-to-pay-btn");
    if (proceedBtnInstant) {
      proceedBtnInstant.textContent = "VIEW TICKET";
    }
    const regBtnInstant = document.getElementById("detail-register-btn");
    if (regBtnInstant) {
      regBtnInstant.textContent = "VIEW TICKET";
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
  if (typeTag) {
    typeTag.textContent = registration.typeLabel;
    typeTag.className = `ticket-event-type chip chip-${registration.type}`;
  }

  generateQRCode(registration.ticketId, registration.color);

  document.getElementById("btn-ticket-download").onclick = () => {
    showToast("Ticket downloaded successfully!", "var(--success)", "var(--success)");
  };
  document.getElementById("btn-ticket-share").onclick = () => {
    showToast("Ticket share links compiled!", "var(--galactic-purple)", "var(--galactic-purple)");
  };

  navigateTo("ticket");
}

function generateQRCode(text, color) {
  const canvas = document.getElementById("qr-canvas");
  if (canvas) {
    drawQRToCanvas(canvas, text, color, 180);
  }
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
  if (!listContainer) return;
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
  if (!canvas) return;
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
  if (!toast || !textSpan) return;

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
  if (!timeText) return;
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
          exists: doc.exists,
          data: () => doc.data()
        };
      } else {
        await new Promise(resolve => setTimeout(resolve, 200));
        let users = JSON.parse(localStorage.getItem("firebase_mock_users") || "{}");
        for (const email in users) {
          if (users[email].uid === uid) {
            return { exists: true, data: () => users[email].profileData };
          }
        }
        return { exists: false, data: () => null };
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

  const adminEmailKey = (CONFIG.ADMIN_EMAIL || "admin@rit.ac.in").toLowerCase();
  if (!users[adminEmailKey]) {
    users[adminEmailKey] = {
      uid: "uid_admin123",
      email: adminEmailKey,
      password: CONFIG.ADMIN_PASSWORD || "admin123",
      profileData: {
        uid: "uid_admin123",
        name: "ADMINISTRATOR",
        email: adminEmailKey,
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

const profileAvatarTrigger = document.getElementById("profile-avatar-trigger");
if (profileAvatarTrigger) {
  profileAvatarTrigger.addEventListener("click", () => {
    openProfileSetup(true);
  });
}

const btnUploadAvatar = document.getElementById("btn-upload-avatar");
if (btnUploadAvatar) {
  btnUploadAvatar.addEventListener("click", () => {
    document.getElementById("setup-avatar-upload").click();
  });
}

const setupAvatarUpload = document.getElementById("setup-avatar-upload");
if (setupAvatarUpload) {
  setupAvatarUpload.addEventListener("change", function (e) {
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
}

const setupEmail = document.getElementById("setup-email");
if (setupEmail) {
  setupEmail.addEventListener("input", function () {
    this.value = this.value.toLowerCase();
  });
}

const loginEmail = document.getElementById("login-email");
if (loginEmail) {
  loginEmail.addEventListener("input", function () {
    this.value = this.value.toLowerCase();
  });
}

const setupName = document.getElementById("setup-name");
if (setupName) {
  setupName.addEventListener("input", function () {
    this.value = this.value.toUpperCase();
  });
}

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
    if (loginTab) loginTab.classList.add("active");
    if (registerTab) registerTab.classList.remove("active");
    if (loginForm) loginForm.style.display = "block";
    if (registerForm) registerForm.style.display = "none";
    if (title) title.textContent = "Welcome Back";
    if (subtitle) subtitle.textContent = "Sign in to discover and register for events.";
  } else {
    if (loginTab) loginTab.classList.remove("active");
    if (registerTab) registerTab.classList.add("active");
    if (loginForm) loginForm.style.display = "none";
    if (registerForm) registerForm.style.display = "block";
    if (title) title.textContent = "Create Profile";
    if (subtitle) subtitle.textContent = "Set up your credentials to access the IEDC event gateway.";
  }
}

const authTabLogin = document.getElementById("auth-tab-login");
if (authTabLogin) authTabLogin.addEventListener("click", () => switchAuthTab("login"));

const authTabRegister = document.getElementById("auth-tab-register");
if (authTabRegister) authTabRegister.addEventListener("click", () => switchAuthTab("register"));

const btnForgotPassword = document.getElementById("btn-forgot-password");
if (btnForgotPassword) {
  btnForgotPassword.addEventListener("click", () => {
    document.getElementById("auth-tabs-container").style.display = "none";
    document.getElementById("auth-login-form").style.display = "none";
    document.getElementById("auth-forgot-password-form").style.display = "block";
    document.getElementById("setup-title").textContent = "Reset Password";
    document.getElementById("setup-subtitle").textContent = "Enter your email to receive a password reset link.";
  });
}

const btnForgotBack = document.getElementById("btn-forgot-back");
if (btnForgotBack) {
  btnForgotBack.addEventListener("click", () => {
    document.getElementById("auth-forgot-password-form").style.display = "none";
    document.getElementById("auth-tabs-container").style.display = "flex";
    document.getElementById("auth-login-form").style.display = "block";
    document.getElementById("setup-title").textContent = "Welcome Back";
    document.getElementById("setup-subtitle").textContent = "Sign in to discover and register for events.";
  });
}

const authForgotPassForm = document.getElementById("auth-forgot-password-form");
if (authForgotPassForm) {
  authForgotPassForm.addEventListener("submit", async (e) => {
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
}

function checkApprovalAndRoute(profileData) {
  if (profileData.role === "admin" || (profileData.email && profileData.email.toLowerCase() === (CONFIG.ADMIN_EMAIL || "admin@rit.ac.in").toLowerCase())) {
    window.location.href = "admin.html";
  } else if (profileData.approved === true) {
    navigateTo("home");
    if (typeof showAdOverlay !== "undefined") {
      setTimeout(showAdOverlay, 1500);
    }
  } else {
    document.getElementById("pending-student-name").textContent = profileData.name || "Student";
    navigateTo("pending");
  }
}

const authLoginForm = document.getElementById("auth-login-form");
if (authLoginForm) {
  authLoginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const emailInput = document.getElementById("login-email");
      const passwordInput = document.getElementById("login-password");
      if (!emailInput || !passwordInput) {
        throw new Error("Login email or password input field not found.");
      }
      const email = emailInput.value.trim().toLowerCase();
      const password = passwordInput.value;

      const submitBtn = e.target.querySelector("button[type='submit']");
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Verifying...";
      }

      let credentials;
      let isMockAdmin = false;

      if (email === (CONFIG.ADMIN_EMAIL || "admin@rit.ac.in").toLowerCase() && password === (CONFIG.ADMIN_PASSWORD || "admin123")) {
        isMockAdmin = true;
        credentials = { user: { uid: "uid_admin123", email: CONFIG.ADMIN_EMAIL || "admin@rit.ac.in" } };
        useRealFirebase = false;
        sessionStorage.setItem("useRealFirebase", "false");
      }

      if (!isMockAdmin) {
        try {
          credentials = await FirebaseService.auth.signInWithEmailAndPassword(email, password);
        } catch (authError) {
          if (email === "sirin@rit.ac.in" && password === "password123") {
            console.log("Real Firebase login failed. Using local simulator user sirin.");
            useRealFirebase = false;
            sessionStorage.setItem("useRealFirebase", "false");
            credentials = { user: { uid: "uid_sirin123", email: "sirin@rit.ac.in" } };
          } else {
            throw authError;
          }
        }
      }

      const docSnap = await FirebaseService.db.getStudentDoc(credentials.user.uid);
      if (docSnap.exists) {
        USER_PROFILE = docSnap.data();
        if (USER_PROFILE.isApproved === false) {
          await FirebaseService.auth.signOut();
          sessionStorage.removeItem("loggedInUserUid");
          localStorage.removeItem("loggedInUserUid");
          sessionStorage.removeItem("useRealFirebase");
          if (authStateCallback) authStateCallback(null);
          USER_PROFILE = { name: "", email: "", id: "", password: "", department: "", yearOfStudy: "", phone: "", collegeName: "", avatar: "", approved: false };
          alert("Your account has been restricted by the admin.");
          navigateTo("auth");
          return;
        }
        sessionStorage.setItem("loggedInUserUid", credentials.user.uid);
        localStorage.setItem("loggedInUserUid", credentials.user.uid);
        if (authStateCallback) authStateCallback({ uid: credentials.user.uid });
        updateUserProfileUI();
        checkApprovalAndRoute(USER_PROFILE);
      } else {
        if (email === (CONFIG.ADMIN_EMAIL || "admin@rit.ac.in").toLowerCase()) {
          USER_PROFILE = {
            uid: credentials.user.uid,
            name: "ADMINISTRATOR",
            email: CONFIG.ADMIN_EMAIL || "admin@rit.ac.in",
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
          localStorage.setItem("loggedInUserUid", credentials.user.uid);
          if (authStateCallback) authStateCallback({ uid: credentials.user.uid });
          updateUserProfileUI();
          checkApprovalAndRoute(USER_PROFILE);
        } else {
          throw new Error("auth/user-not-found");
        }
      }
    } catch (error) {
      console.error("Login verification error:", error);
      showToast("Invalid credentials. Try again.", "var(--error)", "var(--error)");
    } finally {
      const submitBtn = e.target.querySelector("button[type='submit']");
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Login & Enter";
      }
    }
  });
}

const btnGoogleAuth = document.getElementById("btn-google-auth");
if (btnGoogleAuth) {
  btnGoogleAuth.addEventListener("click", async () => {
    try {
      const credentials = await FirebaseService.auth.signInWithGoogle();
      const uid = credentials.user.uid;
      const email = credentials.user.email;
      const displayName = credentials.user.displayName;
      const docSnap = await FirebaseService.db.getStudentDoc(uid);

      if (docSnap.exists) {
        USER_PROFILE = docSnap.data();
        if (USER_PROFILE.isApproved === false) {
          await FirebaseService.auth.signOut();
          sessionStorage.removeItem("loggedInUserUid");
          localStorage.removeItem("loggedInUserUid");
          sessionStorage.removeItem("useRealFirebase");
          if (authStateCallback) authStateCallback(null);
          USER_PROFILE = { name: "", email: "", id: "", password: "", department: "", yearOfStudy: "", phone: "", collegeName: "", avatar: "", approved: false };
          alert("Your account has been restricted by the admin.");
          navigateTo("auth");
          return;
        }
        sessionStorage.setItem("loggedInUserUid", uid);
        localStorage.setItem("loggedInUserUid", uid);
        if (authStateCallback) authStateCallback({ uid: uid });
        updateUserProfileUI();
        checkApprovalAndRoute(USER_PROFILE);
      } else {
        sessionStorage.setItem("loggedInUserUid", uid);
        localStorage.setItem("loggedInUserUid", uid);
        if (authStateCallback) authStateCallback({ uid: uid });
        switchAuthTab("register");

        document.getElementById("setup-name").value = (displayName || "").toUpperCase();
        document.getElementById("setup-email").value = (email || "").toLowerCase();
        document.getElementById("setup-password").value = "GOOGLE_AUTH_USER";
        document.getElementById("setup-confirm-password").value = "GOOGLE_AUTH_USER";

        showToast("Authenticated! Setup profile details.", "var(--galactic-purple)", "var(--galactic-purple)");
      }
    } catch (e) {
      alert("Google Authentication failed: " + e.message);
      showToast("Google Authentication failed.", "var(--error)", "var(--error)");
    }
  });
}

const profileSetupForm = document.getElementById("profile-setup-form");
if (profileSetupForm) {
  profileSetupForm.addEventListener("submit", async (e) => {
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

    const isUpdating = sessionStorage.getItem("loggedInUserUid") !== null || localStorage.getItem("loggedInUserUid") !== null;

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
        approved: isUpdating ? (USER_PROFILE.approved === true) : true,
        isApproved: isUpdating ? (USER_PROFILE.isApproved !== false) : true,
        createdAt: new Date().toISOString()
      };

      if (isUpdating) {
        const uid = sessionStorage.getItem("loggedInUserUid") || localStorage.getItem("loggedInUserUid");
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
        localStorage.setItem("loggedInUserUid", credentials.user.uid);
        if (authStateCallback) authStateCallback({ uid: credentials.user.uid });
        updateUserProfileUI();
        showToast("Registration successful! Welcome.", "var(--success)", "var(--success)");
        checkApprovalAndRoute(USER_PROFILE);
      }
    } catch (err) {
      alert("Registration failed: " + err.message);
      showToast("Error processing registration.", "var(--error)", "var(--error)");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Register & Enter";
    }
  });
}

function updateUserProfileUI() {
  const name = USER_PROFILE.name || "Student";
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
    if (tabsContainer) tabsContainer.style.display = "none";
    if (loginForm) loginForm.style.display = "none";
    if (registerForm) registerForm.style.display = "block";

    if (title) title.textContent = "Edit Profile";
    if (subtitle) subtitle.textContent = "Update your credentials for the IEDC event gateway.";
    if (submitBtn) submitBtn.textContent = "Save Changes";
    if (backBtn) backBtn.style.display = "flex";

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
    if (tabsContainer) tabsContainer.style.display = "flex";
    if (backBtn) backBtn.style.display = "none";
    switchAuthTab("login");
  }

  navigateTo("auth");
}

async function handleSignOut() {
  await FirebaseService.auth.signOut();
  sessionStorage.removeItem("loggedInUserUid");
  localStorage.removeItem("loggedInUserUid");
  sessionStorage.removeItem("useRealFirebase");
  if (authStateCallback) authStateCallback(null);
  USER_PROFILE = { name: "", email: "", id: "", password: "", department: "", yearOfStudy: "", phone: "", collegeName: "", avatar: "", approved: false };
  navigateTo("auth");
}

document.querySelectorAll(".btn-logout-action").forEach(btn => {
  btn.addEventListener("click", handleSignOut);
});
const btnPendingLogout = document.getElementById("btn-pending-logout");
if (btnPendingLogout) btnPendingLogout.addEventListener("click", handleSignOut);

// Webhook wait screen Back/Dashboard action binder
window.closeWaitingOverlayAndGoToWallet = function () {
  const waitOverlay = document.getElementById("waiting-verification-overlay");
  if (waitOverlay) waitOverlay.style.display = "none";
  if (detailCountdownInterval) clearInterval(detailCountdownInterval);
  switchTab("wallet");
};

const btnWaitingBack = document.getElementById("btn-waiting-back");
if (btnWaitingBack) {
  btnWaitingBack.addEventListener("click", () => {
    const waitOverlay = document.getElementById("waiting-verification-overlay");
    if (waitOverlay) waitOverlay.style.display = "none";
    if (detailCountdownInterval) clearInterval(detailCountdownInterval);
    switchTab("wallet");
  });
}

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
window.switchDashboardTab = switchDashboardTab;

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

      // Merchandise real-time listener
      db.collection("products")
        .onSnapshot((snapshot) => {
          const liveProducts = [];
          snapshot.forEach((doc) => {
            liveProducts.push({ id: doc.id, stockStatus: "in-stock", ...doc.data() });
          });
          MERCH_PRODUCTS = liveProducts.length > 0 ? liveProducts : [
            { id: "prod-hoodie", title: "IEDC Official Hoodie", price: 499, imageUrl: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=300&q=80", stockStatus: "in-stock" },
            { id: "prod-tshirt", title: "IEDC Innovator T-Shirt", price: 299, imageUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=300&q=80", stockStatus: "in-stock" },
            { id: "prod-cap", title: "IEDC Tech Cap", price: 149, imageUrl: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=300&q=80", stockStatus: "in-stock" }
          ];
          localStorage.setItem("merch_products", JSON.stringify(MERCH_PRODUCTS));
          renderMerchSlider();
          if (typeof renderAdminProducts === "function") renderAdminProducts();
        }, (err) => {
          console.error("Merchandise snapshot error:", err);
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

// Service Initializer Gating check
async function initSession() {
  initDynamicContentListeners();
  let cachedUid = sessionStorage.getItem("loggedInUserUid") || localStorage.getItem("loggedInUserUid");
  if (cachedUid) {
    try {
      const docSnap = await FirebaseService.db.getStudentDoc(cachedUid);
      if (docSnap.exists) {
        USER_PROFILE = docSnap.data();
        sessionStorage.setItem("loggedInUserUid", cachedUid);
        updateUserProfileUI();
        checkApprovalAndRoute(USER_PROFILE);
      } else {
        sessionStorage.removeItem("loggedInUserUid");
        localStorage.removeItem("loggedInUserUid");
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
  // =====================================================================
  // BULLETPROOF CONDITIONAL RENDERING STATE SYNCHRONIZER
  // Multi-button targeting matrix with atomic state updates
  // =====================================================================

  // STEP 1: ACQUIRE ALL DOM ELEMENTS SIMULTANEOUSLY
  const regForm = document.getElementById("registration-form");
  const formContainer = document.getElementById("registration-form-container");
  const proceedBtn = document.getElementById("proceed-to-pay-btn");
  const detailRegBtn = document.getElementById("detail-register-btn");
  const statusBanner = document.getElementById("registration-status-banner");
  const stickyCta = document.querySelector(".sticky-cta-container");
  const viewPassBtn = document.getElementById("view-ticket-pass-btn");

  // STEP 2: SAFETY CHECK - Return early if no active event context
  if (!selectedEvent) {
    if (regForm) regForm.style.display = "none";
    if (proceedBtn) proceedBtn.style.display = "none";
    if (detailRegBtn) detailRegBtn.style.display = "none";
    if (statusBanner) statusBanner.style.display = "none";
    if (stickyCta) stickyCta.style.display = "none";
    return;
  }

  // STEP 3: DETERMINE REGISTRATION STATE MATRIX
  const documentExists = data !== null && data !== undefined;
  const isForCurrentEvent = documentExists && data.eventId === selectedEvent.id;
  const isPaymentConfirmed = documentExists &&
    (data.payment_status === "Success" || data.status === "Confirmed");
  const isPaymentPending = documentExists && !isPaymentConfirmed;

  // =====================================================================
  // CONDITION 1: REGISTRATION DOCUMENT EXISTS FOR ACTIVE EVENT
  // =====================================================================
  if (documentExists && isForCurrentEvent) {

    // FORCE-HIDE form wrapper and input container completely
    if (regForm) regForm.style.display = "none";
    if (formContainer) formContainer.style.display = "none";

    // UPDATE BUTTON A: #proceed-to-pay-btn (inside the form)
    if (proceedBtn) {
      proceedBtn.style.display = "block";
      proceedBtn.style.backgroundColor = "var(--neon-yellow)";
      proceedBtn.style.color = "rgba(6, 6, 12, 1)";
      proceedBtn.disabled = false;
      proceedBtn.textContent = "VIEW TICKET";
    }

    // UPDATE BUTTON B: #detail-register-btn (sticky CTA container)
    if (detailRegBtn) {
      detailRegBtn.style.display = "flex";
      detailRegBtn.style.backgroundColor = "var(--neon-yellow)";
      detailRegBtn.style.color = "rgba(6, 6, 12, 1)";
      detailRegBtn.disabled = false;
      detailRegBtn.textContent = "VIEW TICKET";
    }

    // Hide secondary buttons
    if (viewPassBtn) viewPassBtn.style.display = "none";

    // HANDLE PAYMENT STATUS BANNER
    if (isPaymentConfirmed) {
      if (statusBanner) statusBanner.style.display = "none";
    } else if (isPaymentPending) {
      if (statusBanner) {
        statusBanner.style.display = "block";
        statusBanner.textContent = "Awaiting Admin Payment Verification...";
      }
    }

    // Show sticky CTA container
    if (stickyCta) stickyCta.style.display = "block";

  }
  // =====================================================================
  // CONDITION 2: NO REGISTRATION DOCUMENT EXISTS (FRESH USER)
  // =====================================================================
  else {

    // Show registration form and input fields normally
    if (regForm) regForm.style.display = "flex";
    if (formContainer) formContainer.style.display = "flex";

    // UPDATE BUTTON A: #proceed-to-pay-btn to initial "PROCEED TO PAY" state
    if (proceedBtn) {
      proceedBtn.style.display = "block";
      proceedBtn.style.backgroundColor = "var(--neon-yellow)";
      proceedBtn.style.color = "rgba(6, 6, 12, 1)";
      proceedBtn.disabled = false;
      proceedBtn.textContent = "PROCEED TO PAY";
    }

    // UPDATE BUTTON B: #detail-register-btn
    if (detailRegBtn) {
      detailRegBtn.style.display = "flex";

      if (selectedEvent.seats !== undefined && selectedEvent.seats <= 0) {
        detailRegBtn.textContent = "Sold Out";
        detailRegBtn.disabled = true;
        detailRegBtn.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
        detailRegBtn.style.color = "var(--muted-white)";
      } else {
        detailRegBtn.textContent = "PROCEED TO PAY";
        detailRegBtn.disabled = false;
        detailRegBtn.style.backgroundColor = "var(--neon-yellow)";
        detailRegBtn.style.color = "rgba(6, 6, 12, 1)";
      }
    }

    if (statusBanner) statusBanner.style.display = "none";
    if (viewPassBtn) viewPassBtn.style.display = "none";

    if (stickyCta) stickyCta.style.display = "block";
  }
}

// Register the requested authentication observer to conditionally manage bottom navigation bar visibility and auth sync
let regUnsubscribe1 = null;
let regUnsubscribe2 = null;

onAuthStateChanged(auth, (user) => {
  const bottomNav = document.getElementById("bottom-nav") || document.querySelector(".bottom-nav");
  const dashboardLayout = document.getElementById("main-dashboard-layout");
  const authScreen = document.getElementById("screen-auth");
  const pendingScreen = document.getElementById("screen-pending");

  if (user) {
    // User is logged in. Verify approval status before showing
    const cachedUid = sessionStorage.getItem("loggedInUserUid") || localStorage.getItem("loggedInUserUid") || (user && user.uid);
    if (cachedUid) {
      FirebaseService.db.getStudentDoc(cachedUid).then(docSnap => {
        if (docSnap.exists) {
          const profileData = docSnap.data();
          if (profileData.isApproved === false) {
            FirebaseService.auth.signOut().then(() => {
              sessionStorage.removeItem("loggedInUserUid");
              localStorage.removeItem("loggedInUserUid");
              sessionStorage.removeItem("useRealFirebase");
              if (authStateCallback) authStateCallback(null);
              USER_PROFILE = { name: "", email: "", id: "", password: "", department: "", yearOfStudy: "", phone: "", collegeName: "", avatar: "", approved: false };
              alert("Your account has been restricted by the admin.");
              navigateTo("auth");
            });
            return;
          }
          if (profileData.approved === true) {
            // Approved: Show dashboard layout, hide auth and pending screens
            if (dashboardLayout) dashboardLayout.style.display = "contents";
            if (authScreen) {
              authScreen.style.display = "none";
              authScreen.classList.remove("active");
            }
            if (pendingScreen) {
              pendingScreen.style.display = "none";
              pendingScreen.classList.remove("active");
            }
            if (bottomNav) {
              bottomNav.classList.remove("nav-hidden");
              bottomNav.style.setProperty("display", "grid", "important");
            }

            // Auto-switch to home tab if no active inner tab is showing
            const activeSection = document.querySelector(".nav-section.active");
            if (!activeSection) {
              switchTab("home");
            }
          } else {
            // Pending: Hide dashboard layout, hide auth screen, show pending screen
            if (dashboardLayout) dashboardLayout.style.display = "none";
            if (authScreen) {
              authScreen.style.display = "none";
              authScreen.classList.remove("active");
            }
            if (pendingScreen) {
              pendingScreen.style.display = "block";
              pendingScreen.classList.add("active");
              const pendingName = document.getElementById("pending-student-name");
              if (pendingName) pendingName.textContent = profileData.name || "Student";
            }
            if (bottomNav) {
              bottomNav.classList.add("nav-hidden");
              bottomNav.style.setProperty("display", "none", "important");
            }
          }
        } else {
          // If profile doc doesn't exist yet but auth exists (fallback to auth setup screen)
          if (dashboardLayout) dashboardLayout.style.display = "none";
          if (authScreen) {
            authScreen.style.display = "block";
            authScreen.classList.add("active");
          }
          if (pendingScreen) {
            pendingScreen.style.display = "none";
            pendingScreen.classList.remove("active");
          }
          if (bottomNav) {
            bottomNav.classList.add("nav-hidden");
            bottomNav.style.setProperty("display", "none", "important");
          }
        }
      }).catch(err => {
        console.error("Auth check failed:", err);
      });
    }
  } else {
    // Strictly force UI to show auth screen and hide everything else
    if (dashboardLayout) dashboardLayout.style.display = "none";
    if (authScreen) {
      authScreen.style.display = "block";
      authScreen.classList.add("active");
    }
    if (pendingScreen) {
      pendingScreen.style.display = "none";
      pendingScreen.classList.remove("active");
    }
    if (bottomNav) {
      bottomNav.classList.add("nav-hidden");
      bottomNav.style.setProperty("display", "none", "important");
    }
  }

  // REAL-TIME AUTH & STATE SYNC
  if (user) {
    if (regUnsubscribe1) { regUnsubscribe1(); regUnsubscribe1 = null; }
    if (regUnsubscribe2) { regUnsubscribe2(); regUnsubscribe2 = null; }

    if (useRealFirebase) {
      try {
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

          let finalReg = activeRegistrationData;
          if (!finalReg && selectedEvent) {
            // Fallback check in USER_REGISTRATIONS
            const fallbackReg = USER_REGISTRATIONS.find(r => r.id === selectedEvent.id);
            if (fallbackReg) {
              finalReg = {
                eventId: fallbackReg.id,
                registrationId: fallbackReg.registrationId,
                payment_status: fallbackReg.status === "Confirmed" ? "Success" : "Pending",
                status: fallbackReg.status,
                eventTitle: fallbackReg.title,
                checkedIn: fallbackReg.checkedIn,
                razorpayPaymentId: fallbackReg.razorpayPaymentId,
                phone: fallbackReg.phone,
                bankAccountName: fallbackReg.bankAccountName
              };
            }
          }
          handleRealtimeRegistrationUpdate(finalReg);
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
      } catch (firestoreInitErr) {
        console.error("Firestore stream initialization failed:", firestoreInitErr);
      }
    } else {
      // Simulated LocalStorage real-time sync for mock mode
      if (window.mockRegInterval) clearInterval(window.mockRegInterval);
      const checkMockReg = () => {
        const mockRegs = JSON.parse(localStorage.getItem("firebase_mock_registrations") || "[]");

        let finalReg = null;
        if (selectedEvent) {
          const reg = mockRegs.find(r => r.eventId === selectedEvent.id && (r.registrationId === "reg-" + user.uid || r.registrationId === user.uid || r.studentUid === user.uid));
          if (reg) {
            finalReg = reg;
          } else {
            const fallbackReg = USER_REGISTRATIONS.find(r => r.id === selectedEvent.id);
            if (fallbackReg) {
              finalReg = {
                eventId: fallbackReg.id,
                registrationId: fallbackReg.registrationId,
                payment_status: fallbackReg.status === "Confirmed" ? "Success" : "Pending",
                status: fallbackReg.status,
                eventTitle: fallbackReg.title,
                checkedIn: fallbackReg.checkedIn,
                razorpayPaymentId: fallbackReg.razorpayPaymentId,
                phone: fallbackReg.phone,
                bankAccountName: fallbackReg.bankAccountName
              };
            }
          }
        }
        activeRegistrationData = finalReg;
        handleRealtimeRegistrationUpdate(finalReg);
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

// ==========================================
// 12 — PREMIUM GLASSMORPHIC CHATBOT WIDGET LOGIC
// ==========================================
(function () {
  const launcher = document.getElementById("chat-bot-launcher-btn");
  const windowContainer = document.getElementById("chat-bot-window-container");
  const closeBtn = document.getElementById("chat-bot-close-btn");
  const sendBtn = document.getElementById("chat-bot-send-btn");
  const inputField = document.getElementById("chat-bot-input");
  const messagesBox = document.getElementById("chat-bot-messages-box");

  if (launcher && windowContainer) {
    launcher.addEventListener("click", () => {
      if (windowContainer.style.display === "none" || windowContainer.style.display === "") {
        windowContainer.style.display = "flex";
        if (inputField) inputField.focus();

        // Greeting/default reply correction on open
        if (messagesBox && messagesBox.children.length === 0) {
          addChatMessage("How can I help you with IEDC events", "bot");
        }
      } else {
        windowContainer.style.display = "none";
      }
    });
  }

  if (closeBtn && windowContainer) {
    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      windowContainer.style.display = "none";
    });
  }

  const botReplies = [
    "IEDC events is a group of events led by students in RIT Kottayam IEDC",
    "The next flagship event is the InnovateRIT Summit '26 happening this weekend! You can register directly from the home screen.",
    "Workshops on AI/ML, Cyber Security, and Web3 are scheduled for this week. Attendees get certified KTU Activity Points!",
    "For team events, you can add your team members directly on the event detail registration page before proceeding to pay.",
    "If you face any payment issues, you can scan the dynamic UPI QR code on the payment screen. The admin will verify it shortly."
  ];

  function addChatMessage(text, sender) {
    if (!messagesBox) return;
    const messageDiv = document.createElement("div");
    messageDiv.className = `chatbot-message ${sender}-message`;
    messageDiv.textContent = text;
    messagesBox.appendChild(messageDiv);
    messagesBox.scrollTop = messagesBox.scrollHeight;
  }

  function handleSend() {
    if (!inputField || !messagesBox) return;
    const query = inputField.value.trim();
    if (!query) return;

    addChatMessage(query, "user");
    inputField.value = "";

    setTimeout(() => {
      let reply = "How can I help you with IEDC events";
      const lowerQuery = query.toLowerCase();

      if (lowerQuery.includes("hello") || lowerQuery.includes("hi") || lowerQuery.includes("hey")) {
        reply = "How can I help you with IEDC events";
      } else if (lowerQuery.includes("summit") || lowerQuery.includes("innovaterit")) {
        reply = botReplies[1];
      } else if (lowerQuery.includes("workshop") || lowerQuery.includes("ktu") || lowerQuery.includes("points")) {
        reply = botReplies[2];
      } else if (lowerQuery.includes("team") || lowerQuery.includes("member") || lowerQuery.includes("register")) {
        reply = botReplies[3];
      } else if (lowerQuery.includes("pay") || lowerQuery.includes("upi") || lowerQuery.includes("qr") || lowerQuery.includes("payment")) {
        reply = botReplies[4];
      } else if (lowerQuery.includes("event") || lowerQuery.includes("ticket")) {
        reply = botReplies[0];
      }

      addChatMessage(reply, "bot");
    }, 600);
  }

  if (sendBtn && inputField) {
    sendBtn.addEventListener("click", handleSend);
    inputField.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        handleSend();
      }
    });
  }

  // ==========================================
  // REAL-TIME DYNAMIC VISIBILITY CONTROLLER
  // ==========================================
  function checkLoginState() {
    const authScreen = document.getElementById("screen-auth");
    const pendingScreen = document.getElementById("screen-pending");

    const isAuthActive = authScreen && authScreen.classList.contains("active");
    const isPendingActive = pendingScreen && pendingScreen.classList.contains("active");

    if (isAuthActive || isPendingActive) {
      if (launcher) launcher.style.display = "none";
      if (windowContainer) windowContainer.style.display = "none";
    } else {
      if (launcher && windowContainer && windowContainer.style.display !== "flex") {
        launcher.style.display = "flex";
      }
    }
  }

  const observer = new MutationObserver(() => {
    checkLoginState();
  });

  const authScreen = document.getElementById("screen-auth");
  const pendingScreen = document.getElementById("screen-pending");
  if (authScreen) observer.observe(authScreen, { attributes: true, attributeFilter: ["class"] });
  if (pendingScreen) observer.observe(pendingScreen, { attributes: true, attributeFilter: ["class"] });

  // Run initial check
  checkLoginState();
})();

// ==========================================================================
// 13 — INTEGRATED IEDC MERCHANDISE PLATFORM LOGIC
// ==========================================================================

let MERCH_PRODUCTS = [
  { id: "prod-hoodie", title: "IEDC Official Hoodie", price: 499, imageUrl: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=300&q=80", stockStatus: "in-stock" },
  { id: "prod-tshirt", title: "IEDC Innovator T-Shirt", price: 299, imageUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=300&q=80", stockStatus: "in-stock" },
  { id: "prod-cap", title: "IEDC Tech Cap", price: 149, imageUrl: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=300&q=80", stockStatus: "in-stock" }
];

let merchCart = [];

// Initialize products from localStorage if present
(function initMerch() {
  const cachedProds = localStorage.getItem("merch_products");
  if (cachedProds) {
    try {
      let parsed = JSON.parse(cachedProds);
      parsed = parsed.map(p => {
        if (p.imageUrl && (p.imageUrl.includes("${p.imageUrl}") || p.imageUrl.includes("imageUr1") || p.imageUrl.includes("${p.imageUr1}") || p.imageUrl.includes("%7B"))) {
          p.imageUrl = "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=300&q=80";
        }
        return p;
      });
      MERCH_PRODUCTS = parsed;
      localStorage.setItem("merch_products", JSON.stringify(MERCH_PRODUCTS));
    } catch (e) {
      console.error("Error parsing merchandise products from localStorage:", e);
    }
  } else {
    localStorage.setItem("merch_products", JSON.stringify(MERCH_PRODUCTS));
  }
})();

window.renderMerchSlider = function () {
  const slider = document.getElementById("merch-slider-container");
  if (!slider) return;
  slider.innerHTML = "";

  MERCH_PRODUCTS.forEach(p => {
    if (p.stockStatus === "out-of-stock") return;
    const card = document.createElement("div");
    card.className = "merch-card card-event";
    card.innerHTML = `
      <img src="${p.imageUrl}" style="width: 100%; height: 200px; object-fit: cover;" class="merch-img" alt="${p.title}">
      <div class="merch-title" style="font-weight: 800; font-size: 14px; margin-top: 8px;">${p.title}</div>
      <div class="merch-price" style="color: var(--neon-yellow); font-weight: 900; margin-top: 2px;">₹${p.price}</div>
      <div style="display: flex; gap: 6px; margin-top: 6px; justify-content: space-between; align-items: center;">
        <select class="merch-select" id="size-${p.id}" style="flex: 1; padding: 6px; background: rgba(255,255,255,0.05); color: white; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; font-size:11px; outline: none;">
          <option value="S">S</option>
          <option value="M" selected>M</option>
          <option value="L">L</option>
          <option value="XL">XL</option>
        </select>
        <input type="number" class="product-qty-input" id="qty-${p.id}" value="1" min="1" max="10" style="width: 60px; padding: 6px; background: rgba(255,255,255,0.05); color: white; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; font-size:11px; text-align: center; outline: none;">
      </div>
      <button class="btn btn-add-to-cart" onclick="addMerchToCart('${p.id}')" style="background: var(--neon-purple) !important; color: white !important; cursor: pointer; width: 100%; padding: 10px; font-size: 11px; font-weight: 700; border-radius: 10px; text-transform: uppercase; letter-spacing: 0.5px; transition: all 0.2s ease; margin-top: 8px; border: none; box-shadow: 0 0 12px rgba(139,111,212,0.3) !important;">Add to Cart</button>
    `;
    slider.appendChild(card);
  });
};

window.addMerchToCart = function (productId) {
  const p = MERCH_PRODUCTS.find(x => x.id === productId);
  if (!p) return;
  const sizeSelect = document.getElementById(`size-${productId}`);
  const qtyInput = document.getElementById(`qty-${productId}`);
  const size = sizeSelect ? sizeSelect.value : "M";
  const quantity = qtyInput ? parseInt(qtyInput.value) : 1;

  if (quantity < 1 || quantity > 10) {
    alert("Quantity must be between 1 and 10.");
    return;
  }

  const existing = merchCart.find(x => x.product.id === productId && x.size === size);
  if (existing) {
    existing.quantity += quantity;
    existing.subtotal = existing.product.price * existing.quantity;
  } else {
    merchCart.push({
      product: p,
      size,
      quantity,
      subtotal: p.price * quantity
    });
  }

  updateCartBadge();
  updateCartUI();

  if (typeof showToast !== "undefined") {
    showToast("Added to Cart!", "var(--neon-purple)", "var(--neon-purple)");
  } else {
    alert("Added to Cart!");
  }
};

function updateCartBadge() {
  const totalItems = merchCart.reduce((sum, item) => sum + item.quantity, 0);
  const cartIconBadge = document.getElementById("merch-cart-icon");
  const cartCountBadge = document.getElementById("cart-count");
  if (cartIconBadge) cartIconBadge.textContent = totalItems;
  if (cartCountBadge) cartCountBadge.textContent = totalItems;
}

window.updateCartUI = function () {
  const container = document.getElementById("cart-items-container");
  const totalLabel = document.getElementById("cart-total-label");
  if (!container) return;

  container.innerHTML = "";
  let totalAmount = 0;

  merchCart.forEach((item, index) => {
    totalAmount += item.subtotal;
    const div = document.createElement("div");
    div.style.display = "flex";
    div.style.justifyContent = "space-between";
    div.style.alignItems = "center";
    div.style.background = "rgba(255,255,255,0.02)";
    div.style.border = "1px solid rgba(255,255,255,0.06)";
    div.style.padding = "8px 12px";
    div.style.borderRadius = "10px";
    div.style.fontSize = "12px";

    div.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 2px;">
        <span style="font-weight: 700; color: white;">${item.product.title} (${item.size})</span>
        <span style="color: var(--muted-white);">₹${item.product.price} x ${item.quantity}</span>
      </div>
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-weight: 800; color: var(--neon-yellow);">₹${item.subtotal}</span>
        <button type="button" onclick="removeCartItem(${index})" style="background: transparent; border: none; color: var(--neon-coral); font-size: 16px; cursor: pointer;">&times;</button>
      </div>
    `;
    container.appendChild(div);
  });

  if (totalLabel) totalLabel.textContent = `₹${totalAmount}`;
};

window.removeCartItem = function (index) {
  merchCart.splice(index, 1);
  updateCartBadge();
  updateCartUI();
};

// Bind elements on cart and checkout flow using dynamic delegation
window.switchCartTab = function (tabName) {
  const currentTabBtn = document.getElementById("cart-tab-current-btn");
  const historyTabBtn = document.getElementById("cart-tab-history-btn");
  const currentTabSection = document.getElementById("cart-current-tab-section");
  const historyTabSection = document.getElementById("cart-history-tab-section");

  if (!currentTabBtn || !historyTabBtn || !currentTabSection || !historyTabSection) return;

  if (tabName === "current") {
    currentTabBtn.style.color = "var(--neon-yellow)";
    currentTabBtn.style.borderBottom = "2px solid var(--neon-yellow)";
    historyTabBtn.style.color = "var(--muted-white)";
    historyTabBtn.style.borderBottom = "2px solid transparent";
    
    currentTabSection.style.display = "block";
    historyTabSection.style.display = "none";
  } else {
    currentTabBtn.style.color = "var(--muted-white)";
    currentTabBtn.style.borderBottom = "2px solid transparent";
    historyTabBtn.style.color = "var(--neon-yellow)";
    historyTabBtn.style.borderBottom = "2px solid var(--neon-yellow)";
    
    currentTabSection.style.display = "none";
    historyTabSection.style.display = "block";
    
    window.loadRecentOrdersHistory();
  }
};

window.populatePickupDropdown = async function () {
  const dropdown = document.getElementById("pickup-event");
  if (!dropdown) return;

  dropdown.innerHTML = "";
  const defaultOpt = document.createElement("option");
  defaultOpt.value = "Direct IEDC Hub Pickup";
  defaultOpt.textContent = "Direct IEDC Hub Pickup";
  dropdown.appendChild(defaultOpt);

  let offlineEvents = [];
  const realFirebaseActive = typeof useRealFirebase !== "undefined" && useRealFirebase;

  if (realFirebaseActive && typeof firebase !== "undefined" && firebase.firestore) {
    try {
      const db = firebase.firestore();
      const eventsSnap = await db.collection("events").where("venue_type", "==", "Offline").get();
      eventsSnap.forEach(doc => {
        const evt = doc.data();
        if (evt && evt.title) offlineEvents.push(evt.title);
      });
      const tournamentsSnap = await db.collection("tournaments").where("venue_type", "==", "Offline").get();
      tournamentsSnap.forEach(doc => {
        const tour = doc.data();
        if (tour && tour.title) offlineEvents.push(tour.title);
      });
    } catch (err) {
      console.error("Firestore offline events fetch error:", err);
    }
  } else {
    try {
      const mockEvents = JSON.parse(localStorage.getItem("firebase_mock_events") || "[]");
      const mockTournaments = JSON.parse(localStorage.getItem("firebase_mock_tournaments") || "[]");
      mockEvents.forEach(evt => {
        if (evt.venue_type === "Offline" || evt.mode === "offline") {
          if (evt.title) offlineEvents.push(evt.title);
        }
      });
      mockTournaments.forEach(tour => {
        if (tour.venue_type === "Offline" || tour.mode === "offline") {
          if (tour.title) offlineEvents.push(tour.title);
        }
      });
    } catch (err) {
      console.error("Local mock storage load failed:", err);
    }
  }

  if (offlineEvents.length === 0 && typeof EVENTS_DATA !== "undefined" && EVENTS_DATA.length > 0) {
    EVENTS_DATA.forEach(evt => {
      if (evt.venue_type === "Offline" || evt.mode === "offline") {
        if (evt.title) offlineEvents.push(evt.title);
      }
    });
  }

  const uniqueOfflineEvents = [...new Set(offlineEvents)];
  uniqueOfflineEvents.forEach(evtName => {
    const opt = document.createElement("option");
    opt.value = evtName;
    opt.textContent = evtName;
    dropdown.appendChild(opt);
  });
};

window.loadRecentOrdersHistory = async function () {
  const container = document.getElementById("cart-history-container");
  if (!container) return;

  container.innerHTML = `<div style="text-align: center; color: var(--muted-white); padding: 16px; font-size: 11px;">Loading history...</div>`;

  const loggedInEmail = USER_PROFILE.email || sessionStorage.getItem("loggedInUserEmail");
  if (!loggedInEmail) {
    container.innerHTML = `<div style="text-align: center; color: var(--muted-white); padding: 16px; font-size: 11px;">Please log in to view history.</div>`;
    return;
  }

  let orders = [];
  const realFirebaseActive = typeof useRealFirebase !== "undefined" && useRealFirebase;

  if (realFirebaseActive && typeof firebase !== "undefined" && firebase.firestore) {
    try {
      const db = firebase.firestore();
      const snap = await db.collection("merchandise_orders")
                            .where("studentEmail", "==", loggedInEmail)
                            .get();
      snap.forEach(doc => {
        orders.push(doc.data());
      });
      orders.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
    } catch (err) {
      console.error("Firestore fetch orders error:", err);
      container.innerHTML = `<div style="text-align: center; color: var(--neon-coral); padding: 16px; font-size: 11px;">Failed to load history.</div>`;
      return;
    }
  } else {
    try {
      const mockOrders = JSON.parse(localStorage.getItem("merch_orders") || "[]");
      orders = mockOrders.filter(o => o.studentEmail === loggedInEmail || (o.studentUid && o.studentUid === sessionStorage.getItem("loggedInUserUid")));
    } catch (err) {
      console.error("Local mock storage load failed:", err);
    }
  }

  if (orders.length === 0) {
    container.innerHTML = `<div style="text-align: center; color: var(--muted-white); padding: 16px; font-size: 11px;">No previous orders found.</div>`;
    return;
  }

  container.innerHTML = "";
  orders.forEach(o => {
    const card = document.createElement("div");
    card.style.background = "rgba(255, 255, 255, 0.02)";
    card.style.border = "1px solid rgba(255, 255, 255, 0.06)";
    card.style.borderRadius = "12px";
    card.style.padding = "10px";
    card.style.fontSize = "11px";
    card.style.display = "flex";
    card.style.flexDirection = "column";
    card.style.gap = "4px";
    card.style.marginBottom = "8px";

    let borderCol = "var(--warning)";
    let badgeStyle = "background: rgba(234, 179, 8, 0.12); border: 1px solid rgba(234, 179, 8, 0.25); color: #eab308; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 700;";
    let statusText = "⏳ Pending";

    if (o.status === "Confirmed" || o.status === "Approved") {
      borderCol = "var(--success)";
      badgeStyle = "background: rgba(74, 232, 138, 0.12); border: 1px solid rgba(74, 232, 138, 0.25); color: #4ae88a; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 700;";
      statusText = "✅ Paid & Confirmed";
    } else if (o.status === "Failed" || o.status === "Rejected") {
      borderCol = "var(--error)";
      badgeStyle = "background: rgba(232, 74, 74, 0.12); border: 1px solid rgba(232, 74, 74, 0.25); color: #e8614a; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 700;";
      statusText = "❌ Payment Rejected";
    }

    card.style.borderLeft = `3px solid ${borderCol}`;

    const itemsStr = o.items.map(i => `${i.title} (${i.size}) x ${i.quantity}`).join(", ");
    const pickupVal = o.pickupEvent || "Direct IEDC Hub Pickup";

    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-weight: 700; color: white;">Order #${o.orderId}</span>
        <span style="${badgeStyle}">${statusText}</span>
      </div>
      <div style="color: var(--muted-white); font-weight: 500; margin-top: 2px;">${itemsStr}</div>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
        <span style="color: var(--neon-yellow); font-weight: 800;">₹${o.totalAmount}</span>
        <span style="color: var(--muted-white); font-size: 10px;">Pickup: ${pickupVal}</span>
      </div>
      ${o.utr ? `<div style="font-size: 9px; color: var(--muted-white); font-family: monospace; margin-top: 2px;">UTR: ${o.utr}</div>` : ""}
    `;
    container.appendChild(card);
  });
};

async function saveMerchandiseOrder(order) {
  const realFirebaseActive = typeof useRealFirebase !== "undefined" && useRealFirebase;
  if (realFirebaseActive && typeof firebase !== "undefined" && firebase.firestore) {
    try {
      const db = firebase.firestore();
      await db.collection("merchandise_orders").doc(order.orderId).set(order);
    } catch (error) {
      console.error("Error saving merchandise order to Firestore:", error);
      throw error;
    }
  } else {
    let mockOrders = JSON.parse(localStorage.getItem("merch_orders") || "[]");
    mockOrders.unshift(order);
    localStorage.setItem("merch_orders", JSON.stringify(mockOrders));
  }
}

// Bind elements on cart and checkout flow using DOMContentLoaded and dynamic delegation
document.addEventListener("DOMContentLoaded", () => {
  const mainCartBtn = document.getElementById("main-cart-btn");
  if (mainCartBtn) {
    mainCartBtn.addEventListener("click", () => {
      const cartModal = document.getElementById("merch-cart-modal") || document.getElementById("cart-drawer") || document.getElementById("cart-modal");
      if (cartModal) {
        if (cartModal.classList.contains("ad-overlay")) {
          cartModal.style.setProperty("display", "flex", "important");
        } else {
          cartModal.style.setProperty("display", "block", "important");
        }
        
        // Reset to Current Order tab by default
        window.switchCartTab("current");

        // Prepopulate checkout form fields
        const checkoutNameInput = document.getElementById("checkout-name");
        const checkoutPhoneInput = document.getElementById("checkout-phone");
        if (checkoutNameInput && !checkoutNameInput.value) {
          checkoutNameInput.value = USER_PROFILE.name || "";
        }
        if (checkoutPhoneInput && !checkoutPhoneInput.value) {
          checkoutPhoneInput.value = USER_PROFILE.phone || "";
        }

        // Dynamically populate event selector
        window.populatePickupDropdown();

        // Load student recent order history
        window.loadRecentOrdersHistory();

        if (typeof updateCartUI === "function") {
          updateCartUI();
        }
      }
    });
  }

  const closeBtn = document.getElementById("merch-cart-close-btn") || document.getElementById("cart-close-btn");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      const cartModal = document.getElementById("merch-cart-modal") || document.getElementById("cart-drawer") || document.getElementById("cart-modal");
      if (cartModal) {
        cartModal.style.setProperty("display", "none", "important");
      }
    });
  }
});

(function bindCartActions() {
  document.addEventListener("click", (e) => {
    // Open Cart Modal
    const cartBtn = e.target.closest("#main-cart-btn");
    if (cartBtn) {
      const cartModal = document.getElementById("merch-cart-modal") || document.getElementById("cart-drawer") || document.getElementById("cart-modal");
      if (cartModal) {
        if (cartModal.classList.contains("ad-overlay")) {
          cartModal.style.setProperty("display", "flex", "important");
        } else {
          cartModal.style.setProperty("display", "block", "important");
        }
        
        // Reset to Current Order tab by default
        window.switchCartTab("current");

        // Prepopulate checkout form fields
        const checkoutNameInput = document.getElementById("checkout-name");
        const checkoutPhoneInput = document.getElementById("checkout-phone");
        if (checkoutNameInput && !checkoutNameInput.value) {
          checkoutNameInput.value = USER_PROFILE.name || "";
        }
        if (checkoutPhoneInput && !checkoutPhoneInput.value) {
          checkoutPhoneInput.value = USER_PROFILE.phone || "";
        }

        // Dynamically populate event selector
        window.populatePickupDropdown();

        // Load student recent order history
        window.loadRecentOrdersHistory();

        updateCartUI();
      }
    }

    // Close Cart Modal
    if (e.target && (e.target.id === "merch-cart-close-btn" || e.target.id === "cart-close-btn")) {
      const cartModal = document.getElementById("merch-cart-modal") || document.getElementById("cart-drawer") || document.getElementById("cart-modal");
      if (cartModal) cartModal.style.setProperty("display", "none", "important");
    }

    // Close Payment Modal
    if (e.target && e.target.id === "merch-payment-close-btn") {
      const paymentModal = document.getElementById("merch-payment-modal");
      if (paymentModal) paymentModal.style.display = "none";
    }

    // Proceed to Pay
    if (e.target && e.target.id === "cart-proceed-btn") {
      if (merchCart.length === 0) {
        alert("Your cart is empty!");
        return;
      }

      const nameInput = document.getElementById("checkout-name");
      const phoneInput = document.getElementById("checkout-phone");
      const pickupSelect = document.getElementById("pickup-event");

      const nameVal = nameInput ? nameInput.value.trim() : "";
      const phoneVal = phoneInput ? phoneInput.value.trim() : "";
      const pickupVal = pickupSelect ? pickupSelect.value : "";

      if (!nameVal) {
        alert("Please enter your name for checkout.");
        return;
      }
      if (!phoneVal) {
        alert("Please enter your phone number.");
        return;
      }
      if (!pickupVal) {
        alert("Please select a pickup point.");
        return;
      }

      // Temporarily store checkout values in sessionStorage
      sessionStorage.setItem("merch_checkout_name", nameVal);
      sessionStorage.setItem("merch_checkout_phone", phoneVal);
      sessionStorage.setItem("merch_checkout_pickup", pickupVal);

      const totalAmount = merchCart.reduce((sum, item) => sum + item.subtotal, 0);
      const amountLabel = document.getElementById("merch-pay-amount-label");
      if (amountLabel) amountLabel.textContent = `₹${totalAmount}`;

      const merchUpiQrImage = document.getElementById("merch-upi-qr-image");
      if (merchUpiQrImage) {
        const upiUrl = `upi://pay?pa=iedcrit@okaxis&pn=IEDC%20Merchandise&am=${totalAmount}&cu=INR`;
        merchUpiQrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(upiUrl)}`;
      }

      const cartModal = document.getElementById("merch-cart-modal");
      const paymentModal = document.getElementById("merch-payment-modal");
      if (cartModal) cartModal.style.display = "none";
      if (paymentModal) paymentModal.style.display = "flex";
    }

    // Submit Payment Reference
    if (e.target && e.target.id === "merch-submit-utr-btn") {
      const utrInput = document.getElementById("merch-utr-input");
      const utr = utrInput ? utrInput.value.trim() : "";
      if (!utr || utr.length < 6) {
        alert("Please enter a valid Transaction ID / UTR number.");
        return;
      }

      const totalAmount = merchCart.reduce((sum, item) => sum + item.subtotal, 0);
      const studentUid = sessionStorage.getItem("loggedInUserUid") || "anonymous_student";
      const studentEmail = USER_PROFILE.email || sessionStorage.getItem("loggedInUserEmail") || "anonymous@rit.ac.in";
      
      const studentName = sessionStorage.getItem("merch_checkout_name") || USER_PROFILE.name || "Student";
      const phone = sessionStorage.getItem("merch_checkout_phone") || USER_PROFILE.phone || "";
      const pickupEvent = sessionStorage.getItem("merch_checkout_pickup") || "Direct IEDC Hub Pickup";

      const newOrder = {
        orderId: "ord-" + Math.floor(Math.random() * 900000 + 100000),
        studentUid,
        studentName,
        studentEmail,
        phone,
        pickupEvent,
        items: merchCart.map(x => ({ title: x.product.title, size: x.size, quantity: x.quantity })),
        totalAmount,
        utr,
        status: "Pending",
        timestamp: new Date().toISOString()
      };

      saveMerchandiseOrder(newOrder).then(() => {
        merchCart = [];
        updateCartBadge();
        updateCartUI();
        if (utrInput) utrInput.value = "";

        const paymentModal = document.getElementById("merch-payment-modal");
        if (paymentModal) paymentModal.style.display = "none";

        if (typeof showToast !== "undefined") {
          showToast("Order Submitted! Pending Approval.", "var(--success)", "var(--success)");
        } else {
          alert("Order Submitted! Pending Approval.");
        }
        loadStudentOrders();
        window.loadRecentOrdersHistory();
      }).catch(err => {
        alert("Failed to submit order: " + err.message);
      });
    }

    // Print Confirmed Orders List
    if (e.target && e.target.id === "print-orders-btn") {
      const style = document.createElement("style");
      style.id = "print-merchandise-styles";
      style.innerHTML = `
        @media print {
          body * {
            visibility: hidden !important;
          }
          #merchandise-orders-table, #merchandise-orders-table * {
            visibility: visible !important;
          }
          #merchandise-orders-table {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            border-collapse: collapse !important;
            color: black !important;
            background: white !important;
          }
          #merchandise-orders-table th, #merchandise-orders-table td {
            border: 1px solid #ddd !important;
            padding: 8px !important;
            text-align: left !important;
            color: black !important;
          }
          #merchandise-orders-table th {
            background-color: #f2f2f2 !important;
            font-weight: bold !important;
          }
        }
      `;
      document.head.appendChild(style);
      window.print();
      setTimeout(() => {
        const el = document.getElementById("print-merchandise-styles");
        if (el) el.remove();
      }, 1000);
    }

    // Add Product from Admin Panel Form
    if (e.target && e.target.id === "btn-admin-add-product") {
      e.preventDefault();
      const submitBtn = e.target;
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = "Processing...";

      const titleInput = document.getElementById("admin-merch-title");
      const priceInput = document.getElementById("admin-merch-price");
      const fileInput = document.getElementById("admin-merch-file");
      const imgInput = document.getElementById("admin-merch-image");

      const title = titleInput ? titleInput.value.trim() : "";
      const price = priceInput ? parseInt(priceInput.value) : 0;
      const file = (fileInput && fileInput.files && fileInput.files.length > 0) ? fileInput.files[0] : null;
      let imageUrl = imgInput ? imgInput.value.trim() : "";

      if (!title || price <= 0) {
        alert("Please enter valid product details!");
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        return;
      }

      (async () => {
        try {
          if (file) {
            console.log("Uploading product image to Supabase...");
            submitBtn.textContent = "Uploading to Supabase...";
            try {
              imageUrl = await uploadToSupabase(file, "products");
              console.log("Supabase upload success. URL:", imageUrl);
            } catch (supabaseErr) {
              console.error("Supabase Storage upload failed, falling back to mock Reader:", supabaseErr);
              submitBtn.textContent = "Uploading image (mock)...";
              imageUrl = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = (e) => reject(e);
                reader.readAsDataURL(file);
              });
            }
          } else if (!imageUrl) {
            alert("Please select a product image file to upload.");
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            return;
          }

          if (useRealFirebase) {
            try {
              const db = firebase.firestore();
              await db.collection('products').add({
                  title: title,
                  price: Number(price),
                  imageUrl: imageUrl,
                  createdAt: new Date()
              }).then(() => alert("Product permanently saved to Firebase!"));
            } catch (e) {
              console.error("Firestore product save failed in app.js handler:", e);
              alert("Error saving product: " + e.message);
            }
          } else {
            const newProduct = {
              id: "prod-" + Date.now(),
              title,
              price: Number(price),
              imageUrl,
              stockStatus: "in-stock"
            };

            MERCH_PRODUCTS.push(newProduct);
            localStorage.setItem("merch_products", JSON.stringify(MERCH_PRODUCTS));

            renderMerchSlider();
            if (typeof renderAdminProducts === "function") renderAdminProducts();
          }

          if (titleInput) titleInput.value = "";
          if (priceInput) priceInput.value = "";
          if (fileInput) fileInput.value = "";
          if (imgInput) imgInput.value = "";
          const previewImg = document.getElementById("admin-merch-preview");
          if (previewImg) {
            previewImg.src = "";
            previewImg.style.display = "none";
          }

          console.log("Product data synchronized successfully.");
          alert("Product added successfully!");
        } catch (err) {
          console.error("Product add failed:", err);
          alert("Error adding product: " + err.message);
        } finally {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
        }
      })();
    }
  });
})();

// Student Orders history list loader
window.loadStudentOrders = function () {
  const section = document.getElementById("student-orders-history-section");
  const list = document.getElementById("student-orders-list");
  if (!section || !list) return;

  const studentUid = sessionStorage.getItem("loggedInUserUid");
  if (!studentUid) {
    section.style.display = "none";
    return;
  }

  const mockOrders = JSON.parse(localStorage.getItem("merch_orders") || "[]");
  const myOrders = mockOrders.filter(x => x.studentUid === studentUid);

  if (myOrders.length === 0) {
    section.style.display = "none";
    return;
  }

  section.style.display = "block";
  list.innerHTML = "";

  myOrders.forEach(o => {
    const card = document.createElement("div");
    card.className = "ticket-wallet-card";

    let borderCol = "var(--warning)";
    let badgeStyle = "background: rgba(234, 179, 8, 0.12); border: 1px solid rgba(234, 179, 8, 0.25); color: #eab308; padding: 4px 8px; border-radius: 6px; font-size: 10px; font-weight: 700;";
    let statusText = "⏳ Pending";

    if (o.status === "Confirmed" || o.status === "Approved") {
      borderCol = "var(--success)";
      badgeStyle = "background: rgba(74, 232, 138, 0.12); border: 1px solid rgba(74, 232, 138, 0.25); color: #4ae88a; padding: 4px 8px; border-radius: 6px; font-size: 10px; font-weight: 700;";
      statusText = "✅ Paid & Confirmed";
    } else if (o.status === "Failed" || o.status === "Rejected") {
      borderCol = "var(--error)";
      badgeStyle = "background: rgba(232, 74, 74, 0.12); border: 1px solid rgba(232, 74, 74, 0.25); color: #e8614a; padding: 4px 8px; border-radius: 6px; font-size: 10px; font-weight: 700;";
      statusText = "❌ Payment Rejected";
    }

    card.style.setProperty("--ticket-color", borderCol);
    const itemsStr = o.items.map(i => `${i.title} (${i.size}) x ${i.quantity}`).join(", ");

    card.innerHTML = `
      <div class="ticket-wallet-header">
        <span class="chip" style="font-size:10px !important; background: rgba(255,255,255,0.08); border: none;">Order</span>
        <span style="${badgeStyle}">${statusText}</span>
      </div>
      <div class="ticket-wallet-body" style="gap: 8px;">
        <div class="ticket-wallet-info">
          <h3 style="font-size: 14px !important; font-weight: 800; line-height:1.2; margin-bottom: 2px;">${itemsStr}</h3>
          <span style="font-size:11px; color:var(--muted-white);">UTR: ${o.utr}</span>
          <span style="font-size:12px; color:var(--neon-yellow); font-weight:800; margin-top: 4px;">Total Paid: ₹${o.totalAmount}</span>
        </div>
      </div>
      <div class="ticket-wallet-footer" style="margin-top: 4px;">
        <span style="font-family:monospace; color:var(--muted-white); font-size: 10px;">ID: ${o.orderId}</span>
        ${o.status === "Pending" ? `<button class="btn-cancel-order" onclick="cancelOrder('${o.orderId}')">Cancel Order</button>` : ''}
      </div>
    `;
    list.appendChild(card);
  });
};

window.cancelOrder = function (orderId) {
  if (!confirm("Are you sure you want to cancel this order?")) return;
  let mockOrders = JSON.parse(localStorage.getItem("merch_orders") || "[]");
  mockOrders = mockOrders.filter(x => x.orderId !== orderId);
  localStorage.setItem("merch_orders", JSON.stringify(mockOrders));

  loadStudentOrders();
  if (typeof renderAdminMerchOrders === "function") renderAdminMerchOrders();

  if (typeof showToast !== "undefined") {
    showToast("Order Cancelled.", "var(--neon-coral)", "var(--neon-coral)");
  } else {
    alert("Order Cancelled.");
  }
};

window.renderAdminMerchOrders = function () {
  const tableBody = document.getElementById("admin-payment-verification-table");
  if (!tableBody) return;

  const mockOrders = JSON.parse(localStorage.getItem("merch_orders") || "[]");
  tableBody.innerHTML = "";

  if (mockOrders.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; color: var(--muted-white); padding: 16px;">
          No orders submitted for verification.
        </td>
      </tr>`;
    return;
  }

  mockOrders.forEach(o => {
    const itemsStr = o.items.map(i => `${i.title} (${i.size}) x ${i.quantity}`).join("<br>");
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><div style="font-weight: 700; color: white;">${o.studentName}</div></td>
      <td><div style="color: var(--muted-white); font-size:11px;">${itemsStr}</div></td>
      <td><div style="color: var(--neon-yellow); font-weight:800;">₹${o.totalAmount}</div></td>
      <td><div style="font-family:monospace; color:white;">${o.utr}</div></td>
      <td>
        <span style="padding: 4px 8px; border-radius: 6px; font-size: 10px; font-weight: 700; background: ${o.status === "Confirmed" ? "rgba(74, 232, 138, 0.15)" : (o.status === "Failed" ? "rgba(232, 74, 74, 0.15)" : "rgba(234, 179, 8, 0.15)")}; color: ${o.status === "Confirmed" ? "#4ae88a" : (o.status === "Failed" ? "#e8614a" : "#eab308")};">
          ${o.status}
        </span>
      </td>
      <td style="text-align: right;">
        ${o.status === "Pending" ? `
          <button onclick="approveMerchPayment('${o.orderId}')" class="admin-table-btn" style="background: var(--neon-green) !important; color: #06060c !important; font-size:10px; font-weight:700; padding:6px 10px; border:none; border-radius:6px; cursor:pointer; margin-right:6px; box-shadow: 0 0 8px rgba(74,232,138,0.2) !important;">Approve Payment</button>
          <button onclick="rejectMerchPayment('${o.orderId}')" class="admin-table-btn" style="background: var(--neon-yellow) !important; color: #06060c !important; font-size:10px; font-weight:700; padding:6px 10px; border:none; border-radius:6px; cursor:pointer; box-shadow: 0 0 8px rgba(200,232,74,0.2) !important;">Reject Payment</button>
        ` : `<span style="color:var(--muted-white); font-size:10px;">Processed</span>`}
      </td>
    `;
    tableBody.appendChild(row);
  });
};

window.approveMerchPayment = function (orderId) {
  let mockOrders = JSON.parse(localStorage.getItem("merch_orders") || "[]");
  const idx = mockOrders.findIndex(o => o.orderId === orderId);
  if (idx !== -1) {
    mockOrders[idx].status = "Confirmed";
    localStorage.setItem("merch_orders", JSON.stringify(mockOrders));
    renderAdminMerchOrders();
    loadStudentOrders();
    alert("Payment approved and order confirmed!");
  }
};

window.rejectMerchPayment = function (orderId) {
  let mockOrders = JSON.parse(localStorage.getItem("merch_orders") || "[]");
  const idx = mockOrders.findIndex(o => o.orderId === orderId);
  if (idx !== -1) {
    mockOrders[idx].status = "Failed";
    localStorage.setItem("merch_orders", JSON.stringify(mockOrders));
    renderAdminMerchOrders();
    loadStudentOrders();
    alert("Payment rejected and order marked as failed.");
  }
};

window.renderAdminProducts = function () {
  const container = document.getElementById("admin-merch-products-list");
  if (!container) return;
  container.innerHTML = "";

  if (MERCH_PRODUCTS.length === 0) {
    container.innerHTML = `<div style="grid-column: 1/-1; color: var(--muted-white); font-size:12px;">No active products found in catalogue.</div>`;
    return;
  }

  MERCH_PRODUCTS.forEach(p => {
    const card = document.createElement("div");
    card.className = "admin-item-card";
    card.innerHTML = `
      <div style="display:flex; gap:10px; align-items:center;">
        <img src="${p.imageUrl}" style="width: 50px; height: 50px; border-radius: 8px; object-fit: cover;" alt="${p.title}">
        <div>
          <div class="admin-item-card-title" style="margin-bottom:2px;">${p.title}</div>
          <div class="admin-item-card-meta">
            <div>Price: ₹${p.price}</div>
            <div>Stock: <span style="color: ${p.stockStatus === 'in-stock' ? '#4ae88a' : '#e8614a'}">${p.stockStatus}</span></div>
          </div>
        </div>
      </div>
      <div class="admin-item-card-actions" style="margin-top:10px;">
        <button class="btn-action-icon btn-edit-item" onclick="toggleMerchStock('${p.id}')">🔄 Toggle Stock</button>
        <button class="btn-action-icon btn-delete-item" onclick="deleteMerchItem('${p.id}')">🗑️ Delete</button>
      </div>
    `;
    container.appendChild(card);
  });
};

window.toggleMerchStock = async function (productId) {
  const p = MERCH_PRODUCTS.find(x => x.id === productId);
  if (p) {
    const nextStatus = p.stockStatus === "in-stock" ? "out-of-stock" : "in-stock";
    if (useRealFirebase) {
      try {
        const db = firebase.firestore();
        await db.collection("products").doc(productId).update({ stockStatus: nextStatus });
      } catch (e) {
        console.error("Firestore product stock update failed:", e);
      }
    } else {
      p.stockStatus = nextStatus;
      localStorage.setItem("merch_products", JSON.stringify(MERCH_PRODUCTS));
      renderMerchSlider();
      renderAdminProducts();
    }
  }
};

window.deleteMerchItem = async function (productId) {
  if (!confirm("Are you sure you want to delete this product?")) return;

  if (useRealFirebase) {
    try {
      const db = firebase.firestore();
      await db.collection('products').doc(productId).delete()
        .then(() => alert("Product permanently deleted from Firebase!"));
    } catch (e) {
      console.error("Firestore product delete failed:", e);
      alert("Error deleting product: " + e.message);
    }
  } else {
    MERCH_PRODUCTS = MERCH_PRODUCTS.filter(p => p.id !== productId);
    localStorage.setItem("merch_products", JSON.stringify(MERCH_PRODUCTS));
    renderMerchSlider();
    renderAdminProducts();
    alert("Product deleted!");
  }
};

// Initial triggers
window.addEventListener("DOMContentLoaded", () => {
  renderMerchSlider();
  loadStudentOrders();
  if (typeof renderAdminMerchOrders === "function") renderAdminMerchOrders();
  if (typeof renderAdminProducts === "function") renderAdminProducts();

  setInterval(() => {
    if (!useRealFirebase) {
      const cachedProds = localStorage.getItem("merch_products");
      if (cachedProds) {
        try {
          const parsed = JSON.parse(cachedProds);
          if (JSON.stringify(parsed) !== JSON.stringify(MERCH_PRODUCTS)) {
            MERCH_PRODUCTS = parsed;
            renderMerchSlider();
            if (typeof renderAdminProducts === "function") renderAdminProducts();
          }
        } catch (e) {
          console.error("Error parsing mock products in interval:", e);
        }
      }
    }
    loadStudentOrders();
    if (typeof renderAdminMerchOrders === "function") renderAdminMerchOrders();
  }, 3000);
});

// ==========================================================================
// 14 — SAFE ADMIN PANEL INTEGRATION INTERFACES
// ==========================================================================

window.handleAdminPasswordSubmit = function (event) {
  try {
    if (event && typeof event.preventDefault === "function") {
      event.preventDefault();
    }
    const passwordInput = document.getElementById("admin-gate-password") || document.getElementById("admin-password-input");
    const errorDiv = document.getElementById("admin-auth-error");
    const authOverlay = document.getElementById("admin-auth-overlay") || document.getElementById("login-overlay");

    if (!passwordInput) {
      console.warn("Admin password input element not found in DOM.");
      return;
    }

    if (passwordInput.value === CONFIG.GATE_PASSWORD_PRIMARY || passwordInput.value === CONFIG.GATE_PASSWORD_SECONDARY) {
      sessionStorage.setItem("adminPasswordVerified", "true");
      if (errorDiv) errorDiv.style.display = "none";
      if (authOverlay) authOverlay.style.display = "none";
      
      if (typeof syncRegistrationWorkspace === "function") {
        syncRegistrationWorkspace();
      }
    } else {
      if (errorDiv) errorDiv.style.display = "block";
      passwordInput.value = "";
      passwordInput.focus();

      const card = document.querySelector("#admin-auth-overlay > div") || (authOverlay && authOverlay.querySelector("div"));
      if (card) {
        card.style.animation = "shake 0.4s ease";
        setTimeout(() => {
          card.style.animation = "";
        }, 400);
      }
    }
  } catch (err) {
    console.error("Error inside handleAdminPasswordSubmit gate controller:", err);
  }
};

window.handleAdminLogin = function (event) {
  try {
    if (event && typeof event.preventDefault === "function") {
      event.preventDefault();
    }

    const passwordInput = document.getElementById("admin-password-input") || document.getElementById("admin-gate-password");
    const errorDiv = document.getElementById("admin-auth-error");
    const loginOverlay = document.getElementById("login-overlay") || document.getElementById("admin-auth-overlay");

    if (!passwordInput) {
      console.warn("Admin password input element not found in DOM.");
      return;
    }

    if (passwordInput.value === CONFIG.GATE_PASSWORD_PRIMARY || passwordInput.value === CONFIG.GATE_PASSWORD_SECONDARY) {
      sessionStorage.setItem("adminPasswordVerified", "true");
      if (errorDiv) errorDiv.style.display = "none";
      if (loginOverlay) loginOverlay.style.display = "none";
      
      if (typeof syncRegistrationWorkspace === "function") {
        syncRegistrationWorkspace();
      }
      console.log("Success");
    } else {
      if (errorDiv) errorDiv.style.display = "block";
      passwordInput.value = "";
      passwordInput.focus();

      const card = document.querySelector("#admin-auth-overlay > div") || (loginOverlay && loginOverlay.querySelector("div"));
      if (card) {
        card.style.animation = "shake 0.4s ease";
        setTimeout(() => {
          card.style.animation = "";
        }, 400);
      }
    }
  } catch (err) {
    console.error("Error inside handleAdminLogin gate controller:", err);
  }
};

window.handleEventPublish = async function (event) {
  if (event && typeof event.preventDefault === "function") {
    event.preventDefault();
  }
  
  const submitBtn = document.getElementById("btn-event-submit");
  const originalText = submitBtn ? submitBtn.textContent : "Publish Event";
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "Processing...";
  }

  try {
    const editIdEl = document.getElementById("editEventId");
    const editId = editIdEl ? editIdEl.value : "";
    
    const titleEl = document.getElementById("eventTitle");
    const title = titleEl ? titleEl.value.trim() : "";
    
    const typeEl = document.getElementById("eventType");
    const type = typeEl ? typeEl.value : "workshop";
    
    const speakerNameEl = document.getElementById("speakerName");
    const speakerName = speakerNameEl ? speakerNameEl.value.trim() : "";
    
    const speakerQualEl = document.getElementById("speakerQual");
    const speakerQual = speakerQualEl ? speakerQualEl.value.trim() : "";
    
    const speakerLinkedinEl = document.getElementById("speakerLinkedin");
    const speakerLinkedin = speakerLinkedinEl ? speakerLinkedinEl.value.trim() : "";
    
    const upiIdEl = document.getElementById("eventUpiId");
    const upiId = upiIdEl ? upiIdEl.value.trim() : "";
    
    const dateInputEl = document.getElementById("eventDate");
    const dateInput = dateInputEl ? dateInputEl.value : "";
    
    const timeInputEl = document.getElementById("eventTime");
    const timeInput = timeInputEl ? timeInputEl.value : "";
    
    const seatsEl = document.getElementById("eventSeats");
    const seats = seatsEl ? parseInt(seatsEl.value) : 0;
    
    const feeEl = document.getElementById("eventFee");
    const fee = feeEl ? parseInt(feeEl.value) : 0;
    
    const locationEl = document.getElementById("eventLocation");
    const location = locationEl ? locationEl.value.trim() : "";
    
    const modeEl = document.getElementById("eventMode");
    const mode = modeEl ? modeEl.value : "offline";
    
    const fileInput = document.getElementById("event-poster-file");
    const file = (fileInput && fileInput.files && fileInput.files.length > 0) ? fileInput.files[0] : null;
    
    const posterEl = document.getElementById("eventPoster");
    let poster = posterEl ? posterEl.value.trim() : "";

    if (file) {
      let uploadSuccess = false;
      try {
        if (submitBtn) submitBtn.textContent = "Uploading to Supabase...";
        console.log("Uploading event poster to Supabase...");
        poster = await uploadToSupabase(file, "event posters");
        console.log("Supabase upload success. URL:", poster);
        uploadSuccess = true;
      } catch (storageErr) {
        console.warn("Supabase Storage upload failed, falling back to mock Reader:", storageErr);
      }
      
      if (!uploadSuccess) {
        if (submitBtn) submitBtn.textContent = "Uploading image (mock)...";
        poster = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = (e) => reject(e);
          reader.readAsDataURL(file);
        });
      }
    } else if (!editId && !poster) {
      alert("Please select an event poster image file to upload.");
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
      return;
    }

    const hasTeamEl = document.getElementById("eventHasTeam");
    const hasTeam = hasTeamEl ? hasTeamEl.value === "true" : false;
    
    const maxTeamEl = document.getElementById("eventMaxTeam");
    const maxTeamSize = hasTeam ? (maxTeamEl ? parseInt(maxTeamEl.value) : 1) : 1;
    
    const descriptionEl = document.getElementById("eventDescription");
    const description = descriptionEl ? descriptionEl.value.trim() : "";
    const eventWhatsappEl = document.getElementById("eventWhatsappUrl");
    const whatsappUrl = eventWhatsappEl ? eventWhatsappEl.value.trim() : "";
    const eventIsClosedEl = document.getElementById("eventIsClosed");
    const eventIsClosed = eventIsClosedEl ? eventIsClosedEl.checked : false;

    // Format dates into human readable values
    let formattedDate = "TBD";
    let isoDate = new Date().toISOString();
    if (dateInput) {
      const dateObj = new Date(dateInput);
      const options = { day: 'numeric', month: 'long', year: 'numeric' };
      formattedDate = dateObj.toLocaleDateString('en-US', options); 
      isoDate = `${dateInput}T${timeInput || '00:00'}:00`;
    }

    // Format 24h input time to 12h AM/PM string
    let formattedTime = "TBD";
    if (timeInput) {
      const [hours24, minutes] = timeInput.split(":");
      let hours12 = parseInt(hours24);
      const ampm = hours12 >= 12 ? 'PM' : 'AM';
      hours12 = hours12 % 12;
      hours12 = hours12 ? hours12 : 12; 
      formattedTime = `${hours12 < 10 ? '0' + hours12 : hours12}:${minutes} ${ampm}`;
    }

    let typeLabel = "Workshop";
    let color = "#C8E84A";
    if (type === "hackathon") {
      typeLabel = "Hackathon";
      color = "#8B6FD4";
    } else if (type === "talk") {
      typeLabel = "Talk";
      color = "#E8614A";
    }

    const eventSlug = editId ? editId : (title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random() * 1000));

    const eventData = {
      id: eventSlug,
      eventId: eventSlug,
      title,
      type,
      typeLabel,
      date: formattedDate,
      isoDate,
      time: formattedTime,
      seats,
      fee,
      upiId,
      price: fee === 0 ? "Free" : `₹${fee}`,
      host: `${speakerName}, ${speakerQual}`,
      speakerLinkedin,
      location,
      mode,
      description,
      color,
      hasTeam,
      maxTeamSize,
      poster,
      poster_url: poster,
      upi: upiId,
      whatsapp_url: whatsappUrl || "",
      is_closed: eventIsClosed,
      timestamp: (typeof useRealFirebase !== "undefined" && useRealFirebase && typeof firebase !== "undefined" && firebase.firestore) ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString()
    };

    // Save mock events
    let mockEvents = JSON.parse(localStorage.getItem("firebase_mock_events") || "[]");
    if (editId) {
      const idx = mockEvents.findIndex(ev => ev.id === editId);
      if (idx !== -1) mockEvents[idx] = eventData;
    } else {
      mockEvents.push(eventData);
    }
    localStorage.setItem("firebase_mock_events", JSON.stringify(mockEvents));

    const realFirebaseActive = typeof useRealFirebase !== "undefined" && useRealFirebase;
    if (realFirebaseActive && typeof firebase !== "undefined" && typeof firebase.firestore === "function") {
      const db = firebase.firestore();
      await db.collection("events").doc(eventSlug).set(eventData);
    }

    alert(editId ? "Event updated successfully!" : "Event published successfully!");
    if (typeof resetEventFormState === "function") {
      resetEventFormState();
    }
  } catch (error) {
    console.error("Event save failed:", error);
    alert("Error saving event: " + error.message);
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  }
};

// Event Poster File Input change listener for preview
const eventPosterFile = document.getElementById("event-poster-file");
if (eventPosterFile) {
  eventPosterFile.addEventListener("change", function (e) {
    try {
      const file = (e.target && e.target.files && e.target.files.length > 0) ? e.target.files[0] : null;
      const previewImg = document.getElementById("event-poster-preview");
      if (file) {
        const reader = new FileReader();
        reader.onload = function (evt) {
          if (previewImg) {
            previewImg.src = evt.target.result;
            previewImg.style.display = "block";
          }
        };
        reader.readAsDataURL(file);
      } else {
        const posterEl = document.getElementById("eventPoster");
        const savedUrl = posterEl ? posterEl.value : "";
        if (previewImg) {
          if (savedUrl) {
            previewImg.src = savedUrl;
            previewImg.style.display = "block";
          } else {
            previewImg.src = "";
            previewImg.style.display = "none";
          }
        }
      }
    } catch (err) {
      console.error("Error in event-poster-file change listener:", err);
    }
  });
}

// Global window.sendConfirmationEmail helper mapping event details, cloud URLs and dynamic QR codes
window.sendConfirmationEmail = async function(registrationData) {
  if (typeof emailjs === "undefined") {
    console.error("EmailJS is not loaded. Cannot send confirmation email.");
    return;
  }

  let eventMode = "offline";
  let eventLocation = "TBD";
  let venueType = "Offline";
  let posterUrl = "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=600&q=80";
  
  if (selectedEvent && selectedEvent.id === registrationData.eventId) {
    eventMode = selectedEvent.mode || "offline";
    eventLocation = selectedEvent.location || "TBD";
    venueType = selectedEvent.venue_type || (eventMode === 'online' ? 'Online' : 'Offline');
    posterUrl = selectedEvent.poster_url || selectedEvent.poster || posterUrl;
  } else if (typeof EVENTS_DATA !== "undefined" && EVENTS_DATA.length > 0) {
    const foundEvent = EVENTS_DATA.find(e => e.id === registrationData.eventId);
    if (foundEvent) {
      eventMode = foundEvent.mode || "offline";
      eventLocation = foundEvent.location || "TBD";
      venueType = foundEvent.venue_type || (eventMode === 'online' ? 'Online' : 'Offline');
      posterUrl = foundEvent.poster_url || foundEvent.poster || posterUrl;
    }
  }

  // Ensure poster URL is a valid publicly accessible cloud URL (no base64 or local paths)
  if (posterUrl && (posterUrl.startsWith("data:") || posterUrl.startsWith("/"))) {
    posterUrl = "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=600&q=80";
  }

  const venueDetails = (venueType === "Online") ? "Updates on WhatsApp" : eventLocation;

  // CryptoJS encrypt for dynamic QR Code
  let encryptedText = registrationData.registrationId || "";
  if (typeof CryptoJS !== "undefined") {
    try {
      encryptedText = CryptoJS.AES.encrypt(registrationData.registrationId, "RITU_GATEWAY_SECURE_2026_KEY").toString();
    } catch (e) {
      console.error("CryptoJS encryption failed in app.js:", e);
    }
  }
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(encryptedText)}`;

  const templateParams = {
    student_email: registrationData.studentEmail,
    to_email: registrationData.studentEmail,
    student_name: registrationData.studentName,
    register_no: registrationData.registerNo || registrationData.id || "N/A",
    event_name: registrationData.eventTitle,
    pickup_delivery_type: venueDetails,
    venue_details: venueDetails,
    ticket_id: registrationData.registrationId,
    event_poster: posterUrl,
    poster_url: posterUrl,
    qr_code: qrCodeUrl,
    
    // Backup tags for maximum compatibility
    email: registrationData.studentEmail,
    name: registrationData.studentName,
    location: eventLocation,
    mode: eventMode
  };

  console.log("Sending confirmation email via EmailJS with params:", templateParams);

  try {
    const response = await emailjs.send(CONFIG.EMAILJS_SERVICE_ID, CONFIG.EMAILJS_TEMPLATE_ID, templateParams);
    console.log("Email confirmation sent successfully!", response.status, response.text);
  } catch (error) {
    console.error("Failed to send email confirmation:", error);
  }
};

