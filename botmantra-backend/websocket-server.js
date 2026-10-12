const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 8080 });

wss.on("connection", (ws) => {
  ws.on("message", async (message) => {
    try {
      ws.send(JSON.stringify({ status: "ok", echo: message.toString() }));
    } catch (error) {
      ws.send(JSON.stringify({ status: "error", message: error.message }));
    }
  });
});

console.log("WebSocket server running on ws://localhost:8080");
