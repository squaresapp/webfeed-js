
namespace Reels.Cover
{
	/** */
	export function generateFeedServer()
	{
		const routeTable: IRouteTable = {};
		
		for (let i = -1; ++i < 20;)
			routeTable["reel-" + i] = () => generateReel();
		
		const baseUrl = Cover.serve(routeTable);
		return Object.keys(routeTable).map(k => baseUrl + k);
	}
	
	/** */
	export function generateReel(...sections: HTMLElement[])
	{
		const hot = Hotdom.createHot();
		
		if (sections.length === 0)
			for (let i = -1; i++ < 4;)
				sections.push(generateSection());
		
		const nodes: HTMLElement[] = [
			hot.style(
				hot.text(Reels.getStandardCss().textContent || "")
			),
			hot.style(
				"SECTION", {
					backgroundImage: "linear-gradient(45deg, black, #555)",
					textAlign: "center",
					color: "white",
					fontFamily: "Inter",
					fontSize: "5vw",
					fontWeight: 900
				},
				"DIV", {
					position: "absolute",
					top: 0,
					right: 0,
					left: 0,
					bottom: 0,
					margin: "auto",
					width: "fit-content",
					height: "fit-content",
				}
			),
			...sections
		];
		
		return Hotdom.emit({ doctype: true, minify: false }, ...nodes);
	}
	
	/** */
	export function generateSection()
	{
		const hot = Hotdom.createHot();
		return hot.section(
			hot.div(
				hot.text(generateSentence())
			)
		);
	}
	
	/** */
	export function generateSentence(wordCount = 4)
	{
		const wordList = Hot.elements.slice();
		const words: string[] = [];
		
		for (let i = -1; ++i < wordCount;)
		{
			const num = ++seed * (2 ** 16) % wordList.length;
			words.push(wordList[num]);
		}
		
		const w0 = words[0];
		return [w0.slice(0, 1).toUpperCase() + w0.slice(1), ...words.slice(1)].join(" ");
	}
	
	let seed = 0;
}
