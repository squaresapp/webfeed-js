
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
		
		
	}
}
