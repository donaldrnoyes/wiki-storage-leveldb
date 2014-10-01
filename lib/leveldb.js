var path = require('path')

  , level = require('level')
  , es = require('event-stream')

  , fsPage = require('wiki-server/lib/page')
  , synopsis = require('wiki-client/lib/synopsis')

module.exports = function (opts) {
  var db = level(path.join(opts.data, 'leveldb'), {encoding: 'json'}, function (err, db) {
    if (err) throw err
  })
    , classicPageGet = fsPage(opts).get
    

  function put (file, page, cb) {
    db.put(file, page, cb)
  }

  function get (file, cb) {
    db.get(file, function (e, page) {
      if (e) {
        if (e.name !== 'NotFoundError') return cb(e)
        return classicPageGet(file, cb)
      }
      cb(null, page)
    })
  }

  function pages (cb) {
    db.createReadStream()
      .pipe(es.map(formsitemap))
      .pipe(es.writeArray(cb))

    function formsitemap (data, cb) {
      var page = data.value
        , date = ''
      if (page.journal && (page.journal.length > 0)) date = page.journal.pop().date
      cb(null,
        { slug: data.key
        , title: page.title
        , date: date
        , synopsis: synopsis(page)
        }
      )
    }
  }

  return { put: put, get: get, pages:pages }
}