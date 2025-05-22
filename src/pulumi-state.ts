import { readFile } from "fs/promises";
import { PulumiState } from "./types";

export async function readPulumiState(statePath: string): Promise<PulumiState | undefined> {
    try {
        const stateContent = await readFile(statePath, "utf8");
        return JSON.parse(stateContent);
    } catch (e) {
        console.warn(`Could not read or parse Pulumi state file: ${statePath}`);
        return undefined;
    }
}

export function getEncryptionKey(pulumiState: PulumiState | null): string | undefined {
    if (!pulumiState?.latest?.resources) {
        return undefined;
    }

    // Find the Lambda encryption key from Pulumi resources
    for (const resource of pulumiState.latest.resources) {
        if (resource.urn && resource.urn.endsWith("randomBytes:RandomBytes::LambdaEncryptionKey")) {
            if (resource.outputs && resource.outputs.base64 && resource.outputs.base64.plaintext) {
                return resource.outputs.base64.plaintext;
            }
        }
    }

    return undefined;
}
