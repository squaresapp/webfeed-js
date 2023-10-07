
namespace HtmlFeed
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
		const head: HTMLElement[] = [HtmlFeed.getStandardCss()];
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
		convertEmbeddedUrlsToAbsolute(shadow, baseUrl);
		return container;
	}
	
	/**
	 * 
	 */
	function convertEmbeddedUrlsToAbsolute(parent: ParentNode, baseUrl: string)
	{
		const elements = getElements(selectorForUrls, parent);
		
		if (parent instanceof HTMLElement)
			elements.unshift(parent);
		
		for (const element of elements)
		{
			const attrs = attrsWithUrls
				.map(a => element.getAttributeNode(a))
				.filter((a): a is Attr => !!a);
			
			for (const attribute of attrs)
				attribute.value = Url.resolve(attribute.value, baseUrl);
			
			for (const p of cssPropertiesWithUrls)
			{
				let pv = element.style.getPropertyValue(p);
				if (pv === "")
					continue;
				
				pv = pv.replace(/\burl\(".+?"\)/, substr =>
				{
					const unwrapUrl = substr.slice(5, -2);
					const url = Url.resolve(unwrapUrl, baseUrl);
					return `url("${url}")`;
				});
				
				element.style.setProperty(p, pv);
			}
		}
	}
	
	const attrsWithUrls = ["href", "src", "action", "data-src"];
	const selectorForUrls = "LINK[href], A[href], IMG[src], FORM[action], SCRIPT[src], [style]";
	const cssPropertiesWithUrls = [
		"background",
		"background-image",
		"border-image",
		"border-image-source",
		"content",
		"cursor",
		"list-style-image",
		"mask",
		"mask-image",
		"offset-path",
		"src",
	];
	
	/**
	 * Reads an HTML Reel from the specified URL, and returns an
	 * object that contains the relevant content.
	 */
	export async function getReelFromUrl(url: string)
	{
		const baseUrl = Url.folderOf(url);
		const doc = await getDocumentFromUrl(url);
		if (!doc)
			return null;
		
		const sections = getElements("BODY > SECTION", doc);
		const feeds = getFeedsFromDocument(doc);
		const feedsUrls = feeds.map(f => f.href);
		const head = getElements("LINK, STYLE", doc.head)
			.filter(e => !feedsUrls.includes(e.getAttribute("href") || ""));
		
		for (const element of [...head, ...sections])
			convertEmbeddedUrlsToAbsolute(element, baseUrl);
		
		return {
			url,
			document: doc,
			head,
			feeds,
			sections,
		};
	}
	
	/**
	 * Scans a document for <link> tags that refer to feeds of HTML HtmlFeed.
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
					.filter(s => !s.startsWith("#"))
					.map(s => Url.resolve(s, Url.folderOf(feedUrl))));
				
				bytesRead = fetchResult.text.length || 0;
			}
		}
		
		return { urls, bytesRead };
	}
	
	/**
	 * Finds the meta data associated with the feed at the specified URL.
	 * The algorithm used is a upscan of the folder structure of the specified URL,
	 * starting at it's base directory, and scanning upwards until the root
	 * domain is reached.
	 */
	export async function getFeedMetaData(feedUrl: string)
	{
		let currentUrl = Url.folderOf(feedUrl);
		
		for (let safety = 1000; safety-- > 0;)
		{
			const httpContent = await HtmlFeed.getHttpContent(currentUrl);
			if (httpContent)
			{
				const htmlContent = httpContent.text;
				const reader = new ForeignDocumentReader(htmlContent);
				
				let author = "";
				let description = "";
				let icon = "";
				
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
				
				if (author || description || icon)
					return { author, description, icon };
			}
		
			const url = new URL("..", currentUrl);
			if (currentUrl === url.toString())
				break;
			
			currentUrl = url.toString();
		}
		
		return null;
	}
	
	/**
	 * Reads the poster <section> stored in the Reel at the specified URL.
	 */
	export async function getPosterFromUrl(reelUrl: string)
	{
		const reel = await getReelFromUrl(reelUrl);
		return reel?.sections.length ?
			HtmlFeed.getSandboxedElement([...reel.head, reel.sections[0]], reel.url) :
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
		const readResult = await HtmlFeed.getFeedFromUrl(feedUrl);
		for (const url of readResult.urls)
		{
			const reel = await HtmlFeed.getReelFromUrl(url);
			const poster = reel?.sections.length ?
				HtmlFeed.getSandboxedElement([...reel.head, reel.sections[0]], reel.url) :
				null;
			
			if (poster)
				yield { poster, url };
		}
	}
	
	/**
	 * Returns an Omniview that is automatically populated with the
	 * posters from the specified URLs. The Omniview is wrapped inside
	 * and element that makes the Omniview suitable for embedding on
	 * a public website.
	 */
	export function getEmbeddedOmniviewFromFeed(
		urls: string[],
		omniviewOptions: Partial<IOmniviewOptions> = {})
	{
		if (typeof Omniview === "undefined")
			throw new Error("Omniview library not found.");
		
		const hot = new Hot();
		const omniview = getOmniviewFromFeed(urls, omniviewOptions) as Omniview.Class;
		
		const out = hot.div(
			"omniview-container",
			{
				position: "relative",
				scrollSnapAlign: "start",
				scrollSnapStop: "always",
				minHeight: "200vh",
			},
			// This overrides the "position: fixed" setting which is the
			// default for an omniview. The omniview's default fixed
			// setting does seem a bit broken. Further investigation
			// is needed to determine if this is appropriate.
			hot.get(omniview)({ position: "relative" }),
			// Places an extra div at the bottom of the posters list
			// so that scroll-snapping works better.
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
	
	/**
	 * Renders a placeholder poster for when the item couldn't be loaded.
	 */
	export function getErrorPoster()
	{
		const div = document.createElement("div");
		const s = div.style;
		s.position = "absolute";
		s.top = "0";
		s.right = "0";
		s.bottom = "0";
		s.left = "0";
		s.width = "fit-content";
		s.height = "fit-content";
		s.margin = "auto";
		s.fontSize = "10vw";
		s.fontWeight = "900";
		div.append(new Text("✕"));
		return div;
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
			
			let text = "";
			
			try
			{
				text = await fetchResult.text();
			}
			catch (e)
			{
				console.error("Fetch failed: " + relativeUri);
				return null;
			}
			
			return {
				headers: fetchResult.headers,
				text,
			};
		}
		catch (e)
		{
			console.log("Error with request: " + relativeUri);
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
