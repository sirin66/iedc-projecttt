// ==========================================
// 01 — APPLICATION STATE & MOCK DATA
// ==========================================

const EVENTS_DATA = [
  {
    id: "evt-innovate-hack",
    title: "InnovateRIT Hackathon",
    type: "hackathon",
    typeLabel: "Hackathon",
    date: "24 June, 2026",
    isoDate: "2026-06-24T09:00:00",
    time: "09:00 AM",
    seats: 12,
    price: "Free",
    host: "IEDC RIT Dev-Team",
    location: "RIT Seminar Hall",
    description: "The ultimate 24-hour builder challenge at RIT. Convene with designers, engineers, and creators to construct tangible solutions from scratch. Top teams win exciting cash rewards and mentorship incubation directly from IEDC RIT.",
    color: "#8B6FD4", // Galactic Purple
    hasTeam: true,
    maxTeamSize: 4
  },
  {
    id: "evt-aiml-bootcamp",
    title: "AI/ML Hands-on Bootcamp",
    type: "workshop",
    typeLabel: "Workshop",
    date: "18 June, 2026",
    isoDate: "2026-06-18T10:00:00",
    time: "10:00 AM",
    seats: 4,
    price: "₹150",
    host: "Dr. Anjali Verma, AI Lead",
    location: "Mechanical Seminar Hall",
    description: "Dive deep into modern machine learning architectures. Build and deploy your first convolutional neural network using PyTorch in this interactive, code-first lab. Perfect for beginners and intermediate AI enthusiasts.",
    color: "#C8E84A", // Nova Yellow
    hasTeam: false
  },
  {
    id: "evt-web3-talk",
    title: "Future of Decent Web (Web3)",
    type: "talk",
    typeLabel: "Talk",
    date: "28 June, 2026",
    isoDate: "2026-06-28T14:00:00",
    time: "02:00 PM",
    seats: 45,
    price: "Free",
    host: "Nikhil Kamath, Founder Tech3",
    location: "EC Seminar Hall",
    description: "Unpack the future of decentralization, smart contract architectures, and scalable blockchain solutions. Discover the technical roadmaps of tomorrow's web standards.",
    color: "#E8614A", // Coral Fire
    hasTeam: false
  },
  {
    id: "evt-ui-sprint",
    title: "IEDC UI Design Sprint",
    type: "hackathon",
    typeLabel: "Hackathon",
    date: "30 June, 2026",
    isoDate: "2026-06-30T11:00:00",
    time: "11:00 AM",
    seats: 8,
    price: "Free",
    host: "Sirin Mathews, Lead Designer",
    location: "Design Lab 1",
    description: "A high-intensity 6-hour wireframe and layout battle. Design sleek, high-fidelity user experiences that wow developers. Colors, typography, and motion systems are your weapons.",
    color: "#8B6FD4", // Galactic Purple
    hasTeam: true,
    maxTeamSize: 2
  },
  {
    id: "evt-iot-edge",
    title: "IoT Edge Node Dev",
    type: "workshop",
    typeLabel: "Workshop",
    date: "05 July, 2026",
    isoDate: "2026-07-05T09:30:00",
    time: "09:30 AM",
    seats: 2,
    price: "₹200",
    host: "Prof. Rajesh Nair, IoT Lab",
    location: "FabLab RIT",
    description: "Understand sensor telemetry, embedded system programming, and low-power communication standards. Program physical ESP32 boards and send data streams in real-time.",
    color: "#C8E84A", // Nova Yellow
    hasTeam: false
  }
];

// User profile state
let USER_PROFILE = {
  name: "",
  email: "",
  id: "",
  collegeName: "",
  avatar: ""
};

// Registered state (defaults with 1 completed and 1 upcoming event)
const USER_REGISTRATIONS = [
  {
    id: "evt-completed-ideation",
    title: "AI-Powered Ideation Talk",
    type: "talk",
    typeLabel: "Talk",
    date: "10 June, 2026",
    isoDate: "2026-06-10T10:00:00",
    time: "Completed",
    location: "Main Auditorium",
    host: "Prof. K. Kurian",
    color: "#E8614A",
    status: "completed",
    certificateId: "CERT-IEDC-4892-RIT"
  },
  {
    id: "evt-pre-react",
    title: "React Native Masterclass",
    type: "workshop",
    typeLabel: "Workshop",
    date: "15 June, 2026",
    isoDate: "2026-06-15T09:00:00",
    time: "09:00 AM",
    location: "CS Seminar Hall",
    host: "Nisha Joseph",
    color: "#C8E84A",
    status: "upcoming",
    ticketId: "IEDC-77890-RIT",
    seat: "Seat B12"
  }
];

// Active state tracking
let selectedEvent = null;
let currentFilter = "all";
let searchQuery = "";
let teamCount = 0;
let countdownInterval = null;

// ==========================================
// 02 — DOM ELEMENTS
// ==========================================

const screens = {
  auth: document.getElementById("screen-auth"),
  pending: document.getElementById("screen-pending"),
  admin: document.getElementById("screen-admin"),
  home: document.getElementById("screen-home"),
  detail: document.getElementById("screen-detail"),
  registration: document.getElementById("screen-registration"),
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

function navigateTo(screenId) {
  // Hide all screens
  Object.values(screens).forEach(screen => {
    if (screen) screen.classList.remove("active");
  });

  // Show target screen
  if (screens[screenId]) {
    screens[screenId].classList.add("active");
  }

  // Manage visibility of the desktop presentation environment vs full-screen admin
  const presentationContainer = document.querySelector(".presentation-container");
  if (screenId === "admin") {
    if (presentationContainer) presentationContainer.style.display = "none";
  } else {
    if (presentationContainer) presentationContainer.style.display = "flex";
  }

  // Manage bottom nav visibility and activation
  const bottomNav = document.querySelector(".bottom-nav");
  if (screenId === "auth" || screenId === "pending" || screenId === "admin") {
    if (bottomNav) bottomNav.style.display = "none";
  } else {
    if (bottomNav) bottomNav.style.display = "flex";
  }

  if (screenId === "home") {
    navItems.home.classList.add("active");
    navItems.dashboard.classList.remove("active");
  } else if (screenId === "dashboard") {
    navItems.home.classList.remove("active");
    navItems.dashboard.classList.add("active");
  } else {
    // Other sub-screens hide active state of primary navigation tabs
    navItems.home.classList.remove("active");
    navItems.dashboard.classList.remove("active");
  }

  // Refresh dynamic screen content if needed
  if (screenId === "dashboard") {
    renderDashboard();
  }
}

// Navigation event listeners
navItems.home.addEventListener("click", () => navigateTo("home"));
navItems.dashboard.addEventListener("click", () => navigateTo("dashboard"));

// Handle back buttons
document.getElementById("detail-back-btn").addEventListener("click", () => navigateTo("home"));
document.getElementById("reg-back-btn").addEventListener("click", () => navigateTo("detail"));
document.getElementById("ticket-back-btn").addEventListener("click", () => navigateTo("dashboard"));
document.getElementById("setup-back-btn").addEventListener("click", () => navigateTo("home"));

// ==========================================
// 04 — HOME SCREEN RENDERING & FILTERING
// ==========================================

function renderHomeEvents() {
  const listContainer = document.getElementById("events-list-container");
  const featuredContainer = document.getElementById("featured-card-container");
  
  listContainer.innerHTML = "";
  featuredContainer.innerHTML = "";

  // Filter events
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
        <p class="body-desc">No events found matching your filter.</p>
      </div>
    `;
    return;
  }

  // Pick first event as Featured if no filter is active, otherwise render all in list
  let featuredEvent = null;
  if (currentFilter === "all" && searchQuery === "") {
    featuredEvent = filtered[0];
    filtered = filtered.slice(1);
  }

  // Render featured card
  if (featuredEvent) {
    const featCard = document.createElement("div");
    featCard.className = "card-featured";
    featCard.style.setProperty("--event-color", featuredEvent.color);
    featCard.innerHTML = `
      <div class="card-featured-circle"></div>
      <div class="card-featured-content">
        <span class="chip chip-${featuredEvent.type}" style="margin-bottom: var(--space-sm);">${featuredEvent.typeLabel}</span>
        <h2 class="h3-title" style="margin-bottom: var(--space-xs); line-height: 1.2;">${featuredEvent.title}</h2>
        <div style="display: flex; gap: var(--space-sm); font-size: 11px; color: var(--muted-white);">
          <span>${featuredEvent.date}</span>
          <span>•</span>
          <span>${featuredEvent.time}</span>
        </div>
      </div>
    `;
    featCard.addEventListener("click", () => openEventDetail(featuredEvent));
    featuredContainer.appendChild(featCard);
  } else {
    // If filtering, hide the featured event block or label
    featuredContainer.innerHTML = `
      <div style="font-size:12px; color: var(--muted-white); margin-bottom: var(--space-sm);">
        Showing filtered results
      </div>
    `;
  }

  // Render list of upcoming events
  filtered.forEach(evt => {
    const card = document.createElement("div");
    card.className = "card-event";
    card.style.setProperty("--event-color", evt.color);
    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <span class="chip chip-${evt.type}">${evt.typeLabel}</span>
        <span class="caption-meta" style="color: var(--nova-yellow);">${evt.price}</span>
      </div>
      <h3 class="h3-title" style="margin-top: var(--space-xs); line-height:1.2;">${evt.title}</h3>
      <div style="display: flex; gap: var(--space-sm); font-size: 11px; color: var(--muted-white); margin-top: auto;">
        <span style="display:flex; align-items:center; gap:4px;">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          ${evt.date}
        </span>
        <span>•</span>
        <span>${evt.seats} seats left</span>
      </div>
    `;
    card.addEventListener("click", () => openEventDetail(evt));
    listContainer.appendChild(card);
  });
}

// Setup Search & Category Filters
const searchInput = document.getElementById("search-input");
searchInput.addEventListener("input", (e) => {
  searchQuery = e.target.value;
  renderHomeEvents();
});

const categoryPills = document.querySelectorAll(".chip-category");
categoryPills.forEach(pill => {
  pill.addEventListener("click", () => {
    categoryPills.forEach(p => p.classList.remove("active"));
    pill.classList.add("active");
    currentFilter = pill.getAttribute("data-category");
    renderHomeEvents();
  });
});

// ==========================================
// 05 — EVENT DETAIL VIEW
// ==========================================

function openEventDetail(event) {
  selectedEvent = event;

  // Set hero section styles
  const hero = document.getElementById("detail-hero");
  hero.style.setProperty("--event-color", event.color);
  
  // Set elements
  document.getElementById("detail-title").textContent = event.title;
  document.getElementById("detail-description").textContent = event.description;
  document.getElementById("detail-host").textContent = event.host;
  
  // Feature grid values
  document.getElementById("detail-feat-date").textContent = event.date.split(",")[0];
  document.getElementById("detail-feat-time").textContent = event.time;
  document.getElementById("detail-feat-seats").textContent = `${event.seats} Seats`;
  document.getElementById("detail-feat-price").textContent = event.price;

  // Render Type Tag in Hero
  const chipContainer = document.getElementById("detail-type-chip-container");
  chipContainer.innerHTML = `<span class="chip chip-${event.type}">${event.typeLabel}</span>`;

  // Render specific meta row inside Hero
  const metaRow = document.getElementById("detail-meta-row");
  metaRow.innerHTML = `
    <span class="chip" style="background: rgba(255,255,255,0.15); border:none; text-transform:none; font-weight:500;">
      📍 ${event.location}
    </span>
  `;

  // Register button setup
  const regBtn = document.getElementById("detail-register-btn");
  const isAlreadyRegistered = USER_REGISTRATIONS.some(r => r.id === event.id);

  if (isAlreadyRegistered) {
    regBtn.textContent = "View Ticket";
    regBtn.style.backgroundColor = "var(--galactic-purple)";
    regBtn.style.color = "var(--white-pure)";
    regBtn.style.boxShadow = "none";
  } else if (event.seats <= 0) {
    regBtn.textContent = "Sold Out";
    regBtn.disabled = true;
    regBtn.style.backgroundColor = "rgba(255,255,255,0.1)";
    regBtn.style.color = "var(--muted-white)";
    regBtn.style.boxShadow = "none";
  } else {
    regBtn.textContent = "Register Now";
    regBtn.disabled = false;
    regBtn.style.backgroundColor = "var(--nova-yellow)";
    regBtn.style.color = "var(--void-black)";
    regBtn.style.boxShadow = "0 8px 24px rgba(200,232,74,0.3)";
  }

  navigateTo("detail");
}

// Register action button click
document.getElementById("detail-register-btn").addEventListener("click", () => {
  if (!selectedEvent) return;

  const isAlreadyRegistered = USER_REGISTRATIONS.some(r => r.id === selectedEvent.id);
  if (isAlreadyRegistered) {
    const reg = USER_REGISTRATIONS.find(r => r.id === selectedEvent.id);
    showTicket(reg);
  } else {
    openRegistrationForm();
  }
});

// ==========================================
// 06 — REGISTRATION FLOW
// ==========================================

function openRegistrationForm() {
  if (!selectedEvent) return;

  document.getElementById("reg-event-title").textContent = selectedEvent.title;
  
  // Clear forms
  document.getElementById("reg-phone").value = "";
  document.getElementById("reg-terms").checked = false;
  
  const teamSection = document.getElementById("reg-team-section");
  const slotsContainer = document.getElementById("team-slots-container");
  slotsContainer.innerHTML = "";
  teamCount = 0;

  // Manage team slot visibility
  if (selectedEvent.hasTeam) {
    teamSection.style.display = "flex";
    addTeamSlot(); // Start with 1 empty slot
  } else {
    teamSection.style.display = "none";
  }

  navigateTo("registration");
}

function addTeamSlot() {
  if (!selectedEvent || teamCount >= selectedEvent.maxTeamSize - 1) {
    showToast("Maximum team size reached!", "var(--warning)", "var(--warning)");
    return;
  }

  teamCount++;
  const slotsContainer = document.getElementById("team-slots-container");
  const slotDiv = document.createElement("div");
  slotDiv.className = "team-slot";
  slotDiv.id = `team-slot-${teamCount}`;
  slotDiv.innerHTML = `
    <input type="text" class="input-field" placeholder="Member #${teamCount} Full Name" required style="flex:1;">
    <button type="button" class="team-slot-remove" onclick="removeTeamSlot(${teamCount})">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
    </button>
  `;
  slotsContainer.appendChild(slotDiv);
}

function removeTeamSlot(id) {
  const slot = document.getElementById(`team-slot-${id}`);
  if (slot) {
    slot.remove();
    teamCount--;
  }
}

document.getElementById("btn-add-member").addEventListener("click", addTeamSlot);

// Handle Registration Submit
document.getElementById("registration-form").addEventListener("submit", (e) => {
  e.preventDefault();

  if (!selectedEvent) return;

  const phone = document.getElementById("reg-phone").value;
  const terms = document.getElementById("reg-terms").checked;

  if (!phone || !terms) {
    showToast("Please fill all required fields", "var(--error)", "var(--error)");
    return;
  }

  // Decrement local seats count
  selectedEvent.seats = Math.max(0, selectedEvent.seats - 1);

  // Generate a random ticket seat
  const seatNum = `Seat A${Math.floor(Math.random() * 80) + 1}`;
  const customTicketId = `IEDC-${Math.floor(Math.random() * 90000) + 10000}-RIT`;

  // Create new registration record
  const newReg = {
    id: selectedEvent.id,
    title: selectedEvent.title,
    type: selectedEvent.type,
    typeLabel: selectedEvent.typeLabel,
    date: selectedEvent.date,
    isoDate: selectedEvent.isoDate,
    time: selectedEvent.time,
    location: selectedEvent.location,
    host: selectedEvent.host,
    color: selectedEvent.color,
    status: "upcoming",
    ticketId: customTicketId,
    seat: seatNum
  };

  USER_REGISTRATIONS.push(newReg);

  // Trigger celebration micro-animation (confetti)
  triggerConfetti();

  // Show Toast
  showToast("Registered successfully!", "var(--success)", "var(--success)");

  // Redirect to ticket after short delay
  setTimeout(() => {
    showTicket(newReg);
  }, 1000);
});

// ==========================================
// 07 — QR TICKET DRAW & DISPLAY
// ==========================================

function showTicket(registration) {
  // Set values
  document.getElementById("ticket-event-name").textContent = registration.title;
  document.getElementById("ticket-date").textContent = registration.date;
  document.getElementById("ticket-loc").textContent = registration.location;
  const seatElem = document.getElementById("ticket-seat");
  if (seatElem) {
    seatElem.textContent = registration.seat || "General Gate";
  }
  document.getElementById("ticket-id-text").textContent = `TICKET ID: ${registration.ticketId}`;
  
  // Set type badge styling
  const typeTag = document.getElementById("ticket-type-tag");
  typeTag.textContent = registration.typeLabel;
  typeTag.className = `ticket-event-type chip chip-${registration.type}`;

  // Generate QR mockup on Canvas
  generateQRCode(registration.ticketId, registration.color);

  // Action button clicks
  document.getElementById("btn-ticket-download").onclick = () => {
    showToast("Ticket saved to device!", "var(--success)", "var(--success)");
  };

  document.getElementById("btn-ticket-share").onclick = () => {
    showToast("Share link copied to clipboard!", "var(--galactic-purple)", "var(--galactic-purple)");
  };

  navigateTo("ticket");
}

function generateQRCode(text, brandColor) {
  const canvas = document.getElementById("qr-canvas");
  const ctx = canvas.getContext("2d");
  
  // High density sizing
  canvas.width = 280;
  canvas.height = 280;
  
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, 280, 280);

  // Set draw colors (use deep space or brand color for dark parts of QR)
  ctx.fillStyle = "#080810";

  // Standard QR layout has 3 large corner finding patterns: top-left, top-right, bottom-left
  // Draw finder pattern helper
  function drawFinderPattern(x, y) {
    ctx.fillRect(x, y, 70, 70);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(x + 10, y + 10, 50, 50);
    ctx.fillStyle = "#080810";
    ctx.fillRect(x + 20, y + 20, 30, 30);
  }

  // Draw 3 corner finders
  drawFinderPattern(10, 10);
  drawFinderPattern(200, 10);
  drawFinderPattern(10, 200);

  // Draw small alignment pattern in bottom right
  ctx.fillRect(210, 210, 20, 20);
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(215, 215, 10, 10);
  ctx.fillStyle = "#080810";
  ctx.fillRect(218, 218, 4, 4);

  // Seeded random logic using ticketId string
  let seed = 0;
  for (let i = 0; i < text.length; i++) {
    seed += text.charCodeAt(i);
  }
  
  function seededRandom() {
    let x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  }

  // Fill in the rest of the canvas with pixel matrix
  const moduleSize = 10;
  for (let r = 0; r < 28; r++) {
    for (let c = 0; c < 28; c++) {
      // Skip corner finder zones
      if ((r < 8 && c < 8) || (r < 8 && c >= 20) || (r >= 20 && c < 8)) {
        continue;
      }
      
      // Seeded random fill
      if (seededRandom() > 0.45) {
        ctx.fillStyle = seededRandom() > 0.90 ? brandColor : "#080810";
        ctx.fillRect(c * moduleSize, r * moduleSize, moduleSize, moduleSize);
      }
    }
  }
}

// ==========================================
// 08 — DASHBOARD / MY EVENTS SCREEN
// ==========================================

function renderDashboard() {
  // Set Current Date in Header
  const options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
  document.getElementById("dashboard-current-date").textContent = new Date().toLocaleDateString('en-US', options);

  // 1. Render Profile Sub-tab Content
  document.getElementById("db-profile-avatar").src = USER_PROFILE.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80";
  document.getElementById("db-profile-name").textContent = USER_PROFILE.name || "Student";
  document.getElementById("db-profile-id").textContent = USER_PROFILE.id || "N/A";
  document.getElementById("db-profile-email").textContent = USER_PROFILE.email || "N/A";
  document.getElementById("db-profile-dept").textContent = USER_PROFILE.department || "N/A";
  document.getElementById("db-profile-year").textContent = USER_PROFILE.yearOfStudy || "N/A";
  document.getElementById("db-profile-phone").textContent = USER_PROFILE.phone || "N/A";
  document.getElementById("db-profile-college").textContent = USER_PROFILE.collegeName || "N/A";

  // 2. Render Events Sub-tab Content
  const listContainer = document.getElementById("dashboard-list-container");
  listContainer.innerHTML = "";

  // Count stats
  const completedCount = USER_REGISTRATIONS.filter(r => r.status === "completed").length;
  const upcomingCount = USER_REGISTRATIONS.filter(r => r.status === "upcoming").length;
  
  document.getElementById("stat-attended").textContent = completedCount;
  document.getElementById("stat-upcoming").textContent = upcomingCount;
  document.getElementById("stat-certs").textContent = completedCount; // One cert per attended event

  if (USER_REGISTRATIONS.length === 0) {
    listContainer.innerHTML = `
      <div style="padding: var(--space-xl) 0; text-align: left; color: var(--muted-white);">
        <p class="body-desc">You are not registered for any events yet.</p>
      </div>
    `;
  } else {
    // Sort: upcoming first, then completed
    const sortedRegs = [...USER_REGISTRATIONS].sort((a, b) => {
      if (a.status === "upcoming" && b.status === "completed") return -1;
      if (a.status === "completed" && b.status === "upcoming") return 1;
      return 0;
    });

    // Render cards
    sortedRegs.forEach(reg => {
      const card = document.createElement("div");
      card.className = "card-event";
      card.style.setProperty("--event-color", reg.color);
      
      if (reg.status === "upcoming") {
        // Render upcoming card layout with Live Countdown timer and ticket link
        card.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <span class="chip chip-${reg.type}">${reg.typeLabel}</span>
            <div class="countdown-badge" id="countdown-${reg.id}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span class="timer-digits">Calculating...</span>
            </div>
          </div>
          <h3 class="h3-title" style="margin-top: var(--space-xs); line-height: 1.2;">${reg.title}</h3>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: var(--space-sm);">
            <span style="font-size: 11px; color: var(--muted-white);">${reg.date} • ${reg.time}</span>
            <span class="caption-meta" style="color: var(--nova-yellow); cursor: pointer; text-decoration: underline;">View Ticket</span>
          </div>
        `;
        // Click card details opens QR ticket directly
        card.onclick = () => showTicket(reg);
      } else {
        // Completed event layout with Certificate download badge
        card.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <span class="chip chip-${reg.type}">${reg.typeLabel}</span>
            <span class="chip" style="background: rgba(255,255,255,0.06); color: var(--muted-white);">Completed</span>
          </div>
          <h3 class="h3-title" style="margin-top: var(--space-xs); line-height: 1.2;">${reg.title}</h3>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: var(--space-sm); flex-wrap: wrap; gap: var(--space-sm);">
            <span style="font-size: 11px; color: var(--muted-white);">${reg.date}</span>
            <div class="certificate-badge" data-event-name="${reg.title}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
              Get Certificate
            </div>
          </div>
        `;
        
        // Stop event propagation on the cert badge so clicking it downloads rather than opening details
        const certBadge = card.querySelector(".certificate-badge");
        certBadge.onclick = (e) => {
          e.stopPropagation();
          showToast(`Certificate saved for ${reg.title}!`, "var(--success)", "var(--success)");
        };
      }
      listContainer.appendChild(card);
    });

    // Start the ticking dashboard countdown clock
    startDashboardCountdown();
  }

  // 3. Render Notifications Sub-tab Content
  renderNotifications();
}

function startDashboardCountdown() {
  if (countdownInterval) clearInterval(countdownInterval);

  function updateCountdowns() {
    const upcomingRegs = USER_REGISTRATIONS.filter(r => r.status === "upcoming");
    
    upcomingRegs.forEach(reg => {
      const badge = document.getElementById(`countdown-${reg.id}`);
      if (!badge) return;

      const timerTextSpan = badge.querySelector(".timer-digits");
      
      // Fallback target date if ISO is missing
      const targetTime = reg.isoDate ? new Date(reg.isoDate).getTime() : new Date("2026-06-24T09:00:00").getTime();
      const now = new Date().getTime();
      const difference = targetTime - now;

      if (difference <= 0) {
        timerTextSpan.textContent = "Live Now";
        badge.style.backgroundColor = "rgba(74, 232, 138, 0.15)";
        badge.style.borderColor = "rgba(74, 232, 138, 0.25)";
        badge.style.color = "var(--success)";
      } else {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        if (days > 0) {
          timerTextSpan.textContent = `${days}d ${hours}h ${minutes}m`;
        } else {
          timerTextSpan.textContent = `${hours}h ${minutes}m ${seconds}s`;
        }
      }
    });
  }

  updateCountdowns();
  countdownInterval = setInterval(updateCountdowns, 1000);
}

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

      // Keep animation going if particle has not fully fallen
      if (p.y < canvas.height) {
        active = true;
      }
    });

    // Animate for max 3 seconds or until all fall off screen
    if (active && Date.now() - start < 3000) {
      animationFrame = requestAnimationFrame(drawConfetti);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      cancelAnimationFrame(animationFrame);
    }
  }

  drawConfetti();
}

// ==========================================
// 10 — TOAST ALERT MANAGER
// ==========================================

function showToast(message, borderColor = "var(--galactic-purple)", iconColor = "var(--galactic-purple)") {
  const toast = document.getElementById("app-toast");
  const textSpan = document.getElementById("toast-text");
  
  // Set properties
  textSpan.textContent = message;
  toast.style.setProperty("--border-color", borderColor);
  toast.style.setProperty("--icon-color", iconColor);

  toast.classList.add("show");
  
  setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

// ==========================================
// 11 — INITIALIZATION
// ==========================================

// Render current system time in top status bar
function updateStatusBarTime() {
  const timeText = document.getElementById("status-time");
  const now = new Date();
  let hr = now.getHours();
  let min = now.getMinutes();
  
  // Pad with leading zero
  hr = hr < 10 ? '0' + hr : hr;
  min = min < 10 ? '0' + min : min;
  
  timeText.textContent = `${hr}:${min}`;
}
setInterval(updateStatusBarTime, 60000);
updateStatusBarTime();

// ==========================================
// 12 — FIREBASE SERVICE INTEGRATION
// ==========================================
// REPLACE WITH YOUR ACTUAL FIREBASE CONFIGURATION:
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

// Check if configuration has been customized by developer
if (firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith("YOUR_")) {
  try {
    firebase.initializeApp(firebaseConfig);
    useRealFirebase = true;
    console.log("Firebase initialized successfully using customized credentials.");
  } catch (error) {
    console.error("Firebase initialization failed, falling back to simulator:", error);
  }
}

const FirebaseService = {
  // Firebase Auth Operations
  auth: {
    createUserWithEmailAndPassword: async (email, password, profileData) => {
      if (useRealFirebase) {
        const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
        const uid = userCredential.user.uid;
        
        // Save student details in Firestore during registration
        await firebase.firestore().collection("students").doc(uid).set({
          uid,
          ...profileData,
          email: email.toLowerCase()
        });
        
        return { user: { uid, email } };
      } else {
        // Simulator Fallback
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
        // Simulator Fallback
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
        // Simulator Fallback
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
        // Simulator Fallback
        await new Promise(resolve => setTimeout(resolve, 500));
        const mockGoogleEmail = "google.student@rit.ac.in";
        return {
          user: {
            uid: "uid_google123",
            email: mockGoogleEmail,
            displayName: "GOOGLE TEST STUDENT"
          }
        };
      }
    }
  },
  
  // Firestore Database Operations
  db: {
    getStudentDoc: async (uid) => {
      if (useRealFirebase) {
        const doc = await firebase.firestore().collection("students").doc(uid).get();
        return {
          exists: () => doc.exists,
          data: () => doc.data()
        };
      } else {
        // Simulator Fallback
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
        // Simulator Fallback
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
    },

    getAllStudents: async () => {
      if (useRealFirebase) {
        const snapshot = await firebase.firestore().collection("students").get();
        const list = [];
        snapshot.forEach(doc => {
          list.push({ uid: doc.id, ...doc.data() });
        });
        return list;
      } else {
        // Simulator Fallback
        await new Promise(resolve => setTimeout(resolve, 300));
        let users = JSON.parse(localStorage.getItem("firebase_mock_users") || "{}");
        const list = [];
        for (const email in users) {
          if (users[email].profileData && users[email].profileData.role !== "admin") {
            list.push({ uid: users[email].uid, ...users[email].profileData });
          }
        }
        return list;
      }
    },

    deleteStudentDoc: async (uid) => {
      if (useRealFirebase) {
        await firebase.firestore().collection("students").doc(uid).delete();
      } else {
        // Simulator Fallback
        await new Promise(resolve => setTimeout(resolve, 200));
        let users = JSON.parse(localStorage.getItem("firebase_mock_users") || "{}");
        let targetEmail = null;
        for (const email in users) {
          if (users[email].uid === uid) {
            targetEmail = email;
            break;
          }
        }
        if (targetEmail) {
          delete users[targetEmail];
          localStorage.setItem("firebase_mock_users", JSON.stringify(users));
        }
      }
    }
  }
};

// Seed default user for testing
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
}
seedMockDatabase();

// ==========================================
// 13 — INTERACTION LOGIC & EVENT HANDLERS
// ==========================================

// Hook up profile trigger click
document.getElementById("profile-avatar-trigger").addEventListener("click", () => {
  openProfileSetup(true); // Is editing
});

// Hook up custom avatar upload click trigger
document.getElementById("btn-upload-avatar").addEventListener("click", () => {
  document.getElementById("setup-avatar-upload").click();
});

// Listen to avatar file upload
document.getElementById("setup-avatar-upload").addEventListener("change", function(e) {
  const file = e.target.files[0];
  if (!file) return;

  // Verify file format is JPG/JPEG
  const fileType = file.type;
  const fileName = file.name.toLowerCase();
  const isValidJpg = fileType === "image/jpeg" || fileType === "image/jpg" || fileName.endsWith(".jpg") || fileName.endsWith(".jpeg");

  if (!isValidJpg) {
    showToast("Please select a JPG/JPEG format image.", "var(--error)", "var(--error)");
    this.value = ""; // Clear input
    return;
  }

  // Convert to Base64 using FileReader
  const reader = new FileReader();
  reader.onload = function(event) {
    const base64Url = event.target.result;
    
    // Update preview img src
    const previewImg = document.getElementById("custom-avatar-preview");
    previewImg.src = base64Url;

    // Update radio input value
    const radio = document.getElementById("radio-custom-avatar");
    radio.value = base64Url;
    radio.checked = true;

    // Show the custom avatar selection option card
    document.getElementById("custom-avatar-label").style.display = "block";
    showToast("Picture loaded as custom avatar!", "var(--success)", "var(--success)");
  };
  reader.readAsDataURL(file);
});

// Automatically force lowercase characters in the email fields in real-time
document.getElementById("setup-email").addEventListener("input", function() {
  this.value = this.value.toLowerCase();
});
document.getElementById("login-email").addEventListener("input", function() {
  this.value = this.value.toLowerCase();
});

// Automatically force uppercase characters in the name field in real-time
document.getElementById("setup-name").addEventListener("input", function() {
  this.value = this.value.toUpperCase();
});

// Auth Switch Tab toggler
function switchAuthTab(mode) {
  const loginTab = document.getElementById("auth-tab-login");
  const registerTab = document.getElementById("auth-tab-register");
  const loginForm = document.getElementById("auth-login-form");
  const registerForm = document.getElementById("profile-setup-form");
  const forgotForm = document.getElementById("auth-forgot-password-form");
  const title = document.getElementById("setup-title");
  const subtitle = document.getElementById("setup-subtitle");

  // Always hide forgot form when switching tabs
  if (forgotForm) forgotForm.style.display = "none";
  if (tabsContainer) tabsContainer.style.display = "flex";

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

const tabsContainer = document.getElementById("auth-tabs-container");
if (tabsContainer) {
  document.getElementById("auth-tab-login").addEventListener("click", () => switchAuthTab("login"));
  document.getElementById("auth-tab-register").addEventListener("click", () => switchAuthTab("register"));
}

// Forgot Password Navigation State Toggles
function switchLoginToForgot() {
  document.getElementById("auth-tabs-container").style.display = "none";
  document.getElementById("auth-login-form").style.display = "none";
  document.getElementById("auth-forgot-password-form").style.display = "block";
  document.getElementById("setup-title").textContent = "Reset Password";
  document.getElementById("setup-subtitle").textContent = "Enter your email to receive a password reset link.";
}

function switchForgotToLogin() {
  document.getElementById("auth-forgot-password-form").style.display = "none";
  document.getElementById("auth-tabs-container").style.display = "flex";
  document.getElementById("auth-login-form").style.display = "block";
  document.getElementById("setup-title").textContent = "Welcome Back";
  document.getElementById("setup-subtitle").textContent = "Sign in to discover and register for events.";
}

document.getElementById("btn-forgot-password").addEventListener("click", switchLoginToForgot);
document.getElementById("btn-forgot-back").addEventListener("click", switchForgotToLogin);

// Forgot Password Form Submit
document.getElementById("auth-forgot-password-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("forgot-email").value.trim().toLowerCase();
  
  const submitBtn = e.target.querySelector("button[type='submit']");
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = "Sending...";
  
  try {
    await FirebaseService.auth.sendPasswordResetEmail(email);
    showToast("Password reset email sent!", "var(--success)", "var(--success)");
    
    // Clear field and return to login
    document.getElementById("forgot-email").value = "";
    switchForgotToLogin();
  } catch (error) {
    console.error("Password reset error:", error);
    showToast("Error sending reset email.", "var(--error)", "var(--error)");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
});

// Routing checker based on administrator approval status
function checkApprovalAndRoute(profileData) {
  if (profileData.role === "admin" || profileData.email === "admin@rit.ac.in") {
    navigateTo("admin");
    renderAdminDashboard();
  } else if (profileData.approved === true) {
    navigateTo("home");
    renderHomeEvents();
    renderDashboard();
  } else {
    const pendingNameElem = document.getElementById("pending-student-name");
    if (pendingNameElem) {
      pendingNameElem.textContent = profileData.name || "Student";
    }
    navigateTo("pending");
  }
}

// Login Form Submit
document.getElementById("auth-login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const email = document.getElementById("login-email").value.trim().toLowerCase();
  const password = document.getElementById("login-password").value;
  
  // Show loading state
  const submitBtn = e.target.querySelector("button[type='submit']");
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = "Verifying...";
  
  try {
    const credentials = await FirebaseService.auth.signInWithEmailAndPassword(email, password);
    const docSnap = await FirebaseService.db.getStudentDoc(credentials.user.uid);
    
    if (docSnap.exists()) {
      USER_PROFILE = docSnap.data();
      
      // Save session state
      sessionStorage.setItem("loggedInUserUid", credentials.user.uid);
      
      // Update UI templates
      updateUserProfileUI();
      
      if (USER_PROFILE.approved === true) {
        showToast("Welcome back!", "var(--success)", "var(--success)");
      } else {
        showToast("Account pending approval.", "var(--warning)", "var(--warning)");
      }
      
      checkApprovalAndRoute(USER_PROFILE);
    } else {
      throw new Error("auth/user-not-found");
    }
  } catch (error) {
    console.error("Login Error:", error);
    showToast("Invalid email or password", "var(--error)", "var(--error)");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
});

// Google Sign-In handler
async function handleGoogleSignIn() {
  const button = document.getElementById("btn-google-auth");
  const originalContent = button.innerHTML;
  button.disabled = true;
  button.innerHTML = `
    <span style="font-size:12px;">Connecting...</span>
  `;

  try {
    const credentials = await FirebaseService.auth.signInWithGoogle();
    const uid = credentials.user.uid;
    const docSnap = await FirebaseService.db.getStudentDoc(uid);

    if (docSnap.exists()) {
      USER_PROFILE = docSnap.data();
      
      // Save session state
      sessionStorage.setItem("loggedInUserUid", uid);
      
      // Update UI templates
      updateUserProfileUI();
      
      if (USER_PROFILE.approved === true) {
        showToast("Welcome back!", "var(--success)", "var(--success)");
      } else {
        showToast("Account pending approval.", "var(--warning)", "var(--warning)");
      }
      
      checkApprovalAndRoute(USER_PROFILE);
    } else {
      // First-time Google Sign In: route to registration/setup profile but pre-fill details!
      const name = credentials.user.displayName || "";
      const email = credentials.user.email || "";

      // Save temp session state so submission updates this UID
      sessionStorage.setItem("loggedInUserUid", uid);

      // Transition to registration view
      switchAuthTab("register");

      // Pre-fill Name & Email
      document.getElementById("setup-name").value = name.toUpperCase();
      document.getElementById("setup-email").value = email.toLowerCase();

      // Pre-fill password placeholders to pass client-side validation
      document.getElementById("setup-password").value = "GOOGLE_AUTH_USER";
      document.getElementById("setup-confirm-password").value = "GOOGLE_AUTH_USER";

      showToast("Google Authenticated! Complete your details.", "var(--galactic-purple)", "var(--galactic-purple)");
    }
  } catch (error) {
    console.error("Google Auth Error:", error);
    showToast("Google Authentication failed", "var(--error)", "var(--error)");
  } finally {
    button.disabled = false;
    button.innerHTML = originalContent;
  }
}

// Bind Google Auth click listener
document.getElementById("btn-google-auth").addEventListener("click", handleGoogleSignIn);

// Profile setup / registration form submission
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
  
  // Find selected avatar value
  const radios = document.getElementsByName("setup-avatar");
  let avatar = "";
  radios.forEach(radio => {
    if (radio.checked) avatar = radio.value;
  });

  const isUpdating = sessionStorage.getItem("loggedInUserUid") !== null;

  if (!isUpdating && password !== confirmPassword) {
    showToast("Passwords do not match.", "var(--error)", "var(--error)");
    return;
  }

  if (!name || !email || !id || !department || !yearOfStudy || !phone || !college) {
    showToast("Please fill in all profile fields.", "var(--error)", "var(--error)");
    return;
  }

  // Show loading state
  const submitBtn = document.getElementById("btn-setup-submit");
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = isUpdating ? "Saving..." : "Registering...";

  try {
    const profileData = {
      name,
      email,
      password,
      registerNo: id,  // For registerNo requirements
      id,
      department,
      year: yearOfStudy, // For year requirements
      yearOfStudy,
      phone,
      collegeName: college,
      avatar,
      approved: (isUpdating && typeof USER_PROFILE !== "undefined" && USER_PROFILE.approved === true) ? USER_PROFILE.approved : false,
      createdAt: new Date().toISOString()
    };

    if (isUpdating) {
      const uid = sessionStorage.getItem("loggedInUserUid");
      await FirebaseService.db.saveStudentDoc(uid, profileData);
      USER_PROFILE = { ...profileData, uid };
      updateUserProfileUI();
      
      if (USER_PROFILE.approved === true) {
        showToast("Profile updated!", "var(--success)", "var(--success)");
        navigateTo("home");
      } else {
        showToast("Profile created! Waiting for admin approval.", "var(--warning)", "var(--warning)");
        checkApprovalAndRoute(USER_PROFILE);
      }
    } else {
      if (!password) {
        showToast("Password is required for registration.", "var(--error)", "var(--error)");
        return;
      }
      const credentials = await FirebaseService.auth.createUserWithEmailAndPassword(email, password, profileData);
      USER_PROFILE = { ...profileData, uid: credentials.user.uid };
      
      // Save session state
      sessionStorage.setItem("loggedInUserUid", credentials.user.uid);
      
      updateUserProfileUI();
      showToast("Registration submitted! Waiting for approval.", "var(--warning)", "var(--warning)");
      checkApprovalAndRoute(USER_PROFILE);
    }
  } catch (error) {
    console.error("Auth System Error:", error);
    if (error.message === "auth/email-already-in-use") {
      showToast("Email already registered.", "var(--error)", "var(--error)");
    } else {
      showToast("Error processing request.", "var(--error)", "var(--error)");
    }
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
});

// Update User Profile details across multiple UI elements
function updateUserProfileUI() {
  const name = USER_PROFILE.name;
  const email = USER_PROFILE.email;
  const id = USER_PROFILE.id;
  const college = USER_PROFILE.collegeName;
  const avatar = USER_PROFILE.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80";

  // Update profile avatar image references in HTML (excluding choice list options)
  document.querySelectorAll(".avatar-img").forEach(img => {
    if (!img.closest(".avatar-option")) {
      img.src = avatar;
    }
  });

  // Update credentials on other screens
  const regInfoText = document.getElementById("reg-student-info");
  if (regInfoText) {
    regInfoText.textContent = `${name} (${email})`;
  }
  const regCollegeText = document.getElementById("reg-student-college");
  if (regCollegeText) {
    regCollegeText.textContent = college;
  }

  const regIdInput = document.querySelector("#registration-form input[disabled]");
  if (regIdInput) {
    regIdInput.value = id;
  }

  const greetings = document.querySelector(".dashboard-greeting");
  if (greetings) {
    greetings.textContent = `Hey ${name.split(" ")[0]} 👋`;
  }
  
  // Update Attendee name and College inside ticket
  const ticketAttendee = document.getElementById("ticket-attendee");
  if (ticketAttendee) {
    ticketAttendee.textContent = name;
  }
  const ticketCollege = document.getElementById("ticket-college");
  if (ticketCollege) {
    ticketCollege.textContent = college;
  }
}

// Open profile/auth screen settings
function openProfileSetup(isEditing = false) {
  const title = document.getElementById("setup-title");
  const subtitle = document.getElementById("setup-subtitle");
  const submitBtn = document.getElementById("btn-setup-submit");
  const backBtn = document.getElementById("setup-back-btn");
  const tabsContainer = document.getElementById("auth-tabs-container");
  const loginForm = document.getElementById("auth-login-form");
  const registerForm = document.getElementById("profile-setup-form");
  const forgotForm = document.getElementById("auth-forgot-password-form");

  if (forgotForm) forgotForm.style.display = "none";

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
    document.getElementById("setup-id").value = USER_PROFILE.id || "";
    document.getElementById("setup-department").value = USER_PROFILE.department || "";
    document.getElementById("setup-year").value = USER_PROFILE.yearOfStudy || "";
    document.getElementById("setup-phone").value = USER_PROFILE.phone || "";
    document.getElementById("setup-college").value = USER_PROFILE.collegeName || "";

    const defaultAvatars = [
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80",
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80",
      "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=100&q=80",
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80"
    ];

    if (USER_PROFILE.avatar && !defaultAvatars.includes(USER_PROFILE.avatar)) {
      const customLabel = document.getElementById("custom-avatar-label");
      const customPreview = document.getElementById("custom-avatar-preview");
      const customRadio = document.getElementById("radio-custom-avatar");

      customPreview.src = USER_PROFILE.avatar;
      customRadio.value = USER_PROFILE.avatar;
      customRadio.checked = true;
      customLabel.style.display = "block";
    } else {
      const radios = document.getElementsByName("setup-avatar");
      radios.forEach(radio => {
        if (radio.value === USER_PROFILE.avatar) {
          radio.checked = true;
        }
      });
    }
  } else {
    tabsContainer.style.display = "flex";
    backBtn.style.display = "none";
    switchAuthTab("login");

    document.getElementById("setup-name").value = "";
    document.getElementById("setup-email").value = "";
    document.getElementById("setup-password").value = "";
    document.getElementById("setup-id").value = "";
    document.getElementById("setup-department").value = "";
    document.getElementById("setup-year").value = "";
    document.getElementById("setup-phone").value = "";
    document.getElementById("setup-college").value = "";
    document.getElementById("custom-avatar-label").style.display = "none";
  }

  navigateTo("auth");
}

// Unified sign-out and session clearance
async function handleSignOut() {
  try {
    await FirebaseService.auth.signOut();
  } catch (e) {
    console.error("SignOut error:", e);
  }
  sessionStorage.removeItem("loggedInUserUid");
  USER_PROFILE = {
    name: "",
    email: "",
    id: "",
    password: "",
    department: "",
    yearOfStudy: "",
    phone: "",
    collegeName: "",
    avatar: "",
    approved: false
  };
  
  // Reset fields in form
  document.getElementById("login-email").value = "";
  document.getElementById("login-password").value = "";
  document.getElementById("forgot-email").value = "";
  document.getElementById("setup-name").value = "";
  document.getElementById("setup-email").value = "";
  document.getElementById("setup-password").value = "";
  document.getElementById("setup-id").value = "";
  document.getElementById("setup-department").value = "";
  document.getElementById("setup-year").value = "";
  document.getElementById("setup-phone").value = "";
  document.getElementById("setup-college").value = "";
  
  openProfileSetup(false);
}

// Register logout click event listeners
document.getElementById("btn-logout").addEventListener("click", handleSignOut);
document.getElementById("btn-pending-logout").addEventListener("click", handleSignOut);
document.getElementById("btn-admin-logout").addEventListener("click", handleSignOut);

// Student Dashboard Tab switcher
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

// Bind sub-tabs click event listeners
document.getElementById("db-tab-profile").addEventListener("click", () => switchDashboardTab("profile"));
document.getElementById("db-tab-events").addEventListener("click", () => switchDashboardTab("events"));
document.getElementById("db-tab-notifications").addEventListener("click", () => switchDashboardTab("notifications"));

// Mock Notifications Data
const NOTIFICATIONS_DATA = [
  {
    id: "notif-1",
    title: "Welcome to IEDC RIT Gateway!",
    body: "Your profile is active. Discover upcoming workshops, hackathons, and talks, and manage your tickets instantly.",
    time: "Just Now"
  },
  {
    id: "notif-2",
    title: "InnovateRIT Hackathon Registration Open",
    body: "Build a prototype in 24 hours. The flagship hackathon has registration slots open for team registrations.",
    time: "2 Hours Ago"
  },
  {
    id: "notif-3",
    title: "AI/ML Bootcamp Registration Fee",
    body: "Please make sure to complete payment for AI/ML Hands-on Bootcamp (₹150) at the IEDC front desk to secure your seat.",
    time: "1 Day Ago"
  }
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

// ==========================================
// 14 — ADMIN DASHBOARD CONTROLS
// ==========================================
async function renderAdminDashboard() {
  const listContainer = document.getElementById("admin-student-list");
  if (!listContainer) return;
  listContainer.innerHTML = "";

  try {
    const students = await FirebaseService.db.getAllStudents();
    
    // Calculate stats
    const totalCount = students.length;
    const approvedCount = students.filter(s => s.approved === true).length;
    const pendingCount = students.filter(s => s.approved !== true).length;

    document.getElementById("admin-stat-total").textContent = totalCount;
    document.getElementById("admin-stat-approved").textContent = approvedCount;
    document.getElementById("admin-stat-pending").textContent = pendingCount;

    const searchValue = document.getElementById("admin-search").value.trim().toLowerCase();

    // Filter
    const filtered = students.filter(student => {
      const name = (student.name || "").toLowerCase();
      const email = (student.email || "").toLowerCase();
      const regNo = (student.registerNo || "").toLowerCase();
      const dept = (student.department || "").toLowerCase();
      const yr = (student.year || "").toLowerCase();
      return name.includes(searchValue) || 
             email.includes(searchValue) || 
             regNo.includes(searchValue) || 
             dept.includes(searchValue) || 
             yr.includes(searchValue);
    });

    if (filtered.length === 0) {
      listContainer.innerHTML = `
        <tr>
          <td colspan="7" style="padding: var(--space-xl); text-align: center; color: var(--muted-white);">
            No registered students found.
          </td>
        </tr>
      `;
      return;
    }

    filtered.forEach(student => {
      const row = document.createElement("tr");
      
      const isApproved = student.approved === true;
      const statusBadge = isApproved 
        ? `<span class="badge-status badge-approved">Approved</span>`
        : `<span class="badge-status badge-pending">Pending</span>`;

      const actionButtons = isApproved
        ? `<button class="admin-table-btn admin-table-btn-reject" onclick="handleAdminAction('${student.uid}', 'reject')">Reject</button>
           <button class="admin-table-btn admin-table-btn-delete" onclick="handleAdminAction('${student.uid}', 'delete')">Delete</button>`
        : `<button class="admin-table-btn admin-table-btn-approve" onclick="handleAdminAction('${student.uid}', 'approve')">Approve</button>
           <button class="admin-table-btn admin-table-btn-delete" onclick="handleAdminAction('${student.uid}', 'delete')">Delete</button>`;

      const avatarSrc = student.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80";

      row.innerHTML = `
        <td>
          <div class="admin-table-student-info">
            <img class="admin-table-student-avatar" src="${avatarSrc}" alt="${student.name}">
            <div class="admin-table-student-meta">
              <span class="admin-table-student-name">${student.name}</span>
              <span class="admin-table-student-email">${student.email}</span>
            </div>
          </div>
        </td>
        <td style="font-family: var(--font-mono); font-weight: 700; color: var(--white-pure);">${student.registerNo || student.id || "N/A"}</td>
        <td>
          <div style="font-weight: 600;">${student.department || "N/A"}</div>
          <div style="font-size: 11px; color: var(--muted-white);">${student.year || student.yearOfStudy || "N/A"}</div>
        </td>
        <td>${student.phone || "N/A"}</td>
        <td>${student.collegeName || "N/A"}</td>
        <td>${statusBadge}</td>
        <td>
          <div class="admin-table-actions">
            ${actionButtons}
          </div>
        </td>
      `;
      listContainer.appendChild(row);
    });
  } catch (error) {
    console.error("Error loading admin dashboard:", error);
    showToast("Error loading student list", "var(--error)", "var(--error)");
  }
}

// Admin action handler
window.handleAdminAction = async function(uid, action) {
  try {
    if (action === "approve") {
      await FirebaseService.db.saveStudentDoc(uid, { approved: true });
      showToast("Student approved!", "var(--success)", "var(--success)");
    } else if (action === "reject") {
      await FirebaseService.db.saveStudentDoc(uid, { approved: false });
      showToast("Student rejected!", "var(--warning)", "var(--warning)");
    } else if (action === "delete") {
      if (confirm("Are you sure you want to delete this student permanently?")) {
        await FirebaseService.db.deleteStudentDoc(uid);
        showToast("Student record deleted!", "var(--success)", "var(--success)");
      } else {
        return;
      }
    }
    renderAdminDashboard();
  } catch (error) {
    console.error("Admin action failed:", error);
    showToast("Action failed", "var(--error)", "var(--error)");
  }
};

// Wire up search event listener
document.getElementById("admin-search").addEventListener("input", () => {
  renderAdminDashboard();
});

// Check Session & Gating on Startup
async function initSession() {
  const cachedUid = sessionStorage.getItem("loggedInUserUid");
  if (cachedUid) {
    try {
      const docSnap = await FirebaseService.db.getStudentDoc(cachedUid);
      if (docSnap.exists()) {
        USER_PROFILE = docSnap.data();
        updateUserProfileUI();
        checkApprovalAndRoute(USER_PROFILE);
      } else {
        sessionStorage.removeItem("loggedInUserUid");
        openProfileSetup(false);
      }
    } catch (e) {
      console.error("Session init error:", e);
      openProfileSetup(false);
    }
  } else {
    openProfileSetup(false);
  }
}

initSession();
