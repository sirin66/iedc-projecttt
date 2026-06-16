const functions = require("firebase-functions");
const admin = require("firebase-admin");

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * HTTP Cloud Function Webhook for SMS Forwarder integration.
 * Receives bank alerts, extracts credited amounts and reference numbers,
 * and updates the oldest matching "Pending" registration to "Confirmed".
 */
exports.smsWebhook = functions.https.onRequest(async (req, res) => {
  // 1. Verify HTTP Request Method
  if (req.method !== "POST") {
    return res.status(405).send({ success: false, error: "Only POST requests are allowed." });
  }

  try {
    // 2. Parse SMS details
    // Handles common naming conventions for payload attributes in SMS Forwarder apps
    const smsBody = req.body.text || req.body.message || req.body.body || req.body.msg || "";
    const sender = req.body.from || req.body.sender || req.body.phone || "";

    console.log(`Incoming SMS webhook from: ${sender}`);
    console.log(`SMS content: "${smsBody}"`);

    if (!smsBody) {
      return res.status(400).send({ success: false, error: "SMS message body is missing." });
    }

    // 3. Verify it is a bank credit confirmation
    const isCredit = /credit|credited|received|deposit|added/i.test(smsBody);
    if (!isCredit) {
      console.log("SMS is not a bank credit notification. Ignoring request.");
      return res.status(200).send({ success: true, message: "Ignored: Not a credit notification." });
    }

    // 4. Extract 12-digit UTR/UPI transaction reference number or general alphanumeric Ref
    const utrMatch = smsBody.match(/\b\d{12}\b/) || smsBody.match(/Ref(?: No)?[:\s\-]*([A-Za-z0-9]+)/i);
    const utr = utrMatch ? utrMatch[0] : null;
    console.log(`Extracted Transaction/UTR Ref: ${utr || "None"}`);

    // 5. Direct Match: Check if the SMS contains a specific registrationId note (e.g. reg-123456)
    const regIdMatch = smsBody.match(/reg-\d{6}/);
    if (regIdMatch) {
      const targetRegId = regIdMatch[0];
      console.log(`Direct registration ID match found in SMS: ${targetRegId}`);

      const regRef = db.collection("registrations").doc(targetRegId);
      const regDoc = await regRef.get();

      if (regDoc.exists) {
        const data = regDoc.data();
        if (data.status === "Pending") {
          const updateData = { status: "Confirmed" };
          if (utr) {
            updateData.utrNumber = utr;
            updateData.razorpayPaymentId = "TXN_" + utr; // Mapped for backwards compatibility in UI
          }
          await regRef.update(updateData);
          console.log(`Registration ${targetRegId} confirmed via direct ID match.`);

          // Decrement event seats
          await decrementSeats(data.eventId);
          
          return res.status(200).send({ success: true, confirmedId: targetRegId, method: "direct_match" });
        } else {
          console.log(`Registration ${targetRegId} is already in status: ${data.status}.`);
          return res.status(200).send({ success: true, message: `Already processed. Status: ${data.status}` });
        }
      } else {
        console.log(`Registration ${targetRegId} not found in Firestore database.`);
      }
    }

    // 6. Reconciliation Fallback: Parse Amount and reconcile the oldest Pending matching registration (FIFO)
    // Matches expressions like: Rs. 150, Rs 150, INR 150, Rs.150
    const amountRegex = /(?:Rs\.?|INR)\s*(\d+(?:\.\d{2})?)/i;
    const match = smsBody.match(amountRegex);
    let amount = null;

    if (match) {
      amount = parseFloat(match[1]);
    } else {
      // General regex search for typical workshop/tournament integers (150, 50, 100, 200, 250)
      const numberMatch = smsBody.match(/\b(150|50|100|200|250)\b/);
      if (numberMatch) {
        amount = parseFloat(numberMatch[1]);
      }
    }

    if (!amount) {
      console.log("Could not resolve numerical credit amount from bank text. Ignoring request.");
      return res.status(200).send({ success: true, message: "Ignored: Amount could not be parsed." });
    }

    console.log(`Parsed credit amount: ₹${amount}`);

    // Query registrations where status is Pending and amount matches
    const pendingQuery = await db.collection("registrations")
      .where("status", "==", "Pending")
      .where("amount", "==", amount)
      .get();

    if (pendingQuery.empty) {
      console.log(`No pending registrations found for amount ₹${amount}.`);
      return res.status(200).send({ success: true, message: `No pending matching registrations found for ₹${amount}.` });
    }

    // Find the oldest pending registration (FIFO queue logic)
    let oldestReg = null;
    let oldestTimestamp = Infinity;

    pendingQuery.forEach((doc) => {
      const data = doc.data();
      const timeVal = data.timestamp ? new Date(data.timestamp).getTime() : 0;
      if (timeVal < oldestTimestamp) {
        oldestTimestamp = timeVal;
        oldestReg = { id: doc.id, ref: doc.ref, data: data };
      }
    });

    if (oldestReg) {
      console.log(`Oldest matching pending registration found: ID ${oldestReg.id}`);
      const updateData = { status: "Confirmed" };
      if (utr) {
        updateData.utrNumber = utr;
        updateData.razorpayPaymentId = "TXN_" + utr;
      }
      await oldestReg.ref.update(updateData);
      console.log(`Registration ID ${oldestReg.id} updated to Confirmed.`);

      // Decrement event seats
      await decrementSeats(oldestReg.data.eventId);

      return res.status(200).send({ success: true, confirmedId: oldestReg.id, method: "fifo_reconciliation" });
    }

    return res.status(200).send({ success: true, message: "Processed webhook without matching records." });

  } catch (error) {
    console.error("SMS Webhook Handler Exception:", error);
    return res.status(500).send({ success: false, error: error.message });
  }
});

/**
 * Decrements the available seats by 1 for the given event or tournament ID.
 */
async function decrementSeats(eventId) {
  try {
    const eventRef = db.collection("events").doc(eventId);
    const eventDoc = await eventRef.get();
    
    if (eventDoc.exists) {
      await eventRef.update({
        seats: admin.firestore.FieldValue.increment(-1)
      });
      console.log(`Decremented seats for event: ${eventId}`);
    } else {
      const tournamentRef = db.collection("tournaments").doc(eventId);
      const tournamentDoc = await tournamentRef.get();
      if (tournamentDoc.exists) {
        await tournamentRef.update({
          seats: admin.firestore.FieldValue.increment(-1)
        });
        console.log(`Decremented seats for tournament: ${eventId}`);
      }
    }
  } catch (err) {
    console.error(`Failed to update seats for ID ${eventId}:`, err);
  }
}
