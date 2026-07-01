import {
    NcClassDescriptor,
    NcCounter,
    NcDatatypeDescriptor,
    NcDatatypeType,
    ncDatatypeTypeToString,
} from './datatypes';

const WIDTH = 72;

export function logSection(title: string): void {
    const line = '═'.repeat(WIDTH);
    console.log(`\n${line}\n  ${title}\n${line}`);
}

export function logSubsection(title: string): void {
    const padding = Math.max(1, WIDTH - title.length - 3);
    console.log(`\n── ${title} ${'─'.repeat(padding)}`);
}

export function logStep(message: string): void {
    console.log(`    📝 ${message}`);
}

export function logSuccess(message: string, value?: unknown): void {
    if (value !== undefined) {
        console.log(`    ✅ ${message}`, value);
    } else {
        console.log(`    ✅ ${message}`);
    }
}

export function logInfo(message: string): void {
    console.log(`    ${message}`);
}

export function logCounters(counters: NcCounter[]): void {
    if (counters.length === 0) {
        logInfo('(no counters)');
        return;
    }
    counters.forEach(counter => {
        logInfo(`• ${counter.name}: ${counter.value}${counter.description ? ` (${counter.description})` : ''}`);
    });
}

export function logClassDescriptor(className: string, descriptor: NcClassDescriptor): void {
    logSuccess(`${className} class descriptor — name: ${descriptor.name}, classId: ${descriptor.classId.join('.')}`);
    logInfo(`Properties (${descriptor.properties.length}):`);
    descriptor.properties.forEach(p => {
        logInfo(`  • ${p.id.level}p${p.id.index} ${p.name} (${p.typeName})${p.isReadOnly ? ', readonly' : ''}`);
    });
    logInfo(`Methods (${descriptor.methods.length}):`);
    descriptor.methods.forEach(m => {
        logInfo(`  • ${m.id.level}m${m.id.index} ${m.name} -> ${m.resultDatatype}`);
    });
    logInfo(`Events (${descriptor.events.length}):`);
    descriptor.events.forEach(e => {
        logInfo(`  • ${e.id.level}e${e.id.index} ${e.name} (${e.eventDatatype})`);
    });
}

export function logDatatypeDescriptor(descriptor: NcDatatypeDescriptor): void {
    logSuccess(`${descriptor.name} datatype descriptor — type: ${descriptor.type} (${ncDatatypeTypeToString(descriptor.type)})`);
    if (descriptor.type === NcDatatypeType.Enum && descriptor.items) {
        logInfo(`Enum items (${descriptor.items.length}):`);
        descriptor.items.forEach(item => {
            logInfo(`  • ${item.name} = ${item.value}${item.description ? ` (${item.description})` : ''}`);
        });
    }
}
