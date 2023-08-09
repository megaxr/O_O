
import { typeByExtension } from "https://deno.land/std@0.180.0/media_types/type_by_extension.ts";

export async function responseFileByPath(path: string): Promise<Response | undefined> {
  const extension = typeByExtension(path.substring(1 + path.lastIndexOf("/"), path.length).split(".")[1]);
  const file = await Deno.readFile(path);
  if (file && extension) {
    return new Response(file.buffer, { status: 200, headers: { "content-type": extension } });
  } else {
    return undefined;
  }
}

export async function responseJsonByDir(dirPath: string, path?: string): Promise<Response> {
  const folderNames: Array<string> = [];
  const fileNames: Array<string> = [];
  for await (const dirEntry of Deno.readDir(path ? dirPath + path : dirPath)) {
    if (dirEntry.isDirectory) folderNames.push(dirEntry.name);
    if (dirEntry.isFile) fileNames.push(dirEntry.name);
  }
  return Response.json({ path: path, folders: folderNames, files: fileNames });
}

export async function responseVideoByRequestAndPath(
  req: Request,
  dirPath: string,
  path: string,
): Promise<Response | undefined> {
  const range = req.headers.get("range");
  const video = await Deno.open(`${dirPath}${path}`, { read: true });
  if (range && video) {
    const videoSize = (await video.stat()).size;
    const chunckSize = 10 ** 6; // 100000 byte, about 1MB
    // Parse Range, chrome ex: bytes=0- , safari ex: bytes=0-1
    const startIndex = Number(range.replace(/\D/g, ""));
    const endIndex = Math.min(startIndex + chunckSize, videoSize - 1);
    const contentLength = endIndex - startIndex + 1;
    await video.seek(startIndex, Deno.SeekMode.Current);
    return new Response(
      new ReadableStream({
        async pull(controller) {
          const chunk = new Uint8Array(chunckSize);
          try {
            const read = await video.read(chunk);
            if (read) {
              controller.enqueue(chunk.subarray(0, read));
              // REMOVE
              // console.log(
              //   `startIndex=${startIndex}, endIndex=${endIndex}, contentLength=${contentLength}, read=${read}, cursorPosition=${cursorPosition}, chunk=${chunk.length}`,
              // );
            }
          } catch (_err) {
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
  } else {
    return undefined;
  }
}

// export async function adbDevices(adbPath: string) {
//   if (adbPath) {
//     const p = Deno.run({
//       cmd: [adbPath, "devices"],
//       stdout: "piped",
//       stderr: "piped",
//       // stdin: "null",
//     });
//     // console.log(await p.status());
//     const d = new TextDecoder().decode(await p.output());
//     return d ? d.split(" ") : "adb not found.";
//   }
// }

export const adbDevices = async (adbPath: string) => {
  if (adbPath) {
    const p = Deno.run({
      cmd: [adbPath, "devices"],
      stdout: "piped",
      stderr: "piped",
      // stdin: "null",
    });
    // console.log(await p.status());
    const d = new TextDecoder().decode(await p.output());
    return d ? d.split(" ") : "adb not found.";
  }
};
