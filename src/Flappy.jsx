import React, { useRef, useEffect, useState } from "react";

function FlappyPillGame({ onRequireLogin }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  const [running, setRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [soundOn, setSoundOn] = useState(false);

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
  const JUMP = -420;
  const PIPE_W = 80;
  const PIPE_SPEED = 180;
  const GAP = 140;
  const SPAWN_INTERVAL = 1.6;
  const COIN_R = 10;

  const birdY = useRef(200);
  const vel = useRef(0);
  const pipes = useRef([]);
  const coins = useRef([]);
  const coinSound = useRef(null);

  const scoreRef = useRef(0);
  const coinsRef = useRef(0);

  const crashPosRef = useRef({ x: 0, y: 0 });
  const spawnTimer = useRef(0);

  useEffect(() => {
    const img1 = new Image();
    const img2 = new Image();
    img1.src = "/sprites/bg1.png";
    img2.src = "/sprites/bg2.png";

    let loaded = 0;
    img1.onload = () => { if (++loaded === 2) setBgReady(true); };
    img2.onload = () => { if (++loaded === 2) setBgReady(true); };

    bg1.current = img1;
    bg2.current = img2;
  }, []);

  useEffect(() => {
    coinSound.current = new Audio("/audio/collect.mp3");
    coinSound.current.load();
  }, []);

  const reset = () => {
    birdY.current = 200;
    vel.current = 0;
    pipes.current = [];
    coins.current = [];
    scoreRef.current = 0;
    coinsRef.current = 0;
    spawnTimer.current = 0;
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
      fetch("http://192.168.1.5:4000/score", {
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

  const jump = () => {
    if (!running) return;
    vel.current = JUMP;
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        if (gameOver || !running) return;
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
    let pillFrame = 0;

    const coinImg = new Image();
    coinImg.src = "/sprites/coin.png";
    let coinReady = false;
    coinImg.onload = () => (coinReady = true);

    const coinFrameSize = 24;
    const coinTotalFrames = 5;
    let coinFrame = 0;

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
        ctx.drawImage(bg1.current, bgX.current, 0, W, H);
        ctx.drawImage(bg2.current, bgX.current + W, 0, W, H);
        ctx.drawImage(bg1.current, bgX.current + W * 2, 0, W, H);
        ctx.drawImage(bg2.current, bgX.current + W * 3, 0, W, H);
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
        const sx = pillFrame * frameWidth;
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
            coinFrame * coinFrameSize,
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
            coinFrame * coinFrameSize,
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
    };

    const update = (dt) => {
      if (gameOver) return;

      vel.current += GRAVITY * dt;
      birdY.current += vel.current * dt;

      spawnTimer.current += dt;
      if (spawnTimer.current >= SPAWN_INTERVAL) {
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
            if (soundOn && coinSound.current) {
              const clone = coinSound.current.cloneNode();
              clone.play().catch(() => {});
            }
          }
        }
      });

      pipes.current = pipes.current.filter((p) => p.x > -PIPE_W - 10);
      coins.current = coins.current.filter((c) => !c.collected && c.x > -COIN_R);

      if (birdY.current + PILL_HITBOX / 2 > H - 60) stop();
      if (birdY.current < 0 || birdY.current > H) stop();
    };

    let lastTime = performance.now();
    const loop = (now) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      if (running) {
        update(dt);
        draw();

        if (!gameOver) {
          if (pillImg && !pillImg.complete) pillImg.onload = () => {};
          if (frameWidth && frameHeight) pillFrame = (pillFrame + dt * 12) % totalFrames;
          if (coinImg && coinReady) coinFrame = (coinFrame + dt * 10) % coinTotalFrames;
        }
        rafRef.current = requestAnimationFrame(loop);
      } else {
        draw();
      }
    };

    const onClick = () => jump();
    canvas.addEventListener("click", onClick);

    if (running) {
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
