const Builder = require('ticelli-bot/builder');
const ChallengeBuilder = require('./challenge');
const TokenBuilder = require('./token');
const EventBuilder = require('./event/index');

module.exports = class SlackBuilder extends Builder {
  constructor(...params) {
    super(...params);
    this.assert(({ request }) => !!(request && request.body));
  }

  get challenge() {
    const challengeBuilder = new ChallengeBuilder(this);
    this.push(challengeBuilder);
    return challengeBuilder;
  }

  get token() {
    const tokenBuilder = new TokenBuilder(this);
    this.push(tokenBuilder);
    return tokenBuilder;
  }

  get event() {
    const eventBuilder = new EventBuilder(this);
    this.push(eventBuilder);
    return eventBuilder;
  }

  httpAnswer(body) {
    this.push(async (train) => { train.setBody(body).close(); });
    return this;
  }

  get when() {
    const builder = new this.constructor(this.parent);
    this.parent.push(builder);
    return builder;
  }
};
