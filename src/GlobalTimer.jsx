import React, { useEffect, useState } from "react";

function GlobalTimer() {
  const ROUND_DURATION = 24*60*60; // (24*60*60)

  const [timeLeft, setTimeLeft] = useState(ROUND_DURATION);

  useEffect(() => {
    const savedStart = localStorage.getItem("pillzTimerStart");
    let startTime;
    if (savedStart) {
      startTime = parseInt(savedStart, 10);
    } else {
      startTime = Date.now();
      localStorage.setItem("pillzTimerStart", startTime);
    }

    const updateTimer = () => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(ROUND_DURATION - elapsed, 0);
      setTimeLeft(remaining);

  
      if (remaining === 0) {
        fetch("/api/winners/close-round", {
          method: "POST",
        })
          .then((res) => res.json())
          .then((data) => {
            console.log("🏆 Rundă închisă:", data);

       
            const newStart = Date.now();
            localStorage.setItem("pillzTimerStart", newStart.toString());
            startTime = newStart;
            setTimeLeft(ROUND_DURATION);
          })
          .catch((err) => console.error("Eroare la închiderea rundei:", err));
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (secs) => {
    const h = String(Math.floor(secs / 3600)).padStart(2, "0");
    const m = String(Math.floor((secs % 3600) / 60)).padStart(2, "0");
    const s = String(secs % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  return (
    <div
      style={{
        fontSize: "22px",
        fontWeight: "bold",
        color: "#2ce62a",
        fontFamily: "'Press Start 2P', sans-serif",
        marginBottom: "12px",
        textAlign: "center",
      }}
    >
      {formatTime(timeLeft)}
    </div>
  );
}

export default GlobalTimer;
