import { SystemRole } from "../module/users/user.model";

export const generateUniqueId = (role: SystemRole): string => {
    let prefix = "";

    switch (role) {
        case SystemRole.SUPER_ADMIN:
            prefix = "SA";
            break;
        case SystemRole.ORG_ADMIN:
            prefix = "AD";
            break;
        case SystemRole.EMPLOYEE:
            prefix = "EM";
            break;
        case SystemRole.CANDIDATE:
            prefix = "CA";
            break;
        case SystemRole.MAINTAINER:
            prefix = "MA";
            break;
        case SystemRole.CLIENT_USER:
            prefix = "CU";
            break;
        default:
            prefix = "UN"; // Unknown
            break;
    }

    // Generate 8 random alphanumeric characters
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let randomId = "";
    for (let i = 0; i < 8; i++) {
        randomId += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return `${prefix}${randomId}`;
};

/**
 * Generate a unique ID with a custom prefix, e.g. "JOB-A1B2C3D4"
 */
export const generatePrefixedId = (prefix: string, length: number = 8): string => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let randomId = "";
    for (let i = 0; i < length; i++) {
        randomId += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `${prefix}-${randomId}`;
};
