import fs from "node:fs";

const debugPort = Number(process.argv[2] || 9223);
const targetUrl = process.argv[3] || "http://127.0.0.1:4174/site-v2-preview/takeaway-food-boxes.html";
const screenshotPath = process.argv[4] || "D:/mxpack-github-sync/site-v2-preview/mobile-preview.png";
const pages = await fetch("http://127.0.0.1:" + debugPort + "/json/list").then((response) => response.json());
const page = pages.find((entry) => entry.type === "page");

if (!page) {
  throw new Error("No browser page is available");
}

const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

let id = 0;
const pending = new Map();
socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const handler = pending.get(message.id);
    pending.delete(message.id);
    handler(message);
  }
});

function send(method, params = {}) {
  id += 1;
  const currentId = id;
  socket.send(JSON.stringify({ id: currentId, method, params }));
  return new Promise((resolve, reject) => {
    pending.set(currentId, (message) => {
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result);
    });
  });
}

await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", {
  width: 390,
  height: 844,
  deviceScaleFactor: 1,
  mobile: true,
  screenWidth: 390,
  screenHeight: 844
});
await send("Page.navigate", { url: targetUrl });
await new Promise((resolve) => setTimeout(resolve, 1500));

const metrics = await send("Runtime.evaluate", {
  expression: "({innerWidth, clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth, bodyWidth: document.body.scrollWidth})",
  returnByValue: true
});
const capture = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
fs.writeFileSync(screenshotPath, Buffer.from(capture.data, "base64"));
console.log(JSON.stringify(metrics.result.value));
socket.close();
