interface SectionHeadingProps {
  title: string;
  subtitle: string;
}

export default function SectionHeading({ title, subtitle }: SectionHeadingProps) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Section</p>
      <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-slate-50 sm:text-4xl">{title}</h2>
      <p className="mt-4 text-base leading-7 text-slate-400">{subtitle}</p>
    </div>
  );
}
