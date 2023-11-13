
namespace Libfeed
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
		Libfeed.resolveRemoteSections();
		
		let last = document.querySelector("BODY > SECTION:last-of-type")!;
		if (!(last instanceof HTMLElement))
			return;
		
		const feedInfos = Libfeed.getFeedsFromDocument();
		for (const feedInfo of feedInfos)
		{
			if (!feedInfo.visible)
				continue;
			
			const urls = await Libfeed.getFeedUrls(feedInfo.href);
			if (!urls)
				continue;
			
			const omniview = Libfeed.getEmbeddedOmniviewFromFeed(urls);
			last.insertAdjacentElement("afterend", omniview);
			last = omniview;
		}
	}
	
	declare const module: any;
	typeof module === "object" && Object.assign(module.exports, { Libfeed });
}
