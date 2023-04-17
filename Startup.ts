
namespace Reels
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
		Reels.resolveRemoteSections();
		
		let last = document.querySelector("BODY > SECTION:last-of-type")
		if (!(last instanceof HTMLElement))
			return;
		
		const feeds = Reels.getFeedsFromDocument();
		for (const feed of feeds)
		{
			if (feed.visible)
			{
				const omniview = await Reels.getOmniviewFromFeedUrl(feed.href);
				last.insertAdjacentElement("afterend", omniview);
				last = omniview;
			}
		}
	}
	
	typeof module === "object" && Object.assign(module.exports, { Reels });
}
