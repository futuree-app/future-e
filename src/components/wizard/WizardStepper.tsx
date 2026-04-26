export function WizardStepper({
  currentStep,
  totalSteps,
}: {
  currentStep: number;
  totalSteps: number;
}) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: totalSteps }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all duration-500 ease-out ${
            i < currentStep
              ? "w-6 bg-accent/60"
              : i === currentStep
                ? "w-10 bg-accent"
                : "w-4 bg-white/[0.10]"
          }`}
        />
      ))}
      <span className="ml-3 font-mono text-[10px] tracking-[0.10em] text-ghost tabular-nums">
        {Math.min(currentStep + 1, totalSteps)}&thinsp;/&thinsp;{totalSteps}
      </span>
    </div>
  );
}
