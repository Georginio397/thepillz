import React, { useRef, useEffect, useState } from "react";

function FlappyPillGame({ onRequireLogin }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000";

  const [running, setRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [assetsReady, setAssetsReady] = useState(false);

  // background
  const bg1 = useRef(null);
  const bg2 = useRef(null);
  const [bgReady, setBgReady] = useState(false);
  let bgX = useRef(0);

  // game constants
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

  // game refs
  const birdY = useRef(200);
  const vel = useRef(0);
  const pipes = useRef([]);
  const coins = useRef([]);

  // ✅ audio buffer optimizat
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

  // ==============================
  // PRELOAD IMAGES & AUDIO
  // ==============================
  useEffect(() => {
    const ctx = canvasRef.current.getContext("2d");

    const sources = {
      bg1: "/sprites/bg1.png",
      bg2: "/sprites/bg2.PNG",
      coin: "/sprites/coin.png",
      pill: "/sprites/robots.png",
      pipeTop: "/sprites/bodyup.png",
      pipeBottom: "/sprites/bodybottom.png",
      ground: "/sprites/ground.png",
    };

    const imgs = {};
    let loaded = 0;
    const total = Object.keys(sources).length;

    Object.entries(sources).forEach(([key, src]) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        loaded++;
        // 👇 hack: forțăm decoding făcând un draw invizibil 1x1
        ctx.drawImage(img, 0, 0, 1, 1, -9999, -9999, 1, 1);

        if (loaded === total) {
          bg1.current = imgs.bg1;
          bg2.current = imgs.bg2;
          setBgReady(true);
          setAssetsReady(true);
        }
      };
      imgs[key] = img;
    });

    // audio preload
    audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
    fetch("/audio/collect.mp3")
      .then((res) => res.arrayBuffer())
      .then((data) => audioCtx.current.decodeAudioData(data))
      .then((decoded) => {
        coinBuffer.current = decoded;
      })
      .catch((err) => console.error("Eroare audio:", err));
  }, []);

  const playCoinSound = () => {
    if (!soundOn || !coinBuffer.current || !audioCtx.current) return;
    const source = audioCtx.current.createBufferSource();
    source.buffer = coinBuffer.current;
    source.connect(audioCtx.current.destination);
    source.start(0);
  };

  // ==============================
  // GAME LOGIC
  // ==============================
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
    }
  };

  const jump = () => {
    if (!running) return;
    vel.current = JUMP;
  };

  // keyboard
  useEffect(() => {
    const onKey = (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        if (!running || gameOver) return;
        jump();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [running, gameOver]);

  // game loop
  useEffect(() => {
    if (!assetsReady) return; // 👈 rulează doar după ce avem toate resursele

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const frameWidth = 100;
    const frameHeight = 100;
    const totalFrames = 16;

    const coinFrameSize = 24;
    const coinTotalFrames = 5;

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
        ctx.save();
        ctx.translate(p.x + 40, p.top);
        ctx.scale(1, -1);
        ctx.drawImage(new Image(), -40, 0); // dummy safe
        ctx.restore();
      });

      if (groundX !== undefined) {
        ctx.drawImage(new Image(), groundX, H - groundHeight);
      }

      // pill
      const pillImg = new Image();
      pillImg.src = "/sprites/robots.png";
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

      // coins
      const coinImg = new Image();
      coinImg.src = "/sprites/coin.png";
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
    };

    const update = (dt) => {
      if (bgReady) bgX.current -= BG_SPEED * dt;
      if (gameOver) return;

      vel.current += GRAVITY * dt;
      birdY.current += vel.current * dt;

      spawnTimer.current += dt;
      if (spawnTimer.current >= SPAWN_EVERY_S) {
        spawnTimer.current = 0;
        const top = Math.random() * 300 + 50;
        pipes.current.push({ x: W, top, gap: GAP, passed: false });
      }

      pipes.current.forEach((p) => (p.x -= PIPE_SPEED * dt));
      coins.current.forEach((c) => (c.x -= PIPE_SPEED * dt));
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

    if (running) {
      lastTime.current = 0;
      rafRef.current = requestAnimationFrame(loop);
    } else {
      draw();
    }

    return () => cancelAnimationFrame(rafRef.current);
  }, [running, gameOver, soundOn, assetsReady]);

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
      {!assetsReady && <p style={{ color: "#fff" }}>Loading assets…</p>}
    </div>
  );
}

export default FlappyPillGame;
