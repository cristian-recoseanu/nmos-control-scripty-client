# nmos-control-scripty-client
An example NMOS Client implementing [IS-12](https://specs.amwa.tv/is-12/).

## Get started

Install dependencies
```bash
npm install
```

Update initial variables with your target device so it can find the IS-12 control endpoint
```typescript
var deviceIs04Address = "127.0.0.1";
var deviceIs04Port = 3000;
var is04DeviceId = "67c25159-ce25-4000-a66c-f31fff890265";
var is04Version = "v1.3";
```

Build
```
npm run build
```

Run
```
npm start
```
