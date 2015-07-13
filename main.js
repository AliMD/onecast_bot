/**
 * OneCast Bot
 */

import telegramBot from 'telegram-bot-api';
import {l10n} from './i18n';
import {read, write} from './files';

var

config = {
  token: process.env.ONECAST_BOT_TOKEN,
  saveInterval: 3000, // ms
  updateInterval: 1000 //ms
},

data = {
  users: null,
  posts: null
},

bot = new telegramBot({
  token: config.token,
  updates: {
    enabled: true,
    get_interval: config.updateInterval
  }
}),

init = () => {
  console.log('Init');
  botEvents();
  loadData();
  getBotInfo();
},

botEvents = () => {
  bot.on('message', onMessage);
},

loadData = () => {
  console.log('loadData');
  data.users = read('users', {});
  data.posts = read('posts', []);
},

getBotInfo = () => {
  console.log('getBotInfo');
  console.log(`token: ${config.token}`);
  bot.getMe((err, data) => {
    if(data && data.username) {
      console.log(data);
      config.bot = data;
    } else {
      console.log('error!');
      console.log(err);
    }
  });
},

REGEXPS = {
  subscribe: /start|subscribe|عضویت/i,
  unsubscribe: /stop|unsubscribe|خروخ|/i
},

onMessage = (msg) => {
  console.log(`${msg.from.username}: ${msg.text}`);
  /* msg sample
  {
    message_id: 1,
    from: {
      id: 58389411,
      first_name: 'Ali',
      last_name: 'Mihandoost',
      username: 'Al1MD'
    },
    chat: {
      id: 58389411,
      first_name: 'Ali',
      last_name: 'Mihandoost',
      username: 'Al1MD'
    },
    date: 1436704651,
    text: 'F'
  }
  */

  //Subscribe
  if(REGEXPS.subscribe.test(msg.text))
  {
    subscribe(msg.chat);
    if(msg.chat.id !== msg.from.id)
    {
      subscribe(msg.from);
    }
  }

},

subscribe = (user) => {
  console.log('subscribe');
  console.log(user);

  let usr = {}
  if (user.username) // type is user
  {
    usr.first_name = user.first_name;
    usr.last_name = user.last_name;
    usr.username = user.username;
  }
  else
  {
    usr.title = user.title
  }

  data.users[user.id] = usr;
  saveContents();

  sendMessage(user.id, l10n('subscribed'));
},

unsubscribe = (user) => {
  console.log('unsubscribe');
  console.log(user);
},

lastTimeout = 0,
saveContents = (force) => {
  if(force) {
    console.log('saveContents');
    write('users', data.users);
  } else {
    clearInterval(lastTimeout);
    lastTimeout = setTimeout(saveContents, config.saveInterval, true);
  }
},

sendMessage = (id, text) => {
  let username = data.users[id] ? 
                  data.users[id].username ? `@${data.users[id].username}` : `${data.users[id].title}`
                  : `#${id}`;
  console.log(`sendMessage (${username}): ${text}`);
  bot.sendMessage({
    chat_id: id,
    text: text
  }, (err, data) => {
    console.log('Error!');
    console.log(err);
    console.log(data);
  });
}

;

init();