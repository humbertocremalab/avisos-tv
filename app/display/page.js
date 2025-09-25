"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "../../supabaseClient";
import Image from "next/image";
import confetti from "canvas-confetti";

export default function DisplayPage() {
  const [avisos, setAvisos] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shownIds, setShownIds] = useState(new Set()); // 👈 para controlar qué avisos ya se mostraron
  const videoRef = useRef(null);
  const ROTATION_TIME = 7000;

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

  // Carga inicial + suscripción en tiempo real
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

  // Rotación automática de avisos
  useEffect(() => {
    if (avisos.length === 0) return;

    let interval;
    const aviso = avisos[currentIndex];

    if (aviso.tipo === "video") {
      const video = videoRef.current;
      if (video) {
        const handleEnded = () => setCurrentIndex((prev) => (prev + 1) % avisos.length);
        video.addEventListener("ended", handleEnded);
        return () => video.removeEventListener("ended", handleEnded);
      }
    } else {
      interval = setInterval(() => setCurrentIndex((prev) => (prev + 1) % avisos.length), ROTATION_TIME);
      return () => clearInterval(interval);
    }
  }, [avisos, currentIndex]);

  // 🎉🔊 Confeti + Sonido SOLO en avisos nuevos
  useEffect(() => {
    if (avisos.length === 0) return;

    const aviso = avisos[currentIndex];
    if (!shownIds.has(aviso.id)) {
      // Reproducir sonido
      const audio = new Audio("/audio/alerta.ogg"); // ruta relativa a la carpeta /public/audio/
audio.volume = 1;
audio.play().catch((e) => {
  console.log("No se pudo reproducir el audio automáticamente:", e);
});

      // Lanzar confeti
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });

      // Marcar como mostrado
      setShownIds((prev) => new Set(prev).add(aviso.id));
    }
  }, [avisos, currentIndex, shownIds]);

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
      }}
    >
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
          <h2 style={{ fontSize: "2rem", marginBottom: "20px", color: "#4DA6FF" }}>
            {aviso.titulo}
          </h2>
        )}

        {aviso.tipo === "texto" && <p style={{ fontSize: "2rem", lineHeight: "1.5" }}>{aviso.descripcion}</p>}

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
