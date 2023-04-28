// const http = require('http');
// const port = 8008;
// const server = http.createServer();
// server.listen(port, (error) => {
//     if (error) return console.log(`Error: ${error}`);
 
//     console.log(`Server is listening on port ${port}`)
// })
const io = require("socket.io-client");
const socket = io.connect("http://localhost:8080");
// console.log('check 1', socket.connected);
// socket.on('connect', function() {
//   console.log('check 2', socket.connected);
// });
// socket.on("welcome", (data) => {
//     console.log(data)
// })
socket.on("connect", () => {
    console.log(socket.id); // ojIckSD2jqNzOqIrAGzL
  });
socket.on("change-type", (data) => {
    console.log(data)
    console.log("END")
})