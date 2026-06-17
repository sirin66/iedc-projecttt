// ==========================================================
// RITU 2026 — SECURE FULL-STACK ENGINE & EXPLOIT PATCHES
// ==========================================================

// Firebase configuration parameters
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

// Toast user alert notification panel utility
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
// 1. STATE-DRIVEN REDIRECTION GATEWAY & ROUTING SECURITY
// ==========================================================
const isIndexPage = window.location.pathname.endsWith("index.html") || window.location.pathname === "/" || window.location.pathname.endsWith("/");
const isAdminPage = window.location.pathname.endsWith("admin.html");

// Monitor Auth state changes globally
auth.onAuthStateChanged(async (user) => {
  if (isIndexPage) {
    const loginSection = document.getElementById("login-section");
    const portalSection = document.getElementById("portal-section");

    if (user) {
      // User is authenticated -> show Student Workspace, hide Login Card
      if (loginSection) loginSection.style.display = "none";
      if (portalSection) portalSection.style.display = "block";
      
      // Load student data
      loadStudentPortalData(user);
    } else {
      // User is unauthenticated -> show Login Card, hide Student Workspace
      if (portalSection) portalSection.style.display = "none";
      if (loginSection) loginSection.style.display = "flex";
      
      // Setup login button click listener
      bindLoginListener();
    }
  } else if (isAdminPage) {
    loadAdminConsoleData();
  }
});

// BIND: Login verification trigger handler
function bindLoginListener() {
  const loginBtn = document.getElementById('login-btn');
  if (loginBtn && !loginBtn.getAttribute('data-listener-bound')) {
    loginBtn.setAttribute('data-listener-bound', 'true');
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

        // Verify credentials with Auth API
        await auth.signInWithEmailAndPassword(email, password);

        showToast("Success! Entering Hub...", "var(--success-color)");
        setTimeout(() => {
          window.location.href = "index.html"; // Explicit redirection back to index.html
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
        loginBtn.textContent = "Verify & Enter";
      }
    });
  }
}

// ==========================================================
// 2. STUDENT PORTAL DATA LOADERS
// ==========================================================
async function loadStudentPortalData(user) {
  const emailDisplay = document.getElementById('profile-email-display');
  if (emailDisplay) emailDisplay.textContent = user.email;

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
      // Seeding fallback student record on first login
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
    console.error("Student profile loading failed:", err);
  }

  // Real-time Ticket Wallet snapshot sync
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

// BIND: Register Boot Camp button trigger
const registerCampBtn = document.getElementById('register-camp-btn');
if (registerCampBtn) {
  registerCampBtn.addEventListener('click', async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      registerCampBtn.disabled = true;
      registerCampBtn.textContent = "Processing...";

      // Check if already registered
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
        payment_status: "Pending", // Gated pending state
        amount: 150,
        createdAt: new Date().toISOString(),
        studentUid: user.uid,
        timestamp: new Date().toISOString()
      };

      await db.collection("registrations").doc(regId).set(registrationData);
      showToast("Registration requested! Pending payment approval.", "var(--success-color)");

    } catch (err) {
      console.error("Registration query failed:", err);
      showToast("Registration failed: " + err.message, "var(--error-color)");
    } finally {
      registerCampBtn.disabled = false;
      registerCampBtn.textContent = "Register Workshop";
    }
  });
}

// ==========================================================
// 3. SECURE VISIBILITY LOCK GATING: VIEW TICKET PASS
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
      viewTicketBtn.textContent = "Verifying Registration...";

      // Query student's registrations
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

      // SECURE CONDITIONAL TICKET GATING: check if payment status strictly Success
      if (regData && regData.payment_status === "Success") {
        const modal = document.getElementById('ticket-modal');
        document.getElementById('ticket-attendee-name').textContent = regData.studentName.toUpperCase();
        document.getElementById('ticket-id').textContent = regId;

        // Render pass QR code on canvas
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
        showToast("Ticket Pass Unlocked!", "var(--success-color)");

      } else {
        // STRICT BLOCK ACCESS: Alert student
        alert("Payment Pending!");
        showToast("Gating Lock: Payment Pending.", "var(--error-color)");
      }

    } catch (err) {
      console.error("Gating check failed:", err);
      showToast("Verification failed: " + err.message, "var(--error-color)");
    } finally {
      viewTicketBtn.disabled = false;
      viewTicketBtn.textContent = "View Ticket Pass";
    }
  });
}

// Modal close action
const modalClose = document.getElementById('modal-close');
if (modalClose) {
  modalClose.addEventListener('click', () => {
    document.getElementById('ticket-modal').classList.remove('active');
  });
}

// ==========================================================
// 4. ADMIN OPERATIONAL CONTROL PANEL
// ==========================================================
function loadAdminConsoleData() {
  const tbody = document.getElementById('admin-registrations-tbody');
  if (!tbody) return;

  // Real-time approvals snapshot listener
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
        actionCell.innerHTML = `<span style="font-size: 11px; color: var(--white-muted); font-weight: 700; text-transform: uppercase;">Approved</span>`;
      }

      tbody.appendChild(tr);
    });

    updateAdminStats(total, success, pending);

  }, (error) => {
    console.error("Admin snapshot listen fail:", error);
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

// Global approval mutation function
async function approveStudent(regId) {
  try {
    showToast("Processing approval mutation...", "var(--white-pure)");

    const docRef = db.collection("registrations").doc(regId);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      showToast("Record not found.", "var(--error-color)");
      return;
    }

    const regData = docSnap.data();

    // 1. Update registration status in Firestore live
    await docRef.update({
      status: "Confirmed",
      payment_status: "Success",
      verifiedAt: new Date().toISOString()
    });

    // 2. Update student account profile in Firestore live
    if (regData.studentUid) {
      await db.collection("students").doc(regData.studentUid).update({
        approved: true
      });
    }

    showToast("Student verified and approved!", "var(--success-color)");

  } catch (err) {
    console.error("Approval transaction failed:", err);
    showToast("Approval failed: " + err.message, "var(--error-color)");
  }
}
window.approveStudent = approveStudent;

// ==========================================================
// 5. SIGN OUT SYSTEM HANDLES
// ==========================================================
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    await auth.signOut();
    window.location.href = "index.html"; // Triggers auth state redirect back to login state
  });
}

const adminLogoutBtn = document.getElementById('admin-logout-btn');
if (adminLogoutBtn) {
  adminLogoutBtn.addEventListener('click', async () => {
    await auth.signOut();
    window.location.href = "index.html";
  });
}
