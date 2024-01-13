
namespace Cover
{
	/** */
	export async function coverFormSubmit()
	{
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
		
		const sections = await Webfeed.downloadSections(baseUrl);
		if (!sections)
			throw "?";
		
		document.body.append(...sections);
	}
}
