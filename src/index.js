/**
 * OneCast Bot
 */

import telegramBot from 'telegram-bot-api';
import {l10n} from './i18n';
import {read, write} from './files';

var

config = {
  token: process.env.ONECAST_BOT_TOKEN,
  saveInterval: 5000, // ms
  updateInterval: 3000 //ms
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

  data.posts = read('posts', []);
  console.log(`${data.posts.length} posts loaded`);

  data.users = read('users', {});
  console.log(`${Object.keys(data.users).length} users loaded`);
},

getBotInfo = () => {
  console.log('getBotInfo');
  console.log(`token: ${config.token}`);
  bot.getMe((err, data) => {
    if (data && data.username)
    {
      console.log(data);
      config.bot = data;
    }
    else
    {
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
  if(!msg.text) console.log(msg);

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

  //User Subscribe
  if (REGEXPS.subscribe.test(msg.text))
  {
    subscribe(msg.from);
    return;
    // if (msg.chat.id !== msg.from.id && !checkSubscribed(msg.chat.id))
    // {
    //   subscribe(msg.chat);
    // }
  }

  //Chat Join
  if(msg.new_chat_participant && msg.new_chat_participant.id === config.bot.id)
  {
    console.log(`chatJoin: ${msg.chat.title}`);
    subscribe(msg.chat, msg.from);
    if (!checkSubscribed(msg.from.id)) subscribe(msg.from);
    return;
  }

  

},

subscribe = (user, from) => {
  console.log('subscribe');
  console.log(user);

  let usr = {};
  if (user.title) // type is group
  {
    usr.title = user.title;

    sendMessage(user.id, l10n('group_subscribed').replace('%name%', from.first_name));
    if(from && from.id) sendMessage(from.id, l10n('thanks_for_add_to_group').replace('%name%', from.first_name).replace('%title%', user.title));
  }
  else
  {
    if (checkSubscribed(user.id))
    {
      sendMessage(user.id, l10n('already_subscribed'));
      return;
    }

    usr.first_name = user.first_name;
    usr.last_name = user.last_name;
    if (user.username) usr.username = user.username;

    sendMessage(user.id, l10n('user_subscribed').replace('%name%', user.first_name));
  }

  data.users[user.id] = usr;
  saveContents(); 
},

unsubscribe = (user) => {
  console.log('unsubscribe');
  console.log(user);
},

lastTimeout = 0,
saveContents = (force) => {
  if (force)
  {
    console.log('saveContents');
    write('users', data.users);
  }
  else
  {
    clearInterval(lastTimeout);
    lastTimeout = setTimeout(saveContents, config.saveInterval, true);
  }
},

sendMessage = (id, text, fb = ()=>{}) => {
  let username = data.users[id] ? 
                  data.users[id].username ? `@${data.users[id].username}` : `${data.users[id].title}`
                  : `#${id}`;
  console.log(`sendMessage (${username}): ${text}`);
  bot.sendMessage({
    chat_id: id,
    text: text
  }, (err, data) => {
    if (!err) return fb();
    // else
    console.log('Error!');
    console.log(err);
    console.log(data);
    //TODO: add to awaiting list
  });
},

checkSubscribed = (id) => {
  return !!data.users[id];
},

sentUnfinishedMessage = () => {
  // TODO: sent unfinished message from a waiting list
}

;

init();