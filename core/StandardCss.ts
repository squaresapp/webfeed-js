
namespace Libfeed
{
	export const standardCss = `
		HTML
		{
			scroll-snap-type: y mandatory;
		}
		HTML, BODY
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
	`.replace(/[\r\n\t]/g, "");
	
	//@ts-ignore
	if (typeof document === "undefined") return;
	
	/**
	 * Returns the standard CSS embedded within a <style> element.
	 * This <style> element should be inserted somewhere into the document
	 * in order for it to be visible.
	 */
	export function getStandardCss()
	{
		const style = document.createElement("style");
		style.textContent = standardCss;
		return style;
	}
}
