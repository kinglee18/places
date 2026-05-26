"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function PropertyActions({ id, isPublished }: { id: string; isPublished: boolean }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [published, setPublished] = useState(isPublished);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    const res = await fetch(`/api/properties/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.refresh();
    } else {
      setError("No se pudo eliminar. Intenta de nuevo.");
      setDeleting(false);
      setConfirming(false);
    }
  };

  const handleTogglePublish = async () => {
    setToggling(true);
    setError(null);
    const next = !published;
    const res = await fetch(`/api/properties/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_published: next }),
    });
    if (res.ok) {
      setPublished(next);
    } else {
      setError("No se pudo actualizar. Intenta de nuevo.");
    }
    setToggling(false);
  };

  return (
    <div style={{ marginTop: 12 }}>
      {/* Fila 1: Publicar / Despublicar */}
      <button
        onClick={handleTogglePublish}
        disabled={toggling}
        style={{
          width: "100%", marginBottom: 8,
          fontSize: 12, fontWeight: 700,
          color: published ? "#5a6288" : "oklch(0.38 0.10 250)",
          border: `1px solid ${published ? "#d5daea" : "oklch(0.82 0.06 250)"}`,
          borderRadius: 8, padding: "6px 12px",
          background: published ? "transparent" : "oklch(0.94 0.03 250)",
          cursor: toggling ? "not-allowed" : "pointer",
          fontFamily: "inherit", opacity: toggling ? 0.6 : 1,
          transition: "all 0.15s",
        }}
      >
        {toggling ? "..." : published ? "⏸ Despublicar" : "✓ Publicar"}
      </button>

      {/* Fila 2: Editar + Eliminar */}
      <div style={{ display: "flex", gap: 8 }}>
        <Link
          href={`/mis-propiedades/${id}/editar`}
          style={{
            flex: 1, textAlign: "center",
            fontSize: 12, fontWeight: 700, color: "oklch(0.60 0.12 240)",
            border: "1px solid rgba(0,180,216,0.3)", borderRadius: 8,
            padding: "6px 12px", textDecoration: "none",
          }}
        >
          Editar
        </Link>

        {!confirming ? (
          <button
            onClick={() => setConfirming(true)}
            style={{
              flex: 1, fontSize: 12, fontWeight: 700, color: "#e53935",
              border: "1px solid rgba(255,107,107,0.3)", borderRadius: 8,
              padding: "6px 12px", background: "transparent", cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Eliminar
          </button>
        ) : (
          <div style={{ flex: 1, display: "flex", gap: 4 }}>
            <button
              onClick={handleDelete}
              disabled={deleting}
              style={{
                flex: 1, fontSize: 11, fontWeight: 700, color: "#e53935",
                border: "1px solid rgba(255,107,107,0.5)", borderRadius: 8,
                padding: "6px 8px", background: "rgba(255,107,107,0.1)",
                cursor: deleting ? "not-allowed" : "pointer", fontFamily: "inherit",
                opacity: deleting ? 0.6 : 1,
              }}
            >
              {deleting ? "..." : "¿Confirm?"}
            </button>
            <button
              onClick={() => setConfirming(false)}
              disabled={deleting}
              style={{
                fontSize: 11, color: "#9099b8",
                border: "1px solid #d5daea", borderRadius: 8,
                padding: "6px 10px", background: "transparent",
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {error && (
        <p style={{ fontSize: 11, color: "#e53935", marginTop: 6, marginBottom: 0 }}>
          {error}
        </p>
      )}
    </div>
  );
}
