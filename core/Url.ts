
namespace Webfeed
{
	/**
	 * @internal
	 * A namespace of functions that perform URL manipulation.
	 */
	export namespace Url
	{
		/**
		 * Parses the specified URL string and returns a URL object,
		 * or null if the URL fails to parse.
		 */
		export function tryParse(url: string, base?: string)
		{
			try
			{
				return new URL(url, base);
			}
			catch (e) { }
			
			return null;
		}
		
		/**
		 * Returns the URL of the containing folder of the specified URL.
		 * The provided URL must be valid, or an exception will be thrown.
		 */
		export function folderOf(url: string)
		{
			const lo = tryParse(url);
			if (!lo)
				return null;
			
			const parts = lo.pathname.split("/").filter(s => !!s);
			const last = parts[parts.length - 1];
			
			if (/\.[a-z0-9]+$/i.test(last))
				parts.pop();
			
			const path = parts.join("/") + "/";
			return resolve(path, lo.protocol + "//" + lo.host);
		}
		
		/**
		 * Returns the URL provided in fully qualified form,
		 * using the specified base URL.
		 */
		export function resolve(path: string, base: string)
		{
			if (/^[a-z]+:/.test(path))
				return path;
			
			try
			{
				if (!base.endsWith("/"))
					base += "/";
				
				return new URL(path, base).toString();
			}
			catch (e)
			{
				debugger;
				return null as never;
			}
		}
		
		/**
		 * Gets the base URL of the document loaded into the current browser window.
		 * Accounts for any HTML <base> tags that may be defined within the document.
		 */
		export function getCurrent()
		{
			if (storedUrl)
				return storedUrl;
			
			let url = Url.folderOf(document.URL)!;
			
			const base = document.querySelector("base[href]");
			if (base)
			{
				const href = base.getAttribute("href") || "";
				if (href)
					url = Url.resolve(href, url);
			}
			
			return storedUrl = url;
		}
		let storedUrl = "";
	}
}
