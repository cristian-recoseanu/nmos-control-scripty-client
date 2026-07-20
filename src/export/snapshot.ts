import { classIdKey } from '../classId';
import { WebSocketClient } from '../websocket';
import {
    NcBlockMemberDescriptor,
    NcClassDescriptor,
    NcDatatypeDescriptor,
    NcElementId,
    NcMethodResultBlockMemberDescriptors,
    NcMethodResultClassDescriptor,
    NcMethodResultDatatypeDescriptor,
    NcMethodResultValue,
    ncDatatypeTypeToString,
} from '../datatypes';
import { logInfo, logStep, logSuccess } from '../logging';

export interface DeviceObjectSnapshot {
    oid: number;
    role: string;
    userLabel: string | null;
    classId: number[];
    classIdKey: string;
    constantOid: boolean;
    owner: number | null;
    children: number[];
    propertyValues: Record<string, unknown>;
    propertyErrors: Record<string, string>;
}

export interface DeviceTreeSnapshot {
    timestamp: string;
    source: {
        is04Address: string;
        is04Port: number;
        is04DeviceId: string;
        is04Version: string;
        websocketHref: string;
    };
    rootOid: number;
    objects: Record<string, DeviceObjectSnapshot>;
    classes: Record<string, NcClassDescriptor>;
    datatypes: Record<string, NcDatatypeDescriptor>;
    unresolvedDatatypes: string[];
    stats: {
        objectCount: number;
        classCount: number;
        datatypeCount: number;
        propertyValueCount: number;
        propertyErrorCount: number;
    };
}

function propertyKey(id: NcElementId): string {
    return `${id.level}p${id.index}`;
}

function collectTypeNamesFromClass(descriptor: NcClassDescriptor, into: Set<string>): void {
    for (const property of descriptor.properties) {
        if (property.typeName) {
            into.add(property.typeName);
        }
    }
    for (const method of descriptor.methods) {
        if (method.resultDatatype) {
            into.add(method.resultDatatype);
        }
        for (const parameter of method.parameters ?? []) {
            if (parameter.typeName) {
                into.add(parameter.typeName);
            }
        }
    }
    for (const event of descriptor.events) {
        if (event.eventDatatype) {
            into.add(event.eventDatatype);
        }
    }
}

function collectTypeNamesFromDatatype(descriptor: NcDatatypeDescriptor, into: Set<string>): void {
    if (descriptor.parentType) {
        into.add(descriptor.parentType);
    }
    if (descriptor.fields) {
        for (const field of descriptor.fields) {
            if (field.typeName) {
                into.add(field.typeName);
            }
        }
    }
}

async function findClassManagerOid(client: WebSocketClient): Promise<number> {
    const result = await client.sendCommand<NcMethodResultBlockMemberDescriptors>(
        1, { level: 2, index: 2 }, { path: ['ClassManager'] }
    );
    if (result.value.length === 0) {
        throw new Error('Could not find NcClassManager at role path ["root","ClassManager"].');
    }
    return result.value[0].oid;
}

async function loadRootDescriptor(client: WebSocketClient): Promise<NcBlockMemberDescriptor> {
    const [classIdResult, roleResult, userLabelResult, constantOidResult] = await Promise.all([
        client.sendCommand<NcMethodResultValue>(1, { level: 1, index: 1 }, { id: { level: 1, index: 1 } }),
        client.sendCommand<NcMethodResultValue>(1, { level: 1, index: 1 }, { id: { level: 1, index: 5 } }),
        client.sendCommand<NcMethodResultValue>(1, { level: 1, index: 1 }, { id: { level: 1, index: 6 } }),
        client.sendCommand<NcMethodResultValue>(1, { level: 1, index: 1 }, { id: { level: 1, index: 3 } }),
    ]);

    return {
        role: String(roleResult.value ?? 'root'),
        oid: 1,
        constantOid: Boolean(constantOidResult.value),
        classId: Array.isArray(classIdResult.value) ? classIdResult.value as number[] : [1, 1],
        userLabel: (userLabelResult.value as string | null) ?? null,
        owner: 0,
    };
}

export async function collectDeviceTreeSnapshot(
    client: WebSocketClient,
    source: DeviceTreeSnapshot['source']
): Promise<DeviceTreeSnapshot> {
    const timestamp = new Date().toISOString();

    logStep('Locate NcClassManager');
    const classManagerOid = await findClassManagerOid(client);
    logSuccess(`Class manager oid: ${classManagerOid}`);

    logStep('Load root block identity');
    const rootMember = await loadRootDescriptor(client);

    logStep('GetMemberDescriptors recurse=true from root');
    const membersResult = await client.sendCommand<NcMethodResultBlockMemberDescriptors>(
        1, { level: 2, index: 1 }, { recurse: true }
    );
    logSuccess(`Found ${membersResult.value.length} member(s) under root`);

    const allMembers: NcBlockMemberDescriptor[] = [rootMember, ...membersResult.value];
    const objects: Record<string, DeviceObjectSnapshot> = {};
    const childrenByOwner = new Map<number, number[]>();

    for (const member of allMembers) {
        const owner = member.oid === 1 ? null : member.owner;
        if (owner !== null && owner !== undefined) {
            const list = childrenByOwner.get(owner) ?? [];
            list.push(member.oid);
            childrenByOwner.set(owner, list);
        }
    }

    for (const member of allMembers) {
        objects[String(member.oid)] = {
            oid: member.oid,
            role: member.role,
            userLabel: member.userLabel,
            classId: member.classId,
            classIdKey: classIdKey(member.classId),
            constantOid: member.constantOid,
            owner: member.oid === 1 ? null : member.owner,
            children: childrenByOwner.get(member.oid) ?? [],
            propertyValues: {},
            propertyErrors: {},
        };
    }

    const uniqueClassIds = new Map<string, number[]>();
    for (const member of allMembers) {
        uniqueClassIds.set(classIdKey(member.classId), member.classId);
    }

    logStep(`Resolve ${uniqueClassIds.size} unique control class descriptor(s) via GetControlClass`);
    const classes: Record<string, NcClassDescriptor> = {};
    for (const [key, classId] of uniqueClassIds) {
        try {
            const result = await client.sendCommand<NcMethodResultClassDescriptor>(
                classManagerOid, { level: 3, index: 1 }, { classId, includeInherited: true }
            );
            classes[key] = result.value;
            logInfo(`• Loaded class ${result.value.name} [${key}]`);
        } catch (error) {
            logInfo(`• Failed to load class [${key}]: ${(error as Error).message}`);
        }
    }

    const pendingTypeNames = new Set<string>();
    for (const classDescriptor of Object.values(classes)) {
        collectTypeNamesFromClass(classDescriptor, pendingTypeNames);
    }

    logStep('Resolve datatype descriptors via GetDatatype (including nested references)');
    const datatypes: Record<string, NcDatatypeDescriptor> = {};
    const unresolvedDatatypes: string[] = [];
    const visited = new Set<string>();

    while (pendingTypeNames.size > 0) {
        const batch = [...pendingTypeNames];
        pendingTypeNames.clear();

        for (const typeName of batch) {
            if (visited.has(typeName)) {
                continue;
            }
            visited.add(typeName);

            try {
                const result = await client.sendCommand<NcMethodResultDatatypeDescriptor>(
                    classManagerOid, { level: 3, index: 2 }, { name: typeName, includeInherited: true }
                );
                datatypes[typeName] = result.value;
                collectTypeNamesFromDatatype(result.value, pendingTypeNames);
                logInfo(`• Loaded datatype ${typeName} (${ncDatatypeTypeToString(result.value.type)})`);
            } catch (error) {
                unresolvedDatatypes.push(typeName);
                logInfo(`• Failed to load datatype ${typeName}: ${(error as Error).message}`);
            }
        }
    }

    logStep('Read current property values for every object');
    let propertyValueCount = 0;
    let propertyErrorCount = 0;

    for (const object of Object.values(objects)) {
        const classDescriptor = classes[object.classIdKey];
        if (!classDescriptor) {
            continue;
        }

        for (const property of classDescriptor.properties) {
            const key = propertyKey(property.id);
            try {
                const result = await client.sendCommand<NcMethodResultValue>(
                    object.oid, { level: 1, index: 1 }, { id: property.id }
                );
                object.propertyValues[key] = result.value;
                propertyValueCount++;
            } catch (error) {
                object.propertyErrors[key] = (error as Error).message;
                propertyErrorCount++;
            }
        }
        logInfo(`• oid ${object.oid} (${object.role}): ${Object.keys(object.propertyValues).length} values`);
    }

    return {
        timestamp,
        source,
        rootOid: 1,
        objects,
        classes,
        datatypes,
        unresolvedDatatypes,
        stats: {
            objectCount: Object.keys(objects).length,
            classCount: Object.keys(classes).length,
            datatypeCount: Object.keys(datatypes).length,
            propertyValueCount,
            propertyErrorCount,
        },
    };
}

