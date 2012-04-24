var cluster = require("cluster")
, events = require("events")
, EE = events.EventEmitter

if (cluster.isWorker) {
  var callbacks = {}

  process.on("message", function (m) {
    if (m.id && callbacks[m.id]) {
      callbacks[m.id](m)
      delete callbacks[m.id]
    }
  })

  var ID = 1
  module.exports = function callresp (m, cb) {
    var id = ID++
    m.id = id
    m.from = cluster.worker.uniqueID
    if (cb) { // cb means "i expect a response"
      if (typeof m.timeout === "number") {
        var timeout = setTimeout(function () {
          delete callbacks[m.id]
          var er = new Error("timeout")
          er.message = m
          cb(er)
        }, m.timeout)
      }
      callbacks[m.id] = function (r) {
        if (timeout) clearTimeout(timeout)
        cb(r.error, r.data)
      }
    }
    process.send(m)
  }

} else {

  // in the master, the export is a method that you can
  // use to listen for messages
  // cr(function (request, cb) { ... cb(er, response) })
  var callresp = new EE()
  module.exports = callresp.on.bind(callresp, "request")

  // assign listener to all current workers
  Object.keys(cluster.workers || {}).forEach(function (id) {
    cluster.workers[id].on("message", onmessage)
  })

  // assign listener to all new workers
  cluster.on("fork", function (worker) {
    worker.on("message", onmessage)
  })

  function onmessage (m) {
    var worker = this
    if (!m || !m.id || !m.from || m.from !== worker.uniqueID) return
    callresp.emit("request", m, function (er, resp) {
      var r = { id: m.id, ok: true }
      if (er) {
        r.ok = false
        r.error = {}
        for (var i in er) r.error[i] = er[i]
      }
      r.to = worker.uniqueID
      r.data = resp
      worker.send(r)
    })
  }

}
