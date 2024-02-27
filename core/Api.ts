
namespace Webfeed
{
	/**
	 * Main entry point for when the reals.js script is 
	 * embedded within a web page.
	 */
	if (typeof document !== "undefined" && typeof window !== "undefined")
	{
		const maybeBootstrap = () =>
		{
			const shouldBootstrap = !!document.querySelector("[data-webfeed-bootstrap]");
			if (shouldBootstrap)
				bootstrap();
		}
		
		if (document.readyState === "complete")
			maybeBootstrap()
		else
			window.addEventListener("DOMContentLoaded", maybeBootstrap);
	}
	
	/**
	 * Converts the <section> elements found in the document's body
	 * into the webfeed-scrollable format. This function is intended
	 * to be called by webfeed pages that are displaying in the browser,
	 * rather than in a webfeed reader.
	 */
	export function bootstrap(baseHref = window.location.href)
	{
		baseHref = Url.folderOf(baseHref) || "";
		if (!baseHref)
			throw new Error("Invalid base URL: " + baseHref);
		
		const body = document.body;
		const sections = Reorganizer.composeSections(baseHref, body);
		body.append(...sections);
		body.style.display = "contents";
		
		document.head.append(
			Util.createSheet(`HTML { height: 100%; }`),
			Webfeed.getSupportingCss()
		);
	}
	
	/**
	 * Performs an HTTP HEAD request on the specified feed index file
	 * and returns a string that can be used to determine if the index has
	 * has been modified since the last ping.
	 * 
	 * 
	 * The function returns the first HTTP header it finds, traversing
	 * in the order of ETag, Last-Modified, and finally Content-Length.
	 * Web servers are expected to return at least one of these HTTP
	 * header values in order to be webfeed-compliant.
	 * 
	 * The function returns null if the server wasn't reachable, or an
	 * empty string if the server didn't return one of the expected 
	 * headers.
	 */
	export async function ping(url: string)
	{
		const result = await Http.request(url, { method: "HEAD", quiet: true });
		if (!result)
			return null;
		
		return Util.hash([
			result.headers.get("etag") || "",
			result.headers.get("last-modified") || "",
			result.headers.get("content-length") || "",
		].join());
	}
	
	/**
	 * Reads the index.txt file located at the specified URL,
	 * and returns a list of URLs written into the file.
	 * 
	 * Returns null if the URL was invalid, or could not be reached.
	 */
	export async function downloadIndex(url: string)
	{
		const feedIndexFolderUrl = Url.folderOf(url);
		if (!feedIndexFolderUrl)
			return null;
		
		const fetchResult = await Http.request(url);
		if (!fetchResult)
			return null;
		
		const type = (fetchResult.headers.get("Content-Type") || "").split(";")[0];
		if (type !== "text/plain")
		{
			console.error(
				"Feed at URL: " + url + "was returned with an incorrect " +
				"mime type. Expected mime type is \"text/plain\", but the mime type \"" + 
				type + "\" was returned.");
				
			return null;
		}
		
		return fetchResult.body
			.split("\n")
			.map(s => s.trim())
			.filter(s => !!s && !s.startsWith("#"))
			.filter((s): s is string => !!Url.tryParse(s, feedIndexFolderUrl))
			.map(s => Url.resolve(s, feedIndexFolderUrl));
	}
	
	/**
	 * Reads the "details" associated with the specified feed index.
	 * The behavior mirrors the webfeed specification: it looks in the
	 * same folder as the index.txt file for a default document, which
	 * is expected to be an HTML file. It parses the <head> section of
	 * this HTML file to extract out the <meta> and <link> tags of
	 * interest.
	 */
	export async function downloadDetails(indexUrl: string)
	{
		const feedIndexFolderUrl = Url.folderOf(indexUrl);
		if (!feedIndexFolderUrl)
			return null;
		
		const result = await Http.request(feedIndexFolderUrl);
		if (!result)
			return null;
		
		let date = result.headers.get("Last-Modified") || "";
		let author = "";
		let description = "";
		let icon = "";
		
		const { body } = result;
		const reader = new ForeignDocumentReader(body);
		
		reader.trapElement(element =>
		{
			if (element.nodeName === "META")
			{
				const name = element.getAttribute("name")?.toLowerCase();
				
				if (name === "description")
					description = element.getAttribute("content") || "";
				
				else if (name === "author")
					author = element.getAttribute("content") || "";
			}
			else if (element.nodeName === "LINK")
			{
				const rel = element.getAttribute("rel")?.toLowerCase();
				
				if (rel === "icon")
					icon = element.getAttribute("href") || "";
			}
		});
		
		reader.read();
		
		return { date, author, description, icon };
	}
	
	/**
	 * Reads the first <section> (referred to as the "poster" section)
	 * from the specified URL. The URL is expected to be a
	 * webfeed-compatible page.
	 */
	export async function downloadPoster(pageUrl: string)
	{
		const sections = await downloadSections(pageUrl, 0, 1);
		return sections?.length ? sections[0] : null;
	}
	
	/**
	 * Downloads the top-level <section> elements found in the specified
	 * webfeed-compatible page. 
	 * 
	 * Returns null if the URL could not be loaded, or if the pageUrl
	 * argument does not form a valid fully-qualified URL.
	 */
	export async function downloadSections(
		pageUrl: string,
		rangeStart?: number,
		rangeEnd?: number)
	{
		const result = await Http.request(pageUrl);
		if (!result)
			return null;
		
		const baseHref = Url.folderOf(pageUrl);
		if (!baseHref)
			return null;
		
		const sanitizer = new ForeignDocumentSanitizer(result.body, pageUrl);
		const doc = sanitizer.read();
		return Reorganizer.composeSections(baseHref, doc, rangeStart, rangeEnd);
	}
	
	/**
	 * Returns the URL of the containing folder of the specified URL.
	 * The provided URL must be valid, or an exception will be thrown.
	 */
	export function getFolderOf(url: string)
	{
		return Url.folderOf(url);
	}
	
	/**
	 * Returns a <style> tag that has the minimum required CSS to
	 * render the carousel to the screen.
	 */
	export function getSupportingCss(frameSelector = "HTML")
	{
		return Util.createSheet(`
			${frameSelector} {
				scroll-snap-type: y mandatory;
			}
			.${sceneClassName} {
				position: relative;
				overflow: hidden;
				height: 100%;
				padding-top: 0.02px;
				padding-bottom: 0.02px;
				scroll-snap-align: start;
				scroll-snap-stop: always;
			}
		`);
	}
	
	/**
	 * Renders a placeholder poster for when the page couldn't be loaded.
	 */
	export async function getErrorPoster()
	{
		const e = document.createElement("div");
		const s = e.style;
		s.position = "absolute";
		s.top = "0";
		s.right = "0";
		s.bottom = "0";
		s.left = "0";
		s.width = "fit-content";
		s.height = "fit-content";
		s.margin = "auto";
		s.fontSize = "20vw";
		s.fontWeight = "900";
		e.append(new Text("✕"));
		return e;
	}
	
	/**
	 * The name of the class added to the constructed <div>
	 * elements that create the scenes.
	 */
	export const sceneClassName = "--scene";
	
	declare const module: any;
	typeof module === "object" && Object.assign(module.exports, { Webfeed });
}
