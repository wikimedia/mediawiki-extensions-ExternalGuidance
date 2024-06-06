( function () {

	let context, originalUserLang = mw.config.get( 'wgUserLanguage' );

	/**
	 * Clean up the target language set by MT services to a valid language code
	 *
	 * @param {string } targetLanguage
	 * @return {string}
	 */
	function getTargetLanguage( targetLanguage ) {
		// Google language codes can differ from the language codes that we use.
		const googleLanguageNameMap = {
			no: 'nb',
			iw: 'he',
			jw: 'jv',
			'zh-CN': 'zh',
			'zh-TW': 'zh'
		};

		// Google translate sometimes uses lang in the form of
		// targetLanguageCode-x-mtfrom-sourceLanguageCode. Example: id-x-mtfrom-en
		if ( targetLanguage.indexOf( '-x-mtfrom-' ) > 0 ) {
			targetLanguage = targetLanguage.split( '-' )[ 0 ];
		}

		return googleLanguageNameMap[ targetLanguage ] || targetLanguage;
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
	 *
	 * @return {Object} The context object with context name and extra information in 'info' key
	 */
	function detectContext() {
		let parentURL, translatedByMetaElement;

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
		if ( context.info.to === originalUserLang ) {
			// It is observed that sometimes the MT engine will fail to translate the page, leaving
			// document unmodified. Detect such cases and abort.
			return;
		}
		mw.log( '[ExternalGuidance] Context detected ' + JSON.stringify( context ) );

		mw.loader.using( [ 'mw.externalguidance' ] ).then( ( req ) => {
			const ExternalGuidance = req( 'mw.externalguidance' );
			const eg = new ExternalGuidance( context.name, context.info );
			eg.init();
		} );
	}
}() );
