const AbstractRouter = require('ticelli-bot/router');
const { WebClient: SlackClient } = require('@slack/client');

module.exports = class SlackRouter extends AbstractRouter {
  constructor(...params) {
    super(...params);
    this.slackClient = new SlackClient(this.config.access_token);
    this.trapChallenge();
  }
  async run(req, res) {
    const { channel } = req.body.event;
    const { chat } = this.slackClient;

    this.slackClient.postBackMessage = chat.postMessage.bind(chat, channel);

    Object.defineProperty(res, 'slack', { get: () => this.slackClient });
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
  onMessageIntent(name, ...params) {
    return this.on(
      ({ intent }) => !!(intent[name]),
      ...params
    );
  }
};