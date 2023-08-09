/// <reference path="../core/Effects.ts" />

namespace FeedBlit.Cover
{
	/** */
	export function coverFeedBlitCssEmit()
	{
		const fs = require("fs") as typeof import("fs");
		const path = require("path") as typeof import("path");
		const out = path.join(process.cwd(), "+build/feedblit.css");
		fs.writeFileSync(out, FeedBlit.standardCss);
	}
	
	// Auto-run the cover function if called during the build script.
	typeof process !== "undefined" && setTimeout(() =>
	{
		if (Array.isArray(process.argv) && process.argv.includes("--emit-css"))
			coverFeedBlitCssEmit();
	});
}
