Cuckoo Cycle JS
=======================
This is a 32bit and 64bit javascript version of [Cuckoo Cycle](https://github.com/tromp/cuckoo).

Do note that the 32bit version is not compatible with the 64bit version

This is due to the following:

* 32bit integers
* Uses 32bit version of SipHash-2-4

Getting Started
=================

First install via npm

```
npm install cuckoo-cycle --save
```

Cuckoo 64bit JS Version
=============
Thanks to the underlying js engines now using 64bit Doubles for all numbers and implementing Float64Array(); it is now possible to use the original uint 64bit version.

To access the 64bit version of the below API just add a 64 to the end of the name like so:

```
const {Cuckoo64} = require('cuckoo-cycle');
const {Miner64} = require('cuckoo-cycle');
const {Solver64} = require('cuckoo-cycle');
```

All the below API access still applies just the same, except the miner will now return a Float64Array for the solution.

Cuckoo Verifier API
===========
To verify a Cuckoo Cycle you will need 3 things: The original hash, the solution array of the 42 nonces, and what difficulty level the solution was solved for.

To access the main CuckooCycle verifier

```
const {Cuckoo} = require('cuckoo-cycle');
```

To access the standard difficulty
```
Cuckoo.DIFFICULTY //which is 50 * Cuckoo.SIZE / 100
```
To make your own difficulty

```
const percent = 45;
const DIFF = percent * Cuckoo.SIZE / 100;
```

To verify something

```
const verifier = new Cuckoo(data);
const solution = [...]; //42 nonces
const isValid = verifier.verify(solution, DIFFICULTY);
```

Other API
```
verifier.update(data);
```


Cuckoo Miner API
=====================

To access the Miner and Solver.

```
const {Miner, Solver} = require('cuckoo-cycle');
```

Creating a solver and miner

```
const solver = new Solver(data, DIFFICULTY);

//index is the number of the miner instance
//total is the total number of miners running at once
const miner = new Miner(solver, [index optional], [total optional]);

const solution = miner.run();

if(solution) {
    //yay found a solution with 42 nonces for our hash
    //the solution will be either false or a UInt32Array with a length of 42
}

```

What if there is no solution? Well then you will need to rehash based upon a new nonce. As the cuckoo cycle could be considered micro nonces. The default difficulty has a rough 2.2% chance of finding a valid 42 nonce cycle.

For further information on Cuckoo Cycle see the link to the original github repo.

LICENSE
===============

The FAIR MINING License

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

FAIR MINING
Any derived miner that charges a developer fee for mining a fair coin
---one with no premine or other form of developer compensation---
shall offer to share half the fee revenue with the coin developers.

The above copyright notice, FAIR MINING condition, and this permission notice
shall be included in all copies or substantial portions of the Software.


ALTERNATIVELY, this software may be distributed under the terms of the
GNU General Public License ("GPL") version 2 or later, as published by
the Free Software Foundation.


THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.