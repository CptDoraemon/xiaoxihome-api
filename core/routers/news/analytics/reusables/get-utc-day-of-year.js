// @date: Date Object
function getUTCDayOfYear(date){
    return (Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - Date.UTC(date.getFullYear(), 0, 0)) / 24 / 60 / 60 / 1000;
}

module.exports = {
    getUTCDayOfYear
};