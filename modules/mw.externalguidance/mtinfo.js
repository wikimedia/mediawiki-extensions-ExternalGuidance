const mobile = require( 'mobile.startup' );
( function () {
	const View = mobile.View;

	/**
	 * Overlay displaying a Machine Translation service information
	 *
	 * @class MTServiceInfo
	 * @extends View
	 * @param {Object} options Configuration options
	 */
	function MTServiceInfo( options ) {
		MTServiceInfo.super.call( this, options );
	}

	OO.inheritClass( MTServiceInfo, View );

	/**
	 * @inheritdoc
	 */
	MTServiceInfo.prototype.postRender = function () {
		this.$el.append( [
			$( '<p>' )
				.text( mw.msg( 'externalguidance-machine-translation-provider-info',
					this.options.projectName, this.options.serviceName ) ),
			this.options.mtPrivacyTermsLink ? $( '<a>' )
				.attr( 'href', this.options.mtPrivacyTermsLink )
				.text( mw.msg( 'externalguidance-machine-translation-provider-terms' ) ) :
				$( [] ),
			$( '<h3>' )
				.text( mw.msg( 'externalguidance-machine-translation-access-source-title', this.options.projectName ) ),
			$( '<p>' )
				.text( this.options.targetPageExists ?
					mw.msg( 'externalguidance-machine-translation-access-source-page-exist', this.options.projectName ) :
					mw.msg( 'externalguidance-machine-translation-access-source-page-missing', this.options.projectName )
				),
			$( '<a>' )
				.attr( {
					href: this.options.learnToContributeLink,
					target: '_blank'
				} )
				.text( mw.msg( 'externalguidance-machine-translation-contribute-link', this.options.projectName ) )
		] );

		View.prototype.postRender.apply( this, arguments );
	};

	module.exports = MTServiceInfo;

}() );
