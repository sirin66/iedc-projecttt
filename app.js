// ==========================================
// 01 — Firebase Init & Shared Configurations
// ==========================================

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
try {
  if (firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith("YOUR_")) {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    useRealFirebase = true;
    console.log("Firebase compatibility layer initialized successfully.");
  }
} catch (e) {
  console.error("Firebase init failed, running in simulator mode:", e);
}

const db = useRealFirebase ? firebase.firestore() : null;
const QR_SECRET_KEY = "RITU_GATEWAY_SECURE_2026_KEY";

// Shared App State
let EVENTS_DATA = [];
let USER_REGISTRATIONS = [];
let USER_PROFILE = {
  name: "",
  email: "",
  id: "",
  collegeName: "",
  avatar: "",
  phone: "",
  department: "",
  yearOfStudy: "",
  approved: false
};

let selectedEvent = null;
let currentFilter = "all";
let searchQuery = "";
let countdownInterval = null;
let detailCountdownInterval = null;
let teamMemberCount = 0;
let currentVerificationUnsubscribe = null;
let simulatorPollingInterval = null;
let isUserLoggedIn = false;

// Input Sanitization (XSS Defense)
function sanitizeInput(str) {
  if (!str) return "";
  return String(str)
    .replace(/[&<>"']/g, function(m) {
      switch (m) {
        case '&': return '&amp;';
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '"': return '&quot;';
        case "'": return '&#039;';
        default: return m;
      }
    })
    .trim();
}

// Global Toast Module
function showToast(message, borderColor = "#8b6fd4") {
  const toast = document.getElementById("app-toast");
  if (!toast) return;
  const textSpan = document.getElementById("toast-text");
  if (textSpan) textSpan.textContent = message;
  toast.style.borderColor = borderColor;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

// Global Alert overlays
function showCustomAlert(title, message) {
  const overlay = document.getElementById("custom-alert-overlay");
  if (!overlay) return;
  document.getElementById("custom-alert-title").textContent = title;
  document.getElementById("custom-alert-message").textContent = message;
  overlay.style.display = "flex";
}
window.closeCustomAlert = function() {
  const overlay = document.getElementById("custom-alert-overlay");
  if (overlay) overlay.style.display = "none";
};

// ==========================================
// 02 — Router & Page Mode Initializations
// ==========================================

document.addEventListener("DOMContentLoaded", async () => {
  const pathname = window.location.pathname;
  
  if (pathname.includes("admin.html")) {
    await initAdminMode();
  } else if (pathname.includes("dashboard.html")) {
    await initDashboardMode();
  } else {
    initLoginGatewayMode();
  }
});

// ==========================================
// 03 — Login & Registration Gateway Mode
// ==========================================

function initLoginGatewayMode() {
  console.log("Login Gateway Mode Activated.");
  isUserLoggedIn = false;
  sessionStorage.removeItem("loggedInUserUid");
  
  // Auth state change detector
  if (useRealFirebase) {
    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        sessionStorage.setItem("loggedInUserUid", user.uid);
        window.location.href = "dashboard.html";
      }
    });
  }
}

// Login Submit Form Handler
window.handleLoginSubmit = async function(event) {
  event.preventDefault();
  const emailInput = document.getElementById("student-email");
  const passwordInput = document.getElementById("student-password");
  const submitBtn = document.getElementById("login-btn");
  
  const email = emailInput.value.trim().toLowerCase();
  const password = passwordInput.value;
  
  submitBtn.disabled = true;
  submitBtn.textContent = "VERIFYING...";
  
  try {
    let uid = "";
    if (useRealFirebase) {
      const credentials = await firebase.auth().signInWithEmailAndPassword(email, password);
      uid = credentials.user.uid;
    } else {
      // Mock Login checks
      await new Promise(resolve => setTimeout(resolve, 400));
      const mockUsers = JSON.parse(localStorage.getItem("firebase_mock_users") || "{}");
      const user = mockUsers[email];
      if (!user || user.password !== password) {
        throw { code: "auth/invalid-credential" };
      }
      uid = user.uid;
    }
    
    sessionStorage.setItem("loggedInUserUid", uid);
    window.location.href = "dashboard.html";
  } catch (err) {
    console.error("Auth rejection:", err);
    let friendlyMsg = "Authentication failed. Please check your credentials.";
    if (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") {
      friendlyMsg = "Account not found or invalid password combination.";
    } else if (err.code === "auth/wrong-password") {
      friendlyMsg = "Incorrect password. Please try again.";
    } else if (err.code === "auth/invalid-email") {
      friendlyMsg = "Please enter a valid academic email address.";
    }
    alert("Login Error: " + friendlyMsg);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "LOGIN & ENTER";
  }
};

// Registration Form Handler
window.handleRegisterSubmit = async function(event) {
  event.preventDefault();
  const name = document.getElementById("setup-name").value.trim();
  const email = document.getElementById("setup-email").value.trim().toLowerCase();
  const password = document.getElementById("setup-password").value;
  const confirmPassword = document.getElementById("setup-confirm-password").value;
  const id = document.getElementById("setup-id").value.trim();
  const department = document.getElementById("setup-department").value.trim();
  const yearOfStudy = document.getElementById("setup-year").value;
  const phone = document.getElementById("setup-phone").value.trim();
  const college = document.getElementById("setup-college").value.trim();
  
  if (password !== confirmPassword) {
    alert("Validation Error: Passwords do not match.");
    return;
  }
  
  let avatar = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80";
  const avatarOptions = document.getElementsByName("setup-avatar");
  avatarOptions.forEach(opt => {
    if (opt.checked) avatar = opt.value;
  });

  const profileData = {
    name,
    email,
    registerNo: id,
    id,
    department,
    year: yearOfStudy,
    yearOfStudy,
    phone,
    collegeName: college,
    avatar,
    approved: false,
    role: "student",
    createdAt: new Date().toISOString()
  };

  const registerBtn = document.getElementById("btn-setup-submit");
  registerBtn.disabled = true;
  registerBtn.textContent = "REGISTERING...";

  try {
    let uid = "";
    if (useRealFirebase) {
      const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
      uid = userCredential.user.uid;
      await db.collection("students").doc(uid).set({ uid, ...profileData });
    } else {
      await new Promise(resolve => setTimeout(resolve, 500));
      let users = JSON.parse(localStorage.getItem("firebase_mock_users") || "{}");
      if (users[email]) throw { code: "auth/email-already-in-use" };
      uid = "uid_" + Math.random().toString(36).substr(2, 9);
      users[email] = { uid, email, password, profileData: { uid, ...profileData } };
      localStorage.setItem("firebase_mock_users", JSON.stringify(users));
    }
    
    sessionStorage.setItem("loggedInUserUid", uid);
    alert("Registration Successful! Your profile is pending administrator approval.");
    window.location.href = "dashboard.html";
  } catch (err) {
    console.error("Register failed:", err);
    let msg = "Could not complete registration.";
    if (err.code === "auth/email-already-in-use") {
      msg = "This email is already linked to another student account.";
    }
    alert("Registration Error: " + msg);
  } finally {
    registerBtn.disabled = false;
    registerBtn.textContent = "Register & Enter";
  }
};

// Forgot Password Handler
window.handleForgotPasswordSubmit = async function(event) {
  event.preventDefault();
  const email = document.getElementById("forgot-email").value.trim().toLowerCase();
  try {
    if (useRealFirebase) {
      await firebase.auth().sendPasswordResetEmail(email);
    } else {
      await new Promise(resolve => setTimeout(resolve, 300));
      const mockUsers = JSON.parse(localStorage.getItem("firebase_mock_users") || "{}");
      if (!mockUsers[email]) throw { code: "auth/user-not-found" };
    }
    alert("A password reset email has been sent. Please check your inbox!");
    hideForgotPasswordForm();
  } catch (e) {
    alert("Error: Student record matching email address not found.");
  }
};

// Google Auth Sign-in
window.handleGoogleSignIn = async function() {
  try {
    let uid = "";
    let email = "";
    let name = "";
    if (useRealFirebase) {
      const provider = new firebase.auth.GoogleAuthProvider();
      const res = await firebase.auth().signInWithPopup(provider);
      uid = res.user.uid;
      email = res.user.email;
      name = res.user.displayName;
    } else {
      await new Promise(resolve => setTimeout(resolve, 400));
      uid = "uid_google123";
      email = "google.student@rit.ac.in";
      name = "GOOGLE TEST USER";
    }

    // Check if doc exists
    let exists = false;
    let data = {};
    if (useRealFirebase) {
      const doc = await db.collection("students").doc(uid).get();
      exists = doc.exists;
      if (exists) data = doc.data();
    } else {
      const users = JSON.parse(localStorage.getItem("firebase_mock_users") || "{}");
      if (users[email]) {
        exists = true;
        data = users[email].profileData;
      }
    }

    sessionStorage.setItem("loggedInUserUid", uid);

    if (exists) {
      window.location.href = "dashboard.html";
    } else {
      // Direct them to setup profile
      document.getElementById("auth-tabs-container").style.display = "none";
      document.getElementById("auth-login-form").style.display = "none";
      document.getElementById("profile-setup-form").style.display = "block";
      document.getElementById("setup-name").value = name.toUpperCase();
      document.getElementById("setup-email").value = email.toLowerCase();
      document.getElementById("setup-password").value = "GOOGLE_AUTH_LOGIN";
      document.getElementById("setup-confirm-password").value = "GOOGLE_AUTH_LOGIN";
      document.getElementById("setup-title").textContent = "Google Profile Setup";
      alert("Please fill in the remaining details to complete registration.");
    }
  } catch (e) {
    console.error("Google Auth failed:", e);
    alert("Google Sign in failed.");
  }
};

// ==========================================
// 04 — Student Portal Dashboard Mode
// ==========================================

async function initDashboardMode() {
  console.log("Student Dashboard Activated.");
  isUserLoggedIn = true;
  const uid = sessionStorage.getItem("loggedInUserUid");
  
  // Bind category chips click handlers
  document.querySelectorAll(".chip-category").forEach(pill => {
    pill.addEventListener("click", () => {
      document.querySelectorAll(".chip-category").forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      currentFilter = pill.getAttribute("data-category");
      renderHomeEvents();
    });
  });

  // Search filter
  document.getElementById("search-input").addEventListener("input", (e) => {
    searchQuery = e.target.value;
    renderHomeEvents();
  });

  // Load and sync dashboard records
  try {
    await fetchProfile(uid);
    
    if (USER_PROFILE.approved !== true) {
      document.getElementById("pending-student-name").textContent = USER_PROFILE.name;
      document.getElementById("screen-pending").style.display = "flex";
      document.getElementById("main-app-layout").style.display = "none";
      return;
    }

    // Set greeting details
    document.querySelectorAll(".dashboard-greeting").forEach(greet => {
      greet.textContent = `Hey ${USER_PROFILE.name.split(" ")[0]} 👋`;
    });
    
    // Draw current date
    const opt = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
    document.querySelectorAll(".dashboard-current-date").forEach(el => {
      el.textContent = new Date().toLocaleDateString('en-US', opt);
    });

    // Sync collections
    await syncEvents();
    await syncRegistrations();
    
    // Initial Render
    renderHomeEvents();
    renderDashboard();
    
    // Start active announcements ticker sync
    syncAnnouncements();
    syncTicker();
    
  } catch (e) {
    console.error("Dashboard init error:", e);
  }
}

// Fetch Student Profile Document
async function fetchProfile(uid) {
  if (useRealFirebase) {
    const doc = await db.collection("students").doc(uid).get();
    if (doc.exists) {
      USER_PROFILE = { uid, ...doc.data() };
    }
  } else {
    // Simulator Mode Profile fetch
    const mockUsers = JSON.parse(localStorage.getItem("firebase_mock_users") || "{}");
    for (const email in mockUsers) {
      if (mockUsers[email].uid === uid) {
        USER_PROFILE = mockUsers[email].profileData;
        break;
      }
    }
  }
}

// Sign-out
window.handleSignOut = function() {
  sessionStorage.removeItem("loggedInUserUid");
  if (useRealFirebase) {
    firebase.auth().signOut().then(() => {
      window.location.href = "index.html";
    }).catch(() => {
      window.location.href = "index.html";
    });
  } else {
    window.location.href = "index.html";
  }
};

// Database Event Synchronizer
async function syncEvents() {
  let merged = [];
  if (useRealFirebase) {
    try {
      const evSnap = await db.collection("events").get();
      evSnap.forEach(d => merged.push({ id: d.id, ...d.data() }));
      const tourSnap = await db.collection("tournaments").get();
      tourSnap.forEach(d => merged.push({ id: d.id, ...d.data() }));
    } catch (e) {
      console.error(e);
    }
  } else {
    // Simulator mock data load
    merged = [
      ...JSON.parse(localStorage.getItem("firebase_mock_events") || "[]"),
      ...JSON.parse(localStorage.getItem("firebase_mock_tournaments") || "[]")
    ];
  }
  EVENTS_DATA = merged;
}

// Database Registrations Synchronizer
async function syncRegistrations() {
  const uid = sessionStorage.getItem("loggedInUserUid");
  if (useRealFirebase) {
    return new Promise((resolve) => {
      db.collection("registrations")
        .where("studentUid", "==", uid)
        .onSnapshot((snap) => {
          let list = [];
          snap.forEach(doc => {
            const data = doc.data();
            const match = EVENTS_DATA.find(e => e.id === data.eventId);
            list.push({
              id: data.eventId,
              registrationId: doc.id,
              ticketId: doc.id,
              title: data.eventTitle || (match ? match.title : "Event"),
              type: match ? match.type : "workshop",
              typeLabel: match ? match.typeLabel : "Workshop",
              date: match ? match.date : "TBD",
              time: match ? match.time : "TBD",
              location: match ? match.location : "TBD",
              host: match ? match.host : "IEDC RIT",
              color: match ? match.color : "#8b6fd4",
              status: data.status || "Pending",
              checkedIn: data.checkedIn === true,
              studentName: data.studentName,
              registerNo: data.registerNo,
              phone: data.phone,
              bankAccountName: data.bankAccountName,
              whatsappLink: match ? match.whatsappLink : "",
              duration: match ? match.duration : "",
              instructions: match ? match.instructions : "",
              poster: match ? match.poster : ""
            });
          });
          USER_REGISTRATIONS = list;
          renderDashboard();
          resolve();
        }, () => resolve());
    });
  } else {
    // Local storage mock registry
    let list = [];
    const mockRegs = JSON.parse(localStorage.getItem("firebase_mock_registrations") || "[]");
    mockRegs.forEach(reg => {
      if (reg.studentUid === uid) {
        const match = EVENTS_DATA.find(e => e.id === reg.eventId);
        list.push({
          id: reg.eventId,
          registrationId: reg.registrationId,
          ticketId: reg.registrationId,
          title: reg.eventTitle || (match ? match.title : "Event"),
          type: match ? match.type : "workshop",
          typeLabel: match ? match.typeLabel : "Workshop",
          date: match ? match.date : "TBD",
          time: match ? match.time : "TBD",
          location: match ? match.location : "TBD",
          host: match ? match.host : "IEDC RIT",
          color: match ? match.color : "#8b6fd4",
          status: reg.status || "Pending",
          checkedIn: reg.checkedIn === true,
          studentName: reg.studentName,
          registerNo: reg.registerNo,
          phone: reg.phone,
          bankAccountName: reg.bankAccountName,
          whatsappLink: match ? match.whatsappLink : "",
          duration: match ? match.duration : "",
          instructions: match ? match.instructions : "",
          poster: match ? match.poster : ""
        });
      }
    });
    USER_REGISTRATIONS = list;
    return Promise.resolve();
  }
}

// Announcements synchronization
function syncAnnouncements() {
  const container = document.getElementById("notifications-list-container");
  if (!container) return;
  
  if (useRealFirebase) {
    db.collection("announcements").onSnapshot(snap => {
      let list = [];
      snap.forEach(d => list.push(d.data()));
      list.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
      renderAnnouncementsList(list, container);
    });
  } else {
    const list = JSON.parse(localStorage.getItem("firebase_mock_announcements") || "[]");
    list.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
    renderAnnouncementsList(list, container);
  }
}

function renderAnnouncementsList(list, container) {
  container.innerHTML = "";
  if (list.length === 0) {
    container.innerHTML = `<p style="color: rgba(255,255,255,0.6); font-size:12px;">No active announcements at the moment.</p>`;
    return;
  }
  list.forEach(item => {
    const card = document.createElement("div");
    card.className = "notification-card";
    card.style.background = "rgba(255,255,255,0.02)";
    card.style.border = "1px solid rgba(255,255,255,0.06)";
    card.style.padding = "16px";
    card.style.borderRadius = "12px";
    card.innerHTML = `
      <div style="font-weight: 800; font-size:14px; margin-bottom: 4px; color:#ffffff;">${item.title}</div>
      <p style="font-size: 12px; color:rgba(255,255,255,0.6); margin: 0; line-height: 1.4;">${item.message || item.body}</p>
      <div style="font-size: 10px; color: rgba(255,255,255,0.4); margin-top:8px;">${new Date(item.createdAt).toLocaleString()}</div>
    `;
    container.appendChild(card);
  });
}

// Global Ticker Sync
function syncTicker() {
  const tickerContainer = document.getElementById("app-ticker-tape");
  if (!tickerContainer) return;
  if (useRealFirebase) {
    db.collection("config").doc("ticker").onSnapshot(doc => {
      if (doc.exists) {
        const text = doc.data().text || "";
        tickerContainer.innerHTML = text.split("|").map(t => `<span class="ticker-item">${t.trim()}</span>`).join("");
      }
    });
  } else {
    const data = JSON.parse(localStorage.getItem("firebase_mock_config_ticker") || '{"text":""}');
    tickerContainer.innerHTML = data.text.split("|").map(t => `<span class="ticker-item">${t.trim()}</span>`).join("");
  }
}

// Render Events on Homepage grid
function renderHomeEvents() {
  const container = document.getElementById("events-list-container");
  const spotlightContainer = document.getElementById("featured-card-container");
  if (!container || !spotlightContainer) return;
  
  container.innerHTML = "";
  spotlightContainer.innerHTML = "";
  
  let list = EVENTS_DATA.filter(ev => {
    const matchesCategory = currentFilter === "all" || ev.type === currentFilter;
    const matchesSearch = ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          ev.host.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  
  if (list.length === 0) {
    container.innerHTML = `<p style="grid-column:1/-1; color: rgba(255,255,255,0.6); font-size:12px;">No events matching query found.</p>`;
    return;
  }

  // Showcase First event on Spotlight
  let featured = null;
  if (currentFilter === "all" && searchQuery === "") {
    featured = list[0];
    list = list.slice(1);
  }

  if (featured) {
    const card = document.createElement("div");
    card.className = "card-featured";
    card.style.setProperty("--event-color", featured.color || "#c8e84a");
    if (featured.poster || featured.poster_url) {
      card.style.backgroundImage = `linear-gradient(to bottom, rgba(3, 6, 17, 0.2), rgba(3, 6, 17, 0.95)), url(${featured.poster || featured.poster_url})`;
      card.style.backgroundSize = "cover";
      card.style.backgroundPosition = "center";
    }
    card.innerHTML = `
      <div class="card-featured-content">
        <span class="chip" style="background:${featured.color || '#c8e84a'}; color:#030611; font-weight:800; border:none; margin-bottom:8px;">${featured.typeLabel.toUpperCase()}</span>
        <h2 style="font-family: var(--font-display); font-size: 20px; font-weight:900; margin: 4px 0;">${featured.title}</h2>
        <div style="font-size:11px; color:rgba(255,255,255,0.6); margin-bottom: 12px;">${featured.date} • ${featured.time}</div>
        <button type="button" class="card-btn-register" id="feat-reg-btn-${featured.id}">REGISTER NOW</button>
      </div>
    `;
    card.addEventListener("click", (e) => {
      if (e.target.tagName !== "BUTTON") openEventDetail(featured);
    });
    spotlightContainer.appendChild(card);
    
    document.getElementById(`feat-reg-btn-${featured.id}`).addEventListener("click", () => openEventDetail(featured));
  }

  // Grid cards list
  list.forEach(ev => {
    const card = document.createElement("div");
    card.className = "card-event";
    card.style.setProperty("--event-color", ev.color || "#8b6fd4");
    if (ev.poster || ev.poster_url) {
      card.style.backgroundImage = `linear-gradient(to bottom, rgba(3, 6, 17, 0.6), rgba(3, 6, 17, 0.98)), url(${ev.poster || ev.poster_url})`;
      card.style.backgroundSize = "cover";
      card.style.backgroundPosition = "center";
    }
    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span class="chip">${ev.typeLabel.toUpperCase()}</span>
        <span style="color:#C8E84A; font-weight:800; font-size:11.5px;">${ev.price}</span>
      </div>
      <h3 style="font-family: var(--font-display); font-size: 15px; font-weight:800; margin: 10px 0 4px 0; line-height: 1.2;">${ev.title}</h3>
      <div style="font-size:11px; color:rgba(255,255,255,0.6); margin-bottom:12px;">📅 ${ev.date}</div>
      <button type="button" class="card-btn-register" id="grid-reg-btn-${ev.id}">REGISTER NOW</button>
    `;
    card.addEventListener("click", (e) => {
      if (e.target.tagName !== "BUTTON") openEventDetail(ev);
    });
    container.appendChild(card);
    
    document.getElementById(`grid-reg-btn-${ev.id}`).addEventListener("click", () => openEventDetail(ev));
  });
}

// Open Event Detail Overlays
window.openEventDetail = function(ev) {
  selectedEvent = ev;
  const overlay = document.getElementById("screen-detail");
  if (!overlay) return;
  
  // Setup elements
  document.getElementById("detail-title").textContent = ev.title;
  document.getElementById("detail-description").textContent = ev.description;
  document.getElementById("detail-feat-date").textContent = ev.date;
  document.getElementById("detail-feat-time").textContent = ev.time;
  document.getElementById("detail-feat-seats").textContent = `${ev.seats} Seats`;
  document.getElementById("detail-feat-price").textContent = ev.price;
  document.getElementById("detail-host").textContent = ev.host.split(",")[0];
  document.getElementById("detail-host-qual").textContent = ev.host.split(",").slice(1).join(",").trim() || "RIT Expert";
  
  const linkedin = document.getElementById("detail-host-linkedin");
  if (ev.speakerLinkedin) {
    linkedin.href = ev.speakerLinkedin;
    linkedin.style.display = "flex";
  } else {
    linkedin.style.display = "none";
  }

  // Location display logic
  const mapLink = document.getElementById("detail-location-map-link");
  const meetDiv = document.getElementById("detail-location-meeting");
  const meetLink = document.getElementById("detail-meeting-link");
  const locationText = document.getElementById("detail-location-text");
  
  const isOnline = ev.mode === "online" || ev.location.startsWith("http");
  locationText.textContent = isOnline ? "Virtual Platform / Meeting Room" : ev.location;

  if (isOnline) {
    mapLink.style.display = "none";
    meetDiv.style.display = "flex";
    meetLink.href = ev.location.startsWith("http") ? ev.location : "https://meet.google.com";
  } else {
    mapLink.style.display = "inline-block";
    mapLink.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ev.location)}`;
    meetDiv.style.display = "none";
  }

  // Bind values
  document.getElementById("detail-reg-name").value = USER_PROFILE.name;
  document.getElementById("detail-reg-ktuid").value = USER_PROFILE.id;
  document.getElementById("detail-reg-phone").value = USER_PROFILE.phone;
  document.getElementById("detail-reg-bank-name").value = "";

  // Team sections Setup
  const teamSection = document.getElementById("detail-team-section");
  const slotContainer = document.getElementById("detail-team-slots-container");
  slotContainer.innerHTML = "";
  teamMemberCount = 0;
  if (ev.hasTeam) {
    teamSection.style.display = "flex";
    addDetailTeamSlot();
  } else {
    teamSection.style.display = "none";
  }

  // Initial forms visibility toggling
  document.getElementById("registration-form").style.display = "block";
  document.getElementById("detail-upi-checkout-container").style.display = "none";
  document.getElementById("ticket-container").style.display = "none";
  
  const isRegistered = USER_REGISTRATIONS.some(r => r.id === ev.id);
  const regBtn = document.getElementById("detail-register-btn");
  
  if (isRegistered) {
    const reg = USER_REGISTRATIONS.find(r => r.id === ev.id);
    if (reg.status === "Pending") {
      regBtn.textContent = "VERIFICATION IN PROGRESS";
      regBtn.disabled = true;
    } else {
      regBtn.textContent = "VIEW ENTRY TICKET";
      regBtn.disabled = false;
      regBtn.onclick = () => showTicket(reg);
    }
  } else {
    regBtn.textContent = ev.fee > 0 ? `PROCEED TO PAY (₹${ev.fee})` : "CONFIRM ENROLLMENT";
    regBtn.disabled = false;
    regBtn.onclick = () => {
      document.getElementById("registration-form").requestSubmit();
    };
  }

  // Detail countdown timer
  if (detailCountdownInterval) clearInterval(detailCountdownInterval);
  const countdownSpan = document.getElementById("detail-countdown-timer");
  const targetDate = ev.isoDate ? new Date(ev.isoDate).getTime() : new Date().getTime();
  
  function runTimer() {
    const diff = targetDate - new Date().getTime();
    if (diff <= 0) {
      countdownSpan.textContent = "Event Live / Passed";
      clearInterval(detailCountdownInterval);
    } else {
      const d = Math.floor(diff / (1000*60*60*24));
      const h = Math.floor((diff % (1000*60*60*24)) / (1000*60*60));
      const m = Math.floor((diff % (1000*60*60)) / (1000*60));
      const s = Math.floor((diff % (1000*60)) / 1000);
      countdownSpan.textContent = `${d}d ${h}h ${m}m ${s}s remaining`;
    }
  }
  runTimer();
  detailCountdownInterval = setInterval(runTimer, 1000);

  // Show details screen modal
  navigateTo("detail");
};

// Back button on details
document.getElementById("detail-back-btn").addEventListener("click", () => {
  if (detailCountdownInterval) clearInterval(detailCountdownInterval);
  navigateTo("home");
});

function addDetailTeamSlot() {
  if (!selectedEvent || teamMemberCount >= selectedEvent.maxTeamSize - 1) return;
  teamMemberCount++;
  const container = document.getElementById("detail-team-slots-container");
  const div = document.createElement("div");
  div.id = `detail-member-${teamMemberCount}`;
  div.style.display = "flex";
  div.style.gap = "8px";
  div.style.marginBottom = "6px";
  div.innerHTML = `
    <input type="text" class="input-field detail-team-member-name" placeholder="Member #${teamMemberCount} Name" required style="flex:1;">
    <button type="button" class="btn" style="border:1px solid #ff4d4d; color:#ff4d4d; padding:6px 12px;" onclick="document.getElementById('detail-member-${teamMemberCount}').remove(); teamMemberCount--;">&times;</button>
  `;
  container.appendChild(div);
}
document.getElementById("detail-btn-add-member").addEventListener("click", addDetailTeamSlot);

// Submit form handles checkout initiation
document.getElementById("registration-form").addEventListener("submit", (e) => {
  e.preventDefault();
  handleRegistrationCheckout();
});

async function handleRegistrationCheckout() {
  if (!selectedEvent) return;
  
  const bankName = sanitizeInput(document.getElementById("detail-reg-bank-name").value);
  const phone = sanitizeInput(document.getElementById("detail-reg-phone").value);
  
  if (!bankName || !phone) {
    alert("Please fill in both Bank Owner Name and contact WhatsApp phone number.");
    return;
  }

  const email = USER_PROFILE.email;
  const ktuid = USER_PROFILE.id;
  const eventId = selectedEvent.id;

  // Check duplicate registrations
  let exists = false;
  if (useRealFirebase) {
    const snap = await db.collection("registrations").where("eventId", "==", eventId).where("studentUid", "==", USER_PROFILE.uid).get();
    exists = !snap.empty;
  } else {
    const mockRegs = JSON.parse(localStorage.getItem("firebase_mock_registrations") || "[]");
    exists = mockRegs.some(r => r.eventId === eventId && r.studentUid === USER_PROFILE.uid);
  }

  if (exists) {
    showCustomAlert("Conflict", "You are already registered for this event!");
    return;
  }

  // Team parse
  const teamNames = [];
  document.querySelectorAll(".detail-team-member-name").forEach(inp => {
    if (inp.value.trim()) teamNames.push(sanitizeInput(inp.value.trim()));
  });

  const amount = selectedEvent.fee || 0;
  const regId = "reg-" + Math.floor(Math.random() * 900000 + 100000);
  const txnId = "TXN_" + regId;

  const registrationData = {
    registrationId: regId,
    eventId: eventId,
    eventTitle: selectedEvent.title,
    studentName: USER_PROFILE.name,
    studentEmail: email,
    registerNo: ktuid,
    bankAccountName: bankName,
    phone: phone,
    teamMembers: teamNames,
    amount: amount,
    razorpayPaymentId: txnId,
    checkedIn: false,
    status: amount > 0 ? "Pending" : "Confirmed",
    studentUid: USER_PROFILE.uid,
    createdAt: new Date().toISOString(),
    timestamp: new Date().toISOString()
  };

  if (amount > 0) {
    // Save pending registration
    if (useRealFirebase) {
      await db.collection("registrations").doc(regId).set(registrationData);
    } else {
      let mockRegs = JSON.parse(localStorage.getItem("firebase_mock_registrations") || "[]");
      mockRegs.push(registrationData);
      localStorage.setItem("firebase_mock_registrations", JSON.stringify(mockRegs));
    }

    // Display payments drawer details
    document.getElementById("detail-upi-amount-label").textContent = `₹${amount}`;
    
    // Config intents
    const upiLink = `upi://pay?pa=${selectedEvent.upiId || 'iedcrit@okaxis'}&pn=${encodeURIComponent(selectedEvent.title)}&am=${amount}&cu=INR`;
    
    // Canvas QR Code
    const qrcanvas = document.getElementById("detail-upi-qr-canvas");
    new QRious({
      element: qrcanvas,
      value: upiLink,
      size: 140,
      background: "#FFFFFF",
      foreground: "#030611",
      level: "H"
    });

    document.getElementById("detail-upi-qr-wrapper-link").href = upiLink;
    document.getElementById("detail-upi-mobile-intent-link").href = upiLink;
    
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
      document.getElementById("upi-mobile-view").style.display = "flex";
      document.getElementById("upi-desktop-view").style.display = "none";
      window.location.href = upiLink;
    } else {
      document.getElementById("upi-desktop-view").style.display = "flex";
      document.getElementById("upi-mobile-view").style.display = "none";
    }

    // Toggle views inside details screen
    document.getElementById("registration-form").style.display = "none";
    document.getElementById("detail-upi-checkout-container").style.display = "flex";
    document.getElementById("detail-register-btn").style.display = "none";

    // Watch status polling/stream for payment verification
    watchPendingVerification(regId, registrationData);

  } else {
    // Free registration confirmed immediately
    await completeUpiEnrollment(registrationData);
  }
}

// Watch status confirm updates
function watchPendingVerification(regId, regData) {
  if (currentVerificationUnsubscribe) currentVerificationUnsubscribe();
  if (simulatorPollingInterval) clearInterval(simulatorPollingInterval);
  
  // Toggle overlay loading spinner modal
  document.getElementById("waiting-amount-label").textContent = `Amount Due: ₹${regData.amount}`;
  const qrCanvasOverlay = document.getElementById("waiting-upi-qr-canvas");
  const upiLink = `upi://pay?pa=${selectedEvent.upiId || 'iedcrit@okaxis'}&pn=${encodeURIComponent(selectedEvent.title)}&am=${regData.amount}&cu=INR`;
  
  new QRious({
    element: qrCanvasOverlay,
    value: upiLink,
    size: 130,
    background: "#FFFFFF",
    foreground: "#030611",
    level: "H"
  });

  document.getElementById("waiting-upi-qr-link").href = upiLink;
  document.getElementById("waiting-upi-mobile-link").href = upiLink;
  document.getElementById("waiting-verification-overlay").style.display = "flex";

  if (useRealFirebase) {
    currentVerificationUnsubscribe = db.collection("registrations").doc(regId)
      .onSnapshot(doc => {
        if (doc.exists && doc.data().status === "Confirmed") {
          cleanupVerificationLoops();
          handleVerificationSuccess(doc.data());
        }
      });
  }

  simulatorPollingInterval = setInterval(() => {
    const mockRegs = JSON.parse(localStorage.getItem("firebase_mock_registrations") || "[]");
    const match = mockRegs.find(r => r.registrationId === regId);
    if (match && match.status === "Confirmed") {
      cleanupVerificationLoops();
      handleVerificationSuccess(match);
    }
  }, 1000);
}

function cleanupVerificationLoops() {
  if (currentVerificationUnsubscribe) {
    currentVerificationUnsubscribe();
    currentVerificationUnsubscribe = null;
  }
  if (simulatorPollingInterval) {
    clearInterval(simulatorPollingInterval);
    simulatorPollingInterval = null;
  }
}

window.closeWaitingOverlayAndGoToWallet = function() {
  cleanupVerificationLoops();
  document.getElementById("waiting-verification-overlay").style.display = "none";
  navigateTo("wallet");
};

function handleVerificationSuccess(reg) {
  document.getElementById("waiting-verification-overlay").style.display = "none";
  showToast("Payment Verified! Ticket Issued.", "#4ae88a");
  triggerConfettiExplosion();
  
  document.getElementById("detail-upi-checkout-container").style.display = "none";
  document.getElementById("ticket-container").style.display = "flex";
  
  // Render Success Ticket QR
  const targetCanvas = document.getElementById("ticket-qr-canvas");
  drawQR(targetCanvas, reg.registrationId, reg.color || "#8b6fd4");
  
  syncRegistrations();
}

async function completeUpiEnrollment(reg) {
  if (useRealFirebase) {
    await db.collection("registrations").doc(reg.registrationId).set(reg);
    // Decrement Event Seats
    const targetCol = selectedEvent.type === "tournament" ? "tournaments" : "events";
    await db.collection(targetCol).doc(reg.eventId).update({
      seats: firebase.firestore.FieldValue.increment(-1)
    });
  } else {
    // Simulator local writes
    let mockRegs = JSON.parse(localStorage.getItem("firebase_mock_registrations") || "[]");
    mockRegs.push(reg);
    localStorage.setItem("firebase_mock_registrations", JSON.stringify(mockRegs));
    
    // Decrement seats
    let mockEvents = JSON.parse(localStorage.getItem("firebase_mock_events") || "[]");
    let evIdx = mockEvents.findIndex(e => e.id === reg.eventId);
    if (evIdx !== -1) mockEvents[evIdx].seats = Math.max(0, mockEvents[evIdx].seats - 1);
    localStorage.setItem("firebase_mock_events", JSON.stringify(mockEvents));
  }

  showToast("Enrollment Confirmed successfully!", "#4ae88a");
  triggerConfettiExplosion();

  document.getElementById("registration-form").style.display = "none";
  document.getElementById("detail-upi-checkout-container").style.display = "none";
  document.getElementById("detail-register-btn").style.display = "none";
  document.getElementById("ticket-container").style.display = "flex";
  
  const targetCanvas = document.getElementById("ticket-qr-canvas");
  drawQR(targetCanvas, reg.registrationId, selectedEvent.color || "#8b6fd4");

  await syncRegistrations();
}

// Draw encrypted QRs to canvases
function drawQR(canvas, text, brandColor) {
  if (!canvas) return;
  const encrypted = CryptoJS.AES.encrypt(text, QR_SECRET_KEY).toString();
  new QRious({
    element: canvas,
    value: encrypted,
    size: 160,
    background: "#FFFFFF",
    foreground: "#030611",
    level: "H"
  });
}

// Confetti explosions animations
function triggerConfettiExplosion() {
  const canvas = document.getElementById("confetti-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = canvas.parentElement.clientHeight;

  const colors = ["#8B6FD4", "#C8E84A", "#E8614A", "#4AE88A", "#00b4d8"];
  const particles = [];

  for (let i = 0; i < 75; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * -60,
      r: Math.random() * 4 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.random() * 10 - 5,
      tiltAngle: 0,
      tiltAngleInc: Math.random() * 0.05 + 0.02,
      velocity: {
        x: Math.random() * 2 - 1,
        y: Math.random() * 4 + 3
      }
    });
  }

  let animationFrame;
  const start = Date.now();

  function draw() {
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
      p.tiltAngle += p.tiltAngleInc;
      p.tilt = Math.sin(p.tiltAngle) * 10;

      if (p.y < canvas.height) active = true;
    });

    if (active && Date.now() - start < 3000) {
      animationFrame = requestAnimationFrame(draw);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      cancelAnimationFrame(animationFrame);
    }
  }
  draw();
}

// Confirm action overrides on UPI drawer buttons
document.getElementById("detail-upi-confirm-btn").addEventListener("click", async () => {
  // Manual check confirm
  showToast("Awaiting admin SMS check...", "#C8E84A");
});
document.getElementById("detail-upi-cancel-btn").addEventListener("click", () => {
  cleanupVerificationLoops();
  document.getElementById("registration-form").style.display = "block";
  document.getElementById("detail-upi-checkout-container").style.display = "none";
  document.getElementById("detail-register-btn").style.display = "block";
});

// ==========================================
// 05 — Student Wallet Shelf View
// ==========================================

function renderDashboard() {
  const container = document.getElementById("dashboard-list-container");
  if (!container) return;
  container.innerHTML = "";
  
  const attendedCount = USER_REGISTRATIONS.filter(r => r.checkedIn === true).length;
  const activeCount = USER_REGISTRATIONS.filter(r => r.checkedIn !== true).length;
  
  const att = document.getElementById("stat-attended");
  const up = document.getElementById("stat-upcoming");
  const certs = document.getElementById("stat-certs");
  
  if (att) att.textContent = attendedCount;
  if (up) up.textContent = activeCount;
  if (certs) certs.textContent = attendedCount;

  if (USER_REGISTRATIONS.length === 0) {
    container.innerHTML = `<p style="color:rgba(255,255,255,0.6); font-size:12px;">You do not have any registered event tickets in your wallet shelf yet.</p>`;
    return;
  }

  USER_REGISTRATIONS.forEach(reg => {
    const card = document.createElement("div");
    
    if (reg.status === "Pending") {
      card.className = "ticket-wallet-card-pending";
      card.innerHTML = `
        <div style="padding: 16px; text-align: center; background: rgba(255,255,255,0.01); border: 1px solid rgba(255,255,255,0.06); border-radius:16px;">
          <div style="font-size:16px; margin-bottom:4px;">⏳</div>
          <div style="font-size:12px; font-weight:800; color:#C8E84A;">Verification Pending</div>
          <p style="font-size:10px; color:rgba(255,255,255,0.5); margin: 4px 0 0 0;">Event: ${reg.title}</p>
        </div>
      `;
    } else {
      card.className = "bookmyshow-ticket";
      card.style.setProperty("--ticket-color", reg.color || "#8b6fd4");
      
      const drawerId = `drawer-${reg.registrationId}`;
      const waLink = reg.whatsappLink ? `<a href="${reg.whatsappLink}" target="_blank" class="btn" style="background:#25D366 !important; color:white !important; font-size:11px; padding:10px; border-radius:8px; font-weight:800; text-decoration:none; display:flex; align-items:center; justify-content:center; gap:6px;">💬 Join WhatsApp Group</a>` : "";
      const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(reg.location)}`;
      
      card.innerHTML = `
        <div class="ticket-poster-container" style="background-image: linear-gradient(to bottom, rgba(3, 6, 17, 0.1), rgba(3, 6, 17, 0.95)), url(${reg.poster || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=400&q=80'}); height:120px; background-size:cover; background-position:center; position:relative;">
          <div style="position:absolute; top:10px; right:10px;">
            <span class="chip">${reg.typeLabel.toUpperCase()}</span>
          </div>
        </div>
        <div class="ticket-perforation-line"></div>
        <div class="ticket-details-container" style="padding:15px; text-align:left;">
          <h3 style="font-family: var(--font-display); font-size: 16px; font-weight:800; color:white; margin:0;">${reg.title}</h3>
          <div style="font-size:11px; color:rgba(255,255,255,0.6); margin-top:4px;">📅 ${reg.date} • ${reg.time}</div>
          
          <div class="ticket-frosted-pass" style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); padding:10px; border-radius:10px; display:flex; align-items:center; gap:10px; margin-top:10px;">
            <div style="background:white; padding:4px; border-radius:6px; width:52px; height:52px; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
              <canvas id="qr-wallet-${reg.registrationId}" style="width:100%; height:100%;"></canvas>
            </div>
            <div>
              <span style="font-size:8px; font-weight:800; color:#8b6fd4; text-transform:uppercase;">Verified Entry Pass</span>
              <div style="font-size:12px; font-weight:800; color:white;">${reg.studentName}</div>
              <div style="font-family:monospace; font-size:9.5px; color:rgba(255,255,255,0.5);">ID: ${reg.registrationId}</div>
            </div>
          </div>

          <!-- Expandable detail drawer -->
          <div id="${drawerId}" style="display:none; flex-direction:column; gap:8px; margin-top:10px; border-top:1px dashed rgba(255,255,255,0.08); padding-top:10px; font-size:11px; color:rgba(255,255,255,0.6);">
            <div>Duration: <strong style="color:white;">${reg.duration || '3 Hours'}</strong></div>
            <div>Venue: <strong style="color:white;">${reg.location}</strong></div>
            <div>Instructions: <span>${reg.instructions || 'Please arrive 15 minutes before the start time. Carry your student ID.'}</span></div>
            ${waLink}
            <a href="${mapsLink}" target="_blank" class="btn" style="background:rgba(0, 180, 216, 0.1) !important; border:1px solid #00b4d8 !important; color:#00b4d8 !important; font-size:11px; padding:10px; border-radius:8px; font-weight:800; text-decoration:none; display:flex; align-items:center; justify-content:center; gap:6px;">📍 View Map Location</a>
            <button type="button" class="btn" onclick="event.stopPropagation(); shareTicketPass('${reg.registrationId}', '${reg.title}')" style="background:#8b6fd4; color:white; font-size:11px; padding:10px; border:none; font-weight:800;">📤 Share Pass</button>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px;">
            <span style="font-size:9px; font-family:monospace; color:rgba(255,255,255,0.4);">STATUS: CONFIRMED</span>
            <span style="font-size:10.5px; font-weight:800; color:#C8E84A; cursor:pointer;" onclick="event.stopPropagation(); toggleWalletPassDrawer('${drawerId}')">Pass Info</span>
          </div>
        </div>
      `;
      
      card.addEventListener("click", (e) => {
        if (e.target.tagName !== "BUTTON" && e.target.tagName !== "A" && !e.target.onclick) {
          toggleWalletPassDrawer(drawerId);
        }
      });
    }

    container.appendChild(card);

    if (reg.status !== "Pending") {
      setTimeout(() => {
        const c = document.getElementById(`qr-wallet-${reg.registrationId}`);
        drawQR(c, reg.registrationId, reg.color || "#8b6fd4");
      }, 50);
    }
  });
}

window.toggleWalletPassDrawer = function(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = el.style.display === "none" ? "flex" : "none";
};

// Web Share Pass
window.shareTicketPass = async function(ticketId, title) {
  const data = {
    title: `Confirmed Entry Pass for ${title}`,
    text: `Hey, I registered for ${title}! My Ticket ID is ${ticketId}. Register yours here:`,
    url: window.location.origin
  };
  try {
    if (navigator.share) {
      await navigator.share(data);
      showToast("Pass shared successfully!");
    } else {
      await navigator.clipboard.writeText(`Confirmed entry pass for ${title}! Ticket ID: ${ticketId}`);
      showToast("Pass copied to clipboard!", "#C8E84A");
    }
  } catch (e) {
    console.warn("Share failed:", e);
  }
};

// Profile settings loading UI
function updateUserProfileUI() {
  document.getElementById("db-profile-avatar").src = USER_PROFILE.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80";
  document.getElementById("db-profile-name").textContent = USER_PROFILE.name;
  document.getElementById("db-profile-id").textContent = USER_PROFILE.id;
  document.getElementById("db-profile-email").textContent = USER_PROFILE.email;
  document.getElementById("db-profile-dept").textContent = USER_PROFILE.department;
  document.getElementById("db-profile-year").textContent = USER_PROFILE.yearOfStudy;
  document.getElementById("db-profile-phone").textContent = USER_PROFILE.phone;
  document.getElementById("db-profile-college").textContent = USER_PROFILE.collegeName;
  
  const headerAvatar = document.getElementById("app-header-avatar");
  if (headerAvatar) headerAvatar.src = USER_PROFILE.avatar;
}

// Navigation screen management
window.switchTab = function(tabId) {
  document.querySelectorAll(".nav-section").forEach(sec => {
    sec.style.display = "none";
    sec.classList.remove("active");
  });
  
  const target = document.getElementById(`${tabId}-section`);
  if (target) {
    target.style.display = "block";
    target.classList.add("active");
  }

  // Hide detailed layers
  const detail = document.getElementById("screen-detail");
  if (detail) {
    detail.style.display = "none";
    detail.classList.remove("active");
  }

  // Update tabs states
  document.querySelectorAll(".bottom-nav-btn").forEach(btn => btn.classList.remove("active-neon"));
  const activeBtn = document.querySelector(`[data-tab="${tabId}"]`);
  if (activeBtn) activeBtn.classList.add("active-neon");

  if (tabId === "profile") {
    updateUserProfileUI();
  }
};

window.navigateTo = function(screenId) {
  if (["home", "wallet", "news", "profile"].includes(screenId)) {
    switchTab(screenId);
    return;
  }
  
  document.querySelectorAll(".screen").forEach(s => {
    if (s.id !== "screen-detail" || screenId !== "detail") {
      s.style.display = "none";
    }
  });

  const target = document.getElementById(`screen-${screenId}`);
  if (target) {
    target.style.display = "block";
    target.classList.add("active");
  }
};

// ==========================================
// 06 — Administration Workspace Panel Mode
// ==========================================

async function initAdminMode() {
  console.log("Admin Workspace Console Activated.");
  await loadAdminDashboard();
}

// Global live loader for admin.html
window.loadAdminDashboard = async function() {
  const tbody = document.getElementById("student-table-body");
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px; color:rgba(255,255,255,0.6);">Connecting to secure Firestore channels...</td></tr>`;

  if (useRealFirebase) {
    db.collection("registrations").onSnapshot(snap => {
      let regs = [];
      snap.forEach(d => regs.push({ id: d.id, ...d.data() }));
      renderAdminTable(regs, tbody);
    }, (err) => {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px; color:#ff4d4d;">Error: ${err.message}</td></tr>`;
    });
  } else {
    // Simulator mock loads
    setInterval(() => {
      const mockRegs = JSON.parse(localStorage.getItem("firebase_mock_registrations") || "[]");
      renderAdminTable(mockRegs, tbody);
    }, 1500);
  }
};

function renderAdminTable(list, tbody) {
  tbody.innerHTML = "";
  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px; color:rgba(255,255,255,0.6);">No student registrations found in database ledger.</td></tr>`;
    return;
  }

  list.forEach(reg => {
    const row = document.createElement("tr");
    const statusClass = reg.status === "Confirmed" ? "badge-approved" : "badge-pending";
    const approveBtn = reg.status !== "Confirmed" 
      ? `<button class="admin-table-btn admin-table-btn-approve" onclick="triggerApprovalAction('${reg.registrationId || reg.id}', '${reg.studentEmail}', ${JSON.stringify(reg).replace(/"/g, '&quot;')})">APPROVE</button>` 
      : `<span style="color:#4ae88a; font-weight:800; font-size:10px;">AUTHORIZED ✔️</span>`;

    row.innerHTML = `
      <td>
        <div style="font-weight:700; color:white; text-transform:uppercase;">${reg.studentName}</div>
        <div style="font-size:10.5px; color:rgba(255,255,255,0.6);">${reg.studentEmail}</div>
      </td>
      <td style="font-family:monospace; color:#E8614A; font-weight:700;">${reg.registerNo}</td>
      <td>
        <div>${reg.phone}</div>
        <div style="font-size:11px; color:#C8E84A; font-weight:700;">Bank: ${reg.bankAccountName}</div>
      </td>
      <td style="max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${reg.eventTitle || "RITU Event"}</td>
      <td><span class="badge-status ${statusClass}">${reg.status}</span></td>
      <td style="text-align:right;">${approveBtn}</td>
    `;
    tbody.appendChild(row);
  });
}

// Trigger function from admin table rows
window.triggerApprovalAction = function(regId, email, data) {
  if (confirm(`Authorize registration payment for student ticket #${regId}?`)) {
    approveStudent(regId, email, data);
  }
};

// VIP Automated Student Approvals dispatch
window.approveStudent = async function(studentId, studentEmail, studentData) {
  console.log(`Approving registration ID: ${studentId}`);
  
  if (useRealFirebase) {
    try {
      await db.collection("registrations").doc(studentId).update({ status: "Confirmed" });
      // Update student document status if registered
      const studentsSnap = await db.collection("students").where("email", "==", studentEmail).get();
      if (!studentsSnap.empty) {
        const studentUid = studentsSnap.docs[0].id;
        await db.collection("students").doc(studentUid).update({ approved: true });
      }
      console.log(`Updated Firestore document state to Confirmed.`);
    } catch (e) {
      console.error("Firestore approval status update failed:", e);
    }
  } else {
    // Simulator approvals
    let mockRegs = JSON.parse(localStorage.getItem("firebase_mock_registrations") || "[]");
    const idx = mockRegs.findIndex(r => r.registrationId === studentId);
    if (idx !== -1) {
      mockRegs[idx].status = "Confirmed";
      localStorage.setItem("firebase_mock_registrations", JSON.stringify(mockRegs));
    }
    // Also approve student login
    let mockUsers = JSON.parse(localStorage.getItem("firebase_mock_users") || "{}");
    const user = mockUsers[studentEmail];
    if (user && user.profileData) {
      user.profileData.approved = true;
      localStorage.setItem("firebase_mock_users", JSON.stringify(mockUsers));
    }
  }

  // Dynamic Horizontal pass details values mapping
  const encryptedId = CryptoJS.AES.encrypt(studentId, QR_SECRET_KEY).toString();
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(encryptedId)}`;
  
  const templateParams = {
    event_name: studentData.eventTitle || "RITU Event",
    student_name: studentData.studentName,
    event_date: studentData.date || "June 24, 2026",
    event_venue: studentData.location || "RIT Campus Kottayam",
    student_college: studentData.collegeName || "RIT Kottayam",
    ticket_id: studentId,
    qr_code_url: qrCodeUrl,
    whatsapp_group_link: studentData.whatsappLink || "https://chat.whatsapp.com/GzB96zW2Z2",
    google_map_link: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(studentData.location || 'RIT Kottayam')}`,
    event_poster_url: studentData.poster || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=400&q=80",
    to_email: studentEmail
  };

  console.log("EmailJS Automation parameters payload:", templateParams);

  if (typeof emailjs !== 'undefined') {
    try {
      emailjs.init({ publicKey: "3eNLy2tU8mQEiQIqG" });
      const res = await emailjs.send("service_u4ve6g2", "template_jla3p4e", templateParams);
      console.log("EmailJS Auto verification confirmation sent:", res.status, res.text);
      alert(`⚡ Verification successful! Student ticket approved and confirmed pass emailed to ${studentEmail}.`);
    } catch (e) {
      console.error("EmailJS execution exception:", e);
      alert(`Approved manually. Notification dispatch failed (details copied to admin console logs).`);
    }
  } else {
    console.warn("EmailJS SDK not found. Approvals processed locally.");
    alert(`Authorized payment successfully (Console mock dispatcher logged details).`);
  }
};
