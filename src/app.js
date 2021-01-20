require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const helmet = require('helmet')
const { NODE_ENV } = require('./config')
const errorHandler = require('./error-handler')
const authRouter = require('./auth/auth-router')
const docsRouter = require('./docs/docs-router')
const templatesRouter = require('./templates/templates-router')
const judgeRouter = require('./templates/judge-router')
const app = express()

app.use(morgan((NODE_ENV === 'production') ? 'tiny' : 'common', {
  skip: () => NODE_ENV === 'test'
}))
app.use(cors())
app.use(helmet())
app.use('/api/auth', authRouter)
app.use('/api/docs', docsRouter)
app.use('/api/templates', templatesRouter)
app.use('/api/judge', judgeRouter)

app.get('/', (req, res) => {
  res.send('Hello, world!')
})

app.use(errorHandler)

module.exports = app