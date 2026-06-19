"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Zap,
  BarChart3,
  Bell,
  GitCompare,
  Sparkles,
  Shield,
  ArrowRight,
  Youtube,
  Github,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Youtube,
    title: "Channel Monitoring",
    description:
      "Track competitor YouTube channels with automatic polling and change detection.",
  },
  {
    icon: BarChart3,
    title: "Change Detection",
    description:
      "Diff engine catches title, thumbnail, description, tag, and view count changes.",
  },
  {
    icon: Sparkles,
    title: "AI Intelligence",
    description:
      "A/B test detection, upload schedule analysis, content gap analysis, and more.",
  },
  {
    icon: Bell,
    title: "Smart Alerts",
    description:
      "Get notified via Email, Slack, Discord, Telegram, or Webhooks.",
  },
  {
    icon: GitCompare,
    title: "Channel Comparison",
    description:
      "Side-by-side content gap analysis between competitors.",
  },
  {
    icon: Shield,
    title: "Self-Hosted",
    description:
      "Docker Compose in one command. Full control over your data.",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 24 },
  },
};

export default function RootPage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Background gradient */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-[128px]" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[400px] translate-y-1/2 rounded-full bg-primary/10 blur-[128px]" />
      </div>

      {/* Navigation */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        className="relative z-10 flex items-center justify-between border-b border-border/50 px-6 py-4 backdrop-blur-xl"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Zap className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-sm font-semibold tracking-tight">
            Open Monitor YT
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/feed">Dashboard</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/admin">Settings</Link>
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <a
              href="https://github.com/springmusk026/Open-Monitor-YT"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </motion.nav>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 pb-24 pt-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 20,
            delay: 0.1,
          }}
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/50 bg-muted/50 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Open Source · Self-Hostable · MIT Licensed
          </div>

          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            YouTube Competitive
            <br />
            <span className="bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
              Intelligence
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Track competitor channels, detect every change, and get AI-powered
            insights — all self-hosted with full control over your data.
          </p>

          <div className="mt-8 flex justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/dashboard/feed">
                Open Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/dashboard/admin">
                Admin Settings
              </Link>
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 20 }}
          className="mb-12 text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight">
            Everything you need
          </h2>
          <p className="mt-2 text-muted-foreground">
            Full-featured competitive intelligence platform
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((feature) => (
            <motion.div key={feature.title} variants={item}>
              <Card className="group h-full transition-colors hover:bg-accent/5">
                <CardContent className="p-6">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="relative z-10 border-t border-border/50 py-8 text-center text-sm text-muted-foreground"
      >
        <div className="flex flex-col items-center gap-3">
          <p>Open Monitor YT · Built with AI assistance</p>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/springmusk026/Open-Monitor-YT"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 transition-colors hover:text-foreground"
            >
              <Github className="h-4 w-4" />
              GitHub
            </a>
            <span>·</span>
            <a
              href="https://github.com/springmusk026/Open-Monitor-YT/blob/main/VIBE.md"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-foreground"
            >
              VIBE.md
            </a>
            <span>·</span>
            <a
              href="https://github.com/springmusk026/Open-Monitor-YT/blob/main/LICENSE"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-foreground"
            >
              License
            </a>
          </div>
        </div>
      </motion.footer>
    </main>
  );
}
