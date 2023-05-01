<p align="center">
	<img src="readme-poster.png" alt="HTML Reels Poster Image">
</p>

# HTML Reels

HTML Reels is a series of base primitives for building scrollable cinematic hypermedia pages, as well as a means to construct lightweight feeds of said pages. The feed format is extremely simple and can be connected to a compatible reader app, which allow HTML Reels to be syndicated directly to a user's device. HTML Reels are a foundational idea that forms the basis of a realistic future social media paradigm where *we the users* own our content and the means of its distribution.

HTML Reels is a purely client-side solution. **No special server software is required**, such as nodes, relays, blockchains, miners, or any centralized service. The hypermedia pages, the feeds, and the distribution process requires nothing more than generic static web hosting. You can distribute from Netlify, Vercel, GitHub pages, Surge.sh, Cloudflare Pages, a plain S3 bucket, old-school web hosting, or even a laptop in your garage with a static IP.

HTML Reels introduce almost nothing in terms of new technology. **This is by-design**. It's literally just a subset of standard HTML, some CSS primitives that you can use to make cool stuff happen, and a `text/uri-list` file (the feed). **That's it**. If you can make HTML & CSS pages, you already know 99.9% of what is needed to make HTML Reels.

HTML Reels present a real opportunity to fix a broken internet. The atomic unit of online existence was intended to be your own website. Not some profile page on someone else's social platform. This is what HTML Reels intends to restore.

**But you don't need to care about any social media reformation initiative to benefit from HTML reels.** At it's core, it's a low-effort framework that helps front-end developers build cinematic landing pages, and/or an entire blogs with cinematic posts.

## Example

Below is a basic example of an HTML Reel being scrolled. You can see the source code behind this reel [here](samples/basic.html).

<p align="center">
	<img src="readme.gif" alt="HTML Reels Example">
</p>

Effects like these only require a few lines of code. Check out the [effects documentation](docs/effects.md) for more information.

## Feed Display

The reels.js library has the ability to render an *Omniview*, which is a tiled view of previews of other posts in a feed-like format. The video below demonstrates this:

<p align="center">
	<img src="docs/Omniview.gif" alt="HTML Reels Example">
</p>

# How HTML Reels Compare with...

## IndieWeb

IndieWeb is more of a general concept of independent ownership of the web than a prescription for a specific set of technologies to achieve this. HTML Reels is more the prescription, and is generally aligned with the ideals of IndieWeb.

## RSS

Both HTML Reels and RSS share the same general idea of being able to operate entirely from static web hosting. However, the similarities end there. RSS was an epic failure for a multitude of reasons, but most notably because it effectively tried to re-invent the web with a weak XML-based design. By contrast, HTML Reels don't re-invent anything. It's just a way of using what already works––HTML and CSS.

## Nostr

Nostr isn't so much of a social media protocol as it is a way to store small bits of data (< 64kb) on remote servers (called "relays"), and perform basic query operations on that data. It doesn't address the problem of mass distribution of large media (images, videos), and most nostr clients seem to take a self-hosted approach which is what HTML Reels are about anyways. The nostr community is vibrant and growing, and it's possible that future media distribution apps could rely on both HTML reels and nostr for different features.
