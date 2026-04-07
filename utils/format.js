export const formatCurrency = (value) =>
  `Rs. ${Number(value || 0).toFixed(2)}`;
