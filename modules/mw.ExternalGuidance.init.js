( function () {

	var context = {
		info: {
			from: mw.config.get( 'wgContentLanguage' ),
			to: document.documentElement.lang,
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
		mw.loader.using( [ 'mw.externalguidance' ] ).then( function () {
			var eg = new mw.eg.ExternalGuidance( context.name, context.info );
			eg.init();
		} );
	}
}() );
