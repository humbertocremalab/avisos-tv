"use client";
import { useEffect, useState, useRef } from "react";
import confetti from "canvas-confetti";

export default function AvisoCard({ aviso }) {
  const [shown, setShown] = useState(false);
  const audioRef = useRef(null);

  // precargar audio
  useEffect(() => {
    audioRef.current = new Audio("/audio/alerta.ogg");
  }, []);

  useEffect(() => {
    if (aviso.isNew && !shown) {
      // 🔊 sonido
      audioRef.current?.play().catch(() => {});

      // 🎉 confeti
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });

      setShown(true);

      // quitar flag después de 5 segundos
      setTimeout(() => {
        aviso.isNew = false;
      }, 5000);
    }
  }, [aviso, shown]);

  return (
    <div
      style={{
        background: aviso.isNew ? "#e0f7fa" : "#fff",
        padding: "20px",
        borderRadius: "10px",
        marginBottom: "10px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      }}
    >
      <h3>{aviso.titulo}</h3>
      <p>{aviso.descripcion}</p>
    </div>
  );
}
