import { serve } from "https://deno.land/std@0.175.0/http/mod.ts";

const basePath = "./dist";
const htmlPath = `${basePath}/index.html`;
const videoPath = `${basePath}/assets/vr180.mp4`;

async function handler(req: Request) {
  let resp: Response | undefined;
  const url = new URL(req.url);
  // index.html
  if (req.method === "GET" && url.pathname === "/") {
    const htmlFile = await Deno.readFile(htmlPath);
    if (htmlFile) {
      resp = new Response(
        new TextDecoder().decode(htmlFile),
        {
          status: 200,
          headers: {
            "content-type": "text/html",
          },
        },
      );
    }
  }
  // video stream
  if (req.method === "GET" && url.pathname === "/video") {
    const range = req.headers.get("range");
    const video = await Deno.open(videoPath, { read: true });
    if (range && video) {
      const videoSize = (await video.stat()).size;
      const chunckSize = 10 ** 6; // 100000 byte, about 1MB
      // Parse Range, chrome ex: bytes=0- , safari ex: bytes=0-1
      const startIndex = Number(range.replace(/\D/g, ""));
      const endIndex = Math.min(startIndex + chunckSize, videoSize - 1);
      const contentLength = endIndex - startIndex + 1;
      const cursorPosition = await video.seek(startIndex, Deno.SeekMode.Current);
      resp = new Response(
        new ReadableStream({
          async pull(controller) {
            const chunk = new Uint8Array(chunckSize);
            try {
              const read = await video.read(chunk);
              if (read) {
                controller.enqueue(chunk.subarray(0, read));
                // controller.close();
                // video.close();
                // REMOVE
                console.log(
                  `startIndex=${startIndex}, endIndex=${endIndex}, contentLength=${contentLength}, read=${read}, cursorPosition=${cursorPosition}, chunk=${chunk.length}`,
                );
              }
            } catch (_err) {
              // REMOVE
              console.log("error");
              controller.error(_err);
              video.close();
            }
          },
        }),
        {
          status: 206,
          headers: {
            "Content-Range": `bytes ${startIndex}-${endIndex}/${videoSize}`,
            "Accept-Ranges": "bytes",
            "Content-Length": `${contentLength}`,
            "Content-Type": "video/mp4",
          },
        },
      );
    }
  }
  // js
  if (req.method === "GET" && url.pathname.includes("js")) {
    const filePath = basePath + url.pathname;
    const file = await Deno.open(filePath, { read: true });
    if (file) {
      resp = new Response(file.readable, {
        status: 200,
        headers: {
          "content-type": "text/javascript",
        },
      });
    }
  }
  // 405
  if (req.method != "GET") {
    resp = new Response(null, { status: 405 });
  }
  // 404
  if (!resp) {
    resp = new Response(null, { status: 404 });
  }

  return resp;
}

serve(handler, { port: 8080 });
