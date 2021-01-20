const path = require('path')
const express = require('express')
const xss = require('xss')
const { requireAuth } = require('../middleware/jwt-auth')
const TemplatesService = require('./templates-service')

const judgeRouter = express.Router()
const jsonParser = express.json()
const logger = require('../logger')

const serializeDoc = doc => ({
  id: doc.id,
  name: xss(doc.name),
  text: xss(doc.text),
  creator_id: doc.creator_id,
  editor_id: doc.editor_id,
  judge_id: doc.judge_id,
  substitution_id: doc.substitution_id,
  current_category: doc.current_category
})

judgeRouter
  .route('/')
  .post(requireAuth, jsonParser, (req, res, next) => {
    const { doc_id, approved } = req.body
    if (doc_id == null)
      return res.status(400).json({
        error: { message: `Missing doc_id in request body` }
      })
    const updateDoc = (approved) ? 
    {
      current_category: 'approved', 
      judge_id: req.user.id
    } : 
    {
      current_category: 'original', 
      editor_id: null,
      judge_id: null,
      substitution_id: null
    };

    TemplatesService.updateDoc(
      req.app.get('db'),
      doc_id,
      updateDoc
    )
    .then((doc) => {
      res
        .status(201)
        .location(path.posix.join(req.originalUrl, `/${doc.id}`))
        .json(serializeDoc(doc))
    })
    .catch(next);
  });

module.exports = judgeRouter