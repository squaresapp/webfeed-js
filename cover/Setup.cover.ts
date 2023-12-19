
namespace Webfeed.Cover
{
	/** */
	export function setupCover()
	{
		document.head.append(Webfeed.getStandardCss());
		
		raw.style(
			"HTML", {
				backgroundColor: "black",
				color: "white",
			},
			"*", {
				fontFamily: "Inter, -apple-system, BlinkMacSystemFont, avenir next, avenir, segoe ui, helvetica neue, helvetica, Ubuntu, roboto, noto, arial, sans-serif",
			},
			"H1", {
				position: "absolute",
				margin: "auto",
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				width: "fit-content",
				height: "fit-content",
				fontSize: "10vw",
				fontWeight: 900,
			},
			"SECTION", {
				overflow: "hidden",
			},
			"SECTION:nth-child(odd)", {
				backgroundColor: "#444",
			},
		).attach();
		
		return raw;
	}
}
