export function WizardStepper({
  currentStep,
  totalSteps,
}: {
  currentStep: number;
  totalSteps: number;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: totalSteps }).map((_, i) => (
        <div
          key={i}
          className={`h-1 rounded-full transition-all duration-300 ${
            i < currentStep
              ? "w-6 bg-accent"
              : i === currentStep
                ? "w-8 bg-accent"
                : "w-4 bg-white/[0.12]"
          }`}
        />
      ))}
      {currentStep < totalSteps && (
        <span className="ml-2 font-mono text-[10px] tracking-[0.08em] text-ghost">
          {currentStep + 1} / {totalSteps}
        </span>
      )}
    </div>
  );
}
