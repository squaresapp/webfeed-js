
namespace Yess
{
	/**
	 * 
	 */
	export class Multiplexer
	{
		/** */
		constructor()
		{
			
		}
		
		/** */
		addStreamUrl(streamUrl: string)
		{
			
		}
	}
	
	/** */
	export class Stream
	{
		/** */
		static async from(url: string)
		{
			return new Stream(url);
		}
		
		/** */
		private constructor(readonly url: string)
		{
			
		}
	}
	
	/** */
	export class StreamSource
	{
		/** */
		constructor(url: string)
		{
			this.url = Url.resolve(url, Yess.getDocumentBaseUrl());
		}
		
		/**
		 * A fully-qualified URL to the text file that contains the stream information.
		 */
		url = "";
		
		/**
		 * Downloads any new content from the stream.
		 */
		async ping()
		{
			const fetchResult = await Yess.readHttpUri(this.url);
			if (!fetchResult)
				return;
			
			const storyUrls = fetchResult.text
				.split("\n")
				.map(s => s.trim())
				.filter(s => !!s)
				.map(s => Url.resolve(s, Url.folderOf(this.url)));
			
			this.storyUrls.length = 0;
			this.storyUrls.push(...storyUrls);
		}
		
		private readonly storyUrls: string[] = [];
		
		/**
		 * 
		 */
		read(start = 0, length = 1)
		{
			if (length < 1)
				length = this.storyUrls.length;
			
			const urls = this.storyUrls.slice(start, start + length);
			
			return urls.map(url => new Promise<ISceneInfo | null>(async r =>
			{
				const yessData = await readFromUrl(url);
				if (!yessData || yessData.sections.length === 0)
					return r(null);
				
				const posterSection = yessData.sections[0];
				const posterScene = Yess.toScene(posterSection, url);
				if (!posterScene)
					return r(null);
				
				r({
					title: yessData.title,
					head: posterScene,
					url,
				});
			}));
		}
	}
	
	/** */
	export interface ISceneInfo
	{
		readonly title: string;
		readonly url: string;
		readonly head: HTMLElement;
	}
}
