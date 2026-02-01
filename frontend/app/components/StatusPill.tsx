'use client'

interface StatusPillProps {
  status?: any
}

export default function StatusPill({ status }: StatusPillProps = {}) {

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "new":
        return "bg-primary-dark-pink";
      case "paid":
        return "bg-primary-neon-green";
      case "shipped":
        return "bg-purple-100 text-purple-800";
      case "cancelled":
        return "bg-primary-red text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      new: "Ny",
      paid: "Betalt",
      shipped: "Sendt",
      cancelled: "Kansellert",
    };
    return statusMap[status.toLowerCase()] || status;
  };

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
        status
      )}`}
    >
      {getStatusText(status)}
    </span>
  )
}
