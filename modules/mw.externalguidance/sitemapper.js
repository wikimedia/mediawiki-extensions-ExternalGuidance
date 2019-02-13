( function () {
	'use strict';

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
		var languageToWikiDomainMapping = mw.config.get( 'wgExternalGuidanceDomainCodeMapping' );

		return languageToWikiDomainMapping[ language ] || language;
	};

	SiteMapper.prototype.getLanguageCodeForWikiDomain = function ( domain ) {
		var code,
			mapping = mw.config.get( 'wgExternalGuidanceDomainCodeMapping' );

		for ( code in mapping ) {
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
		var url, domain;

		domain = this.getWikiDomainCode( language );
		url = this.config.api.replace( '$1', domain );
		options = $.extend( { anonymous: true }, options );
		return new mw.ForeignApi( url, options );
	};

	/**
	 * Get a URL to an article in a wiki for a given language.
	 *
	 * @param {string} language Language code
	 * @param {string} title Page title
	 * @param {Object} [params] Query parameters
	 * @return {string}
	 */
	SiteMapper.prototype.getPageUrl = function ( language, title, params ) {
		var domain,
			base = this.config.view,
			extra = '';

		domain = this.getWikiDomainCode( language );
		if ( params && !$.isEmptyObject( params ) ) {
			base = this.config.action || this.config.view;
			extra = ( base.indexOf( '?' ) !== -1 ? '&' : '?' ) + $.param( params );
		}

		return base
			.replace( '$1', domain.replace( /\$/g, '$$$$' ) )
			.replace( '$2', mw.util.wikiUrlencode( title ).replace( /\$/g, '$$$$' ) ) + extra;
	};
	mw.eg = mw.eg || {};
	mw.eg.SiteMapper = SiteMapper;
}() );
