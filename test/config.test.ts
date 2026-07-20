import { afterEach, describe, expect, it } from 'vitest';

import { loadDeviceConfig } from '../src/config';

const ORIGINAL_ENV = { ...process.env };

function clearNmosEnv(): void {
    delete process.env.NMOS_IS04_ADDRESS;
    delete process.env.NMOS_IS04_PORT;
    delete process.env.NMOS_IS04_DEVICE_ID;
    delete process.env.NMOS_IS04_VERSION;
    delete process.env.NMOS_EXPORT_DEVICE_TREE;
    delete process.env.NMOS_EXPORT_OUTPUT;
}

afterEach(() => {
    for (const key of Object.keys(process.env)) {
        if (!(key in ORIGINAL_ENV)) {
            delete process.env[key];
        }
    }
    for (const [key, value] of Object.entries(ORIGINAL_ENV)) {
        if (value === undefined) {
            delete process.env[key];
        } else {
            process.env[key] = value;
        }
    }
    clearNmosEnv();
});

describe('loadDeviceConfig', () => {
    it('uses built-in defaults when nothing is provided', () => {
        clearNmosEnv();
        const config = loadDeviceConfig(['node', 'index.js']);

        expect(config).toEqual({
            deviceIs04Address: '127.0.0.1',
            deviceIs04Port: 8080,
            is04DeviceId: 'c1fe9ed2-7602-43c3-a94d-eadd5338b9cd',
            is04Version: 'v1.3',
            exportDeviceTree: false,
            outputPath: null,
        });
    });

    it('reads values from environment variables', () => {
        clearNmosEnv();
        process.env.NMOS_IS04_ADDRESS = '10.0.0.5';
        process.env.NMOS_IS04_PORT = '3000';
        process.env.NMOS_IS04_DEVICE_ID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
        process.env.NMOS_IS04_VERSION = 'v1.2';
        process.env.NMOS_EXPORT_DEVICE_TREE = 'true';
        process.env.NMOS_EXPORT_OUTPUT = './out.html';

        const config = loadDeviceConfig(['node', 'index.js']);

        expect(config.deviceIs04Address).toBe('10.0.0.5');
        expect(config.deviceIs04Port).toBe(3000);
        expect(config.is04DeviceId).toBe('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee');
        expect(config.is04Version).toBe('v1.2');
        expect(config.exportDeviceTree).toBe(true);
        expect(config.outputPath).toBe('./out.html');
    });

    it('lets CLI args override environment variables', () => {
        clearNmosEnv();
        process.env.NMOS_IS04_ADDRESS = '10.0.0.5';
        process.env.NMOS_IS04_PORT = '3000';

        const config = loadDeviceConfig([
            'node',
            'index.js',
            '--address',
            '192.168.1.10',
            '-p',
            '9090',
            '--export-device-tree',
            '-o',
            'tree.html',
        ]);

        expect(config.deviceIs04Address).toBe('192.168.1.10');
        expect(config.deviceIs04Port).toBe(9090);
        expect(config.exportDeviceTree).toBe(true);
        expect(config.outputPath).toBe('tree.html');
    });

    it('rejects unknown arguments', () => {
        clearNmosEnv();
        expect(() => loadDeviceConfig(['node', 'index.js', '--nope'])).toThrow(/Unknown argument/);
    });

    it('rejects invalid ports', () => {
        clearNmosEnv();
        expect(() => loadDeviceConfig(['node', 'index.js', '--port', 'abc'])).toThrow(/Invalid port/);
    });
});
