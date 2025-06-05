const editor = document.getElementById('editor');
const socket = new WebSocket(`ws://${window.location.host}`);

let isLocalChange = false;

editor.addEventListener('input', () => {
  isLocalChange = true;
  socket.send(editor.value);
});

socket.addEventListener('message', (event) => {
  if (!isLocalChange) {
    editor.value = event.data;
  }
  isLocalChange = false;
});
