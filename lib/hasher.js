'use strict';

const crypto = require('crypto');

exports.hash512 = (data) => {
    const h = crypto.createHash('sha512');
    h.update(data);
    return h.digest();
};

exports.hash = (data) => {
    const h = crypto.createHash('sha256');
    h.update(data);
    return h.digest();
};