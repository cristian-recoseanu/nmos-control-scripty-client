// src/datatypes.ts

export interface Control {
    href: string;
    type: string;
}

export interface QueryApiResponse {
    id: string;
    version: string;
    label: string;
    description: string;
    controls: Control[];
}

export interface NcElementId {
    level: number;
    index: number;
}

export interface Command {
    handle: number;
    oid: number;
    methodId: NcElementId;
    arguments: object;
}

export interface WebSocketCommandMsg {
    messageType: number;
    commands: Command[];
}

export interface NcMethodResult {
    status: number;
}

export interface NcMethodResultError extends NcMethodResult {
    errorMessage: string;
}

export interface NcMethodResultString extends NcMethodResult {
    value: string;
}

export interface NcMethodResultNumber extends NcMethodResult {
    value: number;
}

export interface NcBlockMemberDescriptor {
    role: string;
    oid: number;
    constantOid: boolean;
    classId: number[];
    userLabel: string | null;
    owner: number;
}

export interface NcMethodResultBlockMemberDescriptors extends NcMethodResult {
    value: NcBlockMemberDescriptor[];
}

export interface NcPropertyDescriptor {
    description: string | null;
    id: NcElementId;
    name: string;
    typeName: string | null;
    isReadOnly: boolean;
    isNullable: boolean;
    isSequence: boolean;
    isDeprecated: boolean;
}

export interface NcMethodDescriptor {
    description: string | null;
    id: NcElementId;
    name: string;
    resultDatatype: string;
    parameters: unknown[];
    isDeprecated: boolean;
}

export interface NcEventDescriptor {
    description: string | null;
    id: NcElementId;
    name: string;
    eventDatatype: string;
    isDeprecated: boolean;
}

export interface NcClassDescriptor {
    description: string | null;
    classId: number[];
    name: string;
    fixedRole: string | null;
    properties: NcPropertyDescriptor[];
    methods: NcMethodDescriptor[];
    events: NcEventDescriptor[];
}

export interface NcMethodResultClassDescriptor extends NcMethodResult {
    value: NcClassDescriptor;
}

export interface Response {
    handle: number;
    result: NcMethodResult;
}

export interface WebSocketCommandResponseMsg {
    messageType: number;
    responses: Response[];
}

export interface WebSocketErrorMsg {
    messageType: number;
    status: number;
    errorMessage: string;
}

export enum NcPropertyChangeType {
    "ValueChanged" = 0,
    "SequenceItemAdded" = 1,
    "SequenceItemChanged" = 2,
    "SequenceItemRemoved" = 3
}

export interface NcPropertyChangedEventData {
    propertyId: NcElementId;
    changeType: NcPropertyChangeType,
    value: unknown | null,
    sequenceItemIndex: number | null
}

export interface Notification {
    oid: number;
    eventId: NcElementId;
    eventData: NcPropertyChangedEventData;
}

export interface WebSocketNotificationMsg {
    messageType: number;
    notifications: Notification[];
}

export interface WebSocketSubscriptionsMsg {
    messageType: number;
    subscriptions: number[];
}

export interface WebSocketSubscriptionsResponseMsg {
    messageType: number;
    subscriptions: number[];
}

/**
 * A union type representing any possible message from the server.
 */
export type IncomingWebSocketMessage = WebSocketCommandResponseMsg | WebSocketSubscriptionsResponseMsg | WebSocketNotificationMsg | WebSocketErrorMsg;

export function isWebSocketResponse(msg: IncomingWebSocketMessage): msg is WebSocketCommandResponseMsg {
  return (msg as WebSocketCommandResponseMsg).messageType === 1;
}

export function isWebSocketNotification(msg: IncomingWebSocketMessage): msg is WebSocketNotificationMsg {
  return (msg as WebSocketNotificationMsg).messageType === 2;
}

export function isWebSocketSubscriptions(msg: IncomingWebSocketMessage): msg is WebSocketSubscriptionsResponseMsg {
  return (msg as WebSocketSubscriptionsResponseMsg).messageType === 4;
}

export function isWebSocketError(msg: IncomingWebSocketMessage): msg is WebSocketErrorMsg {
  return (msg as WebSocketErrorMsg).messageType === 5;
}