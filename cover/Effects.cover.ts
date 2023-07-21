
namespace Syndi.Cover
{
	/** */
	export function coverReelSingle()
	{
		const hot = setupCover();
		
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
				opacity: "calc((var(--inc) / 50) + 1)",
				width: "20%",
				height: "20%",
				background: "black",
			},
			".move", {
				position: "absolute",
				top: "40%",
				left: "calc(50% + (10px * var(--inc)))",
				width: "20%",
				height: "20%",
				background: "black",
			},
			`SECTION.${StandardClasses.fixed}`, {
				backgroundColor: "black",
			},
			`SECTION.${StandardClasses.fixed} .${StandardClasses.fixed}`, {
				backgroundColor: "black",
				opacity: "calc((var(--inc) + 1) / 100)"
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
				StandardClasses.fixed
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
		const hot = setupCover();
		
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
	
	/** */
	export function coverReelFadeInOut()
	{
		const hot = setupCover();
		
		document.body.append(
			hot.section(
				
			),
			hot.section(
				hot.h1(
					{
						opacity: "calc((var(--010) * 3) - 2)"
					},
					new Text("Fade In Fade Out")
				)
			),
			hot.section(
				
			),
		);
	}
	
	/** */
	export function coverReelMoveAcross()
	{
		const hot = setupCover();
		
		document.body.append(
			hot.section(
				
			),
			hot.section(
				hot.h1(
					{
						transform: "translateX(calc(var(--inc) * 150vw))",
					},
					new Text("Movin'")
				)
			),
			hot.section(
				
			),
		);
	}
	
	/** */
	export function coverReelFixed()
	{
		const hot = setupCover();
		
		document.body.append(
			hot.section(
				
			),
			hot.section(
				StandardClasses.fixed,
				hot.h1(
					{
						filter: "blur(calc(var(--101) * 100px))",
						opacity: "calc((var(--010) * 3) - 2)",
					},
					new Text("Solid.")
				)
			),
			hot.section(
				
			),
		);
	}
	
	/** */
	export function coverReelRanges()
	{
		const hot = setupCover();
		
		document.body.append(
			hot.style(
				".s1[if~='0.1,1'], .s1[if~='1,1']", {
					color: "red"
				}
			),
			hot.section(
				"s1",
				hot.div(
					{
						position: "absolute",
						bottom: 0,
					},
					new Text("Becomes red")
				)
			),
			hot.section(
				{
					backgroundColor: "crimson"
				}
			),
		);
	}
	
	/** */
	export function setupCover()
	{
		document.head.append(Syndi.getStandardCss());
		const hot = new Hot();
		
		hot.style(
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
		
		return hot;
	}
}
