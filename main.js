/**
 * OneCast Bot
 */

import telegramBot from 'telegram-bot-api';
import {read, write} from './files';

var

config = {
  token: process.env.ONECAST_BOT_TOKEN,
  saveinterval: 3000 // ms
},

data = {
  users: [],
  onecasts: []
},

bot = new telegramBot({
  token: config.token
}),

init = () => {
  console.log('Init');
  loadData();
  getBotInfo()
},

loadData = () => {
  console.log('loadData');
  data.users = read('users');
  data.onecasts = read('onecasts');
},

getBotInfo = () => {
  console.log('getBotInfo');
  console.log(`token: ${config.token}`);
  bot.getMe((err, data) => {
    if(data.username) {
      console.log(data);
      config.bot = data;
    } else {
      console.log(`error: ${err}`);
    }
  });
},

subscribe = (user) => {
  console.log('subscribe');
  console.log(user);
  users.push(user);
  saveContents();
},

unsubscribe = (user) => {
  console.log('unsubscribe');
  console.log(user);
},

lastTimeout = 0,
saveContents = (force) => {
  if(force) {
    console.log('saveContents');
    write('users', users);
  } else {
    clearInterval(lastTimeout);
    lastTimeout = setTimeout(saveContents, config.saveinterval, true);
  }
}

;

init();