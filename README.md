# nmos-control-scripty-client

This is an example NMOS client implementing [IS-12](https://specs.amwa.tv/is-12/).  
It serves as an implementation sample for Controller vendors, showcasing how to interact with device models expressed by [MS-05-02]() through the [IS-12](https://specs.amwa.tv/is-12/) protocol.

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

## Working features

The following features are working:

* Finding the IS-12 control endpoint (`urn:x-nmos:control:ncp/v1.0`) inside an [IS-04 device](https://specs.amwa.tv/is-12/releases/v1.0.1/docs/IS-04_interactions.html) resource
* Establishing a WebSocket connection to the IS-12 control endpoint for bidirectional communication
* Sending Command messages and receiving Command Response messages by pairing their handles ([IS-12 messages](https://specs.amwa.tv/is-12/releases/v1.0.1/docs/Protocol_messaging.html))
* Sending Subscription messages and consuming Notification messages devices send whenever object properties change ([IS-12 schemas](https://specs.amwa.tv/is-12/releases/v1.0.1/APIs/schemas/))
* Invoking the generic Get method of any object to retrieve the value of any property ([NcObject](https://specs.amwa.tv/ms-05-02/branches/v1.0.x/docs/NcObject.html#generic-getter-and-setter))
* Invoking the generic Set method of any object to set the value of any property ([NcObject](https://specs.amwa.tv/ms-05-02/branches/v1.0.x/docs/Framework.html#ncobject))
* Finding all members implementing a specific classId by using the FindMembersByClassId method in blocks ([NcBlock](https://specs.amwa.tv/ms-05-02/branches/v1.0.x/docs/Blocks.html#search-methods))
* Discovering all objects of a device model by using the GetMemberDescriptors method ([NcBLock](https://specs.amwa.tv/ms-05-02/branches/v1.0.x/docs/Framework.html#ncblock))
* Finding all receiver monitor objects inside a device model ([BCP-008-01](https://specs.amwa.tv/bcp-008-01/releases/v1.0.0/docs/Overview.html) and [NcReceiverMonitor](https://specs.amwa.tv/nmos-control-feature-sets/branches/main/monitoring/#ncreceivermonitor))

## To do

The following features are planned:

* Showing how to find a particular object by its role path so we can retrieve its oid (using FindMembersByPath in [NcBlock](https://specs.amwa.tv/ms-05-02/branches/v1.0.x/docs/Framework.html#ncblock))
* Showing how to find all sender monitor objects in a device model (using FindMembersByClassId in [NcBlock](https://specs.amwa.tv/ms-05-02/branches/v1.0.x/docs/Framework.html#ncblock) to find [NcSenderMonitor](https://specs.amwa.tv/nmos-control-feature-sets/branches/main/monitoring/#ncsendermonitor) members)
* Showing how to retrieve the descriptor of any class so we can consume it generically (using GetControlClass in [NcClassManager](https://specs.amwa.tv/ms-05-02/branches/v1.0.x/docs/Framework.html#ncclassmanager))
* Showing how to retrieve the descriptor of any datatype so we can consume it generically (using GetDatatype in [NcClassManager](https://specs.amwa.tv/ms-05-02/branches/v1.0.x/docs/Framework.html#ncclassmanager))
