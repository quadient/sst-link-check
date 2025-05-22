import * as path from "path";
import { fileURLToPath } from "url";

// Fix for ESM modules where __dirname is not available
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ARTIFACTS_DIR = path.join(__dirname, "../../..", ".sst", "artifacts");
const STATE_FILE_PATH = path.join(__dirname, "../../..", "state.json");

import { getArtifactDirectories, scanArtifactResources, unifyDirName } from "./artifact-scanner";
import { readPulumiState, getEncryptionKey } from "./pulumi-state";
import { extractAllBindings } from "./resource-decrypter";
import { findDiscrepancies } from "./discrepancy-analyzer";
import { printResourceSummary, printResourceEncBindings, printArtifactDiscrepancies, printDiscrepancySummary } from "./reporter.js";

async function main() {
    console.log("# SST Link Check Tool #");

    // Get artifact directories from .sst/artifacts
    const artifactDirs = await getArtifactDirectories(ARTIFACTS_DIR);

    // Read and parse Pulumi state file - only to get encryption key
    const pulumiState = await readPulumiState(STATE_FILE_PATH);
    if (!pulumiState) {
        console.error("Could not read Pulumi state file. Exiting.");
        process.exit(1);
    }
    const encryptionKey = getEncryptionKey(pulumiState);

    if (!encryptionKey) {
        console.error("Could not find LambdaEncryptionKey in Pulumi state. Exiting.");
        process.exit(1);
    }

    // Extract resource bindings from encrypted resource.enc files
    const resourceBindings = await extractAllBindings(ARTIFACTS_DIR, artifactDirs, encryptionKey, unifyDirName);

    // Scan artifact directories for Resource.* references in bundle.mjs
    const codeResources = await scanArtifactResources(ARTIFACTS_DIR, artifactDirs, unifyDirName);

    // Analyze and collect all discrepancies
    const allDiscrepancies = findDiscrepancies(codeResources, resourceBindings);

    // Print resource summary for each artifact
    console.log("SST Artifact Resource Bindings:");
    for (const [artifact, resources] of Object.entries(codeResources)) {
        printResourceSummary(artifact, resources);

        if (resourceBindings[artifact]) {
            printResourceEncBindings(artifact, resourceBindings[artifact]);

            // Check and print discrepancies for this artifact
            const codeBindings = Array.from(resources);
            const stateBindings = Array.from(resourceBindings[artifact] || new Set<string>());
            const missingInCode = stateBindings.filter((s) => !codeBindings.includes(s));
            const missingInState = codeBindings.filter((c) => !stateBindings.includes(c));

            if (missingInCode.length > 0 || missingInState.length > 0) {
                printArtifactDiscrepancies(artifact, missingInCode, missingInState);
            }
        }
    }

    // Print summary of all discrepancies
    printDiscrepancySummary(allDiscrepancies);

    // Exit with non-zero code if there are error (= missingInState) discrepancies
    const errorCount = allDiscrepancies.reduce((acc, disc) => acc + disc.missingInState.length, 0);
    const warningCount = allDiscrepancies.reduce((acc, disc) => acc + disc.missingInCode.length, 0);
    console.log(`WARNING: ${warningCount} redundant links (not used from bundled code)`);
    if (errorCount > 0) {
        console.error(`ERROR: ${errorCount} link value(s) are not provided by infrastructure`);
        process.exit(1);
    } else {
        process.exit(0);
    }
}

main().catch((error) => {
    console.error("An error occurred:", error);
    process.exit(1);
});
