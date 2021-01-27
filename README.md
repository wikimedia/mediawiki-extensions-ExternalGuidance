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

Add this to the LocalSettings.php to enable the extension

```lang=php
wfLoadExtension( 'ExternalGuidance' );
```

## Configuration

### Configure the external machine translation hosts that trigger this extension

To activate the External Guidance for certain machine translation services, you can configure their hostnames in `ExternalGuidanceMTReferrers` configuration. The value is an array. An example:

```lang=php
$wgExternalGuidanceMTReferrers = [ "translate.google.com", "translate.googleusercontent.com" ];
```

This means, if a MediaWiki page is presented to user by a host translate.google.com, this extension features will be triggered.

### Configure site URL templates for other language wikis

Since this extension is for wiki systems with a wiki per language, we need to know how to navigate to those wikis. Also we will require to use the apis of those wikis. `ExternalGuidanceSiteTemplates` configuration allows to define them. The value for this configuration is a key-value pair as illustrated below:

```lang=json
{
    "view": "//$1.wikipedia.org/wiki/$2",
    "action": "//$1.wikipedia.org/w/index.php?title=$2",
    "api": "//$1.wikipedia.org/w/api.php"
}
```

### Configure language to domain mapping

For various reasons, the domain name in the URLs for wikis may not be same as the language code. At least in wikipedia, that is the case. This configuration allows to define that mapping using `ExternalGuidanceDomainCodeMapping` configuration as illustrated below:

```lang=json
{
    "be-tarask": "be-x-old",
    "bho": "bh"
}
```

### Enable or Disable external context detection

If the context detection is not required in a wiki, but want to have Special:ExternalGuidance to accept traffic from the context detected from other wikis, use the following configuration

```lang=php
$wgExternalGuidanceEnableContextDetection = false;
```
