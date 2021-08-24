function getISOStringFromDayOfYear(year, dayOfYear) {
    const firstDayOfYear = Date.UTC(year, 0);
    const aDayInMs = 1000 * 60 * 60 * 24;
    const targetDate = firstDayOfYear + (dayOfYear - 1) * aDayInMs;
    return (new Date(targetDate)).toISOString();
}

module.exports = getISOStringFromDayOfYear;