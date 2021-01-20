const path = require('path')
const express = require('express')
const { requireAuth } = require('../middleware/jwt-auth')
const VotingService = require('./voting-service')

const votingRouter = express.Router()
const jsonParser = express.json()

votingRouter
  .route('/')
  .post(requireAuth, jsonParser, (req, res, next) => {
    const { polloption_id } = req.body
    const newVote = { polloption_id }

    for (const [key, value] of Object.entries(newVote))
      if (value == null)
        return res.status(400).json({
          error: { message: `Missing '${key}' in request body` }
        })
    newVote.user_id = req.user.id

    VotingService.vote(
      req.app.get('db'),
      newVote
    )
    .then(vote => {
      res
        .status(201)
        .location(path.posix.join(req.originalUrl, `/${vote.id}`))
        .json(vote)
    })
    .catch(next)
  })
votingRouter
  .route('/:_id')
  .get(requireAuth, (req, res, next) => {
    VotingService.getVote(
      req.app.get('db'),
      req.user.id,
      req.params._id,
    )
      .then(vote => {
        res.json(vote)
      })
      .catch(next)
  })
module.exports = votingRouter