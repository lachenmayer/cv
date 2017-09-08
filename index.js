const {graphiqlExpress, graphqlExpress} = require('apollo-server-express')
const bodyParser = require('body-parser')
const express = require('express')
const fs = require('fs')
const {makeExecutableSchema} = require('graphql-tools')
const yaml = require('js-yaml')
const mapValues = require('lodash.mapvalues')

const typeDefs = `
schema {
  query: CV
}

type CV {
  personalInformation: PersonalInformation
  education: [School]
  professionalProjects: [Job]
  freelanceProjects: [FreelanceProject]
  personalProjects: [PersonalProject]
  teachingMentoring: [String]
  achievementsAwards: [String]
  languages: [String]
  interests: [String]
}

type PersonalInformation {
  name: String
  email: String
  website: String
  twitter: String
  github: String
  keybase: String
  citizenship: String
}

type School {
  establishment: String
  degree: String
  subject: String
  start: String
  end: String
  highlights: [String]
}

type Job {
  company: String
  location: String
  role: String
  start: String
  end: String
  highlights: [String]
  technologies: [String]
}

type FreelanceProject {
  client: String
  project: String
  start: String
  end: String
  highlights: [String]
  technologies: [String]
}

type PersonalProject {
  name: String
  start: String
  end: String
  description: String
  link: String
  technologies: [String]
}
`

const cvYaml = fs.readFileSync('cv.yaml', {encoding: 'utf8'})
const cv = yaml.safeLoad(cvYaml)

// Since we have the entire CV in memory, we can just directly return the value from every resolver.
// We just have to make sure to turn the object keys into GraphQL-compatible names.
const resolvers = {
  CV: mapValues(graphqlify(cv), value => () => value)
}

const schema = makeExecutableSchema({typeDefs, resolvers})

const app = express()
app.use('/graphql', bodyParser.json(), graphqlExpress({schema}))
app.use('/graphiql', graphiqlExpress({endpointURL: '/graphql'}))

const port = process.env.PORT || 3000
app.listen(port, () => {console.log(port)})

// Recursively turn object keys into GraphQL-compatible names.
function graphqlify (anything) {
  if (isArray(anything)) {
    return anything.map(graphqlify)
  } else if (isObject(anything)) {
    let graphqlified = {}
    for (let key in anything) {
      let value = anything[key]
      graphqlified[graphqlifyString(key)] = graphqlify(value)
    }
    return graphqlified
  }
  return anything
}
assert(graphqlify({'Foo Bar (baz)': [{'Buz (baz)': 'it works'}]}).fooBar[0].buz === 'it works')

// The GraphQL query language requires alphanumeric names for fields.
// I want the YAML file to be human readable, so we convert the headers in the YAML file into camelCased names.
// Strips everything in (parentheses).
function graphqlifyString (str) {
  const [first, ...rest] = str
    .replace(/\(.*\)/, '')
    .split(/\W/)
  return [first.toLowerCase(), ...rest.map(capitalize)].join('')
}
assertEqual(graphqlifyString('Personal Projects (selected)'), 'personalProjects')
assertEqual(graphqlifyString('Teaching/Mentoring'), 'teachingMentoring')

function capitalize (str) {
  let lowercase = str.toLowerCase()
  if (lowercase.length < 1) return lowercase
  const first = lowercase[0]
  const rest = lowercase.slice(1)
  return first.toUpperCase() + rest
}
assertEqual(capitalize('foo'), 'Foo')
assertEqual(capitalize('FOO'), 'Foo')
assertEqual(capitalize(''), '')
assertEqual(capitalize('123'), '123')

function isObject (x) {
  return typeof x === 'object' && x !== null
}

function isArray (x) {
  return Array.isArray(x)
}

function isString (x) {
  return typeof x === 'string'
}

function assert (p, message) {
  if (!p) {
    throw new Error(message)
  }
}

function assertEqual(actual, expected) {
  if (actual !== expected) {
    throw new Error(`actual: ${actual} expected: ${expected}`)
  }
}
