
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
		lock = "--lock",
		
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
		HTML, BODY, .${StandardClasses.body}
		{
			margin: 0;
			height: 100%;
			scroll-snap-type: y mandatory;
		}
		HTML
		{
			overflow-y: auto;
		}
		SECTION
		{
			position: relative;
			scroll-snap-align: start;
			scroll-snap-stop: always;
			height: 100%;
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
		.${StandardClasses.lock}
		{
			width: 100vw;
			height: 100vh;
			height: 100dvh;
			position: relative;
		}
		.${StandardClasses.strip}, .${StandardClasses.lock}
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
	 * 
	 */
	export function appendStandardCss(target: HTMLElement = document.head)
	{
		const style = document.createElement("style");
		style.textContent = standardCss;
		target.append(style);
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
				if (node.classList.contains(StandardClasses.lock))
					toLock(node);
			}
		}
		
		captureTriggerClasses();
	}
	
	/** */
	function toLock(section: HTMLElement)
	{
		const strip = document.createElement("div");
		strip.classList.add(StandardClasses.strip);
		
		const lock = document.createElement("div");
		lock.classList.add(StandardClasses.lock);
		
		lock.append(...Array.from(section.childNodes));
		strip.append(lock);
		section.append(strip);
	}
	
	/** */
	function captureTriggerClasses()
	{
		const qsa = document.querySelectorAll("[class*=\\@]");
		if (qsa.length === 0)
			return;
		
		const targets = Array.from(qsa) as HTMLElement[];
		for (const target of targets)
		{
			if (triggerClassMap.has(target))
				continue;
			
			const section = target.closest("SECTION");
			if (!(section instanceof HTMLElement))
				continue;
			
			for (const cls of Array.from(target.classList))
			{
				const parts = cls.split("@");
				if (parts.length !== 2)
					continue;
				
				const range = parts[1].split("..");
				
				if (range[0] === "")
					range[0] = "-100";
				
				if (range.length === 1)
					range.push("100");
				
				if (range[1] === "")
					range[1] = "100";
				
				let low = Number(range[0]);
				let high = Number(range[1]);
				
				if (low !== low || high !== high)
				{
					console.error("Invalid range: " + cls);
					continue;
				}
				
				if (low > high)
					[low, high] = [high, low];
				
				const tcls: ITriggerClass = { section, target, low, high, class: parts[0] };
				let triggerClasses = triggerClassMap.get(target);
				if (!triggerClasses)
				{
					triggerClasses = [tcls];
				}
				else
				{
					triggerClasses.push(tcls);
					triggerClasses.sort((a, b) => b.low - a.low);
				}
				
				triggerClassMap.set(section, triggerClasses);
			}
		}
	}
	
	/** */
	interface ITriggerClass
	{
		readonly section: HTMLElement;
		readonly target: HTMLElement;
		readonly low: number;
		readonly high: number;
		readonly class: string;
	}
	const triggerClassMap = new Map<HTMLElement, ITriggerClass[]>();
	
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
			
			let vs = rec.intersectionRatio * 100;
			
			if (rec.boundingClientRect.top >= 0)
				vs -= 100;
			else
				vs = 100 - vs;
			
			if (vs >= -1 && vs <= 1)
				vs = 0;
			
			if (vs > 99 && vs < 100)
				vs = 100;
			
			if (vs < -99 && vs > -100)
				vs = -100;
			
			if (e.classList.contains(StandardClasses.lock))
			{
				const strip = Array.from(e.children).find(e => e.classList.contains(StandardClasses.strip));
				if (strip instanceof HTMLElement)
				{
					if (Math.abs(vs) === 100)
						strip.style.visibility = "hidden";
					
					else if (strip.style.visibility === "hidden")
						strip.style.removeProperty("visibility");
				}
			}
			
			e.style.setProperty("--vs", vs.toString());
			
			const tcs = triggerClassMap.get(e);
			if (tcs)
				for (const tc of tcs)
					tc.target.classList.toggle(tc.class, vs >= tc.low && vs <= tc.high);
		}
	},
	{ threshold });
	
	registerRoot(document.body);
}
