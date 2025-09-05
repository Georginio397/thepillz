import React, { useState, useRef, useEffect } from "react";
import "./App.css";
import traitsData from "./traits.json";
import FlappyPillGame from "./FlappyPillGame";
import AuthForm from "./AuthForm";
import Leaderboard from "./LeaderBoard";
import GlobalTimer from "./GlobalTimer";

const PINATA_BASE = "https://thepillz.mypinata.cloud/ipfs/bafybeiczkxorffrpdzb6smanhiysps37ax5v7avhuso63kda4d4wk5w2ce";
const PINATA_NFTRUNNER = "https://thepillz.mypinata.cloud/ipfs/bafybeieqqwhpjdti2hit2nt5fxmxoj6xvkuxkktfwdudazseterwjbtczy";
const PINATA_BGS = "https://thepillz.mypinata.cloud/ipfs/bafybeidu4rixu5wghxl4cce2y33zadf7vpl7t4rmi77de2cl45p4yefwiu";

function ContractBar() {
  const contractAddress = "SoMeAddreSsHere123456789XYZ";
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(contractAddress);
    } else {
      const tempInput = document.createElement("input");
      tempInput.value = contractAddress;
      document.body.appendChild(tempInput);
      tempInput.select();
      document.execCommand("copy");
      document.body.removeChild(tempInput);
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // verificăm dimensiunea ecranului
  const isMobile = window.innerWidth < 768;

  return (
    <div className="contract-bar">
      <span className="ca-label">CA:</span>
      <span 
        className="contract-address" 
        onClick={handleCopy}
        title="Click to copy"
      >
        {isMobile 
          ? `${contractAddress.slice(0, 6)}...${contractAddress.slice(-6)}` 
          : contractAddress}
      </span>

      {copied && <div className="copy-toast">Copied!</div>}
    </div>
  );
}





function FAQBox() {
  return (
    <div className="faq-section">
      {/* Rewards Section */}
      <div className="faq-rewards">
      <h3 className="rewards-title ">Rewards</h3>

  <p>
    A key component of the project is its commitment to delivering consistent value to holders.
    <br />
    Rewards are funded by <span className="highlight-green no-retro-numbers">2.5</span> % of royalties on Magic Eden and 
    <span className="highlight-green no-retro-numbers"> 50</span> % of fees collected on Pump.fun.  
    When the timer hits zero, the round ends, and the Top 3 players by score and the Top 3 by coins receive rewards.  
    A new round begins right away, keeping the competition fresh and ongoing.
    <br /><br />
    <strong className="highlight-green" >Reward distribution:</strong><br />
    <br></br>
    <img src="/icons/gold.PNG" alt="gold medal" className="reward-icon" /> st place — <span className="no-retro-numbers">50</span> % of the reward pool <br />
    <img src="/icons/silver.PNG" alt="silver medal" className="reward-icon" /> nd place — <span className="no-retro-numbers">30</span> % of the reward pool <br />
    <img src="/icons/bronze.PNG" alt="bronze medal" className="reward-icon" /> rd place — <span className="no-retro-numbers">20</span> % of the reward pool <br />
    <br />
    This way, everyone who plays and contributes has a fair chance to share in the project’s growth.
  </p>

 
</div>

<div className="treasure-gif">
  <img src={`${PINATA_BASE}/chest.gif`} alt="Treasure chest" />
  </div>

</div>


  );
}


function NFTRunnerRow({ images, speed = 0.6, reverse = false }) {
  const trackRef = useRef(null);
  const animRef = useRef(null);
  const posRef = useRef(0);
  const isHoverRef = useRef(false);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const halfWidth = track.scrollWidth / 2;
    posRef.current = reverse ? -halfWidth : 0;
    track.style.transform = `translateX(${posRef.current}px)`;

    const step = () => {
      if (!isHoverRef.current) {
        if (reverse) {
          posRef.current += speed;
          if (posRef.current >= 0) posRef.current = -halfWidth;
        } else {
          posRef.current -= speed;
          if (-posRef.current >= halfWidth) posRef.current = 0;
        }
        track.style.transform = `translateX(${posRef.current}px)`;
      }
      animRef.current = requestAnimationFrame(step);
    };

    animRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animRef.current);
  }, [speed, reverse]);

  return (
    <div
      className="marquee"
      onMouseEnter={() => (isHoverRef.current = true)}
      onMouseLeave={() => (isHoverRef.current = false)}
    >
      <div className="runner__track" ref={trackRef}>
        {images.map((src, i) => (
          <div className="marquee__item" key={`A-${i}`}>
            <img src={src} alt={`NFT ${i + 1}`} />
          </div>
        ))}
        {images.map((src, i) => (
          <div className="marquee__item" key={`B-${i}`}>
            <img src={src} alt={`NFT ${i + 1}`} />
          </div>
        ))}
      </div>
    </div>
  );
}

function WavyDivider({
  height = 80,
  points = 48,
  baseAmp = 14,
  speed = 0.8,
  thickness = 3,
  className = "section-divider",
}) {
  const boxRef = useRef(null);
  const svgRef = useRef(null);
  const rafRef = useRef(null);
  const tRef = useRef(0);
  const smoothBeatRef = useRef(0);

  const buildPath = (w, h, amp, phase = 0) => {
    const stepX = w / (points - 1);
    const pts = [];
    for (let i = 0; i < points; i++) {
      const u = i / (points - 1);
      const y = h / 2 + Math.sin(u * Math.PI * 2 + phase) * amp;
      pts.push([i * stepX, y]);
    }
    const k = 0.35;
    let d = `M ${pts[0][0]},${pts[0][1]}`;
    for (let i = 0; i < points - 1; i++) {
      const [x0, y0] = pts[i];
      const [x1, y1] = pts[i + 1];
      const dx = (x1 - x0) * k;
      d += ` C ${x0 + dx},${y0} ${x1 - dx},${y1} ${x1},${y1}`;
    }
    return d;
  };

  useEffect(() => {
    const svg = svgRef.current;
    const box = boxRef.current;
    if (!svg || !box) return;

    const path1 = svg.querySelector(".wave-1");
    const path2 = svg.querySelector(".wave-2");

    const resize = () => {
      const w = box.offsetWidth || 1200;
      svg.setAttribute("viewBox", `0 0 ${w} ${height}`);
    };
    resize();
    window.addEventListener("resize", resize);

    const tick = () => {
      const beatStr = getComputedStyle(document.documentElement).getPropertyValue("--beat").trim();
      const beat = Math.max(0, Math.min(1, parseFloat(beatStr) || 0));
      smoothBeatRef.current = smoothBeatRef.current * 0.3 + beat * 3.9;

      const amp = baseAmp * (0.35 + 0.75 * smoothBeatRef.current);
      tRef.current += 0.016 * speed;

      const w = box.offsetWidth || 1200;

      const d1 = buildPath(w, height, amp, tRef.current);
      const d2 = buildPath(w, height, amp * 0.6, tRef.current + Math.PI * 0.55);

      if (path1) path1.setAttribute("d", d1);
      if (path2) path2.setAttribute("d", d2);

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [height, points, baseAmp, speed]);

  return (
    <div ref={boxRef} className={className} aria-hidden="true" style={{ height }}>
      <svg ref={svgRef} preserveAspectRatio="none" style={{ width: "100%", height: "100%" }}>
        <defs>
          <linearGradient id="dividerGrad" x1="0%" x2="100%" y1="0%" y2="0%">
            <stop offset="0%" stopColor="rgba(0, 255, 102, 0.9)" />
            <stop offset="50%" stopColor="rgba(0, 255, 102, 0.9)" />
            <stop offset="100%" stopColor="rgba(0, 255, 102, 0.9)" />
          </linearGradient>
        </defs>
        <path className="wave-1" fill="none" stroke="url(#dividerGrad)" strokeWidth={thickness} />
        <path className="wave-2" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={Math.max(1, thickness - 1)} />
      </svg>
    </div>
  );
}

function NFTRunnerRows({ images }) {
  return (
    <section className="nft-marquee-section">
      <NFTRunnerRow images={images} speed={0.6} />
    </section>
  );
}

/* =========================================================
   BeatAudioController
   ========================================================= */
function BeatAudioController({
  playlist = ["/audio/dxnerta.mp3", "/audio/dxnerta.mp3", "/audio/song3.mp3"],
  gain = 1.0,
  loopTrack = true,
  className = "",
  btnGifPlay = `${PINATA_BASE}/sound-off.gif`,
  btnGifPause = `${PINATA_BASE}/sound-on.gif`,
  btnGifPrev = `${PINATA_BASE}/prev.gif`,
  btnGifNext = `${PINATA_BASE}/next.gif`
}) {
  const wrapRef = useRef(null);
  const audioRef = useRef(null);
  const ctxRef = useRef(null);
  const analyserRef = useRef(null);
  const fadeGainRef = useRef(null);
  const rafRef = useRef(null);
  const startedRef = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [index, setIndex] = useState(0);
  const BARS = 16;
  const phasesRef = useRef([]);
  const freqsRef  = useRef([]);
  const weightsRef= useRef([]);
  const valsRef   = useRef([]);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [visible, setVisible] = useState(false);
  const containerRef = useRef(null);

  const formatTime = (time) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  useEffect(() => {
    const setH = () => {
      const h = wrapRef.current ? wrapRef.current.offsetHeight : 0;
      document.documentElement.style.setProperty("--audio-h", `${h}px`);
    };
    setH();
    window.addEventListener("resize", setH);
    return () => window.removeEventListener("resize", setH);
  }, []);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const audio = audioRef.current;
    audio.src = playlist[0];
    audio.preload = "auto";
    audio.muted = false;
    audio.playsInline = true;
    audio.crossOrigin = "anonymous";
    phasesRef.current  = Array.from({length:BARS}, () => Math.random() * Math.PI * 2);
    freqsRef.current   = Array.from({length:BARS}, () => 0.8 + Math.random() * 1.2);
    weightsRef.current = Array.from({length:BARS}, () => 0.55 + Math.random() * 0.35);
    valsRef.current    = Array.from({length:BARS}, () => 0);

    const AC = window.AudioContext || window.webkitAudioContext;
    const ctx = new AC();
    const srcNode = ctx.createMediaElementSource(audio);
    const analyser = ctx.createAnalyser();
    const fadeGain = ctx.createGain();
    fadeGain.gain.value = 0;

    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.8;

    srcNode.connect(analyser);
    srcNode.connect(fadeGain);
    fadeGain.connect(ctx.destination);

    ctxRef.current = ctx;
    analyserRef.current = analyser;
    fadeGainRef.current = fadeGain;

    const freq = new Uint8Array(analyser.frequencyBinCount);
    const time = new Uint8Array(analyser.fftSize);
    let last = 0;

    const wraps = Array.from(document.querySelectorAll(".beat-meter--full .bm-wrap"));
    const BAR_COUNT = wraps.length || BARS;

    const DESYNC_AMT = 0.65;

    const tick = () => {
      analyser.getByteFrequencyData(freq);
      analyser.getByteTimeDomainData(time);

      let sf = 0; for (let i = 0; i < freq.length; i++) sf += freq[i] * freq[i];
      let st = 0; for (let i = 0; i < time.length; i++) { const v = (time[i] - 128) / 128; st += v * v; }
      const rmsF = Math.sqrt(sf / freq.length) / 255;
      const rmsT = Math.sqrt(st / time.length);
      const energy = Math.min(1, rmsF * 0.065 + rmsT * 1.95);

      const smoothed = last * 0.85 + energy * 0.1;
      last = smoothed;

      const shaped = Math.pow(smoothed, 2.8);
      document.documentElement.style.setProperty("--beat", shaped.toFixed(3));

      const t = performance.now() / 1000;
      for (let i = 0; i < BAR_COUNT; i++) {
        const micro = 1.0 + DESYNC_AMT * Math.sin(t * (freqsRef.current[i] || 1.2) + (phasesRef.current[i] || 0));
        const weight = weightsRef.current[i] ?? 0.9;
        const target = Math.min(1, shaped * weight * micro);
        const prev = valsRef.current[i] ?? 0;
        const v = prev * 0.4 + target * 0.4;
        valsRef.current[i] = v;
        wraps[i]?.style.setProperty("--beat", v.toFixed(3));
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const fadeTo = (value, dur = 0.12) => {
    const ctx = ctxRef.current;
    const g = fadeGainRef.current;
    if (!ctx || !g) return;
    const now = ctx.currentTime;
    g.gain.cancelScheduledValues(now);
    g.gain.setValueAtTime(g.gain.value, now);
    g.gain.linearRampToValueAtTime(value, now + dur);
  };

  const play = async () => {
    const audio = audioRef.current;
    const ctx = ctxRef.current;
    if (!audio || !ctx) return;

    try { await ctx.resume(); } catch {}
    audio.muted = false;
    fadeTo(0, 0.01);
    try {
      await audio.play();
      setPlaying(true);
      fadeTo(1.0, 0.18);
    } catch {}
  };

  const pause = () => {
    const audio = audioRef.current;
    if (!audio) return;
    fadeTo(0.0, 0.10);
    setTimeout(() => {
      audio.pause();
      setPlaying(false);
      document.documentElement.style.setProperty("--beat", "0");
    }, 110);
  };

  const toggle = () => (playing ? pause() : play());

  const next = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    const nextIndex = (index + 1);
    if (nextIndex < playlist.length) {
      setIndex(nextIndex);
      audio.src = playlist[nextIndex];
      audio.load();
      await play();
    } else {
      pause();
    }
  };

  const prev = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    const prevIndex = (index - 1 + playlist.length) % playlist.length;
    setIndex(prevIndex);
    audio.src = playlist[prevIndex];
    audio.load();
    await play();
  };

  return (
    <section ref={wrapRef} className={`audio-section ${className}`}>
      <div
  className="audio-toggle"
  onClick={() => setVisible((v) => !v)}
>
  <img
    src={visible ? "/icons/labtn.gif" : "/icons/rabtn.gif"}
    alt="toggle arrow"
    style={{ width: "24px", height: "24px" }}
  />
</div>


      <div className={`player-body ${visible ? "open" : ""}`}>
        <audio
          ref={audioRef}
          onEnded={next}
          onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
          onTimeUpdate={() => setProgress(audioRef.current?.currentTime || 0)}
        />
        <div className="player-buttons">
          <button onClick={prev}><img src={btnGifPrev} alt="Prev" /></button>
          <button onClick={toggle}>
            <img src={playing ? btnGifPause : btnGifPlay} alt={playing ? "Pause" : "Play"} />
          </button>
          <button onClick={next}><img src={btnGifNext} alt="Next" /></button>
        </div>

        <div className="progress-container">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={progress}
            onChange={(e) => {
              const time = Number(e.target.value);
              audioRef.current.currentTime = time;
              setProgress(time);
            }}
          />
          <div className="time-info">
            {formatTime(progress)} / {formatTime(duration)}
          </div>
        </div>
      </div>
    </section>
  );
}

/* =========================
   App
   ========================= */
function App() {
  const [showMainContent, setShowMainContent] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState("");
  const [frameIndex, setFrameIndex] = useState(0);
  const [currentTraits, setCurrentTraits] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [hideNavbar, setHideNavbar] = useState(false);
  const [holdInterval, setHoldInterval] = useState(null);
  const [isFlying, setIsFlying] = useState(false);
  const [robotYOffset, setRobotYOffset] = useState(0);
  const [showMintAlert, setShowMintAlert] = useState(false);
  const [isMintLive, setIsMintLive] = useState(false);
  const [showMintBtn, setShowMintBtn] = useState(true);
  const [loadingSprite, setLoadingSprite] = useState(false);
  const [spriteUrl, setSpriteUrl] = useState("");
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [alertMsg, setAlertMsg] = useState("");
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("username");
    if (savedUser) setUser(savedUser);
  }, []);

  const shellRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => setShowMainContent(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const foundNFT = traitsData.find((item) => item.edition === parseInt(selectedNFT));
    if (foundNFT) {
      const traitsObject = {};
      foundNFT.attributes.forEach((attr) => {
        traitsObject[attr.trait_type] = attr.value;
      });
      setCurrentTraits(traitsObject);
    } else {
      setCurrentTraits(null);
    }
  }, [selectedNFT]);

  useEffect(() => {
    const el = shellRef.current;
    if (!el) return;

    const onScroll = () => {
      const y = el.scrollTop;
      const fadeOutStart = 100;
      const fadeOutEnd = 300;
      if (y < fadeOutStart) setShowMintBtn(true);
      else if (y > fadeOutEnd) setShowMintBtn(false);
      else setShowMintBtn(1 - (y - fadeOutStart) / (fadeOutEnd - fadeOutStart));

      setShowScrollTop(y > 300);
      setHideNavbar(!(y === 0));
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!selectedNFT) {
      setSpriteUrl("");
      setLoadingSprite(false);
      return;
    }
    const url = `https://thepillz.mypinata.cloud/ipfs/bafybeia5txhoyyreep7sgz4krsdjip345d63qbmb7wtfy6whn6culseiga/${selectedNFT}.png`;
    setLoadingSprite(true);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = url;
    img.onload = () => {
      setSpriteUrl(url);
      setLoadingSprite(false);
    };
    img.onerror = () => {
      setSpriteUrl("");
      setLoadingSprite(false);
    };
  }, [selectedNFT]);

  const handleRobotClick = () => {
    const el = shellRef.current;
    if (!el) return;

    setIsFlying(true);
    const duration = 250;
    const start = el.scrollTop;
    const startTime = performance.now();
    const robotTravel = window.innerHeight + 400;

    const animateScroll = (t) => {
      const elapsed = t - startTime;
      const progress = Math.min(elapsed / duration, 1);
      el.scrollTop = start * (1 - progress);
      setRobotYOffset(progress * robotTravel);
      if (progress < 1) requestAnimationFrame(animateScroll);
      else {
        setIsFlying(false);
        setRobotYOffset(0);
      }
    };

    requestAnimationFrame(animateScroll);
  };

  const handleNFTInputChange = (e) => {
    const val = e.target.value;
    if (/^\d{0,4}$/.test(val)) {
      if (val === "") {
        setSelectedNFT("");
      } else {
        const num = parseInt(val);
        if (!isNaN(num) && num >= 1 && num <= 2222) {
          setSelectedNFT(num);
          setFrameIndex(0);
        }
      }
    }
  };

  const downloadFrame = () => {
    const sprite = new Image();
    sprite.crossOrigin = "Anonymous";
    sprite.src = `https://thepillz.mypinata.cloud/ipfs/bafybeia5txhoyyreep7sgz4krsdjip345d63qbmb7wtfy6whn6culseiga/${selectedNFT}.png`;
    sprite.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = 1000;
      canvas.height = 1000;
      ctx.drawImage(sprite, frameIndex * 1000, 0, 1000, 1000, 0, 0, 1000, 1000);
      const link = document.createElement("a");
      link.download = `nft_${selectedNFT}_frame${frameIndex + 1}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    sprite.onerror = () => {
      alert("Image not found on Pinata. Please check CID or filename.");
    };
  };

  const handleMintClick = () => {
    setShowMintAlert(true);
    setTimeout(() => setShowMintAlert(false), 2500);
  };

  return (
    <div className="App">
 
      <nav className={`navbar ${hideNavbar ? "hidden" : ""}`}>
        <div className="navbar-rounded">
          <div className="navbar-links">
            <a href="#pillz" className="pillz">Pillz</a>
            <a href="#community" className="pillz">Сommunity</a>
            <a href="#game" className="pillz">Game/Rewards</a>
            <a href="https://magiceden.io" className="magiceden-link" target="_blank" rel="noreferrer">
              MagicEden
            </a>
          </div>
        </div>
      </nav>

      


      <div className="background-image"></div>
      {!showMainContent && (<img src="/intro.gif" alt="intro" className="intro-gif-overlay" />)}

     
      {isMintLive ? (
        <a
          href="https://launchmynft.io"
          target="_blank"
          rel="noopener noreferrer"
          className="mint-floating-btn"
          style={{
            opacity: typeof showMintBtn === "boolean" ? (showMintBtn ? 1 : 0) : showMintBtn,
            pointerEvents: showMintBtn ? "auto" : "none",
          }}
        >
          <img src={`${PINATA_BASE}/mint.gif`} alt="Mint Now" />
        </a>
      ) : (
        <button
          className="mint-floating-btn"
          onClick={handleMintClick}
          style={{
            opacity: typeof showMintBtn === "boolean" ? (showMintBtn ? 1 : 0) : showMintBtn,
            pointerEvents: showMintBtn ? "auto" : "none",
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
          }}
        >
          <img src={`${PINATA_BASE}/mint.gif`} alt="Mint Not Live" />
        </button>
      )}

      {showMintAlert && <div className="mint-alert">🚧 Mint not live yet!</div>}

   
      <div
        className={`robot-scroll ${showScrollTop ? "visible" : ""} ${isFlying ? "flying" : ""}`}
        onClick={handleRobotClick}
        style={{ transform: isFlying ? `translateY(-${robotYOffset}px)` : undefined }}
      >
        <img src={`${PINATA_BASE}/up.gif`} alt="Scroll to top" />
      </div>

      

  
      <div className="beat-shell" ref={shellRef}>
        <div className="beat-wrap">
          <section className="home-section" id="home">
            <div className="beat-meter beat-meter--full">
              {Array.from({ length: 16 }).map((_, i) => {
                const BARS = 16;
                const c = (BARS - 1) / 2;
                const u = Math.abs(i - c) / c;
                const mul = .45 + 6.55 * Math.pow(u, 3.3);
                return (
                  <div className="bm-wrap" key={i} style={{ "--mul": mul }}>
                    <div className="bm-bar" />
                  </div>
                );
              })}
            </div>

            <div className="home-bg"></div>
            <img className="home-bg-img" src={`${PINATA_BGS}/bgscreenT.gif`} alt="" />
            <img className="home-bg-big" src={`${PINATA_BGS}/bgscreenT.gif`} alt="" />
            <img className="home-bg-png" src={`${PINATA_BGS}/bgscreenT.png`} alt="" />
            <div className="home-bg2"></div>
            <div className="home-content"></div>
          </section>

          <ContractBar /> 

          <WavyDivider />

   

          <p className="pillz-description">
          The Pillz is a bunch of janky characters loosely inspired by our beloved Pump.fun playground.
            Each one looks like it crawled out of a broken vending machine after a long night of chart watching and poor decisions.
            And yet, despite their flaws, they’ve come together to form one of the most chaotic, tight-knit communities on-chain. It’s where memes matter more than meaning, and every degenerate has a place to belong.
            <br /> <span className="highlight-welcome">Welcome In</span>
          </p>

          <div className="main-content" id="pillz">
            <div className={`pillz-container ${!selectedNFT ? "center-only-right" : ""}`}>
              <div className="pillz-left">
                <h2>Where’s your Pill?</h2>
                <div className="nft-search">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="Search your pill..."
                    value={selectedNFT}
                    onChange={handleNFTInputChange}
                  />
                </div>
                <button className="download-btn" onClick={downloadFrame}>Download your PFP</button>

                <div className="frame-wrapper">
                  {!selectedNFT || !currentTraits ? (
                    <div className="placeholder-gif">
                      <img src={`${PINATA_BASE}/framepfp.gif`} alt="Idle animation" />
                    </div>
                  ) : (
                    <div className="sprite-frame">
                    
                      {loadingSprite && (
                        <div className="loading-overlay" role="status" aria-label="Loading">
                          <div className="loading-circle"></div>
                        </div>
                      )}
                      <div
                        className="sprite-frame-img"
                        style={{
                          display: spriteUrl ? "block" : "none",
                          backgroundImage: `url(${spriteUrl})`,
                          backgroundPositionX: `-${frameIndex * 300}px`,
                        }}
                      />
                    </div>
                  )}

                  <div className="frame-controls">
                    <button
                      className="frame-icon-btn"
                      onMouseDown={() => {
                        if (holdInterval) return;
                        const interval = setInterval(() => {
                          setFrameIndex((p) => Math.max(0, p - 1));
                        }, 100);
                        setHoldInterval(interval);
                      }}
                      onMouseUp={() => {
                        clearInterval(holdInterval);
                        setHoldInterval(null);
                      }}
                      onMouseLeave={() => {
                        clearInterval(holdInterval);
                        setHoldInterval(null);
                      }}
                      onClick={() => setFrameIndex((i) => Math.max(0, i - 1))}
                    >
                      <img src={`${PINATA_BASE}/labtn.gif`} alt="left" />
                    </button>

                    <span className="frame-counter">Frame {frameIndex + 1} / 16</span>

                    <button
                      className="frame-icon-btn"
                      onMouseDown={() => {
                        if (holdInterval) return;
                        const interval = setInterval(() => {
                          setFrameIndex((p) => Math.min(15, p + 1));
                        }, 100);
                        setHoldInterval(interval);
                      }}
                      onMouseUp={() => {
                        clearInterval(holdInterval);
                        setHoldInterval(null);
                      }}
                      onMouseLeave={() => {
                        clearInterval(holdInterval);
                        setHoldInterval(null);
                      }}
                      onClick={() => setFrameIndex((i) => Math.min(15, i + 1))}
                    >
                      <img src={`${PINATA_BASE}/rabtn.gif`} alt="right" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="pillz-right">
                <h3>Traits</h3>
                <div className="traits-scroll">
                  {currentTraits ? (
                    <div className="trait-grid">
                      {Object.entries(currentTraits).map(([trait, value]) => (
                        <div className="trait-box" key={trait}>
                          <div className="trait-type">{trait}</div>
                          <div className="trait-value">{value}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="no-traits">No pill, no traits.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <section className="nft-marquee-section">
            <NFTRunnerRow 
              images={[
                `${PINATA_NFTRUNNER}/0.gif`,
                `${PINATA_NFTRUNNER}/1.gif`,
                `${PINATA_NFTRUNNER}/2.gif`,
                `${PINATA_NFTRUNNER}/3.gif`,
                `${PINATA_NFTRUNNER}/4.gif`,
                `${PINATA_NFTRUNNER}/5.gif`,
                `${PINATA_NFTRUNNER}/6.gif`,
                `${PINATA_NFTRUNNER}/7.gif`,
                `${PINATA_NFTRUNNER}/8.gif`,
              ]}
              speed={0.6}
            />
            <NFTRunnerRow 
              images={[
                `${PINATA_NFTRUNNER}/9.gif`,
                `${PINATA_NFTRUNNER}/10.gif`,
                `${PINATA_NFTRUNNER}/11.gif`,
                `${PINATA_NFTRUNNER}/12.gif`,
                `${PINATA_NFTRUNNER}/13.gif`,
                `${PINATA_NFTRUNNER}/14.gif`,
                `${PINATA_NFTRUNNER}/6.gif`,
                `${PINATA_NFTRUNNER}/7.gif`,
                `${PINATA_NFTRUNNER}/5.gif`,
              ]}
              speed={0.6}
              reverse={true}
            />
          </section>

          <WavyDivider />

      
          <section id="game" className="game-section">
        <div className="game-layout">
    
          <div className="sidebar-left">
            <FAQBox />
          </div>

   
          <div className="game-wrapper" style={{ position: "relative" }}>
            <div className={!user ? "blurred" : ""}>
              <FlappyPillGame />
            </div>

            {!user && (
              <div className="login-overlay">
                <AuthForm
                  onLogin={(userData) => {
                    setUser(userData);
                    localStorage.setItem("username", userData.username);
                    if (userData.wallet) {
                      localStorage.setItem("wallet", userData.wallet);
                    }
                  }}
                />
              </div>
            )}

            {user && (
              <div style={{ marginTop: "12px", textAlign: "center" }}>
                <button
                  className="logout-btn"
                  onClick={() => {
                    localStorage.removeItem("username");
                    localStorage.removeItem("wallet");
                    setUser(null);
                  }}
                >
                  Logout ({user.username})
                </button>

         
                {user.wallet && (
                 <p className="wallet-display">
                 Wallet: {user.wallet.slice(0, 6)}...{user.wallet.slice(-6)}
               </p>
               
                )}
              </div>
            )}
          </div>


              <div className="sidebar">
              <GlobalTimer />
                <Leaderboard user={user} />
              
              </div>
            </div>
          </section>

          <WavyDivider />

          <div className="community-section" id="community">
            <div className="community-text">
              <h2>Join our community</h2>
              <p>Drive into the movement. Stay in touch, choose your pill, and link up with fellow degens.</p>
            </div>

            <div className="navbar-icons" id="socials">
              <a href="https://x.com/ThePillzNFT" target="_blank" rel="noreferrer">
                <img src="/icons/x.png" alt="" />
              </a>
              <a href="https://pump.fun" target="_blank" rel="noreferrer">
                <img src="/icons/ME.png" alt="" />
              </a>
              <a href="https://t.me/ThePillz" target="_blank" rel="noreferrer">
                <img src="/icons/launchnft.png" alt="" />
              </a>
            </div>

            <div className="community-button">
              <a href="https://x.com/i/communities/1958972752079008236" target="_blank" rel="noreferrer">
                <button className="join-btn">Join Community</button>
              </a>
            </div>
          </div>

          <footer className="site-footer">
            <p>
              Created by{" "}
              <a href="https://twitter.com/soljike" target="_blank" className="creator-name" rel="noreferrer">
                @soljike
              </a>{" "}
              • All rights reserved © 2025
            </p>
          </footer>
        </div>
      </div>

      <div className="audio-footer">
        <BeatAudioController
          playlist={["/audio/pumpit.mp3","/audio/holdon.mp3","/audio/fumes.mp3","/audio/mad.mp3","/audio/dxnerta.mp3","/audio/distress.mp3","/audio/essence.mp3"]}
          gain={1.0}
          btnGifPlay={`${PINATA_BASE}/sound-off.gif`}
          btnGifPause={`${PINATA_BASE}/sound-on.gif`}
        />
      </div>
    </div>
  );
}

export default App;
