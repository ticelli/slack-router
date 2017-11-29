const AbstractRouter = require('ticelli-bot');
const SlackComponentBuilder = require('./builder/component');
const { WebClient: SlackClient } = require('@slack/client');

module.exports = class SlackComponentRouter extends AbstractRouter {
  constructor(config) {
    super({ expose_context: true }, config);
    this.slack = new SlackClient(this.config.access_token);
  }

  async run(train) {
    const payload = JSON.parse(train.request.body.payload);
    train.hang({
      payload,
    });
    const { chat, reactions } = this.slack;
    const { event = {} } = train.request.body;
    train
      .hang({
        locale: 'fr', // @todo: hardcoded
        slack: {
          validationToken: this.config.verification_token,
          reply: (messageId, ...params) => {
            const message = train.answerPicker ? train.answerPicker.pick(train.locale, messageId, train) : messageId;
            chat.postMessage(payload.channel.id, message, ...params);
          },
          react: emoji => reactions.add(emoji, { channel: payload.channel.id, timestamp: event.ts }),
          ephemeral: (messageId, ...options) => {
            const message = train.answerPicker ? train.answerPicker.pick(train.locale, messageId, train) : messageId;
            chat.postEphemeral(payload.channel.id, message, payload.user.id, ...options);
          },
        },
      });

    if (this.config.expose_context) {
      train.hang({
        memoryContext: this.buildContext(payload),
      });
    }
    return super.run(train);
  }

  get when() {
    const builder = new SlackComponentBuilder(this);
    this.push(builder);
    return builder;
  }

  buildContext({ team: { id: team_id }, channel: { id: channel_id } }) {
    const context = {};
    const contextPath = [];

    if (team_id) {
      context.SLACK_TEAM = `slackTeam_${team_id}`;
      contextPath.push(context.SLACK_TEAM);
    }

    if (channel_id) {
      context.SLACK_CHANNEL = `slackChannel_${channel_id}`;
      contextPath.push(context.SLACK_CHANNEL);
    }

    context.path = contextPath;
    return context;
  }
};
