import { Github, Instagram, Linkedin, Mail } from 'lucide-react';

const links = [
  { label: 'Product', href: '#features' },
  { label: 'Pricing', href: '#cta' },
  { label: 'Privacy', href: '#cta' },
  { label: 'Terms', href: '#cta' },
];

const socials = [
  { icon: Github, label: 'GitHub', href: 'https://github.com' },
  { icon: Linkedin, label: 'LinkedIn', href: 'https://www.linkedin.com' },
  { icon: Instagram, label: 'Instagram', href: 'https://www.instagram.com' },
  { icon: Mail, label: 'Email', href: 'mailto:hello@nutrilens.ai' },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-slate-950/80 px-6 py-12 sm:px-10 lg:px-16">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-3">
          <p className="text-lg font-semibold text-slate-100">NutriLens AI</p>
          <p className="max-w-xl text-sm leading-6 text-slate-400">Instant food label intelligence for people who want food transparency, honest verdicts, and healthier decisions.</p>
        </div>
        <div className="flex flex-wrap gap-4">
          {links.map((link) => (
            <a key={link.label} href={link.href} className="text-sm text-slate-300 transition hover:text-emerald-300">
              {link.label}
            </a>
          ))}
        </div>
      </div>
      <div className="mt-10 flex flex-col gap-6 border-t border-white/10 pt-8 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
        <p>© 2026 NutriLens AI. Built for better food choices.</p>
        <div className="flex items-center gap-4">
          {socials.map((social) => (
            <a key={social.label} href={social.href} aria-label={social.label} target="_blank" rel="noreferrer" className="transition hover:text-emerald-300">
              <social.icon size={18} />
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
