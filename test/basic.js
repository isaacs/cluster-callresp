var cluster = require("cluster")
, callresp = require("../callresp.js")

if (cluster.isMaster) {
  // master
  var tap = require("tap")

  tap.test('basic test', function (t) {
    callresp(function (req, cb) {
      if (!req.foo) return
      t.deepEqual(req, { foo: req.foo, from: 1, id: req.foo })
      setTimeout(function () {
        switch (req.foo) {
          case 1: return cb(null, { foo: 2 })
          case 2: return cb(null, { foo: 3 })
          case 3: return cb(null, { foo: 4 })
          default: return cb(new Error('too much foo'))
        }
      }, 10)
    })

    callresp(function (req, cb) {
      if (!req.bar) return
      console.error(req)
      t.deepEqual(req, { bar: req.bar, from: 2, id: req.bar })
      setTimeout(function () {
        switch (req.bar) {
          case 1: return cb(null, { bar: 2 })
          case 2: return cb(null, { bar: 3 })
          case 3: return cb(null, { bar: 4 })
          default: return cb(new Error('too much bar'))
        }
      }, 10)
    })

    callresp(function (req, cb) {
      if (!req.done) return
      t.deepEqual(req, { done: true, id: 5, from: req.from })
      cluster.workers[req.from].destroy()
      if (--count === 0) t.end()
    })

    var count = 2
    cluster.fork()
    cluster.fork()
  })

} else {
  // worker
  var id = cluster.worker.uniqueID
  , k = id % 2 ? 'foo' : 'bar'
  , req = {}
  req[k] = 1

  callresp(req, function cb (er, resp) {
    if (er) {
      console.error('%s got error', k, er)
      return callresp({ done: true })
    }

    console.error('%s got resp', k, resp)
    callresp(resp, cb)
  })
}
