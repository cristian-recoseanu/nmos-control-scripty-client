import { describe, expect, it } from 'vitest';

import { NcDatatypeType, ncDatatypeTypeToString } from '../src/datatypes';
import { renderDeviceTreeHtml } from '../src/export/html';
import { DeviceTreeSnapshot } from '../src/export/snapshot';

describe('ncDatatypeTypeToString', () => {
    it('maps known datatype types', () => {
        expect(ncDatatypeTypeToString(NcDatatypeType.Primitive)).toBe('Primitive');
        expect(ncDatatypeTypeToString(NcDatatypeType.Typedef)).toBe('Typedef');
        expect(ncDatatypeTypeToString(NcDatatypeType.Struct)).toBe('Struct');
        expect(ncDatatypeTypeToString(NcDatatypeType.Enum)).toBe('Enum');
    });

    it('returns Unknown for unexpected values', () => {
        expect(ncDatatypeTypeToString(99)).toBe('Unknown');
    });
});

function minimalSnapshot(overrides: Partial<DeviceTreeSnapshot> = {}): DeviceTreeSnapshot {
    return {
        timestamp: '2026-07-15T12:00:00.000Z',
        source: {
            is04Address: '127.0.0.1',
            is04Port: 8080,
            is04DeviceId: 'device-id',
            is04Version: 'v1.3',
            websocketHref: 'ws://127.0.0.1:8080/x-nmos/ncp/v1.0/connect',
        },
        rootOid: 1,
        objects: {
            '1': {
                oid: 1,
                role: 'root',
                userLabel: 'Root',
                classId: [1, 1],
                classIdKey: '1.1',
                constantOid: true,
                owner: null,
                children: [4],
                propertyValues: { '1p5': 'root' },
                propertyErrors: {},
            },
            '4': {
                oid: 4,
                role: 'gain-control',
                userLabel: 'Gain',
                classId: [1, 2, 0, 1],
                classIdKey: '1.2.0.1',
                constantOid: false,
                owner: 1,
                children: [],
                propertyValues: {},
                propertyErrors: {},
            },
        },
        classes: {
            '1.1': {
                description: 'Block',
                classId: [1, 1],
                name: 'NcBlock',
                fixedRole: null,
                properties: [],
                methods: [],
                events: [],
            },
            '1.2.0.1': {
                description: 'Vendor gain',
                classId: [1, 2, 0, 1],
                name: 'GainControl',
                fixedRole: null,
                properties: [
                    {
                        description: null,
                        id: { level: 3, index: 1 },
                        name: 'gain',
                        typeName: 'NcFloat32',
                        isReadOnly: false,
                        isNullable: true,
                        isSequence: false,
                        isDeprecated: false,
                    },
                ],
                methods: [],
                events: [],
            },
        },
        datatypes: {
            NcFloat32: {
                description: 'float',
                name: 'NcFloat32',
                type: NcDatatypeType.Primitive,
            },
        },
        unresolvedDatatypes: [],
        stats: {
            objectCount: 2,
            classCount: 2,
            datatypeCount: 1,
            propertyValueCount: 1,
            propertyErrorCount: 0,
        },
        ...overrides,
    };
}

describe('renderDeviceTreeHtml', () => {
    it('embeds the snapshot timestamp and device id', () => {
        const html = renderDeviceTreeHtml(minimalSnapshot());
        expect(html).toContain('2026-07-15T12:00:00.000Z');
        expect(html).toContain('device-id');
        expect(html).toContain('application/json');
    });

    it('marks vendor-specific classes in the generated page script', () => {
        const html = renderDeviceTreeHtml(minimalSnapshot());
        expect(html).toContain('isVendorSpecific');
        expect(html).toContain('getAuthorityKey');
        expect(html).toContain('Escape');
    });

    it('renders sequence/nullable as badges rather than suffix characters on type chips', () => {
        const html = renderDeviceTreeHtml(minimalSnapshot());
        expect(html).toContain('sequence');
        expect(html).toContain('nullable');
        expect(html).toContain('type-flags');
    });
});
