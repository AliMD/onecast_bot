/**
 * OneCast Bot
 */

import telegramBot from 'telegram-bot-api';
import {l10n} from './i18n';
import {read, write} from './files';

var

config = {
  token: process.env.BOT_TOKEN,
  saveInterval: 5000, // ms
  updateInterval: 3000, //ms
  waitForPosts: 1000, //ms
  admins: [58389411]
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
  unsubscribe: /stop|unsubscribe|خروخ/i,
  hello: /hi|hello|welcome|سلام|درورد|خوش.*مدی/i,
  help: /help|راهنما/i
},

zmba_iv = 0,

requestMessage = {},

onMessage = (msg) => {
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

  console.log(`**** ${msg.from.username}: ${msg.text}`);

  let
  msgDate = new Date(msg.date*1000),
  fromAdmin = isAdmin(msg.chat.id)
  ;
  console.log(msgDate.toLocaleString());

  //remove bot username
  if(msg.text)
  {
    msg.text = msg.text.replace(`@${config.bot.username} `, '');
  }

  // Special messages
  if(typeof requestMessage[msg.chat.id] === 'function')
  {
    requestMessage[msg.chat.id](msg);
    return;
  }
  if(typeof requestMessage[msg.from.id] === 'function')
  {
    requestMessage[msg.from.id](msg);
    return;
  }

  //Debug and test
  if (msg.text === 'dalli')
  {
    zmba_iv = setInterval(() => {
      sendMessage(msg.chat.id, 'Dalli !');
    }, 2500);
    return;
  }
  if (zmba_iv && msg.text === 'stop')
  {
    clearInterval(zmba_iv);
    zmba_iv = 0;
  }

  // help
  if (REGEXPS.help.test(msg.text))
  {
    sendPost(msg.chat.id, 0); // post 0 always is help
    return;
  }


  //Hello
  if (REGEXPS.hello.test(msg.text))
  {
    sendMessage(msg.chat.id, l10n('hello').replace('%name%', msg.from.first_name));
    return;
  }


  //User Subscribe
  if (REGEXPS.subscribe.test(msg.text))
  {
    subscribe(msg.from); // TODO: fix bug on user sent start in group
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


  //User Unsubscribe
  if (REGEXPS.unsubscribe.test(msg.text))
  {
    unsubscribe(msg.chat, msg.from, !!msg.chat.title); // silent in group temporary
    return;
    // if (msg.chat.id !== msg.from.id && !checkSubscribed(msg.chat.id))
    // {
    //   subscribe(msg.chat);
    // }
  }

  //Left Join
  if(msg.left_chat_participant && msg.left_chat_participant.id === config.bot.id)
  {
    console.log(`chatLeft: ${msg.chat.title}`);
    unsubscribe(msg.chat, msg.from, true);
    //TODO: save from
    return;
  }

  // New post
  if(fromAdmin && msg.text === "/newpost")
  {
    recordNewPost(msg.chat.id);
    return;
  }

  // Send post
  let postId = parseInt(fixNumbers((msg.text || '').trim()), 10);
  if(postId > -1)
  {
    sendPost(msg.chat.id, postId);
    return;
  }

  // Send Post to All
  if(fromAdmin && (msg.text || '').trim().indexOf('/broadcast') === 0)
  {
    let postId = parseInt(msg.text.replace('/broadcast', '').trim(), 10);
    if(!postId)
    {
      broadcastMessage(msg.chat.id);
    }
    else
    {
      sendPost2All(postId);
    }
    return;
  }

  // upload audio
  if(fromAdmin && (msg.text || '').trim().indexOf('/uploadaudio ') === 0)
  {
    uploadAudio(msg.chat.id, msg.text.replace('/uploadaudio ', '').trim());
  }

  //Notify other messages to admin
  // msg.data = msgDate.toLocaleString();
  if(!fromAdmin){
    notifyAdmins(msg);
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
  notifyAdmins(`New user subscribe: ${JSON.stringify({user: user, from: from}, null, 2)}`);
},

unsubscribe = (user, from, silent = false) => {
  console.log('unsubscribe!!!');
  console.log(user);

  if(!checkSubscribed(user.id))
  {
    if(!silent) sendMessage(user.id, l10n('not_subscribed').replace('%name%', user.first_name));
    return;
  }
  data.users[user.id].unsubscribed = true;
  if(!silent) sendMessage(user.id, l10n('unsubscribed').replace('%name%', user.first_name));
  saveContents();
  //TODO: send some quite message
  notifyAdmins(`user unsubscribe: ${JSON.stringify({user: user, from: from}, null, 2)}`);
},

lastTimeout = 0,
saveContents = (force) => {
  console.log(`saveContents: ${force?'force':'request'}`);
  if (force)
  {
    console.log('saveContents');
    write('users', data.users);
    write('posts', data.posts);
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
  return !!data.users[id] && !data.users[id].unsubscribed;
},

sentUnfinishedMessage = () => {
  // TODO: sent unfinished message from a waiting list
},

notifyAdmins = (msg) => {
  console.log(`notifyAdmins: ${msg}`);
  config.admins.forEach((admin)=>{
    if(typeof msg === 'object' && msg.message_id)
    {
      bot.forwardMessage({
        chat_id: admin,
        from_chat_id: msg.from.id,
        message_id: msg.message_id
      });
      let obj = {id:msg.message_id, from: msg.from};
      if(msg.from.id !== msg.chat.id) obj.chat = msg.chat;
      sendMessage(admin, JSON.stringify(obj, null, 2));
      return true;
    }

    sendMessage(admin, msg);
  });
},

isAdmin = (id) => {
  return config.admins.indexOf(parseInt(id, 10)) > -1;
},

recordNewPost = (userId) => {
  console.log(`recordNewPost: ${userId}`);
  if(requestMessage[userId])
  {
    sendMessage(userId, 'Please /cancel last action.');
    return;
  }

  let postId = -1, msgs = [];
  sendMessage(userId, 'Recording...\nYou can /cancel or /end the process any time.\n\nPlease enter post id.');
  requestMessage[userId] = (msg) => {
    if(msg.text === '/cancel')
    {
      delete requestMessage[userId];
      sendMessage(userId, `Ok, recording cancel!\n${msgs.length} has been lost.`);
      return;
    }

    if(postId < 0)
    {
      let id = parseInt(fixNumbers(msg.text), 10);
      if(id > -1)
      {
        postId = id;
        sendMessage(userId, `Ok, please enter your messages in any type ;)`);
      }
      else
      {
        sendMessage(userId, `Please enter a positive number.`);
      }
      return;
    }

    if(msg.text === '/end')
    {
      delete requestMessage[userId];
      data.posts[postId] = {
        from: userId,
        messages: msgs,
        sent_count: 0
      };
      saveContents();
      sendMessage(userId, `Ok, recording end\n${msgs.length} messages recorded for post_id:${postId}`);
      return;
    }

    msgs.push(msg.message_id);
  }
},

persianNumbers = [/۰/g, /۱/g, /۲/g, /۳/g, /۴/g, /۵/g, /۶/g, /۷/g, /۸/g, /۹/g],
arabicNumbers  = [/٠/g, /١/g, /٢/g, /٣/g, /٤/g, /٥/g, /٦/g, /٧/g, /٨/g, /٩/g],
fixNumbers = (str) => {
  // console.log(`fixNumbers: ${str}`);
  if(typeof str === 'string')
  {
    for(let i=0; i<10; i++)
    {
      str = str.replace(persianNumbers[i], i).replace(arabicNumbers[i], i);
    }
  }
  return str;
},

sendPost = (userId, postId) => {
  console.log(`sendPost: ${postId} to ${userId}`);
  let post = data.posts[postId];

  if(!post)
  {
    sendMessage(userId, l10n('post404').replace('%max_post_id%', data.posts.length-1))
    return;
  }

  for(let i=0, msglen = post.messages.length; i < msglen; i++)
  {
    setTimeout((i) => {
      bot.forwardMessage({
        chat_id: userId,
        from_chat_id: post.from,
        message_id: post.messages[i]
      });
    }, i*config.waitForPosts, i);
  }

  post.sent_count++;
  saveContents();
},

sendPost2All = (postId) => {
  console.log(`sendPost2All: ${postId}`);
  notifyAdmins(`sendPost2All: ${postId}`);

  if(!postId || !data.posts[postId])
  {
    notifyAdmins(`sendPost2All: post id not found`);
    return;
  }

  let users = Object.keys(data.users);
  users.forEach( (userId, i) => {
    setTimeout(() => {
      sendPost(userId, postId);
    }, i*config.waitForPosts*2);
  });

  setTimeout(() => {
    notifyAdmins(`Post ${postId} sent`);
  }, (users.length+5)*config.waitForPosts*2);
},

broadcastMessage = (userId) => {
  console.log(`broadcastMessage: ${userId}`);
  if(requestMessage[userId])
  {
    sendMessage(userId, 'Please /cancel last action.');
    return;
  }

  let end = false, msgs = [];
  sendMessage(userId, 'Recording...\nYou can /cancel or /end the process any time.');
  requestMessage[userId] = (msg) => {
    if(msg.text === '/cancel')
    {
      delete requestMessage[userId];
      sendMessage(userId, `Ok, recording cancel!\n${msgs.length} has been lost.`);
      return;
    }

    if(msg.text === '/end')
    {
      sendMessage(userId, `Ok, recording end\n${msgs.length} messages recorded\n\nNext ?\n/cancel\n/preview\n/send2all`);
      end = true;
      return;
    }

    if(end && msg.text === '/preview')
    {
      for(let i=0, msglen = msgs.length; i < msglen; i++)
      {
        setTimeout((i) => {
          bot.forwardMessage({
            chat_id: userId,
            from_chat_id: userId,
            message_id: msgs[i]
          });
        }, i*config.waitForPosts, i);
      }
      setTimeout(() => {
        sendMessage(userId, `Next ?\n/cancel\n/preview\n/send2all`);
      }, msgs.length*config.waitForPosts);
      return;
    }

    if(end && msg.text === '/send2all')
    {
      delete requestMessage[userId];
      
      let users = Object.keys(data.users);
      users.forEach( (uid, i) => {
        setTimeout(() => {
          for(let i=0, msglen = msgs.length; i < msglen; i++)
          {
            setTimeout((i) => {
              bot.forwardMessage({
                chat_id: uid,
                from_chat_id: userId,
                message_id: msgs[i]
              });
            }, i*config.waitForPosts, i);
          }
        }, i*config.waitForPosts*2);
      });

      setTimeout(() => {
        notifyAdmins(`messages sent`);
      }, (users.length+msgs.length)*config.waitForPosts);

      return;
    }

    if(!end)
    {
      msgs.push(msg.message_id);
    }
  }
},

uploadAudio = (userId, path) => {
  console.log(`uploadAudio for user ${userId}: ${path}`);
  bot.sendChatAction({
    chat_id: userId,
    action: 'upload_audio'
  });
  bot.sendAudio({
    chat_id: userId,
    audio: path.trim()
  }, (err, data) => {
    let debug = JSON.stringify({err: err, data: data}, null, 2);
    console.log(`audioSent\n${debug}`);
    sendMessage(userId, debug);
  });
}

;

init();