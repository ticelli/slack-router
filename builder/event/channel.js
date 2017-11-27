const Builder = require('ticelli-bot/builder');
const Break = require('ticelli-bot/break');

module.exports = class ChannelBuilder extends Builder {
  constructor(...params) {
    super(...params);
    this.assert(({ request: { body } }) => !!(body.event.channel));
  }
  get withoutBotMention() {
    const extractUser = /<@([A-Z0-9]+)>/g;
    return this
      .assert(({ request: { body: { event } } }) => event.channel && event.channel.startsWith('C'))
      .assert(({ request: { body: { authed_users, event } } }) => {
        const mentions = new Set();
        let m;
        do {
          m = extractUser.exec(event.text);
          if (m) {
            mentions.add(m[1]);
          }
        } while (m);
        for (const user of authed_users) {
          if (!mentions.has(user)) {
            throw Break.all;
          }
        }
      });
  }
  get trimBotMention() {
    this.push(({ request: { body: { authed_users, event } } }) => {
      if (event && event.text) {
        event.text = event.text.replace(authed_users.map(u => `<@${u}>`), '').trim();
      }
    });
    return this;
  }
};
