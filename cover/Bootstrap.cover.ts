
namespace Cover
{
	/** */
	export function coverBootstrap()
	{
		document.body.innerHTML = `
			<link rel="stylesheet" id="a">
			<style>
				SECTION
				{
					background-image: linear-gradient(45deg, orange, crimson);
				}
			</style>
			<section>
				<div>Poster section</div>
			</section>
			<section>
				<div>Middle section</div>
			</section>
			<section>
				<div>Last section</div>
			</section>
		`;
		
		Webfeed.bootstrap("http://www.example.com/");
	}
	
	declare const module: any;
	typeof module === "object" && Object.assign(module.exports, { Cover });
}
