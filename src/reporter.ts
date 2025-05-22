import { Discrepancy } from "./types";

// ANSI color codes
export const YELLOW = "\x1b[33m";
export const RED = "\x1b[31m";
export const RESET = "\x1b[0m";
export const BOLD = "\x1b[1m";

export function printResourceSummary(artifact: string, resources: Set<string>): void {
    console.log(`\n[${artifact}]`);
    if (resources.size === 0) {
        console.log("  (no Resource. usages found)");
    } else {
        for (const res of Array.from(resources).sort()) {
            console.log(`  - ${res}`);
        }
    }
}

export function printResourceEncBindings(_artifact: string, bindings: Set<string>): void {
    if (!bindings) return;

    console.log("\n  resource.enc file Links:");
    for (const link of Array.from(bindings).sort()) {
        console.log(`  - ${link}`);
    }
}

export function printArtifactDiscrepancies(_artifact: string, missingInCode: string[], missingInState: string[]): void {
    console.log("\n  DISCREPANCIES FOUND:");
    if (missingInCode.length > 0) {
        console.log("  Resources in resource.enc file but not in bundle.mjs:");
        for (const res of missingInCode) {
            console.log(`    - ${res}`);
        }
    }

    if (missingInState.length > 0) {
        console.log("  Resources in bundle.mjs but not in resource.enc file:");
        for (const res of missingInState) {
            console.log(`    - ${res}`);
        }
    }
}

export function printDiscrepancySummary(discrepancies: Discrepancy[]): void {
    if (discrepancies.length === 0) return;

    console.log("\n\n" + BOLD + "SUMMARY OF ALL DISCREPANCIES:" + RESET);

    for (const disc of discrepancies) {
        console.log("\n" + BOLD + `[${disc.artifact}]` + RESET);

        if (disc.missingInCode.length > 0) {
            console.log(YELLOW + "  Resources in resource.enc file but not in bundle.mjs:" + RESET);
            for (const res of disc.missingInCode) {
                console.log(YELLOW + `    - ${res}` + RESET);
            }
        }

        if (disc.missingInState.length > 0) {
            console.log(RED + "  Resources in bundle.mjs but not in resource.enc file:" + RESET);
            for (const res of disc.missingInState) {
                console.log(RED + `    - ${res}` + RESET);
            }
        }
    }
}
