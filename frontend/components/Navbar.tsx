"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import { DownloadCloud, Sparkles } from 'lucide-react';

const navLinks = [
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Features', href: '#features' },
  { label: 'Demo', href: '/demo' },
  { label: 'Testimonials', href: '#testimonials' },
];

export default function Navbar() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/90 backdrop-blur-xl"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 sm:px-10 lg:px-16">
        <a href="#top" className="inline-flex items-center gap-3 text-lg font-semibold text-white">
          <div className="grid h-11 w-11 place-items-center rounded-3xl bg-gradient-to-br from-emerald-400 to-sky-500 text-slate-950 shadow-[0_20px_60px_rgba(16,185,129,0.25)]">
            <Sparkles size={20} />
          </div>
          NutriLens
        </a>
        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm text-slate-300 transition hover:text-emerald-300">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <a href="#download" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/10">
            Download
            <DownloadCloud size={16} />
          </a>
        </div>
      </div>
    </motion.header>
  );
}
