# Huzzler Featured Badge Design

## Goal

Add the supplied Huzzler featured badge to the existing CogniFocus featured strip.

## Design

Add one item to the `badges` array in `src/components/layout/FeaturedStrip.astro` using:

- Destination: `https://huzzler.so/products/VLxT9cMVTF/cognifocus?utm_source=huzzler_product_website&utm_medium=badge&utm_campaign=free_listing`
- Image: `https://huzzler.so/assets/images/embeddable-badges/featured.png`
- Intrinsic dimensions: `159` by `55`
- Accessible label, image alternative text, and title identifying CogniFocus as featured on Huzzler

The shared strip renderer will continue to provide new-tab behavior, `noopener noreferrer`, lazy loading, asynchronous decoding, and responsive height normalization. No new CSS or JavaScript is required.

## Verification

- Run the production build.
- Confirm the generated site contains the Huzzler link and image URL.
- Confirm no unrelated files or featured-strip behavior changed.
