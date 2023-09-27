<?php
/**
 * Contains the special page Special:ExternalGuidance.
 *
 * @copyright See AUTHORS.txt
 * @license GPL-2.0-or-later
 */

namespace MediaWiki\Extension\ExternalGuidance;

use ErrorPageError;
use Html;
use MediaWiki\Languages\LanguageNameUtils;
use MediaWiki\Title\Title;
use OutputPage;
use SpecialPage;
use WebRequest;

/**
 * Welcoming page from an ExternalGuidance contribution entry point
 */
class SpecialExternalGuidance extends SpecialPage {

	/** @var LanguageNameUtils */
	private $languageNameUtils;

	/**
	 * @param LanguageNameUtils $languageNameUtils
	 */
	public function __construct(
		LanguageNameUtils $languageNameUtils
	) {
		parent::__construct( 'ExternalGuidance', '', false );
		$this->languageNameUtils = $languageNameUtils;
	}

	/**
	 * @inheritDoc
	 */
	public function getDescription() {
		return $this->msg( 'externalguidance-specialpage-title' );
	}

	/**
	 * @inheritDoc
	 */
	public function execute( $parameters ) {
		$request = $this->getRequest();
		$this->setHeaders();
		$this->outputHeader();
		// Currently we have only one context - Machine translation. So using it unconditionally.
		$this->mtContextGuidance( $request, $this->getOutput() );
	}

	/**
	 * Machine translation context based guidance rendering
	 * @param WebRequest $request
	 * @param OutputPage $out
	 */
	public function mtContextGuidance( $request, $out ) {
		global $wgSitename, $wgExternalGuidanceKnownServices;

		$targetPageTitle = null;
		$pageExists = false;

		$sourceLanguage = $request->getVal( 'from' );
		$targetLanguage = $request->getVal( 'to' );
		$sourcePage = $request->getVal( 'page' );
		$targetPage = $request->getVal( 'targettitle' );
		$service = $request->getVal( 'service' );

		if ( !$service || !$sourcePage || !$sourceLanguage || !$targetLanguage ) {
			throw new ErrorPageError(
				'externalguidance-specialpage-title',
				'externalguidance-specialpage-param-missing'
			);
		}

		if ( !$this->languageNameUtils->isKnownLanguageTag( $sourceLanguage ) ) {
			throw new ErrorPageError(
				'externalguidance-specialpage-title',
				'externalguidance-specialpage-invalid-language',
				[ $sourceLanguage ]
			);
		}
		if ( !$this->languageNameUtils->isKnownLanguageTag( $targetLanguage ) ) {
			throw new ErrorPageError(
				'externalguidance-specialpage-title',
				'externalguidance-specialpage-invalid-language',
				[ $targetLanguage ]
			);
		}
		if ( !in_array( $service, $wgExternalGuidanceKnownServices ) ) {
			throw new ErrorPageError(
				'externalguidance-specialpage-title',
				'externalguidance-specialpage-invalid-service',
				[ $service ]
			);
		}

		// Create the title instance after validation. Throws MalformedTitleException if invalid.
		$sourcePageTitle = Title::newFromTextThrow( $sourcePage );
		if ( $targetPage ) {
			$targetPageTitle = Title::newFromTextThrow( $targetPage );
			// This wiki should match the target language since the "contribute" link takes the user
			// to this special page in target language.
			$pageExists = $targetPageTitle->isKnown();
		}

		$out->addHTML( '<div class="eg-sp">' );

		if ( $pageExists ) {
			$out->addWikiMsg( 'externalguidance-specialpage-mt-intro-pageexist',
				$wgSitename,
				$this->languageNameUtils->getLanguageName( $sourceLanguage )
			);
			$out->addWikiMsg( "externalguidance-specialpage-mt-pageexist",
				$this->languageNameUtils->getLanguageName( $targetLanguage ) );
		} else {
			$out->addWikiMsg( 'externalguidance-specialpage-mt-intro',
				$wgSitename,
				$this->languageNameUtils->getLanguageName( $sourceLanguage ),
				$this->languageNameUtils->getLanguageName( $targetLanguage )
			);
		}
		$out->addHTML( '<ul>' );
		$out->wrapWikiMsg(
			"<li class='eg-sp-intro-machine'>" .
			"<span class='mw-ui-icon mw-ui-icon-eg-robot'></span>" .
			'<div>$1</div></li>',
			'externalguidance-specialpage-intro-machine' );
		$out->wrapWikiMsg(
			"<li class='eg-sp-intro-human'>" .
			"<span class='mw-ui-icon mw-ui-icon-eg-user'></span>" .
			'<div>$1</div></li>',
			'externalguidance-specialpage-intro-human' );
		$out->addHTML( '</ul>' );
		$out->wrapWikiMsg( "<h3 class='eg-sp-ways-to-contribute'>\n$1\n</h3>",
			'externalguidance-specialpage-contribute-title' );
		$editParams = [
			// Invoke VisualEditor
			'veaction' => 'edit',
			// See T212405 and T209132
			'campaign' => 'external-machine-translation'
		 ];

		if ( $pageExists ) {
			$actionLabel = $this->msg( 'externalguidance-specialpage-contribute-expand-action' )->text();
			$out->addHTML( Html::element(
				'button',
				[
					'class' => 'eg-sp-contribute-expand mw-ui-button mw-ui-primary mw-ui-progressive',
					'disabled' => true
				],
				$actionLabel
			) );
			$out->addWikiMsg( 'externalguidance-specialpage-contribute-expand' );
		} else {
			$actionLabel = $this->msg( 'externalguidance-specialpage-contribute-create-action' )->text();
			$out->addHTML( Html::element(
				'button',
				[
					'class' => 'eg-sp-contribute-create mw-ui-button mw-ui-progressive',
					'disabled' => true
				],
				$actionLabel
			) );
			$out->addWikiMsg( 'externalguidance-specialpage-contribute-create',
				$this->languageNameUtils->getLanguageName( $targetLanguage ) );

		}

		$actionLabel = $this->msg( 'externalguidance-specialpage-contribute-improve-source-action',
			$this->languageNameUtils->getLanguageName( $sourceLanguage ) )->text();
		$out->addHTML( Html::element(
			'button',
			[
				'class' => 'eg-sp-contribute-to-original mw-ui-button mw-ui-progressive mw-ui-quiet',
				'disabled' => true
			],
			$actionLabel
		) );
		$out->addWikiMsg( 'externalguidance-specialpage-contribute-improve-source' );
		$out->addHTML( '</div>' );

		$out->addModules( 'mw.externalguidance.special' );
		$out->addJsConfigVars( [
			'wgExternalGuidanceSourcePage' => $sourcePageTitle->getPrefixedText(),
			'wgExternalGuidanceSourceLanguage' => $sourceLanguage,
			'wgExternalGuidanceTargetLanguage' => $targetLanguage,
			'wgExternalGuidanceService' => $service,
		] );
		if ( $pageExists ) {
			$out->addJsConfigVars(
				'wgExternalGuidanceTargetPage', $targetPageTitle->getPrefixedText()
			);
		}
	}

}
