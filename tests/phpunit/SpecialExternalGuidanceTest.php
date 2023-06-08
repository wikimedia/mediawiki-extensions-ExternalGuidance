<?php

namespace MediaWiki\Extension\ExternalGuidance\Tests;

use ErrorPageError;
use MediaWiki\Extension\ExternalGuidance\SpecialExternalGuidance;
use MediaWiki\Request\FauxRequest;
use MediaWikiIntegrationTestCase;
use RequestContext;

/**
 * @coversDefaultClass \MediaWiki\Extension\ExternalGuidance\SpecialExternalGuidance
 */
class SpecialExternalGuidanceTest extends MediaWikiIntegrationTestCase {
	/**
	 * @covers ::mtContextGuidance
	 * @param array $params
	 * @dataProvider provideMTContextGuidanceData
	 */
	public function testMTContextGuidanceWithInvalidData( array $params ) {
		$context = new RequestContext();
		$services = $this->getServiceContainer();
		$page = new SpecialExternalGuidance(
			$services->getLanguageNameUtils()
		);

		$request = new FauxRequest( $params );
		$context->setRequest( $request );
		$page->setContext( $context );
		$output = $context->getOutput();
		$this->expectException( ErrorPageError::class );
		$page->mtContextGuidance( $request, $output );
	}

	public static function provideMTContextGuidanceData() {
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
