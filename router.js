const AbstractRouter = require('ticelli-bot/router');
const { WebClient: SlackClient } = require('@slack/client');
const merge = require('lodash.merge');

module.exports = class SlackRouter extends AbstractRouter {
  constructor(config, ...params) {
    super(
      merge(
        {
          expose_context: true,
        },
        config,
      ),
      ...params
    );
    this.slackClient = new SlackClient(this.config.access_token);
    this
      .trapChallenge()
      .trapBotEvent();
  }
  async run(req, res) {
    const { chat } = this.slackClient;
    if (req.body.event) {
      const { channel } = req.body.event;
      this.slackClient.postBackMessage = chat.postMessage.bind(chat, channel);
    }
    Object.defineProperty(res, 'slack', { get: () => this.slackClient });
    if (this.config.expose_context) {
      Object.defineProperty(req, 'memoryContext', { get: () => this.buildContext(req.body)});
    }
    await super.run(req, res);
    if (!res.body) { res.body = '' }
  }

  buildContext({api_app_id, team_id, event: { channel, user } = {}} = {}) {
    const context = {};
    const contextPath = [];

    if (api_app_id) {
      context['SLACK_APP'] = `slackApp_${api_app_id}`;
      contextPath.push(context['SLACK_APP']);
    }

    if (team_id) {
      context['SLACK_TEAM'] = `slackTeam_${team_id}`;
      contextPath.push(context['SLACK_TEAM']);
    }

    if (channel) {
      context['SLACK_CHANNEL'] = `slackChannel_${channel}`;
      contextPath.push(context['SLACK_CHANNEL']);
    }

    if (user) {
      context['SLACK_USER'] = `slackUser_${user}`;
      contextPath.push(context['SLACK_USER']);
    }

    context.path = contextPath;
    return context;
  }

  trapBotEvent() {
    return this.trap(({body}) => !!(body && body.event && body.event.bot_id));
  }

  trapChallenge() {
    return this.trap(
      ({body}) => !!(body && body.challenge && body.type === 'url_verification'),
      ({body}, res) => res.body = body.challenge,
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