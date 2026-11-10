# Run and publish StorySpace

The app is a dependency-free static site, with no build process or external services.

## Open offline

Clone or download the repository and open [index.html](../index.html) in a modern browser. The app loads [src/core.js](../src/core.js) and [src/app.js](../src/app.js) using ordinary classic script tags, so no local development server is required.

## GitHub Pages

Publishing the repo's static site requires enabling Pages on the repository; simply committing \`index.html\` does not guarantee the Pages URL is online.

1. Open **Settings → Pages** for \`enuminous/StorySpace\`.
2. Under **Build and deployment**, choose **Deploy from a branch**.
3. Select branch **main**, folder **/(root)**, then save.
4. When the Pages build completes, open **https://enuminous.github.io/StorySpace/**.

If Pages is disabled or otherwise restricted, use the offline HTML or serve the folder with a basic static web server. The Node tests can run without a server:

~~~sh
node --test tests/core.test.cjs
~~~

## Data safety

**No app request is sent to GitHub or to any remote URL.** Clicking a reading-source link is a separate user action. Records persist only in local browser storage; exporting downloads JSON onto your device. This makes the experience private by default but *not* tamperproof.

For reliable pre-event custody of a claimed prediction: export the JSON **before** the event, commit it to an independent repository or trusted timestamp service, and retain the verifiable external record. The app's \`frozenAt\` field and local clock do not prove when it existed.

## Confirmed checks

Repository workflow: [StorySpace scientific controls](https://github.com/enuminous/StorySpace/actions). The automated suite tests local temporal-priority rules, proper scoring, cycle protection, and application syntax.

**Research status:** No new physical measurement, no validated prediction advantage, and no proven retrocausal effect.
