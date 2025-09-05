import React, { useRef, useEffect, useState } from "react";

function FlappyPillGame({ onRequireLogin }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000";

  const [running, setRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [soundOn, setSoundOn] = useState(true);

  const bg1 = useRef(null);
  const bg2 = useRef(null);
  const [bgReady, setBgReady] = useState(false);
  let bgX = useRef(0);

  const W = 600;
  const H = 600;
  const BIRD_X = 80;
  const PILL_DRAW_SIZE = 80;
  const PILL_HITBOX = 40;

  const GRAVITY = 1200;
  const JUMP = -380;
  const PIPE_W = 80;
  const PIPE_SPEED = 240;
  const GAP = 140;

  const SPAWN_EVERY_S = 100 / 60;
  const COIN_R = 10;
  const BG_SPEED = 90;
  const GROUND_SPEED = PIPE_SPEED;

  const PILL_ANIM_FPS = 7.5;
  const COIN_ANIM_FPS = 10;

  const birdY = useRef(200);
  const vel = useRef(0);
  const pipes = useRef([]);
  const coins = useRef([]);

  // ✅ Sunet preîncărcat o singură dată
  const coinSound = useRef(null);
  const audioCtx = useRef(null);
const coinBuffer = useRef(null);

  const scoreRef = useRef(0);
  const coinsRef = useRef(0);

  const spawnTimer = useRef(0);
  const pillFrameTimer = useRef(0);
  const coinFrameTimer = useRef(0);

  const pillFrameRef = useRef(0);
  const coinFrameRef = useRef(0);

  const lastTime = useRef(0);

  const crashPosRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const img1 = new Image();
    const img2 = new Image();
    img1.src = "/sprites/bg1.png";
    img2.src = "/sprites/bg2.PNG";

    let loaded = 0;
    img1.onload = async () => {
      try { if (img1.decode) await img1.decode(); } catch {}
      loaded++;
      if (loaded === 2) setBgReady(true);
    };
    img2.onload = async () => {
      try { if (img2.decode) await img2.decode(); } catch {}
      loaded++;
      if (loaded === 2) setBgReady(true);
    };
    

    bg1.current = img1;
    bg2.current = img2;
  }, []);


  useEffect(() => {
    // inițializează AudioContext o singură dată
    audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
  
    // încarcă fișierul de sunet
    fetch("/audio/collect.mp3")
      .then(res => res.arrayBuffer())
      .then(data => audioCtx.current.decodeAudioData(data))
      .then(decoded => {
        coinBuffer.current = decoded;
      })
      .catch(err => console.error("Eroare la încărcarea sunetului:", err));
  }, []);
  
  // funcția de redare optimizată
  const playCoinSound = () => {
    if (!soundOn || !coinBuffer.current || !audioCtx.current) return;
    const source = audioCtx.current.createBufferSource();
    source.buffer = coinBuffer.current;
    source.connect(audioCtx.current.destination);
    source.start(0);
  };

  const reset = () => {
    birdY.current = 200;
    vel.current = 0;
    pipes.current = [];
    coins.current = [];
    scoreRef.current = 0;
    coinsRef.current = 0;

    spawnTimer.current = 0;
    pillFrameTimer.current = 0;
    coinFrameTimer.current = 0;
    pillFrameRef.current = 0;
    coinFrameRef.current = 0;
    lastTime.current = 0;

    setGameOver(false);
  };

  const start = () => {
    const username = localStorage.getItem("username");
    if (!username) {
      if (onRequireLogin) onRequireLogin();
      return;
    }
    reset();
    setRunning(true);
  };

  const stop = () => {
    setRunning(false);
    setGameOver(true);
    crashPosRef.current = { x: BIRD_X, y: birdY.current };

    const username = localStorage.getItem("username");

    if (username && username !== "Trial") {
      fetch(`${API_URL}/score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          score: scoreRef.current,
          coins: coinsRef.current,
        }),
      }).catch((err) => console.error("Error saving score:", err));
    } else {
      console.log("Guest/Trial mode – score not saved to DB");
    }
  };

  const jump = () => {
    if (!running) return;
    vel.current = JUMP;
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        if (gameOver) return;
        if (!running) return;
        jump();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [running, gameOver]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const frameWidth = 100;
    const frameHeight = 100;
    const totalFrames = 16;

    const coinImg = new Image();
    coinImg.src = "/sprites/coin.png";
    let coinReady = false;
    coinImg.onload = () => (coinReady = true);

    const coinFrameSize = 24;
    const coinTotalFrames = 5;

    const pillImg = new Image();
    pillImg.src = "/sprites/robots.png";
    let pillReady = false;
    pillImg.onload = () => (pillReady = true);

    const pipeTopImg = new Image();
    pipeTopImg.src = "/sprites/bodyup.png";
    let pipeTopReady = false;
    pipeTopImg.onload = () => (pipeTopReady = true);

    const pipeBottomImg = new Image();
    pipeBottomImg.src = "/sprites/bodybottom.png";
    let pipeBottomReady = false;
    pipeBottomImg.onload = () => (pipeBottomReady = true);

    const groundImg = new Image();
    groundImg.src = "/sprites/ground.png";
    let groundReady = false;
    groundImg.onload = () => (groundReady = true);

    let groundX = 0;
    const groundHeight = 60;

    const draw = () => {
      ctx.fillStyle = "#0b0b0b";
      ctx.fillRect(0, 0, W, H);

      if (bgReady && bg1.current && bg2.current) {
        const x = bgX.current % (W * 2);
        ctx.drawImage(bg1.current, x, 0, W, H);
        ctx.drawImage(bg2.current, x + W, 0, W, H);
        ctx.drawImage(bg1.current, x + W * 2, 0, W, H);
        ctx.drawImage(bg2.current, x + W * 3, 0, W, H);
      }

      pipes.current.forEach((p) => {
        if (pipeTopReady) {
          ctx.save();
          ctx.translate(p.x + pipeTopImg.width / 2, p.top);
          ctx.scale(1, -1);
          ctx.drawImage(pipeTopImg, -pipeTopImg.width / 2, 0);
          ctx.restore();
        }
        if (pipeBottomReady) {
          ctx.drawImage(pipeBottomImg, p.x, p.top + p.gap);
        }
      });

      if (groundReady) {
        ctx.drawImage(groundImg, groundX, H - groundHeight);
        ctx.drawImage(groundImg, groundX + groundImg.width, H - groundHeight);
      }

      if (pillReady) {
        const sx = pillFrameRef.current * frameWidth;
        const drawY = gameOver ? crashPosRef.current.y : birdY.current;
        ctx.drawImage(
          pillImg,
          sx,
          0,
          frameWidth,
          frameHeight,
          BIRD_X - PILL_DRAW_SIZE / 2,
          drawY - PILL_DRAW_SIZE / 2,
          PILL_DRAW_SIZE,
          PILL_DRAW_SIZE
        );
      }

      if (coinReady) {
        coins.current.forEach((c) => {
          ctx.drawImage(
            coinImg,
            coinFrameRef.current * coinFrameSize,
            0,
            coinFrameSize,
            coinFrameSize,
            c.x - COIN_R,
            c.y - COIN_R,
            COIN_R * 2,
            COIN_R * 2
          );
        });
      }

      if (!gameOver) {
        if (coinReady) {
          ctx.drawImage(
            coinImg,
            coinFrameRef.current * coinFrameSize,
            0,
            coinFrameSize,
            coinFrameSize,
            10,
            20,
            24,
            24
          );
        }
        ctx.font = "20px 'Press Start 2P', sans-serif";
        ctx.fillStyle = "#fff";
        ctx.textAlign = "left";
        ctx.fillText(`${coinsRef.current}`, 44, 40);

        ctx.font = "48px 'Press Start 2P', sans-serif";
        ctx.fillStyle = "#fff";
        ctx.textAlign = "center";
        ctx.fillText(`${scoreRef.current}`, W / 2, 120);
      }

      if (gameOver) {
        const popupWidth = 300;
        const popupHeight = 200;
        const popupX = W / 2 - popupWidth / 2;
        const popupY = H / 2 - popupHeight / 2;

        ctx.fillStyle = "rgba(0,0,0,0.85)";
        ctx.fillRect(popupX, popupY, popupWidth, popupHeight);
        ctx.strokeStyle = "#2ce62a";
        ctx.lineWidth = 4;
        ctx.strokeRect(popupX, popupY, popupWidth, popupHeight);

        ctx.fillStyle = "#fff";
        ctx.font = "28px 'Press Start 2P', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER", W / 2, popupY + 50);

        ctx.font = "20px 'Press Start 2P', sans-serif";
        ctx.fillText(`Score: ${scoreRef.current}`, W / 2, popupY + 100);
        ctx.fillText(`Coins: ${coinsRef.current}`, W / 2, popupY + 140);
      }
    };

    const update = (dt) => {
      if (bgReady) bgX.current -= BG_SPEED * dt;
      if (groundReady) {
        groundX = (groundX - GROUND_SPEED * dt) % groundImg.width;
      }
      if (gameOver) return;

      vel.current += GRAVITY * dt;
      birdY.current += vel.current * dt;

      spawnTimer.current += dt;
      if (spawnTimer.current >= SPAWN_EVERY_S) {
        spawnTimer.current = 0;
        const top = Math.random() * 300 + 50;
        pipes.current.push({ x: W, top, gap: GAP, passed: false });

        const coinsPerGap = 4;
        const spacing = GAP / (coinsPerGap + 1);
        for (let i = 1; i <= coinsPerGap; i++) {
          coins.current.push({
            x: W + PIPE_W / 2,
            y: top + i * spacing,
            collected: false,
          });
        }
      }

      pipes.current.forEach((p) => (p.x -= PIPE_SPEED * dt));
      coins.current.forEach((c) => (c.x -= PIPE_SPEED * dt));

      pipes.current.forEach((p) => {
        const hitX = BIRD_X - PILL_HITBOX / 2;
        const hitY = birdY.current - PILL_HITBOX / 2;
        const inX = hitX + PILL_HITBOX > p.x && hitX < p.x + PIPE_W;
        const inGap = hitY > p.top && hitY + PILL_HITBOX < p.top + p.gap;

        if (inX && !inGap) stop();
        if (!p.passed && p.x + PIPE_W < BIRD_X - PILL_HITBOX / 2) {
          p.passed = true;
          scoreRef.current += 1;
        }
      });

      coins.current.forEach((c) => {
        if (!c.collected) {
          const dx = BIRD_X - c.x;
          const dy = birdY.current - c.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < PILL_HITBOX / 2 + COIN_R) {
            c.collected = true;
            coinsRef.current += 1;
            playCoinSound(); // ✅ folosim funcția optimizată
          }
        }
      });

      if (pipes.current.length && pipes.current[0].x < -PIPE_W - 10) {
        pipes.current.shift();
      }
      coins.current = coins.current.filter(
        (c) => !c.collected && c.x > -COIN_R
      );

      if (birdY.current + PILL_HITBOX / 2 > H - 60) stop();
      if (birdY.current < 0 || birdY.current > H) stop();

      pillFrameTimer.current += dt;
      const pillInterval = 1 / PILL_ANIM_FPS;
      if (!gameOver && pillFrameTimer.current >= pillInterval) {
        pillFrameTimer.current -= pillInterval;
        pillFrameRef.current = (pillFrameRef.current + 1) % totalFrames;
      }

      coinFrameTimer.current += dt;
      const coinInterval = 1 / COIN_ANIM_FPS;
      if (coinFrameTimer.current >= coinInterval) {
        coinFrameTimer.current -= coinInterval;
        coinFrameRef.current = (coinFrameRef.current + 1) % coinTotalFrames;
      }
    };

    const loop = (now) => {
      if (!running) {
        cancelAnimationFrame(rafRef.current);
        draw();
        return;
      }

      if (lastTime.current === 0) lastTime.current = now;
      let dt = (now - lastTime.current) / 1000;
      lastTime.current = now;

      if (dt > 0.05) dt = 0.05;

      update(dt);
      draw();
      rafRef.current = requestAnimationFrame(loop);
    };

    const onClick = () => jump();
    canvas.addEventListener("click", onClick);

    if (running) {
      lastTime.current = 0;
      rafRef.current = requestAnimationFrame(loop);
    } else {
      draw();
    }

    return () => {
      cancelAnimationFrame(rafRef.current);
      canvas.removeEventListener("click", onClick);
    };
  }, [running, gameOver, soundOn]);

  return (
    <div style={{ textAlign: "center", position: "relative", display: "inline-block" }}>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="flappy-canvas"
        style={{
          width: "100%",
          height: "auto",
          maxWidth: "600px",
          borderRadius: 12,
          display: "block",
          border: "2px solid lime",
        }}
      />

      <button
        onClick={() => setSoundOn(!soundOn)}
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          padding: "6px 10px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
        }}
      >
        <img
          src={soundOn ? "/icons/sound-on.gif" : "/icons/sound-off.gif"}
          alt="sound toggle"
          style={{ width: "32px", height: "32px" }}
        />
      </button>

      {gameOver && (
        <button
          onClick={start}
          style={{
            position: "absolute",
            top: "70%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            padding: "12px 24px",
            fontSize: "18px",
            background: "#2ce62a",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
            color: "#000",
          }}
        >
          Restart
        </button>
      )}

      {!running && !gameOver && (
        <button
          onClick={start}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            padding: "12px 24px",
            fontSize: "18px",
            background: "#2ce62a",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
            color: "#000",
          }}
        >
          Start
        </button>
      )}
    </div>
  );
}

export default FlappyPillGame;
