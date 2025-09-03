import clientPromise from "../../lib/mongodb"; // conexiune MongoDB

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const client = await clientPromise;
    const db = client.db("pillz"); // numele DB
    const scores = db.collection("scores");

    // 👉 logica de închidere rundă
    const topScores = await scores.find().sort({ score: -1 }).limit(3).toArray();
    const topCoins = await scores.find().sort({ coinsTotal: -1 }).limit(3).toArray();

    const winners = {
      roundEnd: new Date(),
      topScores,
      topCoins,
    };

    await db.collection("winners").insertOne(winners);

    return res.status(200).json({ success: true, winners });
  } catch (err) {
    console.error("Close round error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
