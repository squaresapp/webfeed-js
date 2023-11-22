
namespace Webfeed
{
	//# Pages
	
	/**
	 * Organizes the specified element or elements into the
	 * shadow root of a newly created <div> element.
	 */
	export function getSandboxedElement(
		contents: HTMLElement | HTMLElement[],
		baseUrl: string)
	{
		const container = document.createElement("div");
		const head: HTMLElement[] = [Webfeed.getStandardCss()];
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
	 * Reads an HTML page from the specified URL, and returns an
	 * object that contains the relevant content.
	 */
	export async function getPageFromUrl(url: string)
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
	 * Scans a document for <link> tags that refer to the feeds defined
	 * within the specified document.
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
	 * Stores the information about a feed defined by a <link> tag in a page.
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
		return result ? sanitizeDocument(url, result.text) : null;
	}
	
	/**
	 * Removes all unsafe HTML from the specified HTML code, and patches all
	 * <form> elements so that its submission operation results in the response
	 * being patched within the document, rather than a redirect occuring.
	 */
	async function sanitizeDocument(url: string, html: string)
	{
		const docUri = Url.folderOf(url);
		const sanitizer = new ForeignDocumentSanitizer(html, docUri);
		const doc = sanitizer.read();
		
		for (const form of Array.from(doc.getElementsByTagName("form")))
		{
			if (patchedForms.has(form))
				continue;
			
			const action = (form.action || "").trim();
			const containingSection = getContainingSection(form);
			if (!containingSection)
				continue;
			
			const target = form.target.replace(/"/g, `\\"`);
			const targetElement = containingSection.querySelector(`[id="${target}"]`) || form;
			
			form.addEventListener("submit", async ev =>
			{
				ev.preventDefault();
				
				if (action === "")
					return;
				
				const content = await Webfeed.getHttpContent(action, {
					method: form.method,
					quiet: true,
				});
				
				if (content === null)
				{
					for (const fn of submitFailureFns)
						fn(form);
				}
				else
				{
					const html = content.text;
					const doc = await sanitizeDocument(url, html);
					const replacements = Array.from(doc.body.children);
					
					if (targetElement.tagName === "SECTION" &&
						targetElement.parentElement?.tagName === "BODY" &&
						replacements.some(e => e.tagName !== "SECTION"))
					{
						targetElement.replaceChildren(...replacements);
					}
					else
					{
						targetElement.replaceWith(...replacements);
					}
				}
			});
			
			patchedForms.add(form);
		}
		
		return doc;
	}
	
	/**
	 * Gets the <section> element defined at the root level
	 * that contains the specified HTMLElement.
	 */
	function getContainingSection(e: HTMLElement)
	{
		let current = e;
		
		for (;;)
		{
			const closest = current.parentElement?.closest("section");
			if (!closest)
				return current === e ? null : e;
			
			current = closest;
		}
	}
	
	const patchedForms = new WeakSet<HTMLFormElement>();
	
	/**
	 * Specifies a function to invoke when the  form submission fails.
	 */
	export function handleSubmitFailure(fn: (form: HTMLFormElement) => void)
	{
		submitFailureFns.push(fn);
	}
	const submitFailureFns: ((form: HTMLFormElement) => void)[] = [];
	
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
	export async function getFeedUrls(feedUrl: string)
	{
		const urls: string[] = [];
		const fetchResult = await getHttpContent(feedUrl);
		
		if (!fetchResult)
			return null;
		
		let bytesRead = -1;
		const type = (fetchResult.headers.get("Content-Type") || "").split(";")[0];
		if (type !== "text/plain")
		{
			console.error(
				"Feed at URL: " + feedUrl + "was returned with an incorrect " +
				"mime type. Expected mime type is \"text/plain\", but the mime type \"" + 
				type + "\" was returned.");
			
			return null;
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
		
		return urls;
	}
	
	/** */
	export interface IFeedContents
	{
		readonly urls: string[];
		readonly bytesRead: number;
	}
	
	/**
	 * Finds the meta data associated with the feed at the specified URL.
	 * The algorithm used is a upscan of the folder structure of the specified URL,
	 * starting at it's base directory, and scanning upwards until the root
	 * domain is reached.
	 */
	export async function getFeedMetaData(feedUrl: string): Promise<IFeedMetaData>
	{
		let currentUrl = Url.folderOf(feedUrl);
		
		let author = "";
		let description = "";
		let icon = "";
		
		for (let safety = 1000; safety-- > 0;)
		{
			const httpContent = await Webfeed.getHttpContent(currentUrl, { quiet: true });
			if (httpContent)
			{
				const htmlContent = httpContent.text;
				const reader = new ForeignDocumentReader(htmlContent);
				
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
					break;
			}
		
			const url = new URL("..", currentUrl);
			if (currentUrl === url.toString())
				break;
			
			currentUrl = url.toString();
		}
		
		return { url: feedUrl, author, description, icon };
	}
	
	/** */
	export interface IFeedMetaData
	{
		readonly url: string;
		readonly author: string;
		readonly description: string;
		readonly icon: string;
	}
	
	/**
	 * Reads the poster <section> stored in the page at the specified URL.
	 */
	export async function getPosterFromUrl(pageUrl: string): Promise<HTMLElement | null>
	{
		const page = await getPageFromUrl(pageUrl);
		return page?.sections.length ?
			Webfeed.getSandboxedElement([...page.head, page.sections[0]], page.url) :
			null;
	}
	
	/**
	 * Reads posters from a feed text file located at the specified URL.
	 * 
	 * @returns An async generator function that iterates through
	 * every page specified in the specified feed URL, and returns
	 * the poster associated with each page.
	 */
	export async function * getPostersFromFeed(feedUrl: string)
	{
		const urls = await Webfeed.getFeedUrls(feedUrl);
		if (!urls)
			return;
		
		for (const url of urls)
		{
			const page = await Webfeed.getPageFromUrl(url);
			const poster = page?.sections.length ?
				Webfeed.getSandboxedElement([...page.head, page.sections[0]], page.url) :
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
		
		const raw = new Raw();
		const omniview = getOmniviewFromFeed(urls, omniviewOptions) as Omniview.Class;
		
		const out = raw.div(
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
			raw.get(omniview)({ position: "relative" }),
			// Places an extra div at the bottom of the posters list
			// so that scroll-snapping works better.
			raw.div(
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
		s.fontSize = "20vw";
		s.fontWeight = "900";
		div.append(new Text("✕"));
		return div;
	}
	
	//# Generic
	
	/**
	 * Makes an HTTP request to the specified URI and returns
	 * the headers and a string containing the body.
	 */
	export async function getHttpContent(
		relativeUri: string, 
		options: IGetHttpContentOptions = {})
	{
		relativeUri = Url.resolve(relativeUri, Url.getCurrent());
		
		try
		{
			const fetchResult = await window.fetch(relativeUri, {
				method: options.method || "GET",
				headers: options.headers || {},
				mode: "cors",
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
				if (!options.quiet)
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
			if (!options.quiet)
				console.log("Error with request: " + relativeUri);
			
			return null;
		}
	}
	
	/** */
	interface IGetHttpContentOptions
	{
		method?: string;
		headers?: HeadersInit;
		quiet?: boolean;
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
