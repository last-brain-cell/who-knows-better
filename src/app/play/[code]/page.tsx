"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useSocket } from "@/hooks/useSocket";
import { useTimer } from "@/hooks/useTimer";
import confetti from "canvas-confetti";

type GamePhase = "connecting" | "lobby" | "countdown" | "playing" | "result" | "gameover";

interface RoomInfo {
  code: string;
  topic: string;
  subtopic: string;
  playerNumber: number;
  playerId: string;
}

interface RoundResultData {
  fact: { statement: string; answer: boolean; explanation: string };
  roundNum: number;
  correctAnswer: boolean;
  players: Record<string, {
    answer: boolean | null;
    timeMs: number | null;
    points: number;
    speedBonus: number;
    streakBonus: number;
    correct: boolean;
  }>;
  scores: Record<string, number>;
}

interface FinalReportData {
  winner: string | null;
  topic: string;
  subtopic: string;
  players: Record<string, {
    score: number;
    correctCount: number;
    avgTimeMs: number;
    bestStreak: number;
    fastestRounds: number;
    roundResults: { correct: boolean; timeMs: number | null; answer: boolean | null; points: number }[];
  }>;
}

export default function PlayPage() {
  const params = useParams();
  const code = (params.code as string).toUpperCase();
  const { socket, connected, ping, emit, on } = useSocket();

  const [phase, setPhase] = useState<GamePhase>("connecting");
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [opponentConnected, setOpponentConnected] = useState(false);
  const [factsLoading, setFactsLoading] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [currentFact, setCurrentFact] = useState("");
  const [roundNum, setRoundNum] = useState(0);
  const [totalRounds, setTotalRounds] = useState(10);
  const [myAnswer, setMyAnswer] = useState<boolean | null>(null);
  const [opponentAnswered, setOpponentAnswered] = useState(false);
  const [opponentVotedSkip, setOpponentVotedSkip] = useState(false);
  const [myVotedSkip, setMyVotedSkip] = useState(false);
  const [roundResult, setRoundResult] = useState<RoundResultData | null>(null);
  const [finalReport, setFinalReport] = useState<FinalReportData | null>(null);
  const [myScore, setMyScore] = useState(0);
  const [oppScore, setOppScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [disconnected, setDisconnected] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shaking, setShaking] = useState(false);

  const factDisplayedAtRef = useRef<number>(0);
  const timer = useTimer(20000);
  const resultTimer = useTimer(10000);

  const getOpponentId = useCallback(() => {
    if (!roomInfo || !roundResult) return null;
    return Object.keys(roundResult.players).find((id) => id !== roomInfo.playerId) || null;
  }, [roomInfo, roundResult]);

  const getOpponentIdFromReport = useCallback(() => {
    if (!roomInfo || !finalReport) return null;
    return Object.keys(finalReport.players).find((id) => id !== roomInfo.playerId) || null;
  }, [roomInfo, finalReport]);

  // Join room on connect
  useEffect(() => {
    if (connected && phase === "connecting") {
      emit("join_room", code);
    }
  }, [connected, phase, code, emit]);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    const cleanups: (() => void)[] = [];

    cleanups.push(on("room_joined", (data: any) => {
      setRoomInfo({
        code: data.code,
        topic: data.topic,
        subtopic: data.subtopic,
        playerNumber: data.playerNumber,
        playerId: data.playerId,
      });
      setOpponentConnected(data.opponentConnected);
      setPhase("lobby");
    }));

    cleanups.push(on("opponent_joined", () => {
      setOpponentConnected(true);
    }));

    cleanups.push(on("facts_loading", () => {
      setFactsLoading(true);
    }));

    cleanups.push(on("game_start", (cd: number) => {
      setFactsLoading(false);
      setPhase("countdown");
      setCountdown(cd);
      let c = cd;
      const interval = setInterval(() => {
        c--;
        setCountdown(c);
        if (c <= 0) clearInterval(interval);
      }, 1000);
    }));

    cleanups.push(on("new_fact", (data: any) => {
      setPhase("playing");
      setCurrentFact(data.statement);
      setRoundNum(data.roundNum);
      setTotalRounds(data.totalRounds);
      setMyAnswer(null);
      setOpponentAnswered(false);
      setOpponentVotedSkip(false);
      setMyVotedSkip(false);
      factDisplayedAtRef.current = Date.now();
      timer.reset();
      timer.start();
    }));

    cleanups.push(on("opponent_answered", () => {
      setOpponentAnswered(true);
    }));

    cleanups.push(on("opponent_voted_regenerate", () => {
      setOpponentVotedSkip(true);
    }));

    cleanups.push(on("fact_regenerated", (data: any) => {
      setCurrentFact(data.statement);
      setMyAnswer(null);
      setOpponentAnswered(false);
      setOpponentVotedSkip(false);
      setMyVotedSkip(false);
      factDisplayedAtRef.current = Date.now();
      timer.reset();
      timer.start();
    }));

    cleanups.push(on("round_result", (result: RoundResultData) => {
      timer.stop();
      resultTimer.reset();
      resultTimer.start();
      setRoundResult(result);
      setPhase("result");

      // Update scores
      if (roomInfo) {
        const myData = result.players[roomInfo.playerId];
        setMyScore(result.scores[roomInfo.playerId] || 0);
        const oppId = Object.keys(result.players).find((id) => id !== roomInfo.playerId);
        if (oppId) setOppScore(result.scores[oppId] || 0);

        if (myData?.correct) {
          setStreak((s) => s + 1);
          // Confetti for correct
          confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
        } else {
          setStreak(0);
          setShaking(true);
          setTimeout(() => setShaking(false), 500);
        }
      }
    }));

    cleanups.push(on("game_over", (report: FinalReportData) => {
      setFinalReport(report);
      setPhase("gameover");

      if (roomInfo && report.winner === roomInfo.playerId) {
        // Big confetti for winner
        const end = Date.now() + 2000;
        const frame = () => {
          confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 } });
          confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 } });
          if (Date.now() < end) requestAnimationFrame(frame);
        };
        frame();
      }
    }));

    cleanups.push(on("player_disconnected", () => {
      setDisconnected(true);
    }));

    cleanups.push(on("player_reconnected", () => {
      setDisconnected(false);
    }));

    cleanups.push(on("room_error", (msg: string) => {
      setError(msg);
    }));

    cleanups.push(on("rematch_requested", () => {
      // Show "opponent wants rematch" indicator — handled in UI
    }));

    cleanups.push(on("rematch_start", () => {
      setPhase("lobby");
      setMyScore(0);
      setOppScore(0);
      setStreak(0);
      setRoundResult(null);
      setFinalReport(null);
      setFactsLoading(false);
    }));

    return () => cleanups.forEach((c) => c());
  }, [socket, on, roomInfo, timer]);

  const submitAnswer = (answer: boolean) => {
    if (myAnswer !== null) return;
    const clientTimestampMs = Date.now() - factDisplayedAtRef.current;
    setMyAnswer(answer);
    emit("select_answer", answer, clientTimestampMs);
    timer.stop();
  };

  const voteSkip = () => {
    if (myVotedSkip) return;
    setMyVotedSkip(true);
    emit("vote_regenerate");
  };

  const copyCode = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLink = async () => {
    const url = `${window.location.origin}/play/${code}`;
    if (navigator.share) {
      await navigator.share({ title: "Who Knows Better?", text: `Think you know better? Join my game.`, url });
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // ─── Error State ───
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="text-center">
          <h2 className="mb-2 text-2xl font-bold text-wrong">{error}</h2>
          <button
            onClick={() => (window.location.href = "/")}
            className="mt-4 rounded-xl bg-surface px-6 py-3 text-text hover:bg-surface-light"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // ─── Connecting ───
  if (phase === "connecting") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="mx-auto mb-4 h-8 w-8 rounded-full border-2 border-primary border-t-transparent"
          />
          <p className="text-muted">Connecting...</p>
        </motion.div>
      </div>
    );
  }

  // ─── Lobby ───
  if (phase === "lobby" && roomInfo) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6">
        <motion.div
          className="w-full max-w-md text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="mb-2 text-sm text-muted uppercase tracking-widest">Your Room Code</p>

          {/* Room Code Display */}
          <div className="mb-6 flex justify-center gap-2">
            {code.split("").map((char, i) => (
              <motion.div
                key={i}
                className="flex h-16 w-14 items-center justify-center rounded-lg border border-primary/30 bg-surface font-[family-name:var(--font-mono)] text-3xl font-bold text-primary"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                {char}
              </motion.div>
            ))}
          </div>

          {/* Share Buttons */}
          <div className="mb-8 flex justify-center gap-3">
            <button
              onClick={copyCode}
              className="rounded-lg border border-surface-light bg-surface px-4 py-2 text-sm transition-colors hover:border-muted/50"
            >
              {copied ? "Copied" : "Copy Code"}
            </button>
            <button
              onClick={shareLink}
              className="rounded-lg border border-surface-light bg-surface px-4 py-2 text-sm transition-colors hover:border-muted/50"
            >
              Share Link
            </button>
          </div>

          {/* Topic */}
          <p className="mb-8 text-muted">
            Topic: <span className="text-text">{roomInfo.topic}{roomInfo.subtopic ? ` — ${roomInfo.subtopic}` : ""}</span>
          </p>

          {/* Players */}
          <div className="mb-8 flex justify-center gap-6">
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-20 w-20 items-center justify-center rounded-xl border border-correct/30 bg-surface">
                <span className="text-2xl font-bold text-correct">YOU</span>
              </div>
              <span className="text-sm text-correct">Ready</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-20 w-20 items-center justify-center rounded-xl border border-surface-light bg-surface">
                {opponentConnected ? (
                  <span className="text-2xl font-bold text-secondary">P2</span>
                ) : (
                  <span className="text-2xl text-muted">???</span>
                )}
              </div>
              <span className="text-sm text-muted">
                {opponentConnected ? "Ready" : "Waiting"}
              </span>
            </div>
          </div>

          {!opponentConnected && (
            <div className="flex items-center justify-center gap-2">
              <p className="text-muted">Waiting for opponent</p>
              <span className="flex gap-1">
                <span className="pulse-dot h-2 w-2 rounded-full bg-primary" />
                <span className="pulse-dot h-2 w-2 rounded-full bg-primary" />
                <span className="pulse-dot h-2 w-2 rounded-full bg-primary" />
              </span>
            </div>
          )}

          {opponentConnected && factsLoading && (
            <div className="flex items-center justify-center gap-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent"
              />
              <p className="text-muted">Getting things ready...</p>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  // ─── Countdown ───
  if (phase === "countdown") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <motion.div
          key={countdown}
          className="font-[family-name:var(--font-display)] text-8xl font-bold text-primary"
          initial={{ scale: 2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          {countdown > 0 ? countdown : "GO"}
        </motion.div>
      </div>
    );
  }

  // ─── Playing ───
  if (phase === "playing" && roomInfo) {
    const urgency = timer.progress > 0.5 ? "false" : timer.progress > 0.25 ? "caution" : "true";

    return (
      <div className={`flex min-h-screen flex-col px-6 py-6 ${shaking ? "screen-shake" : ""}`}>
        {/* Top Bar */}
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-muted">
            Round {roundNum}/{totalRounds}
          </span>
          {ping !== null && (
            <span className="font-[family-name:var(--font-mono)] text-xs text-muted">
              {ping}ms
            </span>
          )}
          <span className="font-[family-name:var(--font-mono)] text-muted">
            {timer.seconds}s
          </span>
        </div>

        {/* Timer Bar */}
        <div className="mb-6 h-1 w-full overflow-hidden rounded-full bg-surface">
          <div
            className="timer-bar h-full rounded-full"
            data-urgent={urgency}
            style={{ width: `${timer.progress * 100}%` }}
          />
        </div>

        {/* Topic */}
        <p className="mb-6 text-center text-sm text-muted">
          {roomInfo.topic}{roomInfo.subtopic ? ` — ${roomInfo.subtopic}` : ""}
        </p>

        {/* Fact Card */}
        <motion.div
          className="mx-auto mb-8 w-full max-w-lg rounded-2xl border border-surface-light bg-surface p-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          key={currentFact}
        >
          <p className="text-center text-xl font-medium leading-relaxed">{currentFact}</p>
        </motion.div>

        {/* Disconnect Warning */}
        {disconnected && (
          <p className="mb-4 text-center text-sm text-wrong">Opponent disconnected. Waiting for reconnection...</p>
        )}

        {/* Answer Buttons */}
        <div className="mx-auto flex w-full max-w-lg gap-4">
          <motion.button
            onClick={() => submitAnswer(true)}
            disabled={myAnswer !== null}
            className={`flex-1 rounded-xl py-5 text-lg font-bold transition-all ${
              myAnswer === true
                ? "bg-correct/20 border-2 border-correct text-correct"
                : myAnswer !== null
                  ? "opacity-30 bg-surface border border-surface-light"
                  : "bg-surface border border-surface-light hover:border-correct/50 hover:bg-correct/10"
            }`}
            whileTap={myAnswer === null ? { scale: 0.95 } : {}}
          >
            TRUE
          </motion.button>
          <motion.button
            onClick={() => submitAnswer(false)}
            disabled={myAnswer !== null}
            className={`flex-1 rounded-xl py-5 text-lg font-bold transition-all ${
              myAnswer === false
                ? "bg-wrong/20 border-2 border-wrong text-wrong"
                : myAnswer !== null
                  ? "opacity-30 bg-surface border border-surface-light"
                  : "bg-surface border border-surface-light hover:border-wrong/50 hover:bg-wrong/10"
            }`}
            whileTap={myAnswer === null ? { scale: 0.95 } : {}}
          >
            FALSE
          </motion.button>
        </div>

        {/* Skip Button */}
        {myAnswer === null && (
          <div className="mt-4 flex justify-center">
            <button
              onClick={voteSkip}
              disabled={myVotedSkip}
              className={`text-sm transition-colors ${
                myVotedSkip ? "text-primary" : "text-muted hover:text-text"
              }`}
            >
              {myVotedSkip
                ? opponentVotedSkip
                  ? "Skipping..."
                  : "Voted to skip (waiting for opponent)"
                : "Skip this fact"}
            </button>
          </div>
        )}

        {/* Status Bar */}
        <div className="mt-auto flex items-center justify-between pt-8 text-sm">
          <div>
            <span className="text-muted">You: </span>
            <span className="font-bold text-primary">{myScore}</span>
            {streak >= 3 && <span className="ml-2 text-xs text-primary">{streak} streak</span>}
          </div>
          <div>
            {opponentAnswered && myAnswer === null && (
              <motion.span
                className="text-xs text-secondary"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                Opponent locked in
              </motion.span>
            )}
          </div>
          <div>
            <span className="text-muted">Opponent: </span>
            <span className="font-bold text-secondary">{oppScore}</span>
          </div>
        </div>
      </div>
    );
  }

  // ─── Round Result ───
  if (phase === "result" && roundResult && roomInfo) {
    const myData = roundResult.players[roomInfo.playerId];
    const oppId = getOpponentId();
    const oppData = oppId ? roundResult.players[oppId] : null;

    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6">
        <motion.div
          className="w-full max-w-md text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          {/* Correct Answer */}
          <motion.h2
            className={`font-[family-name:var(--font-display)] mb-2 text-4xl font-bold ${roundResult.correctAnswer ? "text-correct" : "text-wrong"}`}
            initial={{ y: -20 }}
            animate={{ y: 0 }}
          >
            {roundResult.correctAnswer ? "TRUE" : "FALSE"}
          </motion.h2>
          <p className="mb-8 text-sm text-muted">{roundResult.fact.explanation}</p>

          {/* Player Results */}
          <div className="mb-6 flex justify-center gap-6">
            <div
              className={`flex-1 rounded-xl border p-4 ${
                myData?.correct ? "border-correct/30 glow-correct" : "border-wrong/30"
              }`}
            >
              <p className="mb-1 text-sm text-muted">YOU</p>
              <p className={`text-lg font-bold ${myData?.correct ? "text-correct" : "text-wrong"}`}>
                {myData?.answer !== null ? (myData?.answer ? "TRUE" : "FALSE") : "—"}
              </p>
              <p className="text-2xl font-bold text-primary">+{myData?.points || 0}</p>
              {myData?.timeMs !== null && (
                <p className="text-xs text-muted">{((myData?.timeMs || 0) / 1000).toFixed(1)}s</p>
              )}
            </div>
            <div
              className={`flex-1 rounded-xl border p-4 ${
                oppData?.correct ? "border-correct/30" : "border-wrong/30"
              }`}
            >
              <p className="mb-1 text-sm text-muted">OPP</p>
              <p className={`text-lg font-bold ${oppData?.correct ? "text-correct" : "text-wrong"}`}>
                {oppData?.answer !== null ? (oppData?.answer ? "TRUE" : "FALSE") : "—"}
              </p>
              <p className="text-2xl font-bold text-secondary">+{oppData?.points || 0}</p>
              {oppData?.timeMs !== null && (
                <p className="text-xs text-muted">{((oppData?.timeMs || 0) / 1000).toFixed(1)}s</p>
              )}
            </div>
          </div>

          {/* Scores */}
          <div className="flex justify-between text-lg">
            <span>
              You: <span className="font-bold text-primary">{roundResult.scores[roomInfo.playerId]}</span>
            </span>
            <span>
              Opp:{" "}
              <span className="font-bold text-secondary">
                {oppId ? roundResult.scores[oppId] : 0}
              </span>
            </span>
          </div>

          {/* Countdown to next round */}
          <div className="mt-6">
            <p className="mb-2 text-sm text-muted">Next round in {resultTimer.seconds}s</p>
            <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full bg-muted"
                initial={{ width: "100%" }}
                animate={{ width: `${resultTimer.progress * 100}%` }}
                transition={{ duration: 0.1, ease: "linear" }}
              />
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── Game Over ───
  if (phase === "gameover" && finalReport && roomInfo) {
    const myStats = finalReport.players[roomInfo.playerId];
    const oppId = getOpponentIdFromReport();
    const oppStats = oppId ? finalReport.players[oppId] : null;
    const iWon = finalReport.winner === roomInfo.playerId;
    const isTie = finalReport.winner === null;

    return (
      <div className="flex min-h-screen flex-col items-center px-6 py-12">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Result Header */}
          <motion.h1
            className={`font-[family-name:var(--font-display)] mb-8 text-center text-4xl font-bold ${isTie ? "text-primary" : iWon ? "text-correct" : "text-muted"}`}
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", bounce: 0.5 }}
          >
            {isTie ? "IT'S A TIE." : iWon ? "YOU WIN." : "NOT THIS TIME."}
          </motion.h1>

          {/* Score Comparison */}
          <div className="mb-8 rounded-xl border border-surface-light bg-surface p-6 text-center">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted">You</p>
                <motion.p
                  className="text-4xl font-bold text-primary"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {myStats?.score || 0}
                </motion.p>
              </div>
              <span className="text-2xl text-muted">vs</span>
              <div>
                <p className="text-sm text-muted">Opponent</p>
                <motion.p
                  className="text-4xl font-bold text-secondary"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  {oppStats?.score || 0}
                </motion.p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mb-8">
            <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-muted">Your Stats</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Correct</span>
                <span>{myStats?.correctCount || 0}/10 | Opp: {oppStats?.correctCount || 0}/10</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Avg time</span>
                <span>
                  {((myStats?.avgTimeMs || 0) / 1000).toFixed(1)}s | Opp:{" "}
                  {((oppStats?.avgTimeMs || 0) / 1000).toFixed(1)}s
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Best streak</span>
                <span>{myStats?.bestStreak || 0} | Opp: {oppStats?.bestStreak || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Fastest on</span>
                <span>{myStats?.fastestRounds || 0}/10 rounds</span>
              </div>
            </div>
          </div>

          {/* Round Breakdown */}
          <div className="mb-8">
            <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-muted">Round Breakdown</h3>
            <div className="space-y-1 font-[family-name:var(--font-mono)] text-xs">
              {myStats?.roundResults.map((r, i) => {
                const oppR = oppStats?.roundResults[i];
                return (
                  <div key={i} className="flex justify-between">
                    <span className="text-muted w-6">{i + 1}.</span>
                    <span className={r.correct ? "text-correct" : "text-wrong"}>
                      {r.correct ? "✓" : "✗"} {r.answer !== null ? (r.answer ? "T" : "F") : "—"}
                      {r.timeMs !== null ? ` (${(r.timeMs / 1000).toFixed(1)}s)` : ""}
                    </span>
                    <span className="text-muted">—</span>
                    <span className={oppR?.correct ? "text-correct" : "text-wrong"}>
                      {oppR?.correct ? "✓" : "✗"} {oppR?.answer !== null ? (oppR?.answer ? "T" : "F") : "—"}
                      {oppR?.timeMs != null ? ` (${(oppR.timeMs / 1000).toFixed(1)}s)` : ""}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <motion.button
              onClick={() => emit("request_rematch")}
              className="flex-1 rounded-xl bg-primary px-6 py-4 font-bold text-bg"
              whileTap={{ scale: 0.95 }}
            >
              REMATCH
            </motion.button>
            <motion.button
              onClick={() => (window.location.href = "/create")}
              className="flex-1 rounded-xl border border-surface-light bg-surface px-6 py-4 font-bold"
              whileTap={{ scale: 0.95 }}
            >
              NEW GAME
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  return null;
}
