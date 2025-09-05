import React, { useRef, useEffect, useState } from "react";

function FlappyPillGame({ onRequireLogin }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000";

  const [running, setRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [assetsReady, setAssetsReady] = useState(false); // ✅ blocare până se încarcă toate

  // imagini preîncărcate
  const assets = useRef({});

  // dimensiuni
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

  // game state
  const birdY = useRef(200);
  const vel = useRef(0);
  const pipes = useRef([]);
  const coins = useRef([]);

  const scoreRef = useRef(0);
  const coinsRef = useRef(0);

  const spawnTimer = useRef(0);
  const pillFrameTimer = useRef(0);
  const coinFrameTimer = useRef(0);

  const pillFrameRef = useRef(0);
  const coinFrameRef = useRef(0);

  const lastTime = useRef(0);
  const crashPosRef = useRef({ x: 0, y: 0 });

  const loadImage = (src) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = src;
      img.onload = async () => {
        try {
          if (img.decode) {
            await img.decode().catch(() => {}); // nu blochează dacă decode eșuează
          }
          resolve(img);
        } catch (e) {
          console.error("Decode error:", src, e);
          resolve(img); // continuă oricum
        }
      };
      img.onerror = (err) => {
        console.error("Image failed:", src, err);
        resolve(null); // marchează ca null, dar nu blochează
      };
    });
  };
  

  useEffect(() => {
    const preload = async () => {
      const sources = {
        bg1: "/sprites/bg1.png",
        bg2: "/sprites/bg2.png",
        coin: "/sprites/coin.png",
        pill: "/sprites/robots.png",
        pipeTop: "/sprites/bodyup.png",
        pipeBottom: "/sprites/bodybottom.png",
        ground: "/sprites/ground.png",
      };
  
      try {
        const entries = Object.entries(sources);
        const loaded = await Promise.all(
          entries.map(async ([key, src]) => {
            const img = await loadImage(src);
            console.log("Loaded:", key, !!img);
            return [key, img];
          })
        );
        assets.current = Object.fromEntries(loaded);
        setAssetsReady(true);
      } catch (e) {
        console.error("Preload error:", e);
      }
    };
    preload();
  }, []);
  

    // ✅ AudioContext pentru sunete
    const audioCtx = useRef(null);
    const coinBuffer = useRef(null);
  
    useEffect(() => {
      audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
      fetch("/audio/collect.mp3")
        .then((res) => res.arrayBuffer())
        .then((data) => audioCtx.current.decodeAudioData(data))
        .then((decoded) => (coinBuffer.current = decoded))
        .catch((err) => console.error("Eroare la încărcarea sunetului:", err));
    }, []);
  
    const playCoinSound = () => {
      if (!soundOn || !coinBuffer.current || !audioCtx.current) return;
      const source = audioCtx.current.createBufferSource();
      source.buffer = coinBuffer.current;
      source.connect(audioCtx.current.destination);
      source.start(0);
    };
  
    // ✅ Reset joc
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
  
    // ✅ Start joc
    const start = () => {
      if (!assetsReady) return; // nu începe dacă nu sunt gata resursele
      const username = localStorage.getItem("username");
      if (!username) {
        if (onRequireLogin) onRequireLogin();
        return;
      }
      reset();
      setRunning(true);
    };
  
    // ✅ Stop joc
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
      }
    };
  
    // ✅ Jump
    const jump = () => {
      if (!running) return;
      vel.current = JUMP;
    };
  
    // Space pentru sărit
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
  

  // ===============================
  // Partea 3 — UPDATE + DRAW + LOOP
  // ===============================
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // nu rula logică de joc dacă nu sunt gata asset-urile
    if (!assetsReady) {
      // ecran simplu de "loading"
      ctx.fillStyle = "#0b0b0b";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#fff";
      ctx.font = "18px 'Press Start 2P', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Loading assets...", W / 2, H / 2);
      return;
    }

    // ====== Dimensiuni/frames sprites ======
    const frameWidth = 100;
    const frameHeight = 100;
    const totalFrames = 16;

    const coinFrameSize = 24;
    const coinTotalFrames = 5;

    // ====== Variabile pentru background/ground ======
    let bgX = 0;
    let groundX = 0;
    const groundHeight = 60;

    // ====== DRAW ======
    const draw = () => {
      const { bg1, bg2, coin, pill, pipeTop, pipeBottom, ground } = assets.current;

      // fundal
      ctx.fillStyle = "#0b0b0b";
      ctx.fillRect(0, 0, W, H);

      if (bg1 && bg2) {
        const x = bgX % (W * 2);
        ctx.drawImage(bg1, x, 0, W, H);
        ctx.drawImage(bg2, x + W, 0, W, H);
        ctx.drawImage(bg1, x + W * 2, 0, W, H);
        ctx.drawImage(bg2, x + W * 3, 0, W, H);
      }

      // țevi
      pipes.current.forEach((p) => {
        if (pipeTop) {
          ctx.save();
          ctx.translate(p.x + pipeTop.width / 2, p.top);
          ctx.scale(1, -1);
          ctx.drawImage(pipeTop, -pipeTop.width / 2, 0);
          ctx.restore();
        }
        if (pipeBottom) {
          ctx.drawImage(pipeBottom, p.x, p.top + p.gap);
        }
      });

      // sol
      if (ground) {
        ctx.drawImage(ground, groundX, H - groundHeight);
        ctx.drawImage(ground, groundX + ground.width, H - groundHeight);
      }

      // jucător (pill/robot)
      if (pill) {
        const sx = pillFrameRef.current * frameWidth;
        const drawY = gameOver ? crashPosRef.current.y : birdY.current;
        ctx.drawImage(
          pill,
          sx, 0, frameWidth, frameHeight,
          BIRD_X - PILL_DRAW_SIZE / 2,
          drawY - PILL_DRAW_SIZE / 2,
          PILL_DRAW_SIZE, PILL_DRAW_SIZE
        );
      }

      // monede
      if (coin) {
        coins.current.forEach((c) => {
          ctx.drawImage(
            coin,
            coinFrameRef.current * coinFrameSize, 0,
            coinFrameSize, coinFrameSize,
            c.x - COIN_R, c.y - COIN_R,
            COIN_R * 2, COIN_R * 2
          );
        });
      }

      // scor + HUD
      if (!gameOver) {
        if (coin) {
          ctx.drawImage(
            coin,
            coinFrameRef.current * coinFrameSize, 0,
            coinFrameSize, coinFrameSize,
            10, 20, 24, 24
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

      // popup Game Over
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

    // ====== UPDATE ======
    const update = (dt) => {
      const { ground } = assets.current;

      // bg & ground scroll
      bgX -= BG_SPEED * dt;
      if (ground) {
        groundX = (groundX - GROUND_SPEED * dt) % ground.width;
      }

      if (gameOver) return;

      // fizică pasăre
      vel.current += GRAVITY * dt;
      birdY.current += vel.current * dt;

      // spawn țevi + monede
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

      // mișcare țevi + monede
      pipes.current.forEach((p) => (p.x -= PIPE_SPEED * dt));
      coins.current.forEach((c) => (c.x -= PIPE_SPEED * dt));

      // coliziuni cu țevi + scor
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

      // colectare monede
      coins.current.forEach((c) => {
        if (!c.collected) {
          const dx = BIRD_X - c.x;
          const dy = birdY.current - c.y;
          const dist = Math.hypot(dx, dy);
          if (dist < PILL_HITBOX / 2 + COIN_R) {
            c.collected = true;
            coinsRef.current += 1;
            playCoinSound();
          }
        }
      });

      // curățare entități ieșite din ecran
      if (pipes.current.length && pipes.current[0].x < -PIPE_W - 10) {
        pipes.current.shift();
      }
      coins.current = coins.current.filter((c) => !c.collected && c.x > -COIN_R);

      // lovire sol/plafon
      if (birdY.current + PILL_HITBOX / 2 > H - 60) stop();
      if (birdY.current < 0 || birdY.current > H) stop();

      // animatie sprite-uri
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

    // ====== LOOP ======
    const onClick = () => jump();
    canvas.addEventListener("click", onClick);

    const loop = (now) => {
      if (!running) {
        cancelAnimationFrame(rafRef.current);
        draw(); // redă ultimul frame / ecran static
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
  }, [running, gameOver, soundOn, assetsReady]);


  return (
    <div
      style={{
        textAlign: "center",
        position: "relative",
        display: "inline-block",
      }}
    >
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

      {/* Toggle sunet */}
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
        aria-label="toggle sound"
      >
        <img
          src={soundOn ? "/icons/sound-on.gif" : "/icons/sound-off.gif"}
          alt="sound toggle"
          style={{ width: "32px", height: "32px" }}
        />
      </button>

      {/* Overlay: Loading assets */}
      {!assetsReady && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.55)",
            borderRadius: 12,
          }}
        >
          <div
            style={{
              padding: "12px 18px",
              background: "#111",
              border: "2px solid #2ce62a",
              borderRadius: 8,
              color: "#fff",
              fontFamily: "'Press Start 2P', sans-serif",
              fontSize: 14,
            }}
          >
            Loading assets…
          </div>
        </div>
      )}

      {/* Start */}
      {assetsReady && !running && !gameOver && (
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

      {/* Restart */}
      {assetsReady && gameOver && (
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
    </div>
  );
}

export default FlappyPillGame;
