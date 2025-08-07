
// components/game/AttackOverlay.tsx
import React from "react";

interface AttackOverlayProps {
  isVisible: boolean;
}

export default function AttackOverlay({ isVisible }: AttackOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none bg-gradient-to-b from-red-900/60 to-black/80 flex items-center justify-center">
      {/* Vignette Effect */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent to-black/50" />

      {/* Blood Particles */}
      <div className="absolute inset-0">
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-red-700/50 rounded-full animate-blood-float"
            style={{
              width: `${Math.random() * 8 + 4}px`,
              height: `${Math.random() * 8 + 4}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDuration: `${Math.random() * 2 + 2}s`,
              animationDelay: `${Math.random() * 1}s`,
            }}
          />
        ))}
      </div>

      {/* Main Text */}
      <div className="relative flex flex-col items-center animate-fade-in">
        <div className="text-3xl sm:text-4xl md:text-5xl font-horror text-red-600 text-shadow-[0_2px_4px_rgba(0,0,0,0.9)] animate-tremble">
          Anda Diserang
        </div>
        {/* Zombie Icons */}
        <div className="absolute -left-12 top-0 animate-float">
          <span className="text-2xl sm:text-3xl text-red-500/80">🧟</span>
        </div>
        <div className="absolute -right-12 bottom-0 animate-float" style={{ animationDelay: "0.5s" }}>
          <span className="text-2xl sm:text-3xl text-red-500/80">🧟</span>
        </div>
      </div>

      <style jsx global>{`
        .font-horror {
          font-family: 'Creepster', cursive, sans-serif;
        }

        /* Preload the font to avoid FOUT */
        @font-face {
          font-family: 'Creepster';
          src: url('https://fonts.googleapis.com/css2?family=Creepster&display=swap');
        }

        @keyframes fade-in {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        @keyframes tremble {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-2px); }
          50% { transform: translateX(2px); }
          75% { transform: translateX(-1px); }
        }

        @keyframes blood-float {
          0% { transform: translateY(0); opacity: 0.6; }
          50% { opacity: 0.3; }
          100% { transform: translateY(-20px); opacity: 0; }
        }

        @keyframes float {
          0% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0); }
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }

        .animate-tremble {
          animation: tremble 0.3s ease-in-out infinite;
        }

        .animate-blood-float {
          animation: blood-float 3s ease-out infinite;
        }

        .animate-float {
          animation: float 2s ease-in-out infinite;
        }

        .text-shadow-[0_2px_4px_rgba(0,0,0,0.9)] {
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.9);
        }
      `}</style>
    </div>
  );
}
