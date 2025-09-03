import clientPromise from "../../lib/mongodb";

export default async function handler(req, res) {
  try {
    const client = await clientPromise;
    const db = client.db("thepillz");   // numele DB
    const scores = db.collection("scores"); // colecția ta
    
    const { username } = req.query;

    if (username && username !== "Trial") {
      const highscores = await scores.find().sort({ score: -1 }).limit(15).toArray();
      const coins = await scores.find().sort({ coinsTotal: -1 }).limit(15).toArray();
      const user = await scores.findOne({ username });

      res.status(200).json({
        highscores,
        coins,
        user
      });
    } else {
      const highscores = await scores.find().sort({ score: -1 }).limit(15).toArray();
      const coins = await scores.find().sort({ coinsTotal: -1 }).limit(15).toArray();
      res.status(200).json({ highscores, coins, user: null });
    }
  } catch (e) {
    console.error("Leaderboard error:", e);
    res.status(500).json({ error: "Server error" });
  }
}
