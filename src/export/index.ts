import fs from 'fs';
import path from 'path';

import axios from 'axios';

import { DeviceConfig } from '../config';
import { QueryApiResponse } from '../datatypes';
import { logInfo, logSection, logStep, logSuccess } from '../logging';
import { WebSocketClient } from '../websocket';
import { renderDeviceTreeHtml } from './html';
import { collectDeviceTreeSnapshot } from './snapshot';

function defaultOutputPath(): string {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    return path.resolve(process.cwd(), `device-tree-${stamp}.html`);
}

export async function runDeviceTreeExport(config: DeviceConfig): Promise<void> {
    const is04Url = `http://${config.deviceIs04Address}:${config.deviceIs04Port}/x-nmos/node/${config.is04Version}/devices/${config.is04DeviceId}`;
    const ncpControlType = 'urn:x-nmos:control:ncp/v1.0';
    const outputPath = path.resolve(config.outputPath ?? defaultOutputPath());

    logSection('Export device tree');
    logStep(`Fetching IS-04 device resource from ${is04Url}`);
    const { data: apiResponse } = await axios.get<QueryApiResponse>(is04Url);
    const websocketControl = apiResponse.controls.find(c => c.type === ncpControlType);
    if (!websocketControl?.href) {
        throw new Error(`Could not find a control with type '${ncpControlType}'.`);
    }
    logSuccess(`Found WebSocket URL: ${websocketControl.href}`);

    const client = new WebSocketClient({ quiet: true });
    try {
        await client.connect(websocketControl.href);

        const snapshot = await collectDeviceTreeSnapshot(client, {
            is04Address: config.deviceIs04Address,
            is04Port: config.deviceIs04Port,
            is04DeviceId: config.is04DeviceId,
            is04Version: config.is04Version,
            websocketHref: websocketControl.href,
        });

        logStep(`Write standalone HTML to ${outputPath}`);
        const html = renderDeviceTreeHtml(snapshot);
        fs.writeFileSync(outputPath, html, 'utf8');

        logSuccess(`Exported device tree snapshot`);
        logInfo(`Objects: ${snapshot.stats.objectCount}`);
        logInfo(`Classes: ${snapshot.stats.classCount}`);
        logInfo(`Datatypes: ${snapshot.stats.datatypeCount}`);
        logInfo(`Property values: ${snapshot.stats.propertyValueCount}`);
        if (snapshot.stats.propertyErrorCount > 0) {
            logInfo(`Property errors: ${snapshot.stats.propertyErrorCount}`);
        }
        if (snapshot.unresolvedDatatypes.length > 0) {
            logInfo(`Unresolved datatypes: ${snapshot.unresolvedDatatypes.join(', ')}`);
        }
        logInfo(`Output: ${outputPath}`);
    } finally {
        client.close();
    }
}
