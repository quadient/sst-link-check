export interface PulumiState {
    latest: {
        resources: PulumiResource[];
    };
}

export interface PulumiResource {
    type: string;
    urn: string;
    outputs?: {
        base64?: {
            plaintext?: string;
        };
    };
}

export interface Discrepancy {
    artifact: string;
    missingInCode: string[];
    missingInState: string[];
}
