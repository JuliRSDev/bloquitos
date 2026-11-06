import { PIECE_TYPES } from './constants.js';

/** 7-bag randomizer: every piece shows up once per bag, so droughts are bounded. */
export function createBag(rng = Math.random) {
  const queue = [];

  function refill() {
    const bag = [...PIECE_TYPES];
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
    queue.push(...bag);
  }

  return {
    next() {
      if (queue.length === 0) refill();
      return queue.shift();
    },
    peek(count) {
      while (queue.length < count) refill();
      return queue.slice(0, count);
    },
  };
}
