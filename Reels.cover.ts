
namespace Reels.Cover
{
	const baseUrl = "http://localhost:8080/";
	
	/** */
	export async function coverReelsEmbed()
	{
		const view = createVirtualDevice();
		document.head.append(Reels.getFrameCss(view), Reels.getSceneCss());
		await Reels.embed(baseUrl, view);
		console.log("Done");
	}
	
	/** */
	export async function coverReelsLaunch()
	{
		const hot = new Hot();
		
		// Setup
		const doc = await Reels.readDocumentFromUrl(baseUrl);
		if (!doc)
			throw "?";
		
		document.head.append(
			hot.base({ href: baseUrl }),
			Reels.getFrameCss(),
			Reels.getSceneCss(),
			...Array.from(doc.head.childNodes));
		
		document.body.append(...Array.from(doc.body.childNodes));
		await Reels.launch();
	}
	
	/** */
	export async function coverReelsFeed()
	{
		const hot = new Hot();
		
		const yessStory = await Reels.readReel(baseUrl);
		if (!yessStory)
			throw "?";
		
		const feedContainerElement = hot.div({
			position: "relative",
			height: "100%",
			zIndex: 1,
			backgroundColor: "black",
			color: "white",
		});
		
		const root = createVirtualDevice();
		root.append(feedContainerElement);
		
		for await (const entry of Reels.readPosters(yessStory.feed))
		{
			if (!entry.scene)
				continue;
			
			feedContainerElement.append(hot.div(
				"scene-container",
				{
					width: "33.3333%",
					height: "33.3333%",
					float: "left",
					scrollSnapAlign: "start",
					outline: "1px solid cyan",
					outlineOffset: "-1px",
				},
				hot.get(entry.scene)(
					{
						position: "absolute",
						top: 0,
						left: 0,
						width: "100%",
						height: "100%",
						transformOrigin: "0 0",
						transform: "scale(0.33333)"
					}
				)
			));
		}
	}
	
	/** */
	function createVirtualDevice()
	{
		const hot = new Hot();
		
		let root: HTMLElement = null!;
		
		document.body.append(
			hot.div(
				hot.css(" *", {
					position: "relative",
				}),
				"virtual-device",
				{
					borderRadius: "30px",
					overflow: "hidden",
					backgroundColor: "black",
					position: "absolute",
					margin: "auto",
					top: 0,
					left: 0,
					bottom: 0,
					right: 0,
					aspectRatio: "1 / 1",
					maxWidth: "90vw",
					maxHeight: "90vh",
				},
				root = hot.div(
					"virtual-device-scrollable",
					{
						position: "absolute",
						top: 0,
						left: 0,
						bottom: 0,
						right: 0,
						height: "100%",
					}
				)
			)
		);
		
		return root;
	}
}
