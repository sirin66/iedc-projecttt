// ==========================================================
// RITU 2026 — FULL-STACK ENGINE & ACCESS GATE
// ==========================================================

// Firebase configuration block
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

// Helper: Formats ticker items scrolling text
function updateNewsTickerText(text) {
  const container = document.getElementById('news-ticker-container');
  if (container) {
    container.innerHTML = `
      <span class="ticker-item">${text}</span>
      <span class="ticker-item">${text}</span>
      <span class="ticker-item">${text}</span>
      <span class="ticker-item">${text}</span>
    `;
  }
}

// ==========================================================
// 1. ROUTING & ACCESS GUARD & CONTENT STREAM LISTENER
// ==========================================================
const isIndexPage = window.location.pathname.endsWith("index.html") || window.location.pathname === "/";
const isLoginPage = window.location.pathname.endsWith("login.html");
const isAdminPage = window.location.pathname.endsWith("admin.html");

if (isIndexPage) {
  auth.onAuthStateChanged(async (user) => {
    if (!user) {
      // Direct unauthenticated users to the Login Portal
      window.location.href = "login.html";
    } else {
      loadMainPortal(user);
    }
  });
} else if (isLoginPage) {
  // Bind Login Trigger
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

        // Execute credential verification
        await auth.signInWithEmailAndPassword(email, password);

        showToast("Success! Entering Hub...", "var(--success-color)");
        setTimeout(() => {
          window.location.href = "index.html";
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
} else if (isAdminPage) {
  auth.onAuthStateChanged((user) => {
    loadAdminConsole();
  });
}

// ==========================================================
// 2. MAIN WEBSITE / PORTAL WORKSPACE LOADERS
// ==========================================================
async function loadMainPortal(user) {
  // Populate student displays
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
      // Create fallback record
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
    console.error("Profile load failed:", err);
  }

  // Real-time dynamic news ticker listener
  db.collection("news").doc("ticker").onSnapshot((doc) => {
    const text = doc.exists ? doc.data().text : "Welcome to RITU 2026 Event Platform & Premium Support Hub!";
    updateNewsTickerText(text);
  }, (error) => {
    console.error("News ticker snapshot error:", error);
    updateNewsTickerText("RITU 2026 event platform is active.");
  });

  // Real-time dynamic announcements feed listener
  db.collection("announcements").orderBy("timestamp", "desc").onSnapshot((snapshot) => {
    const container = document.getElementById("announcements-list-container");
    if (!container) return;

    container.innerHTML = "";
    if (snapshot.empty) {
      container.innerHTML = `
        <div class="glass-panel" style="padding: var(--space-lg); text-align: center;">
          <p class="body-sub">No recent administrative announcements posted.</p>
        </div>`;
      return;
    }

    snapshot.forEach(doc => {
      const data = doc.data();
      const div = document.createElement("div");
      div.className = "announcement-item";
      div.innerHTML = `
        <p class="body-lead" style="font-weight: 600;">${data.text || ""}</p>
        <span style="font-size: 10px; color: var(--white-muted);">${data.date || ""}</span>
      `;
      container.appendChild(div);
    });
  }, (error) => {
    console.error("Announcements snapshot error:", error);
  });

  // Real-time ticket wallet sync
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
      registerCampBtn.textContent = "Requesting Registration...";

      // Check if duplicate exists
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
        payment_status: "Pending", // Starts in pending lock
        amount: 150,
        createdAt: new Date().toISOString(),
        studentUid: user.uid,
        timestamp: new Date().toISOString()
      };

      await db.collection("registrations").doc(regId).set(registrationData);
      showToast("Registration requested! Pending payment approval.", "var(--success-color)");

    } catch (err) {
      console.error("Registration fail:", err);
      showToast("Registration failed: " + err.message, "var(--error-color)");
    } finally {
      registerCampBtn.disabled = false;
      registerCampBtn.textContent = "Register Workshop";
    }
  });
}

// ==========================================================
// 3. SECURE TICKET VISIBILITY LOCK GATING
// ==========================================================
const viewTicketBtn = document.getElementById('view-ticket-btn');
if (viewTicketBtn) {
  viewTicketBtn.addEventListener('click', async () => {
    const user = auth.currentUser;
    if (!user) {
      showToast("Session expired. Please re-login.", "var(--error-color)");
      return;
    }

    try {
      viewTicketBtn.disabled = true;
      viewTicketBtn.textContent = "Verifying Registration...";

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

      // STRICT GATE CHECK: Verify payment status is strictly equal to Success
      if (regData && regData.payment_status === "Success") {
        const modal = document.getElementById('ticket-modal');
        document.getElementById('ticket-attendee-name').textContent = regData.studentName.toUpperCase();
        document.getElementById('ticket-id').textContent = regId;

        // Render dynamic pass QR code
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
        showToast("Pass verified & unlocked!", "var(--success-color)");

      } else {
        // LOCK TICKET PASS: strictly block and alert
        alert("Payment Pending!");
        showToast("Block: Payment Pending.", "var(--error-color)");
      }

    } catch (err) {
      console.error("Gating check fail:", err);
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
// 4. ADMIN OPERATIONAL CONTROL CENTER
// ==========================================================
function loadAdminConsole() {
  const tbody = document.getElementById('admin-registrations-tbody');
  if (!tbody) return;

  // Real-time approvals ledger stream
  db.collection("registrations").onSnapshot((snapshot) => {
    tbody.innerHTML = "";
    
    let total = 0;
    let success = 0;
    let pending = 0;

    if (snapshot.empty) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--white-muted);">No student registrations found in database ledger.</td></tr>`;
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
    console.error("Admin registration listener failed:", error);
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--error-color);">Firestore connection error. Permission denied.</td></tr>`;
  });

  // News ticker text control setup
  db.collection("news").doc("ticker").get().then((doc) => {
    if (doc.exists) {
      document.getElementById('news-ticker-input').value = doc.data().text || "";
    }
  });

  const updateNewsBtn = document.getElementById('update-news-btn');
  if (updateNewsBtn) {
    updateNewsBtn.onclick = async () => {
      const tickerText = document.getElementById('news-ticker-input').value.trim();
      if (!tickerText) return;
      try {
        updateNewsBtn.disabled = true;
        updateNewsBtn.textContent = "Updating...";
        await db.collection("news").doc("ticker").set({ text: tickerText });
        showToast("News ticker content updated!", "var(--success-color)");
      } catch (err) {
        console.error("Ticker save failed:", err);
        showToast("Ticker update failed: " + err.message, "var(--error-color)");
      } finally {
        updateNewsBtn.disabled = false;
        updateNewsBtn.textContent = "Overwrite Ticker Text";
      }
    };
  }

  // Announcements manager setup
  db.collection("announcements").orderBy("timestamp", "desc").onSnapshot((snapshot) => {
    const list = document.getElementById('admin-announcements-list');
    if (!list) return;

    list.innerHTML = "";
    if (snapshot.empty) {
      list.innerHTML = `<div style="text-align: center; color: var(--white-muted); padding: var(--space-md);">No active announcements found.</div>`;
      return;
    }

    snapshot.forEach(doc => {
      const data = doc.data();
      const item = document.createElement("div");
      item.className = "announcement-item";
      item.style.position = "relative";
      item.innerHTML = `
        <p class="body-lead" style="font-weight: 600; padding-right: 70px;">${data.text || ""}</p>
        <span style="font-size: 10px; color: var(--white-muted);">${data.date || ""}</span>
        <button class="btn" style="position: absolute; right: 10px; top: 10px; width: auto; padding: 6px 12px; font-size: 9px; background: var(--error-color); color: white;" onclick="deleteAnnouncement('${doc.id}')">Delete</button>
      `;
      list.appendChild(item);
    });
  });

  const postAnnouncementBtn = document.getElementById('post-announcement-btn');
  if (postAnnouncementBtn) {
    postAnnouncementBtn.onclick = async () => {
      const textInput = document.getElementById('announcement-input');
      const text = textInput.value.trim();
      if (!text) return;
      
      try {
        postAnnouncementBtn.disabled = true;
        postAnnouncementBtn.textContent = "Posting...";
        
        await db.collection("announcements").add({
          text: text,
          date: new Date().toLocaleDateString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }),
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        textInput.value = "";
        showToast("Announcement published live!", "var(--success-color)");

      } catch (err) {
        console.error("Announcement post failed:", err);
        showToast("Post failed: " + err.message, "var(--error-color)");
      } finally {
        postAnnouncementBtn.disabled = false;
        postAnnouncementBtn.textContent = "Post Custom Announcement";
      }
    };
  }
}

// Global window handle for deleting announcements
async function deleteAnnouncement(announcementId) {
  if (!confirm("Are you sure you want to delete this announcement?")) return;
  try {
    await db.collection("announcements").doc(announcementId).delete();
    showToast("Announcement deleted successfully!", "var(--success-color)");
  } catch (err) {
    console.error("Announcement delete failed:", err);
    showToast("Delete failed: " + err.message, "var(--error-color)");
  }
}
window.deleteAnnouncement = deleteAnnouncement;

function updateAdminStats(total, success, pending) {
  const totalEl = document.getElementById('admin-stat-total');
  const successEl = document.getElementById('admin-stat-success');
  const pendingEl = document.getElementById('admin-stat-pending');

  if (totalEl) totalEl.textContent = total;
  if (successEl) successEl.textContent = success;
  if (pendingEl) pendingEl.textContent = pending;
}

// Student verification approval transaction workflow
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

    // 1. Confirm payment and registration status
    await docRef.update({
      status: "Confirmed",
      payment_status: "Success",
      verifiedAt: new Date().toISOString()
    });

    // 2. Approve student record
    if (regData.studentUid) {
      await db.collection("students").doc(regData.studentUid).update({
        approved: true
      });
    }

    showToast("Student approval confirmed!", "var(--success-color)");

  } catch (err) {
    console.error("Approval workflow failed:", err);
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
