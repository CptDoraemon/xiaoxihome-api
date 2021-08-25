function validateKeyword(keyword, res, setError) {
    if (!keyword) {
        return invalidHandler(res, setError, 'keyword required');
    } else {
        return keyword
    }
}

function validateSkip(skip, res, setError) {
    if(!skip) {
        return 0
    }

    skip = parseInt(skip);
    const invalidSkip = isNaN(skip) || skip < 0;

    if (invalidSkip) {
        return invalidHandler(res, setError, 'skip parameter must be a non-negative integer');
    } else {
        return skip
    }
}

const sortTypes = {
  date: 'date',
  relevance: 'relevance'
};

function validateSort(sort, res, setError) {
    if (!sort) {
        return sortTypes.relevance
    } else if (sort && Object.values(sortTypes).indexOf(sort) === -1) {
        return invalidHandler(res, setError, `sort value must be "date" or "relevance"`);
    } else {
        return sort
    }
}

function validateDate(date, res, setError) {
    if(!date) {
        return -1
    }

    date = parseInt(date);
    const invalidDate = isNaN(date) || date <= 0;

    if (invalidDate) {
        return invalidHandler(res, setError, 'date parameter must be number of milliseconds elapsed since January 1, 1970 00:00:00 UTC');
    } else {
        return date
    }
}

function invalidHandler(res, setError, message) {
    res.json(Object.assign({}, errorResponseTemplate, {'message': message}));
    setError();
    return false
}

const errorResponseTemplate = {
    status: 'error',
    message: 'unknown error'
};

module.exports = {
    validateKeyword,
    validateSkip,
    validateSort,
    validateDate,
    sortTypes
};

