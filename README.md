# ExternalGuidance MediaWiki Extension

Wikipedia content gets exposed externally in different ways, and this project intends to make it easy for people to be able to return to the origin and contribute to it.

For example, a page might be machine translated and presented to user in an external site like Google translate. This extension informs the user about the translation and possibility of editing that page, by visiting the original wiki. The extension also removes or fixes some page features that won't work in such external contexts. For example, a user cannot edit from a Google translated page. So the edit links will be removed.

For more information about the extension, visit https://mediawiki.org/wiki/Extension:ExternalGuidance

## Installation

Clone the repository as follows:

```lang=bash
 cd extensions
 git clone https://gerrit.wikimedia.org/r/p/mediawiki/extensions/ExternalGuidance.git
```

## Configuration

### Simulating the external context

Sometimes, especially while developing the extension, you may want to simulate that the MediaWiki pages are presented in a context
that triggers the External Guidance. For that enable the `ExternalGuidanceSimulate` configuration. You can do this by setting the following value in LocalSettings.php

```lang=php
$GLOBALS['wgExternalGuidanceSimulate'] = true;
```

Note that by default, this is disabled.

### Configure the external machine translation hosts that trigger this extension

To activate the External Guidance for certain machine translation services, you can configure their hostnames in `ExternalGuidanceMTReferrers` configuration. The value is an array. An example:

```lang=php
$GLOBALS['wgExternalGuidanceMTReferrers']: [ "translate.google.com", "translate.googleusercontent.com" ];
```

This means, if a MediaWiki page is presented to user by a host translate.google.com, this extension features will be triggered.