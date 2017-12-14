'use strict';

const crypto = require('crypto');

exports.hash = (data) => {
    const h = crypto.createHash('sha256');
    h.update(data);
    return h.digest();
};