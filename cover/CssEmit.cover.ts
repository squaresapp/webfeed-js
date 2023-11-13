/// <reference path="../core/StandardCss.ts" />

namespace Libfeed.Cover
{
	/** */
	export function coverCssEmit()
	{
		const fs = require("fs") as typeof import("fs");
		const path = require("path") as typeof import("path");
		const out = path.join(process.cwd(), "+build/libfeed.css");
		fs.writeFileSync(out, Libfeed.standardCss);
	}
	
	// Auto-run the cover function if called during the build script.
	typeof process !== "undefined" && setTimeout(() =>
	{
		if (Array.isArray(process.argv) && process.argv.includes("--emit-css"))
			coverCssEmit();
	});
}
