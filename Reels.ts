
namespace Reels
{
	//@ts-ignore
	if (typeof document === "undefined") return;
	
	const hot = new Hot();
	
	/**
	 * (Deprecated, only called from YessReaderDemo)
	 */
	export function getFrameCss(container: HTMLElement = document.body)
	{
		let containerSelector = container.nodeName;
		if (containerSelector !== "BODY")
		{
			container.classList.add(Const.reelContainerClass);
			containerSelector = "." + Const.reelContainerClass;
		}
		
		return hot.style(
			"*", {
				position: "relative",
				margin: 0,
				padding: 0,
				border: 0,
				boxSizing: "border-box",
				fontFamily: "Inter, -apple-system, BlinkMacSystemFont, segoe ui, helvetica neue, helvetica, Ubuntu, roboto, noto, arial, sans-serif",
			},
			"HTML", {
				overflow: "hidden",
			},
			"BODY", {
				height: "100%",
			},
			"HTML, BODY", {
				margin: 0,
			},
			containerSelector, {
				scrollSnapType: "y mandatory",
				overflowY: "scroll",
			},
		);
	}
	
	/**
	 * Deprecated
	 */
	export function getSceneCss()
	{
		const sc = "." + Const.reelSceneClass;
		const sn = "." + Const.reelSectionClass;
		
		return hot.style(
			sc + "," + sn, {
				position: "relative",
				minHeight: "100%",
				overflow: "hidden",
				scrollSnapStop: "always",
				scrollSnapAlign: "start",
			},
			sn + `[data-src], ${sn}[data-src] ~ *`, {
				display: "none",
			},
		);
	}
	
	/**
	 * 
	 */
	export async function launch()
	{
		const url = getDocumentBaseUrl();
		embedRecursive(document.body, url);
	}
	
	/**
	 * An async generator function that yields HTML <section> elements
	 * that contain scenes which are downloaded from the specified URL.
	 */
	export async function embed(url: string, target: ParentNode)
	{
		const info = await readReel(url);
		if (!info)
			return;
		
		const scenes = info.sections.map(e => toScene(e, url) || e);
		target.append(...scenes);
		await embedRecursive(target, url);
	}
	
	/**
	 * 
	 */
	async function embedRecursive(target: ParentNode, baseUrl: string)
	{
		return new Promise<void>(resolve =>
		{
			const again = (baseUrl: string) =>
			{
				const children = Array.from(target.children) as HTMLElement[];
				
				for (const child of children)
				{
					if (child.nodeName !== "SECTION")
						continue;
					
					const src = getSectionSource(child);
					const srcResolved = Url.resolve(src, baseUrl);
					const srcFolder = Url.folderOf(srcResolved);
					
					// Handle scenes that are inline
					if (!src)
					{
						child.replaceWith(toScene(child, srcFolder)!)
						continue;
					}
					
					Reels.readReel(srcResolved).then(info =>
					{
						setLoading(child, false);
						
						if (info)
						{
							const scenes = info.sections.map(e => toScene(e, srcFolder) || e);
							child.replaceWith(...scenes);
							again(srcFolder);
						}
					});
				}
				
				if (!children.some(e => e.nodeName === "SECTION"))
					resolve();
			}
			
			again(baseUrl);
		});
	}
	
	/** */
	function setLoading(section: HTMLElement, loading: boolean)
	{
		loading ? 
			section.setAttribute(loadingAttr, "") :
			section.removeAttribute(loadingAttr);
	}
	
	const loadingAttr = "data-loading";
	
	/**
	 * Reads YESS content at the specified URL, and returns an
	 * object parsed with the relevant data.
	 */
	export async function readReel(url: string)
	{
		const doc = await readDocumentFromUrl(url);
		if (!doc)
			return null;
		
		const title = doc.title;
		const meta = getMeta(doc, url);
		const feed = (meta?.feedUrl || "").trim();
		const ping = (meta?.pingUrl || "").trim();
		const sections = query("BODY > SECTION", doc);
		const head = Array.from(query("LINK, STYLE", doc.head));
		
		if (sections.length == 0)
		{
			// Create a default section that contains all content from
			// the (possibly inferred) <head> and <body> sections.
			const section = hot.section(head, Array.from(doc.body.childNodes));
			
			// If security is disabled and we're executing scripts that
			// are defined within the loaded HTML, the script tags need
			// to be manually cloned, because scripts do not execute that
			// are (or were at any point in history) a child of of the parsed
			// document.
			if (!enableSecurity)
			{
				for (const script of Array.from(section.getElementsByTagName("script")))
				{
					const attrs = Array.from(script.attributes).map(a => [a.name, a.value] as [string, string]);
					script.replaceWith(
						hot.script(
							Object.fromEntries(attrs),
							script.textContent && hot.text(script.textContent)
						),
					);
				}
			}
			
			sections.push(section);
		}
		else
		{
			sections[0].prepend(...head);
		}
		
		return {
			title,
			feed: feed ? Url.resolve(feed, Url.folderOf(url)) : "",
			ping: ping ? Url.resolve(ping, Url.folderOf(ping)) : "",
			sections,
		};
	}
	
	/**
	 * Return the specified <section> element converted to a "scene".
	 * A "scene" in this case refers to the contents being wrapped in an HTML <div>
	 * element, and being moved into this element's shadow root.
	 */
	export function toScene(section: HTMLElement, baseUrl: string)
	{
		// Avoid the conversion of a <section> tag to a scene
		//if the scene's contents have not been loaded.
		if (getSectionSource(section))
			return null;
		
		baseUrl = Url.folderOf(baseUrl);
		
		const resolvables = query("LINK[href], A[href], IMG[src], FORM[action], SCRIPT[src]", section);
		resolvables.push(section);
		const names = ["href", "src", "action", "data-src"];
		
		for (const element of resolvables)
		{
			const attrs = names
				.map(a => element.getAttributeNode(a))
				.filter((a): a is Attr => !!a);
			
			for (const attribute of attrs)
				attribute.value = Url.resolve(attribute.value, baseUrl);
		}
		
		return hot.div(
			Const.reelSceneClass,
			hot.shadow(
				hot.style(
					hot.text(`SECTION { position: absolute; top: 0; right: 0; bottom: 0; left: 0; overflow: hidden; }`)
				),
				hot.get(section)(
					Const.reelSectionClass,
					Array.from(section.childNodes)
				)
			)
		);
	}
	
	/**
	 * 
	 */
	function getSectionSource(section: HTMLElement)
	{
		return section.getAttribute(Const.reelSrcKey) || "";
	}
	
	/**
	 * Finds the <meta> tag contained within the specified container
	 * that describes this YESS document, and returns it's parsed content
	 * attribute.
	 */
	export function getMeta(container: ParentNode, docUri = "")
	{
		if (!docUri)
			if (container instanceof Document)
				docUri = container?.location?.href || "";
		
		if (!docUri)
			throw new Error("docUri argument must be non-empty.");
		
		const metaTag = (() =>
		{
			const getMetaTag = (container: ParentNode) =>
				container.querySelector(`META[name=${Const.reelMetaKey}]`);
			
			const tagAtRoot = getMetaTag(container);
			if (tagAtRoot)
				return tagAtRoot as HTMLElement;
				
			const sections = container.querySelectorAll("section");
			for (let i = -1; ++i < sections.length;)
			{
				const section = sections[i];
				const shadow = section.shadowRoot;
				if (shadow)
				{
					const tag = getMetaTag(shadow);
					if (tag)
						return tag as HTMLElement;
				}
			}
			
			return null;
		})();
		
		if (!metaTag)
			return null;
		
		let feedUrl = "";
		let pingUrl = "";
		
		const contentValue = metaTag.getAttribute("content");
		if (contentValue)
		{
			const tuples = contentValue.split(/\s*,\s+/g).map(s => s.split("=", 2) as [string, string]);
			for (const tuple of tuples)
			{
				if (tuple.length !== 2)
					continue;
				
				if (tuple[0] === Const.reelMetaFeedKey)
					feedUrl = tuple[1];
				
				else if (tuple[0] === Const.reelMetaPingKey)
					pingUrl = tuple[1];
			}
		}
		
		return { feedUrl, pingUrl };
	}
	
	/**
	 * Gets the base URL of the document loaded into the current browser window.
	 * Accounts for any HTML <base> tags that may be defined within the document.
	 */
	export function getDocumentBaseUrl()
	{
		if (storedDocumentUrl)
			return storedDocumentUrl;
		
		let url = Url.folderOf(document.URL);
		
		const base = document.querySelector("base[href]");
		if (base)
		{
			const href = base.getAttribute("href") || "";
			if (href)
				url = Url.resolve(href, url);
		}
		
		return storedDocumentUrl = url;
	}
	let storedDocumentUrl = "";
	
	/**
	 * 
	 */
	export async function readDocumentFromUrl(url: string)
	{
		const result = await readHttpUri(url);
		if (!result)
			return null;
		
		const docUri = Url.folderOf(url);
		const sanitizer = new ForeignDocumentSanitizer(result.text, docUri);
		sanitizer.enableSecurity = enableSecurity;
		return sanitizer.read();
	}
	
	/**
	 * Reads the text content from the specified URL.
	 */
	export async function readHttpUri(relativeUri: string, startingByte = 0)
	{
		relativeUri = Url.resolve(relativeUri, getDocumentBaseUrl());
		
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
	 * Reads poster scenes from a feed text file located at the specified URL.
	 * 
	 * @returns An async generator function that iterates through
	 * every story specified in the specified feed URL, and returns
	 * the poster scene associated with each story.
	 */
	export async function * readPosters(feedUrl: string)
	{
		const readResult = await readFeed(feedUrl);
		
		for (const url of readResult.urls)
		{
			const yessData = await readReel(url);
			if (!yessData || yessData.sections.length === 0)
				continue;
			
			const posterSection = yessData.sections[0];
			const scene = Reels.toScene(posterSection, url);
			yield { scene, url };
		}
	}
	
	/**
	 * Reads a single poster from the specified URL.
	 */
	export async function readPoster(storyUrl: string)
	{
		const yessData = await readReel(storyUrl);
		if (!yessData || yessData.sections.length === 0)
			return null;
		
		const posterSection = yessData.sections[0];
		const poster = Reels.toScene(posterSection, storyUrl);
		
		return {
			title: yessData.title,
			poster,
		};
	}
	
	/**
	 * Reads the URLs defined in the feed file located at the specified
	 * URL. The function accepts a startingByte argument in order to 
	 */
	export async function readFeed(feedUrl: string, startingByte = 0)
	{
		const urls: string[] = [];
		const fetchResult = await readHttpUri(feedUrl, startingByte);
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
	
	/** */
	function query(selector: string, parentNode: ParentNode = document)
	{
		return Array.from(parentNode.querySelectorAll(selector)) as HTMLElement[];
	}
	
	/**
	 * Main entry point for when the yess.js script is 
	 * embedded within a web page.
	 */
	if (typeof document !== "undefined" && document.readyState !== "complete")
	{
		window.addEventListener("DOMContentLoaded", () =>
		{
			if (Reels.getMeta(document))
			{
				enableSecurity = false;
				document.head.prepend(Reels.getFrameCss(), Reels.getSceneCss());
				Reels.launch();
			}
		});
	}
	
	let enableSecurity = true;
	
	export type Nodes = NodeList | Node[];
	
	/** */
	const enum Const
	{
		reelContainerClass = "reel-container",
		reelSceneClass = "reel-scene",
		reelSectionClass = "reel-section",
		reelSrcKey = "data-src",
		reelMetaKey = "reel",
		reelMetaFeedKey = "feed",
		reelMetaPingKey = "ping",
	}
	
	typeof module === "object" && Object.assign(module.exports, { Reels });
}
