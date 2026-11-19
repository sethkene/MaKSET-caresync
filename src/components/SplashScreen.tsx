import React, { useEffect } from 'react';
import { ArrowRight } from 'lucide-react';

interface SplashScreenProps {
  onContinue: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onContinue }) => {
  useEffect(() => {
    const timer = window.setTimeout(onContinue, 2200);
    return () => window.clearTimeout(timer);
  }, [onContinue]);

  return (
    <div
      onClick={onContinue}
      className="relative flex min-h-screen w-full cursor-pointer flex-col items-center justify-center overflow-hidden bg-[#0B5D34] px-6 py-12 text-center text-white select-none"
    >
      <div className="pointer-events-none absolute inset-x-0 bottom-0 opacity-10">
        <svg viewBox="0 0 1440 240" className="h-44 w-full fill-current">
          <path d="M0,128L96,106.7C192,85,384,43,576,69.3C768,96,960,192,1152,197.3C1344,203,1440,117,1440,117L1440,240L0,240Z" />
        </svg>
      </div>

      <div className="relative z-10 flex max-w-md flex-col items-center">
        <img
          src="/assets/crest.png"
          alt="Nigerian Coat of Arms"
          className="mb-6 h-36 w-36 object-contain drop-shadow-[0_6px_16px_rgba(0,0,0,0.35)]"
        />
        <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
          MaKSET
        </h1>
        <p className="mt-2 text-lg font-medium text-emerald-100">
          Connected Care. Anywhere.
        </p>
        <div className="my-5 h-0.5 w-14 bg-[#39C27A]" />
        <p className="text-sm font-medium tracking-wide text-emerald-50/90 uppercase">
          Offline-first PHC System
        </p>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onContinue();
          }}
          className="mt-10 inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20 whitespace-nowrap shrink-0"
        >
          Continue to Sign In
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
