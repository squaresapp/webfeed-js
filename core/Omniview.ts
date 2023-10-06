
namespace FeedBlit
{
	/**
	 * Returns an Omniview class that gets populated with the
	 * posters from the specified URLs.
	 */
	export function getOmniviewFromFeed(
		urls: string[],
		omniviewOptions: Partial<IOmniviewOptions>): unknown
	{
		if (typeof Omniview === "undefined")
			throw new Error("Omniview library not found.");
		
		const hot = new Hot();
		
		const defaultOptions: IOmniviewOptions = {
			getPoster: index =>
			{
				if (index >= urls.length)
					return null;
				
				return new Promise(async resolve =>
				{
					const poster = await FeedBlit.getPosterFromUrl(urls[index]);
					resolve(poster || getErrorPoster());
				});
			},
			fillBody: async (fillElement, selectedElement, index) =>
			{
				const url = urls[index];
				const reel = await FeedBlit.getReelFromUrl(url);
				if (!reel)
					return selectedElement.append(getErrorPoster());
				
				fillElement.append(
					FeedBlit.getSandboxedElement([...reel.head, ...reel.sections], reel.url)
				);
			}
		};
		
		const mergedOptions = Object.assign(omniviewOptions, defaultOptions);
		const omniview = new Omniview.Class(mergedOptions);
		
		hot.get(omniview)(
			hot.on("connected", () => omniview.gotoPosters())
		);
		
		return omniview;
	}
	
	/** */
	export interface IOmniviewOptions
	{
		/**
		 * Specifies the index of the topmost and leftmost poster in the poster
		 * list when the Omniview is first rendered. Numbers greater than zero
		 * allow back-tracking.
		 */
		anchorIndex?: number;
		
		/**
		 * A required function that returns the poster frame for a given position
		 * in the Omniview.
		 */
		getPoster: GetPosterFn;
		
		/**
		 * A required function that causes bodies to be filled with content
		 * when the poster is selected.
		 */
		fillBody: FillFn;
		
		/**
		 * Allows API consumers to supply their own container element for bodies
		 * to be placed in custom locations.
		 */
		getBodyContainer?: () => HTMLElement;
	}

	/**
	 * Returns a poster HTMLElement for the given index in the stream.
	 * The function should return null to stop looking for posters at or
	 * beyond the specified index.
	 */
	export type GetPosterFn = (index: number) => Promise<HTMLElement> | HTMLElement | null;
	
	/** */
	export type FillFn = (fillElement: HTMLElement, selectedElement: HTMLElement, index: number) => void | Promise<void>;
	
}
