// src/index.ts

import axios from 'axios';

import { WebSocketClient } from './websocket';

import {
    QueryApiResponse,
    WebSocketNotificationMsg,
    NcMethodResultString,
    NcMethodResult,
    NcMethodResultBlockMemberDescriptors,
    NcMethodResultNumber
} from './datatypes';


/**
 * Main application function
 */
async function main() {
    let client: WebSocketClient | null = null;
    try {
        var deviceIs04Address = "127.0.0.1";
        var deviceIs04Port = 3000;
        var is04DeviceId = "67c25159-ce25-4000-a66c-f31fff890265";
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
}

main();