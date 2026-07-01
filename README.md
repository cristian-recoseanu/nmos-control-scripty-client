# nmos-control-scripty-client

[![Build Checks](https://github.com/cristian-recoseanu/nmos-control-scripty-client/actions/workflows/build_checks.yml/badge.svg)](https://github.com/cristian-recoseanu/nmos-control-scripty-client/actions/workflows/build_checks.yml)

This is an example NMOS client implementing [IS-12](https://specs.amwa.tv/is-12/).  
It serves as an implementation sample for Controller vendors, showcasing how to interact with device models expressed by [MS-05-02]() through the [IS-12](https://specs.amwa.tv/is-12/) protocol.

## Get started

Install dependencies
```bash
npm install
```

Configure the target device using command line arguments or environment variables. Command line arguments take precedence over environment variables. If neither is set, built-in defaults are used.

```bash
# Command line
npm start -- --address 127.0.0.1 --port 8080 --device-id c1fe9ed2-7602-43c3-a94d-eadd5338b9cd --version v1.3

# Environment variables
export NMOS_IS04_ADDRESS=127.0.0.1
export NMOS_IS04_PORT=8080
export NMOS_IS04_DEVICE_ID=c1fe9ed2-7602-43c3-a94d-eadd5338b9cd
export NMOS_IS04_VERSION=v1.3
npm start
```

| Option | Short | Environment variable | Default |
| --- | --- | --- | --- |
| `--address` | `-a` | `NMOS_IS04_ADDRESS` | `127.0.0.1` |
| `--port` | `-p` | `NMOS_IS04_PORT` | `8080` |
| `--device-id` | `-d` | `NMOS_IS04_DEVICE_ID` | `c1fe9ed2-7602-43c3-a94d-eadd5338b9cd` |
| `--version` | `-v` | `NMOS_IS04_VERSION` | `v1.3` |

Build
```
npm run build
```

Run
```
npm start
```

## Features

The following features have been implemented:

* Finding the IS-12 control endpoint (`urn:x-nmos:control:ncp/v1.0`) inside an [IS-04 device](https://specs.amwa.tv/is-12/releases/v1.0.1/docs/IS-04_interactions.html) resource
* Establishing a WebSocket connection to the IS-12 control endpoint for bidirectional communication
* Sending Command messages and receiving Command Response messages by pairing their handles ([IS-12 messages](https://specs.amwa.tv/is-12/releases/v1.0.1/docs/Protocol_messaging.html))
* Sending Subscription messages and consuming Notification messages devices send whenever object properties change ([IS-12 schemas](https://specs.amwa.tv/is-12/releases/v1.0.1/APIs/schemas/))
* Invoking the generic Get method of any object to retrieve the value of any property ([NcObject](https://specs.amwa.tv/ms-05-02/branches/v1.0.x/docs/NcObject.html#generic-getter-and-setter))
* Invoking the generic Set method of any object to set the value of any property ([NcObject](https://specs.amwa.tv/ms-05-02/branches/v1.0.x/docs/Framework.html#ncobject))
* Finding all members implementing a specific classId by using the FindMembersByClassId method in blocks ([NcBlock](https://specs.amwa.tv/ms-05-02/branches/v1.0.x/docs/Blocks.html#search-methods))
* Discovering all objects of a device model by using the GetMemberDescriptors method ([NcBLock](https://specs.amwa.tv/ms-05-02/branches/v1.0.x/docs/Framework.html#ncblock))
* Finding all receiver monitor objects inside a device model ([BCP-008-01](https://specs.amwa.tv/bcp-008-01/releases/v1.0.0/docs/Overview.html) and [NcReceiverMonitor](https://specs.amwa.tv/nmos-control-feature-sets/branches/main/monitoring/#ncreceivermonitor))
* Finding all sender monitor objects inside a device model ([BCP-008-02](https://specs.amwa.tv/bcp-008-02/releases/v1.0.0/docs/Overview.html) and [NcSenderMonitor](https://specs.amwa.tv/nmos-control-feature-sets/branches/main/monitoring/#ncsendermonitor))
* Finding a particular object by its role path to retrieve its oid (using FindMembersByPath in [NcBlock](https://specs.amwa.tv/ms-05-02/branches/v1.0.x/docs/Framework.html#ncblock))
* Retrieving the descriptor of any class so it can be consumed generically (using GetControlClass in [NcClassManager](https://specs.amwa.tv/ms-05-02/branches/v1.0.x/docs/Framework.html#ncclassmanager))
* Retrieving the descriptor of any datatype so it can be consumed generically (using GetDatatype in [NcClassManager](https://specs.amwa.tv/ms-05-02/branches/v1.0.x/docs/Framework.html#ncclassmanager))

## Other useful resources

Here are other resources available around NMOS Control & Monitoring:

* A Rust IS-12 example device implementation  
https://github.com/cristian-recoseanu/nmos-control-rusty-device

* A Python IS-12 example device implementation  
https://github.com/cristian-recoseanu/nmos-control-rusty-device

* A comprehensive Implementers guide (INFO-006)  
https://specs.amwa.tv/info-006/

* The nmos-device-control-mock showcasing a fully compliant and tested implementation of IS-12 and BCP-008 in TypeScript/NodeJS  
https://github.com/AMWA-TV/nmos-device-control-mock

* nmos-cpp open source library with a fully compliant and tested implementation of IS-12 and BCP-008 in C++  
https://github.com/sony/nmos-cpp

* nmos-testing framework  
https://specs.amwa.tv/nmos-testing/
