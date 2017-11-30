const Builder = require('ticelli-bot/builder');

module.exports = class ChallengeBuilder extends Builder {
  get isSent() {
    this.assert(({ request: { body } }) => body.challenge && body.type === 'url_verification');
    return this;
  }
  reply() {
    this.push((train) => {
      train.body = train.request.body.challenge;
    });
    return this;
  }
};
