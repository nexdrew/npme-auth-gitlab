'use strict'

const GitLab = require('./api')
const error = require('./error')

class Authenticator {
  constructor (opts) {
    opts = opts || {}
    this.api = opts.api || new GitLab(opts)
  }

  authenticate (credentials, cb) {
    if (!valid(credentials)) return error.defer(cb, 500, 'Invalid credentials')
    let self = this
    let username = credentials.body.name
    let email = credentials.body.email
    self.api.login(username, credentials.body.password, email)
      .then((token) => {
        cb(null, {
          token: token,
          user: {
            name: username,
            email: email
          }
        })
      })
      .catch((err) => {
        cb(err)
      })
  }
}

function valid (credentials) {
  return Boolean(credentials && credentials.body && credentials.body.name && credentials.body.password)
}

module.exports = Authenticator
