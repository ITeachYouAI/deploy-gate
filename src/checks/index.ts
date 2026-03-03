import type { CheckItem } from "../types.js";
import { gitClean } from "./git-clean.js";
import { secretScan } from "./secret-scan.js";
import { emptyCatch } from "./empty-catch.js";
import { deadForms } from "./dead-forms.js";
import { testCoverageMap } from "./test-coverage-map.js";
import { lockFile } from "./lock-file.js";
import { goVet } from "./go-vet.js";

export const checks: CheckItem[] = [
  gitClean,
  secretScan,
  emptyCatch,
  deadForms,
  testCoverageMap,
  lockFile,
  goVet,
];
