const AbstractRouter = require('ticelli-bot/router');

module.exports = class SlackRouter extends AbstractRouter {
  constructor(...params) {
    super(...params);
    this.trapChallenge();
  }
  async run(req, res) {
    await super.run(req, res);
    if (!res.body) { res.body = '' }
  }
  trapChallenge() {
    return this.on(
      ({body}) => !!(body && body.challenge && body.type === 'url_verification'),
      ({body}, res) => { res.body = body.challenge; return 'end'; },
    );
  }
  onEvent(...params) {
    return this.on(
      ({body}) => !!(body && body.event && body.type === 'event_callback'),
      ...params
    );
  }
};