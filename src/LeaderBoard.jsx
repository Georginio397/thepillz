import React, { useEffect, useState } from "react";

function Leaderboard({ user }) {
  const [activeTab, setActiveTab] = useState("score");
  const [highscores, setHighscores] = useState([]);
  const [coins, setCoins] = useState([]);
  const [winners, setWinners] = useState([]);
  const [userRank, setUserRank] = useState(null);

  // normalizează username-ul (string indiferent ce primești)
  const usernameNorm =
    (typeof user === "string" ? user : user?.username) ||
    localStorage.getItem("username") ||
    "";

  useEffect(() => {
    const fetchScores = async () => {
      try {
        let data;

        if (usernameNorm && usernameNorm !== "Trial") {
          const res = await fetch(`http://192.168.1.5:4000/leaderboard/${encodeURIComponent(usernameNorm)}`);
          data = await res.json();
          setUserRank(data.user || null);
        } else {
          // doar top-ul (fără rank personal)
          const res = await fetch(`http://192.168.1.5:4000/leaderboard/guest`);
          data = await res.json();
          setUserRank(null);
        }

        setHighscores(data.highscores || []);
        setCoins(data.coins || []);

        const winnersRes = await fetch("http://192.168.1.5:4000/winners");
        const winnersData = await winnersRes.json();
        setWinners(winnersData || []);
      } catch (err) {
        console.error("Leaderboard error:", err);
      }
    };

    fetchScores();
    const interval = setInterval(fetchScores, 5000);
    return () => clearInterval(interval);
  }, [usernameNorm]); // depinde de numele normalizat

  return (
    <div className="leaderboard">
      {/* Tabs */}
      <div className="tabs">
        <div className={`tab ${activeTab === "score" ? "active" : ""}`} onClick={() => setActiveTab("score")}>Highscores</div>
        <div className={`tab ${activeTab === "coins" ? "active" : ""}`} onClick={() => setActiveTab("coins")}>Coins</div>
        <div className={`tab ${activeTab === "winners" ? "active" : ""}`} onClick={() => setActiveTab("winners")}>Winners</div>
      </div>

      {/* Score tab */}
      {activeTab === "score" && (
        <ul className="leaderboard-list">
          {highscores.map((u, i) => (
            <li
              key={`${u.username}-${i}`}
              className={`rank-${u.rank || i + 1} ${userRank?.username === u.username ? "highlight" : ""}`}
            >
              <span>{(u.rank || i + 1)}. {u.username}</span>
              <span>{u.score}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Coins tab */}
      {activeTab === "coins" && (
        <ul className="leaderboard-list">
          {coins.map((u, i) => (
            <li
              key={`${u.username}-${i}`}
              className={`rank-${u.rank || i + 1} ${userRank?.username === u.username ? "highlight" : ""}`}
            >
              <span>{(u.rank || i + 1)}. {u.username}</span>
              <span>{u.coinsTotal}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Winners tab */}
      {activeTab === "winners" && winners.length > 0 && (
        <div className="winners-wrap">
          <div className="winners-date">{new Date(winners[0].roundEnd).toLocaleDateString()}</div>
          <div className="winners-columns">
            <div className="wcol">
              <div>Top Scores:</div>
              <ul className="leaderboard-list">
                {winners[0].topScores.map((p, i) => (
                  <li key={`ws-${i}`}><span>{i + 1}. {p.username}</span><span>{p.score}</span></li>
                ))}
              </ul>
            </div>
            <div className="wcol">
              <div>Top Coins:</div>
              <ul className="leaderboard-list">
                {winners[0].topCoins.map((p, i) => (
                  <li key={`wc-${i}`}><span>{i + 1}. {p.username}</span><span>{p.coinsTotal}</span></li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* user-ul logat e mereu vizibil jos (dacă nu e Trial și nu e pe Winners tab) */}
      {usernameNorm && usernameNorm !== "Trial" && userRank && activeTab !== "winners" && (
        <>
          <div className="leaderboard-separator"></div>
          <div className="user-rank-highlight">
            <span className="highlight-green">
              {activeTab === "score"
                ? `${userRank.scoreRank}. ${userRank.username} — ${userRank.score}`
                : `${userRank.coinsRank}. ${userRank.username} — ${userRank.coinsTotal}`}
            </span>
          </div>
        </>
      )}
    </div>
  );
}

export default Leaderboard;
