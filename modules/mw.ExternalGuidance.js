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
		this.$container = $( '.heading-holder' );
		this.specialPageURL = null;
		this.sitemapper = new mw.eg.SiteMapper( mw.config.get( 'wgExternalGuidanceSiteTemplates' ) );
		this.checkPageExistsRequest = null;
		this.privacyLinks = {
			Google: 'https://policies.google.com/'
		};
	}

	MachineTranslationContext.prototype.init = function () {
		var $banner, $headerContainer, $contribute, $contributeIcon, $contributeContainer,
			$headerIcon, $header, $status;

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
		$headerIcon = $( '<span>' ).addClass( 'mw-ui-icon mw-ui-icon-element mw-ui-icon-eg-robot' );
		$header = $( '<span>' )
			.attr( { translate: 'no' } ) // Do not translate this banner
			.addClass( 'eg-machine-translation-banner-header-label notranslate' )
			.html( mw.msg( 'externalguidance-machine-translation-heading' ) );

		$headerContainer = $( '<div>' )
			.addClass( 'eg-machine-translation-banner-header-container' )
			.append( $headerIcon, $header )
			.on( 'click', overlayManager.router.navigate.bind( null, '/machine-translation-info' ) );
		$contributeIcon = $( '<span>' ).addClass( 'mw-ui-icon mw-ui-icon-element mw-ui-icon-edit-progressive' );
		$contribute = $( '<span>' )
			.attr( { translate: 'no' } ) // Do not translate this banner
			.addClass( 'eg-machine-translation-banner-action-label notranslate' )
			.html( mw.msg( 'externalguidance-machine-translation-contribute' ) );
		$contributeContainer = $( '<a>' )
			.addClass( 'eg-machine-translation-banner-action-container' )
			.attr( {
				href: this.specialPageURL,
				rel: 'noreferrer', // Do not pass the referrer to avoid the target page detected as external context
				target: '_blank' // Open in new window/tab, not in the iframe (if any) by the MT service
			} )
			.append( $contributeIcon, $contribute );

		$banner = $( '<div>' )
			.addClass( 'eg-machine-translation-banner' )
			.append( $headerContainer, $contributeContainer );

		this.$container.append( $status, $banner );

		this.rewriteMenuUrls( this.targetLanguage );
	};

	/**
	 * Render the status of target page existence
	 * @param {string} title Target page
	 * @param {jQuery} $status Container for showing the status
	 */
	MachineTranslationContext.prototype.showPageStatus = function ( title, $status ) {
		if ( title ) {
			$status.append(
				mw.message( 'externalguidance-machine-translation-page-exist', title ).parseDom()
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
			var i, page, result,
				pages = response.query.pages;
			for ( i = 0; i < pages.length; i++ ) {
				page = pages[ i ];
				if ( page.langlinks && page.langlinks.length > 0 ) {
					result = page.langlinks.find( function ( item ) {
						return item.lang === to;
					} );
					return result.title;
				}
			}
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
				MTServiceInfo = mw.mobileFrontend.require( 'mw.ExternalGuidance/MTServiceInfo' ),
				privacyLink = this.service.toLowerCase().indexOf( 'google' ) >= 0 ?
					this.privacyLinks.Google : null;

			// Restore wgUserLanguage
			mw.config.set( 'wgUserLanguage', originalUserLang );

			overlay = new Overlay( {
				className: 'overlay eg-mtservice-info-overlay notranslate',
				heading: mw.msg( 'externalguidance-machine-translation-provider-info-title',
					$.uls.data.getAutonym( this.sourceLanguage ) )
			} );

			overlay.$( '.overlay-content' ).append( new MTServiceInfo( {
				sourceLanguage: this.sourceLanguage,
				projectName: mw.config.get( 'wgSiteName' ),
				serviceName: this.service,
				mtPrivacyTermsLink: privacyLink,
				learnToContributeLink: this.specialPageURL,
				targetPageExists: !!targetTitle
			} ).$el );

			trackName = [ 'counter', 'MediaWiki', 'ExternalGuidance', 'mtinfo',
				this.service, this.sourceLanguage, this.targetLanguage ];
			mw.track( trackName.join( '.' ), 1 );

			return overlay;
		}.bind( this ) );
	};

	/**
	 * Rewrite the menu URLs so that they point to target language
	 * @param {string} targetLanguage
	 */
	MachineTranslationContext.prototype.rewriteMenuUrls = function ( targetLanguage ) {
		var newUri, $menuLinks;

		$menuLinks = $( 'nav .menu a' );
		newUri = new mw.Uri( this.sitemapper.getPageUrl( targetLanguage, '' ) );
		$menuLinks.each( function () {
			var originalUri = new mw.Uri( $( this ).attr( 'href' ) );
			newUri.path = originalUri.path;
			newUri.query = originalUri.query;
			$( this ).attr( {
				href: newUri.toString(),
				target: '_blank'
			} );
		} );
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
		trackName = [ 'counter', 'MediaWiki', 'ExternalGuidance', 'init',
			this.options.service, this.options.from, this.options.to ];
		mw.track( trackName.join( '.' ), 1 );
	};

	/**
	 * @static
	 */
	ExternalGuidance.contextMap = {
		'machine-translation': MachineTranslationContext
	};

	mw.eg.ExternalGuidance = ExternalGuidance;
}( mw.mobileFrontend ) );
