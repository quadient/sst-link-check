import { readdir, readFile } from "fs/promises";
import * as path from "path";

export async function getArtifactDirectories(artifactsDir: string): Promise<string[]> {
    try {
        return (await readdir(artifactsDir, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name);
    } catch (e) {
        console.error(`Could not read artifacts directory: ${artifactsDir}`);
        process.exit(1);
    }
}

export async function scanArtifactResources(
    artifactsDir: string,
    artifactDirs: string[],
    unifyDirName: (dir: string) => string,
): Promise<Record<string, Set<string>>> {
    const results: Record<string, Set<string>> = {};

    for (const dir of artifactDirs) {
        const bundlePath = path.join(artifactsDir, dir, "bundle.mjs");
        let content: string;
        try {
            content = await readFile(bundlePath, "utf8");
        } catch {
            continue; // skip if bundle.mjs does not exist
        }
        const dirNameUnified = unifyDirName(dir);

        // Find all Resource.XYZ usages
        const matches = content.matchAll(/Resource\.([A-Za-z0-9_]+)/g);
        for (const [, resource] of matches) {
            if (!results[dirNameUnified]) {
                results[dirNameUnified] = new Set();
            }
            if (resource !== undefined) {
                results[dirNameUnified].add(resource);
            }
        }
    }

    return results;
}

export function unifyDirName(dir: string): string {
    dir = removeSuffix(dir, "-");
    // dir = removeSuffix(dir, "Subscriber");
    return dir;

    function removeSuffix(str: string, suffix: string): string {
        const index = str.indexOf(suffix);
        if (index !== -1) {
            return dir.substring(0, index);
        }
        return str;
    }
}
