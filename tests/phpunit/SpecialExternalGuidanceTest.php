<?php

namespace MediaWiki\Extension\ExternalGuidance\Tests;

use MediaWiki\Extension\ExternalGuidance\SpecialExternalGuidance;
use MediaWikiTestCase;
use RequestContext;
use FauxRequest;
use MWException;
use InvalidArgumentException;

/**
 * @coversDefaultClass \MediaWiki\Extension\ExternalGuidance\SpecialExternalGuidance
 */
class SpecialExternalGuidanceTest extends MediaWikiTestCase {
	/**
	 * @covers ::mtContextGuidance
	 * @param RequestContext $context
	 * @param SpecialExternalGuidance $page
	 * @param array $params
	 * @param string $expected For both cases in provider, just MWExceptions are raised.
	 * @dataProvider provideMTContextGuidanceData
	 */
	public function testMTContextGuidanceWithInvalidData(
		RequestContext $context,
		SpecialExternalGuidance $page,
		array $params,
		$expected
	) {
		$request = new FauxRequest( $params );
		$context->setRequest( $request );
		$page->setContext( $context );
		$output = $context->getOutput();
		$this->expectException( $expected );
		$page->mtContextGuidance( $request, $output );
	}

	public function provideMTContextGuidanceData() {
		$context = new RequestContext();
		$page = new SpecialExternalGuidance();

		return [
			[
				$context, $page,
				// With missing parameter but valid language (en)
				[ 'from' => 'en', 'to' => 'id', 'service' => 'ServiceX' ],
				MWException::class
			],
			[
				$context, $page,
				// With wrong language (xxxxx) but valid parameter (TestPage)
				[ 'from' => 'xxxxx', 'to' => 'id', 'page' => 'TestPage', 'service' => 'ServiceX' ],
				InvalidArgumentException::class
			]
		];
	}

}
