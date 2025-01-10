export const getDaysInMonth = (year: number, month: number): Date[] => {
  const date = new Date(year, month, 1);
  const days: Date[] = [];
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
};

export const getMonthData = (year: number, month: number): (Date | null)[] => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days: (Date | null)[] = [];

  // Add empty slots for days before the first day of the month
  for (let i = 0; i < firstDay.getDay(); i++) {
    days.push(null);
  }

  // Add all days of the month
  for (let date = 1; date <= lastDay.getDate(); date++) {
    days.push(new Date(year, month, date));
  }

  // Add empty slots to complete the last week if necessary
  while (days.length % 7 !== 0) {
    days.push(null);
  }

  return days;
};

export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};
