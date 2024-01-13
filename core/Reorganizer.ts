
/**
 * @internal
 * A namespace of functions that deal with the reorganization
 * of documents into well-controlled <section> elements.
 */
namespace Webfeed.Reorganizer
{
	/**
	 * Extracts and reorganizes  a range of top-level <section> elements
	 * present in the specified document.
	 */
	export function composeSections(
		baseHref: string,
		parent: ParentNode,
		rangeStart?: number,
		rangeEnd?: number)
	{
		const metaElements = queryElements("LINK, STYLE, META, BASE", parent);
		metaElements.map(e => e.remove());
		
		// If the parent is an <html> element, then we change the parent to the
		// <body> tag within the <html> element, but first make sure the document
		// actually has a <body> tag. It's possible that the document may not have
		// a <body> tag if the document is being constructed inside some simulated
		// DOM implementation (like LinkeDOM / HappyDOM).
		if (parent instanceof HTMLHtmlElement)
		{
			const maybeBody = Array.from(parent.children)
				.find((e): e is HTMLBodyElement => e instanceof HTMLBodyElement);
			
			if (maybeBody)
				parent = maybeBody;
		}
		
		if (parent instanceof Document)
			parent = parent.body;
		
		const sections = Array.from(parent.children)
			.filter((e): e is HTMLElement => e instanceof HTMLElement)
			.filter(e => e.tagName === "SECTION");
		
		const sectionsSlice = sections.slice(rangeStart, rangeEnd);
		convertEmbeddedUrlsToAbsolute(parent, baseHref);
		const shadowRoots: HTMLElement[] = [];
		
		for (let i = -1; ++i < sectionsSlice.length;)
		{
			const section = sectionsSlice[i];
			const sectionIndex = sections.findIndex(e => e === section);
			
			if (section === sections[0])
			{
				// Special sanitizations is required for the poster section
			}
			
			const shadowRoot = document.createElement("div");
			shadowRoot.className = Webfeed.sceneClassName;
			
			const shadow = shadowRoot.attachShadow({ mode: "open" });
			const metaClones = metaElements.map(e => e.cloneNode(true));
			shadow.append(
				Util.createSheet("SECTION { height: 100%; }"),
				...metaClones
			);
			
			const fakeBody = document.createElement("body");
			fakeBody.style.setProperty("display", "contents", "important");
			shadow.append(fakeBody);
			
			// Cut off the wheel event, and the touchmove event which has a
			// similar effect as getting rid of overflow: auto or overflow: scroll
			// on desktops and on touch devices. This is a fairly blunt tool. It
			// may need to get more creative in the future for allowing certain
			// cases. But for now it should suffice.
			fakeBody.addEventListener("wheel", ev => ev.preventDefault(), { capture: true });
			fakeBody.addEventListener("touchmove", ev => ev.preventDefault(), { capture: true });
			
			for (let i = -1; ++i < sections.length;)
			{
				if (i === sectionIndex)
				{
					fakeBody.append(section);
				}
				else
				{
					const shim = document.createElement("div");
					shim.style.setProperty("display", "none", "important");
					fakeBody.append(shim);
				}
			}
			
			shadowRoots.push(shadowRoot);
		}
		
		return shadowRoots;
	}
	
	/**
	 * 
	 */
	function convertEmbeddedUrlsToAbsolute(parent: ParentNode, baseUrl: string)
	{
		const elements = queryElements(selectorForUrls, parent);
		
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
	 * Returns an array of HTMLElement objects that match the specified selector,
	 * optionally within the specified parent node.
	 */
	function queryElements(selector: string, container: ParentNode = document)
	{
		return Array.from(container.querySelectorAll(selector)) as HTMLElement[];
	}
}
