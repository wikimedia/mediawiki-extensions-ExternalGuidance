/* eslint-disable camelcase */
( function ( M ) {
	var mobile = M.require( 'mobile.startup' ),
		View = mobile.View,
		Overlay = mobile.Overlay,
		util = mobile.util,
		overlayManager = mobile.OverlayManager.getSingleton();

	function RequestTitleForm( options ) {
		this.editParams = {
			veaction: 'edit',
			campaign: 'external-machine-translation'
		};
		this.pageExist = null;
		this.sitemapper = new mw.eg.SiteMapper( mw.config.get( 'wgExternalGuidanceSiteTemplates' ) );
		View.call( this, {
			events: {
				'input .eg-create-page-title': $.debounce( 300, RequestTitleForm.prototype.onTitleInput ),
				'click .eg-create-page-button': 'onCreateButtonClick'
			},
			projectName: options.projectName,
			targetLanguage: options.targetLanguage,
			sourcePage: options.sourcePage
		} );
	}
	OO.inheritClass( RequestTitleForm, View );

	RequestTitleForm.prototype.postRender = function () {
		var $heading = $( '<h3>' ).text( mw.msg( 'externalguidance-specialpage-createpage-title-label' ) ),
			$input = $( '<input>' )
				.attr( 'type', 'text' )
				.addClass( 'mw-ui-input eg-create-page-title' )
				.attr( 'autofocus', 'autofocus' )
				.val( this.options.sourcePage ),
			$p = $( '<p>' ).addClass( 'eg-create-page-desc' )
				.text( mw.msg( 'externalguidance-specialpage-createpage-desc', this.options.projectName ) ),
			$btn = $( '<button>' )
				.addClass( 'eg-create-page-button mw-ui-button mw-ui-primary mw-ui-progressive' )
				.text( mw.msg( 'externalguidance-specialpage-createpage-button-label' ) );
		this.$el.append( [ $heading, $input, $p, $btn ] );
		this.$el.find( '.eg-create-page-title' ).trigger( 'focus' );
		this.onTitleInput();
		View.prototype.postRender.apply( this, arguments );
	};

	/**
	 * Click handler for create-page button
	 * @memberof CreatePageOverlay
	 * @instance
	 */
	RequestTitleForm.prototype.onCreateButtonClick = function () {
		var trackName,
			updatedTitle = this.$( '.eg-create-page-title' ).val();

		// Define tracker name with prefix counter.MediaWiki.ExternalGuidance.createpage
		trackName = [ 'counter', 'MediaWiki', 'ExternalGuidance',
			this.pageExist ? 'editpage' : 'createpage',
			mw.config.get( 'wgExternalGuidanceService' ),
			mw.config.get( 'wgExternalGuidanceSourceLanguage' ),
			mw.config.get( 'wgExternalGuidanceTargetLanguage' )
		];

		mw.track( trackName.join( '.' ), 1 );
		mw.track( 'event.ExternalGuidance', {
			action: this.pageExist ? 'editpage' : 'createpage',
			session_token: mw.user.sessionId(),
			source_language: mw.config.get( 'wgExternalGuidanceSourceLanguage' ),
			target_language: mw.config.get( 'wgExternalGuidanceTargetLanguage' ),
			service: mw.config.get( 'wgExternalGuidanceService' ),
			title: updatedTitle
		} );
		window.open( this.sitemapper.getPageUrl(
			this.options.targetLanguage,
			updatedTitle,
			this.editParams
		), '_blank' );
	};

	/**
	 * Title input handler
	 * @memberof CreatePageOverlay
	 * @instance
	 */
	RequestTitleForm.prototype.onTitleInput = function () {
		var form = this,
			$button = this.$el.find( '.eg-create-page-button' ),
			title = this.$el.find( '.eg-create-page-title' ).val();

		this.checkPageExist( this.options.targetLanguage, title )
			.then( function ( titleExist ) {
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
			}.bind( this ) );
	};

	RequestTitleForm.prototype.checkPageExist = function ( language, title ) {
		var api = this.sitemapper.getApi( language );

		// Short circuit empty titles
		if ( title === '' ) {
			return util.Deferred().resolve( false ).promise();
		}

		// Reject titles with pipe in the name, as it has special meaning in the api
		if ( /\|/.test( title ) ) {
			return util.Deferred().resolve( false ).promise();
		}

		return api.get( {
			formatversion: 2,
			action: 'query',
			titles: title,
			redirects: true
		} ).then( function ( response ) {
			var page = response.query.pages[ 0 ];

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
		var overlay = new Overlay(
			util.extend( {
				className: 'overlay eg-createpage-overlay',
				heading: mw.msg( 'externalguidance-specialpage-createpage-title' )
			}, options )
		);

		overlay.$el.find( '.overlay-content' ).append(
			new RequestTitleForm( {
				projectName: options.projectName,
				targetLanguage: options.targetLanguage,
				sourcePage: options.sourcePage
			} ).$el
		);
		return overlay;
	}

	function openCreatePageOverlay() {

		return createPageOverlay( {
			projectName: mw.config.get( 'wgSiteName' ),
			targetLanguage: mw.config.get( 'wgExternalGuidanceTargetLanguage' ),
			sourcePage: mw.config.get( 'wgExternalGuidanceSourcePage' )
		} );

	}

	function onContributeToOriginalClick() {
		var trackName,
			sitemapper = new mw.eg.SiteMapper( mw.config.get( 'wgExternalGuidanceSiteTemplates' ) ),
			editParams = {
				veaction: 'edit',
				campaign: 'external-machine-translation'
			};

		// Define tracker name with prefix counter.MediaWiki.ExternalGuidance.edit-original
		trackName = [ 'counter', 'MediaWiki', 'ExternalGuidance', 'edit-original',
			mw.config.get( 'wgExternalGuidanceService' ),
			mw.config.get( 'wgExternalGuidanceSourceLanguage' ),
			mw.config.get( 'wgExternalGuidanceTargetLanguage' )
		];
		mw.track( trackName.join( '.' ), 1 );
		mw.track( 'event.ExternalGuidance', {
			action: 'edit-original',
			session_token: mw.user.sessionId(),
			source_language: mw.config.get( 'wgExternalGuidanceSourceLanguage' ),
			target_language: mw.config.get( 'wgExternalGuidanceTargetLanguage' ),
			service: mw.config.get( 'wgExternalGuidanceService' ),
			title: mw.config.get( 'wgExternalGuidanceSourcePage' )
		} );
		window.open( sitemapper.getPageUrl(
			mw.config.get( 'wgExternalGuidanceSourceLanguage' ),
			mw.config.get( 'wgExternalGuidanceSourcePage' ),
			editParams
		), '_blank' );
	}

	function onExpandTargetArticleClick() {
		var trackName,
			sitemapper = new mw.eg.SiteMapper( mw.config.get( 'wgExternalGuidanceSiteTemplates' ) ),
			editParams = {
				veaction: 'edit',
				campaign: 'external-machine-translation'
			};

		// Define tracker name with prefix counter.MediaWiki.ExternalGuidance.editpage
		trackName = [ 'counter', 'MediaWiki', 'ExternalGuidance', 'editpage',
			mw.config.get( 'wgExternalGuidanceService' ),
			mw.config.get( 'wgExternalGuidanceSourceLanguage' ),
			mw.config.get( 'wgExternalGuidanceTargetLanguage' )
		];

		mw.track( trackName.join( '.' ), 1 );
		mw.track( 'event.ExternalGuidance', {
			action: 'editpage',
			session_token: mw.user.sessionId(),
			source_language: mw.config.get( 'wgExternalGuidanceSourceLanguage' ),
			target_language: mw.config.get( 'wgExternalGuidanceTargetLanguage' ),
			service: mw.config.get( 'wgExternalGuidanceService' ),
			title: mw.config.get( 'wgExternalGuidanceTargetPage' )
		} );
		window.open( sitemapper.getPageUrl(
			mw.config.get( 'wgExternalGuidanceTargetLanguage' ),
			mw.config.get( 'wgExternalGuidanceTargetPage' ),
			editParams
		), '_blank' );
	}

	$( function () {
		var trackName,
			// eslint-disable-next-line jquery/no-global-selector
			$createButton = $( '.eg-sp-contribute-create' ),
			// eslint-disable-next-line jquery/no-global-selector
			$expandButton = $( '.eg-sp-contribute-expand' ),
			// eslint-disable-next-line jquery/no-global-selector
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
		trackName = [ 'counter', 'MediaWiki', 'ExternalGuidance', 'specialpage',
			mw.config.get( 'wgExternalGuidanceService' ),
			mw.config.get( 'wgExternalGuidanceSourceLanguage' ),
			mw.config.get( 'wgExternalGuidanceTargetLanguage' )
		];
		mw.track( trackName.join( '.' ), 1 );
		mw.track( 'event.ExternalGuidance', {
			action: 'specialpage',
			session_token: mw.user.sessionId(),
			source_language: mw.config.get( 'wgExternalGuidanceSourceLanguage' ),
			target_language: mw.config.get( 'wgExternalGuidanceTargetLanguage' ),
			service: mw.config.get( 'wgExternalGuidanceService' ),
			title: mw.config.get( 'wgExternalGuidanceSourcePage' )
		} );
	} );

}( mw.mobileFrontend ) );
