import fs from "node:fs";
import mongoose from "mongoose";

if (fs.existsSync(".env.local")) process.loadEnvFile(".env.local");

const uri = process.env.MONGO_URL;
const dbName = process.env.DB_NAME;

if (!uri || !dbName) {
  console.error("Missing MONGO_URL or DB_NAME in .env.local");
  process.exit(1);
}

const conn = await mongoose.createConnection(uri, { dbName, maxPoolSize: 2 }).asPromise();

try {
  const collection = conn.db.collection("orders");
  const order = await collection.findOne(
    { paymentStatus: "pending" },
    { sort: { createdAt: -1 } }
  );

  if (!order) {
    console.log("No pending orders found to simulate payment.");
    process.exit(0);
  }

  const utr = "4287" + Math.floor(10000000 + Math.random() * 90000000);
  const payuPaymentId = "PAYU_TEST_" + Date.now();

  await collection.updateOne(
    { _id: order._id },
    {
      $set: {
        paymentStatus: "paid",
        paidAt: new Date(),
        payuPaymentId,
        payuBankRefNum: utr,
      },
    }
  );

  console.log("=========================================");
  console.log("🎉 Test Payment Simulated Successfully!");
  console.log(`Order ID:  ${order.orderId}`);
  console.log(`Amount:    ₹${order.subtotal}`);
  console.log(`Bank UTR:  ${utr}`);
  console.log(`Status:    PAID`);
  console.log("=========================================");
  console.log("👉 Now go back to your browser and click:");
  console.log("   'I have paid — check payment'");
} finally {
  await conn.close();
}
