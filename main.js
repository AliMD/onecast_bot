import {read, write} from './files';

var

config = {
  saveinterval: 3000 // ms
},

data = {
  users: [],
  onecasts: []
},

init = () => {
  console.log('Init');
  loadData();
  registerCommands();
  botStart();
},

loadData = () => {
  console.log('loadData');
  data.users = read('users');
  data.onecasts = read('onecasts');
},

botStart = () => {
  console.log('botStart');
},

registerCommands = () => {
  console.log('registerCommands');
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