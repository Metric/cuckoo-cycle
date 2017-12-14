'use strict';

class Edge {
    constructor(x,y) {
        this.u = x;
        this.v = y;
    }

    equals(e) {
        return e.u === this.u && e.v === this.v;
    }
}

module.exports = exports = Edge;