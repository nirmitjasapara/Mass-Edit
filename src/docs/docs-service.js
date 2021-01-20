// Replace t with actual table name.
const DocsService = {
    getDocs(knex, c) {
      return knex
        .select('docs.*', 'substitutions.substitution_string')
        .from('docs')
        .leftJoin('substitutions', 'substitutions.id', 'docs.substitution_id')
        .where('current_category', c)
    },
  
    insertDoc(knex, newData) {
      return knex
        .insert(newData)
        .into('docs')
        .returning('*')
        .then(rows => {
          return rows[0]
        })
    },

    getById(knex, id) {
      return knex
        .from('docs')
        .select('*')
        .where('id', id)
        .first()
    },
  
    deleteDoc(knex, id) {
      return knex('docs')
        .where({ id })
        .delete()
    },
  }
  
  module.exports = DocsService