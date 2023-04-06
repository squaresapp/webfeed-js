
namespace Reels.Cover
{
	/** */
	export function coverReelSingle()
	{
		const hot = new Hot();
		Reels.appendStandardCss();
		
		hot.style(
			"*", {
				fontFamily: "Inter, -apple-system, BlinkMacSystemFont, avenir next, avenir, segoe ui, helvetica neue, helvetica, Ubuntu, roboto, noto, arial, sans-serif",
			},
			"SECTION:nth-of-type(even)", {
				backgroundColor: "orange"
			},
			"SECTION:nth-of-type(odd)", {
				backgroundColor: "crimson"
			},
			".opacity", {
				position: "absolute",
				top: "40%",
				left: "40%",
				opacity: "calc((var(--vs) / 50) + 1)",
				width: "20%",
				height: "20%",
				background: "black",
			},
			".move", {
				position: "absolute",
				top: "40%",
				left: "calc(50% + (10px * var(--vs)))",
				width: "20%",
				height: "20%",
				background: "black",
			},
			`SECTION.${StandardClasses.lock}`, {
				backgroundColor: "black",
			},
			`SECTION.${StandardClasses.lock} .${StandardClasses.lock}`, {
				backgroundColor: "black",
				opacity: "calc((var(--vs) + 100) / 100)"
			}
		).attach();
		
		document.body.append(
			hot.section(
				
			),
			hot.section(
				"a@..-90",
				"b@-90..-80",
				"c@10",
				"d@20..",
				"e@",
				"f@..",
			),
			hot.section(
				StandardClasses.lock
			),
			hot.section(
				hot.div("opacity")
			),
			hot.section(
				hot.div("move")
			),
			hot.section(
				
			),
		);
	}
}
