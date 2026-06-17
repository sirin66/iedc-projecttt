// ==========================================================
// RITU 2026 — SECURE ENGINE, LIVE DATA & EXPLOIT PATCHES
// ==========================================================

// Firebase Initialization configuration block
const firebaseConfig = {
  apiKey: "AIzaSyD4_h3WU2tkzE5G6jXimQUjYj2bUVliYUk",
  authDomain: "iedc-ux.firebaseapp.com",
  projectId: "iedc-ux",
  storageBucket: "iedc-ux.firebasestorage.app",
  messagingSenderId: "362260352304",
  appId: "1:362260352304:web:27374dbb9b51182807ccf5",
  measurementId: "G-2KH08MNGSX"
};

// Initialize Firebase standard execution logic
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

// Toast alert notification utility helper
function showToast(message, color = "var(--white-pure)") {
  const toast = document.getElementById("app-toast");
  const text = document.getElementById("toast-text");
  if (toast && text) {
    text.textContent = message;
    toast.style.borderColor = color;
    toast.classList.add("show");
    setTimeout(() => {
      toast.classList.remove("show");
    }, 3000);
  } else {
    console.log(`[Toast Fallback]: ${message}`);
  }
}

// ==========================================================
// 1. ROUTING GUARDS & AUTHENTICATION GATES
// ==========================================================
const path = window.location.pathname;

// On the main page, verify active authentication session
if (path.endsWith("index.html") || path.endsWith("/")) {
  auth.onAuthStateChanged(async (user) => {
    if (!user) {
      // Force redirect back to gateway page if unauthenticated
      window.location.href = "login.html";
    } else {
      loadStudentPortal(user);
    }
  });
}

// Login trigger event click handler
const loginBtn = document.getElementById('login-btn');
if (loginBtn) {
  loginBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    const email = document.getElementById('student-email').value.trim();
    const password = document.getElementById('student-password').value;

    if (!email || !password) {
      showToast("Please enter email and security password.", "var(--warning-color)");
      return;
    }

    try {
      loginBtn.disabled = true;
      loginBtn.textContent = "Authenticating...";

      // Standard Firebase credential verification
      await auth.signInWithEmailAndPassword(email, password);
      
      showToast("Success! Redirecting...", "var(--success-color)");
      setTimeout(() => {
        window.location.href = "index.html"; // Redirect back to main page
      }, 1000);

    } catch (error) {
      console.error("Auth Failure:", error);
      let alertMsg = "Authentication failed: " + error.message;
      if (error.code === "auth/wrong-password") {
        alertMsg = "Incorrect security password. Access denied.";
      } else if (error.code === "auth/user-not-found") {
        alertMsg = "Student record not found in system.";
      }
      showToast(alertMsg, "var(--error-color)");
    } finally {
      loginBtn.disabled = false;
      loginBtn.textContent = "Authenticate & Enter";
    }
  });
}

// ==========================================================
// 2. LIVE DATA HANDLERS: NEWS TICKER & ANNOUNCEMENTS
// ==========================================================

// News Ticker Real-Time snapshot subscription
db.collection("news").doc("global-news").onSnapshot((doc) => {
  let message = "Welcome to RITU 2026 Event Platform & Support Hub!";
  if (doc.exists) {
    message = doc.data().text || message;
  }
  
  const tickerText = document.getElementById("news-ticker-text");
  const tickerTextDup = document.getElementById("news-ticker-text-dup");
  if (tickerText) tickerText.textContent = message;
  if (tickerTextDup) tickerTextDup.textContent = message;

  // Sync value inside admin console text-input field
  const newsInput = document.getElementById("news-ticker-input");
  if (newsInput && document.activeElement !== newsInput) {
    newsInput.value = message;
  }
}, (err) => {
  console.warn("News ticker subscription bypassed or failed:", err);
});

// Admin News ticker overwrite handler
const updateNewsBtn = document.getElementById("update-news-btn");
if (updateNewsBtn) {
  updateNewsBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    const input = document.getElementById("news-ticker-input");
    const text = input.value.trim();
    if (!text) return;

    try {
      updateNewsBtn.disabled = true;
      updateNewsBtn.textContent = "Updating ticker...";

      await db.collection("news").doc("global-news").set({
        text,
        updatedAt: new Date().toISOString()
      });

      showToast("Scrolling ticker message updated live!", "var(--success-color)");
    } catch (err) {
      console.error(err);
      showToast("Ticker update failed: " + err.message, "var(--error-color)");
    } finally {
      updateNewsBtn.disabled = false;
      updateNewsBtn.textContent = "Overwrite Ticker Text";
    }
  });
}

// Real-Time Announcements subscription (renders feed on home and admin dashboard)
db.collection("announcements").orderBy("timestamp", "desc").onSnapshot((snapshot) => {
  // 1. Populate Announcements Feed on student portal
  const studentContainer = document.getElementById("announcements-list-container");
  if (studentContainer) {
    studentContainer.innerHTML = "";
    if (snapshot.empty) {
      studentContainer.innerHTML = '<p class="body-sub" style="text-align: center; color: var(--white-muted); margin-top: 20px;">No active announcement bulletins.</p>';
    } else {
      snapshot.forEach(doc => {
        const ann = doc.data();
        const dateStr = ann.timestamp ? new Date(ann.timestamp).toLocaleString() : "";
        const div = document.createElement("div");
        div.className = "announcement-card";
        div.innerHTML = `
          <p class="body-lead" style="font-weight: 600; color: var(--white-pure);">${ann.text || ""}</p>
          <p class="body-sub" style="font-size: 10px; margin-top: 6px; color: var(--white-muted); font-family: monospace;">${dateStr}</p>
        `;
        studentContainer.appendChild(div);
      });
    }
  }

  // 2. Populate Announcements feed on admin control board
  const adminContainer = document.getElementById("admin-announcements-list");
  if (adminContainer) {
    adminContainer.innerHTML = "";
    if (snapshot.empty) {
      adminContainer.innerHTML = '<p class="body-sub" style="text-align: center; color: var(--white-muted); padding: var(--space-md) 0;">No active bulletins posted.</p>';
    } else {
      snapshot.forEach(doc => {
        const ann = doc.data();
        const dateStr = ann.timestamp ? new Date(ann.timestamp).toLocaleString() : "";
        const div = document.createElement("div");
        div.className = "admin-announcement-item";
        div.innerHTML = `
          <div style="flex: 1; padding-right: var(--space-sm); text-align: left;">
            <p class="body-lead" style="font-size: 13px; font-weight: 600; color: var(--white-pure); line-height: 1.4;">${ann.text || ""}</p>
            <p class="body-sub" style="font-size: 10px; color: var(--white-muted); margin-top: 4px; font-family: monospace;">${dateStr}</p>
          </div>
          <button class="btn btn-glass" style="width: auto; padding: 6px 12px; font-size: 10px; border-radius: 8px; color: var(--error-color); border-color: rgba(232, 97, 74, 0.2);" onclick="deleteAnnouncement('${doc.id}')">
            Delete
          </button>
        `;
        adminContainer.appendChild(div);
      });
    }
  }
}, (err) => {
  console.warn("Announcements stream failed:", err);
});

// Admin Announcement posting trigger handler
const postAnnouncementBtn = document.getElementById("post-announcement-btn");
if (postAnnouncementBtn) {
  postAnnouncementBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    const input = document.getElementById("announcement-input");
    const text = input.value.trim();
    if (!text) return;

    try {
      postAnnouncementBtn.disabled = true;
      postAnnouncementBtn.textContent = "Publishing...";

      const id = "ann-" + Date.now();
      await db.collection("announcements").doc(id).set({
        id,
        text,
        timestamp: new Date().toISOString()
      });

      input.value = "";
      showToast("Announcement bulletin published live!", "var(--success-color)");
    } catch (err) {
      console.error(err);
      showToast("Announcement post failed: " + err.message, "var(--error-color)");
    } finally {
      postAnnouncementBtn.disabled = false;
      postAnnouncementBtn.textContent = "Publish Bulletin";
    }
  });
}

// Admin Announcement deletion handler
async function deleteAnnouncement(announcementId) {
  if (!confirm("Are you sure you want to delete this announcement bulletin permanently?")) return;

  try {
    showToast("Deleting bulletin...", "var(--white-pure)");
    await db.collection("announcements").doc(announcementId).delete();
    showToast("Announcement deleted successfully!", "var(--success-color)");
  } catch (err) {
    console.error(err);
    showToast("Delete failed: " + err.message, "var(--error-color)");
  }
}
window.deleteAnnouncement = deleteAnnouncement;

// ==========================================================
// 3. STUDENT PORTAL DATA LOADER
// ==========================================================
async function loadStudentPortal(user) {
  document.getElementById('profile-email-display').textContent = user.email;

  try {
    const profileSnap = await db.collection("students").doc(user.uid).get();
    if (profileSnap.exists) {
      const p = profileSnap.data();
      document.getElementById('profile-name-display').textContent = p.name || "Student";
      document.getElementById('profile-id-display').textContent = p.registerNo || p.id || "N/A";

      const statusBadge = document.getElementById('profile-status-display');
      statusBadge.textContent = p.approved === true ? "Approved" : "Pending Approval";
      statusBadge.className = p.approved === true ? "badge-status-pill badge-approved" : "badge-status-pill badge-pending";
    } else {
      // Auto seed missing profiles
      const nameFromEmail = user.email.split('@')[0].toUpperCase();
      const fallbackProfile = {
        uid: user.uid,
        name: nameFromEmail,
        registerNo: "RIT26CS" + Math.floor(100 + Math.random() * 900),
        approved: false,
        email: user.email,
        createdAt: new Date().toISOString()
      };
      await db.collection("students").doc(user.uid).set(fallbackProfile);

      document.getElementById('profile-name-display').textContent = fallbackProfile.name;
      document.getElementById('profile-id-display').textContent = fallbackProfile.registerNo;

      const statusBadge = document.getElementById('profile-status-display');
      statusBadge.textContent = "Pending Approval";
      statusBadge.className = "badge-status-pill badge-pending";
    }
  } catch (err) {
    console.error("Error loading profile:", err);
  }

  // Realtime Ticket Wallet synchronizer
  db.collection("registrations")
    .where("studentUid", "==", user.uid)
    .onSnapshot((snapshot) => {
      const container = document.getElementById('wallet-container');
      if (!container) return;

      container.innerHTML = "";
      if (snapshot.empty) {
        container.innerHTML = `<p class="body-sub">No active ticket passes stored in wallet.</p>`;
        return;
      }

      snapshot.forEach(doc => {
        const reg = doc.data();
        const card = document.createElement('div');
        card.className = "glass-panel";
        card.style.padding = "var(--space-md)";
        card.style.textAlign = "left";
        card.style.display = "flex";
        card.style.justifyContent = "space-between";
        card.style.alignItems = "center";
        
        const isSuccess = reg.payment_status === "Success";
        const badgeClass = isSuccess ? "badge-approved" : "badge-pending";
        const badgeText = isSuccess ? "Active Pass" : "Pending Pay";

        card.innerHTML = `
          <div>
            <h4 style="font-size: 13px; font-weight: 700; color: var(--white-pure);">${reg.eventTitle || "Workshop"}</h4>
            <p class="body-sub" style="font-size: 10px; margin-top: 2px;">TICKET ID: ${doc.id}</p>
          </div>
          <span class="badge-status-pill ${badgeClass}">${badgeText}</span>
        `;
        container.appendChild(card);
      });
    }, (error) => {
      console.error("Wallet stream error:", error);
    });
}

// BIND: Register Boot Camp Button click
const registerCampBtn = document.getElementById('register-camp-btn');
if (registerCampBtn) {
  registerCampBtn.addEventListener('click', async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      registerCampBtn.disabled = true;
      registerCampBtn.textContent = "Requesting Registration...";

      // Check if registration already exists to prevent duplication
      const existingQuery = await db.collection("registrations")
        .where("studentUid", "==", user.uid)
        .where("eventId", "==", "gen-ai-bootcamp-01")
        .get();

      if (!existingQuery.empty) {
        showToast("Already registered for this workshop.", "var(--warning-color)");
        return;
      }

      const regId = "reg-" + Math.floor(Math.random() * 900000 + 100000);
      const studentName = document.getElementById('profile-name-display').textContent;
      const registerNo = document.getElementById('profile-id-display').textContent;

      const registrationData = {
        registrationId: regId,
        eventId: "gen-ai-bootcamp-01",
        eventTitle: "Generative AI & Cloud Boot Camp",
        studentName: studentName,
        studentEmail: user.email,
        registerNo: registerNo,
        phone: "+91 98765 43210",
        checkedIn: false,
        status: "Pending",
        payment_status: "Pending", // Starts as pending state
        amount: 150,
        createdAt: new Date().toISOString(),
        studentUid: user.uid,
        timestamp: new Date().toISOString()
      };

      await db.collection("registrations").doc(regId).set(registrationData);
      showToast("Registration requested! Pending payment approval.", "var(--success-color)");

    } catch (err) {
      console.error("Registration write failure:", err);
      showToast("Failed to request registration: " + err.message, "var(--error-color)");
    } finally {
      registerCampBtn.disabled = false;
      registerCampBtn.textContent = "Register Workshop";
    }
  });
}

// ==========================================================
// 4. SECURE TICKET LOCK GATING HANDLER
// ==========================================================
const viewTicketBtn = document.getElementById('view-ticket-btn');
if (viewTicketBtn) {
  viewTicketBtn.addEventListener('click', async () => {
    const user = auth.currentUser;
    if (!user) {
      showToast("Session expired. Please log in.", "var(--error-color)");
      return;
    }

    try {
      viewTicketBtn.disabled = true;
      viewTicketBtn.textContent = "Verifying Credentials...";

      // Fetch student's registration document from Firestore
      const snap = await db.collection("registrations")
        .where("studentUid", "==", user.uid)
        .where("eventId", "==", "gen-ai-bootcamp-01")
        .get();

      if (snap.empty) {
        showToast("Please register for the workshop first.", "var(--warning-color)");
        return;
      }

      let regData = null;
      let regId = null;
      snap.forEach(doc => {
        regData = doc.data();
        regId = doc.id;
      });

      // Strict Conditional Visibility Lock check
      if (regData && regData.payment_status === "Success") {
        // Open modal popup
        const modal = document.getElementById('ticket-modal');
        document.getElementById('ticket-attendee-name').textContent = regData.studentName.toUpperCase();
        document.getElementById('ticket-id').textContent = regId;

        // Generate dynamic horizontal secure QR pass code
        const canvas = document.getElementById('ticket-qr-canvas');
        if (canvas) {
          new QRious({
            element: canvas,
            value: regId,
            size: 100,
            background: "#FFFFFF",
            foreground: "#030611",
            level: "H"
          });
        }

        modal.classList.add('active');
        showToast("VIP Pass Unlocked!", "var(--success-color)");

      } else {
        // Strict visibility lock: BLOCK and Alert user explicitly
        alert("Payment Pending!");
        showToast("Security Block: Payment Pending.", "var(--error-color)");
      }

    } catch (err) {
      console.error("Ticket authentication failure:", err);
      showToast("Verification failed: " + err.message, "var(--error-color)");
    } finally {
      viewTicketBtn.disabled = false;
      viewTicketBtn.textContent = "View Ticket Pass";
    }
  });
}

// Modal closing trigger listener
const modalClose = document.getElementById('modal-close');
if (modalClose) {
  modalClose.addEventListener('click', () => {
    document.getElementById('ticket-modal').classList.remove('active');
  });
}

// ==========================================================
// 5. ADMIN CONTROLS SYSTEM BINDINGS
// ==========================================================
if (path.endsWith("admin.html")) {
  auth.onAuthStateChanged((user) => {
    loadAdminData();
  });
}

function loadAdminData() {
  const tbody = document.getElementById('admin-registrations-tbody');
  if (!tbody) return;

  // Real-time registrations snapshots subscription
  db.collection("registrations").onSnapshot((snapshot) => {
    tbody.innerHTML = "";
    
    let total = 0;
    let success = 0;
    let pending = 0;

    if (snapshot.empty) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--white-muted);">No student registrations found in database ledger.</td></tr>`;
      updateAdminStats(0, 0, 0);
      return;
    }

    snapshot.forEach(doc => {
      const reg = doc.data();
      total++;

      const isSuccess = reg.payment_status === "Success";
      if (isSuccess) success++;
      else pending++;

      const tr = document.createElement('tr');
      
      const badgeClass = isSuccess ? "badge-approved" : "badge-pending";
      const badgeText = isSuccess ? "Success" : "Pending";

      tr.innerHTML = `
        <td>
          <div style="font-weight: 700; color: var(--white-pure);">${reg.studentName || "N/A"}</div>
          <div style="font-size: 11px; color: var(--white-muted); font-family: monospace;">ID: ${reg.registerNo || "N/A"}</div>
        </td>
        <td>
          <div>${reg.studentEmail || "N/A"}</div>
          <div style="font-size: 11px; color: var(--white-muted);">${reg.phone || "N/A"}</div>
        </td>
        <td>
          <div style="font-weight: 600;">${reg.eventTitle || "Workshop"}</div>
          <div style="font-size: 11px; color: var(--white-muted);">₹${reg.amount || 0}</div>
        </td>
        <td style="font-family: monospace; font-size: 12px;">${doc.id}</td>
        <td>
          <span class="badge-status-pill ${badgeClass}">${badgeText}</span>
        </td>
        <td style="text-align: right;" id="action-cell-${doc.id}">
        </td>
      `;

      const actionCell = tr.querySelector(`#action-cell-${doc.id}`);
      if (!isSuccess) {
        const approveBtn = document.createElement('button');
        approveBtn.className = "btn btn-primary";
        approveBtn.style.padding = "6px 14px";
        approveBtn.style.width = "auto";
        approveBtn.style.fontSize = "10px";
        approveBtn.style.borderRadius = "8px";
        approveBtn.textContent = "APPROVE";
        approveBtn.addEventListener('click', () => approveStudent(doc.id));
        actionCell.appendChild(approveBtn);
      } else {
        actionCell.innerHTML = `<span style="font-size: 11px; color: var(--white-muted); font-weight: 700; text-transform: uppercase;">Verified</span>`;
      }

      tbody.appendChild(tr);
    });

    updateAdminStats(total, success, pending);

  }, (error) => {
    console.error("Admin real-time listener failed:", error);
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--error-color);">Database connection error. Permission denied.</td></tr>`;
  });
}

function updateAdminStats(total, success, pending) {
  const totalEl = document.getElementById('admin-stat-total');
  const successEl = document.getElementById('admin-stat-success');
  const pendingEl = document.getElementById('admin-stat-pending');

  if (totalEl) totalEl.textContent = total;
  if (successEl) successEl.textContent = success;
  if (pendingEl) pendingEl.textContent = pending;
}

// Live Admin Approval update document handler
async function approveStudent(regId) {
  try {
    showToast("Processing administrative approval...", "var(--white-pure)");

    // Get registration details to fetch student Uid
    const docRef = db.collection("registrations").doc(regId);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      showToast("Record not found.", "var(--error-color)");
      return;
    }

    const regData = docSnap.data();

    // 1. Update registration status live
    await docRef.update({
      status: "Confirmed",
      payment_status: "Success",
      verifiedAt: new Date().toISOString()
    });

    // 2. Update student account profile document live
    if (regData.studentUid) {
      await db.collection("students").doc(regData.studentUid).update({
        approved: true
      });
    }

    showToast("Registration payment approved successfully!", "var(--success-color)");

  } catch (err) {
    console.error("Approval transaction failed:", err);
    showToast("Verification failed: " + err.message, "var(--error-color)");
  }
}
window.approveStudent = approveStudent;

// ==========================================================
// 6. SIGN OUT SYSTEM HANDLES
// ==========================================================
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    await auth.signOut();
    window.location.href = "login.html";
  });
}

const adminLogoutBtn = document.getElementById('admin-logout-btn');
if (adminLogoutBtn) {
  adminLogoutBtn.addEventListener('click', async () => {
    await auth.signOut();
    window.location.href = "login.html";
  });
}
