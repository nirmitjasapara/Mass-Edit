const path = require("path");
const express = require("express");
const xss = require("xss");
const { requireAuth } = require("../middleware/jwt-auth");
const DocsService = require("./docs-service");

const docsRouter = express.Router();
const jsonParser = express.json();
const logger = require("../logger");

const serializeDoc = doc => ({
  id: doc.id,
  name: xss(doc.name),
  text: xss(doc.text),
  creator_id: doc.creator_id,
  editor_id: doc.editor_id,
  judge_id: doc.judge_id,
  substitution_id: doc.substitution_id,
  current_category: doc.current_category
});

docsRouter
  .route("/")
  .get((req, res, next) => {
    const knexInstance = req.app.get("db");
    let docs = {};
    Promise.all(
      ["original", "edited", "approved"].map(c => {
        return DocsService.getDocs(knexInstance, c)
          .then(cdocs => {
            docs[c] =
              c == "original"
                ? cdocs.map(serializeDoc)
                : cdocs.map(doc => {
                    if (doc.substitution_string !== null)
                      doc.text = JSON.parse(doc.substitution_string).reduce(
                        (t, s) => {
                          return t.split(s.from).join(s.to);
                        },
                        doc.text
                      );
                    return serializeDoc(doc);
                  });
          })
          .catch(next);
      })
    ).then(() => {
      res.json(docs);
    });
  })
  .post(requireAuth, jsonParser, (req, res, next) => {
    const { name, text } = req.body;
    const newDocs = { name, text };

    for (const [key, value] of Object.entries(newDocs))
      if (value == null)
        return res.status(400).json({
          error: { message: `Missing '${key}' in request body` }
        });
    newDocs.creator_id = req.user.id;
    newDocs.current_category = "original";

    DocsService.insertDoc(req.app.get("db"), newDocs)
      .then(doc => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${doc.id}`))
          .json(serializeDoc(doc));
      })
      .catch(next);
  });

docsRouter
  .route("/:_id")
  .all((req, res, next) => {
    DocsService.getById(req.app.get("db"), req.params._id)
      .then(docs => {
        if (!docs) {
          return res.status(404).json({
            error: { message: `Docs doesn't exist` }
          });
        }
        res.docs = serializeDocs(docs);
        next();
      })
      .catch(next);
  })
  .delete(requireAuth, (req, res, next) => {
    if (res.docs.user_id != req.user.id) {
      return res.status(404).json({
        error: { message: `Unauthorized delete` }
      });
    }
    DocsService.deleteDoc(req.app.get("db"), req.params._id)
      .then(numRowsAffected => {
        res.status(204).end();
      })
      .catch(next);
  });

module.exports = docsRouter;
