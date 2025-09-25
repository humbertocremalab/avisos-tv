"use client";
import { useEffect, useState } from "react";
import confetti from "canvas-confetti";

export default function AvisoCard({ aviso }) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (aviso.isNew && !shown) {
      // 🔊 sonido
      const audio = new Audio("/audio/alerta.ogg");
      audio.play().catch(() => {});

      // 🎉 confeti
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });

      // marcar como mostrado
      setShown(true);

      // opcional: limpiar el flag
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
        textAlign: "center",
      }}
    >
      <h3>{aviso.titulo}</h3>
      <p>{aviso.descripcion}</p>
    </div>
  );
}
