import type { AnyObject } from "@/app/base/types";

/**
 * Returns whether two objects are equal when JSON.stringified. Note this
 * requires identical order of keys, and is only suitable for small objects.
 * @param {Object} obj1 - First object.
 * @param {Object} obj2 - Second object.
 * @returns {Boolean} Objects are equal when stringified.
 */
const simpleObjectEquality = <O = AnyObject>(obj1: O, obj2: O): boolean => {
  if (typeof obj1 === "object" && typeof obj2 === "object") {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
  }
  return false;
};

export { simpleObjectEquality };
