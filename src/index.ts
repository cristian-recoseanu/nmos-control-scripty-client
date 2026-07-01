// src/index.ts

import axios from 'axios';

import { loadDeviceConfig } from './config';
import {
    logSection,
    logSubsection,
    logStep,
    logSuccess,
    logInfo,
    logCounters,
    logClassDescriptor,
    logDatatypeDescriptor,
} from './logging';
import { WebSocketClient } from './websocket';

import {
    QueryApiResponse,
    WebSocketNotificationMsg,
    NcMethodResultString,
    NcMethodResult,
    NcMethodResultBlockMemberDescriptors,
    NcMethodResultValue,
    NcMethodResultCounters,
    NcElementId,
    NcMethodResultClassDescriptor,
    NcMethodResultDatatypeDescriptor,
} from './datatypes';

const receiverMonitorProperties: { name: string; id: NcElementId }[] = [
    { name: 'overallStatus', id: { level: 3, index: 1 } },
    { name: 'overallStatusMessage', id: { level: 3, index: 2 } },
    { name: 'statusReportingDelay', id: { level: 3, index: 3 } },
    { name: 'linkStatus', id: { level: 4, index: 1 } },
    { name: 'linkStatusMessage', id: { level: 4, index: 2 } },
    { name: 'linkStatusTransitionCounter', id: { level: 4, index: 3 } },
    { name: 'connectionStatus', id: { level: 4, index: 4 } },
    { name: 'connectionStatusMessage', id: { level: 4, index: 5 } },
    { name: 'connectionStatusTransitionCounter', id: { level: 4, index: 6 } },
    { name: 'externalSynchronizationStatus', id: { level: 4, index: 7 } },
    { name: 'externalSynchronizationStatusMessage', id: { level: 4, index: 8 } },
    { name: 'externalSynchronizationStatusTransitionCounter', id: { level: 4, index: 9 } },
    { name: 'synchronizationSourceId', id: { level: 4, index: 10 } },
    { name: 'streamStatus', id: { level: 4, index: 11 } },
    { name: 'streamStatusMessage', id: { level: 4, index: 12 } },
    { name: 'streamStatusTransitionCounter', id: { level: 4, index: 13 } },
    { name: 'autoResetCountersAndMessages', id: { level: 4, index: 14 } },
];

const senderMonitorProperties: { name: string; id: NcElementId }[] = [
    { name: 'overallStatus', id: { level: 3, index: 1 } },
    { name: 'overallStatusMessage', id: { level: 3, index: 2 } },
    { name: 'statusReportingDelay', id: { level: 3, index: 3 } },
    { name: 'linkStatus', id: { level: 4, index: 1 } },
    { name: 'linkStatusMessage', id: { level: 4, index: 2 } },
    { name: 'linkStatusTransitionCounter', id: { level: 4, index: 3 } },
    { name: 'transmissionStatus', id: { level: 4, index: 4 } },
    { name: 'transmissionStatusMessage', id: { level: 4, index: 5 } },
    { name: 'transmissionStatusTransitionCounter', id: { level: 4, index: 6 } },
    { name: 'externalSynchronizationStatus', id: { level: 4, index: 7 } },
    { name: 'externalSynchronizationStatusMessage', id: { level: 4, index: 8 } },
    { name: 'externalSynchronizationStatusTransitionCounter', id: { level: 4, index: 9 } },
    { name: 'synchronizationSourceId', id: { level: 4, index: 10 } },
    { name: 'essenceStatus', id: { level: 4, index: 11 } },
    { name: 'essenceStatusMessage', id: { level: 4, index: 12 } },
    { name: 'essenceStatusTransitionCounter', id: { level: 4, index: 13 } },
    { name: 'autoResetCountersAndMessages', id: { level: 4, index: 14 } },
];


/**
 * Main application function
 */
async function main() {
    let client: WebSocketClient | null = null;
    try {
        const { deviceIs04Address, deviceIs04Port, is04DeviceId, is04Version } = loadDeviceConfig();

        var is04Url = `http://${deviceIs04Address}:${deviceIs04Port}/x-nmos/node/${is04Version}/devices/${is04DeviceId}`;

        var ncpControlType = 'urn:x-nmos:control:ncp/v1.0';

        logSection('IS-04 device lookup');
        logStep(`Fetching device resource from ${is04Url}`);
        const { data: apiResponse } = await axios.get<QueryApiResponse>(is04Url);
        const websocketControl = apiResponse.controls.find(c => c.type === ncpControlType);
        if (!websocketControl?.href) {
            throw new Error(`Could not find a control with type '${ncpControlType}'.`);
        }
        logSuccess(`Found WebSocket URL: ${websocketControl.href}`);

        logSection('WebSocket connection');
        client = new WebSocketClient();

        client.on('notification', (notification: WebSocketNotificationMsg) => {
            logSubsection('Notification received');
            logInfo(JSON.stringify(notification));
            notification.notifications.forEach(n => {
                logInfo(`• Oid: ${n.oid}, PropertyId: ${n.eventData.propertyId.level}p${n.eventData.propertyId.index}, Value: ${n.eventData.value}, SequenceItemIndex: ${n.eventData.sequenceItemIndex}`);
            });
        });

        await client.connect(websocketControl.href);

        logSection('Root object');
        logSubsection('User label');
        logStep('Get root user label');
        const getUserLabelCmdResult1 = await client.sendCommand<NcMethodResultString>(1, { level: 1, index: 1 }, { id: { level: 1, index: 6 } });
        logSuccess('Root user label:', getUserLabelCmdResult1.value);

        var subscriptions: number[] = [ 1 ];

        logSubsection('Subscriptions');
        logStep('Subscribe to root object oid 1');
        await client.sendSubscriptions<number[]>(subscriptions);
        logSuccess('Subscribed to root object oid 1');

        var newLabel = "ABC XYZ";
        if(getUserLabelCmdResult1.value === newLabel)
            newLabel = "XYZ ABC";

        logStep(`Set root user label to "${newLabel}"`);
        await client.sendCommand<NcMethodResult>(1, { level: 1, index: 2 }, { id: { level: 1, index: 6 }, value: newLabel });
        logSuccess(`Root user label set to "${newLabel}"`);

        logStep('Get root user label after update');
        const getUserLabelCmdResult2 = await client.sendCommand<NcMethodResultString>(1, { level: 1, index: 1 }, { id: { level: 1, index: 6 } });
        logSuccess('Root user label:', getUserLabelCmdResult2.value);

        logSection('Receiver monitors');
        logSubsection('Discovery');
        logStep('Find all NcReceiverMonitor [1.2.2.1] members');
        const getReceiverMonitors = await client.sendCommand<NcMethodResultBlockMemberDescriptors>(1, { level: 2, index: 4 }, { classId: [1, 2, 2, 1], includeDerived: true, recurse: true });

        logSuccess(`Found ${getReceiverMonitors.value.length} receiver monitor(s)`);
        getReceiverMonitors.value.forEach(member => {
            logInfo(`• oid: ${member.oid}, role: ${member.role}, userLabel: ${member.userLabel}`);
        });

        if(getReceiverMonitors.value.length > 0)
        {
            subscriptions = subscriptions.concat(getReceiverMonitors.value.map(m => m.oid));

            logSubsection('Subscriptions');
            logStep('Subscribe to all receiver monitor oids');
            await client.sendSubscriptions<number[]>(subscriptions);
            logSuccess('Subscribed to root object and all receiver monitors');
        }

        for (let i = 0; i < getReceiverMonitors.value.length; i++) {
            const member = getReceiverMonitors.value[i];
            if (client !== null) {
                logSubsection(`Receiver monitor [${i + 1}/${getReceiverMonitors.value.length}] — oid: ${member.oid}, role: ${member.role}`);

                for (const property of receiverMonitorProperties) {
                    logStep(`Get ${property.name}`);
                    const result = await client.sendCommand<NcMethodResultValue>(
                        member.oid, { level: 1, index: 1 }, { id: property.id }
                    );
                    logSuccess(`${property.name}:`, result.value);
                }

                logStep('GetLostPacketCounters');
                const getLostPacketCounters = await client.sendCommand<NcMethodResultCounters>(
                    member.oid, { level: 4, index: 1 }, {}
                );
                logSuccess('Lost packet counters:');
                logCounters(getLostPacketCounters.value);

                logStep('GetLatePacketCounters');
                const getLatePacketCounters = await client.sendCommand<NcMethodResultCounters>(
                    member.oid, { level: 4, index: 2 }, {}
                );
                logSuccess('Late packet counters:');
                logCounters(getLatePacketCounters.value);
            }
        }

        logSection('Sender monitors');
        logSubsection('Discovery');
        logStep('Find all NcSenderMonitor [1.2.2.2] members');
        const getSenderMonitors = await client.sendCommand<NcMethodResultBlockMemberDescriptors>(1, { level: 2, index: 4 }, { classId: [1, 2, 2, 2], includeDerived: true, recurse: true });

        logSuccess(`Found ${getSenderMonitors.value.length} sender monitor(s)`);
        getSenderMonitors.value.forEach(member => {
            logInfo(`• oid: ${member.oid}, role: ${member.role}, userLabel: ${member.userLabel}`);
        });

        if(getSenderMonitors.value.length > 0)
        {
            subscriptions = subscriptions.concat(getSenderMonitors.value.map(m => m.oid));

            logSubsection('Subscriptions');
            logStep('Subscribe to all sender monitor oids');
            await client.sendSubscriptions<number[]>(subscriptions);
            logSuccess('Subscribed to root object, receiver monitors, and sender monitors');
        }

        for (let i = 0; i < getSenderMonitors.value.length; i++) {
            const member = getSenderMonitors.value[i];
            if (client !== null) {
                logSubsection(`Sender monitor [${i + 1}/${getSenderMonitors.value.length}] — oid: ${member.oid}, role: ${member.role}`);

                for (const property of senderMonitorProperties) {
                    logStep(`Get ${property.name}`);
                    const result = await client.sendCommand<NcMethodResultValue>(
                        member.oid, { level: 1, index: 1 }, { id: property.id }
                    );
                    logSuccess(`${property.name}:`, result.value);
                }

                logStep('GetTransmissionErrorCounters');
                const getTransmissionErrorCounters = await client.sendCommand<NcMethodResultCounters>(
                    member.oid, { level: 4, index: 1 }, {}
                );
                logSuccess('Transmission error counters:');
                logCounters(getTransmissionErrorCounters.value);
            }
        }

        logSection('Device model discovery');
        logStep('Discover the entire device model recursively from root block oid 1');
        await discoverDeviceModel(client);

        logSection('Class manager');
        const rootBlockOid = 1;
        const rootBlockRole = 'root';
        const classManagerRole = 'ClassManager';
        const classManagerRolePath = [rootBlockRole, classManagerRole];
        const classManagerRelativePath = [classManagerRole];

        logStep('Find NcClassManager [1.3.2] using FindMembersByPath on the root block');
        logInfo(`Root block — oid: ${rootBlockOid}, role: "${rootBlockRole}"`);
        logInfo(`Full role path: ${JSON.stringify(classManagerRolePath)}`);
        logInfo(`Relative path argument: ${JSON.stringify(classManagerRelativePath)}`);
        const getClassManagerByPath = await client.sendCommand<NcMethodResultBlockMemberDescriptors>(
            rootBlockOid, { level: 2, index: 2 }, { path: classManagerRelativePath }
        );

        if (getClassManagerByPath.value.length === 0) {
            throw new Error(`Could not find NcClassManager at role path ${JSON.stringify(classManagerRolePath)}.`);
        }

        const classManager = getClassManagerByPath.value[0];
        logSuccess(`Found NcClassManager — oid: ${classManager.oid}, role: ${classManager.role}, classId: ${classManager.classId.join('.')}, userLabel: ${classManager.userLabel}`);

        logSection('Class and datatype descriptors');

        if (getReceiverMonitors.value.length > 0) {
            logSubsection('NcReceiverMonitor class descriptor');
            const receiverMonitorClassId = [1, 2, 2, 1];
            logStep('GetControlClass');
            logInfo(`Class manager oid: ${classManager.oid}`);
            logInfo(`Class id: ${JSON.stringify(receiverMonitorClassId)}, includeInherited: true`);
            const getReceiverMonitorClass = await client.sendCommand<NcMethodResultClassDescriptor>(
                classManager.oid, { level: 3, index: 1 }, { classId: receiverMonitorClassId, includeInherited: true }
            );
            logClassDescriptor('NcReceiverMonitor', getReceiverMonitorClass.value);
        }

        if (getSenderMonitors.value.length > 0) {
            logSubsection('NcSenderMonitor class descriptor');
            const senderMonitorClassId = [1, 2, 2, 2];
            logStep('GetControlClass');
            logInfo(`Class manager oid: ${classManager.oid}`);
            logInfo(`Class id: ${JSON.stringify(senderMonitorClassId)}, includeInherited: true`);
            const getSenderMonitorClass = await client.sendCommand<NcMethodResultClassDescriptor>(
                classManager.oid, { level: 3, index: 1 }, { classId: senderMonitorClassId, includeInherited: true }
            );
            logClassDescriptor('NcSenderMonitor', getSenderMonitorClass.value);
        }

        if (getReceiverMonitors.value.length > 0 || getSenderMonitors.value.length > 0) {
            logSubsection('NcLinkStatus datatype descriptor');
            const linkStatusDatatypeName = 'NcLinkStatus';
            logStep('GetDatatype');
            logInfo(`Class manager oid: ${classManager.oid}`);
            logInfo(`Datatype name: ${linkStatusDatatypeName}, includeInherited: true`);
            const getLinkStatusDatatype = await client.sendCommand<NcMethodResultDatatypeDescriptor>(
                classManager.oid, { level: 3, index: 2 }, { name: linkStatusDatatypeName, includeInherited: true }
            );
            logDatatypeDescriptor(getLinkStatusDatatype.value);
        }

        logSection('Complete');
        logSuccess('All commands completed successfully');
        logInfo('Waiting for notifications... (Press Ctrl+C to exit)');
        await new Promise(() => {}); // never resolves, hangs forever
    } catch (error) {
        console.error('❌ An error occurred in the main workflow:', (error as Error).message);
    } finally {
        if (client) {
            logInfo('Closing WebSocket connection.');
            client.close();
        }
    }

    async function discoverDeviceModel(
        client: WebSocketClient,
        oid: number = 1,
        depth: number = 0
    ): Promise<void> {
        const indent = '    ' + '  '.repeat(depth);

        try {
            const result = await client.sendCommand<NcMethodResultBlockMemberDescriptors>(
                oid,
                { level: 2, index: 1 },
                { recurse: false }
            );

            for (const member of result.value) {
                if(member.classId.join('.') == '1.1')
                {
                    logInfo(`${indent}• Block — oid: ${member.oid}, role: ${member.role}, classId: ${member.classId.join('.')}`);
                    await discoverDeviceModel(client, member.oid, depth + 1);
                }
                else
                    logInfo(`${indent}• Member — oid: ${member.oid}, role: ${member.role}, classId: ${member.classId.join('.')}`);
            }
        } catch (error) {
            console.error(`${indent}Error discovering members for oid ${oid}:`, error);
        }
    }
}

main();
