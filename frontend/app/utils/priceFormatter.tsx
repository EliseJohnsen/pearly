export const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat("nb-NO", {
        style: "currency",
        currency: currency || "NOK",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(price);
};