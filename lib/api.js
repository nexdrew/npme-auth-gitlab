'use strict'

const fs = require('fs')
const got = require('got')
const errorForCode = require('./error').forCode

class GitLab {
  constructor (opts) {
    opts = opts || {}
    this.url = opts.url || process.env.GITLAB_URL
    this.strictSSL = opts.strictSSL || process.env.GITLAB_STRICT_SSL
    if (!this.url) {
      // lookup url from file system
      let json = fs.readFileSync(opts.gitlabConfig || '/etc/npme/data/gitlab.json', 'utf8')
      try {
        json = JSON.parse(json)
        this.url = json.url
        if (typeof this.strictSSL === 'undefined') this.strictSSL = json.strictSSL
      } catch (_) {}
    }
    if (!this.url) throw errorForCode(500, 'No GitLab url defined')
  }

  rejectUnauthorized () {
    return Boolean(this.strictSSL)
  }

  login (username, password, email) {
    const body = {
      login: username,
      password: password
    }
    if (email) body.email = email
    return got.post(this.url + '/api/v3/session', {
      json: true,
      body: body,
      rejectUnauthorized: this.rejectUnauthorized()
    }).then((res) => {
      return res && res.body && res.body.private_token
    })
  }

  projectInfo (token, org, repo) {
    return got(this.url + '/api/v3/projects?search=' + repo, {
      json: true,
      headers: {
        'PRIVATE-TOKEN': token
      },
      rejectUnauthorized: this.rejectUnauthorized()
    }).then((res) => {
      let array = [].concat(res && res.body)
      if (!array.length) return null
      for (let i = 0, len = array.length, p; i < len; i++) {
        p = array[i]
        if (p && p.name === repo && p.namespace && p.namespace.name === org) return p
      }
      return null
    })
  }

  // access levels based on:
  // http://doc.gitlab.com/ce/api/groups.html#group-members
  // http://doc.gitlab.com/ce/permissions/permissions.html
  readAccessLevel () {
    return 10 // GUEST
  }

  writeAccessLevel () {
    return 30 // DEVELOPER
  }
}

module.exports = GitLab
