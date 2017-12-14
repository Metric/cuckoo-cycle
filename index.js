'use strict';

const miner = require('./lib/miner');
exports.Cuckoo = require('./lib/');
exports.Solver = miner.Solver;
exports.Miner = miner.SimpleMiner;