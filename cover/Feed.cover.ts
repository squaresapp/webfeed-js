
namespace Webfeed.Cover
{
	/** */
	export async function coverFeedMetadata()
	{
		const metaData = await Webfeed.getFeedMetaData("https://scrollapp.github.io/html-feed-examples/trees/index.txt");
	}
	
	/** */
	export function coverOmniview()
	{
		const raw = setupCover();
		const feed = Cover.generateFeedServer();
		const omniviewElement = Webfeed.getEmbeddedOmniviewFromFeed(feed);
		
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
