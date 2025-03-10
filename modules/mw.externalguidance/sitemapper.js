/**
 * Handles providing URLs to different wikis.
 *
 * @class
 * @param {Object} siteconfig
 */
function SiteMapper( siteconfig ) {
	this.config = siteconfig;
}

/**
 * Some wikis have domain names that do not match the content language.
 * See: wgLanguageCode in operations/mediawiki-config/wmf-config/InitialiseSettings.php
 *
 * @param {string} language Language code
 * @return {string}
 */
SiteMapper.prototype.getWikiDomainCode = function ( language ) {
	const languageToWikiDomainMapping = mw.config.get( 'wgExternalGuidanceDomainCodeMapping' );

	return languageToWikiDomainMapping[ language ] || language;
};

SiteMapper.prototype.getLanguageCodeForWikiDomain = function ( domain ) {
	const mapping = mw.config.get( 'wgExternalGuidanceDomainCodeMapping' );

	for ( const code in mapping ) {
		if ( mapping[ code ] === domain ) {
			return code;
		}
	}

	return domain;
};

/**
 * Get the API for a remote wiki.
 *
 * @param {string} language Language code
 * @param {Object} [options] Api options
 * @return {mw.ForeignApi} api
 */
SiteMapper.prototype.getApi = function ( language, options ) {
	const domain = this.getWikiDomainCode( language );
	const url = this.config.api.replace( '$1', domain );
	options = Object.assign( { anonymous: true }, options );
	return new mw.ForeignApi( url, options );
};

/**
 * Get a URL to an article in a wiki for a given language.
 *
 * @param {string} language Language code
 * @param {string} title Page title
 * @param {Object} [params] Query parameters
 * @return {string} URL with the given title. The URL is with protocol and domain.
 */
SiteMapper.prototype.getPageUrl = function ( language, title, params ) {
	let base = this.config.view,
		extra = '';

	const domain = this.getWikiDomainCode( language );
	if ( params && !$.isEmptyObject( params ) ) {
		base = this.config.action || this.config.view;
		// eslint-disable-next-line es-x/no-array-prototype-includes
		extra = ( base.includes( '?' ) ? '&' : '?' ) + $.param( params );
	}

	return base
		.replace( '$1', domain.replace( /\$/g, '$$$$' ) )
		.replace( '$2', mw.util.wikiUrlencode( title ).replace( /\$/g, '$$$$' ) ) + extra;
};

/**
 * Get the URL for Special:CX on the needed wiki
 * according to given source and target title and the target language.
 *
 * @param {string} sourceTitle
 * @param {string} targetTitle
 * @param {string} sourceLanguage
 * @param {string} targetLanguage
 * @param {Object} [extra] Additional query parameters
 * @return {string} URL
 */
SiteMapper.prototype.getCXUrl = function (
	sourceTitle,
	targetTitle,
	sourceLanguage,
	targetLanguage,
	extra
) {
	const cxPage = 'Special:ContentTranslation';
	const queryParams = Object.assign( {
		page: sourceTitle,
		from: sourceLanguage,
		to: targetLanguage,
		targettitle: targetTitle
	}, extra );

	// eslint-disable-next-line compat/compat, es-x/no-object-fromentries
	const currentParams = Object.fromEntries( new URLSearchParams( location.search ) );
	const uri = new URL( this.getPageUrl( targetLanguage, cxPage ) );
	// Merge the current params with queryParams
	uri.search = new URLSearchParams( Object.assign( {}, currentParams, queryParams ) );

	return uri.toString();
};

module.exports = SiteMapper;
