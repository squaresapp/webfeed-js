
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
				"a@-1..-0.9",
				"b@-0.9..-0.8",
				"c@0.1",
				"d@0.2..",
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
	
	/** */
	export function coverReelProgressFunctions()
	{
		const hot = new Hot();
		Reels.appendStandardCss();
		
		document.body.append(
			hot.style(
				"DIV", {
					position: "relative",
					border: "10px solid blue",
					width: "100px",
					height: "100px",
					textAlign: "center",
					color: "white",
					fontWeight: 900,
				}
			),
			hot.section(
				{
					backgroundColor: "crimson",
				}
			),
			hot.section(
				{
					backgroundColor: "black",
				},
				hot.div(new Text("100"), { left: "calc(var(--100) * 100px)" }),
				hot.div(new Text("010"), { left: "calc(var(--010) * 100px)" }),
				hot.div(new Text("001"), { left: "calc(var(--001) * 100px)" }),
				hot.div(new Text("110"), { left: "calc(var(--110) * 100px)" }),
				hot.div(new Text("011"), { left: "calc(var(--011) * 100px)" }),
				hot.div(new Text("101"), { left: "calc(var(--101) * 100px)" }),
			),
			hot.section(
				{
					backgroundColor: "orange"
				}
			),
		);
	}
}
