"use client";

import { motion } from 'framer-motion';
import { ArrowRight, DownloadCloud, HeartPulse, ShieldCheck, Sparkles, UploadCloud } from 'lucide-react';
import Navbar from '../components/Navbar';
import HeroScene from '../components/HeroScene';
import FeatureCard from '../components/FeatureCard';
import ResponseCard from '../components/ResponseCard';
import TestimonialCard from '../components/TestimonialCard';
import AppShowcase from '../components/AppShowcase';
import Footer from '../components/Footer';
import SectionHeading from '../components/SectionHeading';

const features = [
  {
    icon: ShieldCheck,
    title: 'OCR-powered label scanning',
    description: 'Capture every ingredient instantly with smart label recognition and scan-ready accuracy.',
  },
  {
    icon: Sparkles,
    title: 'Ingredient intelligence',
    description: 'AI explains hidden additives, sugar traps, and inflammatory ingredients in plain language.',
  },
  {
    icon: HeartPulse,
    title: 'Smart health scoring',
    description: 'Get a clear health score that shows how clean or processed your food really is.',
  },
  {
    icon: DownloadCloud,
    title: 'Honest AI feedback',
    description: 'No marketing fluff—raw, human-style verdicts on the food you eat every day.',
  },
  {
    icon: UploadCloud,
    title: 'Nutrition simplification',
    description: 'Calories, sugar, sodium and additives translated into fast, actionable advice.',
  },
  {
    icon: ArrowRight,
    title: 'Multi-image analysis',
    description: 'Compare packaging, ingredient panels and nutrition facts across product shots.',
  },
];

const steps = [
  {
    title: 'Scan product',
    description: 'Use your camera to capture packaging or upload a food label image.',
    accent: '01',
  },
  {
    title: 'AI analyzes ingredients',
    description: 'NutriLens reads labels, spots hidden sugar, and flags risk ingredients instantly.',
    accent: '02',
  },
  {
    title: 'Get instant honest verdict',
    description: 'Receive a brutally honest score and simple guidance to make smarter choices.',
    accent: '03',
  },
];

type ResponsePreview = {
  label: string;
  tone: 'danger' | 'warning' | 'success';
  bullets: string[];
  verdict: string;
};

const responses: ResponsePreview[] = [
  {
    label: 'Unhealthy',
    tone: 'danger',
    bullets: ['3 tsp sugar', 'High sodium', 'Ultra-processed'],
    verdict: 'This is basically junk in disguise.',
  },
  {
    label: 'Moderate',
    tone: 'warning',
    bullets: ['Refined carbs', 'Added flavors', 'Low fiber'],
    verdict: 'Not terrible, but still a label you should approach with caution.',
  },
  {
    label: 'Healthy',
    tone: 'success',
    bullets: ['Whole ingredients', 'Low added sugar', 'High protein'],
    verdict: 'Good choice—clean, honest nutrition with minimal processing.',
  },
];

const stats = [
  { value: '78%', label: 'of shoppers admit labels are confusing' },
  { value: '4x', label: 'more hidden sugar found on packaged foods' },
  { value: '63%', label: 'of diets improve when users scan before buying' },
];

const testimonials = [
  {
    quote: 'NutriLens cut my grocery stress in half. I can finally trust what’s inside the box.',
    name: 'Maya R.',
    role: 'Fitness Coach',
  },
  {
    quote: 'As a busy parent, I love the instant verdicts. It makes healthy shopping fast and simple.',
    name: 'Liam S.',
    role: 'Parent & Designer',
  },
  {
    quote: 'The AI caught hidden additives I would have missed. My diabetes plan stays on track.',
    name: 'Anita K.',
    role: 'Nutrition Manager',
  },
];

export default function HomePage() {
  return (
    <main id="top" className="relative overflow-hidden bg-zinc-950 text-white">
      <Navbar />
      <section className="relative isolate overflow-hidden px-6 pb-24 pt-20 sm:px-10 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="mx-auto flex max-w-7xl flex-col gap-16"
        >
          <div className="grid gap-12 lg:grid-cols-[1.05fr_minmax(420px,0.95fr)] lg:items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-300 shadow-[0_0_40px_rgba(16,185,129,0.08)]">
                New launch · instant food intelligence for every label
              </div>
              <div className="space-y-6">
                <h1 className="max-w-3xl text-5xl font-semibold tracking-[-0.03em] text-slate-50 sm:text-6xl lg:text-7xl">
                  Scan what’s inside your food. Get a verdict your doctor would respect.
                </h1>
                <p className="max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
                  NutriLens AI turns your phone into a nutrition detective. Scan packaged foods, upload label images, and see honest, health-first feedback in seconds.
                </p>
              </div>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <a href="/demo" className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-zinc-950 shadow-[0_24px_60px_rgba(16,185,129,0.24)] transition hover:-translate-y-0.5 hover:bg-emerald-400">
                  Try Demo
                  <ArrowRight size={16} />
                </a>
                <a href="#cta" className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-700/80 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:border-slate-600 hover:bg-slate-800/80">
                  Download App
                </a>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-white/5 bg-white/5 p-5 shadow-[0_30px_100px_rgba(255,255,255,0.03)] backdrop-blur-xl">
                  <p className="text-sm uppercase tracking-[0.24em] text-emerald-300">Trusted insight</p>
                  <p className="mt-3 text-lg font-semibold text-slate-100">Food score, sugar alert, processing level — all in one scan.</p>
                </div>
                <div className="rounded-3xl border border-white/5 bg-slate-900/70 p-5 shadow-[0_30px_100px_rgba(0,0,0,0.3)] backdrop-blur-xl">
                  <p className="text-sm uppercase tracking-[0.24em] text-amber-300">Gut health first</p>
                  <p className="mt-3 text-lg font-semibold text-slate-100">Instant guidance for cleaner meals, smarter snacks, and safer grocery choices.</p>
                </div>
              </div>
            </div>
            <HeroScene />
          </div>
        </motion.div>
      </section>

      <section id="how-it-works" className="border-t border-white/10 bg-zinc-950/80 px-6 py-20 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <SectionHeading title="How it works" subtitle="Three fast steps to smarter eating." />
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {steps.map((step, index) => (
              <motion.div
                key={step.accent}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                className="group rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-[0_30px_100px_rgba(255,255,255,0.04)] backdrop-blur-xl"
              >
                <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-300/15">
                  <span className="text-xl font-semibold">{step.accent}</span>
                </div>
                <h3 className="text-xl font-semibold text-slate-50">{step.title}</h3>
                <p className="mt-4 text-sm leading-7 text-slate-300">{step.description}</p>
                <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-emerald-300">
                  Continue
                  <ArrowRight size={16} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="bg-slate-950 px-6 py-20 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <SectionHeading title="Premium features" subtitle="Everything you need to shop with confidence." />
          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {features.map((feature, index) => (
              <FeatureCard key={feature.title} icon={feature.icon} title={feature.title} description={feature.description} index={index} />
            ))}
          </div>
        </div>
      </section>

      <section id="responses" className="border-t border-white/10 bg-zinc-950/80 px-6 py-20 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <SectionHeading title="AI response preview" subtitle="See how NutriLens speaks for your food." />
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {responses.map((response, index) => (
              <ResponseCard key={response.verdict} response={response} index={index} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-b from-slate-950 via-slate-950/90 to-slate-900 px-6 py-20 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl text-center">
          <SectionHeading title="Why NutriLens matters" subtitle="The label truth you deserve." />
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {stats.map((item) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="rounded-[28px] border border-white/10 bg-white/5 p-8 text-left shadow-[0_35px_120px_rgba(0,0,0,0.18)]"
              >
                <p className="text-5xl font-semibold text-slate-100">{item.value}</p>
                <p className="mt-4 text-sm leading-7 text-slate-300">{item.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-950 px-6 py-24 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <AppShowcase />
        </div>
      </section>

      <section id="testimonials" className="bg-gradient-to-b from-slate-950 via-slate-950/90 to-zinc-950 px-6 py-20 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <SectionHeading title="Trusted by healthy shoppers" subtitle="Human-first feedback that helps people choose better food." />
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {testimonials.map((item, index) => (
              <TestimonialCard key={item.name} testimonial={item} index={index} />
            ))}
          </div>
        </div>
      </section>

      <section id="cta" className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-zinc-950 to-slate-900 px-6 py-20 sm:px-10 lg:px-16">
        <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.2),transparent_40%)]" />
        <div className="mx-auto max-w-4xl rounded-[40px] border border-white/10 bg-slate-950/90 p-10 shadow-[0_40px_120px_rgba(0,0,0,0.3)] backdrop-blur-xl">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-4">
              <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Start scanning smarter</p>
              <h2 className="text-3xl font-semibold tracking-[-0.03em] text-slate-50 sm:text-4xl">NutriLens is the pocket nutritionist your groceries need.</h2>
              <p className="max-w-2xl text-base leading-7 text-slate-300">Download the app or join the waiting list to get AI-powered food clarity, honest verdicts, and healthier choices instantly.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <a href="#cta" className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-zinc-950 transition hover:-translate-y-0.5 hover:bg-emerald-400">
                Download App
              </a>
              <a href="mailto:hello@nutrilens.ai" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:border-slate-400 hover:bg-white/10">
                Join waitlist
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
