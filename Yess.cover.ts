
namespace Yess.Cover
{
	const hot = new Hot();
	const baseUrl = "http://localhost:8080/";
	
	/** */
	export async function coverYessEmbed()
	{
		const view = createVirtualDevice();
		document.head.append(Yess.getFrameCss(view), Yess.getSceneCss());
		await Yess.embed(baseUrl, view);
		console.log("Done");
	}
	
	/** */
	export async function coverYessLaunch()
	{
		// Setup
		const doc = await Yess.readDocumentFromUrl(baseUrl);
		if (!doc)
			throw "?";
		
		document.head.append(
			hot.base({ href: baseUrl }),
			Yess.getFrameCss(),
			Yess.getSceneCss(),
			...Array.from(doc.head.childNodes));
		
		document.body.append(...Array.from(doc.body.childNodes));
		await Yess.launch();
	}
	
	/** */
	export async function coverYessStream()
	{
		const yessData = await Yess.readFromUrl(baseUrl);
		if (!yessData)
			throw "?";
		
		const streamContainerElement = hot.div({
			position: "relative",
			height: "100%",
			zIndex: 1,
			backgroundColor: "black",
			color: "white",
		});
		
		const root = createVirtualDevice();
		root.append(streamContainerElement);
		
		for await (const entry of Yess.readStream(yessData.stream))
		{
			if (!entry.scene)
				continue;
			
			streamContainerElement.append(hot.div(
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
	export async function coverYessJsMultiplexer()
	{
		const mux = new Multiplexer();
		mux.addStreamUrl(baseUrl + "source-1/");
		mux.addStreamUrl(baseUrl + "source-2/");
	}
	
	/** */
	function createVirtualDevice()
	{
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
