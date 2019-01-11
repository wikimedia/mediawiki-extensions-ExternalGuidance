( function ( M ) {

	var Overlay = M.require( 'mobile.startup/Overlay' ),
		util = M.require( 'mobile.startup/util' );

	/**
	 * Overlay displaying a Machine Translation service information
	 *
	 * @class MTServiceOverlay
	 * @extends Overlay
	 *
	 * @param {Object} options Configuration options
	 */
	function MTServiceOverlay( options ) {
		Overlay.call( this,
			util.extend( options, {
				className: 'overlay mtservice-info-overlay',
				heading: mw.msg( 'externalguidance-machine-translation-provider-info-title',
					$.uls.data.getAutonym( options.sourceLanguage ) ),
				mtProvidedBy: mw.msg( 'externalguidance-machine-translation-provider-info',
					options.projectName, options.serviceName ),
				mtPrivacyTerms: mw.msg( 'externalguidance-machine-translation-provider-terms' ),
				accessWikiTitle: mw.msg( 'externalguidance-machine-translation-access-source-title', options.projectName ),
				accessWiki:
					options.targetPageExists ?
						mw.msg( 'externalguidance-machine-translation-access-source-page-exist', options.projectName ) :
						mw.msg( 'externalguidance-machine-translation-access-source-page-missing', options.projectName ),
				learnToContribute: mw.msg( 'externalguidance-machine-translation-contribute-link', options.projectName )
			} )
		);
	}

	OO.mfExtend( MTServiceOverlay, Overlay, {
		/**
		 * @memberof MTServiceOverlay
		 * @instance
		 * @mixes Overlay#defaults
		 * @property {Object} defaults Default options hash.
		 */
		defaults: Overlay.prototype.defaults,
		/**
		 * @inheritdoc
		 * @memberof MTServiceOverlay
		 * @instance
		 */
		templatePartials: util.extend( {}, Overlay.prototype.templatePartials, {
			content: mw.template.get( 'mw.externalguidance.mt.info', 'MTServiceOverlay.hogan' )
		} )

	} );

	M.define( 'mw.ExternalGuidance.mt.info/MTServiceOverlay', MTServiceOverlay );

}( mw.mobileFrontend ) );
