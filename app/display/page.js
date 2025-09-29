"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "../../supabaseClient";
import confetti from "canvas-confetti";

export default function DisplayPage() {
  const [avisos, setAvisos] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shownIds, setShownIds] = useState(new Set());
  const videoRef = useRef(null);
  const ROTATION_TIME = 20000;

  const [soundEnabled, setSoundEnabled] = useState(false);
  const [audio, setAudio] = useState(null);

  const [time, setTime] = useState("");
  const [weather, setWeather] = useState("");

  // Inicializa audio
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

  // Reloj en vivo
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("es-MX", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Clima (ejemplo: Ciudad de México)
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=19.4326&longitude=-99.1332&current_weather=true`
        );
        const data = await res.json();
        if (data.current_weather) {
          setWeather(`${data.current_weather.temperature}°C 🌤`);
        }
      } catch (error) {
        console.error("Error obteniendo clima:", error);
      }
    };
    fetchWeather();
    const interval = setInterval(fetchWeather, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Trae avisos
  const fetchAvisos = async () => {
    const { data, error } = await supabase
      .from("avisos")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) {
      setAvisos(data);
      if (currentIndex >= data.length) setCurrentIndex(0);
    }
  };

  // Realtime + carga inicial
  useEffect(() => {
    fetchAvisos();

    const channel = supabase
      .channel("avisos-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "avisos" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setAvisos((prev) => [payload.new, ...prev]);
            setCurrentIndex(0);
          } else if (payload.eventType === "DELETE") {
            setAvisos((prev) => prev.filter((a) => a.id !== payload.old.id));
            if (currentIndex >= avisos.length - 1) setCurrentIndex(0);
          } else if (payload.eventType === "UPDATE") {
            setAvisos((prev) =>
              prev.map((a) => (a.id === payload.new.id ? payload.new : a))
            );
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  // Rotación automática
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

  // 🎉 Confeti + sonido SOLO en textos nuevos
  useEffect(() => {
    if (avisos.length === 0) return;
    const aviso = avisos[currentIndex];
    if (!shownIds.has(aviso.id) && aviso.tipo === "texto") {
      if (soundEnabled && audio) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      }
      confetti({ particleCount: 150, spread: 100, origin: { x: 0.5, y: 0.6 } });
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
          fontFamily: "'Poppins', sans-serif",
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
        width: "100vw",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "'Poppins', sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
{/* ⏰ Reloj y Clima - esquina inferior izquierda */}
<div
  style={{
    position: "absolute",
    bottom: "80px",   // ahora va abajo
    left: "150px",     // pegado al lado izquierdo
    transform: "rotate(-90deg)",
    transformOrigin: "bottom left", // importante para que no se salga
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "2.5rem",
    fontWeight: "600",
    fontFamily: "'Poppins', sans-serif",
    background: "rgba(0,0,0,0.5)",
    padding: "12px 20px",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
    zIndex: 20,
  }}
>
  <div>{time}</div>
  <div style={{ fontSize: "1.8rem", marginTop: "6px" }}>{weather}</div>
</div>

      <div
        style={{
          transform: "rotate(-90deg)",
          transformOrigin: "center center",
          width: "100vh",
          height: "100vw",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          position: "relative",
        }}
      >
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
            zIndex: 10,
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
            zIndex: 10,
          }}
        >
          {aviso.titulo && (
            <h2
              style={{
                fontSize: "2rem",
                marginBottom: "20px",
                color: "#4DA6FF",
              }}
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
            <img
              src={aviso.imagen_url}
              alt="aviso"
              style={{ borderRadius: "12px", width: "100%", height: "auto" }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
