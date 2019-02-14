<?php

namespace MediaWiki\Extension\ExternalGuidance\Tests;

use MediaWiki\Extension\ExternalGuidance\SpecialExternalGuidance;
use MediaWikiTestCase;
use RequestContext;
use FauxRequest;
use MWException;

/**
 * @covers MediaWiki\Extension\ExternalGuidance\SpecialExternalGuidance
 */
class SpecialExternalGuidanceTest extends MediaWikiTestCase {

	/**
	 * @covers MediaWiki\Extension\ExternalGuidance\SpecialExternalGuidance::mtContextGuidance
	 */
	public function testMTContextGuidanceWithParamMissing() {
		$context = new RequestContext();
		$page = new SpecialExternalGuidance();
		$params = [ 'from' => 'en', 'to' => 'id', 'service' => 'ServiceX' ];
		$request = new FauxRequest( $params );
		$context->setRequest( $request );
		$page->setContext( $context );
		$output = $context->getOutput();
		$this->setExpectedException( MWException::class );
		$page->mtContextGuidance( $request, $output );
	}

	/**
	 * @covers MediaWiki\Extension\ExternalGuidance\SpecialExternalGuidance::mtContextGuidance
	 */
	public function testMTContextGuidanceWithWrongLanguage() {
		$context = new RequestContext();
		$page = new SpecialExternalGuidance();
		$params = [ 'from' => 'xxxxx', 'to' => 'id', 'page' => 'TestPage', 'service' => 'ServiceX' ];
		$request = new FauxRequest( $params );
		$context->setRequest( $request );
		$page->setContext( $context );
		$output = $context->getOutput();
		$this->setExpectedException( MWException::class );
		$page->mtContextGuidance( $request, $output );
	}

}
