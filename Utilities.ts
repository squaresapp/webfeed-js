
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
		const feeds = getFeedsFromDocument(doc);
		const feedsUrls = feeds.map(f => f.href);
		const head = getElements("LINK, STYLE", doc.head)
			.filter(e => !feedsUrls.includes(e.getAttribute("href") || ""));
		
		return {
			url,
			document: doc,
			head,
			feeds,
			sections,
		};
	}
	
	/**
	 * Scans a document for <link> tags that refer to feeds of HTML Reels.
	 */
	export function getFeedsFromDocument(doc = document)
	{
		const feeds: IFeedInfo[] = [];
		const fe = getElements("LINK[rel=feed]", doc);
		
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
		
		return feeds;
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
					.filter(s => s.startsWith("#"))
					.map(s => Url.resolve(s, Url.folderOf(feedUrl))));
				
				bytesRead = fetchResult.text.length || 0;
			}
		}
		
		return { urls, bytesRead };
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
	 * 
	 */
	export async function getOmniviewFromFeedUrl(feedUrl: string)
	{
		const feed = await Reels.getFeedFromUrl(feedUrl);
		return getOmniviewFromFeed(feed.urls);
	}
	
	/**
	 * 
	 */
	export function getOmniviewFromFeed(urls: string[])
	{
		if (typeof Omniview === "undefined")
			throw new Error("Omniview library not found.");
		
		const hot = new Hot();
		
		const omniview = new Omniview.Class({
			getPoster: index =>
			{
				if (index >= urls.length)
					return null;
				
				return new Promise(async resolve =>
				{
					const poster = await Reels.getPosterFromUrl(urls[index]);
					resolve(poster || getMissingPoster());
				});
			},
			fillBody: async (fillElement, selectedElement, index) =>
			{
				const url = urls[index];
				const reel = await Reels.getReelFromUrl(url);
				if (!reel)
					return selectedElement.append(getMissingPoster());
				
				fillElement.append(
					Reels.getSandboxedElement([...reel.head, ...reel.sections], reel.url)
				);
			}
		});
		
		const out = hot.div(
			"omniview-container",
			{
				// This overrides the "position: fixed" setting which is the
				// default for an omniview. The omniview's default fixed
				// setting does seem a bit broken. Further investigation
				// is needed to determine if this is appropriate.
				position: "relative",
				scrollSnapAlign: "start",
				scrollSnapStop: "always",
				minHeight: "200vh",
			},
			hot.get(omniview)(
				{
					position: "relative",
				},
				hot.on("connected", () =>
				{
					omniview.gotoPosters();
				}),
			),
			hot.div(
				{
					position: "absolute",
					left: 0,
					right: 0,
					bottom: 0,
					scrollSnapAlign: "end",
					scrollSnapStop: "always",
				}
			),
		);
		
		const head = omniview.head;
		let lastY = -1;
		let lastDirection = 0;
		window.addEventListener("scroll", () => window.requestAnimationFrame(() =>
		{
			if (omniview.mode !== Omniview.OmniviewMode.posters)
				return;
			
			const y = window.scrollY;
			if (y === lastY)
				return;
			
			const direction = y > lastY ? 1 : -1;
			let omniviewVisible = head.getBoundingClientRect().top <= 0;
			
			if (omniviewVisible)
			{
				if (direction === 1)
					omniview.scrollingAncestor.style.scrollSnapType = "none";
				
				else if (direction === -1 && lastDirection === 1)
					omniview.scrollingAncestor.style.removeProperty("scroll-snap-type");
			}
			
			lastDirection = direction;
			lastY = y;
			
			// Expand the size of the omniview container, in order to push the
			// footer snapper div downward so that it aligns with the bottom
			// of the omniview posters.
			const rows = Math.ceil(omniview.posterCount / omniview.size);
			const vh = rows * (100 / omniview.size);
			out.style.minHeight = vh + "vh";
		}));
		
		return out;
	}
	
	/** */
	function getMissingPoster()
	{
		const hot = new Hot();
		return hot.div(
			{
				position: "absolute",
				top: 0,
				right: 0,
				bottom: 0,
				left: 0,
				width: "fit-content",
				height: "fit-content",
				margin: "auto",
				fontSize: "10vw",
				fontWeight: 900,
			},
			new Text("✕")
		);
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
