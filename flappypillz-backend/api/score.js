import clientPromise from "../../lib/mongodb";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { username, score, coins } = req.body;

    if (!username) {
      return res.status(400).json({ error: "Missing username" });
    }

    const client = await clientPromise;
    const db = client.db("pillz");

    // update sau insert
    const result = await db.collection("scores").updateOne(
      { username },
      {
        $set: { username },
        $max: { score },  // doar scorul maxim rămâne
        $setOnInsert: { coinsTotal: 0 }, 
        $inc: { coinsTotal: coins || 0 },
      },
      { upsert: true }
    );

    res.status(200).json({ success: true, result });
  } catch (err) {
    console.error("Error saving score:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
