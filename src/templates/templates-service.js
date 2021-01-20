// Replace t with actual table name.
const TemplatesService = {
    getAllTemplates(knex, user_id) {
      return knex
        .from('substitutions')
        .select('*')
        .where('user_id', user_id)
    },
  
    insertTemplate(knex, newData) {
      return knex
        .insert(newData)
        .into('substitutions')
        .returning('*')
        .then(rows => {
          return rows[0]
        })
    },
    updateDoc(knex, doc_id, newData) {
      return knex ('docs')
        .where('id', doc_id)
        .update(newData)
        .returning('*')
        .then(rows => {
          return rows[0]
        })
    },

    getById(knex, id) {
      return knex
        .from('substitutions')
        .select('*')
        .where('id', id)
        .first()
    },
  
    deleteTemplate(knex, id) {
      return knex('substitutions')
        .where({ id })
        .delete()
    },
  }
  
  module.exports = TemplatesService