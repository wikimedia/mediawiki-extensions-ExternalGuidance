/* eslint-disable camelcase */
( function ( M ) {
	var mobile = M.require( 'mobile.startup' ),
		Overlay = mobile.Overlay,
		overlayManager = mobile.OverlayManager.getSingleton();

	/**
	 * @class
	 * @param {Object} options
	 * @cfg {string} from Source language of translation
	 * @cfg {string} to Target language of translation
	 * @cfg {string} page The page being translated
	 * @cfg {string} service The MT service name
	 */
	function MachineTranslationContext( options ) {
		this.sourceLanguage = options.from;
		this.targetLanguage = options.to;
		this.sourcePage = options.page;
		this.service = options.service;
		// eslint-disable-next-line jquery/no-global-selector
		this.$container = $( '#page-actions' );
		this.specialPageURL = null;
		this.sitemapper = new mw.eg.SiteMapper( mw.config.get( 'wgExternalGuidanceSiteTemplates' ) );
		this.checkPageExistsRequest = null;
		this.privacyLinks = {
			Google: 'https://policies.google.com/'
		};
	}

	MachineTranslationContext.prototype.init = function () {
		var $headerContainer, $contribute, $contributeContainer, $header, $status;

		// Start fetching jquery.uls.data - we will need it for autonym
		// jquery.uls.data is relatively large module. Hence it is not fetched earlier.
		mw.loader.load( 'jquery.uls.data' );

		$status = $( '<div>' )
			.attr( { translate: 'no' } )
			.addClass( 'eg-machine-translation-page-status notranslate' );

		this.checkPageExistsRequest = this.checkPageExists(
			this.sourceLanguage, this.targetLanguage, this.sourcePage );

		this.checkPageExistsRequest.then( function ( title ) {
			this.showPageStatus( title, $status );
		}.bind( this ) );

		this.specialPageURL = this.sitemapper.getPageUrl(
			this.targetLanguage,
			'Special:ExternalGuidance',
			{
				from: this.sourceLanguage,
				to: this.targetLanguage,
				page: this.sourcePage,
				service: this.service
			}
		);
		overlayManager.add( '/machine-translation-info', this.showServiceProviderInfo.bind( this ) );
		$header = $( '<span>' )
			.attr( { translate: 'no' } ) // Do not translate this banner
			.addClass( 'eg-machine-translation-banner-header-label mw-ui-icon mw-ui-icon-before ' +
				' mw-ui-icon-eg-robot notranslate' )
			.html( mw.msg( 'externalguidance-machine-translation-heading' ) );

		$headerContainer = $( '<li>' )
			.addClass( 'eg-machine-translation-banner-header-container' )
			.append( $header )
			.on( 'click', overlayManager.router.navigate.bind( null, '/machine-translation-info' ) );

		$contribute = $( '<a>' )
			.addClass( 'mw-ui-icon mw-ui-icon-before mw-ui-icon-edit-progressive ' +
				' eg-machine-translation-banner-action-label notranslate' )
			.attr( {
				translate: 'no', // Do not translate this banner
				href: this.specialPageURL,
				rel: 'noreferrer', // Do not pass the referrer to avoid the target page detected as external context
				target: '_blank' // Open in new window/tab, not in the iframe (if any) by the MT service
			} )
			.append(
				// Wrap the label in a span so that we can hide text and show icon on small screens
				$( '<span>' ).html( mw.msg( 'externalguidance-machine-translation-contribute' ) )
			);
		$contributeContainer = $( '<li>' )
			.addClass( 'eg-machine-translation-banner-action-container' )
			.append( $contribute );

		this.$container
			.empty() // Remove existing page actions
			.addClass( 'eg-machine-translation-banner' )
			.append( $headerContainer, $contributeContainer )
			.before( $status );

		if ( this.sourceLanguage === 'en' ) {
			// Rewrite the menu URLs to target language. The current implementation would work only
			// if source is English. This is because en.wikipedia.org/wiki/Special:UserLogin
			// changed to id.wikipedia.org/wiki/Special:UserLogin will work, but not the reverse.
			this.rewriteMenuUrls( this.targetLanguage );
		}

		this.removeFooterLinkToDesktop();
	};

	/**
	 * Render the status of target page existence
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
			mw.loader.using( 'jquery.uls.data' ).then( function () {
				$status
					.addClass( 'missing' )
					.text( mw.msg( 'externalguidance-machine-translation-page-missing',
						$.uls.data.getAutonym( this.targetLanguage )
					) );
			}.bind( this ) );
		}
	};

	/**
	 * Check if the title corresponding to source title exist in target language
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
		} ).then( function ( response ) {
			var result,
				pages = response.query.pages;
			pages.forEach( function ( page ) {
				if ( page.langlinks && page.langlinks.length > 0 ) {
					page.langlinks.some( function ( item ) {
						if ( item.lang === to ) {
							result = item;
							return true;
						}
					} );
					return result.title;
				}
			} );
			return false;

		} );
	};

	/**
	 * Show the machine translation service information in an overlay.
	 * @return {jQuery.Promise}
	 */
	MachineTranslationContext.prototype.showServiceProviderInfo = function () {
		var originalUserLang = mw.config.get( 'wgUserLanguage' );
		// Tell ResourceLoader to fetch modules and messages for the target language,
		// which may be different from wgUserLanguage in case of MT.
		mw.config.set( 'wgUserLanguage', this.targetLanguage );

		return $.when(
			this.checkPageExistsRequest,
			mw.loader.using( 'jquery.uls.data' )
		).then( function ( targetTitle ) {
			var overlay, trackName,
				MTServiceInfo = M.require( 'mw.ExternalGuidance/MTServiceInfo' ),
				privacyLink = this.service.toLowerCase().indexOf( 'google' ) >= 0 ?
					this.privacyLinks.Google : null;

			// Restore wgUserLanguage
			mw.config.set( 'wgUserLanguage', originalUserLang );

			overlay = new Overlay( {
				className: 'overlay eg-mtservice-info-overlay notranslate',
				heading: mw.msg( 'externalguidance-machine-translation-provider-info-title',
					$.uls.data.getAutonym( this.sourceLanguage ) )
			} );

			overlay.$el.find( '.overlay-content' ).append( new MTServiceInfo( {
				sourceLanguage: this.sourceLanguage,
				projectName: mw.config.get( 'wgSiteName' ),
				serviceName: this.service,
				mtPrivacyTermsLink: privacyLink,
				learnToContributeLink: this.specialPageURL,
				targetPageExists: !!targetTitle
			} ).$el );

			// Define tracker name with prefix counter.MediaWiki.ExternalGuidance.mtinfo
			trackName = [ 'counter', 'MediaWiki', 'ExternalGuidance', 'mtinfo',
				this.service, this.sourceLanguage, this.targetLanguage ];
			mw.track( trackName.join( '.' ), 1 );
			mw.track( 'event.ExternalGuidance', {
				action: 'mtinfo',
				session_token: mw.user.sessionId(),
				source_language: this.sourceLanguage,
				target_language: this.targetLanguage,
				service: this.service,
				title: this.sourcePage
			} );
			return overlay;
		}.bind( this ) );
	};

	/**
	 * Rewrite the menu URLs so that they point to target language
	 * @param {string} targetLanguage
	 */
	MachineTranslationContext.prototype.rewriteMenuUrls = function ( targetLanguage ) {
		var newUri, $menuLinks;

		// eslint-disable-next-line jquery/no-global-selector
		$menuLinks = $( 'nav .menu a' );
		newUri = new mw.Uri( this.sitemapper.getPageUrl( targetLanguage, '' ) );
		$menuLinks.each( function () {
			var originalUri = new mw.Uri( this.href );
			newUri.path = originalUri.path;
			newUri.query = originalUri.query;
			this.href = newUri.toString();
			this.target = '_blank';
		} );
	};

	/**
	 * Remove the footer link that says "Desktop". See T212197#4942773.
	 */
	MachineTranslationContext.prototype.removeFooterLinkToDesktop = function () {
		// eslint-disable-next-line jquery/no-global-selector
		$( '#footer-places-desktop-toggle' ).remove();
	};

	/**
	 * @class
	 * @param {string} contextName
	 * @param {Object} options
	 * @cfg {string} from Source language of translation
	 * @cfg {string} to Target language of translation
	 * @cfg {string} page The page being translated
	 * @cfg {string} service The MT service name
	 */
	function ExternalGuidance( contextName, options ) {
		this.contextName = contextName;
		this.options = options || {};
	}

	ExternalGuidance.prototype.init = function () {
		var instance, trackName;

		if ( !ExternalGuidance.contextMap[ this.contextName ] ) {
			throw Error( 'Unknown context' );
		}
		instance = new ExternalGuidance.contextMap[ this.contextName ]( this.options );
		instance.init();
		// Define tracker name with prefix counter.MediaWiki.ExternalGuidance.init
		trackName = [ 'counter', 'MediaWiki', 'ExternalGuidance', 'init',
			this.options.service, this.options.from, this.options.to ];
		mw.track( trackName.join( '.' ), 1 );
		mw.track( 'event.ExternalGuidance', {
			action: 'init',
			session_token: mw.user.sessionId(),
			source_language: this.options.from,
			target_language: this.options.to,
			service: this.options.service,
			title: this.options.page
		} );
	};

	/**
	 * @static
	 */
	ExternalGuidance.contextMap = {
		'machine-translation': MachineTranslationContext
	};

	mw.ExternalGuidance = ExternalGuidance;
}( mw.mobileFrontend ) );
