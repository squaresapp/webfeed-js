
namespace HtmlFeed.Cover
{
	/**
	 * Launches an HTTP server on the next available
	 * port after 10000 that responds to the routes specified.
	 * @returns A string that contains the base URL of the server.
	 */
	export function serve(routes: IRouteTable)
	{
		const http = require("http") as typeof import("http");
		const server = http.createServer(async (request, response) =>
		{
			for (const [route, handlerFn] of Object.entries(routes))
			{
				if (route.replace(/^\//, "") !== request.url?.replace(/^\//, ""))
					continue;
				
				const handlerResult = handlerFn(request);
				const textResult = typeof handlerResult === "string" ?
					handlerResult :
					await handlerResult;
				
				const mime = Mime.fromFileName(request.url);
				
				response.writeHead(200, {
					"Content-Type": mime,
					"Content-Length": textResult.length,
				});
				
				response.write(textResult);
				response.end();
			}
		});
		
		let port = 10000;
		while (++port < 65536)
		{
			try
			{
				server.listen(port);
				break;
			}
			catch (e) { }
		}
		
		const url = "http://localhost:" + port + "/";
		console.log("Feed server running at: " + url);
		return url;
	}
	
	namespace Mime
	{
		/**
		 * Parses the specified file name and returns the mime
		 * type that is likely associated with it, based on the file extension.
		 */
		export function fromFileName(fileName: string)
		{
			const ext = fileName.split(".").slice(-1)[0] || "";
			return mimes.get(ext) || "";
		}
		
		/**
		 * Returns the file extension that is associated with the
		 * specified mime type.
		 */
		export function getExtension(mimeType: string)
		{
			for (const [ext, mime] of mimes)
				if (mime === mimeType)
					return ext;
			
			return "";
		}
		
		/** */
		const mimes = new Map<string, string>(Object.entries({
			// Images
			gif: "image/gif",
			jpg: "image/jpeg",
			png: "image/png",
			svg: "image/svg+xml",
			webp: "image/webp",
			avif: "image/avif",
			
			// Videos
			mp4: "video/mp4",
			webm: "video/av1",
			
			// Zip
			zip: "application/zip",
			
			// Text
			html: "text/html",
			css: "text/css",
			js: "text/javascript",
			txt: "text/plain",
		}));
	}
	
	/** */
	export interface IRouteTable
	{
		[route: string]: (request: import("http").IncomingMessage) => string | Promise<string>;
	}
}
