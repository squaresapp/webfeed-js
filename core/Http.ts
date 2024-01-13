
/**
 * @internal
 */
namespace Webfeed.Http
{
	/**
	 * Makes an HTTP request to the specified URI and returns
	 * the headers and a string containing the body.
	 */
	export async function request(
		relativeUri: string, 
		options: IHttpRequestOptions = {})
	{
		relativeUri = Url.resolve(relativeUri, Url.getCurrent());
		
		try
		{
			const fetchResult = await window.fetch(relativeUri, {
				method: options.method || "GET",
				headers: options.headers || {},
				mode: "cors",
			});
			
			if (!fetchResult.ok)
			{
				console.error("Fetch failed: " + relativeUri);
				return null;
			}
			
			let body = "";
			
			try
			{
				body = await fetchResult.text();
			}
			catch (e)
			{
				if (!options.quiet)
					console.error("Fetch failed: " + relativeUri);
				
				return null;
			}
			
			return {
				headers: fetchResult.headers,
				body,
			};
		}
		catch (e)
		{
			if (!options.quiet)
				console.log("Error with request: " + relativeUri);
			
			return null;
		}
	}
	
	/** */
	interface IHttpRequestOptions
	{
		method?: string;
		headers?: HeadersInit;
		quiet?: boolean;
	}
}
