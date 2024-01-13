
namespace Cover
{
	/** */
	export async function coverPingIndex()
	{
		const indexUrl = "https://webfeed-tulips.pages.dev/index.txt";
		const pingResult = await Webfeed.pingIndex(indexUrl);
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
	export async function coverDownloadMetaData()
	{
		const indexUrl = "https://webfeed-tulips.pages.dev/index.txt";
		const meta = await Webfeed.downloadMetaData(indexUrl);
		return [
			() => meta !== null,
			() => meta?.author !== null,
			() => meta?.description !== null,
			() => meta?.icon !== null,
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
