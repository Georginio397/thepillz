import React, { useState, useRef, useEffect } from "react";
import "./App.css";
import traitsData from "./traits.json";



function NFTRunnerRow({ images, speed = 0.6, reverse = false, beatBoost = 3 }) {
  const trackRef = useRef(null);
  const animRef = useRef(null);
  const posRef = useRef(0);
  const isHoverRef = useRef(false);

  // netezim beat-ul ca să nu vibreze viteza
  const smoothBeatRef = useRef(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const halfWidth = track.scrollWidth / 2;
    posRef.current = reverse ? -halfWidth : 0;
    track.style.transform = `translateX(${posRef.current}px)`;

    const step = () => {
      // citim beat 0..1 și îl netezim
      const beatStr = getComputedStyle(document.documentElement)
        .getPropertyValue("--beat")
        .trim();
      const beat = Math.max(0, Math.min(1, parseFloat(beatStr) || 0));
      smoothBeatRef.current = smoothBeatRef.current * 0.85 + beat * 0.15;

      // viteza pe frame, amplificată de beat
      const boost = 1 + beatBoost * smoothBeatRef.current;  // ex: 1..(1+beatBoost)
      const v = speed * boost;

      if (!isHoverRef.current) {
        if (reverse) {
          posRef.current += v;
          if (posRef.current >= 0) posRef.current = -halfWidth;
        } else {
          posRef.current -= v;
          if (-posRef.current >= halfWidth) posRef.current = 0;
        }
        track.style.transform = `translateX(${posRef.current}px)`;
      }
      
      animRef.current = requestAnimationFrame(step);
    };

    animRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animRef.current);
  }, [speed, images, reverse, beatBoost]);

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
  points = 48,      // mai multe puncte => curbă mai lină
  baseAmp = 14,     // amplitudine de bază
  speed = 0.8,      // viteza de „curgere”
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
      const u = i / (points - 1);             // 0..1
      // sin pur, foarte „lin”
      const y = h / 2 + Math.sin(u * Math.PI * 2 + phase) * amp;
      pts.push([i * stepX, y]);
    }

    // cubic bezier simplu, mânere orizontale (tensiune mică => lin)
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
      // citim beat (0..1) și îl netezim (lerp)
      const beatStr = getComputedStyle(document.documentElement).getPropertyValue("--beat").trim();
      const beat = Math.max(0, Math.min(1, parseFloat(beatStr) || 0));
      smoothBeatRef.current = smoothBeatRef.current * 0.3 + beat * 3.9;

      // mereu puțină amplitudine ca să se miște și fără beat
      const amp = baseAmp * (0.35 + 0.75 * smoothBeatRef.current);

      // timp curgător
      tRef.current += 0.016 * speed;

      const w = box.offsetWidth || 1200;

      const d1 = buildPath(w, height, amp, tRef.current);
      const d2 = buildPath(w, height, amp * 0.6, tRef.current + Math.PI * 0.55); // ușor decalat

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
      <NFTRunnerRow images={images} speed={0.6} reverse />
    </section>
  );
}

/* =========================================================
   BeatAudioController = (Play/Pause + Prev/Next) + Analyzer
   ========================================================= */
   function BeatAudioController({
    playlist = ["/audio/dxnerta.mp3", "/audio/dxnerta.mp3", "/audio/song3.mp3"],
    gain = 1.0,
    loopTrack = true,
    className = "",
    btnGifPlay = "/animations/sound-off.gif",
    btnGifPause = "/animations/sound-on.gif",
    btnGifPrev = "/animations/prev.gif", 
  btnGifNext = "/animations/next.gif", 
    autoStartOnUnlock = true, 
  }) {
    const wrapRef = useRef(null);
    const audioRef = useRef(null);
    const ctxRef = useRef(null);
    const analyserRef = useRef(null);
    const fadeGainRef = useRef(null);   // <- pentru fade in/out (anti-glitch)
    const rafRef = useRef(null);
    const startedRef = useRef(false);
    const unlockedRef = useRef(false);
    const [playing, setPlaying] = useState(false);
    const [index, setIndex] = useState(0);
    const BARS = 24;                                // câte coloane ai în meter
    const phasesRef = useRef([]);     // faze random
    const freqsRef  = useRef([]);     // frecvențe diferite
    const weightsRef= useRef([]);     // pondere beat
    const valsRef   = useRef([]);     // smoothing pe bară
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
    

    
  
    // măsurăm înălțimea secțiunii (dacă mai vrei s-o folosești pentru top-ul navbarului)
    useEffect(() => {
      const setH = () => {
        const h = wrapRef.current ? wrapRef.current.offsetHeight : 0;
        document.documentElement.style.setProperty("--audio-h", `${h}px`);
      };
      setH();
      window.addEventListener("resize", setH);
      return () => window.removeEventListener("resize", setH);
    }, []);
  
    // init audio + analyser (o singură dată)
    useEffect(() => {
      if (startedRef.current) return;

      
      startedRef.current = true;
  
      const audio = audioRef.current;
      audio.src = playlist[0];
      audio.preload = "auto";
      audio.muted = true;           // permite autoplay-ul
      audio.playsInline = true;
      audio.crossOrigin = "anonymous";
      phasesRef.current  = Array.from({length:BARS}, () => Math.random() * Math.PI * 2);
      freqsRef.current   = Array.from({length:BARS}, () => 0.8 + Math.random() * 1.2); // 0.8..2.0 Hz
      weightsRef.current = Array.from({length:BARS}, () => 0.55 + Math.random() * 0.35); // 0.55..0.9
      valsRef.current    = Array.from({length:BARS}, () => 0);

      
  
      const AC = window.AudioContext || window.webkitAudioContext;
      const ctx = new AC();
      const srcNode = ctx.createMediaElementSource(audio);
      const analyser = ctx.createAnalyser();
      const fadeGain = ctx.createGain();  // nodul pe care facem fade
      fadeGain.gain.value = 0;            // pornim inaudibil
  
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.8;
  
      // lanț: element -> analyser (pt beat) + fadeGain -> destination (pt sunet)
      srcNode.connect(analyser);
      srcNode.connect(fadeGain);
      fadeGain.connect(ctx.destination);
  
      ctxRef.current = ctx;
      analyserRef.current = analyser;
      fadeGainRef.current = fadeGain;
  
      // încercăm autoplay muted (pe unele browsere va porni “în tăcere”)
      audio.play().catch(() => {});
  
      // deblocăm audio la prima interacțiune (click/tap/keydown)
      const unlock = async () => {
        if (unlockedRef.current) return;
        unlockedRef.current = true;
        try { await ctx.resume(); } catch {}
  
        if (autoStartOnUnlock) {
          // pornește automat cu fade-in la PRIMA interacțiune oriunde pe pagină
          try {
            audio.muted = false;                 // scoatem mute
            fadeGain.gain.cancelScheduledValues(ctx.currentTime);
            fadeGain.gain.setValueAtTime(0, ctx.currentTime);
            await audio.play();                  // începe
            setPlaying(true);
            fadeGain.gain.linearRampToValueAtTime(1.0, ctx.currentTime + 0.18); // fade-in scurt
          } catch {
            // dacă tot e blocat, user poate apăsa butonul play
          }
        }
  
        document.removeEventListener("pointerdown", unlock);
        document.removeEventListener("keydown", unlock);
        document.removeEventListener("touchstart", unlock, { passive: true });
      };
      document.addEventListener("pointerdown", unlock);
      document.addEventListener("keydown", unlock);
      document.addEventListener("touchstart", unlock, { passive: true });
  
    // loop pentru beat meter — trend bullish spre dreapta, dar pe beat
// loop pentru beat meter — setează --beat pe .bm-wrap
const freq = new Uint8Array(analyser.frequencyBinCount);
const time = new Uint8Array(analyser.fftSize);
let last = 0;

// selectează wrap-urile o singură dată
const wraps = Array.from(document.querySelectorAll(".beat-meter--full .bm-wrap"));
const BAR_COUNT = wraps.length || BARS;

const DESYNC_AMT = 0.65; // desincronizare subtilă

const tick = () => {
  analyser.getByteFrequencyData(freq);
  analyser.getByteTimeDomainData(time);

  // energie globală (beat)
  let sf = 0; for (let i = 0; i < freq.length; i++) sf += freq[i] * freq[i];
  let st = 0; for (let i = 0; i < time.length; i++) {
    const v = (time[i] - 128) / 128;
    st += v * v;
  }
  const rmsF = Math.sqrt(sf / freq.length) / 255;
  const rmsT = Math.sqrt(st / time.length);
  const energy = Math.min(1, rmsF * 0.065 + rmsT * 1.95);

  // smoothing global
  const smoothed = last * 0.85 + energy * 0.1;
  last = smoothed;

  // face beat-ul mai „intens”
  const shaped = Math.pow(smoothed, 2.8);

  // pentru puls global pe site (dacă îl folosești)
  document.documentElement.style.setProperty("--beat", shaped.toFixed(3));

  const t = performance.now() / 1000;

  for (let i = 0; i < BAR_COUNT; i++) {
    // mic offset sinusoidal ca să nu sară toate identic
    const micro = 1.0 + DESYNC_AMT *
      Math.sin(t * (freqsRef.current[i] || 1.2) + (phasesRef.current[i] || 0));

    const weight = weightsRef.current[i] ?? 0.9;

    // ✅ target ESTE definit aici
    const target = Math.min(1, shaped * weight * micro);

    const prev = valsRef.current[i] ?? 0;
    const v = prev * 0.4 + target * 0.4;
    valsRef.current[i] = v;

    // setăm --beat pe WRAP (glow-ul e pe wrap)
    wraps[i]?.style.setProperty("--beat", v.toFixed(3));
  }

  rafRef.current = requestAnimationFrame(tick);
};
rafRef.current = requestAnimationFrame(tick);


  
      return () => {
        cancelAnimationFrame(rafRef.current);
        try { ctx.close(); } catch {}
        document.removeEventListener("pointerdown", unlock);
        document.removeEventListener("keydown", unlock);
        document.removeEventListener("touchstart", unlock, { passive: true });
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
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
      audio.muted = false;          // scoatem muted la prima redare cu sunet
      // pregătim fade-in curat
      fadeTo(0, 0.01);
      try {
        await audio.play();
        setPlaying(true);
        fadeTo(1.0, 0.18);          // fade-in scurt
      } catch {
        // dacă e blocat, user trebuie să apese încă o dată după gest
      }
    };
  
    const pause = () => {
      const audio = audioRef.current;
      if (!audio) return;
      // fade-out și pause după ~100ms
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
      const nextIndex = (index + 1) % playlist.length;
      setIndex(nextIndex);
      audio.src = playlist[nextIndex];
      audio.load();
      await play();
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
        {/* buton toggle doar pe telefon */}
        <div
          className="audio-toggle"
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? "⮜" : "⮞"}
        </div>
    
        <div className={`player-body ${visible ? "open" : ""}`}>
          <audio
            ref={audioRef}
            onEnded={next}
            onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
            onTimeUpdate={() => setProgress(audioRef.current?.currentTime || 0)}
          />
    
          {/* Butoanele */}
          <div className="player-buttons">
            <button onClick={prev}>
              <img src={btnGifPrev} alt="Prev" />
            </button>
            <button onClick={toggle}>
              <img
                src={playing ? btnGifPause : btnGifPlay}
                alt={playing ? "Pause" : "Play"}
              />
            </button>
            <button onClick={next}>
              <img src={btnGifNext} alt="Next" />
            </button>
          </div>
    
          {/* Progress bar */}
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
  

  const shellRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => setShowMainContent(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const foundNFT = traitsData.find(
      (item) => item.edition === parseInt(selectedNFT)
    );
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
    sprite.src = `/sprites/${selectedNFT}.png`;
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
  };

  const handleMintClick = () => {
    setShowMintAlert(true);
    setTimeout(() => setShowMintAlert(false), 2500);
  };

  

  return (
    <div className="App">
      {/* NAVBAR fix */}
      <nav className={`navbar ${hideNavbar ? "hidden" : ""}`}>
        <div className="navbar-rounded">
          <div className="navbar-links">
            <a href="#pillz" className="pillz">Pillz</a>
            <a href="#socials" className="pillz">Сommunity</a>
            <a href="#rewards" className="pillz">Rewards</a>
            <a href="https://magiceden.io" className="magiceden-link" target="_blank" rel="noreferrer">
              MagicEden
            </a>
          </div>
        </div>
      </nav>

      <div className="background-image"></div>

{!showMainContent && (
  <img src="/intro.gif" alt="intro" className="intro-gif-overlay" />
)}

      {/* MINT BTN fix */}
      {isMintLive ? (
        <a
          href="https://magiceden.io"
          target="_blank"
          rel="noopener noreferrer"
          className="mint-floating-btn"
          style={{
            opacity: typeof showMintBtn === "boolean" ? (showMintBtn ? 1 : 0) : showMintBtn,
            pointerEvents: showMintBtn ? "auto" : "none",
          }}
        >
          <img src="/animations/mint.gif" alt="Mint Now" />
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
          <img src="/animations/mint.gif" alt="Mint Not Live" />
        </button>
      )}

      {showMintAlert && <div className="mint-alert">🚧 Mint not live yet!</div>}

      {/* ROBOT fix */}
      <div
        className={`robot-scroll ${showScrollTop ? "visible" : ""} ${isFlying ? "flying" : ""}`}
        onClick={handleRobotClick}
        style={{ transform: isFlying ? `translateY(-${robotYOffset}px)` : undefined }}
      >
        <img src="/animations/up.gif" alt="Scroll to top" />
      </div>

      {/* UNICUL container care SCROLLEAZĂ */}
      <div className="beat-shell" ref={shellRef}>
        <div className="beat-wrap">
        

          <section className="home-section" id="home">

            
            
          <div className="beat-meter beat-meter--full">
  {Array.from({ length: 24 }).map((_, i) => {
    const BARS = 24;
    const c = (BARS - 1) / 2;
    const u = Math.abs(i - c) / c;                 // 0 la centru → 1 la margini
    const mul = .45 + 6.55 * Math.pow(u, 3.3);    // parabolă: margini mari, centru mic
    return (
      <div className="bm-wrap" key={i} style={{ "--mul": mul }}>
        <div className="bm-bar" />
      </div>
    );
  })}
</div>


            <div className="home-bg"></div>
            
            <img className="home-bg-img" src="/bgscreenT.gif" alt="" />
  
            <img className="home-bg-big" src="/bgscreenT.gif" alt="" />
            <img className="home-bg-png" src="/bgscreenT.png" alt="" />
            <div className="home-bg2"></div>
            <div className="home-content"></div>
        

          </section>
 

          <WavyDivider />


          <p className="pillz-description">
            The Pillz is a bunch of janky characters loosely inspired by our beloved Pump.fun playground.
            Each one looks like it crawled out of a broken vending machine after a long night of chart watching and poor decisions.
            And yet, despite their flaws, they’ve come together to form one of the most chaotic, tight-knit communities on-chain. It’s where memes matter more than meaning, and every degenerate has a place to belong.
           <br></br>   <span class="highlight-welcome">Welcome In</span>
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
                <button className="download-btn" onClick={downloadFrame}>
                  Download your PFP
                </button>

                <div className="frame-wrapper">
                  {!selectedNFT || !currentTraits ? (
                    <div className="placeholder-gif">
                      <img src="/animations/framepfp.gif" alt="Idle animation" />
                    </div>
                  ) : (
                    <div
                      className="sprite-frame"
                      style={{
                        backgroundImage: `url(/sprites/${selectedNFT}.png)`,
                        backgroundPositionX: `-${frameIndex * 300}px`,
                      }}
                    />
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
                      <img src="/icons/labtn.gif" alt="left" />
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
                      <img src="/icons/rabtn.gif" alt="right" />
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

          <NFTRunnerRows
            images={[
              "/nfts/1.png",
              "/nfts/2.png",
              "/nfts/3.png",
              "/nfts/4.png",
              "/nfts/5.png",
              "/nfts/6.png",
              "/nfts/7.png",
              "/nfts/8.png",
              "/nfts/9.png",
              "/nfts/10.png",
              "/nfts/11.png",
              "/nfts/12.png",
              "/nfts/13.png",
              "/nfts/14.png",
              "/nfts/15.png",
              "/nfts/16.png",
              "/nfts/17.png",
            ]}
            
          />


<WavyDivider />



<section class="rewards" id="rewards">
  <h2> Rewards</h2>
  <div class="rewards-content">
    <div class="rewards-text">
    <p>
    A key component of the project is its commitment to delivering consistent value to holders.
    <br></br>
Each week, airdrops will be distributed to the community, funded by  <span class="highlight-green">2.5%</span> of royalties generated on Magic Eden and  <span class="highlight-green">50%</span> of fees collected on Pump.fun.
<br></br>
It’s our way of saying thanks — and making sure that everyone who supports the project gets to share in the upside as the community grows
    </p>
    </div>
    <div class="rewards-image">
      <img src="/animations/chest.gif" alt="Rewards Chest" />
    </div>
  </div>
</section>


<WavyDivider />


          <div className="community-section" id="community">
            <div className="community-text">
              <h2>Join our community</h2>
              <p>
                Dive into the movement. Stay in touch, choose your pill, and link up with fellow degens.
              </p>
            </div>

            <div className="navbar-icons" id="socials">
              <a href="https://twitter.com/ThePillzXYZ" target="_blank" rel="noreferrer">
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
              <a href="#" target="_blank" rel="noreferrer">
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

      

      {/* FOOTER audio fix jos */}
      <div className="audio-footer">
        <BeatAudioController
          playlist={["/audio/mad.mp3", "/audio/dxnerta.mp3", "/audio/distress.mp3", "/audio/essence.mp3"]}
          gain={1.0}
          loopTrack={true}
          btnGifPlay="/animations/sound-off.gif"
          btnGifPause="/animations/sound-on.gif"
   
        />
      </div>
      
    </div>
  );
  
}

export default App;
