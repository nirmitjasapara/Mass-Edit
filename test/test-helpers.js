const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

function makeUsersArray() {
  return [
    {
      id: 1,
      user_name: "test-user-1",
      full_name: "Test user 1",
      password: "password",
      date_created: new Date("2029-01-22T16:28:32.615Z")
    },
    {
      id: 2,
      user_name: "test-user-2",
      full_name: "Test user 2",
      password: "password",
      date_created: new Date("2029-01-22T16:28:32.615Z")
    },
    {
      id: 3,
      user_name: "test-user-3",
      full_name: "Test user 3",
      password: "password",
      date_created: new Date("2029-01-22T16:28:32.615Z")
    },
    {
      id: 4,
      user_name: "test-user-4",
      full_name: "Test user 4",
      password: "password",
      date_created: new Date("2029-01-22T16:28:32.615Z")
    }
  ];
}

function makeSubstitutionsArray(users) {
  return [
    {
      id: 1,
      name: "First test post!",
      user_id: users[0].id,
      substitution_string: '[{"from":"a","to":"b"}]'
    },
    {
      id: 2,
      name: "Second test post!",
      user_id: users[1].id,
      substitution_string: '[{"from":"a","to":"b"}]'
    },
    {
      id: 3,
      name: "Third test post!",
      user_id: users[2].id,
      substitution_string: '[{"from":"a","to":"b"}]'
    },
    {
      id: 4,
      name: "Fourth test post!",
      user_id: users[3].id,
      substitution_string: '[{"from":"a","to":"b"}]'
    }
  ];
}

function makeDocsArray(users, substitutions) {
  return [
    {
      id: 1,
      name: "Doc 1",
      text:
        "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Natus consequuntur deserunt commodi, nobis qui inventore corrupti iusto aliquid debitis unde non.Adipisci, pariatur.Molestiae, libero esse hic adipisci autem neque ?",
      current_category: "original",
      substitution_id: null,
      creator_id: users[0].id,
      editor_id: null,
      judge_id: null
    },
    {
      id: 2,
      name: "Doc 2",
      text:
        "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Natus consequuntur deserunt commodi, nobis qui inventore corrupti iusto aliquid debitis unde non.Adipisci, pariatur.Molestiae, libero esse hic adipisci autem neque ?",
      current_category: "edited",
      substitution_id: substitutions[1].id,
      creator_id: users[0].id,
      editor_id: users[1].id,
      judge_id: null
    },
    {
      id: 3,
      name: "Doc 3",
      text:
        "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Natus consequuntur deserunt commodi, nobis qui inventore corrupti iusto aliquid debitis unde non.Adipisci, pariatur.Molestiae, libero esse hic adipisci autem neque ?",
      current_category: "approved",
      substitution_id: substitutions[2].id,
      creator_id: users[1].id,
      editor_id: users[2].id,
      judge_id: users[3].id
    }
  ];
}

function makeSubstitutionsFixtures() {
  const testUsers = makeUsersArray();
  const testSubstitutions = makeSubstitutionsArray(testUsers);
  const testDocs = makeDocsArray(testUsers, testSubstitutions);
  return { testUsers, testSubstitutions, testDocs };
}

function cleanTables(db) {
  return db.transaction(trx =>
    trx
      .raw(
        `TRUNCATE
        docs,
        substitutions,
        users
      `
      )
      .then(() =>
        Promise.all([
          trx.raw(
            `ALTER SEQUENCE substitutions_id_seq minvalue 0 START WITH 1`
          ),
          trx.raw(`ALTER SEQUENCE users_id_seq minvalue 0 START WITH 1`),
          trx.raw(`ALTER SEQUENCE docs_id_seq minvalue 0 START WITH 1`),
          trx.raw(`SELECT setval('substitutions_id_seq', 0)`),
          trx.raw(`SELECT setval('users_id_seq', 0)`),
          trx.raw(`SELECT setval('docs_id_seq', 0)`)
        ])
      )
  );
}

function seedUsers(db, users) {
  const preppedUsers = users.map(user => ({
    ...user,
    password: bcrypt.hashSync(user.password, 1)
  }));
  return db
    .into("users")
    .insert(preppedUsers)
    .then(() =>
      // update the auto sequence to stay in sync
      db.raw(`SELECT setval('users_id_seq', ?)`, [users[users.length - 1].id])
    );
}

function seedSubstitutionsTables(db, users, substitutions, docs = []) {
  // use a transaction to group the queries and auto rollback on any failure
  return db.transaction(async trx => {
    await seedUsers(trx, users);
    await trx.into("substitutions").insert(substitutions);
    // update the auto sequence to match the forced id values
    await trx.raw(`SELECT setval('substitutions_id_seq', ?)`, [
      substitutions[substitutions.length - 1].id
    ]);
    // only insert docs if there are some, also update the sequence counter
    if (docs.length) {
      await trx.into("docs").insert(docs);
      await trx.raw(`SELECT setval('docs_id_seq', ?)`, [
        docs[docs.length - 1].id
      ]);
    }
  });
}

function makeAuthHeader(user, secret = process.env.JWT_SECRET) {
  const token = jwt.sign({ user_id: user.id }, secret, {
    subject: user.user_name,
    algorithm: "HS256"
  });
  return `Bearer ${token}`;
}

function makeExpectedDocs(docs, substitutions) {
  const expecteddocs = docs.map(doc => {
    const substitution = substitutions.find(s => s.id === doc.substitution_id);
    if (!substitution) return doc;
    doc.text = JSON.parse(substitution.substitution_string).reduce((t, s) => {
      return t.split(s.from).join(s.to);
    }, doc.text);
    return doc;
  });

  return {
    original: expecteddocs.filter(doc => doc.current_category == "original"),
    edited: expecteddocs.filter(doc => doc.current_category == "edited"),
    approved: expecteddocs.filter(doc => doc.current_category == "approved")
  };
}

module.exports = {
  makeUsersArray,
  makeSubstitutionsArray,
  makeDocsArray,

  makeSubstitutionsFixtures,
  cleanTables,
  seedSubstitutionsTables,
  makeAuthHeader,
  seedUsers,

  makeExpectedDocs
};
