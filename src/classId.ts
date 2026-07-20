/**
 * Helpers for NcClassId authority keys / vendor-specific classes.
 * @see https://specs.amwa.tv/ms-05-02/branches/v1.0.x/docs/Framework.html#ncclassid
 */

export function classIdKey(classId: number[]): string {
    return classId.join('.');
}

/**
 * Authority keys are 0 (no OUI/CID) or a negated organization identifier (< 0).
 * Definition indexes are always >= 1.
 */
export function getAuthorityKey(classId: number[]): number | null {
    const authority = classId.find(part => part <= 0);
    return authority === undefined ? null : authority;
}

export function isVendorSpecificClass(classId: number[]): boolean {
    return getAuthorityKey(classId) !== null;
}

/** NcBlock and derived blocks start with [1, 1, ...]. */
export function isBlockClass(classId: number[]): boolean {
    return classId.length >= 2 && classId[0] === 1 && classId[1] === 1;
}
