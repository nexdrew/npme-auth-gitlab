'use strict'

const urlParser = require('url')
const parseGitUrl = require('github-url-from-git')
const GitLab = require('./api')
const Session = require('./session')
const error = require('./error')

class Authorizer {
  constructor (opts) {
    opts = opts || {}
    this.api = opts.api || new GitLab(opts)
    this.session = opts.session || new Session(opts)
  }

  authorize (credentials, cb) {
    let token = extractToken(credentials)
    if (!token) return error.defer(cb, 401)

    let self = this
    let requiredAccessLevel
    switch (credentials.method) {
      case 'GET':
        requiredAccessLevel = self.api.readAccessLevel()
        break
      case 'PUT':
      case 'POST':
      case 'DELETE':
        requiredAccessLevel = self.api.writeAccessLevel()
        break
      default:
        return error.defer(cb, 405, 'Unsupported method: ' + credentials.method)
    }

    let untrustedPackageJson = loadPackageJson(credentials.body)
    let orgRepo = parseRepoUrl(untrustedPackageJson)
    if (typeof orgRepo === 'string') return error.defer(cb, 400, orgRepo)

    // check user access to repo
    self.api.projectInfo(token, orgRepo.org, orgRepo.repo)
      .then((project) => {
        let authorized = project.permissions &&
          ((project.permissions.project_access && project.permissions.project_access.access_level >= requiredAccessLevel) ||
          (project.permissions.group_access && project.permissions.group_access.access_level >= requiredAccessLevel))
        cb(null, authorized)
      })
      .catch((err) => {
        cb(err)
      })
  }

  whoami (credentials, cb) {
    let token = extractToken(credentials)
    if (!token) return error.defer(cb, 401)

    this.session.get('user-' + token, cb)
  }

  end () {
    if (this.session) this.session.end()
  }
}

function extractToken (credentials) {
  let token = null
  if (credentials && credentials.headers && credentials.headers.authorization && credentials.headers.authorization.match(/Bearer /)) {
    token = credentials.headers.authorization.replace('Bearer ', '')
  }
  return token
}

function loadPackageJson (body) {
  return body.versions[body['dist-tags'].latest]
}

function parseRepoUrl (packageJson) {
  let url = packageJson.repository.url
  if (url.match(/^(git:\/\/|git@)/)) url = parseGitUrl(url, { extraBaseUrls: /[^/]+/.source })
  let parsedUrl = urlParser.parse(url)
  let splitOrgRepo = parsedUrl.path.split('.git')[0].match(/^\/(.*)\/(.*)$/)
  if (!splitOrgRepo) return 'Does not appear to be a valid git url: ' + url
  return {
    org: splitOrgRepo[1],
    repo: splitOrgRepo[2]
  }
}

module.exports = Authorizer
