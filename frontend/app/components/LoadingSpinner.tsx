interface LoadingSpinnerProps {
    loadingMessage?: string;
    description?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  loadingMessage = "Laster...",
  description = ""
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12">
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 border-4 border-primary-pink/30 rounded-full animate-spin border-t-primary-pink"></div>

        <div className="absolute inset-4 border-4 border-purple/30 rounded-full animate-pulse"></div>

        <div className="absolute inset-8 bg-primary-pink rounded-full animate-ping"></div>
      </div>
      {loadingMessage &&
        <p className="mt-6 text-lg font-medium text-primary animate-pulse">
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
