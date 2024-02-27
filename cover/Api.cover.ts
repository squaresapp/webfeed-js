
namespace Cover
{
	/** */
	export async function coverPingIndex()
	{
		const indexUrl = "https://webfeed-tulips.pages.dev/index.txt";
		const pingResult = await Webfeed.ping(indexUrl);
		return () => pingResult !== null && pingResult !== "";
	}
	
	/** */
	export async function coverDownloadIndex()
	{
		const indexUrl = "https://webfeed-tulips.pages.dev/index.txt";
		const index = await Webfeed.downloadIndex(indexUrl);
		return [
			() => index !== null,
			() => (index?.length || 0) > 0,
			() => Webfeed.Url.tryParse(index?.[0] || ""),
		];
	}
	
	/** */
	export async function coverDownloadDetails()
	{
		const indexUrl = "https://webfeed-tulips.pages.dev/index.txt";
		const details = await Webfeed.downloadDetails(indexUrl);
		return [
			() => details !== null,
			() => details?.author !== null,
			() => details?.description !== null,
			() => details?.icon !== null,
		];
	}
	
	/** */
	export async function coverDownloadPoster()
	{
		const indexUrl = "https://webfeed-tulips.pages.dev/index.txt";
		const index = await Webfeed.downloadIndex(indexUrl);
		if (index === null || index.length === 0)
			return () => false;
		
		const carouselUrl = index[0];
		const poster = await Webfeed.downloadPoster(carouselUrl);
		return () => poster instanceof HTMLElement;
	}
	
	/** */
	export async function coverDownloadSections()
	{
		const indexUrl = "https://webfeed-tulips.pages.dev/index.txt";
		const index = await Webfeed.downloadIndex(indexUrl);
		if (index === null || index.length === 0)
			return () => false;
		
		const carouselUrl = index[0];
		const sections = await Webfeed.downloadSections(carouselUrl);
		return () => (sections?.length || 0) > 1;
	}
}
