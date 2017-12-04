const AbstractRouter = require('ticelli-bot');
const SlackComponentBuilder = require('./builder/component');
const { WebClient: SlackClient } = require('@slack/client');

module.exports = class SlackComponentRouter extends AbstractRouter {
  async run(train) {
    const payload = JSON.parse(train.request.body.payload);
    train.hang({
      payload,
    });
    const { chat, reactions } = train.slackClient;
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

    return super.run(train);
  }

  get when() {
    const builder = new SlackComponentBuilder(this);
    this.push(builder);
    return builder;
  }

  async setClient(train) {
    let accessToken = this.config.access_token;
    if (this.config.client_id && this.config.client_secret) {
      if (train.memory && await train.memory.get('oauth.bot.bot_access_token')) {
        accessToken = await train.memory.get('oauth.bot.bot_access_token');
      }
    }
    if (!accessToken) {
      throw new Error('No access token found');
    }
    train.hang({ slackClient: new SlackClient(accessToken) });
  }
};
