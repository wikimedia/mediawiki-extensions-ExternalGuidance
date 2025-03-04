const mobile = require( 'mobile.startup' );
const SiteMapper = require( '../mw.externalguidance/sitemapper.js' );

const View = mobile.View,
	Overlay = mobile.Overlay,
	overlayManager = mobile.getOverlayManager();

function RequestTitleForm( options ) {
	this.editParams = {
		veaction: 'edit',
		campaign: 'external-machine-translation'
	};
	this.pageExist = null;
	this.sitemapper = new SiteMapper( mw.config.get( 'wgExternalGuidanceSiteTemplates' ) );
	View.call( this, {
		events: {
			'input .eg-create-page-title': mw.util.debounce( RequestTitleForm.prototype.onTitleInput, 300 ),
			'click .eg-create-page-button': 'onCreateButtonClick'
		},
		projectName: options.projectName,
		sourceLanguage: options.sourceLanguage,
		targetLanguage: options.targetLanguage,
		sourcePage: options.sourcePage
	} );
}
OO.inheritClass( RequestTitleForm, View );

RequestTitleForm.prototype.postRender = function () {
	let $pageCreationOptions = $( [] );
	const $heading = $( '<h3>' ).text( mw.msg( 'externalguidance-specialpage-createpage-title-label' ) ),
		$inputElement = $( '<input>' )
			.attr( 'type', 'text' )
			.addClass( 'cdx-text-input__input eg-create-page-title' )
			.attr( 'autofocus', 'autofocus' )
			.val( this.options.sourcePage ),
		$input = $( '<div>' ).addClass( 'cdx-text-input' ).append( $inputElement ),
		$p = $( '<p>' ).addClass( 'eg-create-page-desc' )
			.text( mw.msg( 'externalguidance-specialpage-createpage-desc', this.options.projectName ) ),
		$btn = $( '<button>' )
			.addClass( 'eg-create-page-button cdx-button cdx-button--action-progressive cdx-button--weight-primary' )
			.text( mw.msg( 'externalguidance-specialpage-createpage-button-label' ) );

	if ( this.isDesktop() ) {
		$pageCreationOptions = this.showPageCreationOptions();
	}
	this.$el.append( [ $heading, $input, $p, $pageCreationOptions, $btn ] );
	this.$el.find( '.eg-create-page-title' ).trigger( 'focus' );
	this.onTitleInput();
	View.prototype.postRender.apply( this, arguments );
};

/**
 * Click handler for create-page button
 *
 * @memberof CreatePageOverlay
 * @instance
 */
RequestTitleForm.prototype.onCreateButtonClick = function () {
	const updatedTitle = this.$el.find( '.eg-create-page-title' ).val(),
		method = this.getPageCreateMethod() || 'create';

	const action = this.pageExist ? 'editpage' : ( method === 'translate' ? 'createpage-translate' : 'createpage' );
	// Define tracker name with prefix counter.MediaWiki.ExternalGuidance.createpage
	const trackName = [ 'counter', 'MediaWiki', 'ExternalGuidance',
		action,
		mw.config.get( 'wgExternalGuidanceService' ),
		mw.config.get( 'wgExternalGuidanceSourceLanguage' ),
		mw.config.get( 'wgExternalGuidanceTargetLanguage' )
	];

	mw.track( trackName.join( '.' ), 1 );

	if ( action === 'createpage-translate' ) {
		window.open( this.sitemapper.getCXUrl(
			this.options.sourcePage,
			updatedTitle,
			this.options.sourceLanguage,
			this.options.targetLanguage,
			{ campaign: 'external-machine-translation' }
		), '_blank' );
	} else {
		window.open( this.sitemapper.getPageUrl(
			this.options.targetLanguage,
			updatedTitle,
			this.editParams
		), '_blank' );
	}
};

/**
 * Get the current selected method for creating new page
 *
 * @return {string} 'create' or 'translate'
 */
RequestTitleForm.prototype.getPageCreateMethod = function () {
	return this.$el.find( '[name=eg-create-method]:checked' ).val();
};

/**
 * Check if the current page is in a desktop context
 *
 * @return {boolean}
 */
RequestTitleForm.prototype.isDesktop = function () {
	return mw.config.get( 'wgMFMode', 'desktop' ) === 'desktop';
};

/**
 * Render the options to create a new page.
 *
 * @return {jQuery}
 */
RequestTitleForm.prototype.showPageCreationOptions = function () {
	const $container = $( '<div>' ).addClass( 'eg-create-page-method-selection' );

	$container.append(
		// Header
		$( '<h3>' ).text( mw.msg( 'externalguidance-specialpage-createpage-methods-header' ) ),
		// Translate option - Default option.
		$( '<div>' ).addClass( 'cdx-radio' ).append(
			$( '<input>' ).attr( {
				type: 'radio',
				class: 'cdx-radio__input',
				value: 'translate',
				checked: 'checked',
				id: 'eg-translate',
				name: 'eg-create-method'
			} ),
			$( '<span>' ).attr( {
				class: 'cdx-radio__icon'
			} ),
			$( '<label>' ).attr( {
				class: 'cdx-radio__label',
				for: 'eg-translate'
			} ).html( mw.message( 'externalguidance-specialpage-createpage-create-from-scratch',
				$.uls.data.getAutonym( this.options.sourceLanguage ),
				$.uls.data.getAutonym( this.options.targetLanguage )
			).parseDom() )
		),
		// Start from scratch option.
		$( '<div>' ).addClass( 'cdx-radio' ).append(
			$( '<input>' ).attr( {
				type: 'radio',
				value: 'create',
				id: 'eg-create',
				class: 'cdx-radio__input',
				name: 'eg-create-method'
			} ),
			$( '<span>' ).attr( {
				class: 'cdx-radio__icon'
			} ),
			$( '<label>' ).attr( {
				class: 'cdx-radio__label',
				for: 'eg-create'
			} ).html( mw.message( 'externalguidance-specialpage-createpage-create-from-translation' )
				.parseDom() )
		)
	);

	return $container;
};

/**
 * Title input handler
 *
 * @memberof CreatePageOverlay
 * @instance
 */
RequestTitleForm.prototype.onTitleInput = function () {
	const form = this,
		$button = this.$el.find( '.eg-create-page-button' ),
		title = this.$el.find( '.eg-create-page-title' ).val();

	this.checkPageExist( this.options.targetLanguage, title )
		.then( ( titleExist ) => {
			$button.prop( 'disabled', !title );

			if ( titleExist ) {
				this.pageExist = true;
				form.$el.find( '.eg-create-page-desc' )
					.addClass( 'eg-create-page-error' )
					.text(
						mw.msg( 'externalguidance-specialpage-createpage-page-exist' )
					);
				$button.text( mw.msg( 'externalguidance-specialpage-createpage-button-label-edit' ) );
			} else {
				this.pageExist = false;
				form.$el.find( '.eg-create-page-desc' )
					.removeClass( 'eg-create-page-error' )
					.text(
						mw.msg( 'externalguidance-specialpage-createpage-desc', this.options.projectName )
					);
				$button.text( mw.msg( 'externalguidance-specialpage-createpage-button-label' ) );
			}
		} );
};

RequestTitleForm.prototype.checkPageExist = function ( language, title ) {
	const api = this.sitemapper.getApi( language );

	// Short circuit empty titles
	if ( title === '' ) {
		return Promise.resolve( false );
	}

	// Reject titles with pipe in the name, as it has special meaning in the api
	if ( /\|/.test( title ) ) {
		return Promise.resolve( false );
	}

	return api.get( {
		formatversion: 2,
		action: 'query',
		titles: title,
		redirects: true
	} ).then( ( response ) => {
		const page = response.query.pages[ 0 ];

		if ( page.missing || page.invalid ) {
			return false;
		}

		return page.title;
	} );
};

/**
 * Overlay helping to start a new page
 *
 * @param {Object} options Configuration options
 * @return {Overlay}
 */
function createPageOverlay( options ) {
	const overlay = new Overlay(
		Object.assign( {
			className: 'overlay eg-createpage-overlay',
			heading: mw.msg( 'externalguidance-specialpage-createpage-title' )
		}, options )
	);

	overlay.$el.find( '.overlay-content' ).append(
		new RequestTitleForm( {
			projectName: options.projectName,
			sourceLanguage: options.sourceLanguage,
			targetLanguage: options.targetLanguage,
			sourcePage: options.sourcePage
		} ).$el
	);
	return overlay;
}

function openCreatePageOverlay() {

	return createPageOverlay( {
		projectName: mw.config.get( 'wgSiteName' ),
		sourceLanguage: mw.config.get( 'wgExternalGuidanceSourceLanguage' ),
		targetLanguage: mw.config.get( 'wgExternalGuidanceTargetLanguage' ),
		sourcePage: mw.config.get( 'wgExternalGuidanceSourcePage' )
	} );

}

function onContributeToOriginalClick() {
	const sitemapper = new SiteMapper( mw.config.get( 'wgExternalGuidanceSiteTemplates' ) ),
		editParams = {
			veaction: 'edit',
			campaign: 'external-machine-translation'
		};

	// Define tracker name with prefix counter.MediaWiki.ExternalGuidance.edit-original
	const trackName = [ 'counter', 'MediaWiki', 'ExternalGuidance', 'edit-original',
		mw.config.get( 'wgExternalGuidanceService' ),
		mw.config.get( 'wgExternalGuidanceSourceLanguage' ),
		mw.config.get( 'wgExternalGuidanceTargetLanguage' )
	];
	mw.track( trackName.join( '.' ), 1 );
	window.open( sitemapper.getPageUrl(
		mw.config.get( 'wgExternalGuidanceSourceLanguage' ),
		mw.config.get( 'wgExternalGuidanceSourcePage' ),
		editParams
	), '_blank' );
}

function onExpandTargetArticleClick() {
	const sitemapper = new SiteMapper( mw.config.get( 'wgExternalGuidanceSiteTemplates' ) ),
		editParams = {
			veaction: 'edit',
			campaign: 'external-machine-translation'
		};

	// Define tracker name with prefix counter.MediaWiki.ExternalGuidance.editpage
	const trackName = [ 'counter', 'MediaWiki', 'ExternalGuidance', 'editpage',
		mw.config.get( 'wgExternalGuidanceService' ),
		mw.config.get( 'wgExternalGuidanceSourceLanguage' ),
		mw.config.get( 'wgExternalGuidanceTargetLanguage' )
	];

	mw.track( trackName.join( '.' ), 1 );
	window.open( sitemapper.getPageUrl(
		mw.config.get( 'wgExternalGuidanceTargetLanguage' ),
		mw.config.get( 'wgExternalGuidanceTargetPage' ),
		editParams
	), '_blank' );
}

$( () => {
	// eslint-disable-next-line no-jquery/no-global-selector
	const $createButton = $( '.eg-sp-contribute-create' ),
		// eslint-disable-next-line no-jquery/no-global-selector
		$expandButton = $( '.eg-sp-contribute-expand' ),
		// eslint-disable-next-line no-jquery/no-global-selector
		$contributeToOriginalButton = $( '.eg-sp-contribute-to-original' );
	overlayManager.add( '/create-article', openCreatePageOverlay );
	$createButton
		.prop( 'disabled', false )
		.on( 'click', overlayManager.router.navigate.bind( null, '/create-article' ) );
	$contributeToOriginalButton
		.prop( 'disabled', false )
		.on( 'click', onContributeToOriginalClick );
	$expandButton
		.prop( 'disabled', false )
		.on( 'click', onExpandTargetArticleClick );
	// Define tracker name with prefix counter.MediaWiki.ExternalGuidance.specialpage
	const trackName = [ 'counter', 'MediaWiki', 'ExternalGuidance', 'specialpage',
		mw.config.get( 'wgExternalGuidanceService' ),
		mw.config.get( 'wgExternalGuidanceSourceLanguage' ),
		mw.config.get( 'wgExternalGuidanceTargetLanguage' )
	];
	mw.track( trackName.join( '.' ), 1 );
} );
