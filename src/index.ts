// src/index.ts

import axios from 'axios';

import { WebSocketClient } from './websocket';

import {
    QueryApiResponse,
    WebSocketNotificationMsg,
    NcMethodResultString,
    NcMethodResult,
    NcMethodResultBlockMemberDescriptors,
    NcMethodResultNumber,
    NcMethodResultClassDescriptor,
    NcClassDescriptor,
    NcMethodResultDatatypeDescriptor,
    NcDatatypeDescriptor,
    NcDatatypeType,
    ncDatatypeTypeToString
} from './datatypes';


/**
 * Main application function
 */
async function main() {
    let client: WebSocketClient | null = null;
    try {
        var deviceIs04Address = "127.0.0.1";
        var deviceIs04Port = 8080;
        var is04DeviceId = "c1fe9ed2-7602-43c3-a94d-eadd5338b9cd";
        var is04Version = "v1.3";

        var is04Url = `http://${deviceIs04Address}:${deviceIs04Port}/x-nmos/node/${is04Version}/devices/${is04DeviceId}`;

        var ncpControlType = 'urn:x-nmos:control:ncp/v1.0';

        // --- 1. Find IS-12 control endpoint ---
        console.log(`Fetching IS-04 device resource from: ${is04Url}`);
        const { data: apiResponse } = await axios.get<QueryApiResponse>(is04Url);
        const websocketControl = apiResponse.controls.find(c => c.type === ncpControlType);
        if (!websocketControl?.href) {
            throw new Error(`Could not find a control with type '${ncpControlType}'.`);
        }
        console.log(`✅ Found WebSocket URL: ${websocketControl.href}`);

        // --- 2. Create client and set up event listener ---
        client = new WebSocketClient();

        // Set up the listener for spontaneous notifications
        client.on('notification', (notification: WebSocketNotificationMsg) => {
            console.log(`\t🔔 Notification received: ${JSON.stringify(notification)}`);
            notification.notifications.forEach(n => {
                console.log(`\t\t• Oid: ${n.oid}, PropertyId: ${n.eventData.propertyId.level}p${n.eventData.propertyId.index}, Value: ${n.eventData.value}, SequenceItemIndex: ${n.eventData.sequenceItemIndex}`);
            });
        });

        // --- 3. Connect to WebSocket href ---
        await client.connect(websocketControl.href);

        // --- 4. Send commands ---
        console.log('\n📝 Get root user label');
        const getUserLabelCmdResult1 = await client.sendCommand<NcMethodResultString>(1, { level: 1, index: 1 }, { id: { level: 1, index: 6 } });
        console.log('✅ Received root user label:', getUserLabelCmdResult1.value);

        var subscriptions: number[] = [ 1 ];

        console.log('\n📝 Subscribe to root object oid 1');
        await client.sendSubscriptions<number[]>(subscriptions);
        console.log('✅ Subscribed to root object oid of 1');

        var newLabel = "ABC XYZ";
        if(getUserLabelCmdResult1.value === newLabel)
            newLabel = "XYZ ABC";

        console.log('\n📝 Set root user label to:', newLabel);
        await client.sendCommand<NcMethodResult>(1, { level: 1, index: 2 }, { id: { level: 1, index: 6 }, value: newLabel });
        console.log('✅ Successfully set root user label to:', newLabel);

        console.log('\n📝 Get root user label after update');
        const getUserLabelCmdResult2 = await client.sendCommand<NcMethodResultString>(1, { level: 1, index: 1 }, { id: { level: 1, index: 6 } });
        console.log('✅ Received new root user label:', getUserLabelCmdResult2.value);

        console.log('\n📝 Find all NcReceiverMonitor [1.2.2.1] members');
        const getReceiverMonitors = await client.sendCommand<NcMethodResultBlockMemberDescriptors>(1, { level: 2, index: 4 }, { classId: [1, 2, 2, 1], includeDerived: true, recurse: true });
        
        console.log(`✅ Found: ${getReceiverMonitors.value.length} receiver monitors`);
        getReceiverMonitors.value.forEach(member => {
            console.log(`\t• Receiver monitor - oid: ${member.oid}, role: ${member.role}, userLabel: ${member.userLabel}`);
        });

        if(getReceiverMonitors.value.length > 0)
        {
            subscriptions = subscriptions.concat(getReceiverMonitors.value.map(m => m.oid));

            console.log('\n📝 Subscribe to all receiver monitor oids');
            await client.sendSubscriptions<number[]>(subscriptions);
            console.log('✅ Subscribed to root object and all receiver monitors');
        }

        for (const member of getReceiverMonitors.value) {
            if (client !== null) {
                console.log(`\n📝 Get overall status for receiver monitor - oid: ${member.oid}, role: ${member.role}`);
                const getReceiverMonitorOverallStatus = await client.sendCommand<NcMethodResultNumber>(
                    member.oid, { level: 1, index: 1 }, { id: { level: 3, index: 1 } }
                );
                console.log('✅ Received overall status for receiver monitor: ', getReceiverMonitorOverallStatus.value);

                console.log(`\n📝 Get link status for receiver monitor - oid: ${member.oid}, role: ${member.role}`);
                const getReceiverMonitorLinkStatus = await client.sendCommand<NcMethodResultNumber>(
                    member.oid, { level: 1, index: 1 }, { id: { level: 4, index: 1 } }
                );
                console.log('✅ Received link status for receiver monitor: ', getReceiverMonitorLinkStatus.value);

                console.log(`\n📝 Get connection status for receiver monitor - oid: ${member.oid}, role: ${member.role}`);
                const getReceiverMonitorConnectionStatus = await client.sendCommand<NcMethodResultNumber>(
                    member.oid, { level: 1, index: 1 }, { id: { level: 4, index: 4 } }
                );
                console.log('✅ Received connection status for receiver monitor: ', getReceiverMonitorConnectionStatus.value);

                console.log(`\n📝 Get sync status for receiver monitor - oid: ${member.oid}, role: ${member.role}`);
                const getReceiverMonitorSyncStatus = await client.sendCommand<NcMethodResultNumber>(
                    member.oid, { level: 1, index: 1 }, { id: { level: 4, index: 7 } }
                );
                console.log('✅ Received sync status for receiver monitor: ', getReceiverMonitorSyncStatus.value);

                console.log(`\n📝 Get stream status for receiver monitor - oid: ${member.oid}, role: ${member.role}`);
                const getReceiverMonitorStreamStatus = await client.sendCommand<NcMethodResultNumber>(
                    member.oid, { level: 1, index: 1 }, { id: { level: 4, index: 11 } }
                );
                console.log('✅ Received stream status for receiver monitor: ', getReceiverMonitorStreamStatus.value);
            }
        }

        console.log('\n📝 Find all NcSenderMonitor [1.2.2.2] members');
        const getSenderMonitors = await client.sendCommand<NcMethodResultBlockMemberDescriptors>(1, { level: 2, index: 4 }, { classId: [1, 2, 2, 2], includeDerived: true, recurse: true });

        console.log(`✅ Found: ${getSenderMonitors.value.length} sender monitors`);
        getSenderMonitors.value.forEach(member => {
            console.log(`\t• Sender monitor - oid: ${member.oid}, role: ${member.role}, userLabel: ${member.userLabel}`);
        });

        if(getSenderMonitors.value.length > 0)
        {
            subscriptions = subscriptions.concat(getSenderMonitors.value.map(m => m.oid));

            console.log('\n📝 Subscribe to all sender monitor oids');
            await client.sendSubscriptions<number[]>(subscriptions);
            console.log('✅ Subscribed to root object, receiver monitors, and sender monitors');
        }

        for (const member of getSenderMonitors.value) {
            if (client !== null) {
                console.log(`\n📝 Get overall status for sender monitor - oid: ${member.oid}, role: ${member.role}`);
                const getSenderMonitorOverallStatus = await client.sendCommand<NcMethodResultNumber>(
                    member.oid, { level: 1, index: 1 }, { id: { level: 3, index: 1 } }
                );
                console.log('✅ Received overall status for sender monitor: ', getSenderMonitorOverallStatus.value);

                console.log(`\n📝 Get link status for sender monitor - oid: ${member.oid}, role: ${member.role}`);
                const getSenderMonitorLinkStatus = await client.sendCommand<NcMethodResultNumber>(
                    member.oid, { level: 1, index: 1 }, { id: { level: 4, index: 1 } }
                );
                console.log('✅ Received link status for sender monitor: ', getSenderMonitorLinkStatus.value);

                console.log(`\n📝 Get transmission status for sender monitor - oid: ${member.oid}, role: ${member.role}`);
                const getSenderMonitorTransmissionStatus = await client.sendCommand<NcMethodResultNumber>(
                    member.oid, { level: 1, index: 1 }, { id: { level: 4, index: 4 } }
                );
                console.log('✅ Received transmission status for sender monitor: ', getSenderMonitorTransmissionStatus.value);

                console.log(`\n📝 Get sync status for sender monitor - oid: ${member.oid}, role: ${member.role}`);
                const getSenderMonitorSyncStatus = await client.sendCommand<NcMethodResultNumber>(
                    member.oid, { level: 1, index: 1 }, { id: { level: 4, index: 7 } }
                );
                console.log('✅ Received sync status for sender monitor: ', getSenderMonitorSyncStatus.value);

                console.log(`\n📝 Get essence status for sender monitor - oid: ${member.oid}, role: ${member.role}`);
                const getSenderMonitorEssenceStatus = await client.sendCommand<NcMethodResultNumber>(
                    member.oid, { level: 1, index: 1 }, { id: { level: 4, index: 11 } }
                );
                console.log('✅ Received essence status for sender monitor: ', getSenderMonitorEssenceStatus.value);
            }
        }

        console.log('\n📝 Discover the entire device model recursively starting from the root block with oid: 1');
        await discoverDeviceModel(client);

        const rootBlockOid = 1;
        const rootBlockRole = 'root';
        const classManagerRole = 'ClassManager';
        const classManagerRolePath = [rootBlockRole, classManagerRole];
        const classManagerRelativePath = [classManagerRole];

        console.log('\n📝 Find NcClassManager [1.3.2] using FindMembersByPath on the root block');
        console.log(`\tRoot block - oid: ${rootBlockOid}, role: "${rootBlockRole}"`);
        console.log(`\tFull role path: ${JSON.stringify(classManagerRolePath)}`);
        console.log(`\tRelative path argument (excludes the root block role): ${JSON.stringify(classManagerRelativePath)}`);
        const getClassManagerByPath = await client.sendCommand<NcMethodResultBlockMemberDescriptors>(
            rootBlockOid, { level: 2, index: 2 }, { path: classManagerRelativePath }
        );

        if (getClassManagerByPath.value.length === 0) {
            throw new Error(`Could not find NcClassManager at role path ${JSON.stringify(classManagerRolePath)}.`);
        }

        const classManager = getClassManagerByPath.value[0];
        console.log(`✅ Found NcClassManager - oid: ${classManager.oid}, role: ${classManager.role}, classId: ${classManager.classId.join('.')}, userLabel: ${classManager.userLabel}`);

        if (getReceiverMonitors.value.length > 0) {
            const receiverMonitorClassId = [1, 2, 2, 1];
            console.log('\n📝 Get NcReceiverMonitor class descriptor using GetControlClass on NcClassManager');
            console.log(`\tClass manager oid: ${classManager.oid}`);
            console.log(`\tClass id: ${JSON.stringify(receiverMonitorClassId)}, includeInherited: true`);
            const getReceiverMonitorClass = await client.sendCommand<NcMethodResultClassDescriptor>(
                classManager.oid, { level: 3, index: 1 }, { classId: receiverMonitorClassId, includeInherited: true }
            );
            logClassDescriptor('NcReceiverMonitor', getReceiverMonitorClass.value);
        }

        if (getSenderMonitors.value.length > 0) {
            const senderMonitorClassId = [1, 2, 2, 2];
            console.log('\n📝 Get NcSenderMonitor class descriptor using GetControlClass on NcClassManager');
            console.log(`\tClass manager oid: ${classManager.oid}`);
            console.log(`\tClass id: ${JSON.stringify(senderMonitorClassId)}, includeInherited: true`);
            const getSenderMonitorClass = await client.sendCommand<NcMethodResultClassDescriptor>(
                classManager.oid, { level: 3, index: 1 }, { classId: senderMonitorClassId, includeInherited: true }
            );
            logClassDescriptor('NcSenderMonitor', getSenderMonitorClass.value);
        }

        if (getReceiverMonitors.value.length > 0 || getSenderMonitors.value.length > 0) {
            const linkStatusDatatypeName = 'NcLinkStatus';
            console.log('\n📝 Get NcLinkStatus enum datatype descriptor using GetDatatype on NcClassManager');
            console.log(`\tClass manager oid: ${classManager.oid}`);
            console.log(`\tDatatype name: ${linkStatusDatatypeName}, includeInherited: true`);
            const getLinkStatusDatatype = await client.sendCommand<NcMethodResultDatatypeDescriptor>(
                classManager.oid, { level: 3, index: 2 }, { name: linkStatusDatatypeName, includeInherited: true }
            );
            logDatatypeDescriptor(getLinkStatusDatatype.value);
        }

        console.log("\n🎉 All commands completed successfully!");
        console.log("Waiting for notifications... (Press Ctrl+C to exit)");
        // Keep the process alive to receive notifications
        // In a real app, this would be part of a larger application loop.
        // For this script, we'll just wait indefinitely.
        await new Promise(() => {}); // never resolves, hangs forever
    } catch (error) {
        console.error('❌ An error occurred in the main workflow:', (error as Error).message);
    } finally {
        if (client) {
            console.log("Closing WebSocket connection.");
            client.close();
        }
    }

    function logClassDescriptor(className: string, descriptor: NcClassDescriptor): void {
        console.log(`✅ Received ${className} class descriptor - name: ${descriptor.name}, classId: ${descriptor.classId.join('.')}`);
        console.log(`\tProperties (${descriptor.properties.length}):`);
        descriptor.properties.forEach(p => {
            console.log(`\t\t• ${p.id.level}p${p.id.index} ${p.name} (${p.typeName})${p.isReadOnly ? ', readonly' : ''}`);
        });
        console.log(`\tMethods (${descriptor.methods.length}):`);
        descriptor.methods.forEach(m => {
            console.log(`\t\t• ${m.id.level}m${m.id.index} ${m.name} -> ${m.resultDatatype}`);
        });
        console.log(`\tEvents (${descriptor.events.length}):`);
        descriptor.events.forEach(e => {
            console.log(`\t\t• ${e.id.level}e${e.id.index} ${e.name} (${e.eventDatatype})`);
        });
    }

    function logDatatypeDescriptor(descriptor: NcDatatypeDescriptor): void {
        console.log(`✅ Received ${descriptor.name} datatype descriptor - type: ${descriptor.type} (${ncDatatypeTypeToString(descriptor.type)})`);
        if (descriptor.type === NcDatatypeType.Enum && descriptor.items) {
            console.log(`\tEnum items (${descriptor.items.length}):`);
            descriptor.items.forEach(item => {
                console.log(`\t\t• ${item.name} = ${item.value}${item.description ? ` (${item.description})` : ''}`);
            });
        }
    }

    async function discoverDeviceModel(
        client: WebSocketClient,
        oid: number = 1,
        depth: number = 0
    ): Promise<void> {
        const indent = '\t'.repeat(depth);
        
        try {
            const result = await client.sendCommand<NcMethodResultBlockMemberDescriptors>(
                oid, 
                { level: 2, index: 1 }, 
                { recurse: false }
            );
            
            for (const member of result.value) {
                if(member.classId.join('.') == '1.1')
                {
                    console.log(
                        `${indent}• Block Member - oid: ${member.oid}, role: ${member.role}, classId: ${member.classId.join('.')}, finding members`
                    );

                    // Recursively discover its members
                    await discoverDeviceModel(client, member.oid, depth + 1);
                }
                else
                    console.log(
                        `${indent}• Member - oid: ${member.oid}, role: ${member.role}, classId: ${member.classId.join('.')}`
                    );
            }
        } catch (error) {
            console.error(`${indent}Error discovering members for oid ${oid}:`, error);
        }
    }
}

main();