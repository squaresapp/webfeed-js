/// <reference path="../Effects.ts" />

namespace Reels.Cover
{
	/** */
	export function coverReelsCssEmit()
	{
		const fs = require("fs") as typeof import("fs");
		const path = require("path") as typeof import("path");
		const out = path.join(process.cwd(), "+build/reels.css");
		fs.writeFileSync(out, Reels.standardCss);
	}
	
	// Auto-run the cover function if called during the build script.
	typeof process !== "undefined" && setTimeout(() =>
	{
		if (Array.isArray(process.argv) && process.argv.includes("--emit-css"))
			coverReelsCssEmit();
	});
}
