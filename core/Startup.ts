
namespace Syndi
{
	/**
	 * Main entry point for when the reals.js script is 
	 * embedded within a web page.
	 */
	if (typeof document !== "undefined" && 
		typeof window !== "undefined" &&
		document.readyState !== "complete")
	{
		window.addEventListener("DOMContentLoaded", () => startup());
	}
	
	/** */
	async function startup()
	{
		Syndi.resolveRemoteSections();
		
		let last = document.querySelector("BODY > SECTION:last-of-type")
		if (!(last instanceof HTMLElement))
			return;
		
		const feedInfos = Syndi.getFeedsFromDocument();
		for (const feedInfo of feedInfos)
		{
			if (feedInfo.visible)
			{
				const { urls } = await Syndi.getFeedFromUrl(feedInfo.href);
				const omniview = Syndi.getEmbeddedOmniviewFromFeed(urls);
				last.insertAdjacentElement("afterend", omniview);
				last = omniview;
			}
		}
	}
	
	typeof module === "object" && Object.assign(module.exports, { Syndi });
}
