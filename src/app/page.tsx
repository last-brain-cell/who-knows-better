"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function Home() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");
  const [showJoin, setShowJoin] = useState(false);

  const handleJoin = () => {
    const code = joinCode.trim().toUpperCase();
    if (code.length === 5) {
      router.push(`/play/${code}`);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      {/* Floating particles effect */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className={`absolute h-1 w-1 rounded-full ${i % 2 === 0 ? "bg-primary/20" : "bg-secondary/20"}`}
            initial={{
              x: Math.random() * (typeof window !== "undefined" ? window.innerWidth : 1000),
              y: Math.random() * (typeof window !== "undefined" ? window.innerHeight : 800),
            }}
            animate={{
              y: [null, -20, 20],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 3 + Math.random() * 4,
              repeat: Infinity,
              repeatType: "reverse",
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <motion.div
        className="relative z-10 flex flex-col items-center gap-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Logo */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h1 className="font-[family-name:var(--font-display)] text-6xl font-bold tracking-tight sm:text-7xl">
            <span className="text-text">WHO KNOWS</span>
            <br />
            <motion.span
              className="text-primary text-neon-pink"
              animate={{ opacity: [1, 0.7, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              BETTER?
            </motion.span>
          </h1>
        </motion.div>

        {/* Buttons */}
        <div className="flex w-full max-w-xs flex-col gap-4">
          <motion.button
            onClick={() => router.push("/create")}
            className="w-full rounded-xl bg-primary px-8 py-4 text-lg font-bold text-bg transition-all hover:brightness-110"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            CREATE GAME
          </motion.button>

          {!showJoin ? (
            <motion.button
              onClick={() => setShowJoin(true)}
              className="w-full rounded-xl border border-surface-light bg-surface px-8 py-4 text-lg font-semibold text-text transition-all hover:border-primary/30"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              JOIN WITH CODE
            </motion.button>
          ) : (
            <motion.div
              className="flex gap-2"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
            >
              <input
                type="text"
                maxLength={5}
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                placeholder="ENTER CODE"
                autoFocus
                className="flex-1 rounded-xl border border-surface-light bg-surface px-4 py-4 text-center font-[family-name:var(--font-mono)] text-xl font-bold tracking-[0.3em] text-text placeholder:text-muted/50 placeholder:tracking-[0.15em] focus:border-primary/50 focus:outline-none"
              />
              <motion.button
                onClick={handleJoin}
                disabled={joinCode.length !== 5}
                className="rounded-xl bg-primary px-6 py-4 font-bold text-bg transition-all disabled:opacity-30"
                whileTap={{ scale: 0.95 }}
              >
                GO
              </motion.button>
            </motion.div>
          )}
        </div>

        {/* Tagline */}
        <motion.p
          className="text-lg text-muted"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          Settle it.
        </motion.p>
      </motion.div>
    </div>
  );
}
