const functions = require("firebase-functions");
const admin = require("firebase-admin");

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * HTTPS Cloud Function smsWebhook
 * Receives POST requests directly from Android SMS Forwarder: { "sender": "{from}", "body": "{msg}" }
 * Matches "credited" and "150" keywords in the message text.
 * Reconciles the most recent "Pending" registration document.
 */
exports.smsWebhook = functions.https.onRequest(async (req, res) => {
  // 1. Verify Request Method
  if (req.method !== "POST") {
    return res.status(405).send({ success: false, error: "Only POST requests are allowed." });
  }

  try {
    // 2. Extract SMS payload details from request body
    const sender = req.body.sender || req.body.from || "";
    const smsBody = req.body.body || req.body.text || req.body.message || "";

    console.log(`Incoming SMS from ${sender}: "${smsBody}"`);

    // 3. Match Logic: Verify SMS contains "150" and "credited"
    const containsCredited = smsBody.toLowerCase().includes("credited") || smsBody.toLowerCase().includes("received");
    const containsAmount = smsBody.includes("150");

    if (!containsCredited || !containsAmount) {
      console.log("SMS does not match the 150 credited criteria. Ignoring alert.");
      return res.status(200).send({ success: true, message: "Ignored: Criteria check failed." });
    }

    // 4. Query Firestore registrations for "Pending" status and fee matching 150
    const pendingQuery = await db.collection("registrations")
      .where("status", "==", "Pending")
      .where("amount", "==", 150)
      .get();

    if (pendingQuery.empty) {
      console.log("No pending registrations found for amount ₹150.");
      return res.status(200).send({ success: true, message: "No matching pending registrations found." });
    }

    // 5. Locate the most recent pending registration document (newest timestamp first)
    let targetDoc = null;
    let mostRecentTime = 0;

    pendingQuery.forEach((doc) => {
      const data = doc.data();
      const timeVal = data.timestamp ? new Date(data.timestamp).getTime() : 0;
      if (timeVal > mostRecentTime) {
        mostRecentTime = timeVal;
        targetDoc = { id: doc.id, ref: doc.ref, data };
      }
    });

    if (targetDoc) {
      // Update registration status to Confirmed
      await targetDoc.ref.update({
        status: "Confirmed",
        payment_status: "Success",
        verifiedAt: new Date().toISOString()
      });
      console.log(`Successfully confirmed registration: ${targetDoc.id}`);

      // 6. Automatically decrement available event seats
      const eventId = targetDoc.data.eventId;
      if (eventId) {
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
        } catch (seatErr) {
          console.error(`Error updating seats for event/tournament ${eventId}:`, seatErr);
        }
      }

      return res.status(200).send({ success: true, confirmedId: targetDoc.id });
    }

    return res.status(200).send({ success: true, message: "Finished processing without target updates." });

  } catch (error) {
    console.error("SMS Webhook Exception:", error);
    return res.status(500).send({ success: false, error: error.message });
  }
});
