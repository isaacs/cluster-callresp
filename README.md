# cluster-callresp

An easy way to set up "call and response" type messages using node's
builtin "cluster" module.

```javascript
// master.js
var callresp = require("cluster-callresp")

callresp(function (call, cb) {
  // depending on the content of call,
  // do some magic, and then later:

  cb(er, response)
})

// calling callresp just adds another listener
callresp(function (call, cb) {
  if (call.request == "myThing") {
    goGetMyThing(call, cb)
  }
  // otherwise just do nothing, must have been
  // for someone else.
})
```

Then in the worker:

```javascript
// worker.js

var callresp = require("cluster-callresp")

// make a call, and then eventually get a response.
// Callback is optional, if you just want to send a message,
// but don't care about the response.
// Set a 'timeout' property to fail if there's no response in
// a specific number of ms.  By default, waits forever.
callresp({ request: "myThing", details: "go get it!" }, function (er, resp) {
  if (er) return handleError(er)
  var results = resp.data
})
```
