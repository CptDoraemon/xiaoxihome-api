
// @binArray: array of object, has property year, dayOfYear, ISOString
// @valueArray: array of object, has property year, dayOfYear, [dataKey]: dataArray
// returns the matched dataArray only;
function matchValueArrayToDailyBin(binArray, valueArray, dataKey, emptyValue) {
    const matched = [];
    binArray.forEach(bin => {
        let isFound = false;
        for (let i=0; i<valueArray.length; i++) {
            const obj = valueArray[i];
            if (bin.year === obj.year && bin.dayOfYear === obj.dayOfYear) {
                matched.push(obj[dataKey]);
                isFound = true;
                break;
            }
            if (i === valueArray.length - 1 && !isFound) {
                matched.push(Array.isArray(emptyValue) ? emptyValue.slice() : emptyValue);
            }
        }
    });
    return matched
}

module.exports = {
    matchValueArrayToDailyBin
};