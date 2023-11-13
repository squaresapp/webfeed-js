
namespace HtmlFeed.Cover
{
	/** */
	export async function coverFormSubmit()
	{
		document.head.append(HtmlFeed.getStandardCss());
		const raw = new Raw();
		
		const baseUrl = Cover.serve({
			"/": () =>
			{
				return `
					<section>
						<form action="/submit">
							<button type="submit">Submit</button>
						</form>
					</section>
				`;
			},
			"/submit": () =>
			{
				return `<p>The form has been submitted</p>`;
			}
		});
		
		const style: Raw.Style = {
			textAlign: "center",
			fontSize: "10vw",
			fontWeight: 900,
			lineHeight: "100vh",
		};
		
		document.body.append(
			raw.section(
				{ backgroundColor: "crimson", ...style },
				raw.form({ action: "/submit" },
					raw.button({ type: "submit" }, raw.text("Submit"))
				),
			),
		);
	}
}
