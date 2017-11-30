const AbstractRouter = require('ticelli-bot');
const { WebClient: SlackClient } = require('@slack/client');
const SlackBuilder = require('./builder');


module.exports = class SlackRouter extends AbstractRouter {
  constructor(config) {
    super({ expose_context: true }, config);
    this.slack = new SlackClient(this.config.access_token);
  }

  async run(train) {
    const { chat, reactions } = this.slack;
    const { event = {} } = train.request.body;
    const answers = [];
    train.state.answers = answers;
    train
      .hang({
        locale: 'fr', // @todo: hardcoded
        slack: {
          validationToken: this.config.verification_token,
          reply: (messageId, ...params) => {
            answers.push('reply');
            const message = train.answerPicker ? train.answerPicker.pick(train.locale, messageId, train) : messageId;
            chat.postMessage(event.channel, message, ...params);
          },
          react: (emoji) => {
            answers.push('react');
            reactions.add(emoji, { channel: event.channel, timestamp: event.ts });
          },
        },
      });

    if (this.config.expose_context) {
      train.hang({
        memoryContext: this.buildContext(train.request.body),
      });
    }
    return super.run(train);
  }

  buildContext({ api_app_id, team_id, event: { channel } = {} } = {}) {
    const context = {};
    const contextPath = [];

    if (api_app_id) {
      context.SLACK_APP = `slackApp_${api_app_id}`;
      contextPath.push(context.SLACK_APP);
    }

    if (team_id) {
      context.SLACK_TEAM = `slackTeam_${team_id}`;
      contextPath.push(context.SLACK_TEAM);
    }

    if (channel) {
      context.SLACK_CHANNEL = `slackChannel_${channel}`;
      contextPath.push(context.SLACK_CHANNEL);
    }

    context.path = contextPath;
    return context;
  }

  get when() {
    const builder = new SlackBuilder(this);
    this.push(builder);
    return builder;
  }
};
