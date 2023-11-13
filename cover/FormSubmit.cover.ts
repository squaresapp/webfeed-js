
namespace HtmlFeed.Cover
{
	/** */
	export async function coverFormSubmit()
	{
		document.head.append(HtmlFeed.getStandardCss());
		
		const baseUrl = Cover.serve({
			"/": () =>
			{
				return `
					<section style="background-color: crimson">
						<form action="${baseUrl}submit">
							<button type="submit">Submit</button>
						</form>
					</section>
				`
			},
			"/submit": () =>
			{
				return `<p>The form has been submitted</p>`;
			}
		});
		
		await new Promise(r => setTimeout(r, 100));
		
		const page = await HtmlFeed.getPageFromUrl(baseUrl);
		if (!page)
			throw "?";
		
		document.body.append(...page.sections);
	}
}
