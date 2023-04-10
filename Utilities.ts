
namespace Reels
{
	//# Reels
	
	/**
	 * Organizes the specified element or elements into the
	 * shadow root of a newly created <div> element.
	 */
	export function getSandboxedElement(
		contents: HTMLElement | HTMLElement[],
		baseUrl: string)
	{
		const container = document.createElement("div");
		const head: HTMLElement[] = [Reels.getStandardCss()];
		const body: HTMLElement[] = [];
		const shadow = container.attachShadow({ mode: "open" });
		
		for (const element of Array.isArray(contents) ? contents : [contents])
		{
			const n = element.nodeName;
			
			if (n === "SECTION")
				body.push(element);
			
			else if (n === "LINK" || n === "STYLE")
				head.push(element);
		}
		
		shadow.append(...head, ...body);
		baseUrl = Url.folderOf(baseUrl);
		const attrNames = ["href", "src", "action", "data-src"];
		const sel = "LINK[href], A[href], IMG[src], FORM[action], SCRIPT[src]";
		
		for (const element of getElements(sel, shadow))
		{
			const attrs = attrNames
				.map(a => element.getAttributeNode(a))
				.filter((a): a is Attr => !!a);
			
			for (const attribute of attrs)
				attribute.value = Url.resolve(attribute.value, baseUrl);
		}
		
		return container;
	}
	
	/**
	 * Reads an HTML Reel from the specified URL, and returns an
	 * object that contains the relevant content.
	 */
	export async function getReelFromUrl(url: string)
	{
		const doc = await getDocumentFromUrl(url);
		if (!doc)
			return null;
		
		const sections = getElements("BODY > SECTION", doc);
		const fe = getElements("LINK[rel=feed]");
		const head = getElements("LINK, STYLE", doc.head).filter(e => !fe.includes(e));
		
		const feeds: IFeedInfo[] = [];
		for (const e of fe)
		{
			const href = e.getAttribute("href");
			if (!href)
				continue;
			
			const visibleAttr = e.getAttribute("disabled")?.toLowerCase();
			const visible = typeof visibleAttr === "string" && visibleAttr !== "false";
			const subscribableAttr = e.getAttribute("type")?.toLowerCase();
			const subscribable = subscribableAttr === "text/feed";
			feeds.push({ visible, subscribable, href });
		}
		
		return {
			url,
			document: doc,
			head,
			feeds,
			sections,
		};
	}
	
	/**
	 * Stores the information about a feed defined by a <link> tag in a Reel.
	 */
	export interface IFeedInfo
	{
		readonly subscribable: boolean;
		readonly visible: boolean;
		readonly href: string;
	}
	
	/**
	 * Reads a DOM Document object stored at the specified URL,
	 * and returns a sanitized version of it.
	 */
	export async function getDocumentFromUrl(url: string)
	{
		const result = await getHttpContent(url);
		if (!result)
			return null;
		
		const docUri = Url.folderOf(url);
		const sanitizer = new ForeignDocumentSanitizer(result.text, docUri);
		return sanitizer.read();
	}
	
	//# Feeds
	
	/**
	 * Returns a fully-qualified version of a feed URL defined within the specified
	 * Node. If the within argument is omitted, the current document is used.
	 */
	export function getFeedUrl(within: ParentNode = document)
	{
		const link = within.querySelector(`LINK[rel="feed"][href]`);
		const href = link instanceof HTMLElement ? link.getAttribute("href") : "";
		return href ? Url.resolve(href, Url.getCurrent()) : "";
	}
	
	/**
	 * Reads the URLs defined in the feed file located at the specified
	 * URL. The function accepts a startingByte argument to allow for
	 * partial downloads containing only the new content in the feed.
	 */
	export async function getFeedFromUrl(feedUrl: string, startingByte = 0)
	{
		const urls: string[] = [];
		const fetchResult = await getHttpContent(feedUrl, startingByte);
		let bytesRead = -1;
		
		if (fetchResult)
		{
			const type = (fetchResult.headers.get("Content-Type") || "").split(";")[0];
			if (type !== "text/plain")
			{
				console.error(
					"Feed at URL: " + feedUrl + "was returned with an incorrect " +
					"mime type. Expected mime type is \"text/plain\", but the mime type \"" + 
					type + "\" was returned.");
			}
			else
			{
				urls.push(...fetchResult.text
					.split("\n")
					.map(s => s.trim())
					.filter(s => !!s)
					.map(s => Url.resolve(s, Url.folderOf(feedUrl))));
				
				bytesRead = fetchResult.text.length || 0;
			}
		}
		
		return { urls, bytesRead };
	}
	
	/**
	 * Reads posters from a feed text file located at the specified URL.
	 * 
	 * @returns An async generator function that iterates through
	 * every reel specified in the specified feed URL, and returns
	 * the poster associated with each reel.
	 */
	export async function * getPostersFromFeed(feedUrl: string)
	{
		const readResult = await Reels.getFeedFromUrl(feedUrl);
		for (const url of readResult.urls)
		{
			const reel = await Reels.getReelFromUrl(url);
			const poster = reel?.sections.length ?
				Reels.getSandboxedElement([...reel.head, reel.sections[0]], reel.url) :
				null;
			
			if (poster)
				yield { poster, url };
		}
	}
	
	/**
	 * Reads the poster <section> stored in the Reel at the specified URL.
	 */
	export async function getPosterFromUrl(reelUrl: string)
	{
		const reel = await getReelFromUrl(reelUrl);
		return reel?.sections.length ?
			Reels.getSandboxedElement([...reel.head, reel.sections[0]], reel.url) :
			null;
	}
	
	//# Generic
	
	/**
	 * Makes an HTTP request to the specified URI and returns
	 * the headers and a string containing the body.
	 */
	export async function getHttpContent(relativeUri: string, startingByte = 0)
	{
		relativeUri = Url.resolve(relativeUri, Url.getCurrent());
		
		try
		{
			const headers: HeadersInit = {
				"pragma": "no-cache",
				"cache-control": "no-cache",
			};
			
			if (startingByte > 0)
				headers.range = "bytes=" + startingByte + "-";
			
			const fetchResult = await window.fetch(relativeUri, {
				method: "GET",
				headers,
			});
			
			if (!fetchResult.ok)
			{
				console.error("Fetch failed: " + relativeUri);
				return null;
			}
			
			const text = await fetchResult.text();
			return {
				headers: fetchResult.headers,
				text,
			};
		}
		catch (e)
		{
			relativeUri;
			debugger;
			return null;
		}
	}
	
	/**
	 * Returns an array of HTMLElement objects that match the specified selector,
	 * optionally within the specified parent node.
	 */
	export function getElements(selector: string, container: ParentNode = document)
	{
		return Array.from(container.querySelectorAll(selector)) as HTMLElement[];
	}
}
