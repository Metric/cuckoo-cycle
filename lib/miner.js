'use strict';

const MAXPATHLEN = 4096;
const Cuckoo = require('./index');
const Edge = require('./edge');

const SIZESHIFT = Cuckoo.SIZESHIFT;
const SIZE = Cuckoo.SIZE;
const NODEMASK = Cuckoo.NODEMASK;
const HALFSIZE = Cuckoo.HALFSIZE;
const PROOFSIZE = Cuckoo.PROOFSIZE;

class Solver {
    constructor(hdr, en) {
        this.graph = new Cuckoo(hdr);
        this.easiness = en;
        this.solution = new Uint32Array(PROOFSIZE);
        this.cuckoo = new Uint32Array(1+SIZE);
    }

    updateKey(key) {
        this.graph.updateKey(key);
        this.reset();
    }

    reset() {
        //clear cuckoo out
        //this is more efficient than recreating the 
        //Uint32Array from scratch
        //also saves from garbage collection
        for(let i = 0; i < this.cuckoo.length; i++) {
            this.cuckoo[i] = 0;
        }
    }

    path(u, us) {
        const cuckoo = this.cuckoo;
        let nu = 0;
        for(nu = 0; u != 0; u = cuckoo[u]) {
            if(++nu >= MAXPATHLEN) {
                //just return out of bounds
                return -1;
            }
            us[nu] = u;
        }
        return nu;
    }

    find(us, nu, vs, nv) {
        const cycle = [];
        let easiness = this.easiness;

        let n = 0;
        cycle.push(new Edge(us[0],vs[0] - HALFSIZE));
        while(nu-- > 0) {
            cycle.push(new Edge(us[(nu+1)&~1],us[nu|1] - HALFSIZE));
        }
        while(nv-- > 0) {
            cycle.push(new Edge(vs[nv|1],vs[(nv+1)&~1] - HALFSIZE));
        }
        for(let nonce = n = 0; nonce < easiness; nonce++) {
            const e = this.graph.sipedge(nonce);
            const idx = cycle.findIndex((o) => { return e.equals(o); });

            if(idx > -1) {
                this.solution[n++] = nonce;
                cycle.splice(idx,1);

                if(n == PROOFSIZE) {
                    break;
                }
            }
        }
        if(n == PROOFSIZE) {
            return this.solution;
        }

        return false;
    }
}

class SimpleMiner {
    constructor(solver, index, total) {
        this.solve = solver;
        this.id = index || 0;
        this.total = total || 1;
        this.vs = new Uint32Array(MAXPATHLEN);
        this.us = new Uint32Array(MAXPATHLEN);
    }

    run() {
        const us = this.us, vs = this.vs;
        
        //reset path buffers
        //this is more efficient than recreating
        //the uint32 array
        for(let i = 0; i < MAXPATHLEN; i++) {
            us[i] = 0;
            vs[i] = 0;
        }
        
        const cuckoo = this.solve.cuckoo;
        const solve = this.solve;
        for(let nonce = this.id; nonce < solve.easiness; nonce+=this.total) {
            
            let u0 = solve.graph.sipnode(nonce, 0);
            let v0 = solve.graph.sipnode(nonce, 1) + HALFSIZE;

            let u = cuckoo[u0];
            let v = cuckoo[v0];

            vs[0] = v0;
            us[0] = u0;

            if(u == vs[0] || v == us[0]) continue;

            let nu = solve.path(u, us);
            let nv = solve.path(v, vs);

            //out of bounds? exit early
            if(nu == -1 || nv == -1) {
                return false;
            }

            if(us[nu] == vs[nv]) {
                let min = nu < nv ? nu : nv;
                for(nu -= min, nv -= min; us[nu] != vs[nv]; nu++, nv++);
                let len = nu + nv + 1;
                const perc = (nonce*100/solve.easiness)
                console.log(" " + len + "-cycle found at " + this.id + ":" + perc + "%");
                if(len == PROOFSIZE) {
                    const sol = solve.find(us,nu,vs,nv);
                    if(sol) {
                        return sol;
                    }
                }
            }
            else if(nu < nv) {
                while(nu-- > 0) {
                    cuckoo[us[nu+1]] = us[nu];
                }
                cuckoo[u0] = v0;
            }
            else {
                while(nv-- > 0) {
                    cuckoo[vs[nv+1]] = vs[nv];
                }
                cuckoo[v0] = u0;
            }
        }

        return false;
    }
}

exports.Solver = Solver;
exports.SimpleMiner = SimpleMiner;