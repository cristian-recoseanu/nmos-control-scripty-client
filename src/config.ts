export interface DeviceConfig {
    deviceIs04Address: string;
    deviceIs04Port: number;
    is04DeviceId: string;
    is04Version: string;
    exportDeviceTree: boolean;
    outputPath: string | null;
}

const DEFAULTS = {
    deviceIs04Address: '127.0.0.1',
    deviceIs04Port: 8080,
    is04DeviceId: 'c1fe9ed2-7602-43c3-a94d-eadd5338b9cd',
    is04Version: 'v1.3',
    exportDeviceTree: false,
    outputPath: null as string | null,
};

function printHelp(): void {
    console.log(`Usage: nmos-control-scripty-client [options]

Options:
  -a, --address <address>     IS-04 node address (env: NMOS_IS04_ADDRESS)
  -p, --port <port>           IS-04 node port (env: NMOS_IS04_PORT)
  -d, --device-id <uuid>      IS-04 device id (env: NMOS_IS04_DEVICE_ID)
  -v, --version <version>     IS-04 API version (env: NMOS_IS04_VERSION)
  --export-device-tree        Export the full device model as a standalone HTML snapshot
  -o, --output <path>         Output HTML path for --export-device-tree (default: device-tree-<timestamp>.html)
  -h, --help                  Show this help message

Command line arguments take precedence over environment variables.
`);
}

interface ParsedArgs {
    deviceIs04Address?: string;
    deviceIs04Port?: string;
    is04DeviceId?: string;
    is04Version?: string;
    exportDeviceTree?: boolean;
    outputPath?: string;
}

function parseArgs(argv: string[]): ParsedArgs {
    const result: ParsedArgs = {};

    for (let i = 2; i < argv.length; i++) {
        const arg = argv[i];
        switch (arg) {
            case '--address':
            case '-a':
                result.deviceIs04Address = argv[++i];
                break;
            case '--port':
            case '-p':
                result.deviceIs04Port = argv[++i];
                break;
            case '--device-id':
            case '-d':
                result.is04DeviceId = argv[++i];
                break;
            case '--version':
            case '-v':
                result.is04Version = argv[++i];
                break;
            case '--export-device-tree':
                result.exportDeviceTree = true;
                break;
            case '--output':
            case '-o':
                result.outputPath = argv[++i];
                break;
            case '--help':
            case '-h':
                printHelp();
                process.exit(0);
                break;
            default:
                throw new Error(`Unknown argument: ${arg} (use --help for usage)`);
        }
    }

    return result;
}

export function loadDeviceConfig(argv: string[] = process.argv): DeviceConfig {
    const args = parseArgs(argv);

    const deviceIs04Address = args.deviceIs04Address ?? process.env.NMOS_IS04_ADDRESS ?? DEFAULTS.deviceIs04Address;
    const portValue = args.deviceIs04Port ?? process.env.NMOS_IS04_PORT ?? String(DEFAULTS.deviceIs04Port);
    const is04DeviceId = args.is04DeviceId ?? process.env.NMOS_IS04_DEVICE_ID ?? DEFAULTS.is04DeviceId;
    const is04Version = args.is04Version ?? process.env.NMOS_IS04_VERSION ?? DEFAULTS.is04Version;
    const exportDeviceTree = args.exportDeviceTree === true
        || process.env.NMOS_EXPORT_DEVICE_TREE === '1'
        || process.env.NMOS_EXPORT_DEVICE_TREE === 'true';
    const outputPath = args.outputPath ?? process.env.NMOS_EXPORT_OUTPUT ?? DEFAULTS.outputPath;

    const deviceIs04Port = Number.parseInt(portValue, 10);
    if (Number.isNaN(deviceIs04Port)) {
        throw new Error(`Invalid port: ${portValue}`);
    }

    return {
        deviceIs04Address,
        deviceIs04Port,
        is04DeviceId,
        is04Version,
        exportDeviceTree,
        outputPath,
    };
}
