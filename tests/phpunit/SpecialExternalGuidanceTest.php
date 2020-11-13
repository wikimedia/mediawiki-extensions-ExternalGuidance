<?php

namespace MediaWiki\Extension\ExternalGuidance\Tests;

use FauxRequest;
use MediaWiki\Extension\ExternalGuidance\SpecialExternalGuidance;
use MediaWikiTestCase;
use MWException;
use RequestContext;

/**
 * @coversDefaultClass \MediaWiki\Extension\ExternalGuidance\SpecialExternalGuidance
 */
class SpecialExternalGuidanceTest extends MediaWikiTestCase {
	/**
	 * @covers ::mtContextGuidance
	 * @param array $params
	 * @dataProvider provideMTContextGuidanceData
	 */
	public function testMTContextGuidanceWithInvalidData( array $params ) {
		$context = new RequestContext();
		$page = new SpecialExternalGuidance();

		$request = new FauxRequest( $params );
		$context->setRequest( $request );
		$page->setContext( $context );
		$output = $context->getOutput();
		$this->expectException( MWException::class );
		$page->mtContextGuidance( $request, $output );
	}

	public function provideMTContextGuidanceData() {
		return [
			'With missing parameter but valid language (en)' => [
				[ 'from' => 'en', 'to' => 'id', 'service' => 'ServiceX' ]
			],
			'With wrong language (xxxxx) but valid parameter (TestPage)' => [
				[ 'from' => 'xxxxx', 'to' => 'id', 'page' => 'TestPage', 'service' => 'ServiceX' ]
			]
		];
	}

}
