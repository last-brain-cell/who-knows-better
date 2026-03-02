"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { TOPIC_GENRES } from "@/lib/constants";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function CreatePage() {
  const router = useRouter();
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [selectedSubtopic, setSelectedSubtopic] = useState<string | null>(null);
  const [customTopic, setCustomTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const genre = TOPIC_GENRES.find((g) => g.id === selectedGenre);

  const handleCreate = async () => {
    const topic = customTopic.trim() || genre?.name || "";
    const subtopic = customTopic.trim() ? "" : selectedSubtopic || "";

    if (!topic) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/api/rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, subtopic }),
      });

      if (!res.ok) {
        throw new Error("Failed to create room");
      }

      const data = await res.json();
      router.push(`/play/${data.code}`);
    } catch {
      setError("Failed to create room. Make sure the server is running.");
      setLoading(false);
    }
  };

  const isReady = customTopic.trim() || (selectedGenre && selectedSubtopic);

  return (
    <div className="flex min-h-screen flex-col items-center px-6 py-12">
      <motion.div
        className="w-full max-w-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <div className="mb-10 flex items-center gap-4">
          <button
            onClick={() => router.push("/")}
            className="text-muted transition-colors hover:text-text"
          >
            &larr; Back
          </button>
          <h1 className="text-2xl font-bold tracking-tight">PICK YOUR ARENA</h1>
        </div>

        {/* Topic Grid */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {TOPIC_GENRES.map((g, i) => (
            <motion.button
              key={g.id}
              onClick={() => {
                setSelectedGenre(g.id === selectedGenre ? null : g.id);
                setSelectedSubtopic(null);
                setCustomTopic("");
              }}
              className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-all ${
                selectedGenre === g.id
                  ? "border-primary/50 bg-surface glow-primary"
                  : "border-surface-light bg-surface/50 hover:border-muted/30"
              }`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-2xl">{g.emoji}</span>
              <span className="text-sm font-medium">{g.name}</span>
            </motion.button>
          ))}
        </div>

        {/* Subtopics */}
        <AnimatePresence>
          {genre && (
            <motion.div
              className="mb-8"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <p className="mb-3 text-sm text-muted">
                {genre.emoji} {genre.name} &mdash; Pick a focus
              </p>
              <div className="flex flex-wrap gap-2">
                {genre.subtopics.map((sub) => (
                  <button
                    key={sub}
                    onClick={() => {
                      setSelectedSubtopic(sub === selectedSubtopic ? null : sub);
                      setCustomTopic("");
                    }}
                    className={`rounded-lg border px-4 py-2 text-sm transition-all ${
                      selectedSubtopic === sub
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-surface-light hover:border-muted/50"
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Divider */}
        <div className="mb-6 flex items-center gap-4">
          <div className="h-px flex-1 bg-surface-light" />
          <span className="text-sm text-muted">or</span>
          <div className="h-px flex-1 bg-surface-light" />
        </div>

        {/* Custom Topic */}
        <input
          type="text"
          value={customTopic}
          onChange={(e) => {
            setCustomTopic(e.target.value);
            if (e.target.value.trim()) {
              setSelectedGenre(null);
              setSelectedSubtopic(null);
            }
          }}
          placeholder="Type any topic... e.g., &quot;Indian street food&quot;, &quot;Norse mythology&quot;"
          className="mb-8 w-full rounded-xl border border-surface-light bg-surface px-5 py-4 text-text placeholder:text-muted/50 focus:border-primary/50 focus:outline-none"
        />

        {/* Selection indicator */}
        {isReady && (
          <motion.p
            className="mb-4 text-sm text-muted"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            Selected:{" "}
            <span className="text-primary">
              {customTopic.trim() || `${genre?.name} → ${selectedSubtopic}`}
            </span>
          </motion.p>
        )}

        {/* Error */}
        {error && (
          <p className="mb-4 text-sm text-wrong">{error}</p>
        )}

        {/* Create Button */}
        <motion.button
          onClick={handleCreate}
          disabled={!isReady || loading}
          className="w-full rounded-xl bg-primary px-8 py-4 text-lg font-bold text-bg transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-30"
          whileHover={isReady && !loading ? { scale: 1.02 } : {}}
          whileTap={isReady && !loading ? { scale: 0.98 } : {}}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-3">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="inline-block h-5 w-5 rounded-full border-2 border-bg border-t-transparent"
              />
              Getting things ready...
            </span>
          ) : (
            "CREATE ROOM"
          )}
        </motion.button>
      </motion.div>
    </div>
  );
}
