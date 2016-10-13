'use strict';

/**
 * Randomly picks an entry from the given array.
 */
const randomOf = (arr) => {
  const idx = Math.floor(Math.random() * arr.length);
  return arr[idx];
};

module.exports = randomOf;
