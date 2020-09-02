const uuid = require("uuid");
const cls = require("cls-hooked");
const sum = require("lodash/sum");

// Comment this line to fix everything.
const Promise = require("bluebird");

const NAME = "namespace";

// A delay causes random corruptions, the bigger the value of the delay, the worse the corruption will be
// A delay of 0 causes systematic corruption
// A delay of 100 causes between 98 and 100% corruption with 1000 iterations
// A random delay results in a lesser rate of corruption than a constant one, with the gap widening when the range of possible values increase
const RANDOM_DELAY = 6000;
const CONSTANT_DELAY = 0;

// With a random delay, the rate of corruption increases dramatically with the number of iterations
// Corruption never happens on the first run.
const ITERATIONS = 100;

function test() {
  return new Promise((resolve) => {
    const token = uuid.v4();

    cls.getNamespace(NAME).set("token", token);

    const tokenPromise = new Promise((resolve) => {
      setTimeout(
        () => resolve(token),
        RANDOM_DELAY * Math.random() + CONSTANT_DELAY
      );
    });

    tokenPromise.then(testEnd).then(resolve);
  });
}

function testEnd(token) {
  if (cls.getNamespace(NAME).get("token") !== token) {
    // That is a corruption
    return 1;
  }

  return 0;
}

const ns = cls.createNamespace(NAME);

function withContext(cb) {
  return new Promise((resolve) => ns.run(() => cb().then(resolve)));
}

Promise.all(new Array(ITERATIONS).fill().map(() => withContext(test))).then(
  (results) => {
    console.log("Corruptions:", sum(results));
    console.log("ITERATIONS:", results.length);
    // The first iteration cannot be a corruption
    console.log("Rate (%):", (100 * sum(results)) / (results.length - 1));
  }
);
