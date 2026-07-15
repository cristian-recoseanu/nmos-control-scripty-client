import { DeviceTreeSnapshot } from './snapshot';

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

export function renderDeviceTreeHtml(snapshot: DeviceTreeSnapshot): string {
    const title = `NMOS Device Tree — ${snapshot.source.is04DeviceId}`;
    const payload = JSON.stringify(snapshot).replace(/</g, '\\u003c');

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
:root {
  --bg: #0b1220;
  --bg-elevated: #121a2b;
  --panel: #151e31;
  --panel-2: #1a2438;
  --ink: #e8eef8;
  --muted: #8b9bb3;
  --line: #2a3750;
  --line-soft: #223049;
  --accent: #3dd6c6;
  --accent-2: #6ea8fe;
  --accent-soft: rgba(61, 214, 198, 0.12);
  --accent-2-soft: rgba(110, 168, 254, 0.14);
  --warn: #ffb086;
  --warn-soft: rgba(255, 176, 134, 0.14);
  --role-bg: linear-gradient(135deg, rgba(61, 214, 198, 0.18), rgba(61, 214, 198, 0.06));
  --class-bg: linear-gradient(135deg, rgba(110, 168, 254, 0.18), rgba(110, 168, 254, 0.06));
  --mono: ui-monospace, "SFMono-Regular", "Cascadia Mono", "Segoe UI Mono", Consolas, monospace;
  --sans: "Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif;
  --shadow: 0 12px 40px rgba(0, 0, 0, 0.35);
  --radius: 12px;
}
* { box-sizing: border-box; }
html, body {
  margin: 0; height: 100%;
  background:
    radial-gradient(1200px 600px at 10% -10%, rgba(61, 214, 198, 0.08), transparent 55%),
    radial-gradient(900px 500px at 90% 0%, rgba(110, 168, 254, 0.08), transparent 50%),
    var(--bg);
  color: var(--ink);
  font: 14px/1.5 var(--sans);
}
button, input { font: inherit; color: inherit; }
header.app {
  display: flex; flex-wrap: wrap; gap: 12px 24px; align-items: end; justify-content: space-between;
  padding: 18px 22px;
  border-bottom: 1px solid var(--line);
  background: rgba(18, 26, 43, 0.85);
  backdrop-filter: blur(10px);
}
header.app h1 {
  margin: 0 0 4px;
  font-size: 1.35rem;
  letter-spacing: -0.03em;
  font-weight: 700;
}
header.app .meta { color: var(--muted); font-size: 0.92rem; }
header.app .meta strong { color: var(--ink); font-weight: 600; }
.layout { display: grid; grid-template-columns: minmax(300px, 360px) 1fr; min-height: calc(100% - 92px); }
aside {
  border-right: 1px solid var(--line);
  background: rgba(15, 22, 36, 0.92);
  overflow: auto;
  padding: 14px;
}
main { overflow: auto; padding: 18px 22px 48px; }
.toolbar { display: flex; gap: 8px; margin-bottom: 12px; }
.toolbar input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--panel);
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.toolbar input::placeholder { color: #6d7d96; }
.toolbar input:focus {
  border-color: rgba(61, 214, 198, 0.55);
  box-shadow: 0 0 0 3px rgba(61, 214, 198, 0.12);
}
.tree { --tree-indent: 16px; }
.tree .node { position: relative; margin: 2px 0; }
.tree .children {
  margin: 0 0 0 12px;
  padding: 2px 0 2px var(--tree-indent);
  border-left: 1px solid var(--line-soft);
}
.tree details { margin: 0; }
.tree summary {
  cursor: pointer;
  list-style: none;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 7px 8px;
  border-radius: 10px;
  color: var(--ink);
  transition: background 0.12s ease;
}
.tree summary::-webkit-details-marker { display: none; }
.tree summary:hover { background: rgba(255, 255, 255, 0.04); }
.tree .node.active > details > summary {
  background: var(--accent-soft);
  box-shadow: inset 0 0 0 1px rgba(61, 214, 198, 0.25);
}
.tree .twisty {
  flex: 0 0 18px;
  width: 18px;
  height: 18px;
  margin-top: 2px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 5px;
  color: var(--muted);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--line-soft);
  font-size: 10px;
  line-height: 1;
  user-select: none;
}
.tree details[open] > summary .twisty {
  color: var(--accent);
  border-color: rgba(61, 214, 198, 0.35);
  background: var(--accent-soft);
}
.tree .twisty::before { content: "▸"; display: block; transform: translateX(0.5px); }
.tree details[open] > summary .twisty::before { content: "▾"; }
.tree .node.leaf > details > summary .twisty {
  background: transparent;
  border-color: transparent;
  pointer-events: none;
}
.tree .node.leaf > details > summary .twisty::before {
  content: "";
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #3a4b66;
}
.tree .label {
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}
.tree .chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 100%;
  padding: 3px 9px;
  border-radius: 999px;
  border: 1px solid transparent;
  font-size: 0.82rem;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.tree .chip-role {
  background: var(--role-bg);
  border-color: rgba(61, 214, 198, 0.28);
  color: #b7fff6;
  font-weight: 600;
}
.tree .chip-class {
  background: var(--class-bg);
  border-color: rgba(110, 168, 254, 0.28);
  color: #c9dcff;
  font-family: var(--mono);
  font-size: 0.76rem;
  font-weight: 500;
}
.tree .chip-count {
  background: rgba(255, 255, 255, 0.04);
  border-color: var(--line);
  color: var(--muted);
  font-family: var(--mono);
  font-size: 0.72rem;
  font-weight: 600;
  padding: 2px 7px;
}
.tree .chip-count strong { color: var(--ink); font-weight: 700; }
.panel {
  background: linear-gradient(180deg, rgba(26, 36, 56, 0.95), rgba(18, 26, 43, 0.95));
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 18px;
  margin-bottom: 16px;
  box-shadow: var(--shadow);
}
.panel h2 {
  margin: 0 0 4px;
  font-size: 1.25rem;
  letter-spacing: -0.02em;
}
.panel .subtitle { color: var(--muted); margin-bottom: 14px; }
.panel h3 {
  margin: 22px 0 10px;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--muted);
}
.kv {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 8px 14px;
  padding: 12px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.18);
  border: 1px solid var(--line-soft);
}
.kv dt { color: var(--muted); }
.kv dd { margin: 0; font-family: var(--mono); word-break: break-word; font-size: 0.9rem; }
.table-wrap {
  overflow: auto;
  border: 1px solid var(--line-soft);
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.14);
}
table { width: 100%; border-collapse: collapse; }
th, td {
  text-align: left;
  vertical-align: top;
  padding: 10px 12px;
  border-bottom: 1px solid var(--line-soft);
}
tr:last-child td { border-bottom: none; }
th {
  color: var(--muted);
  font-weight: 600;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: rgba(255, 255, 255, 0.02);
}
code {
  font-family: var(--mono);
  font-size: 0.84em;
  color: #9fd7ff;
}
.type-link, .class-link {
  color: var(--accent-2);
  text-decoration: none;
  cursor: pointer;
  background: var(--accent-2-soft);
  border: 1px solid rgba(110, 168, 254, 0.25);
  border-radius: 999px;
  padding: 2px 8px;
  font-family: var(--mono);
  font-size: 0.8em;
}
.type-link:hover, .class-link:hover {
  border-color: rgba(110, 168, 254, 0.5);
  background: rgba(110, 168, 254, 0.22);
}
.type-ref {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}
.type-flags {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}
.badge.flag {
  background: rgba(255, 255, 255, 0.04);
  color: var(--muted);
  border-color: var(--line);
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  padding: 2px 7px;
}
.badge.vendor {
  background: rgba(255, 176, 134, 0.14);
  color: var(--warn);
  border-color: rgba(255, 176, 134, 0.28);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  padding: 2px 8px;
}
.tree .chip-vendor {
  background: rgba(255, 176, 134, 0.14);
  border-color: rgba(255, 176, 134, 0.28);
  color: var(--warn);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  padding: 2px 8px;
}
.value {
  font-family: var(--mono);
  white-space: pre-wrap;
  word-break: break-word;
  background: #0a101c;
  border: 1px solid var(--line-soft);
  border-radius: 10px;
  padding: 10px;
  max-height: 260px;
  overflow: auto;
  color: #d7e3f4;
  font-size: 0.84rem;
}
.badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--accent);
  border: 1px solid rgba(61, 214, 198, 0.25);
  font-size: 0.78rem;
  font-weight: 600;
}
.badge.warn {
  background: var(--warn-soft);
  color: var(--warn);
  border-color: rgba(255, 176, 134, 0.28);
}
.empty { color: var(--muted); font-style: italic; }
.drawer-backdrop {
  position: fixed; inset: 0;
  background: rgba(4, 8, 16, 0.62);
  display: none;
  align-items: stretch;
  justify-content: flex-end;
  backdrop-filter: blur(2px);
}
.drawer-backdrop.open { display: flex; }
.drawer {
  width: min(560px, 100%);
  background: var(--bg-elevated);
  border-left: 1px solid var(--line);
  padding: 18px;
  overflow: auto;
  box-shadow: var(--shadow);
}
.drawer header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.drawer header h2 { margin: 0; font-size: 1.1rem; }
.drawer header button {
  border: 1px solid var(--line);
  background: var(--panel);
  border-radius: 8px;
  padding: 7px 12px;
  cursor: pointer;
}
.drawer header button:hover { border-color: rgba(61, 214, 198, 0.4); }
.stats { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
@media (max-width: 900px) {
  .layout { grid-template-columns: 1fr; }
  aside { border-right: none; border-bottom: 1px solid var(--line); max-height: 42vh; }
}
</style>
</head>
<body>
<header class="app">
  <div>
    <h1>NMOS Device Model Snapshot</h1>
    <div class="meta">
      Captured <strong id="ts"></strong><br>
      Device <strong id="device"></strong> ·
      <span id="endpoint"></span>
    </div>
    <div class="stats" id="stats"></div>
  </div>
</header>
<div class="layout">
  <aside>
    <div class="toolbar">
      <input id="filter" type="search" placeholder="Filter by role, class, oid…">
    </div>
    <div class="tree" id="tree"></div>
  </aside>
  <main id="main">
    <div class="panel empty">Select an object in the tree to inspect properties, methods, and datatype links.</div>
  </main>
</div>
<div class="drawer-backdrop" id="drawer">
  <div class="drawer">
    <header>
      <h2 id="drawer-title">Descriptor</h2>
      <button type="button" id="drawer-close">Close</button>
    </header>
    <div id="drawer-body"></div>
  </div>
</div>
<script id="snapshot-data" type="application/json">${payload}</script>
<script>
const SNAPSHOT = JSON.parse(document.getElementById('snapshot-data').textContent);
const objects = SNAPSHOT.objects;
const classes = SNAPSHOT.classes;
const datatypes = SNAPSHOT.datatypes;

document.getElementById('ts').textContent = SNAPSHOT.timestamp;
document.getElementById('device').textContent = SNAPSHOT.source.is04DeviceId;
document.getElementById('endpoint').textContent =
  SNAPSHOT.source.is04Address + ':' + SNAPSHOT.source.is04Port + ' / ' + SNAPSHOT.source.is04Version;

const stats = SNAPSHOT.stats;
document.getElementById('stats').innerHTML = [
  badge(stats.objectCount + ' objects'),
  badge(stats.classCount + ' classes'),
  badge(stats.datatypeCount + ' datatypes'),
  badge(stats.propertyValueCount + ' property values'),
  stats.propertyErrorCount ? badge(stats.propertyErrorCount + ' property errors', true) : '',
  SNAPSHOT.unresolvedDatatypes.length ? badge(SNAPSHOT.unresolvedDatatypes.length + ' unresolved types', true) : ''
].join('');

function badge(text, warn) {
  return '<span class="badge' + (warn ? ' warn' : '') + '">' + escapeHtml(text) + '</span>';
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function elementId(id) {
  return id.level + 'p' + id.index;
}

function methodId(id) {
  return id.level + 'm' + id.index;
}

function eventId(id) {
  return id.level + 'e' + id.index;
}

function isBlockClass(classId) {
  return Array.isArray(classId) && classId.length >= 2 && classId[0] === 1 && classId[1] === 1;
}

function getAuthorityKey(classId) {
  if (!Array.isArray(classId)) return null;
  const authority = classId.find(part => part <= 0);
  return authority === undefined ? null : authority;
}

function isVendorSpecificClass(classId) {
  return getAuthorityKey(classId) !== null;
}

function vendorBadge(classId) {
  if (!isVendorSpecificClass(classId)) return '';
  const authority = getAuthorityKey(classId);
  return '<span class="badge vendor" title="Authority key: ' + escapeHtml(String(authority)) + '">isVendorSpecific</span>';
}

function typeButton(name) {
  if (!name) return '<span class="empty">any</span>';
  return '<button type="button" class="type-link" data-type="' + escapeHtml(name) + '">' + escapeHtml(name) + '</button>';
}

function typeFlags(options) {
  const flags = [];
  if (options && options.isSequence) {
    flags.push('<span class="badge flag">sequence</span>');
  }
  if (options && options.isNullable) {
    flags.push('<span class="badge flag">nullable</span>');
  }
  return flags.length ? '<span class="type-flags">' + flags.join('') + '</span>' : '';
}

function typeRef(name, options) {
  return '<span class="type-ref">' + typeButton(name) + typeFlags(options) + '</span>';
}

function classButton(classIdKey, name) {
  return '<button type="button" class="class-link" data-class="' + escapeHtml(classIdKey) + '">' +
    escapeHtml(name || classIdKey) + ' [' + escapeHtml(classIdKey) + ']</button>';
}

function formatValue(value) {
  if (value === undefined) return '<span class="empty">missing</span>';
  if (value === null) return '<span class="empty">null</span>';
  return '<div class="value">' + escapeHtml(JSON.stringify(value, null, 2)) + '</div>';
}

function matchesFilter(obj, query) {
  if (!query) return true;
  const hay = [obj.role, String(obj.oid), obj.classIdKey, obj.userLabel || '', (classes[obj.classIdKey] || {}).name || '']
    .join(' ').toLowerCase();
  return hay.includes(query);
}

function buildTree(oid, query) {
  const obj = objects[String(oid)];
  if (!obj) return '';
  const childHtml = (obj.children || []).map(childOid => buildTree(childOid, query)).join('');
  const selfMatch = matchesFilter(obj, query);
  if (query && !selfMatch && !childHtml) return '';
  const className = (classes[obj.classIdKey] || {}).name || obj.classIdKey;
  const childCount = (obj.children || []).length;
  const hasChildren = childCount > 0;
  const open = hasChildren && (query || oid === SNAPSHOT.rootOid) ? ' open' : '';
  const leafClass = hasChildren ? '' : ' leaf';
  const showCount = hasChildren && isBlockClass(obj.classId);
  const vendorChip = isVendorSpecificClass(obj.classId)
    ? '<span class="chip chip-vendor" title="Authority key: ' + escapeHtml(String(getAuthorityKey(obj.classId))) + '">isVendorSpecific</span>'
    : '';
  return '<div class="node' + leafClass + '" data-oid="' + obj.oid + '">' +
    '<details' + open + '>' +
    '<summary>' +
    '<span class="twisty" aria-hidden="true"></span>' +
    '<span class="label">' +
    '<span class="chip chip-role" title="Role">' + escapeHtml(obj.role) + '</span>' +
    '<span class="chip chip-class" title="Class">' + escapeHtml(className) + '</span>' +
    vendorChip +
    (showCount
      ? '<span class="chip chip-count" title="Child members"><strong>' + childCount + '</strong> child' + (childCount === 1 ? '' : 'ren') + '</span>'
      : '') +
    '</span></summary>' +
    (hasChildren ? '<div class="children">' + childHtml + '</div>' : '') +
    '</details></div>';
}

function renderObject(oid) {
  const obj = objects[String(oid)];
  const cls = classes[obj.classIdKey];
  const main = document.getElementById('main');
  if (!cls) {
    main.innerHTML = '<div class="panel"><h2>' + escapeHtml(obj.role) + '</h2>' +
      '<p class="empty">No class descriptor available for ' + escapeHtml(obj.classIdKey) + '.</p></div>';
    return;
  }

  const props = cls.properties.map(p => {
    const key = elementId(p.id);
    const valueHtml = Object.prototype.hasOwnProperty.call(obj.propertyErrors, key)
      ? '<div class="badge warn">' + escapeHtml(obj.propertyErrors[key]) + '</div>'
      : formatValue(obj.propertyValues[key]);
    return '<tr><td><code>' + escapeHtml(key) + '</code><br>' + escapeHtml(p.name) + '</td>' +
      '<td>' + typeRef(p.typeName, { isSequence: p.isSequence, isNullable: p.isNullable }) +
      (p.isReadOnly ? '<div style="margin-top:6px"><span class="badge">readonly</span></div>' : '') + '</td>' +
      '<td>' + valueHtml + '</td></tr>';
  }).join('');

  const methods = cls.methods.map(m => {
    const params = (m.parameters || []).map(param =>
      '<div>' + escapeHtml(param.name) + ': ' + typeRef(param.typeName, { isSequence: param.isSequence, isNullable: param.isNullable }) + '</div>'
    ).join('') || '<span class="empty">none</span>';
    return '<tr><td><code>' + escapeHtml(methodId(m.id)) + '</code><br>' + escapeHtml(m.name) + '</td>' +
      '<td>' + params + '</td><td>' + typeRef(m.resultDatatype) + '</td></tr>';
  }).join('');

  const events = cls.events.map(e =>
    '<tr><td><code>' + escapeHtml(eventId(e.id)) + '</code><br>' + escapeHtml(e.name) + '</td>' +
    '<td>' + typeRef(e.eventDatatype) + '</td></tr>'
  ).join('');

  main.innerHTML =
    '<div class="panel">' +
    '<h2>' + escapeHtml(obj.role) + '</h2>' +
    '<div class="subtitle">' + escapeHtml(cls.name) + ' · oid ' + obj.oid +
      (isVendorSpecificClass(obj.classId) ? ' · ' + vendorBadge(obj.classId) : '') +
    '</div>' +
    '<dl class="kv">' +
    '<dt>OID</dt><dd>' + obj.oid + '</dd>' +
    '<dt>Class</dt><dd>' + classButton(obj.classIdKey, cls.name) +
      (isVendorSpecificClass(obj.classId)
        ? ' ' + vendorBadge(obj.classId) +
          ' <span class="badge flag">authority ' + escapeHtml(String(getAuthorityKey(obj.classId))) + '</span>'
        : '') +
    '</dd>' +
    '<dt>User label</dt><dd>' + escapeHtml(obj.userLabel == null ? 'null' : String(obj.userLabel)) + '</dd>' +
    '<dt>Owner</dt><dd>' + (obj.owner == null ? 'null' : obj.owner) + '</dd>' +
    '<dt>Constant OID</dt><dd>' + String(obj.constantOid) + '</dd>' +
    '<dt>Children</dt><dd>' + (
      obj.children.length
        ? obj.children.map(childOid => {
            const child = objects[String(childOid)];
            return escapeHtml(child ? child.role : ('oid ' + childOid));
          }).join(', ')
        : 'none'
    ) + '</dd>' +
    '</dl>' +
    '<h3>Properties (' + cls.properties.length + ')</h3>' +
    (props
      ? '<div class="table-wrap"><table><thead><tr><th>Property</th><th>Type</th><th>Value at capture</th></tr></thead><tbody>' + props + '</tbody></table></div>'
      : '<p class="empty">No properties</p>') +
    '<h3>Methods (' + cls.methods.length + ')</h3>' +
    (methods
      ? '<div class="table-wrap"><table><thead><tr><th>Method</th><th>Arguments</th><th>Result</th></tr></thead><tbody>' + methods + '</tbody></table></div>'
      : '<p class="empty">No methods</p>') +
    '<h3>Events (' + cls.events.length + ')</h3>' +
    (events
      ? '<div class="table-wrap"><table><thead><tr><th>Event</th><th>Datatype</th></tr></thead><tbody>' + events + '</tbody></table></div>'
      : '<p class="empty">No events</p>') +
    '</div>';
}

function datatypeTypeName(type) {
  return ({0:'Primitive',1:'Typedef',2:'Struct',3:'Enum'})[type] || String(type);
}

function showDatatype(name) {
  const dt = datatypes[name];
  const body = document.getElementById('drawer-body');
  document.getElementById('drawer-title').textContent = name;
  if (!dt) {
    body.innerHTML = '<p class="empty">Datatype descriptor was not resolved for ' + escapeHtml(name) + '.</p>';
  } else {
    let extra = '';
    if (dt.type === 3 && dt.items) {
      extra = '<h3>Enum items</h3><div class="table-wrap"><table><thead><tr><th>Name</th><th>Value</th><th>Description</th></tr></thead><tbody>' +
        dt.items.map(item => '<tr><td>' + escapeHtml(item.name) + '</td><td>' + item.value + '</td><td>' +
          escapeHtml(item.description || '') + '</td></tr>').join('') + '</tbody></table></div>';
    } else if (dt.type === 2 && dt.fields) {
      extra = '<h3>Fields</h3><div class="table-wrap"><table><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody>' +
        dt.fields.map(field => '<tr><td>' + escapeHtml(field.name) + '</td><td>' + typeRef(field.typeName, { isSequence: field.isSequence, isNullable: field.isNullable }) + '</td><td>' +
          escapeHtml(field.description || '') + '</td></tr>').join('') + '</tbody></table></div>';
    } else if (dt.type === 1) {
      extra = '<p>Typedef of ' + typeRef(dt.parentType, { isSequence: dt.isSequence }) + '</p>';
    }
    body.innerHTML =
      '<dl class="kv">' +
      '<dt>Name</dt><dd>' + escapeHtml(dt.name) + '</dd>' +
      '<dt>Type</dt><dd>' + dt.type + ' (' + datatypeTypeName(dt.type) + ')</dd>' +
      '<dt>Description</dt><dd>' + escapeHtml(dt.description || '') + '</dd>' +
      (dt.parentType ? '<dt>Parent</dt><dd>' + typeButton(dt.parentType) + '</dd>' : '') +
      '</dl>' + extra;
  }
  document.getElementById('drawer').classList.add('open');
}

function showClass(classIdKey) {
  const cls = classes[classIdKey];
  const body = document.getElementById('drawer-body');
  document.getElementById('drawer-title').textContent = classIdKey;
  if (!cls) {
    body.innerHTML = '<p class="empty">Class descriptor missing.</p>';
  } else {
    body.innerHTML =
      '<dl class="kv">' +
      '<dt>Name</dt><dd>' + escapeHtml(cls.name) + '</dd>' +
      '<dt>Class ID</dt><dd>' + escapeHtml(cls.classId.join('.')) + '</dd>' +
      '<dt>Vendor specific</dt><dd>' + (
        isVendorSpecificClass(cls.classId)
          ? vendorBadge(cls.classId) + ' <span class="badge flag">authority ' + escapeHtml(String(getAuthorityKey(cls.classId))) + '</span>'
          : 'false'
      ) + '</dd>' +
      '<dt>Fixed role</dt><dd>' + escapeHtml(cls.fixedRole == null ? 'null' : cls.fixedRole) + '</dd>' +
      '<dt>Description</dt><dd>' + escapeHtml(cls.description || '') + '</dd>' +
      '<dt>Properties</dt><dd>' + cls.properties.length + '</dd>' +
      '<dt>Methods</dt><dd>' + cls.methods.length + '</dd>' +
      '<dt>Events</dt><dd>' + cls.events.length + '</dd>' +
      '</dl>';
  }
  document.getElementById('drawer').classList.add('open');
}

function setActive(oid) {
  document.querySelectorAll('.tree .node.active').forEach(n => n.classList.remove('active'));
  const node = document.querySelector('.tree .node[data-oid="' + oid + '"]');
  if (node) node.classList.add('active');
}

function renderTree(query) {
  document.getElementById('tree').innerHTML = buildTree(SNAPSHOT.rootOid, (query || '').trim().toLowerCase());
}

document.getElementById('tree').addEventListener('click', (event) => {
  const summary = event.target.closest('summary');
  if (!summary) return;
  const node = summary.closest('.node');
  if (!node) return;
  const oid = Number(node.getAttribute('data-oid'));
  setActive(oid);
  renderObject(oid);
});

document.getElementById('main').addEventListener('click', (event) => {
  const typeBtn = event.target.closest('[data-type]');
  if (typeBtn) {
    showDatatype(typeBtn.getAttribute('data-type'));
    return;
  }
  const classBtn = event.target.closest('[data-class]');
  if (classBtn) {
    showClass(classBtn.getAttribute('data-class'));
  }
});

document.getElementById('drawer').addEventListener('click', (event) => {
  if (event.target.id === 'drawer' || event.target.id === 'drawer-close') {
    document.getElementById('drawer').classList.remove('open');
    return;
  }
  const typeBtn = event.target.closest('[data-type]');
  if (typeBtn) showDatatype(typeBtn.getAttribute('data-type'));
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    document.getElementById('drawer').classList.remove('open');
  }
});

document.getElementById('filter').addEventListener('input', (event) => {
  renderTree(event.target.value);
});

renderTree('');
renderObject(SNAPSHOT.rootOid);
setActive(SNAPSHOT.rootOid);
</script>
</body>
</html>`;
}
