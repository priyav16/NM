// script.js (frontend)
const SOCKET_URL = 'http://localhost:5000'; // change when deploying
let socket = null;
let myName = null;

const joinModal = document.getElementById('joinModal');
const joinForm = document.getElementById('joinForm');
const nameInput = document.getElementById('nameInput');
const myNameElem = document.getElementById('myName');
const leaveBtn = document.getElementById('leaveBtn');

const usersList = document.getElementById('users');
const messagesBox = document.getElementById('messages');
const msgForm = document.getElementById('msgForm');
const msgInput = document.getElementById('msgInput');

// helpers
function addMessage(msg, mine=false){
  const div = document.createElement('div');
  div.className = 'message' + (mine ? ' mine' : '');
  div.innerHTML = `<div class="meta"><strong>${escapeHtml(msg.username)}</strong><span style="margin-left:8px">${new Date(msg.ts).toLocaleTimeString()}</span></div>
                   <div class="text">${escapeHtml(msg.text)}</div>`;
  messagesBox.appendChild(div);
  messagesBox.scrollTop = messagesBox.scrollHeight;
}
function addSystem(text){
  const div = document.createElement('div');
  div.className = 'message';
  div.innerHTML = `<div class="meta"><em>System</em><span style="margin-left:8px">${new Date().toLocaleTimeString()}</span></div>
                   <div class="text"><em>${escapeHtml(text)}</em></div>`;
  messagesBox.appendChild(div);
  messagesBox.scrollTop = messagesBox.scrollHeight;
}
function renderUsers(list){
  usersList.innerHTML = '';
  list.forEach(u=>{
    const li = document.createElement('li');
    li.textContent = u;
    usersList.appendChild(li);
  });
}
function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c]));
}

// join form
joinForm.addEventListener('submit', (e)=>{
  e.preventDefault();
  const name = nameInput.value.trim();
  if(!name) return;
  myName = name;
  myNameElem.textContent = myName;
  joinModal.style.display = 'none';
  connectSocket();
});

// Leave
leaveBtn.addEventListener('click', ()=>{
  if(socket) socket.disconnect();
  socket = null;
  myName = null;
  myNameElem.textContent = 'Not joined';
  messagesBox.innerHTML = '';
  usersList.innerHTML = '';
  joinModal.style.display = 'flex';
});

// message send
msgForm.addEventListener('submit', (e)=>{
  e.preventDefault();
  const text = msgInput.value.trim();
  if(!text || !socket) return;
  // emit message
  socket.emit('message', text);
  msgInput.value = '';
});

// socket connection
function connectSocket(){
  socket = io(SOCKET_URL, { transports: ['websocket'] });

  socket.on('connect', ()=> {
    socket.emit('join', myName);
  });

  socket.on('history', (history) => {
    messagesBox.innerHTML = '';
    history.forEach(m => addMessage(m, m.username === myName));
  });

  socket.on('message', (msg) => {
    addMessage(msg, msg.username === myName);
  });

  socket.on('users', (list) => {
    renderUsers(list);
  });

  socket.on('system', (text) => {
    addSystem(text);
  });

  socket.on('disconnect', () => {
    addSystem('Disconnected from server');
  });

  socket.on('connect_error', (err) => {
    addSystem('Connection error: ' + (err.message || 'unknown'));
  });
}

// show modal initially
joinModal.style.display = 'flex';
