
namespace HtmlFeed.Cover
{
	/** */
	export async function coverReelsFeedMetadata()
	{
		const metaData = await HtmlFeed.getFeedMetaData("https://htmlreels.b-cdn.net/trees/index.txt");
	}
	
	/** */
	export function coverReelsOmniview()
	{
		const raw = setupCover();
		const feed = Cover.generateFeedServer();
		const omniviewElement = HtmlFeed.getEmbeddedOmniviewFromFeed(feed);
		
		const style: Raw.Style = {
			textAlign: "center",
			fontSize: "10vw",
			fontWeight: 900,
			lineHeight: "100vh",
		};
		
		document.body.append(
			raw.section(
				{ backgroundColor: "crimson", ...style },
				raw.text("Poster"),
			),
			raw.section(
				{ backgroundColor: "orange", ...style },
				raw.text("Second section."),
			),
			omniviewElement
		);
	}
}
