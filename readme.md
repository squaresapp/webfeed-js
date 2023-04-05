
# HTML Reels

HTML Reels is a series of base primitives for building scrollable cinematic hypermedia pages, as well as a means to construct lightweight feeds of said pages. The feed format is extremely simple and can be connected to a compatible reader app, which allow HTML Reels to be syndicated directly to a user's device. HTML Reels are a foundational idea that forms the basis of a realistic future social media paradigm where *we the users* own our content and the means of its distribution.

HTML Reels is a purely client-side solution. **No special server software is required**, such as nodes, relays, blockchains, miners, or any centralized service. The hypermedia pages, the feeds, and the distribution process requires nothing more than generic static web hosting. You can distribute from Netlify, Vercel, GitHub pages, Surge.sh, Cloudflare Pages, a plain S3 bucket, old-school web hosting, or even a laptop in your garage with a static IP.

HTML Reels introduce almost nothing in terms of new technology. **This is by-design**. It's literally just a subset of standard HTML, some CSS classes that you can use to make cool stuff happen, and a text file (the feed) that contains a list of URLs. **That's it**. If you can make HTML & CSS pages, you already know 99.9% of what is needed to make HTML Reels.

HTML Reels present a real opportunity to fix a broken internet. Your own website, rather than a profile page on someone else's social platform, was intended as the atomic unit of online existence. This is what HTML Reels intends to restore.

**But you don't need to care about any social media reformation initiative to benefit from HTML reels.** At it's core, it's a low-effort framework that helps front-end developers build cinematic landing pages, and/or an entire blogs with cinematic content.


# How HTML Reels Compare with...

## IndieWeb

IndieWeb is more of a general concept of independent ownership of the web than a prescription for a specific set of technologies to achieve this. HTML Reels is more the prescription, and is generally aligned with the ideals of IndieWeb.

## RSS

Both HTML Reels and RSS share the same general idea of being able to operate entirely from static web hosting. However, the similarities end there. RSS effectively tried to re-invent the web on top of a XML-based design that has been described as "a cosmic black hole of incomprehensible, mind-bendingly awful suck". HTML Reels don't re-invent anything, it builds upon what is already working––HTML and CSS.

## Nostr

Nostr isn't so much of a social media protocol as it is a way to store small bits of data (< 64kb) on remote servers (which they call "relays"), and perform basic query operations on data stored on the relay. It doesn't address the problem of mass distribution of large media (images, videos), and most nostr clients seem to take a self-hosted approach which is what HTML Reels are about anyways. The nostr community is vibrant and growing, and it's possible that future apps could rely on both HTML reels and nostr for different features.
