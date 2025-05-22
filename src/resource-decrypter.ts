import { readFile } from "fs/promises";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

interface DecryptedResource {
    [key: string]: any;
}

export async function extractAllBindings(
    artifactsDir: string,
    artifactDirs: string[],
    encryptionKey: string,
    unifyDirName: (dir: string) => string,
): Promise<Record<string, Set<string>>> {
    const bindings: Record<string, Set<string>> = {};

    for (const dir of artifactDirs) {
        const dirNameUnified = unifyDirName(dir);
        const resourceBindings = await decryptResourceFile(artifactsDir, dir, encryptionKey);

        if (resourceBindings && resourceBindings.length > 0) {
            bindings[dirNameUnified] = new Set(resourceBindings);
        }
    }

    return bindings;
}

async function decryptResourceFile(artifactsDir: string, artifactDir: string, keyBase64: string): Promise<string[] | undefined> {
    const resourceEncPath = path.join(artifactsDir, artifactDir, "resource.enc");

    // Check if resource.enc exists
    try {
        await fs.promises.access(resourceEncPath, fs.constants.F_OK);
    } catch {
        return undefined; // File does not exist
    }

    try {
        // NOTE: decryption logic taken from SST bundle.mjs file
        const key = Buffer.from(keyBase64, "base64");
        const encryptedData = await readFile(resourceEncPath);
        const nonce = Buffer.alloc(12, 0);
        const decipher = crypto.createDecipheriv("aes-256-gcm", key, nonce);
        const authTag = encryptedData.subarray(-16);
        const actualCiphertext = encryptedData.subarray(0, -16);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(actualCiphertext);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        const decryptedData = JSON.parse(decrypted.toString()) as DecryptedResource;

        // Return resource bindings
        return Object.keys(decryptedData);
    } catch (error) {
        console.error(`Failed to decrypt resource file for ${artifactDir}:`, error);
        return undefined;
    }
}
