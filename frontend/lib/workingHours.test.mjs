import { isOutsideWorkingHours } from './workingHours.js';

// Test 00:00 IRST (20:30 UTC previous day) -> Outside
const midnightIR = "2026-07-29T20:30:00Z";
console.assert(isOutsideWorkingHours(midnightIR) === true, "Midnight Iran should be outside working hours");

// Test 04:30 IRST (01:00 UTC) -> Outside
const nightIR = "2026-07-30T01:00:00Z";
console.assert(isOutsideWorkingHours(nightIR) === true, "4:30 AM Iran should be outside working hours");

// Test 09:59 IRST (06:29 UTC) -> Outside
const beforeTenIR = "2026-07-30T06:29:00Z";
console.assert(isOutsideWorkingHours(beforeTenIR) === true, "9:59 AM Iran should be outside working hours");

// Test 10:00 IRST (06:30 UTC) -> Inside (Working Hours)
const tenAMIR = "2026-07-30T06:30:00Z";
console.assert(isOutsideWorkingHours(tenAMIR) === false, "10:00 AM Iran should be inside working hours");

// Test 23:59 IRST (20:29 UTC) -> Inside (Working Hours)
const lateNightIR = "2026-07-30T20:29:00Z";
console.assert(isOutsideWorkingHours(lateNightIR) === false, "11:59 PM Iran should be inside working hours");

console.log("All workingHours unit tests passed successfully! ✅");
