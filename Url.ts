
namespace Reels
{
	/**
	 * A namespace of functions that perform URL manipulation.
	 */
	export namespace Url
	{
		/**
		 * Returns the URL of the containing folder of the specified URL.
		 * The provided URL must be valid, or an exception will be thrown.
		 */
		export function folderOf(url: string)
		{
			const lo = new URL(url);
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
	}
}
