import { describe, expect, it } from 'vitest';

import {
    classIdKey,
    getAuthorityKey,
    isBlockClass,
    isVendorSpecificClass,
} from '../src/classId';

describe('classId helpers', () => {
    it('formats class id keys', () => {
        expect(classIdKey([1, 2, 2, 1])).toBe('1.2.2.1');
    });

    it('detects standard classes without authority keys', () => {
        expect(isVendorSpecificClass([1, 2, 2, 1])).toBe(false);
        expect(getAuthorityKey([1, 3, 2])).toBeNull();
    });

    it('detects vendor-specific classes with authority key 0', () => {
        expect(isVendorSpecificClass([1, 2, 0, 1])).toBe(true);
        expect(getAuthorityKey([1, 2, 0, 1])).toBe(0);
    });

    it('detects vendor-specific classes with negated OUI/CID authority keys', () => {
        expect(isVendorSpecificClass([1, 1, 3, 5, -132131, 1])).toBe(true);
        expect(getAuthorityKey([1, 1, 3, 5, -132131, 1])).toBe(-132131);
    });

    it('identifies NcBlock class ids', () => {
        expect(isBlockClass([1, 1])).toBe(true);
        expect(isBlockClass([1, 1, 0, 1])).toBe(true);
        expect(isBlockClass([1, 2, 2, 1])).toBe(false);
        expect(isBlockClass([1])).toBe(false);
    });
});
