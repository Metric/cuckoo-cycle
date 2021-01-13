'use strict';

const miner = require('./lib/miner');
const miner64 = require('./lib/miner64');
exports.Cuckoo = require('./lib/').Cuckoo;
exports.Cuckoo64  = require('./lib/').Cuckoo64;
exports.Solver = miner.Solver;
exports.Solver64 = miner64.Solver;
exports.Miner = miner.SimpleMiner;
exports.Miner64 = miner64.SimpleMiner;