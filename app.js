const WebSocket = require('ws');
const http = require('http')
const https = require('https')
const fs = require('fs')
const express = require('express')
const app = express()
const port = 8080


https
  .createServer(
    {
      key: fs.readFileSync(__dirname + "/cert/domain.key"),
      cert: fs.readFileSync(__dirname + "/cert/domain.crt"),
      passphrase: 'shakti'
    },app)
  .listen(4000, ()=>{
    console.log('server is runing at port 4000')
  });

  app.use(express.static(__dirname + "/public/"))

  app.get('/', (req,res)=>{
    console.log(__dirname)
    res.send("Hello from express server new.")
})





app.get('/rtc', (req, res) => {
  res.sendFile(__dirname + "/public/index.html")
  console.log(__dirname)
})
app.get('/rtctwo', (req, res) => {
  res.sendFile(__dirname + "/public/indextwo.html")
})

//app.listen(port, () => {
//  console.log(`server is running on ${port}`)
//})

//// Socket server for agent and admin pannel

const server = https.createServer({
  key: fs.readFileSync(__dirname + "/cert/domain.key"),
  cert: fs.readFileSync(__dirname + "/cert/domain.crt"),
  passphrase: 'shakti'
});

const wss = new WebSocket.WebSocketServer({ server });
server.listen(7071)

let clietCount = 0;
let client = [];

wss.on('connection', function connection(ws, request) {
  ws.id = clietCount++;
  client.push(ws)
  console.log(`new connection, ws.id=${ws.id}, ${ws._socket.remoteAddress}:${ws._socket.remotePort} #clients=${wss.clients.size}`);
  client.forEach(clnt => console.log(clnt.id))


  ws.on('message', function incoming(message) {
    data = JSON.parse(message)
    //rcvdEvent = data.eventType
    //console.log(data)
    if (data.offer) {
      offer = data.offer
      client.forEach(clnt => {
        if (clnt.id !== ws.id) {
          clnt.send(JSON.stringify({
            offer
          }))
          console.log("offer send to rtctwo")
        } else if (clnt.id == ws.id) {
          console.log("messge from same client")
        }
      })
    } else if (data.answer) {

      answer = data.answer
      client.forEach(clnt => {
        if (clnt.id !== ws.id) {
          clnt.send(JSON.stringify({
            answer
          }))
          console.log("answer send to rtc")
        } else if (clnt.id == ws.id) {
          console.log("messge from same client")
        }
      })

    } else if (data.candidate) {
      candidate = data.candidate
      console.log(`icecandidate recived ${ws.id}`)
      client.forEach(clnt => {
        if (clnt.id !== ws.id) {
          clnt.send(JSON.stringify(
            data.candidate
          ))
          console.log(` newicecandidate send to ${clnt}`)
        } else if (clnt.id == ws.id) {
          console.log("messge from same client")
        }
      })

    }
    //ws.send(JSON.stringify(data))
  });

  ws.send(
    JSON.stringify({
      eventType: "connection",
      data: "Established",
      user: ws.id
    })
  );
});
