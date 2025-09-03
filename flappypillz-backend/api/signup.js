import clientPromise from "../../lib/mongodb";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { username, password, wallet } = req.body;
    const client = await clientPromise;
    const db = client.db("pillz");

    // check if user already exists
    const existing = await db.collection("users").findOne({ username });
    if (existing) {
      return res.status(400).json({ error: "Username already exists" });
    }

    const result = await db.collection("users").insertOne({
      username,
      password,
      wallet: wallet || "",
      createdAt: new Date(),
    });

    res.status(201).json({ username, wallet: wallet || "" });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
