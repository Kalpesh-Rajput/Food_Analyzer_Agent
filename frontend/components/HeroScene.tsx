"use client";

import { useMemo, useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import HeroMockup from './HeroMockup';
import ShaderBackground from './ui/shader-background';

const floatingCards = [
  {
    src: 'https://images.unsplash.com/photo-1604908177522-8f7f1dfd7d23?auto=format&fit=crop&w=512&q=80',
    alt: 'Snack pack',
    style: { top: '10%', left: '5%', width: 140 },
  },
  {
    src: 'https://images.unsplash.com/photo-1510628879092-0679b7d1052f?auto=format&fit=crop&w=512&q=80',
    alt: 'Soda can',
    style: { top: '20%', right: '2%', width: 120 },
  },
  {
    src: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=512&q=80',
    alt: 'Chocolate bar',
    style: { bottom: '8%', left: '10%', width: 130 },
  },
  {
    src: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=512&q=80',
    alt: 'Healthy snack',
    style: { bottom: '15%', right: '10%', width: 135 },
  },
];

export default function HeroScene() {
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const rotateX = useTransform(pointerY, [0, 500], [10, -10]);
  const rotateY = useTransform(pointerX, [0, 900], [-10, 10]);
  const glowX = useTransform(pointerX, (value) => `${value}px`);
  const glowY = useTransform(pointerY, (value) => `${value}px`);

  const floatingItems = useMemo(
    () =>
      floatingCards.map((item, index) => (
        <motion.img
          key={item.alt}
          src={item.src}
          alt={item.alt}
          loading="lazy"
          className="absolute rounded-3xl border border-white/10 object-cover shadow-[0_40px_100px_rgba(0,0,0,0.35)]"
          style={item.style}
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{ opacity: 1, scale: [0.98, 1.02, 0.98], y: [0, -8, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: index * 0.2 }}
        />
      )),
    []
  );

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    pointerX.set(event.clientX - rect.left);
    pointerY.set(event.clientY - rect.top);
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      className="relative overflow-hidden rounded-[40px] border border-white/10 bg-slate-950/80 p-6 shadow-[0_60px_120px_rgba(0,0,0,0.27)] backdrop-blur-2xl sm:p-8"
    >
      <ShaderBackground className="opacity-70" />
      <motion.div
        style={{ x: glowX, y: glowY }}
        className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-emerald-400/15 via-slate-950/0 to-sky-400/10 blur-3xl"
      />
      <div className="relative z-10 min-h-[520px]">
        {floatingItems}
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          style={{ rotateX, rotateY }}
          className="relative mx-auto w-full max-w-md"
        >
          <motion.div
            animate={{ y: [0, -16, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            className="rounded-[40px] border border-white/10 bg-slate-950/70 p-4 shadow-[0_60px_120px_rgba(0,0,0,0.45)]"
          >
            <HeroMockup />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
