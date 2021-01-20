const path = require('path')
const express = require('express')
const xss = require('xss')
const { requireAuth } = require('../middleware/jwt-auth')
const TemplatesService = require('./templates-service')

const templatesRouter = express.Router()
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

const serializeTemplate = template => ({
  id: template.id,
  name: xss(template.name),
  substitution_string: xss(template.substitution_string),
  user_id: template.user_id
})

templatesRouter
  .route('/')
  .get(requireAuth, (req, res, next) => {
    TemplatesService.getAllTemplates(
      req.app.get('db'),
      req.user.id
    )
    .then((templates) => {
      res.json(templates.map(serializeTemplate))
    })
    .catch(next);
  })
  .post(requireAuth, jsonParser, (req, res, next) => {
    logger.error(JSON.stringify(req.body))
    const { doc_id, name, selection, substitutes } = req.body
    if (doc_id == null)
      return res.status(400).json({
        error: { message: `Missing doc_id in request body` }
      })
    if (selection == null && (substitutes == null || name == null))
      return res.status(400).json({
        error: { message: `Missing substitutes in request body` }
      })
    if (!selection) {
      logger.error(JSON.stringify(selection))
      const newTemplate = {name, user_id: req.user.id,
        substitution_string: JSON.stringify(substitutes) }
      TemplatesService.insertTemplate(
        req.app.get('db'),
        newTemplate
      )
      .then((template) => {
        const updateDoc = {
          current_category: 'edited', 
          editor_id: req.user.id,
          substitution_id: template.id
        }

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
      })
      .catch(next);
    }
    else {
      const updateDoc = {
        current_category: 'edited', 
        editor_id: req.user.id,
        substitution_id: selection
      }

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
    }
  });

templatesRouter
  .route('/:_id')
  .all((req, res, next) => {
    TemplatesService.getById(
      req.app.get('db'),
      req.params._id
    )
    .then(template => {
      if (!template) {
        return res.status(404).json({
          error: { message: `Template doesn't exist` }
        })
      }
      res.template = serializeTemplate(template)
      next()
    })
    .catch(next)
  })
  .delete(requireAuth, (req, res, next) => {
    if (res.template.user_id != req.user.id) {
      return res.status(404).json({
        error: { message: `Unauthorized delete` }
      })
    }
    TemplatesService.deleteTemplate(
      req.app.get('db'),
      req.params._id
    )
      .then(numRowsAffected => {
        res.status(204).end()
      })
      .catch(next)
  })

module.exports = templatesRouter