
namespace Reels.Cover
{
	/** */
	export function coverReelsOmniview()
	{
		const hot = setupCover();
		const feed = Cover.generateFeedServer();
		const omniview = Reels.getOmniviewFromFeed(feed);
		
		document.body.append(
			hot.section(
				{ backgroundColor: "crimson" },
				hot.text("Poster"),
			),
			hot.section(
				{ backgroundColor: "orange" },
				hot.text("Second section."),
			),
			omniview
		);
	}
}
