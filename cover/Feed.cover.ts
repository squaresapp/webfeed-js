
namespace Reels.Cover
{
	/** */
	export function coverReelsOmniview()
	{
		const hot = setupCover();
		const feed = Cover.generateFeedServer();
		const omniview = Reels.getOmniviewFromFeed(feed);
		
		const style: Hot.Style = {
			textAlign: "center",
			fontSize: "10vw",
			fontWeight: 900,
			lineHeight: "100vh",
		};
		
		document.body.append(
			hot.section(
				{ backgroundColor: "crimson", ...style },
				hot.text("Poster"),
			),
			hot.section(
				{ backgroundColor: "orange", ...style },
				hot.text("Second section."),
			),
			omniview
		);
	}
}
