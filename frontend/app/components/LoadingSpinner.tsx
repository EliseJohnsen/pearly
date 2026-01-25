interface LoadingSpinnerProps {
    loadingMessage?: string;
    description?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  loadingMessage = "Laster...",
  description = ""
}) => {
  const beads = Array.from({ length: 9 }, (_, i) => i);

  return (
    <div className="flex flex-col items-center justify-center p-12">
      <div className="relative w-[76px] h-[76px]">
        <style jsx>{`
          @keyframes beadCycle0 {
            0% { opacity: 0; transform: scale(0); }
            1% { opacity: 1; transform: scale(1); }
            75% { opacity: 1; transform: scale(1); }
            80%, 100% { opacity: 0; transform: scale(0); }
          }
          @keyframes beadCycle1 {
            0%, 7.8% { opacity: 0; transform: scale(0); }
            8.8% { opacity: 1; transform: scale(1); }
            75% { opacity: 1; transform: scale(1); }
            80%, 100% { opacity: 0; transform: scale(0); }
          }
          @keyframes beadCycle2 {
            0%, 15.6% { opacity: 0; transform: scale(0); }
            16.6% { opacity: 1; transform: scale(1); }
            75% { opacity: 1; transform: scale(1); }
            80%, 100% { opacity: 0; transform: scale(0); }
          }
          @keyframes beadCycle3 {
            0%, 23.3% { opacity: 0; transform: scale(0); }
            24.3% { opacity: 1; transform: scale(1); }
            75% { opacity: 1; transform: scale(1); }
            80%, 100% { opacity: 0; transform: scale(0); }
          }
          @keyframes beadCycle4 {
            0%, 31.1% { opacity: 0; transform: scale(0); }
            32.1% { opacity: 1; transform: scale(1); }
            75% { opacity: 1; transform: scale(1); }
            80%, 100% { opacity: 0; transform: scale(0); }
          }
          @keyframes beadCycle5 {
            0%, 38.9% { opacity: 0; transform: scale(0); }
            39.9% { opacity: 1; transform: scale(1); }
            75% { opacity: 1; transform: scale(1); }
            80%, 100% { opacity: 0; transform: scale(0); }
          }
          @keyframes beadCycle6 {
            0%, 46.7% { opacity: 0; transform: scale(0); }
            47.7% { opacity: 1; transform: scale(1); }
            75% { opacity: 1; transform: scale(1); }
            80%, 100% { opacity: 0; transform: scale(0); }
          }
          @keyframes beadCycle7 {
            0%, 54.4% { opacity: 0; transform: scale(0); }
            55.4% { opacity: 1; transform: scale(1); }
            75% { opacity: 1; transform: scale(1); }
            80%, 100% { opacity: 0; transform: scale(0); }
          }
          @keyframes beadCycle8 {
            0%, 62.2% { opacity: 0; transform: scale(0); }
            63.2% { opacity: 1; transform: scale(1); }
            75% { opacity: 1; transform: scale(1); }
            80%, 100% { opacity: 0; transform: scale(0); }
          }

          .bead {
            width: 21px;
            height: 21px;
            border-radius: 50%;
            position: absolute;
            opacity: 0;
          }

          .bead-0 { top: 0; left: 0; animation: beadCycle0 4.5s infinite; }
          .bead-1 { top: 0; left: 27.5px; animation: beadCycle1 4.5s infinite; }
          .bead-2 { top: 0; right: 0; animation: beadCycle2 4.5s infinite; }
          .bead-3 { top: 27.5px; left: 0; animation: beadCycle3 4.5s infinite; }
          .bead-4 { top: 27.5px; left: 27.5px; animation: beadCycle4 4.5s infinite; }
          .bead-5 { top: 27.5px; right: 0; animation: beadCycle5 4.5s infinite; }
          .bead-6 { bottom: 0; left: 0; animation: beadCycle6 4.5s infinite; }
          .bead-7 { bottom: 0; left: 27.5px; animation: beadCycle7 4.5s infinite; }
          .bead-8 { bottom: 0; right: 0; animation: beadCycle8 4.5s infinite; }
        `}</style>

        {beads.map((i) => (
          <div
            key={i}
            className={`bead bead-${i} border-5 border-purple`}        
          />
        ))}
      </div>
      {loadingMessage &&
        <p className="mt-6 text-lg font-medium text-purple animate-pulse">
          {loadingMessage}
        </p>
      }
      {description &&
        <p className="mt-2 text-sm text-gray-500">
          {description}
        </p>
      }
    </div>
  );
}

export default LoadingSpinner;
