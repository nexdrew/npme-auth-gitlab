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
    return got.post(this.url + '/api/v3/session', {
      json: true,
      body: {
        login: username,
        email: email,
        password: password
      },
      rejectUnauthorized: this.rejectUnauthorized()
    }).then((res) => {
      return res && res.body
    })
  }

  projectTeamMember (token, org, repo, userId) {
    return got(this.url + '/api/v3/projects/' + org + '/' + repo + '/members/' + userId, {
      json: true,
      headers: {
        'PRIVATE-TOKEN': token
      },
      rejectUnauthorized: this.rejectUnauthorized()
    }).then((res) => {
      return res && res.body
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
