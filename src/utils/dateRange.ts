export const getDateRange = (days: number):date => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date
}