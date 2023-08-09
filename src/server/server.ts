import { serve } from "https://deno.land/std@0.180.0/http/mod.ts";
import "https://deno.land/std@0.177.0/dotenv/load.ts";
import { responseFileByPath, responseJsonByDir, responseVideoByRequestAndPath } from "./utils.ts";

// http{s}?
const httpPattern = new URLPattern({ protocol: "http{s}?" });
// ws{s}?
const wsPattern = new URLPattern({ protocol: "ws{s}?" });
// http://localhost:8080{/}
const patternRoot = new URLPattern({ pathname: "{/}" });
// http://localhost:8080/:type{?}
const patternType = new URLPattern({ pathname: "/:type", search: "*" });
// http://localhost:8080/:type/:content
const patternTypeContent = new URLPattern({ pathname: "/:type/:content" });

async function handler(req: Request) {
  let resp: Response | undefined;
  const url = req.url;

  // HTTP 200 OK, 206 Partial Content
  if (httpPattern.test(url)) {
    patternRoot.test(url) && (resp = await responseFileByPath("./dist/index.html"));
    if (patternType.test(url)) {
      const result = patternType.exec(url);
      if (result) {
        const pathname = result.pathname;
        const search = result.search;
        const dirPath = Deno.env.get("DIR_PATH");
        switch (pathname.groups.type) {
          // http://localhost:8080/dir{?:path} => dir/dir+:path in json
          case "dir":
            search
              ? (dirPath && (resp = await responseJsonByDir(dirPath, search.input)))
              : (dirPath && (resp = await responseJsonByDir(dirPath)));
            break;
          // http://localhost:8080/video?:path => video stream
          case "video":
            dirPath && (resp = await responseVideoByRequestAndPath(req, dirPath, search.input));
            break;
          // http://localhost:8080/image?:path => image
          case "image":
            resp = await responseFileByPath(dirPath + search.input);
            break;
        }
      }
    }
    if (patternTypeContent.test(url)) {
      const result = patternTypeContent.exec(url);
      if (result) {
        const pathname = result.pathname;
        switch (pathname.groups.type) {
          // http://localhost:8080/js/:path => serve js
          case "js":
            resp = await responseFileByPath("./dist" + pathname.input);
            break;
        }
      }
    }
  }

  if (wsPattern.test(url)) {
    // const { socket: ws, response } = Deno.upgradeWebSocket(req);
    // ws.onopen = () => handleConnected();
    // ws.onmessage = (m) => handleMessage(ws, m.data);
    // ws.onclose = () => logError("Disconnected from client ...");
    // ws.onerror = (e) => handleError(e);
    // return response;
  }

  // 405 Method Not Allowed
  (req.method !== "GET") && (resp = new Response(null, { status: 405 }));

  // 404 Not Found
  resp || (resp = new Response(null, { status: 404 }));

  return resp;
}

const port = Number(Deno.env.get("PORT"));
serve(handler, { port: port ? port : 8080 });
