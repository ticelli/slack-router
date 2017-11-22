const AbstractRouter = require('ticelli-bot/router');
const merge = require('lodash.merge');
const SlackComponentBuilder = require('./builder-component');
const { WebClient: SlackClient } = require('@slack/client');

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
  }

  async run(req, res) {
    const { chat } = this.slackClient;
    Object.defineProperty(res, 'slack', { get: () => this.slackClient });

    const payload = JSON.parse(req.body.payload);
    Object.defineProperty(req, 'payload', { get: () => payload });

    if (payload.channel && payload.user) {
      const channel = payload.channel.id;
      const user = payload.user.id;
      res.postBackEphemeral = function (text, ...opts) {
        return chat.postEphemeral(channel, text, user, ...opts)
      };
    }

    if (payload.channel && payload.message_ts) {
      res.removePreviousMessage = chat.delete.bind(chat, payload.message_ts, payload.channel.id);
    }

    if (payload.channel) {
      res.postBackMessage = chat.postMessage.bind(chat, payload.channel.id)
    }

    if (this.config.expose_context) {
      Object.defineProperty(req, 'memoryContext', { get: () => this.buildContext(payload)});
    }

    await super.run(req, res);
    if (!res.body) { res.body = ''; }
  }

  get when() {
    const builder = new SlackComponentBuilder(this);
    this.onBuild(builder);
    return builder;
  }

  trapBadVerificationToken() {
    return this.trap(({payload}) => payload.token !== this.config.verification_token);
  }

  buildContext({team: { id: team_id }, channel: {id: channel_id}}) {
    const context = {};
    const contextPath = [];

    if (team_id) {
      context['SLACK_TEAM'] = `slackTeam_${team_id}`;
      contextPath.push(context['SLACK_TEAM']);
    }

    if (channel_id) {
      context['SLACK_CHANNEL'] = `slackChannel_${channel_id}`;
      contextPath.push(context['SLACK_CHANNEL']);
    }

    context.path = contextPath;
    return context;
  }
};