
    // Live app runtime credentials extracted from native firebase.js config
    const firebaseConfig = {
      apiKey: "AIzaSyD4_h3WU2tkzE5G6jXimQUjYj2bUVliYUk",
      authDomain: "iedc-ux.firebaseapp.com",
      projectId: "iedc-ux",
      storageBucket: "iedc-ux.firebasestorage.app",
      messagingSenderId: "362260352304",
      appId: "1:362260352304:web:27374dbb9b51182807ccf5",
      measurementId: "G-2KH08MNGSX"
    };

    let useRealFirebase = sessionStorage.getItem("useRealFirebase") === "true";
    if (sessionStorage.getItem("useRealFirebase") === null) {
      useRealFirebase = firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith("YOUR_");
    }

    if (useRealFirebase) {
      try {
        if (!firebase.apps.length) {
          firebase.initializeApp(firebaseConfig);
        }
        console.log("Firebase initialized successfully in Admin console.");
      } catch (error) {
        console.error("Firebase initialization failed in Admin, falling back to simulator:", error);
        useRealFirebase = false;
      }
    }

    const db = useRealFirebase ? firebase.firestore() : null;
    const storage = useRealFirebase ? firebase.storage() : null;

    // SUPABASE STORAGE INITIALIZATION
    const supabaseUrl = "https://qcqneyayyaieekroyxdt.supabase.co";
    const supabaseKey = "Sb_publishable_0CE1Cl1OLGMRziQU2Y7jgg_vq8ePDBf";
    let supabaseClient = null;
    try {
      if (typeof window !== "undefined" && window.supabase) {
        supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
        console.log("Supabase client initialized successfully in admin console.");
      }
    } catch (err) {
      console.error("Failed to initialize Supabase client in admin:", err);
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
    
    // Cached Document Object Registry Elements mapping handles
    const tbody = document.getElementById('student-table-body');
    const totalEl = document.getElementById('stat-total');
    const approvedEl = document.getElementById('stat-approved');
    const pendingEl = document.getElementById('stat-pending');
    const searchInput = document.getElementById('table-search');

    let dynamicStudentsRegistry = [];
    let dynamicEventsRegistry = [];
    let dynamicTournamentsRegistry = [];
    let dynamicRegistrationsRegistry = [];

    // Open an active persistent real-time change-stream with Firestore collection endpoints
    function syncRegistrationWorkspace() {
      if (useRealFirebase) {
        db.collection('students').onSnapshot((snapshot) => {
          dynamicStudentsRegistry = [];
          let totalCount = 0;
          let approvedCount = 0;
          let pendingCount = 0;

          snapshot.forEach((doc) => {
            const profileData = doc.data();
            if (profileData.role === "admin" || profileData.email === "admin@rit.ac.in") return;
            const record = { uid: doc.id, ...profileData };
            dynamicStudentsRegistry.push(record);

            totalCount++;
            const isApproved = profileData.approved === true || profileData.status === 'approved';
            const isRejected = profileData.approved === false || profileData.status === 'rejected';
            const isPending = !isApproved && !isRejected;

            if (isApproved) approvedCount++;
            if (isPending) pendingCount++;
          });

          totalEl.textContent = totalCount;
          approvedEl.textContent = approvedCount;
          pendingEl.textContent = pendingCount;

          const criteria = searchInput.value.toLowerCase().trim();
          if (criteria) filterAndRenderTable(criteria);
          else renderActiveTable(dynamicStudentsRegistry);
        });

        // Sync Events & Tournaments for list and drop-downs
        db.collection('events').onSnapshot((snap) => {
          dynamicEventsRegistry = [];
          snap.forEach(doc => dynamicEventsRegistry.push({ id: doc.id, ...doc.data() }));
          populateDropdowns();
          renderActiveEventsList();
        });

        db.collection('tournaments').onSnapshot((snap) => {
          dynamicTournamentsRegistry = [];
          snap.forEach(doc => dynamicTournamentsRegistry.push({ id: doc.id, ...doc.data() }));
          populateDropdowns();
          renderActiveTournamentsList();
        });

        // Sync registrations global collection
        db.collection('registrations').onSnapshot((snap) => {
          dynamicRegistrationsRegistry = [];
          snap.forEach(doc => dynamicRegistrationsRegistry.push({ id: doc.id, ...doc.data() }));
          const activeFilter = document.getElementById("admin-event-filter").value;
          loadAttendeeList(activeFilter);
        });

      } else {
        syncSimulatorWorkspace();
      }
    }

    function syncSimulatorWorkspace() {
      function updateSimulatorData() {
        const mockUsers = JSON.parse(localStorage.getItem("firebase_mock_users") || "{}");
        dynamicStudentsRegistry = [];
        let totalCount = 0;
        let approvedCount = 0;
        let pendingCount = 0;

        for (const email in mockUsers) {
          const profileData = mockUsers[email].profileData;
          if (profileData && profileData.role !== "admin" && profileData.email !== "admin@rit.ac.in") {
            const record = { uid: mockUsers[email].uid, ...profileData };
            dynamicStudentsRegistry.push(record);

            totalCount++;
            const isApproved = profileData.approved === true || profileData.status === 'approved';
            const isRejected = profileData.approved === false || profileData.status === 'rejected';
            const isPending = !isApproved && !isRejected;

            if (isApproved) approvedCount++;
            if (isPending) pendingCount++;
          }
        }

        totalEl.textContent = totalCount;
        approvedEl.textContent = approvedCount;
        pendingEl.textContent = pendingCount;

        const criteria = searchInput.value.toLowerCase().trim();
        if (criteria) filterAndRenderTable(criteria);
        else renderActiveTable(dynamicStudentsRegistry);

        // Simulator events & tournaments sync
        dynamicEventsRegistry = JSON.parse(localStorage.getItem("firebase_mock_events") || "[]");
        dynamicTournamentsRegistry = JSON.parse(localStorage.getItem("firebase_mock_tournaments") || "[]");
        dynamicRegistrationsRegistry = JSON.parse(localStorage.getItem("firebase_mock_registrations") || "[]");

        populateDropdowns();
        renderActiveEventsList();
        renderActiveTournamentsList();

        const activeFilter = document.getElementById("admin-event-filter").value;
        loadAttendeeList(activeFilter);
      }

      updateSimulatorData();
      setInterval(updateSimulatorData, 1500); // Polling simulation
    }

    function populateDropdowns() {
      const dropdown = document.getElementById("admin-event-filter");
      const currentSelected = dropdown.value;
      
      dropdown.innerHTML = `<option value="">Choose workshop or cup...</option>`;
      
      dynamicEventsRegistry.forEach(evt => {
        dropdown.innerHTML += `<option value="${evt.id}">[Workshop/Talk] ${evt.title}</option>`;
      });

      dynamicTournamentsRegistry.forEach(tour => {
        dropdown.innerHTML += `<option value="${tour.id}">[Tournament] ${tour.title}</option>`;
      });

      dropdown.value = currentSelected;
    }

    // Dynamic Element Generator Loop for Rows Context
    function renderActiveTable(recordsList) {
      tbody.innerHTML = '';

      if (recordsList.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="6" style="text-align: center; color: var(--muted-white); padding: 32px;">
              No matching user profile records found.
            </td>
          </tr>`;
        return;
      }

      recordsList.forEach((student) => {
        const row = document.createElement('tr');
        
        let status = 'pending';
        if (student.approved === true || student.status === 'approved') status = 'approved';
        else if (student.approved === false || student.status === 'rejected') status = 'rejected';

        let badgeClass = 'badge-pending';
        if (status === 'approved') badgeClass = 'badge-approved';
        if (status === 'rejected') badgeClass = 'badge-rejected';

        const fullName = student.name || 'UNREGISTERED PROFILE';
        const studentEmail = student.email || 'N/A';
        const ktuID = student.registerNo || student.id || student.ktuId || 'N/A';
        const deptName = student.department || 'N/A';
        const academicYear = student.yearOfStudy || student.year || 'N/A';
        const collegeBranch = student.collegeName || student.college || 'Rajiv Gandhi Institute of Technology';

        row.innerHTML = `
          <td>
            <div style="font-weight: 700; color: white; text-transform: uppercase;">${fullName}</div>
            <div style="font-size: 11px; color: var(--muted-white);">${studentEmail}</div>
          </td>
          <td style="font-family: monospace; font-weight: 600; color: #E8614A;">${ktuID}</td>
          <td>
            <div>${deptName}</div>
            <div style="font-size: 11px; color: var(--muted-white);">${academicYear}</div>
          </td>
          <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${collegeBranch}</td>
          <td><span class="badge-status ${badgeClass}">${status}</span></td>
          <td style="text-align: right;">
            <div style="display: flex; gap: 6px; justify-content: flex-end;">
              ${status !== 'approved' ? `
                <button class="admin-table-btn admin-table-btn-approve" onclick="mutateProfileStatus('${student.uid}', 'approved')">Approve</button>
              ` : ''}
              ${status !== 'rejected' ? `
                <button class="admin-table-btn admin-table-btn-reject" onclick="mutateProfileStatus('${student.uid}', 'rejected')">Reject</button>
              ` : ''}
            </div>
          </td>
        `;
        tbody.appendChild(row);
      });
    }

    // Direct Remote Operations Transaction functions
    window.mutateProfileStatus = function(targetUID, nextState) {
      const updateData = {
        status: nextState,
        approved: nextState === 'approved'
      };

      let mockUsers = JSON.parse(localStorage.getItem("firebase_mock_users") || "{}");
      for (const email in mockUsers) {
        if (mockUsers[email].uid === targetUID) {
          mockUsers[email].profileData = { ...mockUsers[email].profileData, ...updateData };
          break;
        }
      }
      localStorage.setItem("firebase_mock_users", JSON.stringify(mockUsers));

      if (useRealFirebase) {
        db.collection('students').doc(targetUID).update(updateData)
        .then(() => console.log(`Profile ${targetUID} status mutated to ${nextState}`))
        .catch((err) => console.error("Mutation failed: ", err));
      }
    };

    function filterAndRenderTable(criteria) {
      const matchedCollection = dynamicStudentsRegistry.filter(record => {
        return (
          (record.name && record.name.toLowerCase().includes(criteria)) ||
          (record.registerNo && record.registerNo.toLowerCase().includes(criteria)) ||
          (record.id && record.id.toLowerCase().includes(criteria)) ||
          (record.ktuId && record.ktuId.toLowerCase().includes(criteria)) ||
          (record.department && record.department.toLowerCase().includes(criteria)) ||
          (record.email && record.email.toLowerCase().includes(criteria))
        );
      });
      renderActiveTable(matchedCollection);
    }

    searchInput.addEventListener('input', (event) => {
      const criteria = event.target.value.toLowerCase().trim();
      filterAndRenderTable(criteria);
    });

    // Attendee auditing engine (load registrations of specific event)
    window.loadAttendeeList = function(selectedEventId) {
      const attendeeTbody = document.getElementById("attendee-table-body");
      if (!attendeeTbody) return;

      if (!selectedEventId) {
        attendeeTbody.innerHTML = `
          <tr>
            <td colspan="7" style="text-align: center; color: var(--muted-white); padding: 32px;">
              Please select an event above to view attendee auditing ledger.
            </td>
          </tr>`;
        return;
      }

      // Filter global registrations list
      const matches = dynamicRegistrationsRegistry.filter(reg => reg.eventId === selectedEventId);

      attendeeTbody.innerHTML = "";
      if (matches.length === 0) {
        attendeeTbody.innerHTML = `
          <tr>
            <td colspan="7" style="text-align: center; color: var(--muted-white); padding: 32px;">
              No attendees found for this event yet.
            </td>
          </tr>`;
        return;
      }

      matches.forEach(reg => {
        const row = document.createElement("tr");
        const name = reg.studentName || "Unknown Student";
        const ktu = reg.registerNo || "N/A";
        const email = reg.studentEmail || "N/A";
        const phone = reg.phone || "N/A";
        const bankAccountName = reg.bankAccountName || "N/A";
        const payRef = reg.razorpayPaymentId || reg.utrNumber || "FREE CHECKOUT";
        const isCheckedIn = reg.checkedIn === true;
        const status = reg.status || "Confirmed";

        row.innerHTML = `
          <td><div style="font-weight: 700; text-transform: uppercase;">${name}</div></td>
          <td style="font-family: monospace; font-weight: 600; color: #E8614A;">${ktu}</td>
          <td>
            <div>${email}</div>
            <div style="font-size: 11px; color: var(--muted-white);">${phone}</div>
          </td>
          <td><div style="font-weight: 600; color: var(--nova-yellow);">${bankAccountName}</div></td>
          <td style="font-size: 12px; font-family: monospace;">${payRef}</td>
          <td>
            <div style="display: flex; flex-direction: column; gap: 4px;">
              <span class="badge-status ${status === 'Confirmed' ? 'badge-approved' : 'badge-pending'}">
                ${status === 'Confirmed' ? 'Confirmed' : 'Pending'}
              </span>
              <span class="badge-status ${isCheckedIn ? 'badge-approved' : 'badge-pending'}">
                ${isCheckedIn ? 'Checked In' : 'Not Checked In'}
              </span>
            </div>
          </td>
          <td style="text-align: right;">
            <div style="display: flex; gap: 6px; justify-content: flex-end;">
              ${status === 'Pending' ? `
                <button class="admin-table-btn" onclick="approveRegistrationManually('${reg.id || reg.registrationId}')" style="background: rgba(74, 232, 138, 0.15); border: 1px solid var(--success); color: var(--success);">
                  Approve Pay
                </button>
              ` : ''}
              <button class="admin-table-btn" onclick="toggleCheckInManually('${reg.id || reg.registrationId}', ${isCheckedIn})" style="background: rgba(255,255,255,0.05); color: white;">
                ${isCheckedIn ? 'Undo Check-In' : 'Check In'}
              </button>
              <button class="admin-table-btn admin-table-btn-reject" onclick="deleteRegistrationManually('${reg.id || reg.registrationId}')" style="background: rgba(232, 74, 74, 0.15); border: 1px solid var(--error); color: var(--error);">
                🗑️ Delete
              </button>
            </div>
          </td>
        `;
        attendeeTbody.appendChild(row);
      });
    };

    window.toggleCheckInManually = async function(regId, currentVal) {
      const nextVal = !currentVal;
      
      // Update local storage simulator
      let mockRegs = JSON.parse(localStorage.getItem("firebase_mock_registrations") || "[]");
      const foundIdx = mockRegs.findIndex(r => r.registrationId === regId || r.id === regId);
      if (foundIdx !== -1) {
        mockRegs[foundIdx].checkedIn = nextVal;
        localStorage.setItem("firebase_mock_registrations", JSON.stringify(mockRegs));
      }

      if (useRealFirebase) {
        try {
          await db.collection("registrations").doc(regId).update({ checkedIn: nextVal });
        } catch (e) {
          console.error("Manual checkin update failed:", e);
        }
      } else {
        // Trigger real-time UI refresh in Simulator Mode
        const dropdown = document.getElementById("admin-event-filter");
        if (dropdown) loadAttendeeList(dropdown.value);
      }
    };

    window.approveRegistrationManually = async function(regId) {
      if (!confirm("Are you sure you want to approve this pending registration payment?")) return;

      // Update local storage simulator
      let mockRegs = JSON.parse(localStorage.getItem("firebase_mock_registrations") || "[]");
      const foundIdx = mockRegs.findIndex(r => r.registrationId === regId || r.id === regId);
      if (foundIdx !== -1) {
        mockRegs[foundIdx].status = "Confirmed";
        mockRegs[foundIdx].payment_status = "Success";
        localStorage.setItem("firebase_mock_registrations", JSON.stringify(mockRegs));
      }

      if (useRealFirebase) {
        try {
          await db.collection("registrations").doc(regId).update({ status: "Confirmed", payment_status: "Success" });
          console.log(`Successfully approved registration doc ${regId} in Firestore.`);
        } catch (e) {
          console.error("Firestore approve registration failed:", e);
          alert("Error approving registration: " + e.message);
        }
      } else {
        // Trigger real-time UI refresh in Simulator Mode
        const dropdown = document.getElementById("admin-event-filter");
        if (dropdown) loadAttendeeList(dropdown.value);
      }
    };

    window.deleteRegistrationManually = async function(regId) {
      if (!confirm("Are you sure you want to delete this registration permanently?")) return;

      // Update local storage simulator
      let mockRegs = JSON.parse(localStorage.getItem("firebase_mock_registrations") || "[]");
      mockRegs = mockRegs.filter(r => r.registrationId !== regId && r.id !== regId);
      localStorage.setItem("firebase_mock_registrations", JSON.stringify(mockRegs));

      if (useRealFirebase) {
        try {
          await db.collection("registrations").doc(regId).delete();
          console.log(`Successfully deleted registration doc ${regId} from Firestore.`);
        } catch (e) {
          console.error("Firestore delete registration failed:", e);
          alert("Error deleting registration: " + e.message);
        }
      } else {
        // Trigger real-time UI refresh in Simulator Mode
        const dropdown = document.getElementById("admin-event-filter");
        if (dropdown) loadAttendeeList(dropdown.value);
      }
    };

    // Print utility (Auditing)
    window.printAttendeeList = function() {
      const dropdown = document.getElementById("admin-event-filter");
      const eventTitle = dropdown.options[dropdown.selectedIndex].text;
      
      if (!dropdown.value) {
        alert("Please select an active event or tournament first!");
        return;
      }

      const printWindow = window.open("", "_blank");
      const tableHtml = document.getElementById("printable-attendee-area").innerHTML;

      printWindow.document.write(`
        <html>
        <head>
          <title>Attendee Print Sheet</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #000; background: #fff; }
            h1 { font-size: 20px; text-transform: uppercase; margin-bottom: 4px; }
            p { font-size: 12px; margin-bottom: 24px; color: #555; }
            table { width: 100%; border-collapse: collapse; text-align: left; }
            th, td { padding: 10px; border-bottom: 1px solid #ddd; font-size: 12px; }
            th { text-transform: uppercase; font-weight: bold; background: #f5f5f5; }
            .badge-status { font-weight: bold; }
            .admin-table-btn { display: none; } /* Hide interactive buttons in print */
          </style>
        </head>
        <body>
          <h1>${eventTitle}</h1>
          <p>IEDC RIT Event Platform — Participant Roster Print Ledger (Generated: ${new Date().toLocaleString()})</p>
          ${tableHtml}
          \x3cscript\x3e
            window.onload = function() {
              window.print();
              setTimeout(() => window.close(), 500);
            };
          \x3c/script\x3e
        \x3c/body\x3e
        \x3c/html\x3e
      `);
      printWindow.document.close();
    };

    // Export Excel (CSV) Spreadsheet utility
    window.exportAttendeeList = function() {
      const dropdown = document.getElementById("admin-event-filter");
      const eventTitle = dropdown.options[dropdown.selectedIndex].text;
      
      if (!dropdown.value) {
        alert("Please select an active event or tournament first!");
        return;
      }

      const matches = dynamicRegistrationsRegistry.filter(reg => reg.eventId === dropdown.value);

      if (matches.length === 0) {
        alert("No attendees available to export.");
        return;
      }

      // Compile CSV content
      let csv = "Student Name,KTU ID,Email,Phone,Account Holder Name,Payment Reference Code,Checked-In Gate\n";
      matches.forEach(reg => {
        const name = (reg.studentName || "").replace(/,/g, " ");
        const ktu = (reg.registerNo || "").replace(/,/g, " ");
        const email = (reg.studentEmail || "").replace(/,/g, " ");
        const phone = (reg.phone || "").replace(/,/g, " ");
        const bankName = (reg.bankAccountName || "").replace(/,/g, " ");
        const payRef = (reg.razorpayPaymentId || reg.utrNumber || "FREE").replace(/,/g, " ");
        const checked = reg.checkedIn === true ? "YES" : "NO";

        csv += `"${name}","${ktu}","${email}","${phone}","${bankName}","${payRef}","${checked}"\n`;
      });

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `Attendees_${eventTitle.replace(/[^a-zA-Z0-9]+/g, "_")}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    // Switch Workspace Drawer Tabs
    window.switchAdminWorkspaceTab = function(tabId) {
      const tabs = ["registrations", "events", "tournaments", "auditing", "scanner", "merchandise"];
      tabs.forEach(t => {
        const tabEl = document.getElementById(`nav-tab-${t}`);
        const viewEl = document.getElementById(`workspace-${t}`);
        if (t === tabId) {
          if (tabEl) tabEl.classList.add("active");
          if (viewEl) viewEl.style.display = t === "registrations" ? "flex" : "block";
        } else {
          if (tabEl) tabEl.classList.remove("active");
          if (viewEl) viewEl.style.display = "none";
        }
      });

      // Stop camera if navigation switches away from scanner
      if (tabId !== "scanner") {
        stopScanner();
      }

      // Update workspace header breadcrumbs and titles
      const breadcrumb = document.getElementById("admin-workspace-breadcrumb");
      const title = document.getElementById("admin-workspace-title");
      if (tabId === "registrations") {
        if (breadcrumb) breadcrumb.textContent = "Console / Approvals";
        if (title) title.textContent = "Active Student Approvals";
      } else if (tabId === "auditing") {
        if (breadcrumb) breadcrumb.textContent = "Console / Auditing";
        if (title) title.textContent = "Event Attendee Auditing";
      } else if (tabId === "events") {
        if (breadcrumb) breadcrumb.textContent = "Console / Events";
        if (title) title.textContent = "IEDC Event Studio";
      } else if (tabId === "tournaments") {
        if (breadcrumb) breadcrumb.textContent = "Console / Tournaments";
        if (title) title.textContent = "Tournament Studio";
      } else if (tabId === "scanner") {
        if (breadcrumb) breadcrumb.textContent = "Console / Scanner";
        if (title) title.textContent = "Volunteer Check-In Gate";
      } else if (tabId === "merchandise") {
        if (breadcrumb) breadcrumb.textContent = "Console / Merchandise";
        if (title) title.textContent = "Merchandise Management Hub";
      }
    };

    // Toggle maximum team size field
    window.toggleTeamSizeField = function(type) {
      const hasTeam = document.getElementById("eventHasTeam").value === "true";
      const teamGroup = document.getElementById("event-team-size-group");
      const maxTeamInput = document.getElementById("eventMaxTeam");
      if (hasTeam) {
        teamGroup.style.display = "flex";
        maxTeamInput.required = true;
      } else {
        teamGroup.style.display = "none";
        maxTeamInput.required = false;
        maxTeamInput.value = "";
      }
    };

    // --- EVENT CRUD ENGINE ---
    window.handleEventPublish = async function(event) {
      event.preventDefault();
      
      const submitBtn = document.getElementById("btn-event-submit");
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = "Processing...";

      try {
        const editId = document.getElementById("editEventId").value;
        const title = document.getElementById("eventTitle").value.trim();
        const type = document.getElementById("eventType").value;
        const speakerName = document.getElementById("speakerName").value.trim();
        const speakerQual = document.getElementById("speakerQual").value.trim();
        const speakerLinkedin = document.getElementById("speakerLinkedin").value.trim();
        const upiId = document.getElementById("eventUpiId").value.trim();
        const dateInput = document.getElementById("eventDate").value;
        const timeInput = document.getElementById("eventTime").value;
        const seats = parseInt(document.getElementById("eventSeats").value);
        const fee = parseInt(document.getElementById("eventFee").value);
        const location = document.getElementById("eventLocation").value.trim();
        const mode = document.getElementById("eventMode").value;
        const fileInput = document.getElementById("event-poster-file");
        const file = fileInput ? fileInput.files[0] : null;
        let poster = document.getElementById("eventPoster").value.trim();

        if (file) {
          console.log("Uploading event poster to Supabase...");
          submitBtn.textContent = "Uploading to Supabase...";
          try {
            poster = await uploadToSupabase(file, "event posters");
            console.log("Supabase upload success. URL:", poster);
          } catch (supabaseErr) {
            console.error("Supabase Storage upload failed, falling back to mock Reader:", supabaseErr);
            submitBtn.textContent = "Uploading image (mock)...";
            poster = await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result);
              reader.onerror = (e) => reject(e);
              reader.readAsDataURL(file);
            });
          }
        } else if (!editId && !poster) {
          alert("Please select an event poster image file to upload.");
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
          return;
        }
        const hasTeam = document.getElementById("eventHasTeam").value === "true";
        const maxTeamSize = hasTeam ? parseInt(document.getElementById("eventMaxTeam").value) : 1;
        const description = document.getElementById("eventDescription").value.trim();

        // Format dates into human readable values
        const dateObj = new Date(dateInput);
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        const formattedDate = dateObj.toLocaleDateString('en-US', options); 
        const isoDate = `${dateInput}T${timeInput}:00`;

        // Format 24h input time to 12h AM/PM string
        const [hours24, minutes] = timeInput.split(":");
        let hours12 = parseInt(hours24);
        const ampm = hours12 >= 12 ? 'PM' : 'AM';
        hours12 = hours12 % 12;
        hours12 = hours12 ? hours12 : 12; 
        const formattedTime = `${hours12 < 10 ? '0' + hours12 : hours12}:${minutes} ${ampm}`;

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
          timestamp: useRealFirebase ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString()
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

        if (useRealFirebase) {
          await db.collection("events").doc(eventSlug).set(eventData);
        }

        alert(editId ? "Event updated successfully!" : "Event published successfully!");
        resetEventFormState();
      } catch (error) {
        console.error("Event save failed:", error);
        alert("Error saving event: " + error.message);
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    };

    window.editEventItem = function(eventId) {
      const match = dynamicEventsRegistry.find(ev => ev.id === eventId);
      if (!match) return;

      document.getElementById("editEventId").value = match.id;
      document.getElementById("eventTitle").value = match.title;
      document.getElementById("eventType").value = match.type;
      
      // Parse host string back to name/qual
      const parts = (match.host || "").split(", ");
      document.getElementById("speakerName").value = parts[0] || "";
      document.getElementById("speakerQual").value = parts.slice(1).join(", ") || "";
      
      document.getElementById("speakerLinkedin").value = match.speakerLinkedin || "";
      document.getElementById("eventUpiId").value = match.upiId || match.upi || "";
      
      // Try setting date and time back to inputs
      if (match.isoDate) {
        const dtParts = match.isoDate.split("T");
        document.getElementById("eventDate").value = dtParts[0] || "";
        document.getElementById("eventTime").value = (dtParts[1] || "").substring(0, 5) || "";
      }
      
      document.getElementById("eventSeats").value = match.seats || 50;
      document.getElementById("eventFee").value = match.fee !== undefined ? match.fee : (match.reg_fee !== undefined ? match.reg_fee : (match.price && String(match.price).match(/\d+/) ? parseInt(String(match.price).match(/\d+/)[0]) : 0));
      document.getElementById("eventLocation").value = match.location || "";
      document.getElementById("eventMode").value = match.mode || "offline";
      const savedPoster = match.poster || match.poster_url || "";
      document.getElementById("eventPoster").value = savedPoster;
      const previewImg = document.getElementById("event-poster-preview");
      if (previewImg && savedPoster) {
        previewImg.src = savedPoster;
        previewImg.style.display = "block";
      } else if (previewImg) {
        previewImg.src = "";
        previewImg.style.display = "none";
      }
      document.getElementById("eventHasTeam").value = match.hasTeam ? "true" : "false";
      
      if (match.hasTeam) {
        document.getElementById("event-team-size-group").style.display = "flex";
        document.getElementById("eventMaxTeam").value = match.maxTeamSize || 4;
      } else {
        document.getElementById("event-team-size-group").style.display = "none";
      }

      document.getElementById("eventDescription").value = match.description || "";

      // Shifting workspace UI into Update Document Mode
      document.getElementById("event-form-title").innerHTML = `Update Event: <span style="color:var(--soft-purple);">${match.title}</span>`;
      document.getElementById("btn-event-submit").textContent = "Update Event";
      document.getElementById("btn-cancel-event-edit").style.display = "block";
      
      // Scroll to form
      document.getElementById("addEventForm").scrollIntoView({ behavior: 'smooth' });
    };

    window.resetEventFormState = function() {
      document.getElementById("addEventForm").reset();
      document.getElementById("editEventId").value = "";
      document.getElementById("event-team-size-group").style.display = "none";
      document.getElementById("event-form-title").textContent = "IEDC Event Studio";
      document.getElementById("btn-event-submit").textContent = "Publish Event";
      document.getElementById("btn-cancel-event-edit").style.display = "none";
      const previewImg = document.getElementById("event-poster-preview");
      if (previewImg) {
        previewImg.src = "";
        previewImg.style.display = "none";
      }
      if (!useRealFirebase) syncRegistrationWorkspace(); // Trigger re-render in mock
    };

    window.deleteEventItem = async function(eventId) {
      if (!confirm("Are you sure you want to delete this event permanently?")) return;

      // Update mock storage
      let mockEvents = JSON.parse(localStorage.getItem("firebase_mock_events") || "[]");
      mockEvents = mockEvents.filter(ev => ev.id !== eventId);
      localStorage.setItem("firebase_mock_events", JSON.stringify(mockEvents));

      if (useRealFirebase) {
        try {
          await db.collection("events").doc(eventId).delete();
          console.log(`Deleted event ${eventId} from Firestore`);
        } catch (e) {
          console.error("Firestore delete failed:", e);
        }
      } else {
        syncRegistrationWorkspace();
      }
      alert("Event deleted successfully!");
    };

    function renderActiveEventsList() {
      const container = document.getElementById("active-events-list");
      if (!container) return;
      
      container.innerHTML = "";
      if (dynamicEventsRegistry.length === 0) {
        container.innerHTML = `<div style="grid-column: 1/-1; color: var(--muted-white); font-size:12px;">No active events found in publisher matrix.</div>`;
        return;
      }

      dynamicEventsRegistry.forEach(ev => {
        const card = document.createElement("div");
        card.className = "admin-item-card";
        card.innerHTML = `
          <div class="admin-item-card-title">${ev.title}</div>
          <div class="admin-item-card-meta">
            <div>Category: ${ev.typeLabel}</div>
            <div>Date: ${ev.date}</div>
            <div>Seats: ${ev.seats} Left</div>
          </div>
          <div class="admin-item-card-actions">
            <button class="btn-action-icon btn-edit-item" onclick="editEventItem('${ev.id}')">✏️ Edit</button>
            <button class="btn-action-icon btn-delete-item" onclick="deleteEventItem('${ev.id}')">🗑️ Del</button>
          </div>
        `;
        container.appendChild(card);
      });
    }


    // --- TOURNAMENT CRUD ENGINE ---
    window.handleTournamentPublish = async function(event) {
      event.preventDefault();

      const submitBtn = document.getElementById("btn-tournament-submit");
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = "Publishing...";

      try {
        const editId = document.getElementById("editTournamentId").value;
        const title = document.getElementById("tournamentTitle").value.trim();
        const fee = parseInt(document.getElementById("tournamentFee").value);
        const upiId = document.getElementById("tournamentUpiId").value.trim();
        const fileInput = document.getElementById("tournament-poster-file");
        const file = fileInput ? fileInput.files[0] : null;
        let poster = document.getElementById("tournamentPoster").value.trim();

        if (file) {
          console.log("Uploading tournament image to Supabase...");
          submitBtn.textContent = "Uploading to Supabase...";
          try {
            poster = await uploadToSupabase(file, "tournament images");
            console.log("Supabase upload success. URL:", poster);
          } catch (supabaseErr) {
            console.error("Supabase Storage upload failed, falling back to mock Reader:", supabaseErr);
            submitBtn.textContent = "Uploading image (mock)...";
            poster = await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result);
              reader.onerror = (e) => reject(e);
              reader.readAsDataURL(file);
            });
          }
        } else if (!editId && !poster) {
          alert("Please select a tournament image file to upload.");
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
          return;
        }

        const maxTeamSize = parseInt(document.getElementById("tournamentMaxTeam").value);
        const mode = document.getElementById("tournamentMode").value;
        const location = document.getElementById("tournamentLocation").value.trim();

        const tournamentSlug = editId ? editId : (title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random() * 1000));

        const tournamentData = {
          id: tournamentSlug,
          eventId: tournamentSlug,
          title,
          price: fee === 0 ? "Free" : `₹${fee}`,
          fee,
          upiId,
          upi: upiId,
          poster,
          poster_url: poster,
          hasTeam: maxTeamSize > 1,
          maxTeamSize,
          mode,
          location,
          type: "tournament",
          typeLabel: "Tournament",
          color: maxTeamSize > 1 ? "#8B6FD4" : "#C8E84A",
          timestamp: useRealFirebase ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString()
        };

        // Save mock tournaments
        let mockTournaments = JSON.parse(localStorage.getItem("firebase_mock_tournaments") || "[]");
        if (editId) {
          const idx = mockTournaments.findIndex(t => t.id === editId);
          if (idx !== -1) mockTournaments[idx] = tournamentData;
        } else {
          mockTournaments.push(tournamentData);
        }
        localStorage.setItem("firebase_mock_tournaments", JSON.stringify(mockTournaments));

        if (useRealFirebase) {
          await db.collection("tournaments").doc(tournamentSlug).set(tournamentData);
        }

        alert(editId ? "Tournament updated successfully!" : "Tournament published successfully!");
        resetTournamentFormState();
      } catch (error) {
        console.error("Tournament save failed:", error);
        alert("Error saving tournament: " + error.message);
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    };

    window.editTournamentItem = function(tourId) {
      const match = dynamicTournamentsRegistry.find(t => t.id === tourId);
      if (!match) return;

      document.getElementById("editTournamentId").value = match.id;
      document.getElementById("tournamentTitle").value = match.title;
      
      document.getElementById("tournamentFee").value = match.fee !== undefined ? match.fee : (match.reg_fee !== undefined ? match.reg_fee : 0);
      
      document.getElementById("tournamentUpiId").value = match.upiId || match.upi || "";
      const savedPoster = match.poster || match.poster_url || "";
      document.getElementById("tournamentPoster").value = savedPoster;
      const previewImg = document.getElementById("tournament-poster-preview");
      if (previewImg && savedPoster) {
        previewImg.src = savedPoster;
        previewImg.style.display = "block";
      } else if (previewImg) {
        previewImg.src = "";
        previewImg.style.display = "none";
      }
      document.getElementById("tournamentMaxTeam").value = String(match.maxTeamSize || 1);
      document.getElementById("tournamentMode").value = match.mode || "offline";
      document.getElementById("tournamentLocation").value = match.location || "";

      document.getElementById("tournament-form-title").innerHTML = `Update Tournament: <span style="color:var(--soft-purple);">${match.title}</span>`;
      document.getElementById("btn-tournament-submit").textContent = "Update Tournament";
      document.getElementById("btn-cancel-tournament-edit").style.display = "block";

      document.getElementById("addTournamentForm").scrollIntoView({ behavior: 'smooth' });
    };

    window.resetTournamentFormState = function() {
      document.getElementById("addTournamentForm").reset();
      document.getElementById("editTournamentId").value = "";
      document.getElementById("tournament-form-title").textContent = "Tournament Studio";
      document.getElementById("btn-tournament-submit").textContent = "Publish Tournament";
      document.getElementById("btn-cancel-tournament-edit").style.display = "none";
      const previewImg = document.getElementById("tournament-poster-preview");
      if (previewImg) {
        previewImg.src = "";
        previewImg.style.display = "none";
      }
      if (!useRealFirebase) syncRegistrationWorkspace();
    };

    window.deleteTournamentItem = async function(tourId) {
      if (!confirm("Are you sure you want to delete this tournament permanently?")) return;

      let mockTournaments = JSON.parse(localStorage.getItem("firebase_mock_tournaments") || "[]");
      mockTournaments = mockTournaments.filter(t => t.id !== tourId);
      localStorage.setItem("firebase_mock_tournaments", JSON.stringify(mockTournaments));

      if (useRealFirebase) {
        try {
          await db.collection("tournaments").doc(tourId).delete();
        } catch (e) {
          console.error("Firestore delete failed:", e);
        }
      } else {
        syncRegistrationWorkspace();
      }
      alert("Tournament deleted successfully!");
    };

    function renderActiveTournamentsList() {
      const container = document.getElementById("active-tournaments-list");
      if (!container) return;

      container.innerHTML = "";
      if (dynamicTournamentsRegistry.length === 0) {
        container.innerHTML = `<div style="grid-column: 1/-1; color: var(--muted-white); font-size:12px;">No active tournaments found in publisher matrix.</div>`;
        return;
      }

      dynamicTournamentsRegistry.forEach(t => {
        const card = document.createElement("div");
        card.className = "admin-item-card";
        card.innerHTML = `
          <div class="admin-item-card-title">${t.title}</div>
          <div class="admin-item-card-meta">
            <div>Fee: ${t.price}</div>
            <div>Mode: ${t.mode}</div>
            <div>Team Size: Max ${t.maxTeamSize}</div>
          </div>
          <div class="admin-item-card-actions">
            <button class="btn-action-icon btn-edit-item" onclick="editTournamentItem('${t.id}')">✏️ Edit</button>
            <button class="btn-action-icon btn-delete-item" onclick="deleteTournamentItem('${t.id}')">🗑️ Del</button>
          </div>
        `;
        container.appendChild(card);
      });
    }


    // --- MULTI-GATE CAMERA VOLUNTEER SCANNER GATING ---
    let html5QrScanner = null;

    window.startScanner = function() {
      if (html5QrScanner) {
        stopScanner();
      }

      html5QrScanner = new Html5Qrcode("qr-reader");
      const successCallback = (decodedText) => {
        processVolunteerScan(decodedText);
      };
      
      const config = { fps: 10, qrbox: { width: 230, height: 230 } };
      
      html5QrScanner.start({ facingMode: "environment" }, config, successCallback)
      .then(() => console.log("QR scanner started on camera channel."))
      .catch((err) => {
        console.error("Camera channel registration failed:", err);
        alert("Camera channel denied or unavailable. Scan tickets manually inside auditing tab.");
      });
    };

    window.stopScanner = function() {
      if (html5QrScanner) {
        html5QrScanner.stop().then(() => {
          html5QrScanner = null;
        }).catch(err => console.error("Error shutting down camera scanner:", err));
      }
    };

    window.processVolunteerScan = async function(scannedText) {
      console.log(`Scan captured raw code: ${scannedText}`);
      
      let registrationId = scannedText;
      // Securely decrypt scanned text using CryptoJS AES with the same campus-wide key
      try {
        const decryptedBytes = CryptoJS.AES.decrypt(scannedText, "RITU_GATEWAY_SECURE_2026_KEY");
        const decryptedId = decryptedBytes.toString(CryptoJS.enc.Utf8);
        if (decryptedId && decryptedId.startsWith("reg-")) {
          registrationId = decryptedId;
          console.log(`Decrypted scanned ticket ID: ${registrationId}`);
        }
      } catch (e) {
        console.warn("Direct ID scan or decryption bypass, using raw text:", e);
      }
      
      let attendeeRecord = null;
      let isMock = false;

      // Check locally first
      let mockRegs = JSON.parse(localStorage.getItem("firebase_mock_registrations") || "[]");
      const foundIdx = mockRegs.findIndex(r => r.registrationId === registrationId || r.id === registrationId);
      if (foundIdx !== -1) {
        attendeeRecord = mockRegs[foundIdx];
        isMock = true;
      }

      if (useRealFirebase) {
        try {
          const doc = await db.collection("registrations").doc(registrationId).get();
          if (doc.exists) {
            attendeeRecord = doc.data();
            attendeeRecord.id = doc.id;
            isMock = false;
          }
        } catch (e) {
          console.error("Firestore scanned ticket validation failed:", e);
        }
      }

      if (!attendeeRecord) {
        alert(`Verification Error: Scanned ticket ID ${registrationId} is invalid.`);
        return;
      }

      const attendeeName = attendeeRecord.studentName || "Attendee";
      const isAlreadyCheckedIn = attendeeRecord.checkedIn === true;

      if (!isAlreadyCheckedIn) {
        // Mark as Checked In
        if (isMock) {
          mockRegs[foundIdx].checkedIn = true;
          localStorage.setItem("firebase_mock_registrations", JSON.stringify(mockRegs));
        }

        if (useRealFirebase) {
          try {
            await db.collection("registrations").doc(registrationId).update({ checkedIn: true });
          } catch (e) {
            console.error("Firestore checked-in status write failed:", e);
          }
        }

        // Render Green Overlay "Access Granted ✔️"
        const successOverlay = document.getElementById("scanner-overlay-success");
        document.getElementById("success-attendee-name").textContent = attendeeName.toUpperCase();
        successOverlay.style.display = "flex";
        
        setTimeout(() => {
          successOverlay.style.display = "none";
        }, 2200);
      } else {
        // Render Red Overlay "Already Scanned! ❌"
        const errorOverlay = document.getElementById("scanner-overlay-error");
        document.getElementById("error-attendee-name").textContent = attendeeName.toUpperCase();
        errorOverlay.style.display = "flex";

        setTimeout(() => {
          errorOverlay.style.display = "none";
        }, 2200);
      }
    };


    // Verification check to secure admin panel
    function verifyAdminAccess() {
      if (sessionStorage.getItem("adminPasswordVerified") === "true") {
        const authOverlay = document.getElementById("login-overlay") || document.getElementById("admin-auth-overlay");
        if (authOverlay) authOverlay.style.display = "none";
        syncRegistrationWorkspace();
        return;
      }

      const authOverlay = document.getElementById("login-overlay") || document.getElementById("admin-auth-overlay");
      if (authOverlay) authOverlay.style.display = "flex";
      
      const passwordInput = document.getElementById("admin-password-input") || document.getElementById("admin-gate-password");
      if (passwordInput) passwordInput.focus();
    }

    window.handleAdminPasswordSubmit = function(event) {
      if (event && typeof event.preventDefault === "function") {
        event.preventDefault();
      }
      const passwordInput = document.getElementById("admin-password-input") || document.getElementById("admin-gate-password");
      const errorDiv = document.getElementById("admin-auth-error");
      const authOverlay = document.getElementById("login-overlay") || document.getElementById("admin-auth-overlay");

      if (!passwordInput) return;

      if (passwordInput.value === "12345678" || passwordInput.value === "നിന്റെ_പാസ്വേർഡ്") {
        sessionStorage.setItem("adminPasswordVerified", "true");
        if (errorDiv) errorDiv.style.display = "none";
        if (authOverlay) authOverlay.style.display = "none";
        syncRegistrationWorkspace();
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
    };

    window.handleAdminLogin = function(event) {
      const evt = event || window.event;
      if (evt && typeof evt.preventDefault === "function") {
        evt.preventDefault();
      }

      const passwordInput = document.getElementById("admin-password-input") || document.getElementById("admin-gate-password");
      const errorDiv = document.getElementById("admin-auth-error");
      const loginOverlay = document.getElementById("login-overlay") || document.getElementById("admin-auth-overlay");

      if (!passwordInput) return;

      if (passwordInput.value === "12345678" || passwordInput.value === "നിന്റെ_പാസ്വേർഡ്") {
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
    };

    window.handleAdminSignOut = function() {
      sessionStorage.removeItem("loggedInUserUid");
      sessionStorage.removeItem("adminPasswordVerified");
      if (useRealFirebase) {
        firebase.auth().signOut().then(() => {
          window.location.href = "index.html";
        }).catch((err) => {
          console.error("Firebase Sign out failed:", err);
          window.location.href = "index.html";
        });
      } else {
        window.location.href = "index.html";
      }
    };

    // News Ticker & Announcements Management Logic
    window.handleNewsTickerUpdate = async function(event) {
      event.preventDefault();
      const text = document.getElementById("newsTickerInput").value.trim();
      const submitBtn = document.getElementById("btn-ticker-submit");
      submitBtn.disabled = true;
      submitBtn.textContent = "Updating...";

      try {
        if (useRealFirebase) {
          await db.collection("news_ticker").doc("current").set({ text });
        } else {
          localStorage.setItem("mock_news_ticker", text);
        }
        alert("News ticker updated successfully!");
      } catch (err) {
        console.error("Error updating news ticker:", err);
        alert("Error updating news ticker: " + err.message);
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Update News Ticker";
      }
    };

    window.handleAnnouncementAdd = async function(event) {
      event.preventDefault();
      const title = document.getElementById("announcementTitle").value.trim();
      const content = document.getElementById("announcementContent").value.trim();
      const submitBtn = document.getElementById("btn-announcement-submit");
      
      submitBtn.disabled = true;
      submitBtn.textContent = "Adding...";

      const newAnnouncement = {
        title,
        body: content,
        content,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };

      try {
        if (useRealFirebase) {
          await db.collection("announcements").add(newAnnouncement);
        } else {
          let mock = JSON.parse(localStorage.getItem("mock_announcements") || "[]");
          newAnnouncement.id = "ann-" + Math.floor(Math.random() * 900000 + 100000);
          mock.unshift(newAnnouncement);
          localStorage.setItem("mock_announcements", JSON.stringify(mock));
        }
        document.getElementById("announcementsForm").reset();
        alert("Announcement added successfully!");
      } catch (err) {
        console.error("Error adding announcement:", err);
        alert("Error adding announcement: " + err.message);
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Add Announcement";
      }
    };

    window.deleteAnnouncement = async function(id) {
      if (!confirm("Are you sure you want to delete this announcement?")) return;

      try {
        if (useRealFirebase) {
          await db.collection("announcements").doc(id).delete();
        } else {
          let mock = JSON.parse(localStorage.getItem("mock_announcements") || "[]");
          mock = mock.filter(a => a.id !== id);
          localStorage.setItem("mock_announcements", JSON.stringify(mock));
        }
        alert("Announcement deleted successfully!");
      } catch (err) {
        console.error("Error deleting announcement:", err);
        alert("Error deleting announcement: " + err.message);
      }
    };

    function syncAdminNewsTickerAndAnnouncements() {
      if (useRealFirebase) {
        db.collection("news_ticker").doc("current").onSnapshot((doc) => {
          if (doc.exists) {
            const data = doc.data();
            const input = document.getElementById("newsTickerInput");
            if (input && data && data.text) {
              input.value = data.text;
            }
          }
        });

        db.collection("announcements").orderBy("timestamp", "desc").onSnapshot((snapshot) => {
          const list = [];
          snapshot.forEach(doc => {
            list.push({ id: doc.id, ...doc.data() });
          });
          renderAdminAnnouncementsTable(list);
        });
      } else {
        syncMockNewsTickerAndAnnouncements();
      }
    }

    function syncMockNewsTickerAndAnnouncements() {
      function updateMockData() {
        const mockTicker = localStorage.getItem("mock_news_ticker") || "";
        const input = document.getElementById("newsTickerInput");
        if (input && mockTicker) {
          input.value = mockTicker;
        }

        const mockAnnouncements = JSON.parse(localStorage.getItem("mock_announcements") || "[]");
        renderAdminAnnouncementsTable(mockAnnouncements);
      }
      updateMockData();
      setInterval(updateMockData, 1500);
    }

    function renderAdminAnnouncementsTable(list) {
      const tbody = document.getElementById("admin-announcements-list");
      if (!tbody) return;
      tbody.innerHTML = "";

      if (list.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="4" style="text-align: center; color: var(--muted-white); padding: 16px;">
              No announcements found.
            </td>
          </tr>`;
        return;
      }

      list.forEach(item => {
        const row = document.createElement("tr");
        let dateStr = "Just Now";
        if (item.timestamp) {
          dateStr = new Date(item.timestamp).toLocaleString();
        }
        row.innerHTML = `
          <td><div style="font-weight: 700; color: white;">${item.title}</div></td>
          <td><div style="color: var(--muted-white); max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${item.body || item.content}</div></td>
          <td><div>${dateStr}</div></td>
          <td style="text-align: right;">
            <button class="admin-table-btn admin-table-btn-reject" onclick="deleteAnnouncement('${item.id}')" style="background: rgba(232, 74, 74, 0.15); border: 1px solid var(--error); color: var(--error);">
              Delete
            </button>
          </td>
        `;
        tbody.appendChild(row);
      });
    }

    // --- IEDC MERCHANDISE PLATFORM ADMIN LOGIC ---
    let MERCH_PRODUCTS = [
      { id: "prod-hoodie", title: "IEDC Official Hoodie", price: 499, imageUrl: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=300&q=80", stockStatus: "in-stock" },
      { id: "prod-tshirt", title: "IEDC Innovator T-Shirt", price: 299, imageUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=300&q=80", stockStatus: "in-stock" },
      { id: "prod-cap", title: "IEDC Tech Cap", price: 149, imageUrl: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=300&q=80", stockStatus: "in-stock" }
    ];

    function initMerch() {
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
          console.error("Error parsing merchandise products:", e);
        }
      } else {
        localStorage.setItem("merch_products", JSON.stringify(MERCH_PRODUCTS));
      }
    }
    initMerch();

    window.renderAdminProducts = function() {
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

    window.toggleMerchStock = function(productId) {
      const p = MERCH_PRODUCTS.find(x => x.id === productId);
      if (p) {
        p.stockStatus = p.stockStatus === "in-stock" ? "out-of-stock" : "in-stock";
        localStorage.setItem("merch_products", JSON.stringify(MERCH_PRODUCTS));
        renderAdminProducts();
      }
    };

    window.deleteMerchItem = function(productId) {
      if (!confirm("Are you sure you want to delete this product?")) return;
      MERCH_PRODUCTS = MERCH_PRODUCTS.filter(p => p.id !== productId);
      localStorage.setItem("merch_products", JSON.stringify(MERCH_PRODUCTS));
      renderAdminProducts();
    };

    window.renderAdminMerchOrders = function() {
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

    window.approveMerchPayment = function(orderId) {
      let mockOrders = JSON.parse(localStorage.getItem("merch_orders") || "[]");
      const idx = mockOrders.findIndex(o => o.orderId === orderId);
      if (idx !== -1) {
        mockOrders[idx].status = "Confirmed";
        localStorage.setItem("merch_orders", JSON.stringify(mockOrders));
        renderAdminMerchOrders();
        alert("Payment approved and order confirmed!");
      }
    };

    window.rejectMerchPayment = function(orderId) {
      let mockOrders = JSON.parse(localStorage.getItem("merch_orders") || "[]");
      const idx = mockOrders.findIndex(o => o.orderId === orderId);
      if (idx !== -1) {
        mockOrders[idx].status = "Failed";
        localStorage.setItem("merch_orders", JSON.stringify(mockOrders));
        renderAdminMerchOrders();
        alert("Payment rejected and order marked as failed.");
      }
    };

    // Event Poster File Input change listener for preview
    document.getElementById("event-poster-file").addEventListener("change", function(e) {
      const file = e.target.files[0];
      const previewImg = document.getElementById("event-poster-preview");
      if (file) {
        const reader = new FileReader();
        reader.onload = function(evt) {
          previewImg.src = evt.target.result;
          previewImg.style.display = "block";
        };
        reader.readAsDataURL(file);
      } else {
        const savedUrl = document.getElementById("eventPoster").value;
        if (savedUrl) {
          previewImg.src = savedUrl;
          previewImg.style.display = "block";
        } else {
          previewImg.src = "";
          previewImg.style.display = "none";
        }
      }
    });

    // Tournament Poster File Input change listener for preview
    const tournamentPosterFile = document.getElementById("tournament-poster-file");
    if (tournamentPosterFile) {
      tournamentPosterFile.addEventListener("change", function(e) {
        const file = e.target.files[0];
        const previewImg = document.getElementById("tournament-poster-preview");
        if (file) {
          const reader = new FileReader();
          reader.onload = function(evt) {
            if (previewImg) {
              previewImg.src = evt.target.result;
              previewImg.style.display = "block";
            }
          };
          reader.readAsDataURL(file);
        } else {
          const savedUrl = document.getElementById("tournamentPoster").value;
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
      });
    }

    // Merchandise Product File Input change listener for preview
    const adminMerchFile = document.getElementById("admin-merch-file");
    if (adminMerchFile) {
      adminMerchFile.addEventListener("change", function(e) {
        const file = e.target.files[0];
        const previewImg = document.getElementById("admin-merch-preview");
        if (file) {
          const reader = new FileReader();
          reader.onload = function(evt) {
            if (previewImg) {
              previewImg.src = evt.target.result;
              previewImg.style.display = "block";
            }
          };
          reader.readAsDataURL(file);
        } else {
          const savedUrl = document.getElementById("admin-merch-image").value;
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
      });
    }

    const adminAddMerchForm = document.getElementById("admin-add-merch-form");
    if (adminAddMerchForm) {
      adminAddMerchForm.addEventListener("submit", async function(e) {
        e.preventDefault();
        const submitBtn = document.getElementById("btn-admin-add-product");
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

        try {
          if (file) {
            console.log("Uploading product image to Supabase...");
            submitBtn.textContent = "Uploading to Supabase...";
            imageUrl = await uploadToSupabase(file, "products");
            console.log("Supabase upload success. URL:", imageUrl);
          } else if (!imageUrl) {
            alert("Please select a product image file to upload.");
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            return;
          }

          const newProduct = {
            id: "prod-" + Date.now(),
            title,
            price,
            imageUrl,
            stockStatus: "in-stock"
          };

          MERCH_PRODUCTS.push(newProduct);
          localStorage.setItem("merch_products", JSON.stringify(MERCH_PRODUCTS));

          if (typeof renderAdminProducts === "function") renderAdminProducts();

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
      });
    }

    verifyAdminAccess();
    syncAdminNewsTickerAndAnnouncements();

    // Initial triggers for merchandise
    renderAdminProducts();
    renderAdminMerchOrders();

    setInterval(() => {
      const cachedProds = localStorage.getItem("merch_products");
      if (cachedProds) {
        try {
          const parsed = JSON.parse(cachedProds);
          if (JSON.stringify(parsed) !== JSON.stringify(MERCH_PRODUCTS)) {
            MERCH_PRODUCTS = parsed;
            renderAdminProducts();
          }
        } catch (e) {}
      }
      renderAdminMerchOrders();
    }, 3000);
  