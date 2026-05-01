import React from 'react';
import {
  Brain, Mic, FileText, BarChart2, Zap, Shield,
  ArrowRight, Star, Clock, CheckCircle
} from 'lucide-react';

interface Props {
  onStart: () => void;
}

const features = [
  {
    icon: FileText,
    color: 'violet',
    title: 'Resume Upload',
    desc: 'Upload your PDF resume in seconds. We extract your profile to personalise the interview.',
  },
  {
    icon: Mic,
    color: 'sky',
    title: 'Voice & Text Input',
    desc: 'Answer with your voice or type — both modes sync in real-time to the same field.',
  },
  {
    icon: Brain,
    color: 'fuchsia',
    title: 'AI-Powered Feedback',
    desc: 'Gemini AI analyses every answer and returns scores, strengths, and improvement tips.',
  },
  {
    icon: BarChart2,
    color: 'emerald',
    title: 'Detailed Scorecard',
    desc: 'Get a full breakdown per question with an overall rating and a downloadable report.',
  },
  {
    icon: Clock,
    color: 'amber',
    title: 'Per-Question Timer',
    desc: 'Track time spent on each question just like a real interview setting.',
  },
  {
    icon: Shield,
    color: 'teal',
    title: 'Auto-Save Drafts',
    desc: 'Your answers are saved locally as you type — never lose progress on refresh.',
  },
];

const colorMap: Record<string, { ring: string; bg: string; text: string; badge: string }> = {
  violet:  { ring: 'ring-violet-500/30',  bg: 'bg-violet-500/10',  text: 'text-violet-400',  badge: 'bg-violet-500/15 text-violet-300' },
  sky:     { ring: 'ring-sky-500/30',     bg: 'bg-sky-500/10',     text: 'text-sky-400',     badge: 'bg-sky-500/15 text-sky-300' },
  fuchsia: { ring: 'ring-fuchsia-500/30', bg: 'bg-fuchsia-500/10', text: 'text-fuchsia-400', badge: 'bg-fuchsia-500/15 text-fuchsia-300' },
  emerald: { ring: 'ring-emerald-500/30', bg: 'bg-emerald-500/10', text: 'text-emerald-400', badge: 'bg-emerald-500/15 text-emerald-300' },
  amber:   { ring: 'ring-amber-500/30',   bg: 'bg-amber-500/10',   text: 'text-amber-400',   badge: 'bg-amber-500/15 text-amber-300' },
  teal:    { ring: 'ring-teal-500/30',    bg: 'bg-teal-500/10',    text: 'text-teal-400',    badge: 'bg-teal-500/15 text-teal-300' },
};

const steps = [
  { num: '01', label: 'Upload Resume',      desc: 'Drop your PDF and we parse your profile instantly.' },
  { num: '02', label: 'Answer Questions',   desc: '5 classic HR questions — voice or text, your choice.' },
  { num: '03', label: 'Get AI Feedback',    desc: 'Scores, strengths, improvements — all in seconds.' },
];

const stats = [
  { value: '5',    label: 'HR Questions',      icon: '📋' },
  { value: 'AI',   label: 'Powered Feedback',  icon: '🤖' },
  { value: '10s',  label: 'Setup Time',         icon: '⚡' },
  { value: '100%', label: 'Free to Use',        icon: '🎁' },
];

export default function HomePage({ onStart }: Props) {
  return (
    <div className="min-h-screen animate-fade-in">

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center text-center
                          px-4 pt-20 pb-16 overflow-hidden">
        {/* Glowing orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px]
                          rounded-full bg-violet-600/10 blur-3xl" />
          <div className="absolute top-10 right-10 w-64 h-64 rounded-full bg-indigo-500/8 blur-3xl" />
          <div className="absolute bottom-0 left-10 w-48 h-48 rounded-full bg-fuchsia-500/8 blur-3xl" />
        </div>

        {/* Badge */}
        <div className="relative inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full
                        bg-violet-500/10 border border-violet-500/20 text-violet-300 text-sm
                        font-medium animate-slide-up">
          <Zap className="w-4 h-4 fill-violet-400 text-violet-400" />
          AI-Powered · Free to Use · No Sign-Up
        </div>

        {/* Headline */}
        <h1 className="relative text-5xl sm:text-6xl md:text-7xl font-black tracking-tight
                       leading-none mb-6 animate-slide-up">
          <span className="text-white">Your</span>
          <br />
          <span className="text-gradient">HR Interview</span>
        </h1>

        {/* Sub */}
        <p className="relative max-w-xl text-slate-400 text-lg sm:text-xl leading-relaxed
                      mb-10 animate-slide-up">
          Upload your resume, answer 5 real HR questions using your{' '}
          <span className="text-slate-200 font-medium">voice or keyboard</span>, and get
          instant <span className="text-violet-300 font-medium">AI feedback</span> with scores
          and coaching tips.
        </p>

        {/* CTA */}
        <div className="relative flex flex-col sm:flex-row items-center gap-4 animate-slide-up">
          <button
            id="start-interview-btn"
            onClick={onStart}
            className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-2xl
                       bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-lg
                       shadow-2xl shadow-violet-900/50
                       hover:from-violet-500 hover:to-indigo-500 hover:shadow-violet-700/50
                       hover:scale-105 active:scale-95 transition-all duration-300"
            aria-label="Start your interview — upload resume"
          >
            <Brain className="w-6 h-6" />
            Start My Interview
            <ArrowRight className="w-5 h-5 transition-transform duration-300
                                  group-hover:translate-x-1" />
          </button>

          <div className="flex items-center gap-1.5 text-sm text-slate-500">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            No account needed
          </div>
        </div>

        {/* Stars */}
        <div className="relative flex items-center gap-1 mt-8 text-amber-400">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-4 h-4 fill-amber-400" />
          ))}
          <span className="ml-2 text-sm text-slate-400">Loved by job seekers</span>
        </div>
      </section>

      {/* ── Stats bar ──────────────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-4 mb-16">
        <div className="card grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0
                        divide-white/[0.06]">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-1 py-5 px-4 text-center">
              <span className="text-2xl">{s.icon}</span>
              <span className="text-2xl font-black text-white">{s.value}</span>
              <span className="text-xs text-slate-500">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 mb-20">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">How It Works</h2>
          <p className="text-slate-500 text-sm">Three simple steps to interview-ready confidence</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {steps.map((s, i) => (
            <div key={s.num}
              className="card-sm p-6 flex flex-col gap-3 hover:border-violet-500/25
                         hover:bg-white/[0.06] transition-all duration-300 group">
              <div className="flex items-center gap-3">
                <span className="text-3xl font-black text-gradient opacity-60 group-hover:opacity-100
                                 transition-opacity">{s.num}</span>
                {i < steps.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-slate-700 hidden sm:block" />
                )}
              </div>
              <h3 className="font-bold text-slate-100">{s.label}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Feature grid ───────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 mb-20">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Everything You Need</h2>
          <p className="text-slate-500 text-sm">Built for real interview practice, not just quizzes</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(({ icon: Icon, color, title, desc }) => {
            const c = colorMap[color];
            return (
              <div key={title}
                className={`card-sm p-5 space-y-3 ring-1 ${c.ring} hover:scale-[1.02]
                            hover:bg-white/[0.07] transition-all duration-300`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.bg}`}>
                  <Icon className={`w-5 h-5 ${c.text}`} />
                </div>
                <h3 className="font-semibold text-slate-100">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Bottom CTA ─────────────────────────────────────────────────────── */}
      <section className="max-w-2xl mx-auto px-4 pb-20 text-center">
        <div className="card p-10 space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600
                          flex items-center justify-center mx-auto shadow-xl shadow-violet-900/50">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Ready to Start?</h2>
            <p className="text-slate-400 text-sm">
              Your interview session is private and runs entirely in your browser.
            </p>
          </div>
          <button
            onClick={onStart}
            id="start-interview-bottom-btn"
            className="group inline-flex items-center gap-3 px-8 py-4 rounded-2xl
                       bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-base
                       shadow-xl shadow-violet-900/40 hover:from-violet-500 hover:to-indigo-500
                       hover:scale-105 active:scale-95 transition-all duration-300"
            aria-label="Begin interview"
          >
            Upload Resume &amp; Begin
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

    </div>
  );
}
