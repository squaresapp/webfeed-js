
namespace Reels
{
	/**
	 * An enumeration that defines the CSS classes that are used
	 * to control the behavior of a reel.
	 */
	export enum StandardClasses
	{
		/**
		 * Applied to an HTML container element that is intended to
		 * operate as a top-level scene-containing element, but is not
		 * a <body> tag.
		 */
		body = "--body",
		
		/**
		 * Applied to a <section> to indicate that it says fixed in place
		 * during it's visiblity lifecycle, rather than scrolling with the page.
		 */
		fixed = "--fixed",
		
		/**
		 * Applied to the element 
		 */
		strip = "--strip",
		
		/**
		 * Applied to a <section> to indicate that the scene is longer than
		 * a full screen of height. Scenes with this class are at least 200vh
		 * in height (which is necessary in order to avoid the undesirable
		 * scroll-snap related jumping behavior that exists in browsers)
		 */
		long = "--long",
	}
	
	export const standardCss = `
		HTML, .${StandardClasses.body}
		{
			scroll-snap-type: y mandatory;
		}
		HTML, BODY, .${StandardClasses.body}
		{
			margin: 0;
			padding: 0;
			height: 100%;
		}
		HTML
		{
			overflow-y: auto;
			height: 100%;
		}
		SECTION
		{
			position: relative;
			scroll-snap-align: start;
			scroll-snap-stop: always;
			height: 100%;
		}
		[if*="0.2"] SECTION[src], SECTION[data-src]
		{
			background-color: black !important;
		}
		SECTION[src] *, SECTION[data-src] *
		{
			display: none !important;
		}
		SECTION.${StandardClasses.long}
		{
			height: auto;
			min-height: 200.1vh;
		}
		SECTION.${StandardClasses.long}::after
		{
			content: "";
			position: absolute;
			left: 0;
			right: 0;
			bottom: 0;
			height: 0;
			visibility: hidden;
			scroll-snap-align: end;
		}
		.${StandardClasses.strip}
		{
			position: fixed !important;
			top: 0 !important;
			left: 0 !important;
			width: 0 !important;
			height: 100% !important;
		}
		.${StandardClasses.fixed}
		{
			width: 100vw;
			height: 100vh;
			height: 100dvh;
			position: relative;
		}
		.${StandardClasses.strip}, .${StandardClasses.fixed}
		{
			background-color: inherit;
		}
		SECTION[src], SECTION[data-src]
		{
			display: none;
		}
	`.replace(/[\r\n\t]/g, "");
	
	//@ts-ignore
	if (typeof document === "undefined") return;
	
	/**
	 * Returns the standard Reel CSS embedded within a <style> element.
	 * This <style> element should be inserted somewhere into the document
	 * in order for it to 
	 */
	export function getStandardCss()
	{
		const style = document.createElement("style");
		style.textContent = standardCss;
		return style;
	}
	
	/**
	 * Registers a particular node as the root DOM Node that 
	 * directly contains the sections to include in a reel.
	 */
	export function registerRoot(root: Node)
	{
		new MutationObserver(records =>
		{
			for (const rec of records)
				adjustNodes(rec.addedNodes)
			
		}).observe(root, { childList: true });
		
		adjustNodes(root.childNodes);
	}
	
	/** */
	function adjustNodes(nodes: NodeList)
	{
		for (const node of Array.from(nodes))
		{
			if (node instanceof HTMLElement && node.nodeName === "SECTION")
			{
				io.observe(node);
				if (node.classList.contains(StandardClasses.fixed))
					toFixed(node);
			}
		}
		
		//captureTriggerClasses();
		captureRanges(document.body);
	}
	
	/** */
	function toFixed(section: HTMLElement)
	{
		const strip = document.createElement("div");
		strip.classList.add(StandardClasses.strip);
		
		const fixed = document.createElement("div");
		fixed.classList.add(StandardClasses.fixed);
		
		fixed.append(...Array.from(section.childNodes));
		strip.append(fixed);
		section.append(strip);
	}
	
	//# Ranges
	
	/** */
	function captureRanges(container: ParentNode)
	{
		for (const rule of eachCssRule(container))
		{
			const matches = rule.selectorText.match(reg);
			for (const match of matches || [])
			{
				const parts = match
					.replace(/[^\.,\d]/g, "")
					.split(`,`);
				
				let low = parts[0] === "" ? -1 : Number(parts[0]) || -1;
				let high = parts[1] === "" ? 1 : Number(parts[1]) || 1;
				
				low = Math.max(-1, Math.min(1, low));
				high = Math.min(1, Math.max(-1, high));
				
				if (high < low)
					low = high;
				
				rangePairs.set(low + `,` + high, [low, high]);
			}
		}
	}
	
	const reg = /\[\s*if\s*~=("|')-?(1|0|0\.\d+),\-?(1|0|0\.\d+)("|')]/g;
	const rangePairs = new Map<string, [number, number]>();
	
	/** */
	function * eachCssRule(container: ParentNode)
	{
		const sheetContainers = [
			...Array.from(container.querySelectorAll("STYLE")) as HTMLStyleElement[],
			...Array.from(container.querySelectorAll("LINK")) as HTMLLinkElement[],
		];
		
		const sheets = sheetContainers
			.filter(e => !processedSheetContainers.has(e))
			.map(e => e.sheet)
			.filter((sh): sh is CSSStyleSheet => !!sh);
		
		sheetContainers.forEach(e => processedSheetContainers.add(e));
		
		function * recurse(rules: CSSRuleList)
		{
			for (let i = -1; ++i < rules.length;)
			{
				const rule = rules[i];
				if (rule instanceof CSSGroupingRule)
					recurse(rule.cssRules);
				
				else if (rule instanceof CSSStyleRule)
					yield rule;
			}
		};
		
		for (const sheet of sheets)
			yield * recurse(sheet.cssRules);
	}
	const processedSheetContainers = new WeakSet<HTMLElement>();
	
	//# Intersection Observer
	
	const threshold = new Array(1000).fill(0).map((_, i) => i / 1000);
	const io = new IntersectionObserver(records =>
	{
		for (const rec of records)
		{
			// The target will be a different element when dealing
			// with position: fixed <section> elements.
			const e = rec.target;
			if (!(e instanceof HTMLElement))
				continue;
			
			let inc = rec.intersectionRatio;
			
			if (rec.boundingClientRect.top >= 0)
				inc -= 1;
			else
				inc = 1 - inc;
			
			if (inc >= -0.01 && inc <= 0.01)
				inc = 0;
			
			if (inc > 0.99 && inc < 1)
				inc = 1;
			
			if (inc < -0.99 && inc > -1)
				inc = -1;
			
			if (e.classList.contains(StandardClasses.fixed))
			{
				const strip = Array.from(e.children).find(e => e.classList.contains(StandardClasses.strip));
				if (strip instanceof HTMLElement)
				{
					if (Math.abs(inc) === 1)
						strip.style.visibility = "hidden";
					
					else if (strip.style.visibility === "hidden")
						strip.style.removeProperty("visibility");
				}
			}
			
			const v100 = Math.abs(Math.min(inc, 0));
			const v010 = 1 - Math.abs(inc);
			const v001 = Math.max(0, inc);
			const v110 = 1 - Math.max(0, inc);
			const v011 = Math.min(1, inc + 1);
			const v101 = Math.abs(inc);
			
			e.style.setProperty("--100", v100.toString());
			e.style.setProperty("--010", v010.toString());
			e.style.setProperty("--001", v001.toString());
			e.style.setProperty("--110", v110.toString());
			e.style.setProperty("--011", v011.toString());
			e.style.setProperty("--101", v101.toString());
			e.style.setProperty("--inc", inc.toString());
			e.style.setProperty("--dec", (inc * -1).toString());
			
			const ifAttr: string[] = [];
			
			for (const [low, high] of rangePairs.values())
				if (inc >= low && inc <= high)
					ifAttr.push(low + `,` + high);
			
			e.setAttribute("if", ifAttr.join(" "));
		}
	},
	{ threshold });
	
	registerRoot(document.body);
}
