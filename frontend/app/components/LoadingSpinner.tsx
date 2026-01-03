export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center p-12">
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 border-4 border-primary-pink/30 rounded-full animate-spin border-t-primary-pink"></div>

        <div className="absolute inset-4 border-4 border-purple/30 rounded-full animate-pulse"></div>

        <div className="absolute inset-8 bg-primary-pink rounded-full animate-ping"></div>
      </div>

      <p className="mt-6 text-lg font-medium text-primary animate-pulse">
        Genererer mønster...
      </p>

      <p className="mt-2 text-sm text-gray-500">
        Dette kan ta noen sekunder
      </p>
    </div>
  );
}
