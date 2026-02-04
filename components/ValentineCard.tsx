"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import confetti from "canvas-confetti";
import * as anime from "animejs";

type Action = "yes" | "no";

function playSound(soundPath: string, canPlay: boolean) {
  if (!canPlay) return;
  const audio = new Audio(soundPath);
  audio.play().catch(() => {});
}

const getRandomNumber = (num: number) => Math.floor(Math.random() * (num + 1));

export default function ValentineCard() {
  // assets from /public
  const imagePaths = useMemo(
    () => [
      "/images/image1.gif",
      "/images/image2.gif",
      "/images/image3.gif",
      "/images/image4.gif",
      "/images/image5.gif",
      "/images/image6.gif",
      "/images/image7.gif",
    ],
    []
  );

  // sound gate
  const [soundReady, setSoundReady] = useState(false);
  const [needsTap, setNeedsTap] = useState(true);
  const bgAudioRef = useRef<HTMLAudioElement | null>(null);

  // UI state
  const [noClickCount, setNoClickCount] = useState(0);
  const [imgSrc, setImgSrc] = useState(imagePaths[0]);
  const [yesAccepted, setYesAccepted] = useState(false);

  const [yesSize, setYesSize] = useState({ h: 48, w: 90, font: 18 });

  // refs
  const runawayRef = useRef<HTMLButtonElement | null>(null);
  const yesBtnRef = useRef<HTMLButtonElement | null>(null);

  // copy (manly)
  const messages = useMemo(
    () => ["No", "You sure?", "Think again.", "Last chance 😏", "Catch me if you can"],
    []
  );

  function notifyAction(action: Action) {
    // ✅ YES/NO дарсан мөчид сервер рүү явуулна
    fetch("/api/valentine", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        ts: new Date().toISOString(),
        page: typeof window !== "undefined" ? window.location.href : "",
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      }),
    }).catch(() => {});
  }
  
  useEffect(() => {
    fetch("/api/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ts: new Date().toISOString(),
        page: window.location.href,
        referrer: document.referrer || "",
        userAgent: navigator.userAgent,
      }),
    }).catch(() => {});
  }, []);

  
  // prepare background music (try autoplay, but still gate interactions until user chooses)
  useEffect(() => {
    const audio = new Audio("/sounds/duu.mp3");
    audio.loop = true;
    audio.volume = 0.55;
    bgAudioRef.current = audio;

    // Try autoplay quietly; if blocked, overlay stays.
    const tryPlay = async () => {
      try {
        await audio.play();
        setSoundReady(true);
        // overlay can close automatically if autoplay succeeded
        setNeedsTap(false);
      } catch {
        setSoundReady(false);
        setNeedsTap(true);
      }
    };

    tryPlay();

    return () => {
      audio.pause();
      bgAudioRef.current = null;
    };
  }, []);

  const enableSound = async () => {
    try {
      const audio = bgAudioRef.current;
      if (!audio) return;

      // iOS unlock trick
      audio.muted = true;
      await audio.play();
      audio.pause();
      audio.currentTime = 0;
      audio.muted = false;

      await audio.play();

      setSoundReady(true);
      setNeedsTap(false);
    } catch {
      setSoundReady(false);
      setNeedsTap(true);
    }
  };

  const continueWithoutSound = () => {
    // allow interactions but no audio
    bgAudioRef.current?.pause();
    setSoundReady(false);
    setNeedsTap(false);
  };

  // runaway logic (only after overlay closed)
  useEffect(() => {
    const btn = runawayRef.current;
    if (!btn) return;

    const moveButton = function (this: HTMLButtonElement) {
      // gate: must close overlay first
      if (needsTap) return;

      if (this.textContent?.trim() !== "Catch me if you can") return;

      const top = getRandomNumber(window.innerHeight - this.offsetHeight);
      const left = getRandomNumber(window.innerWidth - this.offsetWidth);

      anime.animate(this, {
        top: `${top}px`,
        easing: "easeOutCirc",
        duration: 420,
      });

      anime.animate(this, {
        left: `${left}px`,
        easing: "easeOutCirc",
        duration: 420,
      });
    };

    btn.addEventListener("mouseover", moveButton as any);
    btn.addEventListener("click", moveButton as any);

    return () => {
      btn.removeEventListener("mouseover", moveButton as any);
      btn.removeEventListener("click", moveButton as any);
    };
  }, [noClickCount, needsTap]);

  // runaway button position near yes button
  useEffect(() => {
    if (noClickCount !== 4) return;
    const yesBtn = yesBtnRef.current;
    const runBtn = runawayRef.current;
    if (!yesBtn || !runBtn) return;

    const rect = yesBtn.getBoundingClientRect();
    runBtn.style.top = `${rect.bottom + 10}px`;
    runBtn.style.left = `${rect.left + rect.width / 2 + 18}px`;
  }, [noClickCount, yesSize]);

  // bouncing baddie image after YES
  useEffect(() => {
    if (!yesAccepted) return;

    const el = document.createElement("img");
    el.src = "/images/baddie.jpg";
    el.alt = "Baddie";
    el.style.position = "fixed";
    el.style.width = "280px";
    el.style.height = "300px";
    el.style.borderRadius = "22px";
    el.style.border = "1px solid rgba(148,163,184,0.35)";
    el.style.boxShadow = "0 10px 40px rgba(0,0,0,0.35)";
    el.style.left = "0px";
    el.style.top = "0px";
    el.style.zIndex = "50";
    el.style.willChange = "transform, left, top";

    document.body.appendChild(el);

    let x = Math.random() * (window.innerWidth - 280);
    let y = Math.random() * (window.innerHeight - 300);
    let dx = 2.2;
    let dy = 2.2;
    let rotation = 0;
    let raf = 0;

    const move = () => {
      const vw = window.innerWidth - 280;
      const vh = window.innerHeight - 300;

      if (x <= 0 || x >= vw) {
        dx *= -1;
        rotation += 10;
        anime.animate(el, {
          translateX: dx > 0 ? x + 18 : x - 18,
          duration: 260,
          easing: "easeOutElastic(1, .6)",
        });
      }

      if (y <= 0 || y >= vh) {
        dy *= -1;
        rotation += 10;
        anime.animate(el, {
          translateY: dy > 0 ? y + 18 : y - 18,
          duration: 260,
          easing: "easeOutElastic(1, .6)",
        });
      }

      x += dx;
      y += dy;

      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      el.style.transform = `rotate(${rotation}deg)`;

      raf = requestAnimationFrame(move);
    };

    move();

    return () => {
      cancelAnimationFrame(raf);
      el.remove();
    };
  }, [yesAccepted]);

  const onNoClick = () => {
    // gate: must close overlay first
    if (needsTap) return;

    playSound("/sounds/click.mp3", soundReady);
    notifyAction("no");

    setNoClickCount((prev) => {
      if (prev >= 4) return prev;

      const next = prev + 1;
      setImgSrc(imagePaths[next] ?? imagePaths[0]);

      setYesSize((s) => ({
        h: s.h + 26,
        w: s.w + 26,
        font: s.font + 8,
      }));

      return next;
    });
  };

  const onYesClick = () => {
    // gate: must close overlay first
    if (needsTap) return;

    playSound("/sounds/click.mp3", soundReady);
    notifyAction("yes");
    setYesAccepted(true);

    confetti({
      particleCount: 140,
      spread: 80,
      origin: { x: 0.5, y: 0.75 },
      colors: ["#60A5FA", "#A78BFA", "#34D399", "#F472B6"],
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(1200px_600px_at_50%_-10%,rgba(99,102,241,0.25),transparent),linear-gradient(180deg,#0B1220_0%,#0F172A_55%,#0B1220_100%)] text-slate-100">
      {/* LOCK OVERLAY */}
      {needsTap && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-[92%] max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl">

            <h1 className="mt-2 mx-auto text-2xl font-semibold w-[92%] justify-center items-center">Дарангуут чинь эхлэнэ</h1>
  
            <button
              onClick={enableSound}
              className="mt-5 w-full rounded-xl bg-indigo-500 px-4 py-3 font-semibold hover:bg-indigo-400 active:scale-[0.99] transition"
            >
              ▶ Заавал дар 
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col items-center p-4 text-center relative">
        {!yesAccepted && (
          <img
            src={imgSrc}
            alt="Valentine"
            className="rounded-xl h-[300px] w-auto border border-white/10 shadow-2xl"
            style={{ objectFit: "cover" }}
          />
        )}

        <h2 className="mt-5 text-4xl font-bold tracking-tight text-slate-100">
          {yesAccepted ? (
            <>
              <img
                src="/images/image7.gif"
                alt="Celebration"
                className="mx-auto w-[200px] h-auto block rounded-xl border border-white/10"
              />
              <div className="mt-4">Locked in. ✅</div>
              <span className="mt-2 block text-[16px] text-slate-300">
                You have scored a baddie for Valentine's Day!          
              </span>
            </>
          ) : (
            <span className="text-slate-100">Dear TRISTAN, Be my Valentine?</span>
          )}
        </h2>

        {!yesAccepted && (
          <div className="flex gap-4 pt-6 items-center relative">
            <button
              ref={yesBtnRef}
              onClick={onYesClick}
              disabled={needsTap}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-xl font-semibold px-5 py-3 bg-emerald-500 text-white hover:bg-emerald-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                height: `${yesSize.h}px`,
                width: `${yesSize.w}px`,
                fontSize: `${yesSize.font}px`,
                animation: "bounce2 2s ease infinite",
              }}
            >
              Yes
            </button>

            {noClickCount === 4 ? (
              <button
                ref={runawayRef}
                disabled={needsTap}
                className="fixed bg-rose-500 text-white px-5 py-3 rounded-xl cursor-pointer text-[16px] font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Catch me if you can
              </button>
            ) : (
              <button
                onClick={onNoClick}
                disabled={needsTap}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-xl text-[16px] font-semibold h-12 min-w-[90px] px-5 py-3 bg-slate-700 text-white hover:bg-slate-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {messages[noClickCount]}
              </button>
            )}
          </div>
        )}

        <style jsx global>{`
          @keyframes bounce2 {
            0%,
            20%,
            50%,
            80%,
            100% {
              transform: translateY(0);
            }
            40% {
              transform: translateY(-16px);
            }
            60% {
              transform: translateY(-8px);
            }
          }
        `}</style>
      </div>
    </div>
  );
}
