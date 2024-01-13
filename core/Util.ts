
/**
 * @internal
 */
namespace Webfeed.Util
{
	/** */
	export function createSheet(cssText: string)
	{
		const parser = new DOMParser();
		const html = `<style>${cssText}</style>`;
		const doc = parser.parseFromString(html, "text/html");
		return doc.querySelector("style")!;
	}
	
	/** */
	export function hash(str: string)
	{
		let hash = 0;
		for (let i = 0; i < str.length; i++)
		{
			const char = str.charCodeAt(i);
			hash = (hash << 5) - hash + char;
			hash &= hash;
		}
		
		return new Uint32Array([hash])[0].toString(36);
	}
}
