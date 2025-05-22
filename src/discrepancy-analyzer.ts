import { Discrepancy } from "./types";

export function findDiscrepancies(codeResources: Record<string, Set<string>>, lambdaBindings: Record<string, Set<string>>): Discrepancy[] {
    const allDiscrepancies: Discrepancy[] = [];

    for (const [artifact, resources] of Object.entries(codeResources)) {
        const stateBindings = Array.from(lambdaBindings[artifact] || new Set<string>());
        const codeBindings = Array.from(resources);

        const missingInCode = stateBindings.filter((s) => !codeBindings.includes(s));
        const missingInState = codeBindings.filter((c) => !stateBindings.includes(c));

        if (missingInCode.length > 0 || missingInState.length > 0) {
            allDiscrepancies.push({
                artifact,
                missingInCode,
                missingInState,
            });
        }
    }

    return allDiscrepancies;
}
