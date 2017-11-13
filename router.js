const AbstractRouter = require('ticelli-bot/router');
const { WebClient: SlackClient } = require('@slack/client');
const merge = require('lodash.merge');

module.exports = class SlackRouter extends AbstractRouter {
  constructor(config, ...params) {
    super(
      merge(
        {
          expose_contexts: true,
        },
        config,
      ),
      ...params
    );
    this.slackClient = new SlackClient(this.config.access_token);
    this.trapChallenge();
  }
  async run(req, res) {
    const { chat } = this.slackClient;
    if (req.body.event) {
      const { channel } = req.body.event;
      this.slackClient.postBackMessage = chat.postMessage.bind(chat, channel);
    }
    Object.defineProperty(res, 'slack', { get: () => this.slackClient });
    if (this.config.expose_contexts) {
      Object.defineProperty(req, 'memoryContexts', { get: () => this.buildContexts(req.body)});
    }
    await super.run(req, res);
    if (!res.body) { res.body = '' }
  }

  buildContexts({api_app_id, team_id, event: { channel, user } = {}} = {}) {
    const contexts = {};
    const contextPath = ['root', 'slack'];

    if (api_app_id) {
      contexts['SLACK_APP'] = `slackApp_${api_app_id}`;
      contextPath.push(contexts['SLACK_APP']);
    }

    if (team_id) {
      contexts['SLACK_TEAM'] = `slackTeam_${team_id}`;
      contextPath.push(contexts['SLACK_TEAM']);
    }

    if (channel) {
      contexts['SLACK_CHANNEL'] = `slackChannel_${channel}`;
      contextPath.push(contexts['SLACK_CHANNEL']);
    }

    if (user) {
      contexts['SLACK_USER'] = `slackUser_${user}`;
      contextPath.push(contexts['SLACK_USER']);
    }

    contexts.path = contextPath;
    return contexts;
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