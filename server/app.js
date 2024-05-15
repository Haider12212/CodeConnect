import { Server } from "socket.io";
import express from "express";
import http from "http";

const app = express();
const server = http.createServer(app);
const io = new Server(server);

function generateUniqueCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }
const sameCode = new Set();
let code = generateUniqueCode();

while (!sameCode.has(code)) {
  code = generateUniqueCode();
  sameCode.add(code);
  console.log(code);
}
