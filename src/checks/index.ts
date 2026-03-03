import type { CheckItem } from "../types.js";
import { secretScan } from "./secret-scan.js";
import { emptyCatch } from "./empty-catch.js";

// Registry of all automated checks — will be expanded in Step 11
export const checks: CheckItem[] = [secretScan, emptyCatch];
