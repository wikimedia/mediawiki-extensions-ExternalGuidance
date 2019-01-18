( function () {

	var context, originalUserLang = mw.config.get( 'wgUserLanguage' );

	/**
	 * Clean up the target language set by MT services to a valid language code
	 * @param {string } targetLanguage
	 * @return {string}
	 */
	function getTargetLanguage( targetLanguage ) {
		// Google translate somtiems uses lang in the form of
		// targetLanguageCode-x-mtfrom-sourceLanguageCode. Example: id-x-mtfrom-en
		if ( targetLanguage.indexOf( '-x-mtfrom-' ) > 0 ) {
			return targetLanguage.split( '-' )[ 0 ];
		}

		return targetLanguage;
	}

	context = {
		info: {
			from: mw.config.get( 'wgContentLanguage' ),
			to: getTargetLanguage( document.documentElement.lang ),
			page: mw.config.get( 'wgTitle' )
		}
	};

	/**
	 * Detect the external service context in which the page is being presented
	 * @return {Object} The context object with context name and extra information in 'info' key
	 */
	function detectContext() {
		var parentURL, translatedByMetaElement;

		// Check if the translated page has
		// <meta http-equiv="X-Translated-By" content="ServiceName"/>
		translatedByMetaElement = document.head.querySelector( 'meta[http-equiv="X-Translated-By"]' );
		if ( translatedByMetaElement ) {
			context.name = 'machine-translation';
			context.info.service = translatedByMetaElement.getAttribute( 'content' );
			return context;
		}

		// Check If the page is coming via a configured referrer URL
		if ( document.referrer ) {
			parentURL = new mw.Uri( document.referrer );
			if ( mw.config.get( 'wgExternalGuidanceMTReferrers' ).indexOf( parentURL.host ) >= 0 ) {
				context.name = 'machine-translation';
				context.info.service = parentURL.host;
				return context;
			}
		}

		return null;
	}

	context = detectContext();
	if ( context ) {
		mw.log( '[ExternalGuidance] Context detected ' + JSON.stringify( context ) );
		// Namespace initialization
		mw.eg = {};
		// Tell ResourceLoader to fetch modules and messages for the target language,
		// which may be different from wgUserLanguage in case of MT.
		mw.config.set( 'wgUserLanguage', context.info.to );
		mw.loader.using( [ 'mw.externalguidance' ] ).then( function () {
			var eg;
			// Restore original wgUserLanguage
			mw.config.set( 'wgUserLanguage', originalUserLang );
			eg = new mw.eg.ExternalGuidance( context.name, context.info );
			eg.init();
		} );
	}
}() );
