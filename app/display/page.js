"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "../../supabaseClient";
import Image from "next/image";
import confetti from "canvas-confetti";

export default function DisplayPage() {
  const [avisos, setAvisos] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shownIds, setShownIds] = useState(new Set());
  const videoRef = useRef(null);
  const ROTATION_TIME = 3000;

  // --- NUEVO: sonido ---
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [audio, setAudio] = useState(null);

  useEffect(() => {
    const enabled = localStorage.getItem("soundEnabled") === "true";
    setSoundEnabled(enabled);

    if (enabled) {
      const newAudio = new Audio("/audio/alerta.ogg");
      newAudio.volume = 1;
      setAudio(newAudio);
    }
  }, []);

  const toggleSound = () => {
    if (!soundEnabled) {
      const newAudio = new Audio("/audio/alerta.ogg");
      newAudio.volume = 1;
      setAudio(newAudio);
      localStorage.setItem("soundEnabled", "true");
      setSoundEnabled(true);
    } else {
      localStorage.setItem("soundEnabled", "false");
      setSoundEnabled(false);
      setAudio(null);
    }
  };

  const fetchAvisos = async () => {
    const { data, error } = await supabase
      .from("avisos")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) {
      setAvisos(data);
      if (currentIndex >= data.length) setCurrentIndex(0);
    }
  };

  useEffect(() => {
    fetchAvisos();

    const channel = supabase
      .channel("avisos-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "avisos" },
        () => fetchAvisos()
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  useEffect(() => {
    if (avisos.length === 0) return;

    let interval;
    const aviso = avisos[currentIndex];

    if (aviso.tipo === "video") {
      const video = videoRef.current;
      if (video) {
        const handleEnded = () =>
          setCurrentIndex((prev) => (prev + 1) % avisos.length);
        video.addEventListener("ended", handleEnded);
        return () => video.removeEventListener("ended", handleEnded);
      }
    } else {
      interval = setInterval(
        () => setCurrentIndex((prev) => (prev + 1) % avisos.length),
        ROTATION_TIME
      );
      return () => clearInterval(interval);
    }
  }, [avisos, currentIndex]);

  // Confeti + Sonido
  useEffect(() => {
    if (avisos.length === 0) return;

    const aviso = avisos[currentIndex];
    if (!shownIds.has(aviso.id)) {
      if (soundEnabled && audio) {
        audio.currentTime = 0;
        audio.play().catch((e) =>
          console.log("Error al reproducir audio:", e)
        );
      }

      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });

      setShownIds((prev) => new Set(prev).add(aviso.id));
    }
  }, [avisos, currentIndex, shownIds, soundEnabled, audio]);

  if (avisos.length === 0)
    return (
      <div
        style={{
          background: "linear-gradient(135deg, #4f46e5, #9333ea)",
          color: "white",
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontSize: "2rem",
        }}
      >
        📺 No hay avisos por mostrar
      </div>
    );

  const aviso = avisos[currentIndex];

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #4f46e5, #9333ea)",
        color: "white",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "40px",
        fontFamily: "'Poppins', sans-serif",
        position: "relative",
        transform: "rotate(-90deg)",       // 🔹 rotación -90°
        transformOrigin: "center center",  // 🔹 eje desde el centro
        width: "100vh",                     // 🔹 ancho ajustado
        height: "100vw",                    // 🔹 altura ajustada
        overflow: "hidden",                 // 🔹 evitar scroll
      }}
    >
      {/* 🔊 Botón de sonido */}
      <button
        onClick={toggleSound}
        style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          padding: "10px 16px",
          background: soundEnabled ? "#22c55e" : "#ef4444",
          border: "none",
          borderRadius: "8px",
          color: "white",
          fontWeight: "bold",
          cursor: "pointer",
          boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
        }}
      >
        {soundEnabled ? "🔊 Sonido ON" : "🔇 Sonido OFF"}
      </button>

      <div
        key={aviso.id}
        style={{
          background: "#222",
          borderRadius: "16px",
          padding: "30px",
          textAlign: "center",
          width: "80%",
          maxWidth: "900px",
          boxShadow: "0px 0px 30px rgba(0,0,0,0.6)",
          transition: "all 0.5s ease-in-out",
        }}
      >
        {aviso.titulo && (
          <h2
            style={{ fontSize: "2rem", marginBottom: "20px", color: "#4DA6FF" }}
          >
            {aviso.titulo}
          </h2>
        )}

        {aviso.tipo === "texto" && (
          <p style={{ fontSize: "2rem", lineHeight: "1.5" }}>
            {aviso.descripcion}
          </p>
        )}

        {aviso.tipo === "video" && (
          <video
            ref={videoRef}
            src={aviso.url}
            autoPlay
            muted
            controls={false}
            style={{ width: "100%", borderRadius: "12px" }}
          />
        )}

        {aviso.tipo === "imagen" && (
          <Image
            src={aviso.imagen_url}
            alt="aviso"
            width={800}
            height={450}
            style={{ borderRadius: "12px", width: "100%", height: "auto" }}
          />
        )}
      </div>
    </div>
  );
}
