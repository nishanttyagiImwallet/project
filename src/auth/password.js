const { promisify } = require("node:util");
const { scrypt: scryptCallback, randomBytes, timingSafeEqual } = require("node:crypto");

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;
const COST = 16384;
const BLOCK_SIZE = 8;
const PARALLELIZATION = 1;

async function hashPassword(password) {
  const salt = randomBytes(16);
  const derivedKey = await scrypt(password, salt, KEY_LENGTH, {
    N: COST,
    r: BLOCK_SIZE,
    p: PARALLELIZATION
  });

  return [
    "scrypt",
    COST,
    BLOCK_SIZE,
    PARALLELIZATION,
    salt.toString("hex"),
    derivedKey.toString("hex")
  ].join("$");
}

async function verifyPassword(password, storedHash) {
  const [algorithm, cost, blockSize, parallelization, saltHex, keyHex] =
    storedHash.split("$");

  if (
    algorithm !== "scrypt" ||
    !/^\d+$/.test(cost) ||
    !/^\d+$/.test(blockSize) ||
    !/^\d+$/.test(parallelization) ||
    !/^[a-f0-9]{32}$/i.test(saltHex) ||
    !/^[a-f0-9]{128}$/i.test(keyHex)
  ) {
    return false;
  }

  const expected = Buffer.from(keyHex, "hex");
  const actual = await scrypt(password, Buffer.from(saltHex, "hex"), expected.length, {
    N: Number(cost),
    r: Number(blockSize),
    p: Number(parallelization)
  });

  return timingSafeEqual(actual, expected);
}

module.exports = { hashPassword, verifyPassword };
