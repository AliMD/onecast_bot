import {read, write} from './files';

var

config = {
  saveinterval: 3000 // ms
},

init = () => {
  console.log('Init');
  registerCommands();
  botStart();
  subscribe({user_id: Math.random()})
},

botStart = () => {
  
},

registerCommands = () => {
  
},

users = read('users'),

subscribe = (user) => {
  console.log('subscribe');
  console.log(user);
  users.push(user);
  saveContents();
},

unsubscribe = (user) => {
  
},

lastTimeout = 0,
saveContents = (force) => {
  if(force) {
    write('users', users);
  } else {
    clearInterval(lastTimeout);
    lastTimeout = setTimeout(saveContents, config.saveinterval, true);
  }
}

;

init();