
namespace FeedBlit
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
		FeedBlit.resolveRemoteSections();
		
		let last = document.querySelector("BODY > SECTION:last-of-type")!;
		if (!(last instanceof HTMLElement))
			return;
		
		const feedInfos = FeedBlit.getFeedsFromDocument();
		for (const feedInfo of feedInfos)
		{
			if (feedInfo.visible)
			{
				const { urls } = await FeedBlit.getFeedFromUrl(feedInfo.href);
				const omniview = FeedBlit.getEmbeddedOmniviewFromFeed(urls);
				last.insertAdjacentElement("afterend", omniview);
				last = omniview;
			}
		}
	}
	
	declare const module: any;
	typeof module === "object" && Object.assign(module.exports, { FeedBlit });
}
