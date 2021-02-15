// Replace t with actual table name.
const VotingService = {
  vote(knex, newData) {
    return knex
      .insert(newData)
      .into("votes")
      .returning("*")
      .then(rows => {
        return rows[0];
      });
  },
  getVote(knex, user_id, poll_id) {
    return knex
      .from("votes")
      .join("polloptions", "polloptions.id", "votes.polloption_id")
      .select("polloptions.id")
      .where({
        user_id: user_id,
        poll_id: poll_id
      });
  }
};

module.exports = VotingService;
