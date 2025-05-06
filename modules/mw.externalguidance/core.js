/* eslint-disable mediawiki/class-doc */
const mobile = require( 'mobile.startup' ),
	SiteMapper = require( './sitemapper.js' ),
	MTServiceInfo = require( './mtinfo.js' );

const Overlay = mobile.Overlay,
	overlayManager = mobile.getOverlayManager();

/**
 * @class
 * @param {Object} options
 * @param {string} options.from Source language of translation
 * @param {string} options.to Target language of translation
 * @param {string} options.page The page being translated
 * @param {string} options.service The MT service name
 */
function MachineTranslationContext( options ) {
	this.sourceLanguage = options.from;
	this.targetLanguage = options.to;
	this.sourcePage = options.page;
	this.service = options.service;
	// eslint-disable-next-line no-jquery/no-global-selector
	this.$container = $( '#page-actions, #p-views' );
	this.targetPage = null;
	this.sitemapper = new SiteMapper( mw.config.get( 'wgExternalGuidanceSiteTemplates' ) );
	this.checkPageExistsRequest = null;
	this.privacyLinks = {
		Google: 'https://policies.google.com/'
	};
}

MachineTranslationContext.prototype.init = function () {
	let $contribute = null;

	// Start fetching jquery.uls.data - we will need it for autonym
	// jquery.uls.data is relatively large module. Hence it is not fetched earlier.
	mw.loader.load( 'jquery.uls.data' );

	const $status = $( '<div>' )
		.addClass( 'eg-machine-translation-page-status' );

	this.checkPageExistsRequest = this.checkPageExists(
		this.sourceLanguage, this.targetLanguage, this.sourcePage );

	this.checkPageExistsRequest.then( ( targetTitle ) => {
		this.showPageStatus( targetTitle, $status );
		if ( targetTitle ) {
			this.targetPage = targetTitle;
			// The page exists. So update the contribute link to use that title.
			$contribute.attr( 'href', this.getContributeLink() );
		}
	} );

	this.showServiceProviderInfo().then( ( overlay ) => {
		overlayManager.add( '/machine-translation-info', () => overlay );
	} );

	const $header = $( '<div>' ).append(
		$( '<span>' ).addClass( 'eg-machine-translation-banner-header-label eg-icon' +
			' eg-icon-robot' ),
		$( '<span>' ).html( mw.msg( 'externalguidance-machine-translation-heading' ) )
	);

	const $headerContainer = $( '<li>' )
		.addClass( 'eg-machine-translation-banner-header-container' )
		.append( $header )
		.on( 'click', overlayManager.router.navigate.bind( null, '/machine-translation-info' ) );

	$contribute = this.getContributeLinkElement();
	const $contributeContainer = $( '<li>' )
		.addClass( 'eg-machine-translation-banner-action-container' )
		.append( $contribute );
	this.$container
		.empty() // Remove existing page actions
		.addClass( 'eg-machine-translation-banner' )
		.append( $headerContainer, $contributeContainer )
		.before( $status );

	// The menu links in collapsed side manu get rendered after the page is loaded.
	// We can wait for few seconds to that happen. It is all hidden from user anyway.
	setTimeout( this.rewriteMenuUrls.bind( this, this.targetLanguage ), 3000 );

	this.removeFooterLinkToDesktop();
};

MachineTranslationContext.prototype.getContributeLink = function () {
	return this.sitemapper.getPageUrl(
		this.targetLanguage,
		'Special:ExternalGuidance',
		{
			from: this.sourceLanguage,
			to: this.targetLanguage,
			page: this.sourcePage,
			targettitle: this.targetPage,
			service: this.service
		}
	);
};

MachineTranslationContext.prototype.getContributeLinkElement = function () {
	return $( '<a>' )
		.addClass( 'eg-machine-translation-banner-action-label' )
		.attr( {
			href: this.getContributeLink(),
			rel: 'noreferrer', // Do not pass the referrer to avoid the target page detected as external context
			target: '_blank' // Open in new window/tab, not in the iframe (if any) by the MT service
		} )
		.append(
			$( '<span>' ).addClass( 'eg-icon eg-icon-edit-progressive' ),
			// Wrap the label in a span so that we can hide text and show icon on small screens
			$( '<span>' ).html( mw.msg( 'externalguidance-machine-translation-contribute' ) )
		);
};

/**
 * Render the status of target page existence
 *
 * @param {string} title Target page
 * @param {jQuery} $status Container for showing the status
 */
MachineTranslationContext.prototype.showPageStatus = function ( title, $status ) {
	if ( title ) {
		$status.append(
			mw.message( 'externalguidance-machine-translation-page-exist',
				this.sitemapper.getPageUrl( this.targetLanguage, title )
			).parseDom()
		);
		$status.find( 'a' ).attr( {
			rel: 'noreferrer', // Do not pass the referrer to avoid the target page detected as external context
			target: '_blank' // Open in new windows/tab, not in the iframe (if any) by the MT service
		} );
	} else {
		mw.loader.using( 'jquery.uls.data' ).then( () => {
			$status
				.addClass( 'missing' )
				.text( mw.msg( 'externalguidance-machine-translation-page-missing',
					$.uls.data.getAutonym( this.targetLanguage )
				) );
		} );
	}
};

/**
 * Check if the title corresponding to source title exist in target language
 *
 * @param {string } from
 * @param {string } to
 * @param {string } title
 * @return {jQuery.Promise}
 */
MachineTranslationContext.prototype.checkPageExists = function ( from, to, title ) {
	return this.sitemapper.getApi( from ).get( {
		action: 'query',
		titles: title,
		prop: 'langlinks',
		lllimit: 1,
		formatversion: 2,
		lllang: this.sitemapper.getWikiDomainCode( to ),
		redirects: true
	} ).then( ( response ) => {
		let result;
		const pages = response.query.pages;
		for ( let i = 0; i < pages.length; i++ ) {
			const page = pages[ i ];
			if ( page.langlinks && page.langlinks.length > 0 ) {
				// eslint-disable-next-line no-loop-func
				page.langlinks.some( ( item ) => {
					if ( item.lang === to ) {
						result = item;
						return true;
					}
					return false;
				} );
				return result.title;
			}
		}
		return false;

	} );
};

/**
 * Show the machine translation service information in an overlay.
 *
 * @return {jQuery.Promise}
 */
MachineTranslationContext.prototype.showServiceProviderInfo = function () {
	return $.when(
		this.checkPageExistsRequest,
		mw.loader.using( 'jquery.uls.data' )
	).then( ( targetTitle ) => {
		const privacyLink = this.service.toLowerCase().includes( 'google' ) ?
			this.privacyLinks.Google : null;

		const overlay = new Overlay( {
			className: 'overlay eg-mtservice-info-overlay',
			heading: mw.msg( 'externalguidance-machine-translation-provider-info-title',
				$.uls.data.getAutonym( this.sourceLanguage ) )
		} );

		overlay.$el.find( '.overlay-content' ).append( new MTServiceInfo( {
			sourceLanguage: this.sourceLanguage,
			projectName: mw.config.get( 'wgSiteName' ),
			serviceName: this.service,
			mtPrivacyTermsLink: privacyLink,
			learnToContributeLink: this.getContributeLink(),
			targetPageExists: !!targetTitle
		} ).$el );

		// Define tracker name with prefix counter.MediaWiki.ExternalGuidance.mtinfo
		const trackName = [ 'counter', 'MediaWiki', 'ExternalGuidance', 'mtinfo',
			this.service, this.sourceLanguage, this.targetLanguage ];
		mw.track( trackName.join( '.' ), 1 );
		return overlay;
	} );
};

/**
 * Rewrite the menu URLs so that they point to target language
 * Change special page titles to canonical titles.
 *
 * @param {string} targetLanguage
 */
MachineTranslationContext.prototype.rewriteMenuUrls = function ( targetLanguage ) {
	const sitemapper = this.sitemapper;

	// Map titles to their canonical titles
	const titleMap = {
		home: 'Main_Page',
		random: 'Special:Random',
		watchlist: 'Special:Watchlist',
		login: 'Special:UserLogin',
		nearby: 'Special:Nearby',
		settings: 'Special:MobileOptions'
	};

	// eslint-disable-next-line no-jquery/no-global-selector
	const $menuLinks = $( 'nav .menu a' );
	$menuLinks.each( function () {
		const originalUri = new URL( this.href, location );

		// The key to know which special page this link points is data-event-name
		const eventName = this.dataset.eventName;
		if ( titleMap[ eventName ] ) {
			let newUri;
			if ( originalUri.searchParams.get( 'title' ) ) {
				newUri = originalUri;
				// Change the host to new domain.
				newUri.host = new URL( sitemapper.getPageUrl( targetLanguage ), location ).host;
				// Change the title query value
				newUri.searchParams.set( 'title', titleMap[ eventName ] );
			} else {
				newUri = new URL(
					sitemapper.getPageUrl(
						targetLanguage, titleMap[ eventName ], originalUri.query
					),
					location
				);
			}
			this.href = newUri.toString();
		}
		this.target = '_blank';
	} );
};

/**
 * Remove the footer link that says "Desktop". See T212197#4942773.
 */
MachineTranslationContext.prototype.removeFooterLinkToDesktop = function () {
	// eslint-disable-next-line no-jquery/no-global-selector
	$( '#footer-places-desktop-toggle' ).remove();
};

/**
 * @class
 * @param {string} contextName
 * @param {Object} options
 * @param {string} options.from Source language of translation
 * @param {string} options.to Target language of translation
 * @param {string} options.page The page being translated
 * @param {string} options.service The MT service name
 */
function ExternalGuidance( contextName, options ) {
	this.contextName = contextName;
	this.options = options || {};
}

ExternalGuidance.prototype.init = function () {
	if ( !ExternalGuidance.contextMap[ this.contextName ] ) {
		throw new Error( 'Unknown context' );
	}
	const instance = new ExternalGuidance.contextMap[ this.contextName ]( this.options );
	instance.init();
	// Define tracker name with prefix counter.MediaWiki.ExternalGuidance.init
	const trackName = [ 'counter', 'MediaWiki', 'ExternalGuidance', 'init',
		this.options.service, this.options.from, this.options.to ];
	mw.track( trackName.join( '.' ), 1 );
};

/**
 * @static
 */
ExternalGuidance.contextMap = {
	'machine-translation': MachineTranslationContext
};

// @todo: Clarify if these are @stable for use by gadgets and/or other extensions.
// per https://www.mediawiki.org/wiki/Stable_interface_policy/Frontend.
// Consider removing globals and/or adding @private to module.exports if not.
mw.ExternalGuidance = ExternalGuidance;
mw.eg = mw.eg || {};
mw.eg.SiteMapper = SiteMapper;
module.exports = ExternalGuidance;
