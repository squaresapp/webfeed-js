/// <reference path="../core/Effects.ts" />

namespace HtmlFeed.Cover
{
	/** */
	export function coverCssEmit()
	{
		const fs = require("fs") as typeof import("fs");
		const path = require("path") as typeof import("path");
		const out = path.join(process.cwd(), "+build/htmlfeed.css");
		fs.writeFileSync(out, HtmlFeed.standardCss);
	}
	
	// Auto-run the cover function if called during the build script.
	typeof process !== "undefined" && setTimeout(() =>
	{
		if (Array.isArray(process.argv) && process.argv.includes("--emit-css"))
			coverCssEmit();
	});
}
